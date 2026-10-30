package service

import (
	"context"
	"slices"
	"strings"
	"testing"

	"laclingo-backend/internal/repository/db"
)

// withUILocales đặt UI_LOCALES cho 1 test rồi trả lại mặc định
func withUILocales(t *testing.T, locales ...string) {
	t.Helper()
	SetUILocales(locales)
	t.Cleanup(func() { SetUILocales(defaultUILocales) })
}

func TestParseContentLocaleCustomConfig(t *testing.T) {
	withUILocales(t, "vi", "en", "fr", "pt-br")
	cases := map[string]string{
		"fr":             "fr",
		"fr-CA,fr;q=0.9": "fr",
		"pt-BR":          "pt-br", // khớp nguyên mã trước
		"pt_br":          "pt-br",
		"pt-PT":          "", // chỉ cấu hình pt-br, không có "pt"
		"en-GB":          "en",
		"zh":             "", // không còn trong cấu hình → tiếng Việt
		"ja":             "",
		"vi":             "",
	}
	for header, want := range cases {
		if got := ParseContentLocale(header); got != want {
			t.Errorf("ParseContentLocale(%q) = %q, want %q", header, got, want)
		}
	}
}

func TestSetUILocalesForcesVietnamese(t *testing.T) {
	withUILocales(t, "en", "fr")
	if got := UILocales(); !slices.Equal(got, []string{"vi", "en", "fr"}) {
		t.Fatalf("UILocales = %v", got)
	}
	if got := contentLocales(); !slices.Equal(got, []string{"en", "fr"}) {
		t.Fatalf("contentLocales = %v", got)
	}
}

func TestListUILocales(t *testing.T) {
	withUILocales(t, "vi", "en", "fr", "pt-br", "xx")
	got := ListUILocales()
	want := []UILocale{
		{"vi", "Tiếng Việt", "🇻🇳"},
		{"en", "English", "🇬🇧"},
		{"fr", "Français", "🇫🇷"},
		{"pt-br", "Português", "🇧🇷"}, // theo phần ngôn ngữ
		{"xx", "xx", "🌐"},            // mã lạ → chính mã + 🌐
	}
	if !slices.Equal(got, want) {
		t.Fatalf("ListUILocales = %+v", got)
	}
}

func TestContentTranslationWorkerUsesConfiguredLocales(t *testing.T) {
	withUILocales(t, "vi", "en", "fr")
	w := newContentTranslationWorker(nil, nil)
	if !slices.Equal(w.locales, []string{"en", "fr"}) {
		t.Fatalf("worker locales = %v", w.locales)
	}
	for locale, want := range map[string]string{
		"en": "English", "zh": "Simplified Chinese", "fr": "French", "ko": "Korean",
		"zh-tw": "the language with BCP-47 tag zh-tw", // không coi zh-tw là tiếng Trung giản thể
	} {
		if got := contentLocaleName(locale); got != want {
			t.Errorf("contentLocaleName(%q) = %q, want %q", locale, got, want)
		}
	}
}

func TestLanguageCatalogHasMetadata(t *testing.T) {
	for _, l := range languageCatalog {
		if l.Flag == "" || l.EnglishName == "" || l.PreviewPhrase == "" {
			t.Errorf("%s thiếu thông tin trong languageMetas: %+v", l.ID, l.LanguageInfo)
		}
	}
	if got := languageInfo("xx", "Admin thêm"); got != (LanguageInfo{EnglishName: "Admin thêm"}) {
		t.Errorf("languageInfo(xx) = %+v", got)
	}
	if got := languageInfo("zh-tw", "繁體中文"); got != (LanguageInfo{EnglishName: "繁體中文"}) {
		t.Errorf("languageInfo(zh-tw) = %+v", got)
	}
	if got := languageEnglishName("ko", "ko"); got != "Korean" {
		t.Errorf("languageEnglishName(ko) = %q", got)
	}
}

func TestLanguageListMetadataAndTopicCount(t *testing.T) {
	s := NewLanguageService(catalogRepo{
		langs:  []db.Language{{ID: "ja", Name: "日本語 (Tiếng Nhật)", Code: "ja-JP"}, {ID: "xx", Name: "Admin thêm", Code: "xx"}},
		topics: []db.ListLanguageTopicCountsRow{{LanguageID: "ja", TopicCount: 7}},
	})
	got, err := s.List(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	if got[0].Flag != "🇯🇵" || got[0].EnglishName != "Japanese" || got[0].TopicCount != 7 || got[0].Code != "ja-JP" {
		t.Errorf("ja = %+v", got[0])
	}
	if got[1].Flag != "" || got[1].EnglishName != "Admin thêm" || got[1].TopicCount != 0 {
		t.Errorf("xx = %+v", got[1])
	}
}

func TestSuggestPromptUsesCatalogEnglishName(t *testing.T) {
	for id, want := range map[string]string{"ja": "Target language: Japanese\n", "ko": "Target language: Korean\n", "en": "Target language: English\n"} {
		if p := suggestUserPrompt(id, "x", "", nil); !strings.HasPrefix(p, want) {
			t.Errorf("suggestUserPrompt(%s) = %q", id, p)
		}
	}
}
