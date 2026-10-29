// Package storage bọc Cloudflare R2 (tương thích API S3) qua aws-sdk-go-v2.
// Không dùng aws-sdk-go-v2/config (kéo theo SSO/IMDS không cần tới) — tự
// dựng credentials tĩnh + endpoint R2 trực tiếp.
package storage

import (
	"context"
	"fmt"
	"io"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

// R2Client lưu/đọc/xoá object trong 1 bucket R2 cố định, và tạo presigned URL
// để phát file mà KHÔNG cần bật "Public access" cho bucket.
type R2Client struct {
	client  *s3.Client
	presign *s3.PresignClient
	bucket  string
}

func NewR2Client(accountID, bucket, accessKeyID, secretAccessKey string) *R2Client {
	endpoint := fmt.Sprintf("https://%s.r2.cloudflarestorage.com", accountID)
	client := s3.New(s3.Options{
		Region:       "auto",
		BaseEndpoint: aws.String(endpoint),
		Credentials:  credentials.NewStaticCredentialsProvider(accessKeyID, secretAccessKey, ""),
	})
	return &R2Client{
		client:  client,
		presign: s3.NewPresignClient(client),
		bucket:  bucket,
	}
}

func (r *R2Client) Upload(ctx context.Context, key string, body io.Reader, contentType string) error {
	_, err := r.client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(r.bucket),
		Key:         aws.String(key),
		Body:        body,
		ContentType: aws.String(contentType),
	})
	return err
}

func (r *R2Client) Delete(ctx context.Context, key string) error {
	_, err := r.client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(r.bucket),
		Key:    aws.String(key),
	})
	return err
}

// PresignGet tạo link tạm GET object — mặc định dùng TTL vài giờ, đủ cho 1
// phiên nghe, không cần bucket public.
func (r *R2Client) PresignGet(ctx context.Context, key string, ttl time.Duration) (string, error) {
	out, err := r.presign.PresignGetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(r.bucket),
		Key:    aws.String(key),
	}, s3.WithPresignExpires(ttl))
	if err != nil {
		return "", err
	}
	return out.URL, nil
}
