package service

import (
	"context"
	"errors"
	"fmt"
	"log"
	"slices"
	"strings"
	"time"

	"laclingo-backend/internal/repository/db"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

// Hàng đợi dựng nội dung cho ngôn ngữ mới: "Học ngôn ngữ mới" chỉ đưa chủ đề cần dựng vào language_sync_jobs rồi cho
// user vào học ngay; worker (StartSyncWorker, chạy trong backend như bộ nhắc học) dựng lần lượt từng chủ đề — AI lỗi /
// quá tải thì chờ rồi thử lại, xong thì thêm chủ đề vào chủ đề yêu thích và báo user qua chuông thông báo.

const (
	maxSyncAttempts   = 8
	syncBackoffBase   = 30 * time.Second
	syncBackoffMax    = 30 * time.Minute
	syncWorkerIdle    = 5 * time.Second // không còn job tới hạn thì nghỉ chừng này rồi quét lại
	syncSystemErrText = "lỗi hệ thống, sẽ thử lại"
	maxOpenSyncJobs   = 40               // chủ đề đang chờ / đang dựng tối đa mỗi user (mọi ngôn ngữ)
	syncWriteTimeout  = 10 * time.Second // ghi trạng thái job kể cả khi đang dừng (deploy) — không để job kẹt "running"
)

// LanguageSyncJob — 1 chủ đề trong hàng đợi dựng nội dung (tiến độ hiển thị cho user)
type LanguageSyncJob struct {
	ID               uuid.UUID `json:"id" swaggertype:"string" format:"uuid"`
	LanguageID       string    `json:"language_id" example:"ja"`
	SourceLanguageID string    `json:"source_language_id" example:"en"`
	Topic            string    `json:"topic" example:"Gia đình & Con người"` // tên ở ngôn ngữ nguồn
	TopicLabel       string    `json:"topic_label"`                          // Topic theo ngôn ngữ giao diện
	Status           string    `json:"status" example:"pending" enums:"pending,running,done,failed"`
	Attempts         int32     `json:"attempts"`
	Error            string    `json:"error,omitempty"`              // lỗi lần gần nhất (job chờ thử lại hoặc đã lỗi hẳn)
	ResultTopic      string    `json:"result_topic,omitempty"`       // tên chủ đề ở ngôn ngữ mới khi xong
	ResultTopicLabel string    `json:"result_topic_label,omitempty"` // ResultTopic theo ngôn ngữ giao diện
	RunAfter         time.Time `json:"run_after"`
	UpdatedAt        time.Time `json:"updated_at"`
}

func toLanguageSyncJob(j db.LanguageSyncJob) LanguageSyncJob {
	return LanguageSyncJob{
		ID: uuid.UUID(j.ID.Bytes), LanguageID: j.LanguageID, SourceLanguageID: j.SourceLanguageID, Topic: j.Topic,
		Status: j.Status, Attempts: j.Attempts, Error: j.LastError.String, ResultTopic: j.ResultTopic.String,
		RunAfter: j.RunAfter.Time, UpdatedAt: j.UpdatedAt.Time,
	}
}

// syncBackoff — chờ trước lần thử thứ attempts+1: 30s, 1m, 2m, 4m… tối đa 30 phút
func syncBackoff(attempts int32) time.Duration {
	d := syncBackoffBase
	for i := int32(1); i < attempts && d < syncBackoffMax; i++ {
		d *= 2
	}
	return min(d, syncBackoffMax)
}

// EnqueueSync đưa các chủ đề nguồn vào hàng đợi dựng cho ngôn ngữ languageID — user phải đang học ngôn ngữ đó (web
// lưu ngôn ngữ trước bằng PUT /users/me/languages/{id}, nên không dựng cho ngôn ngữ user không thêm được). Chỉ nhận chủ
// đề nguồn có từ; mỗi user tối đa maxOpenSyncJobs chủ đề đang chờ.
func (s *LanguageContentService) EnqueueSync(ctx context.Context, userID uuid.UUID, languageID string, req SyncLanguageRequest) ([]LanguageSyncJob, error) {
	languageID = strings.TrimSpace(languageID)
	from := strings.TrimSpace(req.From)
	if languageID == "" || from == "" || languageID == from || languageID == nativeLanguageID {
		return nil, fmt.Errorf("ngôn ngữ nguồn không hợp lệ: %w", ErrInvalidInput)
	}
	topics, err := normalizeTopics(req.Topics)
	if err != nil {
		return nil, err
	}
	if len(topics) == 0 {
		return nil, fmt.Errorf("chưa chọn chủ đề nào: %w", ErrInvalidInput)
	}
	if _, err := s.language(ctx, from); err != nil {
		return nil, err
	}
	uid := toPgUUID(userID)
	learning, err := s.repo.ListUserTargetLanguages(ctx, uid)
	if err != nil {
		return nil, err
	}
	if !slices.ContainsFunc(learning, func(l db.ListUserTargetLanguagesRow) bool { return l.LanguageID == languageID }) {
		return nil, fmt.Errorf("hãy thêm ngôn ngữ %q vào danh sách đang học trước: %w", languageID, ErrInvalidInput)
	}
	// Chủ đề nguồn không có từ nào thì không có gì để dựng — bỏ qua (chặn đẩy chuỗi tuỳ ý vào hàng đợi)
	withWords := topics[:0]
	for _, topic := range topics {
		n, err := s.repo.CountTopicWords(ctx, db.CountTopicWordsParams{LanguageID: from, Topic: pgtype.Text{String: topic, Valid: true}})
		if err != nil {
			return nil, err
		}
		if n > 0 {
			withWords = append(withWords, topic)
		}
	}
	if len(withWords) == 0 {
		return nil, fmt.Errorf("các chủ đề đã chọn chưa có từ nào ở ngôn ngữ nguồn: %w", ErrInvalidInput)
	}
	open, err := s.repo.CountUserOpenLanguageSyncJobs(ctx, uid)
	if err != nil {
		return nil, err
	}
	if int(open)+len(withWords) > maxOpenSyncJobs {
		return nil, fmt.Errorf("đang chuẩn bị %d chủ đề — chờ xong bớt rồi thêm tiếp (tối đa %d): %w", open, maxOpenSyncJobs, ErrInvalidInput)
	}
	for _, topic := range withWords {
		err := s.repo.EnqueueLanguageSyncJob(ctx, db.EnqueueLanguageSyncJobParams{UserID: uid, LanguageID: languageID, SourceLanguageID: from, Topic: topic})
		if err != nil {
			return nil, err
		}
	}
	s.wakeWorker()
	return s.SyncJobs(ctx, userID, languageID)
}

// SyncJobs — tiến độ dựng của user: job đang chờ / đang chạy + job xong / lỗi trong 24 giờ qua ("" = mọi ngôn ngữ)
func (s *LanguageContentService) SyncJobs(ctx context.Context, userID uuid.UUID, languageID string) ([]LanguageSyncJob, error) {
	rows, err := s.repo.ListUserLanguageSyncJobs(ctx, db.ListUserLanguageSyncJobsParams{
		UserID: toPgUUID(userID), LanguageID: pgtype.Text{String: languageID, Valid: languageID != ""},
	})
	if err != nil {
		return nil, err
	}
	jobs := make([]LanguageSyncJob, 0, len(rows))
	for _, r := range rows {
		jobs = append(jobs, toLanguageSyncJob(r))
	}
	fields := make([]TranslatableField, 0, 2*len(jobs))
	for i := range jobs {
		j := &jobs[i]
		fields = append(fields, topicLabelField(j.Topic, &j.TopicLabel), topicLabelField(j.ResultTopic, &j.ResultTopicLabel))
	}
	s.tr.Apply(ctx, fields)
	return jobs, nil
}

// RetrySync — chạy lại các chủ đề đã lỗi hẳn của 1 ngôn ngữ
func (s *LanguageContentService) RetrySync(ctx context.Context, userID uuid.UUID, languageID string) ([]LanguageSyncJob, error) {
	if _, err := s.repo.RetryFailedLanguageSyncJobs(ctx, db.RetryFailedLanguageSyncJobsParams{UserID: toPgUUID(userID), LanguageID: languageID}); err != nil {
		return nil, err
	}
	s.wakeWorker()
	return s.SyncJobs(ctx, userID, languageID)
}

func (s *LanguageContentService) wakeWorker() {
	select {
	case s.wake <- struct{}{}:
	default: // worker đã có tín hiệu chờ xử lý
	}
}

// StartSyncWorker chạy tới khi ctx huỷ: xử lý hết job tới hạn, rồi nghỉ tới lần quét sau / khi có job mới. Nhiều
// instance cùng chạy không lấy trùng job (ClaimLanguageSyncJob dùng SKIP LOCKED).
func (s *LanguageContentService) StartSyncWorker(ctx context.Context) {
	ticker := time.NewTicker(syncWorkerIdle)
	defer ticker.Stop()
	for {
		for s.runNextSyncJob(ctx) {
		}
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
		case <-s.wake:
		}
	}
}

