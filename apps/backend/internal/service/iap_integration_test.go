package service

import (
	"context"
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"encoding/base64"
	"encoding/json"
	"encoding/pem"
	"errors"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"sync"
	"testing"
	"time"

	"laclingo-backend/internal/repository"
	"laclingo-backend/internal/repository/db"

	"github.com/google/uuid"
)

// Integration test luồng mua trong app trên Postgres thật (bản sao DB). Chạy:
//   LACLINGO_TEST_DATABASE_URL=postgresql://.../laclingo_xxx_test go test ./internal/service -run IAP
// Không đặt biến → bỏ qua. Apple ký bằng chuỗi chứng chỉ giả (apple_iap_test.go), Google Play API giả bằng httptest.

func TestIAPIntegration(t *testing.T) {
	dbURL := os.Getenv("LACLINGO_TEST_DATABASE_URL")
	if dbURL == "" {
		t.Skip("LACLINGO_TEST_DATABASE_URL chưa đặt")
	}
	ctx := context.Background()
	repo, err := repository.NewPostgresRepository(ctx, dbURL)
	if err != nil {
		t.Fatal(err)
	}
	defer repo.Pool.Close()

	newUser := func(name string) uuid.UUID {
		u, err := repo.CreateUser(ctx, db.CreateUserParams{Email: name + "@iap.test", Username: name, PasswordHash: "x"})
		if err != nil {
			t.Fatal(err)
		}
		t.Cleanup(func() { _, _ = repo.Pool.Exec(ctx, "DELETE FROM users WHERE id = $1", u.ID) })
		return uuid.UUID(u.ID.Bytes)
	}
	suffix := strings.ReplaceAll(uuid.NewString()[:8], "-", "")
	alice, bob := newUser("rt_iap_a"+suffix), newUser("rt_iap_b"+suffix)

	chain := newAppleTestChain(t, true)
	google, gp := newFakeGooglePlay(t)
	svc := NewPaymentService(repo, nil, nil, "http://web", "http://api", nil)
	svc.SetStores(chain.verifier(), google, "rtdn-secret", true)
	plans := NewPlanService(repo)

	status := func(id uuid.UUID) PlanStatus {
		st, err := plans.Status(ctx, id)
		if err != nil {
			t.Fatal(err)
		}
		return st
	}
	gems := func(id uuid.UUID) int32 {
		inv, err := repo.GetUserInventory(ctx, toPgUUID(id))
		if err != nil {
			return 0
		}
		return inv.Gems
	}
	sub := func(original string) db.Subscription {
		var s db.Subscription
		err := repo.Pool.QueryRow(ctx, "SELECT status, auto_renew, expires_at, plan FROM subscriptions WHERE provider_subscription_id = $1 ORDER BY created_at DESC LIMIT 1", original).
			Scan(&s.Status, &s.AutoRenew, &s.ExpiresAt, &s.Plan)
		if err != nil {
			t.Fatalf("subscription %s: %v", original, err)
		}
		return s
	}
	orig := "orig-" + suffix
	in30 := time.Now().Add(30 * 24 * time.Hour).Truncate(time.Millisecond)
	appleTx := func(txID, product string, expires time.Time, account string) string {
		tx := AppleTransaction{TransactionID: txID, OriginalTransactionID: orig, BundleID: "vn.laclingo.app", ProductID: product,
			AppAccountToken: account, Environment: "Sandbox"}
		if !expires.IsZero() {
			tx.ExpiresDate = expires.UnixMilli()
		}
		return chain.sign(t, tx)
	}
	notify := func(kind string, txJWS string, autoRenew int) error {
		renewal := chain.sign(t, AppleRenewalInfo{OriginalTransactionID: orig, AutoRenewStatus: autoRenew})
		return svc.AppleNotification(ctx, chain.sign(t, map[string]any{"notificationType": kind,
			"data": map[string]any{"bundleId": "vn.laclingo.app", "signedTransactionInfo": txJWS, "signedRenewalInfo": renewal}}))
	}

	// 1. Apple gói tháng: cấp Pro, gửi lại không cấp lần 2
	first := appleTx("t1-"+suffix, "laclingo.pro.monthly", in30, alice.String())
	if res, err := svc.VerifyApple(ctx, alice, first); err != nil || !res.Granted || res.Item != ItemMonthly {
		t.Fatalf("mua tháng: %+v %v", res, err)
	}
	if st := status(alice); !st.IsPro {
		t.Fatalf("phải là Pro: %+v", st)
	}
	if res, err := svc.VerifyApple(ctx, alice, first); err != nil || res.Granted {
		t.Errorf("gửi lại phải không cấp lần 2: %+v %v", res, err)
	}

	// 2. Tài khoản khác dùng giao dịch của alice → từ chối
	if _, err := svc.VerifyApple(ctx, bob, first); !errors.Is(err, ErrForbidden) {
		t.Errorf("bob dùng giao dịch của alice phải bị từ chối: %v", err)
	}
	if _, err := svc.VerifyApple(ctx, bob, appleTx("t1b-"+suffix, "laclingo.pro.monthly", in30, "")); !errors.Is(err, ErrForbidden) {
		t.Errorf("bob khôi phục chuỗi giao dịch của alice phải bị từ chối: %v", err)
	}

	// 3. Gia hạn (DID_RENEW) → hạn tiến lên; tắt tự gia hạn → auto_renew=false; hết hạn → kết thúc
	in60 := in30.Add(30 * 24 * time.Hour)
	if err := notify("DID_RENEW", appleTx("t2-"+suffix, "laclingo.pro.monthly", in60, alice.String()), 1); err != nil {
		t.Fatal(err)
	}
	if s := sub(orig); !s.ExpiresAt.Time.Equal(in60) || s.Status != "ACTIVE" {
		t.Errorf("gia hạn phải đẩy hạn tới %v, nhận %+v", in60, s)
	}
	if err := notify("DID_CHANGE_RENEWAL_STATUS", appleTx("t2-"+suffix, "laclingo.pro.monthly", in60, alice.String()), 0); err != nil {
		t.Fatal(err)
	}
	if s := sub(orig); s.AutoRenew {
		t.Errorf("tắt tự gia hạn phải lưu auto_renew=false")
	}
	if err := notify("EXPIRED", appleTx("t2-"+suffix, "laclingo.pro.monthly", in60, alice.String()), 0); err != nil {
		t.Fatal(err)
	}
	if s := sub(orig); s.Status != "EXPIRED" || status(alice).IsPro {
		t.Errorf("hết hạn phải kết thúc gói: %+v", s)
	}

	// 3b. Mua lại sau khi hết hạn (cùng originalTransactionId) → kích hoạt lại dòng cũ, không lỗi unique (H1)
	in90 := in60.Add(30 * 24 * time.Hour)
	if res, err := svc.VerifyApple(ctx, alice, appleTx("t3-"+suffix, "laclingo.pro.monthly", in90, alice.String())); err != nil || !res.Granted {
		t.Fatalf("mua lại sau hết hạn: %+v %v", res, err)
	}
	if s := sub(orig); s.Status != "ACTIVE" || !s.ExpiresAt.Time.Equal(in90) {
		t.Errorf("mua lại phải kích hoạt lại gói tới %v, nhận %+v", in90, s)
	}
	// Tắt tự gia hạn rồi app gửi lại giao dịch (khôi phục) → giữ auto_renew=false (M4)
	if err := notify("DID_CHANGE_RENEWAL_STATUS", appleTx("t3-"+suffix, "laclingo.pro.monthly", in90, alice.String()), 0); err != nil {
		t.Fatal(err)
	}
	if _, err := svc.VerifyApple(ctx, alice, appleTx("t3-"+suffix, "laclingo.pro.monthly", in90, alice.String())); err != nil {
		t.Fatal(err)
	}
	if s := sub(orig); s.AutoRenew {
		t.Errorf("app gửi lại giao dịch không được bật lại tự gia hạn")
	}
	// EXPIRED cũ (kỳ t2) tới muộn sau khi đã gia hạn → không cắt gói (M3)
	if err := notify("EXPIRED", appleTx("t2-"+suffix, "laclingo.pro.monthly", in60, alice.String()), 0); err != nil {
		t.Fatal(err)
	}
	if s := sub(orig); s.Status != "ACTIVE" {
		t.Errorf("EXPIRED tới muộn không được kết thúc gói đang chạy: %+v", s)
	}
	// Nâng lên gói năm trong cùng nhóm → cập nhật plan (L3); ân hạn khi chưa trừ được tiền → giữ Pro tới hết ân hạn (L2)
	in400 := time.Now().Add(400 * 24 * time.Hour).Truncate(time.Millisecond)
	if err := notify("DID_RENEW", appleTx("t4-"+suffix, "laclingo.pro.yearly", in400, alice.String()), 1); err != nil {
		t.Fatal(err)
	}
	if s := sub(orig); s.Plan != PlanYearly || !s.ExpiresAt.Time.Equal(in400) {
		t.Errorf("nâng gói năm: nhận %+v", s)
	}
	in410 := in400.Add(10 * 24 * time.Hour)
	if err := svc.AppleNotification(ctx, chain.sign(t, map[string]any{"notificationType": "DID_FAIL_TO_RENEW", "subtype": "GRACE_PERIOD",
		"data": map[string]any{"bundleId": "vn.laclingo.app", "signedTransactionInfo": appleTx("t4-"+suffix, "laclingo.pro.yearly", in400, alice.String()),
			"signedRenewalInfo": chain.sign(t, AppleRenewalInfo{OriginalTransactionID: orig, GracePeriodExpiresDate: in410.UnixMilli()})}})); err != nil {
		t.Fatal(err)
	}
	if s := sub(orig); !s.ExpiresAt.Time.Equal(in410) {
		t.Errorf("ân hạn phải giữ Pro tới %v, nhận %v", in410, s.ExpiresAt.Time)
	}
	// Khôi phục kỳ cũ đã hết hạn → không báo "đã cấp" (M2)
	if res, err := svc.VerifyApple(ctx, alice, appleTx("t0-"+suffix, "laclingo.pro.monthly", time.Now().Add(-time.Hour), alice.String())); err != nil || res.Granted {
		t.Errorf("kỳ cũ đã hết hạn: %+v %v", res, err)
	}
	// Hoàn tiền rồi gửi lại JWS cũ → không có lại Pro (H2)
	t4 := appleTx("t4-"+suffix, "laclingo.pro.yearly", in400, alice.String())
	if err := svc.AppleNotification(ctx, chain.sign(t, map[string]any{"notificationType": "REFUND",
		"data": map[string]any{"bundleId": "vn.laclingo.app", "signedTransactionInfo": t4}})); err != nil {
		t.Fatal(err)
	}
	if status(alice).IsPro {
		t.Errorf("hoàn tiền phải kết thúc Pro")
	}
	if _, err := svc.VerifyApple(ctx, alice, t4); !errors.Is(err, ErrInvalidInput) || status(alice).IsPro {
		t.Errorf("gửi lại giao dịch đã hoàn tiền phải bị từ chối: %v", err)
	}

	// 4. Gems + hoàn tiền: tiêu bớt rồi hoàn → trừ tối đa số dư, không âm
	gemsJWS := chain.sign(t, AppleTransaction{TransactionID: "g1-" + suffix, OriginalTransactionID: "g1-" + suffix, BundleID: "vn.laclingo.app",
		ProductID: "laclingo.gems.550", AppAccountToken: alice.String()})
	if res, err := svc.VerifyApple(ctx, alice, gemsJWS); err != nil || !res.Granted || gems(alice) != 550 {
		t.Fatalf("mua gems: %+v %v, số dư %d", res, err, gems(alice))
	}
	if _, err := repo.Pool.Exec(ctx, "UPDATE user_inventory SET gems = 200 WHERE user_id = $1", toPgUUID(alice)); err != nil {
		t.Fatal(err)
	}
	if err := svc.AppleNotification(ctx, chain.sign(t, map[string]any{"notificationType": "REFUND",
		"data": map[string]any{"bundleId": "vn.laclingo.app", "signedTransactionInfo": gemsJWS}})); err != nil {
		t.Fatal(err)
	}
	if g := gems(alice); g != 0 {
		t.Errorf("hoàn tiền gems phải trừ về 0 (không âm), còn %d", g)
	}
	if _, err := svc.VerifyApple(ctx, alice, gemsJWS); !errors.Is(err, ErrInvalidInput) || gems(alice) != 0 {
		t.Errorf("gửi lại gói gems đã hoàn tiền phải bị từ chối: %v, gems %d", err, gems(alice))
	}

	// 5. Trọn đời rồi mua tháng → giữ trọn đời
	life := chain.sign(t, AppleTransaction{TransactionID: "l1-" + suffix, OriginalTransactionID: "l1-" + suffix, BundleID: "vn.laclingo.app",
		ProductID: "laclingo.pro.lifetime", AppAccountToken: bob.String()})
	if _, err := svc.VerifyApple(ctx, bob, life); err != nil {
		t.Fatal(err)
	}
	gp.subs["gtok-"+suffix] = googleSubFixture("laclingo.pro.monthly", "SUBSCRIPTION_STATE_ACTIVE", in30, true, bob.String())
	if _, err := svc.VerifyGoogle(ctx, bob, "laclingo.pro.monthly", "gtok-"+suffix); err != nil {
		t.Fatal(err)
	}
	if st := status(bob); st.Subscription == nil || st.Subscription.Plan != PlanLifetime {
		t.Errorf("đã trọn đời thì giữ trọn đời, nhận %+v", st)
	}

	// 6. Google: gói tháng cho tài khoản mới → acknowledge; RTDN huỷ tự gia hạn / hết hạn; hoàn tiền mua 1 lần
	carol := newUser("rt_iap_c" + suffix)
	gtok := "gtok2-" + suffix
	gp.subs[gtok] = googleSubFixture("laclingo.pro.yearly", "SUBSCRIPTION_STATE_ACTIVE", in60, true, carol.String())
	if res, err := svc.VerifyGoogle(ctx, carol, "laclingo.pro.yearly", gtok); err != nil || !res.Granted || !status(carol).IsPro {
		t.Fatalf("Google gói năm: %+v %v", res, err)
	}
	if !gp.acked("subscriptions/laclingo.pro.yearly/tokens/" + gtok) {
		t.Errorf("phải acknowledge subscription Google")
	}
	rtdn := func(n map[string]any) error {
		raw, _ := json.Marshal(n)
		body, _ := json.Marshal(map[string]any{"message": map[string]any{"data": base64.StdEncoding.EncodeToString(raw)}})
		return svc.GoogleNotification(ctx, "rtdn-secret", body)
	}
	gp.subs[gtok] = googleSubFixture("laclingo.pro.yearly", "SUBSCRIPTION_STATE_CANCELED", in60, false, carol.String())
	if err := rtdn(map[string]any{"packageName": "vn.laclingo.app", "subscriptionNotification": map[string]any{"notificationType": 3, "purchaseToken": gtok, "subscriptionId": "laclingo.pro.yearly"}}); err != nil {
		t.Fatal(err)
	}
	if s := sub(gtok); s.AutoRenew || s.Status != "ACTIVE" {
		t.Errorf("huỷ tự gia hạn: vẫn Pro tới hết kỳ, auto_renew=false; nhận %+v", s)
	}
	gp.subs[gtok] = googleSubFixture("laclingo.pro.yearly", "SUBSCRIPTION_STATE_EXPIRED", in60, false, carol.String())
	if err := rtdn(map[string]any{"packageName": "vn.laclingo.app", "subscriptionNotification": map[string]any{"notificationType": 13, "purchaseToken": gtok, "subscriptionId": "laclingo.pro.yearly"}}); err != nil {
		t.Fatal(err)
	}
	if s := sub(gtok); s.Status != "EXPIRED" {
		t.Errorf("RTDN hết hạn phải kết thúc gói: %+v", s)
	}
	// Google ON_HOLD/EXPIRED rồi khôi phục với cùng purchaseToken → kích hoạt lại (H1)
	gp.subs[gtok] = googleSubFixture("laclingo.pro.yearly", "SUBSCRIPTION_STATE_ACTIVE", in90, true, carol.String())
	if err := rtdn(map[string]any{"packageName": "vn.laclingo.app", "subscriptionNotification": map[string]any{"notificationType": 1, "purchaseToken": gtok, "subscriptionId": "laclingo.pro.yearly"}}); err != nil {
		t.Fatalf("RTDN khôi phục: %v", err)
	}
	if s := sub(gtok); s.Status != "ACTIVE" || !s.ExpiresAt.Time.Equal(in90) {
		t.Errorf("Google khôi phục phải kích hoạt lại gói: %+v", s)
	}
	if err := svc.GoogleNotification(ctx, "rtdn-secret", []byte(`không phải json`)); err != nil {
		t.Errorf("RTDN hỏng phải bỏ qua (200), nhận %v", err)
	}
	if err := svc.GoogleNotification(ctx, "sai", []byte(`{}`)); !errors.Is(err, ErrForbidden) {
		t.Errorf("RTDN sai token phải bị từ chối: %v", err)
	}

	ptok := "ptok-" + suffix
	gp.products[ptok] = GoogleProductPurchase{PurchaseState: 0, ObfuscatedExternalAccountID: carol.String()}
	if res, err := svc.VerifyGoogle(ctx, carol, "laclingo.gems.100", ptok); err != nil || !res.Granted || gems(carol) != 100 {
		t.Fatalf("Google gems: %+v %v %d", res, err, gems(carol))
	}
	if err := rtdn(map[string]any{"packageName": "vn.laclingo.app", "voidedPurchaseNotification": map[string]any{"purchaseToken": ptok, "productType": 2}}); err != nil {
		t.Fatal(err)
	}
	if g := gems(carol); g != 0 {
		t.Errorf("Google hoàn tiền gems phải trừ lại, còn %d", g)
	}
	gp.products["pending-"+suffix] = GoogleProductPurchase{PurchaseState: 2}
	if _, err := svc.VerifyGoogle(ctx, carol, "laclingo.gems.100", "pending-"+suffix); !errors.Is(err, ErrInvalidInput) {
		t.Errorf("giao dịch đang chờ phải bị từ chối: %v", err)
	}

	// 7. Xoá tài khoản: gói Google Play tự gia hạn → huỷ qua Play API; gói App Store → không chặn (app nhắc tự huỷ)
	dave := newUser("rt_iap_d" + suffix)
	dtok := "dtok-" + suffix
	gp.subs[dtok] = googleSubFixture("laclingo.pro.monthly", "SUBSCRIPTION_STATE_ACTIVE", in30, true, dave.String())
	if _, err := svc.VerifyGoogle(ctx, dave, "laclingo.pro.monthly", dtok); err != nil {
		t.Fatal(err)
	}
	if err := svc.PrepareAccountDeletion(ctx, dave); err != nil {
		t.Fatalf("xoá tài khoản có gói Google: %v", err)
	}
	if !gp.cancelled("subscriptions/laclingo.pro.monthly/tokens/" + dtok) {
		t.Errorf("phải huỷ gói Google Play khi xoá tài khoản")
	}
	erin := newUser("rt_iap_e" + suffix)
	orig = "orig-e-" + suffix
	if _, err := svc.VerifyApple(ctx, erin, appleTx("te-"+suffix, "laclingo.pro.monthly", in30, erin.String())); err != nil {
		t.Fatal(err)
	}
	if err := svc.PrepareAccountDeletion(ctx, erin); err != nil {
		t.Errorf("gói App Store không được chặn xoá tài khoản (server không có Stripe): %v", err)
	}

	// 8. Tài khoản mua đã bị xoá → gói store (vẫn đang trừ tiền) gắn được vào tài khoản mới (M5)
	frank, err := repo.CreateUser(ctx, db.CreateUserParams{Email: "rt_iap_f" + suffix + "@iap.test", Username: "rt_iap_f" + suffix, PasswordHash: "x"})
	if err != nil {
		t.Fatal(err)
	}
	frankID := uuid.UUID(frank.ID.Bytes)
	orig = "orig-f-" + suffix
	fjws := appleTx("tf-"+suffix, "laclingo.pro.monthly", in30, frankID.String())
	if _, err := svc.VerifyApple(ctx, frankID, fjws); err != nil {
		t.Fatal(err)
	}
	if _, err := repo.Pool.Exec(ctx, "DELETE FROM users WHERE id = $1", frank.ID); err != nil {
		t.Fatal(err)
	}
	george := newUser("rt_iap_g" + suffix)
	if res, err := svc.VerifyApple(ctx, george, appleTx("tf2-"+suffix, "laclingo.pro.monthly", in60, frankID.String())); err != nil || !res.Granted || !status(george).IsPro {
		t.Errorf("gói của tài khoản đã xoá phải gắn được vào tài khoản mới: %+v %v", res, err)
	}
	if _, err := svc.VerifyApple(ctx, george, appleTx("tf3-"+suffix, "laclingo.pro.monthly", in60, strings.ToUpper(george.String()))); err != nil {
		t.Errorf("appAccountToken chữ hoa vẫn là cùng tài khoản (L4): %v", err)
	}

	// 9. Tắt nhận giao dịch thử nghiệm → từ chối sandbox (M1)
	strict := NewPaymentService(repo, nil, nil, "http://web", "http://api", nil)
	strict.SetStores(chain.verifier(), google, "rtdn-secret", false)
	sandboxJWS := chain.sign(t, AppleTransaction{TransactionID: "sb-" + suffix, OriginalTransactionID: "sb-" + suffix, BundleID: "vn.laclingo.app",
		ProductID: "laclingo.gems.100", AppAccountToken: george.String(), Environment: "Sandbox"})
	if _, err := strict.VerifyApple(ctx, george, sandboxJWS); !errors.Is(err, errIAPSandbox) {
		t.Errorf("tắt sandbox phải từ chối giao dịch thử nghiệm: %v", err)
	}

	_, _ = repo.Pool.Exec(ctx, "DELETE FROM iap_purchases WHERE transaction_id LIKE '%' || $1", suffix)
}

