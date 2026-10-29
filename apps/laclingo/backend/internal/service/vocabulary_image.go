package service

import (
	"bufio"
	"context"
	"fmt"
	"io"
	"net/http"
	"regexp"

	"github.com/google/uuid"
)

// Ảnh minh hoạ từ vựng lưu trên R2 dưới prefix vocabulary/, phục vụ qua route
// public /vocab/images/:name (redirect sang presigned URL — bucket không public).
// vocabularies.image_url lưu đường dẫn tương đối "/vocab/images/<name>" để
// không phụ thuộc domain API của từng môi trường (FE tự ghép API_URL).
const vocabularyImagePrefix = "vocabulary/"

// Đuôi file lấy theo Content-Type sniff từ nội dung file (không tin tên file
// hay header Content-Type client gửi lên — vd "image/jpg", file giả đuôi .png)
var vocabularyImageExt = map[string]string{
	"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif",
}

// Chỉ nhận đúng tên file do UploadImage sinh ra — chặn path traversal ở route public
var vocabularyImageName = regexp.MustCompile(`^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp|gif)$`)

// VocabularyImageResponse — URL tương đối để gán vào image_url của từ vựng
type VocabularyImageResponse struct {
	URL string `json:"url" example:"/vocab/images/0b6c1c1e-9a2f-4d6e-8f4c-2a1b3c4d5e6f.png"`
}

// UploadImage upload 1 ảnh minh hoạ (jpeg/png/webp/gif, tối đa 5MB) lên R2
func (s *VocabularyService) UploadImage(ctx context.Context, content io.Reader, size int64) (VocabularyImageResponse, error) {
	if s.r2 == nil {
		return VocabularyImageResponse{}, fmt.Errorf("chưa cấu hình lưu trữ ảnh (R2): %w", ErrInvalidInput)
	}
	buffered := bufio.NewReaderSize(content, 512)
	head, _ := buffered.Peek(512) // file < 512 byte thì Peek trả phần có được + EOF — vẫn sniff được
	contentType := http.DetectContentType(head)
	ext, ok := vocabularyImageExt[contentType]
	if !ok {
		return VocabularyImageResponse{}, fmt.Errorf("định dạng ảnh không hỗ trợ (%s): %w", contentType, ErrInvalidInput)
	}
	if size > maxImageBytes {
		return VocabularyImageResponse{}, fmt.Errorf("ảnh quá lớn (tối đa %dMB): %w", maxImageBytes/1024/1024, ErrInvalidInput)
	}

	name := uuid.NewString() + ext
	if err := s.r2.Upload(ctx, vocabularyImagePrefix+name, buffered, contentType); err != nil {
		return VocabularyImageResponse{}, fmt.Errorf("upload ảnh thất bại: %w", err)
	}
	return VocabularyImageResponse{URL: "/vocab/images/" + name}, nil
}

// ResolveImageURL trả presigned URL của 1 ảnh minh hoạ theo tên file
func (s *VocabularyService) ResolveImageURL(ctx context.Context, name string) (string, error) {
	if s.r2 == nil || !vocabularyImageName.MatchString(name) {
		return "", ErrNotFound
	}
	return s.r2.PresignGet(ctx, vocabularyImagePrefix+name, imagePresignTTL)
}
