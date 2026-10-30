package service

import "strings"

// Thông tin chung của 1 ngôn ngữ theo mã ISO 639-1 — nguồn duy nhất cho cả ngôn ngữ học (cờ, tên tiếng Anh cho prompt
// AI, câu nghe thử giọng đọc — trả trong /languages*) lẫn ngôn ngữ giao diện (tên bản ngữ + cờ — GET /locales). Web chỉ
// giữ bản sao nhỏ làm dự phòng khi chưa tải được API. Thêm ngôn ngữ: thêm 1 dòng ở đây (+ danh mục "Học ngôn ngữ mới"
// trong language_catalog.go nếu muốn học viên tự chọn được).
type languageMeta struct {
	nativeName    string // tên bản ngữ (ô chọn ngôn ngữ giao diện)
	englishName   string // tên trong prompt AI
	flag          string // emoji cờ
	previewPhrase string // câu "Nghe thử" giọng đọc ở trang Hồ sơ
}

var languageMetas = map[string]languageMeta{
	"vi": {"Tiếng Việt", "Vietnamese", "🇻🇳", "Xin chào, rất vui được gặp bạn."},
	"en": {"English", "English", "🇬🇧", "Hello, nice to meet you."},
	"zh": {"中文", "Chinese (Mandarin, simplified characters)", "🇨🇳", "你好，很高兴认识你。"},
	"ja": {"日本語", "Japanese", "🇯🇵", "こんにちは、はじめまして。"},
	"ko": {"한국어", "Korean", "🇰🇷", "안녕하세요, 반갑습니다."},
	"fr": {"Français", "French", "🇫🇷", "Bonjour, ravi de vous rencontrer."},
	"de": {"Deutsch", "German", "🇩🇪", "Hallo, schön dich kennenzulernen."},
	"es": {"Español", "Spanish", "🇪🇸", "Hola, encantado de conocerte."},
	"it": {"Italiano", "Italian", "🇮🇹", "Ciao, piacere di conoscerti."},
	"pt": {"Português", "Portuguese (Brazilian)", "🇧🇷", "Olá, prazer em conhecer você."},
	"ru": {"Русский", "Russian", "🇷🇺", "Здравствуйте, приятно познакомиться."},
	"th": {"ไทย", "Thai", "🇹🇭", "สวัสดี ยินดีที่ได้รู้จัก"},
	"id": {"Bahasa Indonesia", "Indonesian", "🇮🇩", "Halo, senang berkenalan dengan Anda."},
	"ms": {"Bahasa Melayu", "Malay", "🇲🇾", "Helo, gembira berkenalan dengan anda."},
	"hi": {"हिन्दी", "Hindi", "🇮🇳", "नमस्ते, आपसे मिलकर खुशी हुई।"},
	"ar": {"العربية", "Arabic (Modern Standard)", "🇸🇦", "مرحبًا، سعيد بلقائك."},
	"tr": {"Türkçe", "Turkish", "🇹🇷", "Merhaba, tanıştığıma memnun oldum."},
	"nl": {"Nederlands", "Dutch", "🇳🇱", "Hallo, leuk je te ontmoeten."},
	"pl": {"Polski", "Polish", "🇵🇱", "Cześć, miło cię poznać."},
	"sv": {"Svenska", "Swedish", "🇸🇪", "Hej, trevligt att träffas."},
	"km": {"ខ្មែរ", "Khmer", "🇰🇭", "សួស្តី រីករាយដែលបានស្គាល់អ្នក។"},
}

// lookupLanguageMeta — theo nguyên mã, không có thì theo phần ngôn ngữ ("pt-br" → "pt")
func lookupLanguageMeta(id string) (languageMeta, bool) {
	id = strings.ToLower(strings.TrimSpace(id))
	if m, ok := languageMetas[id]; ok {
		return m, true
	}
	base, _, _ := strings.Cut(strings.ReplaceAll(id, "_", "-"), "-")
	m, ok := languageMetas[base]
	return m, ok
}

// LanguageInfo — thông tin hiển thị / AI kèm mỗi ngôn ngữ học trong /languages, /languages/:id, /languages/catalog. Mã
// đọc phát âm (BCP-47, Web Speech API) là ô `code` sẵn có của ngôn ngữ.
type LanguageInfo struct {
	Flag          string `json:"flag" example:"🇯🇵"`               // "" = ngôn ngữ admin tự thêm chưa có cờ (web hiện 🌐)
	EnglishName   string `json:"english_name" example:"Japanese"` // tên tiếng Anh (prompt AI); ngôn ngữ lạ → tên trong kho
	PreviewPhrase string `json:"preview_phrase,omitempty" example:"こんにちは、はじめまして。"`
}

// languageInfo — fallbackName: tên trong kho, dùng làm tên tiếng Anh khi ngôn ngữ chưa có trong languageMetas. Khớp
// nguyên mã (ngôn ngữ học admin tự thêm như "zh-tw" không được nhận nhầm tên / cờ của "zh" giản thể trong prompt AI)
func languageInfo(id, fallbackName string) LanguageInfo {
	m, ok := languageMetas[id]
	if !ok {
		return LanguageInfo{EnglishName: fallbackName}
	}
	return LanguageInfo{Flag: m.flag, EnglishName: m.englishName, PreviewPhrase: m.previewPhrase}
}

// languageEnglishName — tên ngôn ngữ cho prompt AI (ngôn ngữ admin tự thêm ngoài danh mục thì dùng fallback)
func languageEnglishName(id, fallback string) string {
	return languageInfo(id, fallback).EnglishName
}
