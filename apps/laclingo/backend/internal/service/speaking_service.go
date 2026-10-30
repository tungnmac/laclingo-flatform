package service

import (
	"context"
	"errors"
	"fmt"
	"log"
	"strings"
	"unicode/utf8"

	"laclingo-backend/internal/repository/db"
	"laclingo-backend/internal/speaking"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

const (
	SpeakingKindRepeat = "repeat" // nhắc lại câu mẫu
	SpeakingKindAnswer = "answer" // trả lời câu hỏi

	maxSpeakingTranscriptLen   = 5000
	maxSpeakingPromptLen       = 1000
	maxSpeakingSampleAnswerLen = 5000
	maxSpeakingDescriptionLen  = 500
	maxSpeakingKeywords        = 20
	maxSpeakingTopicLen        = 100 // speaking_topics.name VARCHAR(100)
	maxSpeakingIconLen         = 16  // speaking_topics.icon VARCHAR(16)

	// Chỉ tính nhiệm vụ "speaking_practice" khi đạt điểm này — gõ bừa vài ký tự
	// không được cày nhiệm vụ (giống luyện nghe chỉ tính câu trả lời đúng)
	speakingMissionMinScore = 60
)

type SpeakingRepository interface {
	ListSpeakingTopics(ctx context.Context, arg db.ListSpeakingTopicsParams) ([]db.ListSpeakingTopicsRow, error)
	ListSpeakingItemsByTopic(ctx context.Context, arg db.ListSpeakingItemsByTopicParams) ([]db.ListSpeakingItemsByTopicRow, error)
	GetSpeakingItem(ctx context.Context, id pgtype.UUID) (db.SpeakingItem, error)
	CreateSpeakingAttempt(ctx context.Context, arg db.CreateSpeakingAttemptParams) error
	GetBestSpeakingScore(ctx context.Context, arg db.GetBestSpeakingScoreParams) (int32, error)
	UpsertSpeakingTopic(ctx context.Context, arg db.UpsertSpeakingTopicParams) (db.SpeakingTopic, error)
	InsertSpeakingTopic(ctx context.Context, arg db.InsertSpeakingTopicParams) (db.SpeakingTopic, error)
	ListSpeakingTopicsAdmin(ctx context.Context, languageID string) ([]db.ListSpeakingTopicsAdminRow, error)
	ListSpeakingItemsAdmin(ctx context.Context, arg db.ListSpeakingItemsAdminParams) ([]db.ListSpeakingItemsAdminRow, error)
	CreateSpeakingItem(ctx context.Context, arg db.CreateSpeakingItemParams) (db.SpeakingItem, error)
	UpdateSpeakingItem(ctx context.Context, arg db.UpdateSpeakingItemParams) (db.SpeakingItem, error)
	DeleteSpeakingItem(ctx context.Context, id pgtype.UUID) (int64, error)
	DeleteSpeakingTopic(ctx context.Context, arg db.DeleteSpeakingTopicParams) (int64, error)
}

// SpeakingTopic — 1 chủ đề luyện nói (vd "Phỏng vấn CNTT") kèm tiến độ của user
type SpeakingTopic struct {
	Name        string `json:"name" example:"Phỏng vấn CNTT"`
	Label       string `json:"label" example:"IT interview"` // tên hiển thị theo ngôn ngữ giao diện (chưa dịch = Name)
	Icon        string `json:"icon" example:"💼"`
	Description string `json:"description"`
	Total       int32  `json:"total"`
	Practiced   int32  `json:"practiced"` // số câu đã luyện ít nhất 1 lần
	AvgBest     int32  `json:"avg_best"`  // điểm cao nhất trung bình của các câu đã luyện
}

// SpeakingItem — 1 câu luyện nói
type SpeakingItem struct {
	ID            uuid.UUID `json:"id" swaggertype:"string" format:"uuid"`
	Kind          string    `json:"kind" example:"answer" enums:"repeat,answer"`
	Prompt        string    `json:"prompt" example:"Tell me about yourself."`
	PromptMeaning string    `json:"prompt_meaning"`
	SampleAnswer  string    `json:"sample_answer,omitempty"`
	Keywords      []string  `json:"keywords"`
	Level         string    `json:"level" example:"B1"`
	TopicLabel    string    `json:"topic_label"`          // tên chủ đề theo ngôn ngữ giao diện
	BestScore     *int32    `json:"best_score,omitempty"` // chưa luyện = không có
	AttemptCount  int32     `json:"attempt_count"`
}

// SpeakingAttemptRequest — transcript trình duyệt nhận diện được + thời lượng nói
type SpeakingAttemptRequest struct {
	Transcript string `json:"transcript" example:"I have three years of experience with React"`
	DurationMs int    `json:"duration_ms" example:"4200"` // 0 = không đo được (vd gõ tay)
}

type SpeakingAttemptResult struct {
	speaking.Feedback
	BestScore int32 `json:"best_score"`
	IsNewBest bool  `json:"is_new_best"`
}

// SpeakingTopicRequest — admin tạo/sửa chủ đề (name là khoá, không đổi được)
type SpeakingTopicRequest struct {
	LanguageID  string `json:"language_id" example:"en"`
	Name        string `json:"name" example:"Phỏng vấn CNTT"`
	Icon        string `json:"icon" example:"💼"`
	Description string `json:"description"`
	OrderIndex  int32  `json:"order_index"`
	// CreateOnly — form "Thêm chủ đề": trùng tên thì báo lỗi thay vì cập nhật chủ đề cũ
	CreateOnly bool `json:"create_only,omitempty"`
}

type SpeakingTopicAdmin struct {
	SpeakingTopicRequest
	ItemCount int32 `json:"item_count"`
}

// SpeakingItemRequest — admin tạo/sửa câu luyện
type SpeakingItemRequest struct {
	LanguageID    string   `json:"language_id" example:"en"`
	Topic         string   `json:"topic" example:"Phỏng vấn CNTT"`
	Kind          string   `json:"kind" example:"answer" enums:"repeat,answer"`
	Prompt        string   `json:"prompt"`
	PromptMeaning string   `json:"prompt_meaning"`
	SampleAnswer  string   `json:"sample_answer"`
	Keywords      []string `json:"keywords"`
	Level         string   `json:"level" example:"B1"`
	OrderIndex    int32    `json:"order_index"`
}

type SpeakingItemAdmin struct {
	ID uuid.UUID `json:"id" swaggertype:"string" format:"uuid"`
	SpeakingItemRequest
}

type SpeakingService struct {
	repo     SpeakingRepository
	missions *MissionService
	quota    QuotaProvider      // lượt luyện nói/ngày theo gói
	tr       *ContentTranslator // dịch tên / mô tả chủ đề + nghĩa câu luyện theo ngôn ngữ giao diện (chỉ response học viên)
}

func NewSpeakingService(repo SpeakingRepository, missions *MissionService, quota QuotaProvider, tr *ContentTranslator) *SpeakingService {
	return &SpeakingService{repo: repo, missions: missions, quota: quota, tr: tr}
}

func (s *SpeakingService) ListTopics(ctx context.Context, userID uuid.UUID, languageID string) ([]SpeakingTopic, error) {
	if languageID == "" {
		languageID = defaultVocabularyLanguage
	}
	rows, err := s.repo.ListSpeakingTopics(ctx, db.ListSpeakingTopicsParams{UserID: toPgUUID(userID), LanguageID: languageID})
	if err != nil {
		return nil, err
	}
	out := make([]SpeakingTopic, 0, len(rows))
	for _, r := range rows {
		out = append(out, SpeakingTopic{Name: r.Name, Icon: r.Icon, Description: r.Description, Total: r.Total, Practiced: r.Practiced, AvgBest: r.AvgBest})
	}
	// Dịch nhãn tên + mô tả (1 query); name vẫn là khoá dùng trong URL / ListItems
	fields := make([]TranslatableField, 0, 2*len(out))
	for i := range out {
		t := &out[i]
		fields = append(fields, topicLabelField(t.Name, &t.Label),
			TranslatableField{Entity: translationEntitySpeakingTopic, ID: speakingTopicTranslationID(languageID, t.Name), Field: translationFieldDescription, Value: &t.Description})
	}
	s.tr.Apply(ctx, fields)
	return out, nil
}

func (s *SpeakingService) ListItems(ctx context.Context, userID uuid.UUID, languageID, topic string) ([]SpeakingItem, error) {
	if topic == "" {
		return nil, ErrInvalidInput
	}
	if languageID == "" {
		languageID = defaultVocabularyLanguage
	}
	rows, err := s.repo.ListSpeakingItemsByTopic(ctx, db.ListSpeakingItemsByTopicParams{UserID: toPgUUID(userID), LanguageID: languageID, Topic: topic})
	if err != nil {
		return nil, err
	}
	out := make([]SpeakingItem, 0, len(rows))
	for _, r := range rows {
		item := SpeakingItem{
			ID: uuid.UUID(r.ID.Bytes), Kind: r.Kind, Prompt: r.Prompt, PromptMeaning: r.PromptMeaning,
			SampleAnswer: r.SampleAnswer, Keywords: r.Keywords, Level: r.Level, AttemptCount: r.AttemptCount,
		}
		if r.BestScore >= 0 {
			best := r.BestScore
			item.BestScore = &best
		}
		out = append(out, item)
	}
	// Dịch nghĩa câu (prompt / câu mẫu / từ khoá là ngôn ngữ đang học — không dịch) + nhãn chủ đề (1 query)
	var topicLabel string
	fields := []TranslatableField{topicLabelField(topic, &topicLabel)}
	for i := range out {
		fields = append(fields, TranslatableField{Entity: translationEntitySpeakingItem, ID: out[i].ID.String(), Field: translationFieldPromptMeaning, Value: &out[i].PromptMeaning})
	}
	s.tr.Apply(ctx, fields)
	for i := range out {
		out[i].TopicLabel = topicLabel
	}
	return out, nil
}

// speakingTopicTranslationID — id bản dịch của 1 chủ đề luyện nói (khoá chính language_id + name)
func speakingTopicTranslationID(languageID, name string) string {
	return languageID + "/" + name
}

// SubmitAttempt chấm 1 lần nói, lưu lại (transcript rỗng thì chỉ chấm, không lưu)
// và ghi nhận hoạt động học (nhiệm vụ "speaking_practice", nhắc học).
func (s *SpeakingService) SubmitAttempt(ctx context.Context, userID, itemID uuid.UUID, req SpeakingAttemptRequest) (SpeakingAttemptResult, error) {
	req.Transcript = strings.TrimSpace(req.Transcript)
	if utf8.RuneCountInString(req.Transcript) > maxSpeakingTranscriptLen || req.DurationMs < 0 {
		return SpeakingAttemptResult{}, ErrInvalidInput
	}
	item, err := s.repo.GetSpeakingItem(ctx, toPgUUID(itemID))
	if errors.Is(err, pgx.ErrNoRows) {
		return SpeakingAttemptResult{}, ErrNotFound
	}
	if err != nil {
		return SpeakingAttemptResult{}, err
	}

	var fb speaking.Feedback
	if item.Kind == SpeakingKindRepeat {
		fb = speaking.ScoreRepeat(item.Prompt, req.Transcript, item.LanguageID, req.DurationMs)
	} else {
		fb = speaking.ScoreAnswer(req.Transcript, item.Keywords, item.LanguageID, req.DurationMs)
	}

	prevBest, err := s.repo.GetBestSpeakingScore(ctx, db.GetBestSpeakingScoreParams{UserID: toPgUUID(userID), ItemID: item.ID})
	if err != nil {
		return SpeakingAttemptResult{}, err
	}
	result := SpeakingAttemptResult{Feedback: fb, BestScore: max(prevBest, 0)}
	if req.Transcript == "" {
		return result, nil
	}
	// Mỗi lần nói có nội dung = 1 lượt luyện nói của gói (hết lượt → *LimitError, chưa lưu gì)
	refund, err := s.quota.Reserve(ctx, userID, FeatureSpeaking)
	if err != nil {
		return SpeakingAttemptResult{}, err
	}
	if err := s.repo.CreateSpeakingAttempt(ctx, db.CreateSpeakingAttemptParams{
		UserID: toPgUUID(userID), ItemID: item.ID, Transcript: req.Transcript, Score: int32(fb.Score),
	}); err != nil {
		refund()
		return SpeakingAttemptResult{}, err
	}
	if int32(fb.Score) > prevBest {
		result.BestScore, result.IsNewBest = int32(fb.Score), true
	}
	if fb.Score >= speakingMissionMinScore {
		if err := s.missions.RecordAction(ctx, userID, "speaking_practice", 1); err != nil {
			log.Printf("❌ mission: RecordAction user=%s action=speaking_practice: %v", userID, err)
		}
	} else {
		s.missions.MarkStudied(ctx, userID) // điểm thấp vẫn là đang học (nhắc học), chỉ không tính nhiệm vụ
	}
	return result, nil
}

// ===== Admin =====

func (s *SpeakingService) ListTopicsAdmin(ctx context.Context, languageID string) ([]SpeakingTopicAdmin, error) {
	rows, err := s.repo.ListSpeakingTopicsAdmin(ctx, languageID)
	if err != nil {
		return nil, err
	}
	out := make([]SpeakingTopicAdmin, 0, len(rows))
	for _, r := range rows {
		out = append(out, SpeakingTopicAdmin{
			SpeakingTopicRequest: SpeakingTopicRequest{LanguageID: r.LanguageID, Name: r.Name, Icon: r.Icon, Description: r.Description, OrderIndex: r.OrderIndex},
			ItemCount:            r.ItemCount,
		})
	}
	return out, nil
}

func (s *SpeakingService) UpsertTopic(ctx context.Context, req SpeakingTopicRequest) (SpeakingTopicRequest, error) {
	req.Name, req.Icon, req.Description = strings.TrimSpace(req.Name), strings.TrimSpace(req.Icon), strings.TrimSpace(req.Description)
	if req.LanguageID == "" || req.Name == "" || utf8.RuneCountInString(req.Name) > maxSpeakingTopicLen ||
		utf8.RuneCountInString(req.Icon) > maxSpeakingIconLen || utf8.RuneCountInString(req.Description) > maxSpeakingDescriptionLen {
		return SpeakingTopicRequest{}, ErrInvalidInput
	}
	if req.Icon == "" {
		req.Icon = "🎤"
	}
	params := db.UpsertSpeakingTopicParams{
		LanguageID: req.LanguageID, Name: req.Name, Icon: req.Icon, Description: req.Description, OrderIndex: req.OrderIndex,
	}
	var t db.SpeakingTopic
	var err error
	if req.CreateOnly {
		t, err = s.repo.InsertSpeakingTopic(ctx, db.InsertSpeakingTopicParams(params))
	} else {
		t, err = s.repo.UpsertSpeakingTopic(ctx, params)
	}
	err = asDuplicate(err, fmt.Sprintf("Chủ đề \"%s\" đã tồn tại trong ngôn ngữ này", strings.TrimSpace(req.Name)))
	if isPgError(err, pgForeignKeyViolation) {
		return SpeakingTopicRequest{}, fmt.Errorf("không tìm thấy ngôn ngữ: %w", ErrInvalidInput)
	}
	if err != nil {
		return SpeakingTopicRequest{}, err
	}
	return SpeakingTopicRequest{LanguageID: t.LanguageID, Name: t.Name, Icon: t.Icon, Description: t.Description, OrderIndex: t.OrderIndex}, nil
}

// DeleteTopic xoá chủ đề — các câu luyện của nó tự xoá theo (FK ON DELETE CASCADE)
func (s *SpeakingService) DeleteTopic(ctx context.Context, languageID, name string) error {
	n, err := s.repo.DeleteSpeakingTopic(ctx, db.DeleteSpeakingTopicParams{LanguageID: languageID, Name: name})
	if err == nil && n == 0 {
		return ErrNotFound
	}
	return err
}

func (s *SpeakingService) ListItemsAdmin(ctx context.Context, languageID, topic, search string, page, pageSize int32) (PageResult[SpeakingItemAdmin], error) {
	limit, offset := NormalizePage(page, pageSize)
	rows, err := s.repo.ListSpeakingItemsAdmin(ctx, db.ListSpeakingItemsAdminParams{
		LanguageID: languageID,
		Topic:      pgtype.Text{String: topic, Valid: topic != ""},
		Search:     pgtype.Text{String: search, Valid: search != ""},
		Limit:      limit,
		Offset:     offset,
	})
	if err != nil {
		return PageResult[SpeakingItemAdmin]{}, err
	}
	result := PageResult[SpeakingItemAdmin]{Items: make([]SpeakingItemAdmin, 0, len(rows))}
	for _, r := range rows {
		result.Total = r.TotalCount
		result.Items = append(result.Items, toSpeakingItemAdmin(db.SpeakingItem{
			ID: r.ID, LanguageID: r.LanguageID, Topic: r.Topic, Kind: r.Kind, Prompt: r.Prompt, PromptMeaning: r.PromptMeaning,
			SampleAnswer: r.SampleAnswer, Keywords: r.Keywords, Level: r.Level, OrderIndex: r.OrderIndex,
		}))
	}
	return result, nil
}

func (s *SpeakingService) CreateItem(ctx context.Context, req SpeakingItemRequest) (SpeakingItemAdmin, error) {
	if err := validateSpeakingItem(&req); err != nil {
		return SpeakingItemAdmin{}, err
	}
	item, err := s.repo.CreateSpeakingItem(ctx, db.CreateSpeakingItemParams{
		LanguageID: req.LanguageID, Topic: req.Topic, Kind: req.Kind, Prompt: req.Prompt, PromptMeaning: req.PromptMeaning,
		SampleAnswer: req.SampleAnswer, Keywords: req.Keywords, Level: req.Level, OrderIndex: req.OrderIndex,
	})
	err = asDuplicate(err, fmt.Sprintf("Câu \"%s\" đã có trong chủ đề này", shortText(req.Prompt)))
	if err != nil {
		return SpeakingItemAdmin{}, speakingTopicError(err, req.Topic)
	}
	return toSpeakingItemAdmin(item), nil
}

// UpdateItem sửa câu luyện — KHÔNG đổi ngôn ngữ: chủ đề luôn được hiểu theo ngôn ngữ gốc của câu
func (s *SpeakingService) UpdateItem(ctx context.Context, id uuid.UUID, req SpeakingItemRequest) (SpeakingItemAdmin, error) {
	current, err := s.repo.GetSpeakingItem(ctx, toPgUUID(id))
	if errors.Is(err, pgx.ErrNoRows) {
		return SpeakingItemAdmin{}, ErrNotFound
	}
	if err != nil {
		return SpeakingItemAdmin{}, err
	}
	req.LanguageID = current.LanguageID
	if err := validateSpeakingItem(&req); err != nil {
		return SpeakingItemAdmin{}, err
	}
	item, err := s.repo.UpdateSpeakingItem(ctx, db.UpdateSpeakingItemParams{
		ID: toPgUUID(id), Topic: req.Topic, Kind: req.Kind, Prompt: req.Prompt, PromptMeaning: req.PromptMeaning,
		SampleAnswer: req.SampleAnswer, Keywords: req.Keywords, Level: req.Level, OrderIndex: req.OrderIndex,
	})
	err = asDuplicate(err, fmt.Sprintf("Câu \"%s\" đã có trong chủ đề này", shortText(req.Prompt)))
	if errors.Is(err, pgx.ErrNoRows) {
		return SpeakingItemAdmin{}, ErrNotFound
	}
	if err != nil {
		return SpeakingItemAdmin{}, speakingTopicError(err, req.Topic)
	}
	return toSpeakingItemAdmin(item), nil
}

// speakingTopicError — FK (language_id, topic) → chủ đề chưa tồn tại
func speakingTopicError(err error, topic string) error {
	if isPgError(err, pgForeignKeyViolation) {
		return fmt.Errorf("chủ đề \"%s\" chưa tồn tại, hãy tạo chủ đề trước: %w", topic, ErrInvalidInput)
	}
	return err
}

func (s *SpeakingService) DeleteItem(ctx context.Context, id uuid.UUID) error {
	n, err := s.repo.DeleteSpeakingItem(ctx, toPgUUID(id))
	if err == nil && n == 0 {
		return ErrNotFound
	}
	return err
}

// validateSpeakingItem chuẩn hoá + kiểm tra câu luyện (chủ đề tồn tại do FK đảm bảo)
func validateSpeakingItem(req *SpeakingItemRequest) error {
	req.Topic, req.Prompt = strings.TrimSpace(req.Topic), strings.TrimSpace(req.Prompt)
	req.PromptMeaning, req.SampleAnswer = strings.TrimSpace(req.PromptMeaning), strings.TrimSpace(req.SampleAnswer)
	levelErr := normalizeLevel(req.LanguageID, &req.Level)
	if req.Level == "" {
		req.Level = levelForRank(req.LanguageID, 3) // mặc định trung cấp: B1 / N3 / HSK3 / TOPIK3
	}
	switch {
	case req.LanguageID == "" || req.Topic == "" || req.Prompt == "":
		return ErrInvalidInput
	case req.Kind != SpeakingKindRepeat && req.Kind != SpeakingKindAnswer:
		return fmt.Errorf("loại câu luyện phải là repeat hoặc answer: %w", ErrInvalidInput)
	case utf8.RuneCountInString(req.Prompt) > maxSpeakingPromptLen || utf8.RuneCountInString(req.PromptMeaning) > maxSpeakingPromptLen:
		return fmt.Errorf("nội dung/nghĩa tối đa %d ký tự: %w", maxSpeakingPromptLen, ErrInvalidInput)
	case utf8.RuneCountInString(req.SampleAnswer) > maxSpeakingSampleAnswerLen:
		return fmt.Errorf("câu trả lời mẫu tối đa %d ký tự: %w", maxSpeakingSampleAnswerLen, ErrInvalidInput)
	case levelErr != nil:
		return levelErr
	}
	keywords := make([]string, 0, len(req.Keywords))
	for _, k := range req.Keywords {
		if k = strings.TrimSpace(k); k != "" && !containsFold(keywords, k) {
			keywords = append(keywords, k)
		}
	}
	if len(keywords) > maxSpeakingKeywords {
		return fmt.Errorf("tối đa %d từ khoá: %w", maxSpeakingKeywords, ErrInvalidInput)
	}
	req.Keywords = keywords
	return nil
}

func containsFold(list []string, s string) bool {
	for _, x := range list {
		if strings.EqualFold(x, s) {
			return true
		}
	}
	return false
}

func toSpeakingItemAdmin(i db.SpeakingItem) SpeakingItemAdmin {
	return SpeakingItemAdmin{
		ID: uuid.UUID(i.ID.Bytes),
		SpeakingItemRequest: SpeakingItemRequest{
			LanguageID: i.LanguageID, Topic: i.Topic, Kind: i.Kind, Prompt: i.Prompt, PromptMeaning: i.PromptMeaning,
			SampleAnswer: i.SampleAnswer, Keywords: i.Keywords, Level: i.Level, OrderIndex: i.OrderIndex,
		},
	}
}
