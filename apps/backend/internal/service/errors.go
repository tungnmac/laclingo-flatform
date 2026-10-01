package service

import "errors"

var (
	ErrNotFound           = errors.New("không tìm thấy dữ liệu")
	ErrInvalidInput       = errors.New("dữ liệu đầu vào không hợp lệ")
	ErrEmailTaken         = errors.New("email đã được sử dụng")
	ErrUsernameTaken      = errors.New("tên đăng nhập đã được sử dụng")
	ErrInvalidCredentials = errors.New("tài khoản hoặc mật khẩu không đúng")
)
