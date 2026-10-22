package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"slices"
	"strings"
	"sync"
	"time"
	"unicode/utf8"

	"laclingo-backend/internal/repository/db"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

// Phân tích câu bằng AI cho học viên: câu đúng/sai, lỗi (ngữ pháp, thiếu/sai giới từ, mạo từ, trợ từ, lượng từ...)
// kèm câu đã sửa + giải thích tiếng Việt, cấu trúc câu, điểm ngữ pháp, từ vựng (đối chiếu kho từ của app để thêm
// vào ôn tập). Mỗi học viên tối đa SentenceAnalysisDailyLimit lượt/ngày; câu đã phân tích (cache) không tính lượt.

const (
	SentenceAnalysisDailyLimit = 30
	maxAnalyzeSentenceLen      = 300
	analysisCacheTTL           = 24 * time.Hour
	analysisCacheSize          = 2000
	maxAnalysisErrors          = 10
	maxAnalysisParts           = 20
	maxAnalysisGrammarPoints   = 5
	maxAnalysisWords           = 12
)

var (
	ErrAINotConfigured       = errors.New("server chưa cấu hình AI (GEMINI_API_KEY hoặc ANTHROPIC_API_KEY)")
	ErrAnalysisQuotaExceeded = fmt.Errorf("bạn đã dùng hết %d lượt phân tích câu hôm nay, quay lại vào ngày mai nhé", SentenceAnalysisDailyLimit)
	ErrAnalysisAIFailed      = errors.New("phân tích câu đang lỗi")
)

// Loại lỗi trong câu — FE hiển thị nhãn tiếng Việt theo mã
var sentenceErrorTypes = []string{
	"grammar", "tense", "agreement", "article", "preposition", "particle", "measure_word",
	"word_order", "word_choice", "missing_word", "extra_word", "spelling", "punctuation", "other",
}

type SentenceAnalyzeRequest struct {
	LanguageID string `json:"language_id" example:"en" enums:"en,zh"`
	Sentence   string `json:"sentence" example:"I am interested about learning English."`
}

type SentenceError struct {
	Type        string `json:"type" example:"preposition"`
	Original    string `json:"original" example:"about"` // "" = thiếu từ
	Correction  string `json:"correction" example:"in"`
	Explanation string `json:"explanation"`
}

type SentencePart struct {
	Text string `json:"text"`
	Role string `json:"role" example:"Chủ ngữ"`
	Note string `json:"note,omitempty"`
}

type SentenceGrammarPoint struct {
	Name        string `json:"name"`
	Explanation string `json:"explanation"`
}

type SentenceWord struct {
	Term         string `json:"term"`
	Phonetic     string `json:"phonetic,omitempty"`
	Meaning      string `json:"meaning"`
	PartOfSpeech string `json:"part_of_speech,omitempty"`
	Level        string `json:"level,omitempty"`
	// Từ có trong kho từ vựng của app → học viên thêm vào ôn tập được
	VocabularyID *uuid.UUID `json:"vocabulary_id,omitempty" swaggertype:"string" format:"uuid"`
}

// SentenceAnalysis — kết quả phân tích 1 câu
type SentenceAnalysis struct {
	LanguageID    string                 `json:"language_id"`
	Sentence      string                 `json:"sentence"`
	IsCorrect     bool                   `json:"is_correct"`
	Corrected     string                 `json:"corrected"`
	Translation   string                 `json:"translation"`
	Errors        []SentenceError        `json:"errors"`
	Structure     []SentencePart         `json:"structure"`
	GrammarPoints []SentenceGrammarPoint `json:"grammar_points"`
	Vocabulary    []SentenceWord         `json:"vocabulary"`
	// Lấy từ cache (đã có người phân tích câu này) — không tính lượt
	Cached bool `json:"cached"`
	SentenceAnalysisQuota
}

// SentenceAnalysisQuota — lượt phân tích còn lại hôm nay
type SentenceAnalysisQuota struct {
	Limit       int  `json:"limit"`
	Remaining   int  `json:"remaining"`
	AIAvailable bool `json:"ai_available"`
}

type SentenceAnalysisRepository interface {
	UseSentenceAnalysisQuota(ctx context.Context, arg db.UseSentenceAnalysisQuotaParams) (int32, error)
	RefundSentenceAnalysisQuota(ctx context.Context, arg db.RefundSentenceAnalysisQuotaParams) error
	GetSentenceAnalysisUsage(ctx context.Context, arg db.GetSentenceAnalysisUsageParams) (int32, error)
	FindVocabulariesByTerms(ctx context.Context, arg db.FindVocabulariesByTermsParams) ([]db.FindVocabulariesByTermsRow, error)
}

