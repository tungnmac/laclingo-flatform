package service

import (
	"context"
	"errors"
	"fmt"
	"slices"

	"laclingo-backend/internal/repository/db"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

// Dựng nội dung cho ngôn ngữ mới ở luồng "Học ngôn ngữ mới": chủ đề user chọn (từ ngôn ngữ đang học hoặc danh sách mặc
// định) mà ngôn ngữ mới chưa có thì dựng từ các từ của chủ đề nguồn — từ user đã học trước, rồi các từ còn lại. Mỗi từ
// gốc chỉ dựng 1 lần cho mỗi ngôn ngữ (vocabularies.source_vocabulary_id) và dùng chung cho mọi user, nên dữ liệu tối
// đa = số từ gốc × số ngôn ngữ, không tăng theo số user.

const maxDerivedWordsPerTopic = 30

// ErrLanguageContentAIFailed — AI lỗi khi dựng từ (key sai, hết hạn mức, quá tải...) — job dựng chờ rồi thử lại
var ErrLanguageContentAIFailed = errors.New("chưa dựng được nội dung cho ngôn ngữ mới")

type LanguageContentRepository interface {
	GetLanguageByID(ctx context.Context, id string) (db.Language, error)
	InsertLanguageIfMissing(ctx context.Context, arg db.InsertLanguageIfMissingParams) error
	GetVocabularyTopic(ctx context.Context, arg db.GetVocabularyTopicParams) (db.VocabularyTopic, error)
	ListLanguageTopicKeys(ctx context.Context, languageID string) ([]db.ListLanguageTopicKeysRow, error)
	ListTopicSourceWords(ctx context.Context, arg db.ListTopicSourceWordsParams) ([]db.ListTopicSourceWordsRow, error)
	CountTopicWords(ctx context.Context, arg db.CountTopicWordsParams) (int64, error)
	EnqueueLanguageSyncJob(ctx context.Context, arg db.EnqueueLanguageSyncJobParams) error
	ClaimLanguageSyncJob(ctx context.Context) (db.LanguageSyncJob, error)
	CompleteLanguageSyncJob(ctx context.Context, arg db.CompleteLanguageSyncJobParams) error
	RescheduleLanguageSyncJob(ctx context.Context, arg db.RescheduleLanguageSyncJobParams) error
	FailLanguageSyncJob(ctx context.Context, arg db.FailLanguageSyncJobParams) error
	ListUserLanguageSyncJobs(ctx context.Context, arg db.ListUserLanguageSyncJobsParams) ([]db.LanguageSyncJob, error)
	RetryFailedLanguageSyncJobs(ctx context.Context, arg db.RetryFailedLanguageSyncJobsParams) (int64, error)
	CountOpenLanguageSyncJobs(ctx context.Context, arg db.CountOpenLanguageSyncJobsParams) (int64, error)
	CountUserOpenLanguageSyncJobs(ctx context.Context, userID pgtype.UUID) (int64, error)
	ListUserTargetLanguages(ctx context.Context, userID pgtype.UUID) ([]db.ListUserTargetLanguagesRow, error)
	AddUserPreferredTopic(ctx context.Context, arg db.AddUserPreferredTopicParams) error
	BeginTx(ctx context.Context) (pgx.Tx, error)
	WithTx(tx pgx.Tx) *db.Queries
}

// SyncLanguageRequest — chủ đề (tên ở ngôn ngữ nguồn From) muốn học ở ngôn ngữ mới — đưa vào hàng đợi dựng nội dung
type SyncLanguageRequest struct {
	From   string   `json:"from" example:"en"`
	Topics []string `json:"topics" example:"Gia đình & Con người"`
}

type LanguageContentService struct {
	repo     LanguageContentRepository
	ai       AIClient           // nil = chưa cấu hình AI: job dựng chờ rồi thử lại, chỉ chủ đề đã có sẵn từ là xong ngay
	notifier Notifier           // báo user khi dựng xong (nil = không báo)
	tr       *ContentTranslator // tên chủ đề của job theo ngôn ngữ giao diện
	wake     chan struct{}      // có job mới → đánh thức worker (xem language_sync.go)
}

func NewLanguageContentService(repo LanguageContentRepository, ai AIClient, notifier Notifier, tr *ContentTranslator) *LanguageContentService {
	return &LanguageContentService{repo: repo, ai: ai, notifier: notifier, tr: tr, wake: make(chan struct{}, 1)}
}

func (s *LanguageContentService) language(ctx context.Context, id string) (db.Language, error) {
	l, err := s.repo.GetLanguageByID(ctx, id)
	if errors.Is(err, pgx.ErrNoRows) {
		return db.Language{}, fmt.Errorf("ngôn ngữ %q không tồn tại: %w", id, ErrInvalidInput)
	}
	return l, err
}

// prepareTopic dựng các từ còn thiếu của 1 chủ đề nguồn ở ngôn ngữ đích; trả tên chủ đề ở ngôn ngữ đích ("" = chủ đề
// không có từ nào ở ngôn ngữ đích)
func (s *LanguageContentService) prepareTopic(ctx context.Context, userID uuid.UUID, source, target db.Language, topic string, targetByKey map[string]string) (string, error) {
	icon, order, key := "📘", int32(0), pgtype.Text{}
	meta, err := s.repo.GetVocabularyTopic(ctx, db.GetVocabularyTopicParams{LanguageID: source.ID, Name: topic})
	if err == nil {
		icon, order, key = meta.Icon, meta.OrderIndex, meta.TopicKey
	} else if !errors.Is(err, pgx.ErrNoRows) {
		return "", err
	}
	// Ngôn ngữ đích đã có chủ đề cùng khoá thì đổ vào đó; không thì tạo chủ đề cùng tên với chủ đề nguồn
	name := topic
	if existing, ok := targetByKey[key.String]; ok && key.Valid {
		name = existing
	}
	topicParam := pgtype.Text{String: name, Valid: true}
	// Chủ đề ngôn ngữ đích đã có từ (nhập tay hoặc đã dựng) thì dùng luôn — chỉ dựng chủ đề còn trống
	if count, err := s.repo.CountTopicWords(ctx, db.CountTopicWordsParams{LanguageID: target.ID, Topic: topicParam}); err != nil || count > 0 {
		return name, err
	}

	words, err := s.repo.ListTopicSourceWords(ctx, db.ListTopicSourceWordsParams{
		TargetLanguageID: target.ID, UserID: toPgUUID(userID), LanguageID: source.ID,
		Topic: pgtype.Text{String: topic, Valid: true}, MaxWords: maxDerivedWordsPerTopic,
	})
	if err != nil {
		return "", err
	}
	missing := words[:0:0]
	for _, w := range words {
		if !w.Translated {
			missing = append(missing, w)
		}
	}
	if len(missing) > 0 {
		if s.ai == nil {
			return "", ErrAINotConfigured
		}
		entries, err := askDeriveAI(ctx, s.ai, source, target, topic, missing)
		if err != nil {
			return "", fmt.Errorf("%w (%s): %s", ErrLanguageContentAIFailed, topic, aiErrorReason(err))
		}
		if !slices.ContainsFunc(entries, func(e derivedEntry) bool { return e.Term != "" }) {
			return "", fmt.Errorf("%w (%s): AI không trả về từ hợp lệ", ErrLanguageContentAIFailed, topic)
		}
		if err := s.saveDerived(ctx, target, name, icon, order, key, missing, entries); err != nil {
			return "", err
		}
	}

	count, err := s.repo.CountTopicWords(ctx, db.CountTopicWordsParams{LanguageID: target.ID, Topic: topicParam})
	if err != nil || count == 0 {
		return "", err
	}
	return name, nil
}

// saveDerived ghi ngôn ngữ (nếu chưa có) + chủ đề + các từ dựng trong 1 transaction — lỗi giữa chừng không để lại ngôn
// ngữ / chủ đề rỗng. Từ trùng term với từ đã có ở ngôn ngữ đích thì gắn từ đó với gốc (lần sau không hỏi AI lại).
func (s *LanguageContentService) saveDerived(ctx context.Context, target db.Language, topic, icon string, order int32, key pgtype.Text, words []db.ListTopicSourceWordsRow, entries []derivedEntry) error {
	tx, err := s.repo.BeginTx(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	q := s.repo.WithTx(tx)
	if err := q.InsertLanguageIfMissing(ctx, db.InsertLanguageIfMissingParams{ID: target.ID, Name: target.Name, Code: target.Code}); err != nil {
		return err
	}
	topicParam := pgtype.Text{String: topic, Valid: true}
	inserted := int64(0)
	for i, e := range entries {
		if e.Term == "" {
			continue // AI bỏ sót / trả không hợp lệ
		}
		w := words[i]
		level := w.Level
		if !level.Valid {
			level = pgtype.Text{String: "A1", Valid: true}
		}
		n, err := q.InsertDerivedVocabulary(ctx, db.InsertDerivedVocabularyParams{
			LanguageID: target.ID, Term: e.Term, Phonetic: optionalPgText(e.Phonetic), Meaning: e.Meaning,
			Example: optionalPgText(e.Example), ExampleMeaning: optionalPgText(e.ExampleMeaning),
			PartOfSpeech: optionalPgText(e.PartOfSpeech), Topic: topicParam,
			Level: level, ImageEmoji: w.ImageEmoji, SourceVocabularyID: w.RootID,
		})
		if err != nil {
			return err
		}
		if n == 0 {
			err = q.LinkVocabularySource(ctx, db.LinkVocabularySourceParams{RootID: w.RootID, LanguageID: target.ID, Term: e.Term})
			if err != nil {
				return err
			}
		}
		inserted += n
	}
	// Chủ đề chỉ tạo khi có từ — mọi từ đều trùng thì không để lại chủ đề rỗng
	if inserted > 0 {
		err := q.InsertDerivedVocabularyTopic(ctx, db.InsertDerivedVocabularyTopicParams{
			LanguageID: target.ID, Name: topic, Icon: icon, OrderIndex: order, TopicKey: key,
		})
		if err != nil {
			return err
		}
	}
	return tx.Commit(ctx)
}