// runNextSyncJob — xử lý 1 job tới hạn; false = không còn job (hoặc lỗi lấy job / đang dừng)
func (s *LanguageContentService) runNextSyncJob(ctx context.Context) bool {
	if ctx.Err() != nil {
		return false
	}
	job, err := s.repo.ClaimLanguageSyncJob(ctx)
	if errors.Is(err, pgx.ErrNoRows) {
		return false
	}
	if err != nil {
		if ctx.Err() == nil {
			log.Printf("❌ language sync: lấy job: %v", err)
		}
		return false
	}
	s.processSyncJob(ctx, job)
	return true
}

func (s *LanguageContentService) processSyncJob(ctx context.Context, job db.LanguageSyncJob) {
	var name string
	var err error
	if job.Attempts > maxSyncAttempts {
		// job "running" bị lấy lại nhiều lần (instance chết giữa chừng) → dừng, không chạy lại mãi
		err = fmt.Errorf("đã thử %d lần chưa xong: %w", job.Attempts-1, ErrLanguageContentAIFailed)
	} else {
		name, err = s.buildSyncJob(ctx, job)
	}
	// Ghi trạng thái bằng ctx không bị huỷ: đang dừng (deploy) giữa lúc gọi AI thì job vẫn được hẹn lại, không kẹt "running"
	ctx, cancel := context.WithTimeout(context.WithoutCancel(ctx), syncWriteTimeout)
	defer cancel()
	switch {
	case err == nil:
		err = s.repo.CompleteLanguageSyncJob(ctx, db.CompleteLanguageSyncJobParams{ID: job.ID, ResultTopic: optionalPgText(name)})
		if err == nil && name != "" {
			err = s.repo.AddUserPreferredTopic(ctx, db.AddUserPreferredTopicParams{UserID: job.UserID, LanguageID: job.LanguageID, Topic: name})
		}
	case errors.Is(err, ErrInvalidInput) || job.Attempts >= maxSyncAttempts:
		log.Printf("⚠️  language sync: bỏ job %s (%s ← %s, %q) sau %d lần: %v", uuid.UUID(job.ID.Bytes), job.LanguageID, job.SourceLanguageID, job.Topic, job.Attempts, err)
		err = s.repo.FailLanguageSyncJob(ctx, db.FailLanguageSyncJobParams{ID: job.ID, LastError: pgtype.Text{String: syncErrorText(err), Valid: true}})
	default:
		runAfter := time.Now().Add(syncBackoff(job.Attempts))
		err = s.repo.RescheduleLanguageSyncJob(ctx, db.RescheduleLanguageSyncJobParams{
			ID: job.ID, LastError: pgtype.Text{String: syncErrorText(err), Valid: true}, RunAfter: pgtype.Timestamptz{Time: runAfter, Valid: true},
		})
		if err != nil {
			log.Printf("❌ language sync: hẹn lại job %s: %v", uuid.UUID(job.ID.Bytes), err)
		}
		return // còn thử lại → chưa báo user
	}
	if err != nil {
		log.Printf("❌ language sync: cập nhật job %s: %v", uuid.UUID(job.ID.Bytes), err)
		return
	}
	s.notifyIfFinished(ctx, job)
}

