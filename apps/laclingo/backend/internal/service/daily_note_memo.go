package service

import (
	"html"
	"regexp"
	"strings"

	"github.com/microcosm-cc/bluemonday"
)

// Ghi chú việc trong Nhật ký là rich text (HTML từ trình soạn thảo Tiptap ở web): đậm/nghiêng/gạch, tiêu đề, danh sách,
// trích dẫn, code, link. Lọc bằng UGCPolicy như bài blog (không iframe) — web hiển thị thẳng HTML đã lọc
var taskMemoPolicy = bluemonday.UGCPolicy()

// sanitizeTaskMemo lọc HTML; chỉ còn thẻ rỗng (vd "<p></p>" khi xoá hết chữ) thì coi như không có ghi chú
func sanitizeTaskMemo(memo string) string {
	clean := strings.TrimSpace(taskMemoPolicy.Sanitize(memo))
	if strings.TrimSpace(html.UnescapeString(stripTagsPattern.ReplaceAllString(clean, ""))) == "" {
		return ""
	}
	return clean
}

// Ghi chú cũ (trước khi có rich text) là chữ thường — nhận biết HTML do trình soạn thảo tạo qua thẻ khối đầu tiên
var memoHTMLStart = regexp.MustCompile(`^\s*<(p|h[1-6]|ul|ol|blockquote|pre)[\s>]`)

// taskMemoHTML — ghi chú trả về web luôn là HTML an toàn: chữ thường cũ → mỗi dòng 1 đoạn (escape); HTML → lọc lại
// (dữ liệu cũ chưa từng qua bộ lọc)
func taskMemoHTML(memo string) string {
	if memo == "" {
		return ""
	}
	if !memoHTMLStart.MatchString(memo) {
		var b strings.Builder
		for _, line := range strings.Split(memo, "\n") {
			b.WriteString("<p>" + html.EscapeString(line) + "</p>")
		}
		memo = b.String()
	}
	return sanitizeTaskMemo(memo)
}
