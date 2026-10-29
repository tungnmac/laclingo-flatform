package service

import (
	"context"
	"errors"
	"fmt"
	"slices"
	"strings"
	"sync"

	"laclingo-backend/internal/repository/db"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

// Dựng nội dung cho ngôn ngữ mới ở luồng "Học ngôn ngữ mới": chủ đề user chọn (từ ngôn ngữ đang học hoặc danh sách mặc
// định) mà ngôn ngữ mới chưa có thì dựng từ các từ của chủ đề nguồn — từ user đã học trước, rồi các từ còn lại. Mỗi từ
// gốc chỉ dựng 1 lần cho mỗi ngôn ngữ (vocabularies.source_vocabulary_id) và dùng chung cho mọi user, nên dữ liệu tối
// đa = số từ gốc × số ngôn ngữ, không tăng theo số user.

const (
	maxDerivedWordsPerTopic = 30
	deriveTopicConcurrency  = 4 // số chủ đề gọi AI cùng lúc trong 1 yêu cầu
)

// ErrLanguageContentAIFailed — AI lỗi khi dựng từ (key sai, hết hạn mức, quá tải...) — handler trả 502
var ErrLanguageContentAIFailed = errors.New("chưa dựng được nội dung cho ngôn ngữ mới")

type LanguageContentRepository interface {
	GetLanguageByID(ctx context.Context, id string) (db.Language, error)
	GetVocabularyTopic(ctx context.Context, arg db.GetVocabularyTopicParams) (db.VocabularyTopic, error)
	ListLanguageTopicKeys(ctx context.Context, languageID string) ([]db.ListLanguageTopicKeysRow, error)
	ListTopicSourceWords(ctx context.Context, arg db.ListTopicSourceWordsParams) ([]db.ListTopicSourceWordsRow, error)
	CountTopicWords(ctx context.Context, arg db.CountTopicWordsParams) (int64, error)
	BeginTx(ctx context.Context) (pgx.Tx, error)
	WithTx(tx pgx.Tx) *db.Queries
}

// PrepareLanguageRequest — chủ đề (tên ở ngôn ngữ nguồn From) muốn học ở ngôn ngữ mới
type PrepareLanguageRequest struct {
	From   string   `json:"from" example:"en"`
	Topics []string `json:"topics" example:"Gia đình & Con người"`
}

// PrepareLanguageResponse — Topics: tên chủ đề tương ứng ở ngôn ngữ mới (đã có từ), theo thứ tự yêu cầu — web lưu làm
// chủ đề yêu thích của ngôn ngữ đó. Skipped: chủ đề nguồn không dựng được từ nào (chủ đề nguồn không có từ, hoặc các từ
// tương ứng đã nằm ở chủ đề khác của ngôn ngữ mới)
type PrepareLanguageResponse struct {
	Topics  []string `json:"topics"`
	Skipped []string `json:"skipped"`
}

type LanguageContentService struct {
	repo LanguageContentRepository
	ai   AIClient // nil = chưa cấu hình AI: chỉ dùng được chủ đề ngôn ngữ mới đã có sẵn từ
}

func NewLanguageContentService(repo LanguageContentRepository, ai AIClient) *LanguageContentService {
	return &LanguageContentService{repo: repo, ai: ai}
}

// Prepare đảm bảo ngôn ngữ languageID có từ cho từng chủ đề nguồn (dựng phần còn thiếu)
func (s *LanguageContentService) Prepare(ctx context.Context, userID uuid.UUID, languageID string, req PrepareLanguageRequest) (PrepareLanguageResponse, error) {
	languageID = strings.TrimSpace(languageID)
	from := strings.TrimSpace(req.From)
	if languageID == "" || from == "" || languageID == from || languageID == nativeLanguageID {
		return PrepareLanguageResponse{}, fmt.Errorf("ngôn ngữ nguồn không hợp lệ: %w", ErrInvalidInput)
	}
	topics, err := normalizeTopics(req.Topics)
	if err != nil {
		return PrepareLanguageResponse{}, err
	}
	// Ngôn ngữ trong danh mục chưa có dòng: dòng languages chỉ tạo khi sắp ghi từ đầu tiên (prepareTopic) — AI lỗi thì
	// không để lại ngôn ngữ rỗng trong danh sách khoá học
	target, err := s.repo.GetLanguageByID(ctx, languageID)
	if errors.Is(err, pgx.ErrNoRows) {
		l, ok := findCatalogLanguage(languageID)
		if !ok {
			return PrepareLanguageResponse{}, fmt.Errorf("ngôn ngữ %q không tồn tại: %w", languageID, ErrInvalidInput)
		}
		target, err = db.Language{ID: l.ID, Name: l.Name, Code: l.Code}, nil
	}
	if err != nil {
		return PrepareLanguageResponse{}, err
	}
	source, err := s.language(ctx, from)
	if err != nil {
		return PrepareLanguageResponse{}, err
	}
	existing, err := s.repo.ListLanguageTopicKeys(ctx, languageID)
	if err != nil {
		return PrepareLanguageResponse{}, err
	}
	targetByKey := make(map[string]string, len(existing))
	for _, t := range existing {
		if t.TopicKey.Valid {
			targetByKey[t.TopicKey.String] = t.Name
		}
	}

	names := make([]string, len(topics))
	errs := make([]error, len(topics))
	sem := make(chan struct{}, deriveTopicConcurrency)
	var wg sync.WaitGroup
	for i, topic := range topics {
		wg.Add(1)
		go func() {
			defer wg.Done()
			sem <- struct{}{}
			defer func() { <-sem }()
			names[i], errs[i] = s.prepareTopic(ctx, userID, source, target, topic, targetByKey)
		}()
	}
	wg.Wait()
	if err := errors.Join(errs...); err != nil {
		return PrepareLanguageResponse{}, err
	}

	res := PrepareLanguageResponse{Topics: []string{}, Skipped: []string{}}
	seen := map[string]bool{}
	for i, name := range names {
		if name == "" {
			res.Skipped = append(res.Skipped, topics[i])
		} else if !seen[name] {
			seen[name] = true
			res.Topics = append(res.Topics, name)
		}
	}
	return res, nil
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
