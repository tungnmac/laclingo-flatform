package service

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"time"

	"laclingo-backend/internal/repository/db"
)

// Thông báo đẩy trên app iOS/Android qua Firebase Cloud Messaging (HTTP v1), đăng nhập bằng service account
// của project Firebase (googleAuth).

const (
	fcmScope   = "https://www.googleapis.com/auth/firebase.messaging"
	fcmAPIBase = "https://fcm.googleapis.com"
)

type fcmSender struct {
	projectID, apiBase string
	auth               *googleAuth
	client             *http.Client
}

// NewFCMSender — serviceAccountJSON là nội dung file service account của project Firebase
func NewFCMSender(serviceAccountJSON []byte) (PushSender, error) {
	auth, sa, err := newGoogleAuth(serviceAccountJSON, fcmScope, "FCM")
	if err != nil {
		return nil, err
	}
	return &fcmSender{projectID: sa.ProjectID, apiBase: fcmAPIBase, auth: auth, client: &http.Client{Timeout: pushSendTimeout}}, nil
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
	token, err := f.auth.token(ctx)
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
		f.auth.reset() // access token bị thu hồi — lần sau lấy token mới
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
