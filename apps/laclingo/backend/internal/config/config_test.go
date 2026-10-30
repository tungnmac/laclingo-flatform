package config

import (
	"slices"
	"testing"
)

func TestParseUILocales(t *testing.T) {
	cases := map[string][]string{
		"":                     {"vi", "en", "zh", "ja", "ko"}, // mặc định
		"vi,en,zh,ja,ko,fr":    {"vi", "en", "zh", "ja", "ko", "fr"},
		" EN , fr,en,, pt_BR ": {"vi", "en", "fr", "pt-br"}, // chuẩn hoá, bỏ trùng / rỗng, vi luôn có
		"en,vi":                {"vi", "en"},                // vi luôn đứng đầu
		"vi":                   {"vi"},
		"zh-tw,zh":             {"vi", "zh-tw", "zh"},
		"fil":                  {"vi", "fil"},
	}
	for raw, want := range cases {
		got, err := ParseUILocales(raw)
		if err != nil || !slices.Equal(got, want) {
			t.Errorf("ParseUILocales(%q) = %v, %v; want %v", raw, got, err, want)
		}
	}
	for _, bad := range []string{"english", "e", "en-", "zh-hant", "en;fr", "12", "fr-FR-x"} {
		if got, err := ParseUILocales(bad); err == nil {
			t.Errorf("ParseUILocales(%q) = %v, muốn lỗi", bad, got)
		}
	}
}

func TestLoadUILocales(t *testing.T) {
	t.Setenv("UI_LOCALES", "vi,en,fr")
	cfg, err := Load()
	if err != nil {
		t.Fatal(err)
	}
	if !slices.Equal(cfg.UILocales, []string{"vi", "en", "fr"}) {
		t.Fatalf("UILocales = %v", cfg.UILocales)
	}
	t.Setenv("UI_LOCALES", "vi,???")
	if _, err := Load(); err == nil {
		t.Fatal("UI_LOCALES sai dạng phải làm Load lỗi")
	}
}
