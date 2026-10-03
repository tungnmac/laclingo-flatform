package service

import "errors"

var (
	ErrNotFound           = errors.New("không tìm thấy dữ liệu")
	ErrInvalidInput       = errors.New("dữ liệu đầu vào không hợp lệ")
	ErrEmailTaken         = errors.New("email đã được sử dụng")
	ErrUsernameTaken      = errors.New("tên đăng nhập đã được sử dụng")
	ErrInvalidCredentials = errors.New("tài khoản hoặc mật khẩu không đúng")
	ErrRoomNotFound       = errors.New("không tìm thấy phòng chơi")
	ErrRoomFull           = errors.New("phòng đã đủ người")
	ErrGameAlreadyStarted = errors.New("trò chơi đã bắt đầu")
	ErrGameFinished       = errors.New("trò chơi đã kết thúc")
	ErrBanned             = errors.New("bạn đã bị mời ra khỏi phòng này")
	ErrForbidden          = errors.New("bạn không có quyền thực hiện hành động này")
)