type SentenceAnalyzer struct {
	repo SentenceAnalysisRepository
	ai   AIClient // nil = chưa cấu hình AI
	now  func() time.Time

	mu    sync.Mutex
	cache map[string]cachedAnalysis
}

type cachedAnalysis struct {
	value   SentenceAnalysis
	expires time.Time
}

func NewSentenceAnalyzer(repo SentenceAnalysisRepository, ai AIClient) *SentenceAnalyzer {
	return &SentenceAnalyzer{repo: repo, ai: ai, now: time.Now, cache: map[string]cachedAnalysis{}}
}

// today — ngày tính lượt theo giờ Việt Nam cố định (không theo múi giờ học viên tự đổi được — đổi múi giờ
// không được "sang ngày mới" để có thêm lượt)
func (s *SentenceAnalyzer) today() (pgtype.Date, error) {
	return pgDate(localDate(s.now(), defaultDailyTimezone))
}

func (s *SentenceAnalyzer) quota(used int32) SentenceAnalysisQuota {
	return SentenceAnalysisQuota{Limit: SentenceAnalysisDailyLimit, Remaining: max(0, SentenceAnalysisDailyLimit-int(used)), AIAvailable: s.ai != nil}
}

// Quota — lượt còn lại hôm nay của học viên
func (s *SentenceAnalyzer) Quota(ctx context.Context, userID uuid.UUID) (SentenceAnalysisQuota, error) {
	date, err := s.today()
	if err != nil {
		return SentenceAnalysisQuota{}, err
	}
	used, err := s.repo.GetSentenceAnalysisUsage(ctx, db.GetSentenceAnalysisUsageParams{UserID: toPgUUID(userID), UsageDate: date})
	if err != nil {
		return SentenceAnalysisQuota{}, err
	}
	return s.quota(used), nil
}

// normalizeSentence — gộp khoảng trắng (giữ chữ hoa/thường: viết hoa đầu câu cũng là lỗi cần chỉ ra)
func normalizeSentence(s string) string { return strings.Join(strings.Fields(s), " ") }

func (s *SentenceAnalyzer) Analyze(ctx context.Context, userID uuid.UUID, req SentenceAnalyzeRequest) (SentenceAnalysis, error) {
	sentence := normalizeSentence(req.Sentence)
	if _, ok := suggestLanguageNames[req.LanguageID]; !ok {
		return SentenceAnalysis{}, fmt.Errorf("chỉ phân tích được câu tiếng Anh hoặc tiếng Trung: %w", ErrInvalidInput)
	}
	if sentence == "" || utf8.RuneCountInString(sentence) > maxAnalyzeSentenceLen {
		return SentenceAnalysis{}, fmt.Errorf("câu cần 1–%d ký tự: %w", maxAnalyzeSentenceLen, ErrInvalidInput)
	}
	date, err := s.today()
	if err != nil {
		return SentenceAnalysis{}, err
	}
	key := req.LanguageID + "\x00" + sentence
	if cached, ok := s.cached(key); ok {
		used, err := s.repo.GetSentenceAnalysisUsage(ctx, db.GetSentenceAnalysisUsageParams{UserID: toPgUUID(userID), UsageDate: date})
		if err != nil {
			return SentenceAnalysis{}, err
		}
		cached.Cached, cached.SentenceAnalysisQuota = true, s.quota(used)
		cached.Vocabulary = s.withVocabularyIDs(ctx, req.LanguageID, cached.Vocabulary)
		return cached, nil
	}
	if s.ai == nil {
		return SentenceAnalysis{}, ErrAINotConfigured
	}
	used, err := s.repo.UseSentenceAnalysisQuota(ctx, db.UseSentenceAnalysisQuotaParams{UserID: toPgUUID(userID), UsageDate: date, DailyLimit: SentenceAnalysisDailyLimit})
	if errors.Is(err, pgx.ErrNoRows) {
		return SentenceAnalysis{}, ErrAnalysisQuotaExceeded
	}
	if err != nil {
		return SentenceAnalysis{}, err
	}
	out, err := s.askAI(ctx, req.LanguageID, sentence)
	if err != nil {
		log.Printf("❌ sentence analysis: AI user=%s (%d ký tự): %v", userID, utf8.RuneCountInString(sentence), err) // không ghi nội dung câu của học viên vào log
		// Lỗi phía AI không phải lỗi của học viên → trả lại lượt (context gốc có thể đã huỷ, dùng context riêng)
		refundCtx, cancel := context.WithTimeout(context.WithoutCancel(ctx), 5*time.Second)
		defer cancel()
		if rerr := s.repo.RefundSentenceAnalysisQuota(refundCtx, db.RefundSentenceAnalysisQuotaParams{UserID: toPgUUID(userID), UsageDate: date}); rerr != nil {
			log.Printf("❌ sentence analysis: hoàn lượt user=%s: %v", userID, rerr)
		}
		return SentenceAnalysis{}, fmt.Errorf("%w: %s", ErrAnalysisAIFailed, aiErrorReason(err))
	}
	out.LanguageID, out.Sentence = req.LanguageID, sentence
	s.store(key, out) // cache KHÔNG kèm vocabulary_id — mỗi lần trả về đối chiếu lại kho từ (từ có thể vừa thêm/xoá)
	out.SentenceAnalysisQuota = s.quota(used)
	out.Vocabulary = s.withVocabularyIDs(ctx, req.LanguageID, out.Vocabulary)
	return out, nil
}

