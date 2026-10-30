package service

import (
	"context"
	"errors"
	"strings"
	"testing"
	"time"

	"laclingo-backend/internal/repository/db"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

func TestParseDerivedEntries(t *testing.T) {
	text := `{"items":[
		{"id":"1","term":" はは ","phonetic":"はは (haha)","meaning":"mẹ","part_of_speech":"noun","example":"はははやさしい。","example_meaning":"Mẹ hiền."},
		{"id":"0","term":"ちち","phonetic":"","meaning":"bố","part_of_speech":"xx","example":"","example_meaning":""},
		{"id":"7","term":"ngoài phạm vi","meaning":"x","part_of_speech":"noun"},
		{"id":"2","term":"","meaning":"thiếu term","part_of_speech":"noun"}
	]}`
	got, err := parseDerivedEntries(text, 3)
	if err != nil {
		t.Fatal(err)
	}
	if got[0].Term != "ちち" || got[0].PartOfSpeech != "" {
		t.Fatalf("mục 0 = %+v (từ loại sai phải bỏ)", got[0])
	}
	if got[1].Term != "はは" || got[1].Meaning != "mẹ" {
		t.Fatalf("mục 1 = %+v (phải xếp theo id, bỏ khoảng trắng)", got[1])
	}
	if got[2].Term != "" {
		t.Fatalf("mục 2 thiếu term phải bỏ: %+v", got[2])
	}
	if _, err := parseDerivedEntries("không phải json", 1); err == nil {
		t.Fatal("muốn lỗi khi AI trả sai định dạng")
	}
}

func TestDeriveUserPromptNamesLanguages(t *testing.T) {
	p := deriveUserPrompt(db.Language{ID: "en", Name: "English"}, db.Language{ID: "ja", Name: "日本語 (Tiếng Nhật)"}, "Gia đình",
		[]db.ListTopicSourceWordsRow{{Term: "mother", Meaning: "mẹ"}})
	if !strings.Contains(p, "Target language: Japanese") || !strings.Contains(p, "0 | mother | mẹ |") {
		t.Fatalf("prompt = %q", p)
	}
}

type catalogRepo struct {
	langs  []db.Language
	topics []db.ListLanguageTopicCountsRow
	mine   []string // ngôn ngữ học viên đang học
}

func (r catalogRepo) GetLanguageByID(context.Context, string) (db.Language, error) {
	return db.Language{}, nil
}
func (r catalogRepo) ListLanguages(context.Context) ([]db.Language, error) { return r.langs, nil }
func (r catalogRepo) ListUserLearningLanguageIDs(context.Context, pgtype.UUID) ([]string, error) {
	return r.mine, nil
}
func (r catalogRepo) ListLanguageTopicCounts(context.Context) ([]db.ListLanguageTopicCountsRow, error) {
	return r.topics, nil
}

func TestLanguageCatalogMergesExisting(t *testing.T) {
	s := NewLanguageService(catalogRepo{langs: []db.Language{{ID: "zh", Name: "中文 (Tiếng Trung)", Code: "zh-CN"}, {ID: "xx", Name: "Admin thêm", Code: "xx"}}})
	got, err := s.Catalog(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	if len(got) != len(languageCatalog)+1 || got[0].ID != "zh" || got[1].ID != "xx" {
		t.Fatalf("catalog = %+v", got[:3])
	}
	ids := map[string]int{}
	for _, l := range got {
		ids[l.ID]++
	}
	if ids["zh"] != 1 || ids["ja"] != 1 || ids["vi"] != 0 {
		t.Fatalf("trùng / thiếu ngôn ngữ: %v", ids)
	}
}

func TestCleanDerivedTerm(t *testing.T) {
	cases := map[string]string{
		"おじ (oji)":             "おじ",
		"両親（ryōshin）":          "両親",
		"가족 (gajok)":           "가족",
		"der Hund":             "der Hund",
		"(oji)":                "(oji)",
		"ゲーム機 (PlayStation 5)": "ゲーム機 (PlayStation 5)", // có số → không phải phiên âm, giữ nguyên
		"สวัสดี (sawasdee)":    "สวัสดี",
	}
	for in, want := range cases {
		if got := cleanDerivedTerm(in); got != want {
			t.Errorf("cleanDerivedTerm(%q) = %q, muốn %q", in, got, want)
		}
	}
}

type flakyAI struct{ calls int }

func (f *flakyAI) GenerateJSON(context.Context, AIJSONRequest) (string, error) {
	f.calls++
	if f.calls == 1 {
		return "", &aiError{reason: "dịch vụ AI đang quá tải, thử lại sau", cause: errors.New("503")}
	}
	return `{"items":[{"id":"0","term":"はは (haha)","phonetic":"はは (haha)","meaning":"mẹ","part_of_speech":"noun","example":"","example_meaning":""}]}`, nil
}

func TestAskDeriveAIRetriesOnce(t *testing.T) {
	deriveRetryDelay = 0
	ai := &flakyAI{}
	got, err := askDeriveAI(context.Background(), ai, db.Language{ID: "en"}, db.Language{ID: "ja"}, "Gia đình",
		[]db.ListTopicSourceWordsRow{{Term: "mother", Meaning: "mẹ"}})
	if err != nil || ai.calls != 2 || got[0].Term != "はは" {
		t.Fatalf("calls=%d err=%v got=%+v", ai.calls, err, got)
	}
}

func TestSyncBackoff(t *testing.T) {
	want := map[int32]time.Duration{1: 30 * time.Second, 2: time.Minute, 3: 2 * time.Minute, 7: 30 * time.Minute, 20: 30 * time.Minute}
	for attempts, d := range want {
		if got := syncBackoff(attempts); got != d {
			t.Errorf("syncBackoff(%d) = %v, muốn %v", attempts, got, d)
		}
	}
}

// Mỗi tài khoản chỉ thấy ngôn ngữ mình đang học — ngôn ngữ người khác thêm vào hệ thống không hiện ra
func TestLanguageMine(t *testing.T) {
	repo := catalogRepo{
		langs: []db.Language{{ID: "en", Name: "English"}, {ID: "ja", Name: "Japanese"}, {ID: "ko", Name: "Korean"}, {ID: "ru", Name: "Russian"}},
		mine:  []string{"ru", "en"},
	}
	got, err := NewLanguageService(repo).Mine(context.Background(), uuid.New())
	if err != nil {
		t.Fatal(err)
	}
	if len(got) != 2 || got[0].ID != "en" || got[1].ID != "ru" {
		t.Fatalf("chỉ được en, ru theo thứ tự danh sách chung: %+v", got)
	}

	repo.mine = nil
	if got, _ := NewLanguageService(repo).Mine(context.Background(), uuid.New()); len(got) != 0 {
		t.Fatalf("chưa học ngôn ngữ nào thì danh sách rỗng: %+v", got)
	}
}
