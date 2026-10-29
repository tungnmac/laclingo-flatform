package service

import (
	"regexp"
	"strings"
	"time"
	"unicode"
	"unicode/utf8"
)

// maxMentionsPerComment — số người tối đa nhận thông báo "được nhắc tên" cho 1 bình luận (chống spam)
const maxMentionsPerComment = 10

// Chống spam tag: mỗi người tối đa maxMentionNoticesPerHour thông báo tag / giờ; tag lại cùng 1 người trong
// mentionPairWindow (dù ở comment khác) thì không báo thêm
const (
	maxMentionNoticesPerHour = 30
	mentionPairWindow        = 10 * time.Minute
)

// @username đứng đầu dòng hoặc sau ký tự không phải chữ/số/@/./`/`/: (loại email "a@b.com", URL ".../@kenh").
// Username theo luật đăng ký: [a-z0-9] ở 2 đầu, giữa được . _ - (xem usernameRegex).
var mentionPattern = regexp.MustCompile(`(?:^|[^\p{L}\p{N}_@./:])@([a-z0-9][a-z0-9._-]*[a-z0-9])`)

// Đoạn code `...` / ```...``` — @ trong code (vd @Override) không phải nhắc tên
var codePattern = regexp.MustCompile("(?s)```.*?```|`[^`\n]*`")

// extractMentions trả các username được nhắc trong nội dung (chữ thường, không trùng, giữ thứ tự, tối đa 10)
func extractMentions(content string) []string {
	text := codePattern.ReplaceAllString(strings.ToLower(content), " ")
	var out []string
	seen := map[string]bool{}
	for _, m := range mentionPattern.FindAllStringSubmatchIndex(text, -1) {
		name := text[m[2]:m[3]]
		// Ngay sau tên là chữ/số khác (vd "@nguyễn" → regex chỉ khớp "nguy") → không phải 1 username trọn vẹn
		if next, _ := utf8.DecodeRuneInString(text[m[3]:]); unicode.IsLetter(next) || unicode.IsDigit(next) {
			continue
		}
		if n := len(name); n < minUsernameLen || n > maxUsernameLen || seen[name] {
			continue
		}
		seen[name] = true
		out = append(out, name)
		if len(out) == maxMentionsPerComment {
			break
		}
	}
	return out
}

// addedMentions — username được tag trong nội dung MỚI mà nội dung cũ chưa tag (sửa comment chỉ báo người mới,
// kể cả comment đăng trước khi có nhật ký blog_mention_notices)
func addedMentions(oldContent, newContent string) []string {
	old := map[string]bool{}
	for _, name := range extractMentions(oldContent) {
		old[name] = true
	}
	var out []string
	for _, name := range extractMentions(newContent) {
		if !old[name] {
			out = append(out, name)
		}
	}
	return out
}