// withVocabularyIDs — bản sao danh sách từ, gắn vocabulary_id cho từ đã có trong kho từ của app (so như dedupe_key:
// gộp khoảng trắng, chữ thường). Lỗi DB chỉ log — không chặn kết quả phân tích.
func (s *SentenceAnalyzer) withVocabularyIDs(ctx context.Context, languageID string, words []SentenceWord) []SentenceWord {
	out := slices.Clone(words)
	if len(out) == 0 {
		return []SentenceWord{}
	}
	terms := make([]string, 0, len(out))
	for _, w := range out {
		terms = append(terms, w.Term)
	}
	rows, err := s.repo.FindVocabulariesByTerms(ctx, db.FindVocabulariesByTermsParams{LanguageID: languageID, Terms: terms})
	if err != nil {
		log.Printf("⚠️  sentence analysis: đối chiếu từ vựng: %v", err)
		return out
	}
	ids := make(map[string]uuid.UUID, len(rows))
	for _, r := range rows {
		ids[termKey(r.Term)] = uuid.UUID(r.ID.Bytes)
	}
	for i := range out {
		if id, ok := ids[termKey(out[i].Term)]; ok {
			out[i].VocabularyID = &id
		}
	}
	return out
}

func termKey(t string) string { return strings.ToLower(strings.Join(strings.Fields(t), " ")) }

func (s *SentenceAnalyzer) cached(key string) (SentenceAnalysis, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	c, ok := s.cache[key]
	if !ok || s.now().After(c.expires) {
		return SentenceAnalysis{}, false
	}
	return c.value, true
}

func (s *SentenceAnalyzer) store(key string, v SentenceAnalysis) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if len(s.cache) >= analysisCacheSize {
		clear(s.cache) // đầy thì làm mới toàn bộ (chỉ là cache tiết kiệm lượt AI)
	}
	s.cache[key] = cachedAnalysis{value: v, expires: s.now().Add(analysisCacheTTL)}
}

// ===== AI =====

const analysisSystemPrompt = `You are a precise, encouraging language tutor for Vietnamese learners on LacLingo.
Analyze ONE sentence written by a learner in the target language. Write every explanation, role, note and meaning in Vietnamese.
- is_correct: true only if the sentence is grammatically correct and natural. If the sentence is not in the target language, set is_correct=false, corrected="", and add one error of type "other" saying so.
- corrected: the corrected sentence with minimal changes that keep the learner's meaning (identical to the input when correct).
- errors: every mistake, in order of appearance. type is one of the allowed codes; original is the wrong fragment ("" when something is missing); correction is the fixed fragment ("" when it must be removed); explanation states the rule in 1–2 short Vietnamese sentences.
  Pay special attention to missing or wrong prepositions, articles (a/an/the), tense and subject–verb agreement in English, and to missing or misused particles (的/得/地/了/过/着/吗/呢/吧/把/被), measure words and word order in Chinese.
- translation: a natural Vietnamese translation of the corrected sentence.
- structure: the main constituents of the corrected sentence in order; text is the exact fragment, role is its grammatical role in Vietnamese (e.g. "Chủ ngữ", "Động từ chính", "Tân ngữ", "Trạng ngữ thời gian", "Cụm giới từ", "Bổ ngữ", "Trợ từ"), note is a short optional remark ("" if none).
- grammar_points: 1–4 key grammar structures used in the corrected sentence, with the pattern and when to use it.
- vocabulary: up to 10 notable words or phrases of the corrected sentence (skip trivial function words unless they matter here), each in dictionary form, with phonetic (English: American IPA without slashes; Chinese: pinyin with tone marks), a short Vietnamese meaning for this context, a part_of_speech code and a CEFR level.`

