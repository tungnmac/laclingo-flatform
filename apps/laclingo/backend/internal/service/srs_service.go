package service

import (
	"context"
	"errors"
	"log"
	"math/rand"
	"strings"
	"time"

	"laclingo-backend/internal/domain"
	"laclingo-backend/internal/repository/db"
	"laclingo-backend/internal/srs"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

const (
	defaultEaseFactor   = 2.5
	defaultDueLimit     = 20
	maxDueLimit         = 100
	defaultNewBatchSize = 10
)

// SRSRepository định nghĩa Interface tiếp xúc với cơ sở dữ liệu
type SRSRepository interface {
	GetDueVocabulariesForUser(ctx context.Context, arg db.GetDueVocabulariesForUserParams) ([]db.GetDueVocabulariesForUserRow, error)
	GetVocabularyReview(ctx context.Context, arg db.GetVocabularyReviewParams) (db.UserVocabularyReview, error)
	UpsertVocabularyReview(ctx context.Context, arg db.UpsertVocabularyReviewParams) (db.UserVocabularyReview, error)
	ListNewVocabulariesForUser(ctx context.Context, arg db.ListNewVocabulariesForUserParams) ([]db.Vocabulary, error)
	CreateVocabularyReviewIfAbsent(ctx context.Context, arg db.CreateVocabularyReviewIfAbsentParams) (int64, error)
	ListMeaningDistractorsForVocabularies(ctx context.Context, vocabularyIds []pgtype.UUID) ([]db.ListMeaningDistractorsForVocabulariesRow, error)
	PracticeVocabularyReview(ctx context.Context, arg db.PracticeVocabularyReviewParams) (db.UserVocabularyReview, error)
	GetDeckVocabulariesForPractice(ctx context.Context, arg db.GetDeckVocabulariesForPracticeParams) ([]db.GetDeckVocabulariesForPracticeRow, error)
	IncrementVocabularyPracticeOnly(ctx context.Context, arg db.IncrementVocabularyPracticeOnlyParams) (db.UserVocabularyReview, error)
	GetDeckForUser(ctx context.Context, arg db.GetDeckForUserParams) (db.UserDeck, error)
	ListReviewVocabulariesForUser(ctx context.Context, arg db.ListReviewVocabulariesForUserParams) ([]db.ListReviewVocabulariesForUserRow, error)
}

// NewVocabulary là một từ user chưa học, hiển thị ở flow "Học từ mới"
type NewVocabulary struct {
	VocabularyID uuid.UUID `json:"vocabulary_id" swaggertype:"string" format:"uuid"`
	LanguageID   string    `json:"language_id" example:"en"`
	Term         string    `json:"term" example:"apple"`
	Phonetic     string    `json:"phonetic"`
	Meaning      string    `json:"meaning"`
	Example      string    `json:"example"`
	PartOfSpeech string    `json:"part_of_speech" example:"noun"`
	Topic        string    `json:"topic" example:"Đồ ăn & Thức uống"`
	TopicLabel   string    `json:"topic_label" example:"Food & Drinks"` // tên chủ đề theo ngôn ngữ giao diện
	Level        string    `json:"level" example:"A1"`
	AudioURL     string    `json:"audio_url"`
}

// DueVocabulary là một từ vựng đến hạn ôn tập
type DueVocabulary struct {
	VocabularyID uuid.UUID `json:"vocabulary_id" swaggertype:"string" format:"uuid"`
	LanguageID   string    `json:"language_id" example:"en"`
	Term         string    `json:"term" example:"apple"`
	Phonetic     string    `json:"phonetic"`
	Meaning      string    `json:"meaning"`
	PartOfSpeech string    `json:"part_of_speech" example:"noun"`
	AudioURL     string    `json:"audio_url"`
	SRSStage     int32     `json:"srs_stage"`
	NextReviewAt time.Time `json:"next_review_at"`
	// Dữ liệu cho bài luyện tập khi ôn (chọn nghĩa / ghép câu / ghép nghĩa câu / nghe-viết)
	Example        string   `json:"example"`
	ExampleMeaning string   `json:"example_meaning"`
	ImageEmoji     string   `json:"image_emoji"`
	ImageURL       string   `json:"image_url"`
	PracticeCount  int32    `json:"practice_count"`
	Choices        []string `json:"choices"` // nghĩa đúng + tối đa 3 nghĩa nhiễu, đã xáo trộn
}

type SRSService struct {
	repo     SRSRepository
	missions *MissionService
	quota    QuotaProvider      // lượt ôn/ngày theo gói (Free giới hạn, Pro không)
	tr       *ContentTranslator // dịch nghĩa / tên chủ đề theo ngôn ngữ giao diện
	now      func() time.Time
}

func NewSRSService(repo SRSRepository, missions *MissionService, quota QuotaProvider, tr *ContentTranslator) *SRSService {
	return &SRSService{
		repo:     repo,
		missions: missions,
		quota:    quota,
		tr:       tr,
		now:      time.Now,
	}
}

// withReviewQuota trừ 1 lượt ôn của gói trước khi chấm (hết lượt → *LimitError), chấm lỗi thì hoàn lại lượt
func withReviewQuota[T any](ctx context.Context, s *SRSService, userID uuid.UUID, run func() (T, error)) (T, error) {
	refund, err := s.quota.Reserve(ctx, userID, FeatureSRSReview)
	if err != nil {
		var zero T
		return zero, err
	}
	out, err := run()
	if err != nil {
		refund()
	}
	return out, err
}

// recordMissionAction ghi nhận hành động cho hệ thống nhiệm vụ — lỗi ở đây
// (ví dụ DB tạm trục trặc) KHÔNG được làm fail hành động chính (ôn tập/học từ
// mới), chỉ log lại để điều tra sau.
func (s *SRSService) recordMissionAction(ctx context.Context, userID uuid.UUID, actionType string) {
	if err := s.missions.RecordAction(ctx, userID, actionType, 1); err != nil {
		log.Printf("❌ mission: RecordAction user=%s action=%s: %v", userID, actionType, err)
	}
}

// GetDueVocabularies trả về từ đến hạn ôn tập. languageID rỗng thì lấy ở MỌI
// ngôn ngữ user đang học (hành vi mặc định) — truyền vào để chỉ ôn riêng 1 ngôn ngữ.
func (s *SRSService) GetDueVocabularies(ctx context.Context, userID uuid.UUID, limit int32, languageID string) ([]DueVocabulary, error) {
	if limit <= 0 {
		limit = defaultDueLimit
	}
	if limit > maxDueLimit {
		limit = maxDueLimit
	}

	var languageFilter pgtype.Text
	if languageID != "" {
		languageFilter = pgtype.Text{String: languageID, Valid: true}
	}

	rows, err := s.repo.GetDueVocabulariesForUser(ctx, db.GetDueVocabulariesForUserParams{
		UserID:     toPgUUID(userID),
		LanguageID: languageFilter,
		Limit:      limit,
	})
	if err != nil {
		return nil, err
	}
	return s.toDueVocabularies(ctx, rows)
}

// GetDeckVocabularies trả về MỌI từ trong 1 danh sách ôn tập của user (không
// chỉ từ đến hạn — "học lại list"), từ sắp đến hạn trước, kèm đáp án chọn nghĩa.
func (s *SRSService) GetDeckVocabularies(ctx context.Context, userID, deckID uuid.UUID, limit int32) ([]DueVocabulary, error) {
	if limit <= 0 || limit > maxDueLimit {
		limit = maxDueLimit
	}
	// List không tồn tại / của user khác → 404, không trả [] như list rỗng
	if _, err := s.repo.GetDeckForUser(ctx, db.GetDeckForUserParams{ID: toPgUUID(deckID), UserID: toPgUUID(userID)}); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	rows, err := s.repo.GetDeckVocabulariesForPractice(ctx, db.GetDeckVocabulariesForPracticeParams{
		DeckID: toPgUUID(deckID),
		UserID: toPgUUID(userID),
		Limit:  limit,
	})
	if err != nil {
		return nil, err
	}
	// 2 query cố ý chọn cùng danh sách cột nên 2 kiểu Row convert được cho nhau
	due := make([]db.GetDueVocabulariesForUserRow, 0, len(rows))
	for _, r := range rows {
		due = append(due, db.GetDueVocabulariesForUserRow(r))
	}
	return s.toDueVocabularies(ctx, due)
}

func (s *SRSService) toDueVocabularies(ctx context.Context, rows []db.GetDueVocabulariesForUserRow) ([]DueVocabulary, error) {
	results := make([]DueVocabulary, 0, len(rows))
	for _, r := range rows {
		results = append(results, DueVocabulary{
			VocabularyID:   uuid.UUID(r.VocabularyID.Bytes),
			LanguageID:     r.LanguageID,
			Term:           r.Term,
			Phonetic:       r.Phonetic.String,
			Meaning:        r.Meaning,
			PartOfSpeech:   r.PartOfSpeech.String,
			AudioURL:       r.AudioUrl.String,
			SRSStage:       r.SrsStage.Int32,
			NextReviewAt:   r.NextReviewAt.Time,
			Example:        r.Example.String,
			ExampleMeaning: r.ExampleMeaning.String,
			ImageEmoji:     r.ImageEmoji.String,
			ImageURL:       r.ImageUrl.String,
			PracticeCount:  r.PracticeCount,
		})
	}

	if err := s.attachMeaningChoices(ctx, rows, results); err != nil {
		return nil, err
	}
	return results, nil
}

// attachMeaningChoices gắn cho mỗi từ: nghĩa đúng + tối đa 3 nghĩa nhiễu (1 query cho cả danh sách), xáo trộn. Dịch
// nghĩa / nghĩa câu ví dụ của từ và nghĩa nhiễu trong CÙNG 1 lần (đáp án đúng trong choices phải trùng khớp Meaning).
func (s *SRSService) attachMeaningChoices(ctx context.Context, rows []db.GetDueVocabulariesForUserRow, results []DueVocabulary) error {
	if len(rows) == 0 {
		return nil
	}
	ids := make([]pgtype.UUID, 0, len(rows))
	for _, r := range rows {
		ids = append(ids, r.VocabularyID)
	}
	distractors, err := s.repo.ListMeaningDistractorsForVocabularies(ctx, ids)
	if err != nil {
		return err
	}
	s.translateChoices(ctx, results, distractors)

	byVocab := make(map[uuid.UUID][]string, len(rows))
	for _, d := range distractors {
		id := uuid.UUID(d.VocabularyID.Bytes)
		byVocab[id] = append(byVocab[id], d.Meaning)
	}
	for i := range results {
		choices := []string{results[i].Meaning}
		seen := map[string]bool{normalizeChoice(results[i].Meaning): true}
		for _, m := range byVocab[results[i].VocabularyID] {
			// 2 nghĩa tiếng Việt khác nhau có thể dịch ra cùng 1 chữ — bỏ để không có 2 đáp án giống hệt nhau
			if key := normalizeChoice(m); !seen[key] {
				seen[key] = true
				choices = append(choices, m)
			}
		}
		rand.Shuffle(len(choices), func(a, b int) { choices[a], choices[b] = choices[b], choices[a] })
		results[i].Choices = choices
	}
	return nil
}

// translateChoices dịch nghĩa (+ nghĩa câu ví dụ) của các từ và nghĩa nhiễu trong 1 query. Đáp án của 1 từ chỉ dùng bản
// dịch khi nghĩa đúng lẫn MỌI nghĩa nhiễu đều đã dịch — lẫn 1 đáp án khác ngôn ngữ thì lộ đáp án đúng; khi đó cả bài giữ
// tiếng Việt tới khi worker dịch xong.
func (s *SRSService) translateChoices(ctx context.Context, results []DueVocabulary, distractors []db.ListMeaningDistractorsForVocabulariesRow) {
	if ContentLocale(ctx) == "" {
		return
	}
	meanings := make([]string, len(results))
	byVocab := make(map[uuid.UUID][]int, len(results))
	fields := make([]TranslatableField, 0, 2*len(results)+len(distractors))
	for i := range results {
		meanings[i] = results[i].Meaning
		fields = append(fields, vocabularyFields(results[i].VocabularyID, &results[i].Meaning, &results[i].ExampleMeaning)...)
	}
	originals := make([]string, len(distractors))
	for i := range distractors {
		d := &distractors[i]
		originals[i] = d.Meaning
		id := uuid.UUID(d.VocabularyID.Bytes)
		byVocab[id] = append(byVocab[id], i)
		fields = append(fields, vocabularyFields(uuid.UUID(d.DistractorID.Bytes), &d.Meaning, nil)...)
	}
	s.tr.Apply(ctx, fields)
	for i := range results {
		translated := results[i].Meaning != meanings[i]
		mixed := false
		for _, j := range byVocab[results[i].VocabularyID] {
			mixed = mixed || (distractors[j].Meaning != originals[j]) != translated
		}
		if mixed {
			results[i].Meaning = meanings[i]
			for _, j := range byVocab[results[i].VocabularyID] {
				distractors[j].Meaning = originals[j]
			}
		}
	}
}

// normalizeChoice — so trùng đáp án bỏ qua hoa thường / khoảng trắng 2 đầu (như query nghĩa nhiễu)
func normalizeChoice(s string) string {
	return strings.ToLower(strings.TrimSpace(s))
}

// qualityFromMistakes quy số lần sai trong bộ bài luyện tập về thang SM-2:
// không sai = nhớ hoàn hảo (5), sai từ 3 lần trở lên = nhớ sai (2, reset interval).
func qualityFromMistakes(mistakes int32) int32 {
	switch {
	case mistakes <= 0:
		return 5
	case mistakes == 1:
		return 4
	case mistakes == 2:
		return 3
	default:
		return 2
	}
}

// PracticeVocabulary ghi nhận user đã làm xong trọn bộ bài luyện tập của 1 từ
// đang ôn: chấm SM-2 tự động theo số lần sai và +1 practice_count (cùng 1 câu
// lệnh). Từ chưa có trong hàng đợi ôn tập → ErrNotFound.
func (s *SRSService) PracticeVocabulary(ctx context.Context, userID uuid.UUID, req domain.VocabularyPracticeRequest) (domain.VocabularyPracticeResponse, error) {
	if userID == uuid.Nil || req.VocabularyID == uuid.Nil || req.Mistakes < 0 {
		return domain.VocabularyPracticeResponse{}, ErrInvalidInput
	}
	at, err := s.reviewTime(req.ReviewedAt)
	if err != nil {
		return domain.VocabularyPracticeResponse{}, err
	}
	current, err := s.getReview(ctx, userID, req.VocabularyID)
	if err != nil {
		return domain.VocabularyPracticeResponse{}, err
	}
	if current == nil {
		return domain.VocabularyPracticeResponse{}, ErrNotFound
	}
	quality := qualityFromMistakes(req.Mistakes)
	clientReviewID := toPgUUIDPtr(req.ClientReviewID)
	// Gửi lại kết quả đã lưu (đồng bộ offline bị ngắt giữa chừng) → trả tiến độ hiện tại, không trừ lượt / chấm lại
	if alreadyApplied(current, at, clientReviewID) {
		return toPracticeResponse(*current, quality), nil
	}
	resp, err := withReviewQuota(ctx, s, userID, func() (domain.VocabularyPracticeResponse, error) {
		return s.practiceVocabulary(ctx, userID, *current, quality, at, clientReviewID)
	})
	if errors.Is(err, errReviewSuperseded) {
		latest, err := s.getReview(ctx, userID, req.VocabularyID)
		if err != nil {
			return domain.VocabularyPracticeResponse{}, err
		}
		if latest == nil {
			return domain.VocabularyPracticeResponse{}, ErrNotFound
		}
		return toPracticeResponse(*latest, quality), nil
	}
	return resp, err
}

func (s *SRSService) practiceVocabulary(ctx context.Context, userID uuid.UUID, current db.UserVocabularyReview, quality int32, at time.Time, clientReviewID pgtype.UUID) (domain.VocabularyPracticeResponse, error) {
	// Từ CHƯA đến hạn (vd "học lại list"): chỉ +1 lần luyện, giữ nguyên lịch
	// SM-2 và không tính nhiệm vụ — luyện sớm/lặp lại không được đẩy interval
	// lên hay cày tiến độ nhiệm vụ.
	if current.NextReviewAt.Time.After(at) {
		saved, err := s.repo.IncrementVocabularyPracticeOnly(ctx, db.IncrementVocabularyPracticeOnlyParams{
			UserID:             current.UserID,
			VocabularyID:       current.VocabularyID,
			LastClientReviewID: clientReviewID,
		})
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.VocabularyPracticeResponse{}, errReviewSuperseded
		}
		if err != nil {
			return domain.VocabularyPracticeResponse{}, err
		}
		s.missions.MarkStudied(ctx, userID) // vẫn là 1 lần học — nhắc học không được coi là bỏ học
		return toPracticeResponse(saved, quality), nil
	}

	out := s.nextSM2(&current, quality, at)
	saved, err := s.repo.PracticeVocabularyReview(ctx, db.PracticeVocabularyReviewParams{
		UserID:             current.UserID,
		VocabularyID:       current.VocabularyID,
		SrsStage:           pgtype.Int4{Int32: out.NewSRSStage, Valid: true},
		EaseFactor:         pgtype.Float8{Float64: out.NewEaseFactor, Valid: true},
		IntervalDays:       pgtype.Int4{Int32: out.NewIntervalDays, Valid: true},
		NextReviewAt:       pgtype.Timestamptz{Time: out.NextReviewAt, Valid: true},
		LastReviewedAt:     pgtype.Timestamptz{Time: at, Valid: true},
		LastClientReviewID: clientReviewID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return domain.VocabularyPracticeResponse{}, errReviewSuperseded
	}
	if err != nil {
		return domain.VocabularyPracticeResponse{}, err
	}

	s.recordMissionAction(ctx, userID, "srs_review")

	return toPracticeResponse(saved, quality), nil
}

func toReviewResponse(saved db.UserVocabularyReview) domain.VocabularyReviewResponse {
	return domain.VocabularyReviewResponse{
		VocabularyID: uuid.UUID(saved.VocabularyID.Bytes),
		NewStage:     saved.SrsStage.Int32,
		IntervalDays: saved.IntervalDays.Int32,
		NextReviewAt: saved.NextReviewAt.Time,
	}
}

func toPracticeResponse(saved db.UserVocabularyReview, quality int32) domain.VocabularyPracticeResponse {
	return domain.VocabularyPracticeResponse{
		VocabularyReviewResponse: toReviewResponse(saved),
		Quality:                  quality,
		PracticeCount:            saved.PracticeCount,
	}
}

// maxOfflineReviewAge — kết quả ôn offline cũ hơn mức này thì từ chối (lịch SM-2 tính từ lúc đó không còn ý nghĩa)
const maxOfflineReviewAge = 30 * 24 * time.Hour

// errReviewSuperseded — câu lệnh ghi không cập nhật dòng nào vì đã lưu chính lần ôn này hoặc 1 lần ôn mới hơn
// (2 request trùng chạy song song, hoặc máy khác vừa ôn) — nơi gọi trả tiến độ mới nhất
var errReviewSuperseded = errors.New("srs: review superseded")

// reviewTime trả về lúc ôn thật: kết quả ôn offline gửi bù kèm reviewed_at; bỏ trống hoặc ở tương lai (đồng hồ máy
// lệch) = bây giờ
func (s *SRSService) reviewTime(reviewedAt *time.Time) (time.Time, error) {
	now := s.now()
	if reviewedAt == nil || reviewedAt.After(now) {
		return now, nil
	}
	if now.Sub(*reviewedAt) > maxOfflineReviewAge {
		return time.Time{}, ErrInvalidInput
	}
	return *reviewedAt, nil
}

// getReview trả về tiến độ ôn hiện tại của 1 từ, chưa có thì nil
func (s *SRSService) getReview(ctx context.Context, userID, vocabularyID uuid.UUID) (*db.UserVocabularyReview, error) {
	current, err := s.repo.GetVocabularyReview(ctx, db.GetVocabularyReviewParams{
		UserID:       toPgUUID(userID),
		VocabularyID: toPgUUID(vocabularyID),
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &current, nil
}

// alreadyApplied: đã lưu chính lần ôn này (gửi lại cùng client_review_id) hoặc 1 lần ôn mới hơn `at` → không chấm lại
func alreadyApplied(current *db.UserVocabularyReview, at time.Time, clientReviewID pgtype.UUID) bool {
	if current == nil {
		return false
	}
	if clientReviewID.Valid && current.LastClientReviewID == clientReviewID {
		return true
	}
	return current.LastReviewedAt.Valid && !at.After(current.LastReviewedAt.Time)
}

// toPgUUIDPtr — uuid tuỳ chọn trong body (nil = NULL)
func toPgUUIDPtr(id *uuid.UUID) pgtype.UUID {
	if id == nil || *id == uuid.Nil {
		return pgtype.UUID{}
	}
	return toPgUUID(*id)
}

// nextSM2 tính lịch ôn tiếp theo theo SM-2 từ tiến độ hiện tại (nil = lần ôn đầu, dùng mặc định), tính từ lúc ôn `at`
func (s *SRSService) nextSM2(current *db.UserVocabularyReview, quality int32, at time.Time) srs.SRSOutput {
	input := srs.SRSInput{
		EaseFactor: defaultEaseFactor,
		Quality:    srs.ReviewQuality(quality),
	}
	if current != nil {
		input.SRSStage = current.SrsStage.Int32
		input.IntervalDays = current.IntervalDays.Int32
		if current.EaseFactor.Valid {
			input.EaseFactor = current.EaseFactor.Float64
		}
	}
	return srs.CalculateSM2(input, at)
}

// ReviewVocabulary chấm điểm một lần ôn tập theo SM-2 và lưu kết quả
func (s *SRSService) ReviewVocabulary(ctx context.Context, userID uuid.UUID, req domain.VocabularyReviewRequest) (domain.VocabularyReviewResponse, error) {
	if userID == uuid.Nil || req.VocabularyID == uuid.Nil || req.Quality < 0 || req.Quality > 5 {
		return domain.VocabularyReviewResponse{}, ErrInvalidInput
	}
	at, err := s.reviewTime(req.ReviewedAt)
	if err != nil {
		return domain.VocabularyReviewResponse{}, err
	}
	current, err := s.getReview(ctx, userID, req.VocabularyID)
	if err != nil {
		return domain.VocabularyReviewResponse{}, err
	}
	clientReviewID := toPgUUIDPtr(req.ClientReviewID)
	// Gửi lại kết quả đã lưu → trả tiến độ hiện tại, không trừ lượt / chấm lại (như PracticeVocabulary)
	if alreadyApplied(current, at, clientReviewID) {
		return toReviewResponse(*current), nil
	}
	resp, err := withReviewQuota(ctx, s, userID, func() (domain.VocabularyReviewResponse, error) {
		return s.reviewVocabulary(ctx, userID, req, current, at, clientReviewID)
	})
	if errors.Is(err, errReviewSuperseded) {
		latest, err := s.getReview(ctx, userID, req.VocabularyID)
		if err != nil {
			return domain.VocabularyReviewResponse{}, err
		}
		if latest == nil {
			return domain.VocabularyReviewResponse{}, ErrNotFound
		}
		return toReviewResponse(*latest), nil
	}
	return resp, err
}

func (s *SRSService) reviewVocabulary(ctx context.Context, userID uuid.UUID, req domain.VocabularyReviewRequest, current *db.UserVocabularyReview, at time.Time, clientReviewID pgtype.UUID) (domain.VocabularyReviewResponse, error) {
	out := s.nextSM2(current, req.Quality, at)

	saved, err := s.repo.UpsertVocabularyReview(ctx, db.UpsertVocabularyReviewParams{
		UserID:             toPgUUID(userID),
		VocabularyID:       toPgUUID(req.VocabularyID),
		SrsStage:           pgtype.Int4{Int32: out.NewSRSStage, Valid: true},
		EaseFactor:         pgtype.Float8{Float64: out.NewEaseFactor, Valid: true},
		IntervalDays:       pgtype.Int4{Int32: out.NewIntervalDays, Valid: true},
		NextReviewAt:       pgtype.Timestamptz{Time: out.NextReviewAt, Valid: true},
		LastReviewedAt:     pgtype.Timestamptz{Time: at, Valid: true},
		LastClientReviewID: clientReviewID,
	})
	if isPgError(err, pgForeignKeyViolation) {
		// vocabulary_id (hoặc user) không tồn tại
		return domain.VocabularyReviewResponse{}, ErrNotFound
	}
	if errors.Is(err, pgx.ErrNoRows) {
		// ON CONFLICT ... WHERE không cập nhật: đã lưu lần ôn này / lần ôn mới hơn
		return domain.VocabularyReviewResponse{}, errReviewSuperseded
	}
	if err != nil {
		return domain.VocabularyReviewResponse{}, err
	}

	s.recordMissionAction(ctx, userID, "srs_review")

	return toReviewResponse(saved), nil
}

// GetNewVocabularies trả về các từ user chưa học (chưa có review row) để học mới
func (s *SRSService) GetNewVocabularies(ctx context.Context, userID uuid.UUID, languageID string, limit int32) ([]NewVocabulary, error) {
	if limit <= 0 {
		limit = defaultNewBatchSize
	}
	if limit > maxDueLimit {
		limit = maxDueLimit
	}

	rows, err := s.repo.ListNewVocabulariesForUser(ctx, db.ListNewVocabulariesForUserParams{
		LanguageID: languageID,
		UserID:     toPgUUID(userID),
		Limit:      limit,
	})
	if err != nil {
		return nil, err
	}

	results := make([]NewVocabulary, 0, len(rows))
	for _, v := range rows {
		results = append(results, NewVocabulary{
			VocabularyID: uuid.UUID(v.ID.Bytes),
			LanguageID:   v.LanguageID,
			Term:         v.Term,
			Phonetic:     v.Phonetic.String,
			Meaning:      v.Meaning,
			Example:      v.Example.String,
			PartOfSpeech: v.PartOfSpeech.String,
			Topic:        v.Topic.String,
			Level:        v.Level.String,
			AudioURL:     v.AudioUrl.String,
		})
	}
	fields := make([]TranslatableField, 0, 2*len(results))
	for i := range results {
		r := &results[i]
		fields = append(fields, vocabularyFields(r.VocabularyID, &r.Meaning, nil)...)
		fields = append(fields, topicLabelField(r.Topic, &r.TopicLabel))
	}
	s.tr.Apply(ctx, fields)
	return results, nil
}

// LearnVocabulary đánh dấu "đã học" một từ mới: tạo review row stage 0, đến hạn
// ôn ngay. Đã học rồi thì giữ nguyên tiến độ (idempotent).
func (s *SRSService) LearnVocabulary(ctx context.Context, userID uuid.UUID, vocabularyID uuid.UUID) error {
	if userID == uuid.Nil || vocabularyID == uuid.Nil {
		return ErrInvalidInput
	}

	inserted, err := s.repo.CreateVocabularyReviewIfAbsent(ctx, db.CreateVocabularyReviewIfAbsentParams{
		UserID:       toPgUUID(userID),
		VocabularyID: toPgUUID(vocabularyID),
	})
	if isPgError(err, pgForeignKeyViolation) {
		return ErrNotFound
	}
	if err != nil {
		return err
	}

	if inserted > 0 {
		// Chỉ tính nhiệm vụ khi đây thực sự là lần học đầu (ON CONFLICT DO
		// NOTHING trả 0 dòng nếu đã học rồi) — gọi lại hàm idempotent này
		// không được cộng progress nhiều lần cho cùng 1 từ.
		s.recordMissionAction(ctx, userID, "learn_word")
	}
	return nil
}

func toPgUUID(id uuid.UUID) pgtype.UUID {
	return pgtype.UUID{Bytes: id, Valid: true}
}

// ReviewWord — 1 từ user đang ôn trong SRS kèm lịch ôn tiếp theo
type ReviewWord struct {
	VocabularyID  uuid.UUID `json:"vocabulary_id" swaggertype:"string" format:"uuid"`
	LanguageID    string    `json:"language_id"`
	Term          string    `json:"term"`
	Phonetic      string    `json:"phonetic"`
	Meaning       string    `json:"meaning"`
	PartOfSpeech  string    `json:"part_of_speech"`
	Topic         string    `json:"topic"`
	TopicLabel    string    `json:"topic_label"` // tên chủ đề theo ngôn ngữ giao diện
	Level         string    `json:"level"`
	ImageURL      string    `json:"image_url"`
	ImageEmoji    string    `json:"image_emoji"`
	PracticeCount int32     `json:"practice_count"`
	SRSStage      int32     `json:"srs_stage"`
	IntervalDays  int32     `json:"interval_days"`
	NextReviewAt  time.Time `json:"next_review_at"`
}

// ListReviewWords trả về 1 trang MỌI từ user đang ôn trong SRS (kể cả chưa
// đến hạn), sắp theo thời gian còn lại tới lúc ôn. languageID rỗng = mọi ngôn ngữ.
func (s *SRSService) ListReviewWords(ctx context.Context, userID uuid.UUID, languageID string, page, pageSize int32) (PageResult[ReviewWord], error) {
	limit, offset := NormalizePage(page, pageSize)
	rows, err := s.repo.ListReviewVocabulariesForUser(ctx, db.ListReviewVocabulariesForUserParams{
		UserID:     toPgUUID(userID),
		LanguageID: pgtype.Text{String: languageID, Valid: languageID != ""},
		Limit:      limit,
		Offset:     offset,
	})
	if err != nil {
		return PageResult[ReviewWord]{}, err
	}
	result := PageResult[ReviewWord]{Items: make([]ReviewWord, 0, len(rows))}
	for _, r := range rows {
		result.Total = r.TotalCount
		result.Items = append(result.Items, ReviewWord{
			VocabularyID: uuid.UUID(r.VocabularyID.Bytes), LanguageID: r.LanguageID, Term: r.Term,
			Phonetic: r.Phonetic.String, Meaning: r.Meaning, PartOfSpeech: r.PartOfSpeech.String, Topic: r.Topic.String, Level: r.Level.String,
			ImageURL: r.ImageUrl.String, ImageEmoji: r.ImageEmoji.String, PracticeCount: r.PracticeCount,
			SRSStage: r.SrsStage.Int32, IntervalDays: r.IntervalDays.Int32, NextReviewAt: r.NextReviewAt.Time,
		})
	}
	fields := make([]TranslatableField, 0, 2*len(result.Items))
	for i := range result.Items {
		w := &result.Items[i]
		fields = append(fields, vocabularyFields(w.VocabularyID, &w.Meaning, nil)...)
		fields = append(fields, topicLabelField(w.Topic, &w.TopicLabel))
	}
	s.tr.Apply(ctx, fields)
	return result, nil
}
