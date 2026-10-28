package service

import (
	"context"
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"encoding/json"
	"encoding/pem"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"laclingo-backend/internal/repository/db"

	"github.com/golang-jwt/jwt/v5"
)

func TestFCMSender(t *testing.T) {
	key, _ := rsa.GenerateKey(rand.Reader, 2048)
	keyPEM := pem.EncodeToMemory(&pem.Block{Type: "RSA PRIVATE KEY", Bytes: x509.MarshalPKCS1PrivateKey(key)})

	tokenCalls := 0
	var lastMsg map[string]any
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.URL.Path == "/token":
			tokenCalls++
			_ = r.ParseForm()
			claims := jwt.MapClaims{}
			if _, err := jwt.ParseWithClaims(r.Form.Get("assertion"), claims, func(*jwt.Token) (any, error) { return &key.PublicKey, nil }); err != nil {
				t.Errorf("assertion không hợp lệ: %v", err)
			}
			if claims["iss"] != "bot@demo.iam.gserviceaccount.com" || claims["scope"] != fcmScope {
				t.Errorf("claims sai: %v", claims)
			}
			_, _ = io.WriteString(w, `{"access_token":"at-1","expires_in":3600}`)
		case r.URL.Path == "/v1/projects/demo/messages:send":
			if r.Header.Get("Authorization") != "Bearer at-1" {
				t.Errorf("thiếu access token: %q", r.Header.Get("Authorization"))
			}
			_ = json.NewDecoder(r.Body).Decode(&lastMsg)
			msg := lastMsg["message"].(map[string]any)
			switch msg["token"] {
			case "gone":
				w.WriteHeader(http.StatusNotFound)
				_, _ = io.WriteString(w, `{"error":{"status":"NOT_FOUND","details":[{"errorCode":"UNREGISTERED"}]}}`)
			case "wrong-project":
				w.WriteHeader(http.StatusNotFound)
				_, _ = io.WriteString(w, `{"error":{"status":"NOT_FOUND","message":"Requested entity was not found."}}`)
			case "other-sender":
				w.WriteHeader(http.StatusForbidden)
				_, _ = io.WriteString(w, `{"error":{"status":"PERMISSION_DENIED","details":[{"errorCode":"SENDER_ID_MISMATCH"}]}}`)
			case "unregistered":
				w.WriteHeader(http.StatusBadRequest)
				_, _ = io.WriteString(w, `{"error":{"details":[{"errorCode":"UNREGISTERED"}]}}`)
			case "boom":
				w.WriteHeader(http.StatusInternalServerError)
			default:
				_, _ = io.WriteString(w, `{"name":"projects/demo/messages/1"}`)
			}
		default:
			t.Errorf("path lạ %s", r.URL.Path)
		}
	}))
	defer srv.Close()

	sa, _ := json.Marshal(googleServiceAccount{ProjectID: "demo", ClientEmail: "bot@demo.iam.gserviceaccount.com", PrivateKey: string(keyPEM), TokenURI: srv.URL + "/token"})
	sender, err := NewFCMSender(sa)
	if err != nil {
		t.Fatal(err)
	}
	sender.(*fcmSender).apiBase = srv.URL
	payload, _ := json.Marshal(pushPayload{Title: "🦩 Đến giờ học rồi!", Body: "Ôn bài nhé", URL: "/review", Tag: "laclingo-reminder"})
	ctx := context.Background()

	cases := []struct {
		token    string
		wantGone bool
		wantErr  bool
	}{{"tok-ok", false, false}, {"gone", true, false}, {"unregistered", true, false}, {"other-sender", true, false},
		{"wrong-project", false, true}, {"boom", false, true}}
	for _, c := range cases {
		gone, err := sender.Send(ctx, db.PushSubscription{Endpoint: c.token, Kind: pushKindFCM}, payload)
		if gone != c.wantGone || (err != nil) != c.wantErr {
			t.Errorf("%s: gone=%v err=%v", c.token, gone, err)
		}
	}
	if tokenCalls != 1 {
		t.Errorf("access token phải được cache, gọi %d lần", tokenCalls)
	}
	msg := lastMsg["message"].(map[string]any)
	if n := msg["notification"].(map[string]any); n["title"] != "🦩 Đến giờ học rồi!" || msg["data"].(map[string]any)["url"] != "/review" {
		t.Errorf("nội dung message sai: %v", msg)
	}

	if _, err := NewFCMSender([]byte(`{"project_id":"x"}`)); err == nil || !strings.Contains(err.Error(), "thiếu") {
		t.Errorf("service account thiếu trường phải báo lỗi: %v", err)
	}
}
