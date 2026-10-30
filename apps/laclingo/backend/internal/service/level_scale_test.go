package service

import (
	"errors"
	"slices"
	"strings"
	"testing"
)

func TestLevelScale(t *testing.T) {
	cases := map[string][]string{
		"ja":    {"N5", "N4", "N3", "N2", "N1"},
		"zh":    {"HSK1", "HSK2", "HSK3", "HSK4", "HSK5", "HSK6"},
		"zh-TW": {"HSK1", "HSK2", "HSK3", "HSK4", "HSK5", "HSK6"},
		"ko":    {"TOPIK1", "TOPIK2", "TOPIK3", "TOPIK4", "TOPIK5", "TOPIK6"},
		"en":    {"A1", "A2", "B1", "B2", "C1", "C2"},
		"fr":    {"A1", "A2", "B1", "B2", "C1", "C2"},
		"":      {"A1", "A2", "B1", "B2", "C1", "C2"},
	}
	for lang, want := range cases {
		if got := LevelScale(lang); !slices.Equal(got, want) {
			t.Errorf("LevelScale(%q) = %v, want %v", lang, got, want)
		}
	}
	// Trả bản sao — caller sửa không làm hỏng registry
	LevelScale("ja")[0] = "X"
	if LevelScale("ja")[0] != "N5" {
		t.Error("LevelScale must return a copy")
	}
}

func TestLevelRankOrdering(t *testing.T) {
	// Thứ bậc tăng dần theo đúng thứ tự thang (chuỗi "N5" > "N1" nhưng N5 là bậc thấp nhất)
	for _, lang := range []string{"en", "ja", "zh", "ko"} {
		scale := LevelScale(lang)
		for i, code := range scale {
			if got := levelRank(code); got != i+1 {
				t.Errorf("levelRank(%q) = %d, want %d", code, got, i+1)
			}
		}
	}
	for _, bad := range []string{"", "a1", "N6", "HSK7", "TOPIK0", "X"} {
		if levelRank(bad) != 0 {
			t.Errorf("levelRank(%q) should be 0", bad)
		}
	}
}

func TestConvertLevel(t *testing.T) {
	cases := []struct{ level, to, want string }{
		{"A1", "ja", "N5"}, {"A2", "ja", "N4"}, {"B1", "ja", "N3"}, {"B2", "ja", "N2"}, {"C1", "ja", "N1"}, {"C2", "ja", "N1"},
		{"A1", "zh", "HSK1"}, {"C2", "zh", "HSK6"}, {"B1", "ko", "TOPIK3"}, {"C2", "ko", "TOPIK6"},
		{"N5", "en", "A1"}, {"N1", "en", "C1"}, {"HSK6", "ja", "N1"}, {"TOPIK2", "zh", "HSK2"}, {"N3", "ko", "TOPIK3"},
		{"b1", "ja", "N3"}, {" B2 ", "zh", "HSK4"}, // chuẩn hoá hoa/thường, khoảng trắng
		{"N3", "ja", "N3"}, {"HSK4", "zh-TW", "HSK4"}, // cùng thang giữ nguyên
		{"", "ja", ""}, {"Z9", "en", ""}, // mã lạ → rỗng
	}
	for _, c := range cases {
		if got := convertLevel(c.level, c.to); got != c.want {
			t.Errorf("convertLevel(%q, %q) = %q, want %q", c.level, c.to, got, c.want)
		}
	}
}

func TestNormalizeLevel(t *testing.T) {
	valid := []struct{ lang, in, want string }{
		{"ja", " n3 ", "N3"}, {"en", "b1", "B1"}, {"zh", "hsk2", "HSK2"}, {"ko", "TOPIK6", "TOPIK6"}, {"ja", "", ""}, {"en", "  ", ""},
	}
	for _, c := range valid {
		level := c.in
		if err := normalizeLevel(c.lang, &level); err != nil || level != c.want {
			t.Errorf("normalizeLevel(%q, %q) = %q, %v; want %q", c.lang, c.in, level, err, c.want)
		}
	}
	invalid := []struct{ lang, in string }{{"ja", "B1"}, {"en", "N3"}, {"zh", "A1"}, {"ko", "HSK1"}, {"ja", "N6"}, {"fr", "HSK1"}}
	for _, c := range invalid {
		level := c.in
		if err := normalizeLevel(c.lang, &level); !errors.Is(err, ErrInvalidInput) {
			t.Errorf("normalizeLevel(%q, %q) should fail, got %v", c.lang, c.in, err)
		}
	}
}

func TestLevelForRankClamps(t *testing.T) {
	if got := levelForRank("ja", 6); got != "N1" {
		t.Errorf("ja rank 6 = %q, want N1", got)
	}
	if got := levelForRank("ja", 3); got != "N3" {
		t.Errorf("ja rank 3 = %q, want N3", got)
	}
	if got := levelForRank("en", 0); got != "A1" {
		t.Errorf("en rank 0 = %q, want A1", got)
	}
}

func TestSpeakingDefaultLevelPerLanguage(t *testing.T) {
	req := SpeakingItemRequest{LanguageID: "ja", Topic: "T", Kind: SpeakingKindRepeat, Prompt: "こんにちは"}
	if err := validateSpeakingItem(&req); err != nil || req.Level != "N3" {
		t.Fatalf("ja default level = %q, %v; want N3", req.Level, err)
	}
	req = SpeakingItemRequest{LanguageID: "en", Topic: "T", Kind: SpeakingKindRepeat, Prompt: "Hello", Level: "N3"}
	if err := validateSpeakingItem(&req); !errors.Is(err, ErrInvalidInput) {
		t.Fatalf("en N3 should be rejected, got %v", err)
	}
	req = SpeakingItemRequest{LanguageID: "zh", Topic: "T", Kind: SpeakingKindRepeat, Prompt: "你好", Level: "hsk2"}
	if err := validateSpeakingItem(&req); err != nil || req.Level != "HSK2" {
		t.Fatalf("zh hsk2 = %q, %v; want HSK2", req.Level, err)
	}
}

func TestAISuggestionLevelPerLanguage(t *testing.T) {
	ai, err := parseAISuggestion(`{"level":"N4"}`, "ja")
	if err != nil || ai.Level != "N4" {
		t.Fatalf("ja N4 = %q, %v", ai.Level, err)
	}
	if ai, _ := parseAISuggestion(`{"level":"B1"}`, "ja"); ai.Level != "" {
		t.Errorf("CEFR level for ja must be dropped, got %q", ai.Level)
	}
	enum := suggestionSchema("zh")["properties"].(map[string]any)["level"].(map[string]any)["enum"].([]string)
	if !slices.Equal(enum, LevelScale("zh")) {
		t.Errorf("zh schema enum = %v", enum)
	}
	if p := suggestUserPrompt("ko", "사랑", "", nil); !strings.Contains(p, "TOPIK1, TOPIK2, TOPIK3, TOPIK4, TOPIK5, TOPIK6") || !strings.Contains(p, "사랑") {
		t.Errorf("prompt missing level scale: %q", p)
	}
}
