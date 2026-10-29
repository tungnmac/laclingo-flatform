package service

import (
	"context"
	"strings"
	"testing"

	"laclingo-backend/internal/repository/db"
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

type catalogRepo struct{ langs []db.Language }

func (r catalogRepo) GetLanguageByID(context.Context, string) (db.Language, error) {
	return db.Language{}, nil
}
func (r catalogRepo) ListLanguages(context.Context) ([]db.Language, error) { return r.langs, nil }

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
