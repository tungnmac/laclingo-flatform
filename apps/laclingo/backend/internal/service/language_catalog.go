package service

import "context"

// CatalogLanguage — ngôn ngữ phổ biến user chọn được ở "Học ngôn ngữ mới" kể cả khi kho chưa có (dòng languages tạo
// khi user đầu tiên chọn, nội dung dựng từ chủ đề nguồn — xem LanguageContentService). Không có tiếng Việt: nghĩa từ
// vựng đều là tiếng Việt.
type CatalogLanguage struct {
	ID   string `json:"id" example:"ja"`
	Name string `json:"name" example:"日本語 (Tiếng Nhật)"`
	Code string `json:"code" example:"ja-JP"` // BCP-47 cho đọc phát âm (Web Speech API)
	LanguageInfo
}

// catalogLanguage — cờ / tên tiếng Anh / câu nghe thử lấy từ languageMetas (language_meta.go)
func catalogLanguage(id, name, code string) CatalogLanguage {
	return CatalogLanguage{ID: id, Name: name, Code: code, LanguageInfo: languageInfo(id, name)}
}

var languageCatalog = []CatalogLanguage{
	catalogLanguage("en", "English", "en-US"),
	catalogLanguage("zh", "中文 (Tiếng Trung)", "zh-CN"),
	catalogLanguage("ja", "日本語 (Tiếng Nhật)", "ja-JP"),
	catalogLanguage("ko", "한국어 (Tiếng Hàn)", "ko-KR"),
	catalogLanguage("fr", "Français (Tiếng Pháp)", "fr-FR"),
	catalogLanguage("de", "Deutsch (Tiếng Đức)", "de-DE"),
	catalogLanguage("es", "Español (Tiếng Tây Ban Nha)", "es-ES"),
	catalogLanguage("it", "Italiano (Tiếng Ý)", "it-IT"),
	catalogLanguage("pt", "Português (Tiếng Bồ Đào Nha)", "pt-BR"),
	catalogLanguage("ru", "Русский (Tiếng Nga)", "ru-RU"),
	catalogLanguage("th", "ไทย (Tiếng Thái)", "th-TH"),
	catalogLanguage("id", "Bahasa Indonesia (Tiếng Indonesia)", "id-ID"),
	catalogLanguage("ms", "Bahasa Melayu (Tiếng Mã Lai)", "ms-MY"),
	catalogLanguage("hi", "हिन्दी (Tiếng Hindi)", "hi-IN"),
	catalogLanguage("ar", "العربية (Tiếng Ả Rập)", "ar-SA"),
	catalogLanguage("tr", "Türkçe (Tiếng Thổ Nhĩ Kỳ)", "tr-TR"),
	catalogLanguage("nl", "Nederlands (Tiếng Hà Lan)", "nl-NL"),
	catalogLanguage("pl", "Polski (Tiếng Ba Lan)", "pl-PL"),
	catalogLanguage("sv", "Svenska (Tiếng Thụy Điển)", "sv-SE"),
	catalogLanguage("km", "ខ្មែរ (Tiếng Khmer)", "km-KH"),
}

// CatalogLanguageResponse — ngôn ngữ trong danh mục kèm thang trình độ (web vẽ ô chọn trình độ theo đây)
type CatalogLanguageResponse struct {
	CatalogLanguage
	LevelScale []string `json:"level_scale" example:"N5,N4,N3,N2,N1"`
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

// Catalog — ngôn ngữ chọn được ở "Học ngôn ngữ mới": các ngôn ngữ đã có trong kho trước, rồi tới danh mục phổ biến
func (s *LanguageService) Catalog(ctx context.Context) ([]CatalogLanguageResponse, error) {
	langs, err := s.repo.ListLanguages(ctx)
	if err != nil {
		return nil, err
	}
	seen := make(map[string]bool, len(langs))
	results := make([]CatalogLanguageResponse, 0, len(langs)+len(languageCatalog))
	for _, l := range langs {
		seen[l.ID] = true
		if l.ID == nativeLanguageID {
			continue
		}
		results = append(results, CatalogLanguageResponse{catalogLanguage(l.ID, l.Name, l.Code), LevelScale(l.ID)})
	}
	for _, l := range languageCatalog {
		if !seen[l.ID] {
			results = append(results, CatalogLanguageResponse{l, LevelScale(l.ID)})
		}
	}
	return results, nil
}
