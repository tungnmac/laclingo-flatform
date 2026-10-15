package service

const (
	DefaultPageSize = 20
	MaxPageSize     = 100
)

// PageResult — kết quả 1 trang, kèm tổng số dòng khớp filter (TRƯỚC khi phân
// trang) để FE vẽ UI phân trang mà không cần gọi thêm 1 API đếm riêng.
type PageResult[T any] struct {
	Items []T   `json:"items"`
	Total int64 `json:"total"`
}

// NormalizePage chuẩn hoá page (bắt đầu từ 1)/pageSize về limit+offset hợp lệ,
// chặn page_size quá lớn để tránh 1 request kéo cả bảng.
func NormalizePage(page, pageSize int32) (limit, offset int32) {
	if pageSize <= 0 {
		pageSize = DefaultPageSize
	}
	if pageSize > MaxPageSize {
		pageSize = MaxPageSize
	}
	if page <= 0 {
		page = 1
	}
	return pageSize, (page - 1) * pageSize
}
