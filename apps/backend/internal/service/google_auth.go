package service

import (
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

	"github.com/golang-jwt/jwt/v5"
)

// Đăng nhập API Google bằng service account (FCM, Google Play Developer API): tự ký JWT (RS256) đổi lấy OAuth2
// access token (sống 1 giờ, cache lại) — không cần SDK Google.

const googleTokenMargin = time.Minute // làm mới access token trước khi hết hạn

// googleServiceAccount — các trường cần của file JSON service account (Google Cloud / Firebase Console →
// Service accounts → tạo khoá JSON)
type googleServiceAccount struct {
	ProjectID    string `json:"project_id"`
	PrivateKeyID string `json:"private_key_id"`
	ClientEmail  string `json:"client_email"`
	PrivateKey   string `json:"private_key"`
	TokenURI     string `json:"token_uri"`
}

type googleAuth struct {
	clientEmail, tokenURI, keyID, scope string
	key                                 *rsa.PrivateKey
	client                              *http.Client

	mu          sync.Mutex
	accessToken string
	expiresAt   time.Time
}

// newGoogleAuth đọc file service account; name dùng trong thông báo lỗi (vd "FCM", "Google Play")
func newGoogleAuth(serviceAccountJSON []byte, scope, name string) (*googleAuth, googleServiceAccount, error) {
	var sa googleServiceAccount
	if err := json.Unmarshal(serviceAccountJSON, &sa); err != nil {
		return nil, sa, fmt.Errorf("đọc service account %s: %w", name, err)
	}
	if sa.ProjectID == "" || sa.ClientEmail == "" || sa.PrivateKey == "" || sa.TokenURI == "" {
		return nil, sa, fmt.Errorf("service account %s thiếu project_id / client_email / private_key / token_uri", name)
	}
	key, err := jwt.ParseRSAPrivateKeyFromPEM([]byte(sa.PrivateKey))
	if err != nil {
		return nil, sa, fmt.Errorf("private_key của service account %s không hợp lệ: %w", name, err)
	}
	return &googleAuth{
		clientEmail: sa.ClientEmail, tokenURI: sa.TokenURI, keyID: sa.PrivateKeyID, scope: scope,
		key: key, client: &http.Client{Timeout: pushSendTimeout},
	}, sa, nil
}

// token — OAuth2 access token còn hạn (cache), hết hạn thì ký JWT đổi token mới
func (g *googleAuth) token(ctx context.Context) (string, error) {
	g.mu.Lock()
	defer g.mu.Unlock()
	if g.accessToken != "" && time.Until(g.expiresAt) > googleTokenMargin {
		return g.accessToken, nil
	}
	now := time.Now()
	t := jwt.NewWithClaims(jwt.SigningMethodRS256, jwt.MapClaims{
		"iss": g.clientEmail, "scope": g.scope, "aud": g.tokenURI,
		"iat": now.Unix(), "exp": now.Add(time.Hour).Unix(),
	})
	if g.keyID != "" {
		t.Header["kid"] = g.keyID
	}
	assertion, err := t.SignedString(g.key)
	if err != nil {
		return "", err
	}
	form := url.Values{"grant_type": {"urn:ietf:params:oauth:grant-type:jwt-bearer"}, "assertion": {assertion}}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, g.tokenURI, strings.NewReader(form.Encode()))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	resp, err := g.client.Do(req)
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
		return "", fmt.Errorf("lấy access token Google: HTTP %d", resp.StatusCode)
	}
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil || out.AccessToken == "" {
		return "", errors.New("lấy access token Google: phản hồi không hợp lệ")
	}
	if out.ExpiresIn <= 0 {
		out.ExpiresIn = 3600 // Google mặc định 1 giờ — không để mỗi lần gọi lại xin token mới
	}
	g.accessToken, g.expiresAt = out.AccessToken, now.Add(time.Duration(out.ExpiresIn)*time.Second)
	return g.accessToken, nil
}

// reset — access token bị từ chối (401): lần sau lấy token mới
func (g *googleAuth) reset() {
	g.mu.Lock()
	g.accessToken = ""
	g.mu.Unlock()
}
