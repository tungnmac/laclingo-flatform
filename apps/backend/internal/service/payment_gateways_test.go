package service

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"
	"time"
)

func TestVNPaySignAndVerify(t *testing.T) {
	c := NewVNPayClient("TESTCODE", "SECRETKEY123", "")
	c.now = func() time.Time { return time.Date(2026, 10, 23, 5, 0, 0, 0, time.UTC) }
	raw := c.PaymentURL("abc123", 79000, "Thanh toan LacLingo MONTHLY abc123", "http://localhost:8080/api/v1/billing/vnpay/return", "127.0.0.1")
	u, err := url.Parse(raw)
	if err != nil {
		t.Fatal(err)
	}
	q := u.Query()
	if q.Get("vnp_Amount") != "7900000" || q.Get("vnp_CreateDate") != "20261023120000" || q.Get("vnp_TmnCode") != "TESTCODE" {
		t.Fatalf("params: amount=%s date=%s", q.Get("vnp_Amount"), q.Get("vnp_CreateDate"))
	}
	// VNPay gửi lại đúng các tham số + chữ ký (giả lập callback)
	cb := url.Values{}
	for _, k := range []string{"vnp_Amount", "vnp_TxnRef", "vnp_TmnCode"} {
		cb.Set(k, q.Get(k))
	}
	cb.Set("vnp_ResponseCode", "00")
	cb.Set("vnp_TransactionStatus", "00")
	cb.Set("vnp_TransactionNo", "14000001")
	cb.Set("vnp_OrderInfo", "Thanh toan LacLingo MONTHLY abc123")
	cb.Set("vnp_SecureHash", c.sign(vnpaySignData(cb)))
	if !c.Verify(cb) {
		t.Fatal("valid callback must verify")
	}
	r := ParseVNPayResult(cb)
	if !r.Success || r.AmountVND != 79000 || r.TxnRef != "abc123" || r.TransactionNo != "14000001" {
		t.Fatalf("parse: %+v", r)
	}
	cb.Set("vnp_Amount", "100") // sửa số tiền → sai chữ ký
	if c.Verify(cb) {
		t.Fatal("tampered amount must fail verification")
	}
	if NewVNPayClient("TESTCODE", "OTHER", "").Verify(cb) {
		t.Fatal("other secret must fail")
	}
}

func TestOrderTxnRefRoundTrip(t *testing.T) {
	id := toPgUUID([16]byte{1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16})
	got, ok := orderIDFromTxnRef(vnpayTxnRef(id))
	if !ok || got != id {
		t.Fatalf("round trip failed: %v %v", got, ok)
	}
	if _, ok := orderIDFromTxnRef("not-hex"); ok {
		t.Fatal("garbage ref must fail")
	}
}

func stripeSig(secret string, ts int64, body string) string {
	mac := hmac.New(sha256.New, []byte(secret))
	fmt.Fprintf(mac, "%d.%s", ts, body)
	return fmt.Sprintf("t=%d,v1=%s", ts, hex.EncodeToString(mac.Sum(nil)))
}

func TestStripeWebhookSignature(t *testing.T) {
	c := NewStripeClient("sk_test_x", "whsec_test", "")
	now := time.Unix(1_800_000_000, 0)
	c.now = func() time.Time { return now }
	body := `{"id":"evt_1","type":"invoice.paid"}`
	if err := c.VerifyWebhook([]byte(body), stripeSig("whsec_test", now.Unix(), body)); err != nil {
		t.Fatalf("valid signature: %v", err)
	}
	if err := c.VerifyWebhook([]byte(body+" "), stripeSig("whsec_test", now.Unix(), body)); err == nil {
		t.Fatal("modified body must fail")
	}
	if err := c.VerifyWebhook([]byte(body), stripeSig("whsec_other", now.Unix(), body)); err == nil {
		t.Fatal("wrong secret must fail")
	}
	if err := c.VerifyWebhook([]byte(body), stripeSig("whsec_test", now.Add(-10*time.Minute).Unix(), body)); err == nil {
		t.Fatal("old timestamp (replay) must fail")
	}
	if err := NewStripeClient("sk", "", "").VerifyWebhook([]byte(body), stripeSig("", now.Unix(), body)); err == nil {
		t.Fatal("no webhook secret configured must fail")
	}
}

func TestStripeCheckoutRequest(t *testing.T) {
	var form url.Values
	var auth string
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		b, _ := io.ReadAll(r.Body)
		form, _ = url.ParseQuery(string(b))
		auth = r.Header.Get("Authorization")
		w.Header().Set("Content-Type", "application/json")
		_, _ = io.WriteString(w, `{"id":"cs_test_1","url":"https://checkout.stripe.com/c/pay/cs_test_1"}`)
	}))
	defer srv.Close()
	c := NewStripeClient("sk_test_x", "", "")
	c.baseURL = srv.URL
	s, err := c.CreateCheckoutSession(context.Background(), StripeCheckoutParams{
		OrderID: "o1", UserID: "u1", Email: "a@b.c", Title: "LacLingo Pro - 1 tháng", AmountCents: 499, Interval: "month",
		SuccessURL: "http://web/billing/result?order=o1&session_id={CHECKOUT_SESSION_ID}", CancelURL: "http://web/billing/result?order=o1&cancelled=1",
	})
	if err != nil || s.ID != "cs_test_1" {
		t.Fatalf("session: %+v %v", s, err)
	}
	checks := map[string]string{
		"mode": "subscription", "client_reference_id": "o1", "line_items[0][price_data][unit_amount]": "499",
		"line_items[0][price_data][recurring][interval]": "month", "subscription_data[metadata][order_id]": "o1",
		"customer_email": "a@b.c", "success_url": "http://web/billing/result?order=o1&session_id={CHECKOUT_SESSION_ID}",
	}
	for k, want := range checks {
		if got := form.Get(k); got != want {
			t.Errorf("%s = %q, want %q", k, got, want)
		}
	}
	if !strings.HasPrefix(auth, "Bearer sk_test_x") {
		t.Error("missing bearer auth")
	}

	// Lỗi Stripe → *stripeError (không lộ key)
	srv2 := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(401)
		_, _ = io.WriteString(w, `{"error":{"type":"invalid_request_error","message":"Invalid API Key provided"}}`)
	}))
	defer srv2.Close()
	c.baseURL = srv2.URL
	if _, err := c.CreateCheckoutSession(context.Background(), StripeCheckoutParams{OrderID: "o", AmountCents: 1}); err == nil || strings.Contains(err.Error(), "sk_test_x") {
		t.Fatalf("stripe error: %v", err)
	}
}

func TestStripeSubscriptionPeriodEnd(t *testing.T) {
	var s StripeSubscription
	s.Items.Data = append(s.Items.Data, struct {
		CurrentPeriodEnd int64 `json:"current_period_end"`
	}{CurrentPeriodEnd: 1_900_000_000})
	if s.PeriodEnd().Unix() != 1_900_000_000 {
		t.Error("period end from items (new API)")
	}
	s = StripeSubscription{CurrentPeriodEnd: 1_850_000_000}
	if s.PeriodEnd().Unix() != 1_850_000_000 {
		t.Error("period end top-level (old API)")
	}
}
