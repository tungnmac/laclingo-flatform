package service

import (
	"fmt"
	"strings"
	"unicode/utf8"
)

// duplicateError — lỗi tạo/sửa trùng dữ liệu: Error() là câu báo cụ thể, errors.Is(err, ErrDuplicate) → HTTP 409
type duplicateError struct{ msg string }

func (e *duplicateError) Error() string { return e.msg }
func (e *duplicateError) Unwrap() error { return ErrDuplicate }

func newDuplicate(format string, args ...any) error {
	return &duplicateError{msg: fmt.Sprintf(format, args...)}
}

// asDuplicate đổi lỗi vi phạm ràng buộc duy nhất (tạo/sửa trùng — xem migration 000034) thành lỗi trùng với
// câu báo msg; lỗi khác giữ nguyên.
func asDuplicate(err error, msg string) error {
	if isPgError(err, pgUniqueViolation) {
		return &duplicateError{msg: msg}
	}
	return err
}

// shortText — nội dung đưa vào câu báo trùng: bỏ khoảng trắng 2 đầu, dài quá 60 ký tự thì cắt kèm "…"
func shortText(s string) string {
	s = strings.TrimSpace(s)
	if utf8.RuneCountInString(s) <= 60 {
		return s
	}
	return string([]rune(s)[:60]) + "…"
}
