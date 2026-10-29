package service

import "context"

// CatalogLanguage — ngôn ngữ phổ biến user chọn được ở "Học ngôn ngữ mới" kể cả khi kho chưa có (dòng languages tạo
// khi user đầu tiên chọn, nội dung dựng từ chủ đề nguồn — xem LanguageContentService). Không có tiếng Việt: nghĩa từ
// vựng đều là tiếng Việt.
type CatalogLanguage struct {
	ID          string `json:"id" example:"ja"`
	Name        string `json:"name" example:"日本語 (Tiếng Nhật)"`
	Code        string `json:"code" example:"ja-JP"` // BCP-47 cho đọc phát âm (Web Speech API)
	englishName string // tên ngôn ngữ trong prompt AI
}

var languageCatalog = []CatalogLanguage{
	{"en", "English", "en-US", "English"},
	{"zh", "中文 (Tiếng Trung)", "zh-CN", "Chinese (Mandarin, simplified characters)"},
	{"ja", "日本語 (Tiếng Nhật)", "ja-JP", "Japanese"},
	{"ko", "한국어 (Tiếng Hàn)", "ko-KR", "Korean"},
	{"fr", "Français (Tiếng Pháp)", "fr-FR", "French"},
	{"de", "Deutsch (Tiếng Đức)", "de-DE", "German"},
	{"es", "Español (Tiếng Tây Ban Nha)", "es-ES", "Spanish"},
	{"it", "Italiano (Tiếng Ý)", "it-IT", "Italian"},
	{"pt", "Português (Tiếng Bồ Đào Nha)", "pt-BR", "Portuguese (Brazilian)"},
	{"ru", "Русский (Tiếng Nga)", "ru-RU", "Russian"},
	{"th", "ไทย (Tiếng Thái)", "th-TH", "Thai"},
	{"id", "Bahasa Indonesia (Tiếng Indonesia)", "id-ID", "Indonesian"},
	{"ms", "Bahasa Melayu (Tiếng Mã Lai)", "ms-MY", "Malay"},
	{"hi", "हिन्दी (Tiếng Hindi)", "hi-IN", "Hindi"},
	{"ar", "العربية (Tiếng Ả Rập)", "ar-SA", "Arabic (Modern Standard)"},
	{"tr", "Türkçe (Tiếng Thổ Nhĩ Kỳ)", "tr-TR", "Turkish"},
	{"nl", "Nederlands (Tiếng Hà Lan)", "nl-NL", "Dutch"},
	{"pl", "Polski (Tiếng Ba Lan)", "pl-PL", "Polish"},
	{"sv", "Svenska (Tiếng Thụy Điển)", "sv-SE", "Swedish"},
	{"km", "ខ្មែរ (Tiếng Khmer)", "km-KH", "Khmer"},
}

// nativeLanguageID — ngôn ngữ của nghĩa từ vựng: không học / dựng nội dung cho nó
const nativeLanguageID = "vi"

func findCatalogLanguage(id string) (CatalogLanguage, bool) {
	for _, l := range languageCatalog {
		if l.ID == id {
			return l, true
		}
	}
	return CatalogLanguage{}, false
}

// languageEnglishName — tên ngôn ngữ cho prompt AI (ngôn ngữ admin tự thêm ngoài danh mục thì dùng tên trong DB)
func languageEnglishName(id, fallback string) string {
	if l, ok := findCatalogLanguage(id); ok {
		return l.englishName
	}
	return fallback
}

// Catalog — ngôn ngữ chọn được ở "Học ngôn ngữ mới": các ngôn ngữ đã có trong kho trước, rồi tới danh mục phổ biến
func (s *LanguageService) Catalog(ctx context.Context) ([]CatalogLanguage, error) {
	langs, err := s.repo.ListLanguages(ctx)
	if err != nil {
		return nil, err
	}
	seen := make(map[string]bool, len(langs))
	results := make([]CatalogLanguage, 0, len(langs)+len(languageCatalog))
	for _, l := range langs {
		seen[l.ID] = true
		if l.ID == nativeLanguageID {
			continue
		}
		results = append(results, CatalogLanguage{ID: l.ID, Name: l.Name, Code: l.Code})
	}
	for _, l := range languageCatalog {
		if !seen[l.ID] {
			results = append(results, l)
		}
	}
	return results, nil
}
