package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"time"
)

// Google Play Developer API: tra trạng thái giao dịch mua trong app Android + xác nhận (acknowledge) giao dịch.
// Đăng nhập bằng service account đã được cấp quyền trong Play Console (Users and permissions).

const (
	googlePlayScope   = "https://www.googleapis.com/auth/androidpublisher"
	googlePlayAPIBase = "https://androidpublisher.googleapis.com"
)

var errGooglePlayNotFound = errors.New("Google Play không tìm thấy giao dịch")

type GooglePlayClient struct {
	packageName, apiBase string
	auth                 *googleAuth
	client               *http.Client
}

// NewGooglePlayClient — packageName = applicationId của app Android (vd vn.laclingo.app); apiBase trống = API thật
func NewGooglePlayClient(serviceAccountJSON []byte, packageName, apiBase string) (*GooglePlayClient, error) {
	auth, _, err := newGoogleAuth(serviceAccountJSON, googlePlayScope, "Google Play")
	if err != nil {
		return nil, err
	}
	if apiBase == "" {
		apiBase = googlePlayAPIBase
	}
	return &GooglePlayClient{packageName: packageName, apiBase: apiBase, auth: auth, client: &http.Client{Timeout: 15 * time.Second}}, nil
}

// GoogleSubscription — purchases.subscriptionsv2 (các trường cần)
type GoogleSubscription struct {
	SubscriptionState    string    `json:"subscriptionState"` // SUBSCRIPTION_STATE_ACTIVE | _IN_GRACE_PERIOD | _ON_HOLD | _PAUSED | _CANCELED | _EXPIRED | _PENDING
	AcknowledgementState string    `json:"acknowledgementState"`
	LinkedPurchaseToken  string    `json:"linkedPurchaseToken"` // nâng/hạ gói: token cũ bị thay
	TestPurchase         *struct{} `json:"testPurchase"`
	LineItems            []struct {
		ProductID        string `json:"productId"`
		ExpiryTime       string `json:"expiryTime"` // RFC3339
		AutoRenewingPlan *struct {
			AutoRenewEnabled bool `json:"autoRenewEnabled"`
		} `json:"autoRenewingPlan"`
	} `json:"lineItems"`
	ExternalAccountIdentifiers *struct {
		ObfuscatedExternalAccountID string `json:"obfuscatedExternalAccountId"`
	} `json:"externalAccountIdentifiers"`
}

// Expiry / AutoRenew / AccountID — đọc từ line item đầu (LacLingo chỉ bán 1 gói / subscription)
func (s GoogleSubscription) Expiry() (time.Time, bool) {
	if len(s.LineItems) == 0 {
		return time.Time{}, false
	}
	t, err := time.Parse(time.RFC3339Nano, s.LineItems[0].ExpiryTime)
	return t, err == nil
}

func (s GoogleSubscription) AutoRenew() bool {
	return len(s.LineItems) > 0 && s.LineItems[0].AutoRenewingPlan != nil && s.LineItems[0].AutoRenewingPlan.AutoRenewEnabled
}

func (s GoogleSubscription) AccountID() string {
	if s.ExternalAccountIdentifiers == nil {
		return ""
	}
	return s.ExternalAccountIdentifiers.ObfuscatedExternalAccountID
}

// GoogleProductPurchase — purchases.products (mua 1 lần: Pro trọn đời, gói gems)
type GoogleProductPurchase struct {
	PurchaseState               int    `json:"purchaseState"` // 0 đã thanh toán, 1 đã huỷ, 2 đang chờ
	ConsumptionState            int    `json:"consumptionState"`
	AcknowledgementState        int    `json:"acknowledgementState"`
	OrderID                     string `json:"orderId"`
	PurchaseType                *int   `json:"purchaseType"` // 0 = mua thử (tài khoản test)
	ObfuscatedExternalAccountID string `json:"obfuscatedExternalAccountId"`
}

func (g *GooglePlayClient) call(ctx context.Context, method, path string, out any) error {
	token, err := g.auth.token(ctx)
	if err != nil {
		return err
	}
	req, err := http.NewRequestWithContext(ctx, method, g.apiBase+"/androidpublisher/v3/applications/"+url.PathEscape(g.packageName)+path, nil)
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+token)
	resp, err := g.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	switch {
	case resp.StatusCode == http.StatusNotFound || resp.StatusCode == http.StatusGone:
		return errGooglePlayNotFound
	case resp.StatusCode == http.StatusUnauthorized:
		g.auth.reset()
		fallthrough
	case resp.StatusCode >= 300:
		return fmt.Errorf("Google Play API trả về %d", resp.StatusCode)
	}
	if out == nil {
		return nil
	}
	return json.Unmarshal(body, out)
}

func (g *GooglePlayClient) Subscription(ctx context.Context, purchaseToken string) (GoogleSubscription, error) {
	var s GoogleSubscription
	err := g.call(ctx, http.MethodGet, "/purchases/subscriptionsv2/tokens/"+url.PathEscape(purchaseToken), &s)
	return s, err
}

func (g *GooglePlayClient) Product(ctx context.Context, productID, purchaseToken string) (GoogleProductPurchase, error) {
	var p GoogleProductPurchase
	err := g.call(ctx, http.MethodGet, "/purchases/products/"+url.PathEscape(productID)+"/tokens/"+url.PathEscape(purchaseToken), &p)
	return p, err
}

// Acknowledge — xác nhận đã giao hàng; không xác nhận trong 3 ngày Google tự hoàn tiền. Gói gems (tiêu hao) thì app
// consume thay vì acknowledge.
func (g *GooglePlayClient) AcknowledgeSubscription(ctx context.Context, productID, purchaseToken string) error {
	return g.call(ctx, http.MethodPost, "/purchases/subscriptions/"+url.PathEscape(productID)+"/tokens/"+url.PathEscape(purchaseToken)+":acknowledge", nil)
}

// CancelSubscription — tắt tự gia hạn (học viên xoá tài khoản); gói vẫn dùng được tới hết kỳ đã trả
func (g *GooglePlayClient) CancelSubscription(ctx context.Context, productID, purchaseToken string) error {
	return g.call(ctx, http.MethodPost, "/purchases/subscriptions/"+url.PathEscape(productID)+"/tokens/"+url.PathEscape(purchaseToken)+":cancel", nil)
}

func (g *GooglePlayClient) AcknowledgeProduct(ctx context.Context, productID, purchaseToken string) error {
	return g.call(ctx, http.MethodPost, "/purchases/products/"+url.PathEscape(productID)+"/tokens/"+url.PathEscape(purchaseToken)+":acknowledge", nil)
}

// googleRTDN — Real-time developer notification (Pub/Sub push: message.data là JSON base64)
type googleRTDN struct {
	PackageName              string `json:"packageName"`
	SubscriptionNotification *struct {
		NotificationType int    `json:"notificationType"`
		PurchaseToken    string `json:"purchaseToken"`
		SubscriptionID   string `json:"subscriptionId"`
	} `json:"subscriptionNotification"`
	VoidedPurchaseNotification *struct {
		PurchaseToken string `json:"purchaseToken"`
		ProductType   int    `json:"productType"` // 1 subscription, 2 mua 1 lần
	} `json:"voidedPurchaseNotification"`
	TestNotification *struct {
		Version string `json:"version"`
	} `json:"testNotification"`
}
