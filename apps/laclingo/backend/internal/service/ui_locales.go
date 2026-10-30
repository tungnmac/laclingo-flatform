package service

import (
	"slices"
	"sync/atomic"
)

// Ngôn ngữ giao diện (UI locale) — khác "ngôn ngữ học" (bảng languages). Danh sách lấy từ cấu hình UI_LOCALES
// (config.ParseUILocales, main gọi SetUILocales lúc khởi động): GET /locales trả cho web vẽ ô chọn ngôn ngữ, worker dịch
// nội dung học sang mọi ngôn ngữ trừ tiếng Việt, ParseContentLocale chỉ nhận các ngôn ngữ này. Thêm ngôn ngữ giao diện
// mới = sửa UI_LOCALES (không sửa code): nội dung học tự được dịch ở lượt worker kế tiếp.

// defaultUILocales — khi chưa gọi SetUILocales (test, công cụ) — khớp config.DefaultUILocales
var defaultUILocales = []string{nativeLanguageID, "en", "zh", "ja", "ko"}

var uiLocales atomic.Pointer[[]string]

// SetUILocales đặt danh sách ngôn ngữ giao diện (đã chuẩn hoá ở config: chữ thường, không trùng, vi đứng đầu). Gọi 1
// lần lúc khởi động, trước khi nhận request / chạy worker.
func SetUILocales(locales []string) {
	l := slices.Clone(locales)
	if !slices.Contains(l, nativeLanguageID) {
		l = append([]string{nativeLanguageID}, l...)
	}
	uiLocales.Store(&l)
}

// UILocales — mã các ngôn ngữ giao diện, tiếng Việt đứng đầu. Trả bản sao.
func UILocales() []string {
	if p := uiLocales.Load(); p != nil {
		return slices.Clone(*p)
	}
	return slices.Clone(defaultUILocales)
}

// contentLocales — ngôn ngữ giao diện có bản dịch nội dung (tiếng Việt là nguồn, không dịch)
func contentLocales() []string {
	return slices.DeleteFunc(UILocales(), func(l string) bool { return l == nativeLanguageID })
}

// UILocale — 1 ngôn ngữ giao diện trả cho web (GET /locales)
type UILocale struct {
	Code       string `json:"code" example:"ja"`
	NativeName string `json:"native_name" example:"日本語"` // mã lạ (không có trong languageMetas) → chính mã
	Flag       string `json:"flag" example:"🇯🇵"`         // mã lạ → 🌐
}

// ListUILocales — ngôn ngữ giao diện đang cấu hình kèm tên bản ngữ + cờ
func ListUILocales() []UILocale {
	codes := UILocales()
	out := make([]UILocale, 0, len(codes))
	for _, code := range codes {
		l := UILocale{Code: code, NativeName: code, Flag: "🌐"}
		if m, ok := lookupLanguageMeta(code); ok {
			l.NativeName, l.Flag = m.nativeName, m.flag
		}
		out = append(out, l)
	}
	return out
}
