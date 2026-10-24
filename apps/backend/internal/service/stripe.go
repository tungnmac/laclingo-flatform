package service

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"
)

// Stripe (thẻ quốc tế, USD) qua REST API — không cần SDK: tạo Checkout Session (gói tháng/năm = subscription tự
// gia hạn; trọn đời / gems = thanh toán 1 lần), Billing Portal (học viên tự huỷ gói), đọc session/subscription,
// xác thực chữ ký webhook (Stripe-Signature: HMAC-SHA256 trên "timestamp.body").

const (
	stripeAPIBase           = "https://api.stripe.com/v1"
	stripeWebhookTolerance  = 5 * time.Minute
	stripeRequestTimeout    = 20 * time.Second
	stripeMaxResponseLength = 1 << 20
)

type StripeClient struct {
	secretKey     string
	webhookSecret string
	baseURL       string
	http          *http.Client
	now           func() time.Time
}

// NewStripeClient — apiBase trống = api.stripe.com (đặt khi test với stripe-mock / server giả lập)
func NewStripeClient(secretKey, webhookSecret, apiBase string) *StripeClient {
	if apiBase == "" {
		apiBase = stripeAPIBase
	}
	return &StripeClient{
		secretKey: strings.TrimSpace(secretKey), webhookSecret: strings.TrimSpace(webhookSecret),
		baseURL: strings.TrimRight(apiBase, "/"), http: &http.Client{Timeout: stripeRequestTimeout}, now: time.Now,
	}
}

// stripeError — lỗi Stripe trả về (không chứa key)
type stripeError struct {
	Status  int
	Type    string
	Message string
}

func (e *stripeError) Error() string {
	return fmt.Sprintf("stripe %d %s: %s", e.Status, e.Type, e.Message)
}

func (c *StripeClient) do(ctx context.Context, method, path string, form url.Values, out any) error {
	var body io.Reader
	if form != nil {
		body = strings.NewReader(form.Encode())
	}
	req, err := http.NewRequestWithContext(ctx, method, c.baseURL+path, body)
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+c.secretKey)
	if form != nil {
		req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	}
	resp, err := c.http.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	raw, err := io.ReadAll(io.LimitReader(resp.Body, stripeMaxResponseLength))
	if err != nil {
		return err
	}
	if resp.StatusCode >= 300 {
		var e struct {
			Error struct {
				Type    string `json:"type"`
				Message string `json:"message"`
			} `json:"error"`
		}
		_ = json.Unmarshal(raw, &e)
		return &stripeError{Status: resp.StatusCode, Type: e.Error.Type, Message: e.Error.Message}
	}
	return json.Unmarshal(raw, out)
}

// StripeCheckoutParams — 1 đơn thanh toán qua Stripe Checkout
type StripeCheckoutParams struct {
	OrderID     string
	UserID      string
	Email       string
	Title       string
	AmountCents int64
	Interval    string // "month" | "year" = subscription tự gia hạn; "" = thanh toán 1 lần
	SuccessURL  string
	CancelURL   string
	CustomerID  string // khách Stripe đã có (gia hạn lại) — rỗng = Stripe tạo mới theo email
}

type StripeCheckoutSession struct {
	ID            string `json:"id"`
	URL           string `json:"url"`
	Mode          string `json:"mode"`
	Status        string `json:"status"`         // open | complete | expired
	PaymentStatus string `json:"payment_status"` // paid | unpaid | no_payment_required
	ClientRefID   string `json:"client_reference_id"`
	Subscription  string `json:"subscription"`
	Customer      string `json:"customer"`
	AmountTotal   int64  `json:"amount_total"`
	Currency      string `json:"currency"`
}

func (c *StripeClient) CreateCheckoutSession(ctx context.Context, p StripeCheckoutParams) (StripeCheckoutSession, error) {
	f := url.Values{}
	f.Set("success_url", p.SuccessURL)
	f.Set("cancel_url", p.CancelURL)
	f.Set("client_reference_id", p.OrderID)
	f.Set("metadata[order_id]", p.OrderID)
	f.Set("metadata[user_id]", p.UserID)
	f.Set("line_items[0][quantity]", "1")
	f.Set("line_items[0][price_data][currency]", "usd")
	f.Set("line_items[0][price_data][unit_amount]", strconv.FormatInt(p.AmountCents, 10))
	f.Set("line_items[0][price_data][product_data][name]", p.Title)
	if p.CustomerID != "" {
		f.Set("customer", p.CustomerID)
	} else if p.Email != "" {
		f.Set("customer_email", p.Email)
	}
	if p.Interval != "" {
		f.Set("mode", "subscription")
		f.Set("line_items[0][price_data][recurring][interval]", p.Interval)
		// Gắn mã đơn vào subscription — các sự kiện gia hạn/huỷ về sau tìm lại được học viên
		f.Set("subscription_data[metadata][order_id]", p.OrderID)
		f.Set("subscription_data[metadata][user_id]", p.UserID)
	} else {
		f.Set("mode", "payment")
		if p.CustomerID == "" {
			f.Set("customer_creation", "always") // có customer để mở Billing Portal / mua lại về sau
		}
	}
	var s StripeCheckoutSession
	err := c.do(ctx, http.MethodPost, "/checkout/sessions", f, &s)
	return s, err
}

