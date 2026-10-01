package service

import "errors"

var (
	ErrNotFound     = errors.New("không tìm thấy dữ liệu")
	ErrInvalidInput = errors.New("dữ liệu đầu vào không hợp lệ")
)