// buildSyncJob dựng 1 chủ đề (xem prepareTopic); trả tên chủ đề ở ngôn ngữ mới ("" = không dựng được từ nào)
func (s *LanguageContentService) buildSyncJob(ctx context.Context, job db.LanguageSyncJob) (string, error) {
	target, err := s.language(ctx, job.LanguageID)
	if err != nil {
		return "", err
	}
	source, err := s.language(ctx, job.SourceLanguageID)
	if err != nil {
		return "", err
	}
	existing, err := s.repo.ListLanguageTopicKeys(ctx, target.ID)
	if err != nil {
		return "", err
	}
	targetByKey := make(map[string]string, len(existing))
	for _, t := range existing {
		if t.TopicKey.Valid {
			targetByKey[t.TopicKey.String] = t.Name
		}
	}
	return s.prepareTopic(ctx, uuid.UUID(job.UserID.Bytes), source, target, job.Topic, targetByKey)
}

// syncErrorText — lỗi hiện cho user: lỗi AI / đầu vào có câu dễ hiểu, lỗi khác (DB...) chỉ ghi log
func syncErrorText(err error) string {
	if errors.Is(err, ErrLanguageContentAIFailed) || errors.Is(err, ErrAINotConfigured) || errors.Is(err, ErrInvalidInput) {
		return err.Error()
	}
	log.Printf("❌ language sync: %v", err)
	return syncSystemErrText
}