func (c *StripeClient) GetCheckoutSession(ctx context.Context, id string) (StripeCheckoutSession, error) {
	var s StripeCheckoutSession
	err := c.do(ctx, http.MethodGet, "/checkout/sessions/"+url.PathEscape(id), nil, &s)
	return s, err
}

// StripeSubscription — các trường cần của subscription. current_period_end: API cũ ở cấp subscription,
// API mới (2025+) ở từng item — đọc cả hai.
type StripeSubscription struct {
	ID                string            `json:"id"`
	Status            string            `json:"status"` // active | trialing | past_due | canceled | unpaid | incomplete...
	CancelAtPeriodEnd bool              `json:"cancel_at_period_end"`
	CurrentPeriodEnd  int64             `json:"current_period_end"`
	Customer          string            `json:"customer"`
	Metadata          map[string]string `json:"metadata"`
	Items             struct {
		Data []struct {
			CurrentPeriodEnd int64 `json:"current_period_end"`
		} `json:"data"`
	} `json:"items"`
}

func (s StripeSubscription) PeriodEnd() time.Time {
	end := s.CurrentPeriodEnd
	for _, it := range s.Items.Data {
		end = max(end, it.CurrentPeriodEnd)
	}
	return time.Unix(end, 0)
}

func (c *StripeClient) GetSubscription(ctx context.Context, id string) (StripeSubscription, error) {
	var s StripeSubscription
	err := c.do(ctx, http.MethodGet, "/subscriptions/"+url.PathEscape(id), nil, &s)
	return s, err
}

// CancelSubscription — huỷ ngay subscription (gói tự gia hạn bị thay bằng gói khác — không trừ tiền tiếp)
func (c *StripeClient) CancelSubscription(ctx context.Context, id string) error {
	var out StripeSubscription
	return c.do(ctx, http.MethodDelete, "/subscriptions/"+url.PathEscape(id), nil, &out)
}

// ExpireCheckoutSession — đóng phiên Checkout chưa thanh toán (không trả tiền được nữa)
func (c *StripeClient) ExpireCheckoutSession(ctx context.Context, id string) error {
	var out StripeCheckoutSession
	return c.do(ctx, http.MethodPost, "/checkout/sessions/"+url.PathEscape(id)+"/expire", nil, &out)
}

// CreatePortalSession — trang Stripe để học viên xem hoá đơn, đổi thẻ, huỷ tự gia hạn
func (c *StripeClient) CreatePortalSession(ctx context.Context, customerID, returnURL string) (string, error) {
	f := url.Values{}
	f.Set("customer", customerID)
	f.Set("return_url", returnURL)
	var out struct {
		URL string `json:"url"`
	}
	err := c.do(ctx, http.MethodPost, "/billing_portal/sessions", f, &out)
	return out.URL, err
}

var errStripeSignature = errors.New("chữ ký webhook Stripe không hợp lệ")

// VerifyWebhook kiểm tra header Stripe-Signature ("t=…,v1=…[,v1=…]") cho body thô; quá 5 phút → từ chối (chống phát lại)
func (c *StripeClient) VerifyWebhook(body []byte, header string) error {
	var ts string
	var sigs []string
	for _, part := range strings.Split(header, ",") {
		k, v, ok := strings.Cut(strings.TrimSpace(part), "=")
		if !ok {
			continue
		}
		switch k {
		case "t":
			ts = v
		case "v1":
			sigs = append(sigs, v)
		}
	}
	sec, err := strconv.ParseInt(ts, 10, 64)
	if err != nil || len(sigs) == 0 || c.webhookSecret == "" {
		return errStripeSignature
	}
	if d := c.now().Sub(time.Unix(sec, 0)); d > stripeWebhookTolerance || d < -stripeWebhookTolerance {
		return errStripeSignature
	}
	mac := hmac.New(sha256.New, []byte(c.webhookSecret))
	mac.Write([]byte(ts + "."))
	mac.Write(body)
	want := hex.EncodeToString(mac.Sum(nil))
	for _, s := range sigs {
		if hmac.Equal([]byte(s), []byte(want)) {
			return nil
		}
	}
	return errStripeSignature
}

// StripeEvent — sự kiện webhook (data.object để thô, tuỳ loại sự kiện)
type StripeEvent struct {
	ID   string `json:"id"`
	Type string `json:"type"`
	Data struct {
		Object json.RawMessage `json:"object"`
	} `json:"data"`
}

// StripeInvoice — hoá đơn (invoice.paid): subscription nằm ở invoice.subscription (API cũ) hoặc
// invoice.parent.subscription_details.subscription (API mới)
type StripeInvoice struct {
	Subscription string `json:"subscription"`
	Parent       struct {
		SubscriptionDetails struct {
			Subscription string `json:"subscription"`
		} `json:"subscription_details"`
	} `json:"parent"`
}

func (i StripeInvoice) SubscriptionID() string {
	if i.Subscription != "" {
		return i.Subscription
	}
	return i.Parent.SubscriptionDetails.Subscription
}
