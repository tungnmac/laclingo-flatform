package service

import (
	"bytes"
	"context"
	"crypto/rsa"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"

	"laclingo-backend/internal/repository/db"

	"github.com/golang-jwt/jwt/v5"
)

// Thông báo đẩy trên app iOS/Android qua Firebase Cloud Messaging (HTTP v1). Xác thực bằng service account của
// project Firebase: tự ký JWT (RS256) đổi lấy OAuth2 access token (sống 1 giờ, cache lại) — không cần SDK Google.

const (
	fcmScope       = "https://www.googleapis.com/auth/firebase.messaging"
	fcmAPIBase     = "https://fcm.googleapis.com"
	fcmTokenMargin = time.Minute // làm mới access token trước khi hết hạn
)

// fcmServiceAccount — các trường cần của file JSON service account (Firebase Console → Project settings →
// Service accounts → Generate new private key)
type fcmServiceAccount struct {
	ProjectID    string `json:"project_id"`
	PrivateKeyID string `json:"private_key_id"`
	ClientEmail  string `json:"client_email"`
	PrivateKey   string `json:"private_key"`
	TokenURI     string `json:"token_uri"`
}

type fcmSender struct {
	projectID, clientEmail, tokenURI, apiBase, keyID string
	key                                              *rsa.PrivateKey
	client                                           *http.Client

	mu          sync.Mutex
	accessToken string
	expiresAt   time.Time
}

// NewFCMSender — serviceAccountJSON là nội dung file service account của project Firebase
func NewFCMSender(serviceAccountJSON []byte) (PushSender, error) {
	var sa fcmServiceAccount
	if err := json.Unmarshal(serviceAccountJSON, &sa); err != nil {
		return nil, fmt.Errorf("đọc service account FCM: %w", err)
	}
	if sa.ProjectID == "" || sa.ClientEmail == "" || sa.PrivateKey == "" || sa.TokenURI == "" {
		return nil, errors.New("service account FCM thiếu project_id / client_email / private_key / token_uri")
	}
	key, err := jwt.ParseRSAPrivateKeyFromPEM([]byte(sa.PrivateKey))
	if err != nil {
		return nil, fmt.Errorf("private_key của service account FCM không hợp lệ: %w", err)
	}
	return &fcmSender{
		projectID: sa.ProjectID, clientEmail: sa.ClientEmail, tokenURI: sa.TokenURI, apiBase: fcmAPIBase, keyID: sa.PrivateKeyID,
		key: key, client: &http.Client{Timeout: pushSendTimeout},
	}, nil
}

// token — OAuth2 access token còn hạn (cache), hết hạn thì ký JWT đổi token mới
func (f *fcmSender) token(ctx context.Context) (string, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	if f.accessToken != "" && time.Until(f.expiresAt) > fcmTokenMargin {
		return f.accessToken, nil
	}
	now := time.Now()
	t := jwt.NewWithClaims(jwt.SigningMethodRS256, jwt.MapClaims{
		"iss": f.clientEmail, "scope": fcmScope, "aud": f.tokenURI,
		"iat": now.Unix(), "exp": now.Add(time.Hour).Unix(),
	})
	if f.keyID != "" {
		t.Header["kid"] = f.keyID
	}
	assertion, err := t.SignedString(f.key)
	if err != nil {
		return "", err
	}
	form := url.Values{"grant_type": {"urn:ietf:params:oauth:grant-type:jwt-bearer"}, "assertion": {assertion}}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, f.tokenURI, strings.NewReader(form.Encode()))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	resp, err := f.client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	var out struct {
		AccessToken string `json:"access_token"`
		ExpiresIn   int64  `json:"expires_in"`
	}
	if resp.StatusCode != http.StatusOK {
		_, _ = io.Copy(io.Discard, resp.Body)
		return "", fmt.Errorf("lấy access token FCM: HTTP %d", resp.StatusCode)
	}
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil || out.AccessToken == "" {
		return "", fmt.Errorf("lấy access token FCM: phản hồi không hợp lệ")
	}
	if out.ExpiresIn <= 0 {
		out.ExpiresIn = 3600 // Google mặc định 1 giờ — không để mỗi lần gửi lại xin token mới
	}
	f.accessToken, f.expiresAt = out.AccessToken, now.Add(time.Duration(out.ExpiresIn)*time.Second)
	return f.accessToken, nil
}

func (f *fcmSender) resetToken() {
	f.mu.Lock()
	f.accessToken = ""
	f.mu.Unlock()
}

// Send gửi 1 thông báo tới 1 thiết bị. payload là pushPayload đã JSON (cùng nội dung với web push).
// gone = token không còn hiệu lực (gỡ app / token đổi) — caller xoá subscription.
func (f *fcmSender) Send(ctx context.Context, sub db.PushSubscription, payload []byte) (bool, error) {
	ctx, cancel := context.WithTimeout(ctx, pushSendTimeout)
	defer cancel()
	var p pushPayload
	if err := json.Unmarshal(payload, &p); err != nil {
		return false, err
	}
	msg := map[string]any{"message": map[string]any{
		"token":        sub.Endpoint,
		"notification": map[string]string{"title": p.Title, "body": p.Body},
		"data":         map[string]string{"url": p.URL, "tag": p.Tag}, // app mở đúng trang khi bấm thông báo
		"android": map[string]any{
			"ttl":          fmt.Sprintf("%ds", reminderPushTTL),
			"notification": map[string]string{"tag": p.Tag},
		},
		"apns": map[string]any{"headers": map[string]string{
			"apns-collapse-id": p.Tag,
			"apns-expiration":  fmt.Sprint(time.Now().Add(reminderPushTTL * time.Second).Unix()),
		}},
	}}
	body, err := json.Marshal(msg)
	if err != nil {
		return false, err
	}
	token, err := f.token(ctx)
	if err != nil {
		return false, err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost,
		fmt.Sprintf("%s/v1/projects/%s/messages:send", f.apiBase, url.PathEscape(f.projectID)), bytes.NewReader(body))
	if err != nil {
		return false, err
	}
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")
	resp, err := f.client.Do(req)
	if err != nil {
		return false, err
	}
	defer resp.Body.Close()
	respBody, _ := io.ReadAll(io.LimitReader(resp.Body, 64<<10))
	if resp.StatusCode == http.StatusOK {
		return false, nil
	}
	// Chỉ xoá token khi FCM nói rõ token đó hỏng — 404 chung chung (sai project_id...) không được xoá sạch mọi token
	code := fcmErrorCode(respBody)
	switch {
	case code == "UNREGISTERED" || code == "SENDER_ID_MISMATCH": // gỡ app / token của project Firebase khác
		return true, nil
	case resp.StatusCode == http.StatusUnauthorized:
		f.resetToken() // access token bị thu hồi — lần sau lấy token mới
	}
	return false, fmt.Errorf("FCM trả về %d %s", resp.StatusCode, code)
}

// fcmErrorCode — errorCode của FCM (details[].errorCode), không có thì status chung (vd NOT_FOUND)
func fcmErrorCode(body []byte) string {
	var e struct {
		Error struct {
			Status  string `json:"status"`
			Details []struct {
				ErrorCode string `json:"errorCode"`
			} `json:"details"`
		} `json:"error"`
	}
	if json.Unmarshal(body, &e) != nil {
		return ""
	}
	for _, d := range e.Error.Details {
		if d.ErrorCode != "" {
			return d.ErrorCode
		}
	}
	return e.Error.Status
}