// notifyIfFinished — hàng đợi của user cho ngôn ngữ này vừa hết job chờ: báo kết quả vào chuông thông báo
func (s *LanguageContentService) notifyIfFinished(ctx context.Context, job db.LanguageSyncJob) {
	if s.notifier == nil {
		return
	}
	open, err := s.repo.CountOpenLanguageSyncJobs(ctx, db.CountOpenLanguageSyncJobsParams{UserID: job.UserID, LanguageID: job.LanguageID})
	if err != nil || open > 0 {
		return
	}
	rows, err := s.repo.ListUserLanguageSyncJobs(ctx, db.ListUserLanguageSyncJobsParams{UserID: job.UserID, LanguageID: pgtype.Text{String: job.LanguageID, Valid: true}})
	if err != nil {
		return
	}
	done, failed := 0, 0
	for _, r := range rows {
		switch {
		case r.Status == "failed":
			failed++
		case r.Status == "done" && r.ResultTopic.Valid:
			done++
		}
	}
	name := job.LanguageID
	if l, err := s.repo.GetLanguageByID(ctx, job.LanguageID); err == nil {
		name = l.Name
	}
	title, body := "Nội dung "+name+" đã sẵn sàng", fmt.Sprintf("Đã chuẩn bị xong %d chủ đề — vào học thôi!", done)
	if failed > 0 {
		body = fmt.Sprintf("Đã chuẩn bị %d chủ đề, %d chủ đề chưa dựng được — mở để thử lại.", done, failed)
	}
	if done == 0 {
		title = "Chưa chuẩn bị được nội dung " + name
	}
	s.notifier.Notify(ctx, uuid.UUID(job.UserID.Bytes), NotificationInput{
		// Mỗi ngôn ngữ 1 loại: thông báo ngôn ngữ này không xoá thông báo chưa đọc của ngôn ngữ khác
		Type: "language_sync:" + job.LanguageID, Title: title, Body: body,
		URL: "/learn/" + job.LanguageID, Icon: "🌏", ReplaceUnread: true,
	})
}
