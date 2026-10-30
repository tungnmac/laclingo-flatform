package service

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

// Mailer gửi 1 email (quên mật khẩu...)
type Mailer interface {
	Send(ctx context.Context, to, subject, html, text string) error
}

// BrevoMailer gửi email qua Brevo (BREVO_API_KEY + EMAIL_FROM — địa chỉ gửi đã xác thực trong Brevo)
type BrevoMailer struct {
	apiKey, from, fromName string
	client                 *http.Client
	endpoint               string
}

func NewBrevoMailer(apiKey, from, fromName string) *BrevoMailer {
	return &BrevoMailer{apiKey: apiKey, from: from, fromName: fromName, client: &http.Client{Timeout: 15 * time.Second},
		endpoint: "https://api.brevo.com/v3/smtp/email"}
}

func (m *BrevoMailer) Send(ctx context.Context, to, subject, html, text string) error {
	body, err := json.Marshal(map[string]any{
		"sender":      map[string]string{"email": m.from, "name": m.fromName},
		"to":          []map[string]string{{"email": to}},
		"subject":     subject,
		"htmlContent": html,
		"textContent": text,
	})
	if err != nil {
		return err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, m.endpoint, bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("api-key", m.apiKey)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")
	resp, err := m.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode/100 != 2 {
		detail, _ := io.ReadAll(io.LimitReader(resp.Body, 300))
		return fmt.Errorf("brevo trả về %d: %s", resp.StatusCode, detail)
	}
	return nil
}