func googleSubFixture(product, state string, expiry time.Time, autoRenew bool, account string) GoogleSubscription {
	s := GoogleSubscription{SubscriptionState: state, AcknowledgementState: "ACKNOWLEDGEMENT_STATE_PENDING"}
	s.LineItems = append(s.LineItems, struct {
		ProductID        string `json:"productId"`
		ExpiryTime       string `json:"expiryTime"`
		AutoRenewingPlan *struct {
			AutoRenewEnabled bool `json:"autoRenewEnabled"`
		} `json:"autoRenewingPlan"`
	}{ProductID: product, ExpiryTime: expiry.UTC().Format(time.RFC3339Nano), AutoRenewingPlan: &struct {
		AutoRenewEnabled bool `json:"autoRenewEnabled"`
	}{autoRenew}})
	s.ExternalAccountIdentifiers = &struct {
		ObfuscatedExternalAccountID string `json:"obfuscatedExternalAccountId"`
	}{account}
	return s
}

// fakePlay — Google Play Developer API giả: trả trạng thái theo map, ghi lại các lần acknowledge
type fakePlay struct {
	mu       sync.Mutex
	acks     []string
	subs     map[string]GoogleSubscription
	products map[string]GoogleProductPurchase
}

func (f *fakePlay) acked(path string) bool {
	f.mu.Lock()
	defer f.mu.Unlock()
	for _, a := range f.acks {
		if strings.HasSuffix(a, path+":acknowledge") {
			return true
		}
	}
	return false
}

