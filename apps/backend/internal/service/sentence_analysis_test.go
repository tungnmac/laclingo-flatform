package service

import (
	"context"
	"errors"
	"strings"
	"testing"

	"laclingo-backend/internal/repository/db"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

// fakeAnalysisRepo — lượt dùng theo ngày trong bộ nhớ + kho từ vựng giả
type fakeAnalysisRepo struct {
	used    map[string]int32
	vocab   map[string]uuid.UUID // term → id
	refunds int
}

func newFakeAnalysisRepo() *fakeAnalysisRepo {
	return &fakeAnalysisRepo{used: map[string]int32{}, vocab: map[string]uuid.UUID{}}
}

func dayKey(u pgtype.UUID, d pgtype.Date) string {
	return uuid.UUID(u.Bytes).String() + d.Time.Format("2006-01-02")
}

func (f *fakeAnalysisRepo) UseSentenceAnalysisQuota(_ context.Context, a db.UseSentenceAnalysisQuotaParams) (int32, error) {
	k := dayKey(a.UserID, a.UsageDate)
	if f.used[k] >= a.DailyLimit {
		return 0, pgx.ErrNoRows
	}
	f.used[k]++
	return f.used[k], nil
}
func (f *fakeAnalysisRepo) RefundSentenceAnalysisQuota(_ context.Context, a db.RefundSentenceAnalysisQuotaParams) error {
	f.refunds++
	if k := dayKey(a.UserID, a.UsageDate); f.used[k] > 0 {
		f.used[k]--
	}
	return nil
}
func (f *fakeAnalysisRepo) GetSentenceAnalysisUsage(_ context.Context, a db.GetSentenceAnalysisUsageParams) (int32, error) {
	return f.used[dayKey(a.UserID, a.UsageDate)], nil
}
func (f *fakeAnalysisRepo) FindVocabulariesByTerms(_ context.Context, a db.FindVocabulariesByTermsParams) ([]db.FindVocabulariesByTermsRow, error) {
	var out []db.FindVocabulariesByTermsRow
	for _, t := range a.Terms {
		if id, ok := f.vocab[termKey(t)]; ok {
			out = append(out, db.FindVocabulariesByTermsRow{ID: toPgUUID(id), Term: t})
		}
	}
	return out, nil
}

// fakeAI — trả JSON cố định (hoặc lỗi), đếm số lần gọi
type fakeAI struct {
	answer string
	err    error
	calls  int
	last   AIJSONRequest
}

func (f *fakeAI) GenerateJSON(_ context.Context, req AIJSONRequest) (string, error) {
	f.calls++
	f.last = req
	return f.answer, f.err
}

const analysisAnswer = `{"is_correct": true, "corrected": "I am interested in learning English.",
 "errors": [{"type": "preposition", "original": "about", "correction": "in", "explanation": "interested đi với in"},
            {"type": "weird", "original": "", "correction": "x", "explanation": "?"}],
 "translation": "Tôi quan tâm đến việc học tiếng Anh.",
 "structure": [{"text": "I", "role": "Chủ ngữ", "note": ""}],
 "grammar_points": [{"name": "be interested in + V-ing", "explanation": "..."}],
 "vocabulary": [{"term": "Interested", "phonetic": "/ˈɪntrəstɪd/", "meaning": "quan tâm", "part_of_speech": "adj", "level": "A2"},
                {"term": "learn", "phonetic": "lɝn", "meaning": "học", "part_of_speech": "verbish", "level": "Z9"}]}`

func TestAnalyzeSentence(t *testing.T) {
	repo := newFakeAnalysisRepo()
	vid := uuid.New()
	repo.vocab["interested"] = vid
	ai := &fakeAI{answer: analysisAnswer}
	s := NewSentenceAnalyzer(repo, ai)
	user := uuid.New()

	got, err := s.Analyze(context.Background(), user, SentenceAnalyzeRequest{LanguageID: "en", Sentence: "  I am interested   about learning English. "})
	if err != nil {
		t.Fatal(err)
	}
	if got.Sentence != "I am interested about learning English." || got.Cached || got.Remaining != SentenceAnalysisDailyLimit-1 {
		t.Fatalf("sentence/cached/remaining: %+v", got)
	}
	if got.IsCorrect { // có lỗi thì không thể "đúng" dù AI trả true
		t.Error("errors present → is_correct must be false")
	}
	if got.Errors[1].Type != "other" {
		t.Errorf("unknown error type → other, got %q", got.Errors[1].Type)
	}
	w := got.Vocabulary
	if w[0].VocabularyID == nil || *w[0].VocabularyID != vid || w[0].Phonetic != "ˈɪntrəstɪd" {
		t.Errorf("vocab link/phonetic: %+v", w[0])
	}
	if w[1].VocabularyID != nil || w[1].PartOfSpeech != "" || w[1].Level != "" {
		t.Errorf("invalid pos/level dropped, not in app: %+v", w[1])
	}
	if !strings.Contains(ai.last.User, "English") || !strings.Contains(ai.last.User, "interested about") {
		t.Errorf("prompt: %q", ai.last.User)
	}

	// Cùng câu (khác khoảng trắng), người khác → cache, không gọi AI, không trừ lượt.
	// Từ vừa bị xoá khỏi kho → kết quả cache không còn gắn vocabulary_id cũ (đối chiếu lại mỗi lần)
	delete(repo.vocab, "interested")
	other := uuid.New()
	again, err := s.Analyze(context.Background(), other, SentenceAnalyzeRequest{LanguageID: "en", Sentence: "I am interested about learning English."})
	if err != nil || !again.Cached || again.Remaining != SentenceAnalysisDailyLimit || ai.calls != 1 {
		t.Fatalf("cache: cached=%v remaining=%d calls=%d err=%v", again.Cached, again.Remaining, ai.calls, err)
	}
	if again.Vocabulary[0].VocabularyID != nil {
		t.Error("deleted vocabulary must not stay linked in cached result")
	}
	if got.Vocabulary[0].VocabularyID == nil {
		t.Error("first result must keep its own link (cache must not share the slice)")
	}
}

func TestAnalyzeSentenceQuotaAndErrors(t *testing.T) {
	ctx := context.Background()
	user := uuid.New()

	if _, err := NewSentenceAnalyzer(newFakeAnalysisRepo(), &fakeAI{answer: analysisAnswer}).Analyze(ctx, user, SentenceAnalyzeRequest{LanguageID: "ja", Sentence: "x"}); !errors.Is(err, ErrInvalidInput) {
		t.Errorf("unsupported language → ErrInvalidInput, got %v", err)
	}
	if _, err := NewSentenceAnalyzer(newFakeAnalysisRepo(), &fakeAI{answer: analysisAnswer}).Analyze(ctx, user, SentenceAnalyzeRequest{LanguageID: "en", Sentence: strings.Repeat("a", maxAnalyzeSentenceLen+1)}); !errors.Is(err, ErrInvalidInput) {
		t.Errorf("too long → ErrInvalidInput, got %v", err)
	}
	if _, err := NewSentenceAnalyzer(newFakeAnalysisRepo(), nil).Analyze(ctx, user, SentenceAnalyzeRequest{LanguageID: "en", Sentence: "Hi."}); !errors.Is(err, ErrAINotConfigured) {
		t.Errorf("no AI → ErrAINotConfigured, got %v", err)
	}

	// AI lỗi → ErrAnalysisAIFailed kèm lý do, lượt được hoàn
	repo := newFakeAnalysisRepo()
	s := NewSentenceAnalyzer(repo, &fakeAI{err: &aiError{reason: "đã dùng hết hạn mức miễn phí của Gemini", cause: errors.New("429")}})
	_, err := s.Analyze(ctx, user, SentenceAnalyzeRequest{LanguageID: "zh", Sentence: "我学习中文"})
	if !errors.Is(err, ErrAnalysisAIFailed) || !strings.Contains(err.Error(), "hạn mức") || repo.refunds != 1 {
		t.Fatalf("AI failure: err=%v refunds=%d", err, repo.refunds)
	}
	if q, _ := s.Quota(ctx, user); q.Remaining != SentenceAnalysisDailyLimit {
		t.Errorf("refunded quota, remaining=%d", q.Remaining)
	}

	// Hết lượt
	repo = newFakeAnalysisRepo()
	s = NewSentenceAnalyzer(repo, &fakeAI{answer: analysisAnswer})
	for i := 0; i < SentenceAnalysisDailyLimit; i++ {
		if _, err := s.Analyze(ctx, user, SentenceAnalyzeRequest{LanguageID: "en", Sentence: "Sentence " + strings.Repeat("x", i+1)}); err != nil {
			t.Fatal(err)
		}
	}
	if _, err := s.Analyze(ctx, user, SentenceAnalyzeRequest{LanguageID: "en", Sentence: "One more."}); !errors.Is(err, ErrAnalysisQuotaExceeded) {
		t.Fatalf("over limit → ErrAnalysisQuotaExceeded, got %v", err)
	}
	// Câu đã phân tích vẫn xem lại được khi hết lượt (cache)
	if got, err := s.Analyze(ctx, user, SentenceAnalyzeRequest{LanguageID: "en", Sentence: "Sentence x"}); err != nil || !got.Cached || got.Remaining != 0 {
		t.Fatalf("cached after limit: %+v err=%v", got.SentenceAnalysisQuota, err)
	}
}

func TestToGeminiSchema(t *testing.T) {
	g := toGeminiSchema(sentenceAnalysisSchema)
	if g["type"] != "OBJECT" || g["additionalProperties"] != nil || g["propertyOrdering"] == nil {
		t.Fatalf("root: %v", g)
	}
	props := g["properties"].(map[string]any)
	if props["is_correct"].(map[string]any)["type"] != "BOOLEAN" {
		t.Error("boolean → BOOLEAN")
	}
	item := props["errors"].(map[string]any)["items"].(map[string]any)
	if item["type"] != "OBJECT" || item["additionalProperties"] != nil || item["properties"].(map[string]any)["type"].(map[string]any)["enum"] == nil {
		t.Errorf("nested items: %v", item)
	}
	if sentenceAnalysisSchema["additionalProperties"] != false {
		t.Error("original schema must not be mutated")
	}
}
