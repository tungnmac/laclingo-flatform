package service

// BulkImportResult — kết quả nhập hàng loạt 1 dòng. Index khớp vị trí trong
// mảng request gốc để FE biết chính xác dòng nào lỗi.
type BulkImportResult struct {
	Index   int    `json:"index"`
	Success bool   `json:"success"`
	Error   string `json:"error,omitempty"`
}

// runBulkImport chạy create() tuần tự cho từng item — lỗi ở 1 dòng KHÔNG chặn
// các dòng còn lại (best-effort), vì nội dung nhập hàng loạt dễ có vài dòng
// sai (trùng, thiếu field) và admin cần biết chính xác dòng nào cần sửa lại
// thay vì toàn bộ batch bị huỷ vì 1 lỗi.
func runBulkImport[T any](items []T, create func(T) error) []BulkImportResult {
	results := make([]BulkImportResult, len(items))
	for i, item := range items {
		err := create(item)
		results[i] = BulkImportResult{Index: i, Success: err == nil}
		if err != nil {
			results[i].Error = err.Error()
		}
	}
	return results
}