func (f *fakePlay) cancelled(path string) bool {
	f.mu.Lock()
	defer f.mu.Unlock()
	for _, a := range f.acks {
		if strings.HasSuffix(a, path+":cancel") {
			return true
		}
	}
	return false
}

func newFakeGooglePlay(t *testing.T) (*GooglePlayClient, *fakePlay) {
	t.Helper()
	play := &fakePlay{subs: map[string]GoogleSubscription{}, products: map[string]GoogleProductPurchase{}}
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/token" {
			_, _ = io.WriteString(w, `{"access_token":"at","expires_in":3600}`)
			return
		}
		play.mu.Lock()
		defer play.mu.Unlock()
		if r.Method == http.MethodPost {
			play.acks = append(play.acks, r.URL.Path)
			return
		}
		token := r.URL.Path[strings.LastIndex(r.URL.Path, "/")+1:]
		var v any
		var ok bool
		if strings.Contains(r.URL.Path, "/subscriptionsv2/") {
			v, ok = play.subs[token]
		} else {
			v, ok = play.products[token]
		}
		if !ok {
			w.WriteHeader(http.StatusNotFound)
			return
		}
		_ = json.NewEncoder(w).Encode(v)
	}))
	t.Cleanup(srv.Close)
	key, _ := rsa.GenerateKey(rand.Reader, 2048)
	keyPEM := pem.EncodeToMemory(&pem.Block{Type: "RSA PRIVATE KEY", Bytes: x509.MarshalPKCS1PrivateKey(key)})
	sa, _ := json.Marshal(googleServiceAccount{ProjectID: "p", ClientEmail: "bot@p.iam.gserviceaccount.com", PrivateKey: string(keyPEM), TokenURI: srv.URL + "/token"})
	client, err := NewGooglePlayClient(sa, "vn.laclingo.app", srv.URL)
	if err != nil {
		t.Fatal(err)
	}
	return client, play
}