var sentenceAnalysisSchema = func() map[string]any {
	str := map[string]any{"type": "string"}
	obj := func(props map[string]any, required ...string) map[string]any {
		return map[string]any{"type": "object", "properties": props, "required": required, "additionalProperties": false}
	}
	arr := func(items map[string]any) map[string]any { return map[string]any{"type": "array", "items": items} }
	return obj(map[string]any{
		"is_correct": map[string]any{"type": "boolean"},
		"corrected":  str,
		"errors": arr(obj(map[string]any{
			"type": map[string]any{"type": "string", "enum": sentenceErrorTypes}, "original": str, "correction": str, "explanation": str,
		}, "type", "original", "correction", "explanation")),
		"translation":    str,
		"structure":      arr(obj(map[string]any{"text": str, "role": str, "note": str}, "text", "role", "note")),
		"grammar_points": arr(obj(map[string]any{"name": str, "explanation": str}, "name", "explanation")),
		"vocabulary": arr(obj(map[string]any{
			"term": str, "phonetic": str, "meaning": str,
			"part_of_speech": map[string]any{"type": "string", "enum": suggestPartsOfSpeechEnum},
			"level":          map[string]any{"type": "string", "enum": suggestLevelsEnum},
		}, "term", "phonetic", "meaning", "part_of_speech", "level")),
	}, "is_correct", "corrected", "errors", "translation", "structure", "grammar_points", "vocabulary")
}()

func (s *SentenceAnalyzer) askAI(ctx context.Context, languageID, sentence string) (SentenceAnalysis, error) {
	text, err := s.ai.GenerateJSON(ctx, AIJSONRequest{
		System:    analysisSystemPrompt,
		User:      fmt.Sprintf("Target language: %s\nSentence: %s", suggestLanguageNames[languageID], sentence),
		Schema:    sentenceAnalysisSchema,
		MaxTokens: 4096,
	})
	if err != nil {
		return SentenceAnalysis{}, err
	}
	var out SentenceAnalysis
	if err := json.Unmarshal([]byte(strings.TrimSpace(text)), &out); err != nil {
		return SentenceAnalysis{}, errAIBadFormat(err)
	}
	sanitizeAnalysis(&out)
	return out, nil
}

// sanitizeAnalysis — giới hạn độ dài danh sách, bỏ mã không hợp lệ (enum trong schema chỉ là "cố gắng" với một số model)
func sanitizeAnalysis(a *SentenceAnalysis) {
	a.Errors = firstN(a.Errors, maxAnalysisErrors)
	for i := range a.Errors {
		if !slices.Contains(sentenceErrorTypes, a.Errors[i].Type) {
			a.Errors[i].Type = "other"
		}
	}
	if len(a.Errors) > 0 {
		a.IsCorrect = false
	}
	a.Structure = firstN(a.Structure, maxAnalysisParts)
	a.GrammarPoints = firstN(a.GrammarPoints, maxAnalysisGrammarPoints)
	a.Vocabulary = firstN(a.Vocabulary, maxAnalysisWords)
	for i := range a.Vocabulary {
		if !partsOfSpeech[a.Vocabulary[i].PartOfSpeech] {
			a.Vocabulary[i].PartOfSpeech = ""
		}
		if !slices.Contains(suggestLevelsEnum, a.Vocabulary[i].Level) {
			a.Vocabulary[i].Level = ""
		}
		a.Vocabulary[i].Phonetic = strings.Trim(a.Vocabulary[i].Phonetic, "/[] ")
	}
}

// firstN — tối đa n phần tử, nil → slice rỗng (JSON trả [] thay vì null)
func firstN[T any](s []T, n int) []T {
	if len(s) > n {
		return s[:n]
	}
	if s == nil {
		return []T{}
	}
	return s
}
