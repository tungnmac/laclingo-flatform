package service

import (
	"context"
	"crypto/subtle"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"time"

	"laclingo-backend/internal/repository/db"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

// Mua trong app iOS/Android: app mua qua StoreKit / Google Play Billing rồi gửi bằng chứng lên đây; backend tự xác thực
// với Apple (chữ ký JWS) / Google (Play Developer API), giao hàng đúng 1 lần cho mỗi giao dịch (iap_purchases), rồi
// theo dõi gia hạn / huỷ / hoàn tiền qua thông báo của store. Trong app không dùng VNPay/Stripe (chính sách store).

const (
	PlatformApple  = "APPLE"
	PlatformGoogle = "GOOGLE"

	providerAppleIAP   = "APPLE_IAP"   // subscriptions.payment_provider
	providerGooglePlay = "GOOGLE_PLAY" // subscriptions.payment_provider
)

var (
	ErrIAPNotConfigured = errors.New("thanh toán qua store chưa được cấu hình trên server")
	errIAPOtherAccount  = fmt.Errorf("giao dịch này thuộc một tài khoản LacLingo khác: %w", ErrForbidden)
	errIAPRefunded      = fmt.Errorf("giao dịch đã được hoàn tiền: %w", ErrInvalidInput)
	errIAPSandbox       = fmt.Errorf("giao dịch thử nghiệm (sandbox) không được chấp nhận: %w", ErrInvalidInput)
)

// SetStores bật mua trong app (nil = store đó chưa cấu hình). allowSandbox: nhận giao dịch thử nghiệm (Apple Sandbox /
// TestFlight, tài khoản test của Google) — Apple duyệt app bằng sandbox trên server thật nên cần bật khi nộp duyệt.
func (s *PaymentService) SetStores(apple *AppleVerifier, google *GooglePlayClient, googleRTDNToken string, allowSandbox bool) {
	s.apple, s.google, s.googleRTDNToken, s.iapAllowSandbox = apple, google, googleRTDNToken, allowSandbox
}

// IAPResult — kết quả xác thực 1 giao dịch store
type IAPResult struct {
	Item    string `json:"item"`
	Granted bool   `json:"granted"` // true = lần này vừa cấp gói / gems (false: đã ghi nhận trước đó, kỳ đã hết...)
}

// storeGrant — 1 giao dịch store đã xác thực
type storeGrant struct {
	UserID        uuid.UUID
	Platform      string
	Item          CatalogItem
	ProductID     string
	TransactionID string
	OriginalID    string
	Sandbox       bool
	Environment   string
	AccountToken  string     // appAccountToken (Apple) / obfuscatedExternalAccountId (Google) — app đặt = user ID
	Expires       *time.Time // gói tự gia hạn: hết kỳ hiện tại
	AutoRenew     bool
	// AutoRenewKnown: AutoRenew lấy từ store (Google, thông báo Apple). Giao dịch StoreKit app gửi lên không mang trạng
	// thái tự gia hạn → không ghi đè cờ đã lưu (chỉ dùng AutoRenew khi tạo gói mới)
	AutoRenewKnown bool
	Notify         bool // giao dịch do học viên vừa mua → gửi thông báo "đã kích hoạt"
}

func storeProvider(platform string) string {
	if platform == PlatformApple {
		return providerAppleIAP
	}
	return providerGooglePlay
}

func storeName(platform string) string {
	if platform == PlatformApple {
		return "App Store"
	}
	return "Google Play"
}

// checkOwner — 1 giao dịch store chỉ gắn với 1 tài khoản LacLingo: token tài khoản app gửi lúc mua phải khớp (trừ khi
// tài khoản đó đã bị xoá — gói store vẫn đang trừ tiền, cho gắn sang tài khoản hiện tại), và chuỗi giao dịch chưa
// thuộc tài khoản khác. Gọi trong transaction đã khoá chuỗi (LockIAPChain).
func (s *PaymentService) checkOwner(ctx context.Context, qtx *db.Queries, g storeGrant) error {
	if g.AccountToken != "" {
		token, err := uuid.Parse(g.AccountToken)
		if err != nil {
			return errIAPOtherAccount
		}
		if token != g.UserID {
			if _, err := qtx.GetUserByID(ctx, toPgUUID(token)); !errors.Is(err, pgx.ErrNoRows) {
				return errIAPOtherAccount // tài khoản mua vẫn còn (hoặc lỗi DB — không mạo hiểm gắn nhầm)
			}
		}
	}
	owner, err := qtx.GetIAPOwner(ctx, db.GetIAPOwnerParams{Platform: g.Platform, OriginalID: g.OriginalID})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil
	}
	if err != nil {
		return err
	}
	if uuid.UUID(owner.Bytes) != g.UserID {
		return errIAPOtherAccount
	}
	return nil
}

// grantStore ghi nhận giao dịch + giao hàng trong 1 transaction. Giao dịch đã ghi nhận: gems / trọn đời không giao lại;
// gói tự gia hạn vẫn cập nhật hạn (Google gia hạn giữ nguyên purchaseToken, khôi phục gửi lại giao dịch cũ).
func (s *PaymentService) grantStore(ctx context.Context, g storeGrant) (IAPResult, error) {
	result := IAPResult{Item: g.Item.ID}
	if g.Sandbox && !s.iapAllowSandbox {
		return result, errIAPSandbox
	}
	tx, err := s.repo.BeginTx(ctx)
	if err != nil {
		return result, err
	}
	defer tx.Rollback(ctx)
	qtx := s.repo.WithTx(tx)
	if err := qtx.LockIAPChain(ctx, g.Platform+":"+g.OriginalID); err != nil {
		return result, err
	}
	if err := s.checkOwner(ctx, qtx, g); err != nil {
		return result, err
	}
	userID := toPgUUID(g.UserID)
	_, err = qtx.InsertIAPPurchase(ctx, db.InsertIAPPurchaseParams{
		UserID: userID, Platform: g.Platform, Item: g.Item.ID, ProductID: g.ProductID,
		TransactionID: g.TransactionID, OriginalID: g.OriginalID, Environment: g.Environment,
	})
	isNew := err == nil
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return result, err
	}
	if !isNew {
		prev, err := qtx.GetIAPPurchaseByTransaction(ctx, db.GetIAPPurchaseByTransactionParams{Platform: g.Platform, TransactionID: g.TransactionID})
		if err != nil {
			return result, err
		}
		if prev.Status == "REVOKED" {
			return result, errIAPRefunded // hoàn tiền rồi gửi lại giao dịch cũ (chữ ký vẫn hợp lệ) — không cấp lại
		}
		if prev.UserID.Valid && prev.UserID != userID {
			return result, errIAPOtherAccount
		}
	}
	renewable := g.Item.Kind == "plan" && g.Item.Plan != PlanLifetime
	if !isNew && !renewable {
		return result, nil
	}
	applied := false
	var notice NotificationInput
	var cancelStripeSub string
	if g.Item.Kind == "gems" {
		balance, err := addGemsTx(ctx, qtx, userID, int32(g.Item.Gems), "PURCHASE", itemTitle(g.Item)+" ("+storeName(g.Platform)+")", pgtype.UUID{})
		if err != nil {
			return result, err
		}
		applied = true
		notice = NotificationInput{Type: NotificationPayment, Icon: "💎", URL: "/wallet",
			Title: fmt.Sprintf("Đã nạp %d gems", g.Item.Gems), Body: fmt.Sprintf("Số dư ví: %d gems.", balance)}
	} else {
		if applied, cancelStripeSub, err = s.applyStorePlan(ctx, qtx, g); err != nil {
			return result, err
		}
		notice = NotificationInput{Type: NotificationPayment, Icon: "⭐", URL: "/pricing",
			Title: "Đã kích hoạt LacLingo Pro", Body: "Cảm ơn bạn! " + itemTitle(g.Item) + " đã được kích hoạt."}
	}
	if err := tx.Commit(ctx); err != nil {
		return result, err
	}
	result.Granted = isNew && applied
	if cancelStripeSub != "" && s.stripe != nil {
		// Đang có gói Stripe tự gia hạn mà mua lại qua store — huỷ Stripe để không bị trừ tiền 2 nơi
		if err := s.stripe.CancelSubscription(context.WithoutCancel(ctx), cancelStripeSub); err != nil && !isStripeNotFound(err) {
			log.Printf("❌ iap: huỷ Stripe subscription %s (đã mua lại qua %s) thất bại: %v", cancelStripeSub, storeName(g.Platform), err)
		}
	}
	if result.Granted && g.Notify && s.notifier != nil {
		s.notifier.Notify(ctx, g.UserID, notice)
	}
	return result, nil
}

// applyStorePlan — gói Pro mua qua store. Gói của chuỗi giao dịch này đang chạy → cập nhật gói/hạn; chưa chạy → thay gói
// hiện tại (giữ trọn đời; giữ phần trả trước VNPay còn dài hơn), dùng lại dòng cũ nếu chuỗi này từng có gói (mua lại
// sau khi hết hạn). applied = học viên có Pro nhờ giao dịch này. cancelStripeSub: gói Stripe bị thay.
func (s *PaymentService) applyStorePlan(ctx context.Context, qtx *db.Queries, g storeGrant) (applied bool, cancelStripeSub string, err error) {
	now := s.now()
	userID := toPgUUID(g.UserID)
	if g.Item.Plan != PlanLifetime && (g.Expires == nil || !g.Expires.After(now)) {
		return false, "", nil // kỳ đã hết (khôi phục giao dịch cũ) — không có gì để cấp
	}
	key := pgtype.Text{String: g.OriginalID, Valid: true}
	existing, err := qtx.GetSubscriptionByProviderSub(ctx, key)
	found := err == nil
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return false, "", err
	}
	if found && existing.UserID != userID {
		return false, "", errIAPOtherAccount
	}
	if found && existing.Status == "ACTIVE" {
		if g.Item.Plan == PlanLifetime {
			return true, "", nil
		}
		return true, "", qtx.UpdateStoreSubscription(ctx, db.UpdateStoreSubscriptionParams{
			ProviderSubscriptionID: key, Plan: g.Item.Plan, ExpiresAt: pgtype.Timestamptz{Time: *g.Expires, Valid: true},
			AutoRenew: pgtype.Bool{Bool: g.AutoRenew, Valid: g.AutoRenewKnown},
		})
	}
	active, err := qtx.GetActiveSubscription(ctx, userID)
	hasActive := err == nil
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return false, "", err
	}
	if hasActive && active.Plan == PlanLifetime && g.Item.Plan != PlanLifetime {
		return false, "", nil // đã trọn đời — giữ nguyên
	}
	if hasActive && active.AutoRenew && active.PaymentProvider == ProviderStripe && active.ProviderSubscriptionID.Valid {
		cancelStripeSub = active.ProviderSubscriptionID.String
	}
	var expires pgtype.Timestamptz
	if g.Item.Plan != PlanLifetime {
		end := *g.Expires
		if hasActive && !active.AutoRenew && active.ExpiresAt.Valid && active.ExpiresAt.Time.After(end) {
			end = active.ExpiresAt.Time // còn phần trả trước dài hơn kỳ store đầu tiên — không làm mất
		}
		expires = pgtype.Timestamptz{Time: end, Valid: true}
	}
	autoRenew := g.AutoRenew && g.Item.Plan != PlanLifetime
	if err := qtx.CancelActiveSubscriptions(ctx, userID); err != nil {
		return false, "", err
	}
	if found {
		_, err = qtx.ReactivateStoreSubscription(ctx, db.ReactivateStoreSubscriptionParams{
			ProviderSubscriptionID: key, UserID: userID, Plan: g.Item.Plan, ExpiresAt: expires, AutoRenew: autoRenew,
		})
	} else {
		_, err = qtx.CreatePaidSubscription(ctx, db.CreatePaidSubscriptionParams{
			UserID: userID, Plan: g.Item.Plan, StartsAt: pgtype.Timestamptz{Time: now, Valid: true}, ExpiresAt: expires,
			PaymentProvider: storeProvider(g.Platform), AutoRenew: autoRenew, ProviderSubscriptionID: key,
		})
	}
	return err == nil, cancelStripeSub, err
}

// revokeStore — store hoàn tiền / thu hồi 1 giao dịch: gói Pro kết thúc, gói gems trừ lại (tối đa số dư hiện có).
// Giao dịch chưa từng ghi nhận (vd kỳ gia hạn chỉ cập nhật hạn) mà là gói Pro → vẫn kết thúc gói của chuỗi đó.
func (s *PaymentService) revokeStore(ctx context.Context, platform, transactionID, originalID, productID string) error {
	tx, err := s.repo.BeginTx(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	qtx := s.repo.WithTx(tx)
	item, ok := catalogItemByStoreProduct(productID)
	p, err := qtx.RevokeIAPPurchase(ctx, db.RevokeIAPPurchaseParams{Platform: platform, TransactionID: transactionID})
	switch {
	case errors.Is(err, pgx.ErrNoRows):
		if !ok || item.Kind != "plan" {
			return nil // gems chưa từng giao / đã thu hồi
		}
	case err != nil:
		return err
	default:
		if it, found := catalogItem(p.Item); found {
			item, ok = it, true
		}
	}
	switch {
	case !ok:
	case item.Kind == "gems" && p.UserID.Valid:
		if err := qtx.EnsureUserInventory(ctx, p.UserID); err != nil {
			return err
		}
		d, err := qtx.DeductGemsUpTo(ctx, db.DeductGemsUpToParams{UserID: p.UserID, Amount: int32(item.Gems)})
		if err != nil {
			return err
		}
		if d.Deducted > 0 {
			if err := qtx.InsertGemTransaction(ctx, db.InsertGemTransactionParams{
				UserID: p.UserID, Delta: -d.Deducted, BalanceAfter: d.Balance, Reason: "REFUND",
				Note: itemTitle(item) + " (" + storeName(platform) + " hoàn tiền)",
			}); err != nil {
				return err
			}
		}
	case item.Kind == "plan":
		if err := qtx.EndSubscriptionByProviderSub(ctx, pgtype.Text{String: originalID, Valid: true}); err != nil {
			return err
		}
	}
	return tx.Commit(ctx)
}

// ownerOf — tài khoản LacLingo của 1 chuỗi giao dịch (đã từng xác thực), hoặc theo token tài khoản app gửi lúc mua
func (s *PaymentService) ownerOf(ctx context.Context, platform, originalID, accountToken string) (uuid.UUID, bool) {
	owner, err := s.repo.GetIAPOwner(ctx, db.GetIAPOwnerParams{Platform: platform, OriginalID: originalID})
	if err == nil {
		return uuid.UUID(owner.Bytes), true
	}
	if id, err := uuid.Parse(accountToken); err == nil {
		if _, err := s.repo.GetUserByID(ctx, toPgUUID(id)); err == nil {
			return id, true
		}
	}
	return uuid.Nil, false
}

// ===== Apple =====

// VerifyApple — app iOS gửi jwsRepresentation của giao dịch StoreKit 2 vừa mua / khôi phục
func (s *PaymentService) VerifyApple(ctx context.Context, userID uuid.UUID, jws string) (IAPResult, error) {
	if s.apple == nil {
		return IAPResult{}, ErrIAPNotConfigured
	}
	t, err := s.apple.Transaction(jws)
	if err != nil {
		return IAPResult{}, fmt.Errorf("%v: %w", err, ErrInvalidInput)
	}
	if t.RevocationDate > 0 {
		return IAPResult{}, errIAPRefunded
	}
	g, err := appleGrant(userID, t)
	if err != nil {
		return IAPResult{}, err
	}
	g.Notify = true
	return s.grantStore(ctx, g)
}

func appleGrant(userID uuid.UUID, t AppleTransaction) (storeGrant, error) {
	item, ok := catalogItemByStoreProduct(t.ProductID)
	if !ok {
		return storeGrant{}, fmt.Errorf("sản phẩm %q không có trong danh mục: %w", t.ProductID, ErrInvalidInput)
	}
	g := storeGrant{
		UserID: userID, Platform: PlatformApple, Item: item, ProductID: t.ProductID, TransactionID: t.TransactionID,
		OriginalID: t.OriginalTransactionID, Environment: t.Environment, Sandbox: t.Environment == "Sandbox",
		AccountToken: t.AppAccountToken,
	}
	if t.ExpiresDate > 0 {
		end := msTime(t.ExpiresDate)
		// Giao dịch không mang trạng thái tự gia hạn — gói mới coi như còn; DID_CHANGE_RENEWAL_STATUS sẽ cập nhật
		g.Expires, g.AutoRenew = &end, true
	}
	return g, nil
}

// AppleNotification — App Store Server Notifications V2 (POST {"signedPayload": "..."})
func (s *PaymentService) AppleNotification(ctx context.Context, signedPayload string) error {
	if s.apple == nil {
		return ErrIAPNotConfigured
	}
	n, t, renewal, err := s.apple.Notification(signedPayload)
	if err != nil {
		return fmt.Errorf("%v: %w", err, ErrInvalidInput)
	}
	if t == nil {
		if n.NotificationType != "TEST" {
			log.Printf("⚠️  iap: thông báo Apple %s không kèm giao dịch — bỏ qua", n.NotificationType)
		}
		return nil
	}
	if t.Environment == "Sandbox" && !s.iapAllowSandbox {
		return nil
	}
	key := pgtype.Text{String: t.OriginalTransactionID, Valid: true}
	switch n.NotificationType {
	case "SUBSCRIBED", "DID_RENEW", "OFFER_REDEEMED", "RENEWAL_EXTENDED", "ONE_TIME_CHARGE":
		userID, ok := s.ownerOf(ctx, PlatformApple, t.OriginalTransactionID, t.AppAccountToken)
		if !ok {
			return nil // học viên mở app sẽ tự gửi giao dịch lên (transactionUpdated / khôi phục)
		}
		g, err := appleGrant(userID, *t)
		if err != nil {
			return nil // sản phẩm ngoài danh mục — không phải của LacLingo
		}
		if renewal != nil {
			g.AutoRenew, g.AutoRenewKnown = renewal.AutoRenewStatus == 1, true
		}
		if _, err := s.grantStore(ctx, g); err != nil && !errors.Is(err, ErrForbidden) && !errors.Is(err, ErrInvalidInput) {
			return err
		}
	case "DID_CHANGE_RENEWAL_STATUS":
		if renewal != nil {
			return s.repo.SetSubscriptionAutoRenew(ctx, db.SetSubscriptionAutoRenewParams{ProviderSubscriptionID: key, AutoRenew: renewal.AutoRenewStatus == 1})
		}
	case "DID_FAIL_TO_RENEW":
		// Store chưa trừ được tiền kỳ mới; nếu app bật Billing Grace Period thì giữ Pro tới hết ân hạn
		if renewal != nil && renewal.GracePeriodExpiresDate > 0 {
			return s.repo.ExtendStoreSubscription(ctx, db.ExtendStoreSubscriptionParams{
				ProviderSubscriptionID: key, ExpiresAt: pgtype.Timestamptz{Time: msTime(renewal.GracePeriodExpiresDate), Valid: true},
			})
		}
	case "EXPIRED", "GRACE_PERIOD_EXPIRED":
		due := t.ExpiresDate
		if renewal != nil && renewal.GracePeriodExpiresDate > due {
			due = renewal.GracePeriodExpiresDate
		}
		return s.repo.EndStoreSubscriptionIfDue(ctx, db.EndStoreSubscriptionIfDueParams{
			ProviderSubscriptionID: key, ExpiresAt: pgtype.Timestamptz{Time: msTime(due), Valid: true},
		})
	case "REFUND", "REVOKE":
		return s.revokeStore(ctx, PlatformApple, t.TransactionID, t.OriginalTransactionID, t.ProductID)
	case "REFUND_REVERSED":
		log.Printf("⚠️  iap: Apple huỷ hoàn tiền giao dịch %s (%s) — cấp lại thủ công nếu cần", t.TransactionID, t.ProductID)
	}
	return nil
}

// ===== Google =====

// VerifyGoogle — app Android gửi purchaseToken của giao dịch Google Play vừa mua / khôi phục
func (s *PaymentService) VerifyGoogle(ctx context.Context, userID uuid.UUID, productID, purchaseToken string) (IAPResult, error) {
	if s.google == nil {
		return IAPResult{}, ErrIAPNotConfigured
	}
	item, ok := catalogItemByStoreProduct(productID)
	if !ok || purchaseToken == "" || len(purchaseToken) > 4096 {
		return IAPResult{}, fmt.Errorf("giao dịch không hợp lệ: %w", ErrInvalidInput)
	}
	if item.Recurring {
		sub, err := s.google.Subscription(ctx, purchaseToken)
		if errors.Is(err, errGooglePlayNotFound) {
			return IAPResult{}, fmt.Errorf("không tìm thấy giao dịch trên Google Play: %w", ErrInvalidInput)
		}
		if err != nil {
			return IAPResult{}, err
		}
		if len(sub.LineItems) == 0 || sub.LineItems[0].ProductID != productID {
			return IAPResult{}, fmt.Errorf("giao dịch không khớp sản phẩm: %w", ErrInvalidInput)
		}
		g, err := googleSubscriptionGrant(userID, item, purchaseToken, sub)
		if err != nil {
			return IAPResult{}, err
		}
		g.Notify = true
		res, err := s.grantStore(ctx, g)
		if err != nil {
			return res, err
		}
		if sub.AcknowledgementState != "ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED" {
			if err := s.google.AcknowledgeSubscription(ctx, productID, purchaseToken); err != nil {
				log.Printf("❌ iap: acknowledge subscription Google %s: %v", productID, err)
			}
		}
		return res, nil
	}
	p, err := s.google.Product(ctx, productID, purchaseToken)
	if errors.Is(err, errGooglePlayNotFound) {
		return IAPResult{}, fmt.Errorf("không tìm thấy giao dịch trên Google Play: %w", ErrInvalidInput)
	}
	if err != nil {
		return IAPResult{}, err
	}
	switch p.PurchaseState {
	case 0:
	case 2:
		return IAPResult{}, fmt.Errorf("giao dịch đang chờ thanh toán: %w", ErrInvalidInput)
	default:
		return IAPResult{}, fmt.Errorf("giao dịch đã bị huỷ: %w", ErrInvalidInput)
	}
	test := p.PurchaseType != nil && *p.PurchaseType == 0
	res, err := s.grantStore(ctx, storeGrant{
		UserID: userID, Platform: PlatformGoogle, Item: item, ProductID: productID, TransactionID: purchaseToken,
		OriginalID: purchaseToken, Sandbox: test, Environment: googleEnv(test), AccountToken: p.ObfuscatedExternalAccountID,
		Notify: true,
	})
	if err != nil {
		return res, err
	}
	// Trọn đời: xác nhận ở server; gems: app consume (consume cũng là xác nhận) để mua lại được
	if item.Kind == "plan" && p.AcknowledgementState == 0 {
		if err := s.google.AcknowledgeProduct(ctx, productID, purchaseToken); err != nil {
			log.Printf("❌ iap: acknowledge Google %s: %v", productID, err)
		}
	}
	return res, nil
}

func googleEnv(test bool) string {
	if test {
		return "Test"
	}
	return "Production"
}

func googleSubscriptionGrant(userID uuid.UUID, item CatalogItem, token string, sub GoogleSubscription) (storeGrant, error) {
	switch sub.SubscriptionState {
	case "SUBSCRIPTION_STATE_ACTIVE", "SUBSCRIPTION_STATE_IN_GRACE_PERIOD", "SUBSCRIPTION_STATE_CANCELED":
	case "SUBSCRIPTION_STATE_PENDING":
		return storeGrant{}, fmt.Errorf("giao dịch đang chờ thanh toán: %w", ErrInvalidInput)
	default:
		return storeGrant{}, fmt.Errorf("gói đã hết hạn: %w", ErrInvalidInput)
	}
	end, ok := sub.Expiry()
	if !ok {
		return storeGrant{}, fmt.Errorf("giao dịch Google Play thiếu hạn dùng: %w", ErrInvalidInput)
	}
	return storeGrant{
		UserID: userID, Platform: PlatformGoogle, Item: item, ProductID: item.StoreProductID, TransactionID: token,
		OriginalID: token, Sandbox: sub.TestPurchase != nil, Environment: googleEnv(sub.TestPurchase != nil),
		AccountToken: sub.AccountID(), Expires: &end, AutoRenew: sub.AutoRenew(), AutoRenewKnown: true,
	}, nil
}

// GoogleNotification — Real-time developer notification qua Pub/Sub push. token: bí mật trong URL push.
// Dữ liệu hỏng → bỏ qua (200) để Pub/Sub không gửi lại mãi; lỗi tạm (DB, Play API) → lỗi để Pub/Sub gửi lại.
func (s *PaymentService) GoogleNotification(ctx context.Context, token string, body []byte) error {
	if s.google == nil || s.googleRTDNToken == "" {
		return ErrIAPNotConfigured
	}
	if subtle.ConstantTimeCompare([]byte(token), []byte(s.googleRTDNToken)) != 1 {
		return ErrForbidden
	}
	var push struct {
		Message struct {
			Data string `json:"data"`
		} `json:"message"`
	}
	var n googleRTDN
	err := json.Unmarshal(body, &push)
	if err == nil {
		var raw []byte
		if raw, err = base64.StdEncoding.DecodeString(push.Message.Data); err == nil {
			err = json.Unmarshal(raw, &n)
		}
	}
	if err != nil {
		log.Printf("⚠️  iap: RTDN Google không đọc được: %v — bỏ qua", err)
		return nil
	}
	if n.TestNotification != nil || n.PackageName != s.google.packageName {
		return nil // thông báo thử / app khác dùng chung topic
	}
	if v := n.VoidedPurchaseNotification; v != nil {
		return s.revokeStore(ctx, PlatformGoogle, v.PurchaseToken, v.PurchaseToken, s.googleVoidedProduct(ctx, v.PurchaseToken))
	}
	sn := n.SubscriptionNotification
	if sn == nil {
		return nil
	}
	item, ok := catalogItemByStoreProduct(sn.SubscriptionID)
	if !ok {
		return nil
	}
	sub, err := s.google.Subscription(ctx, sn.PurchaseToken)
	if errors.Is(err, errGooglePlayNotFound) {
		return nil
	}
	if err != nil {
		return err // Pub/Sub gửi lại sau
	}
	key := pgtype.Text{String: sn.PurchaseToken, Valid: true}
	switch sub.SubscriptionState {
	case "SUBSCRIPTION_STATE_EXPIRED", "SUBSCRIPTION_STATE_ON_HOLD", "SUBSCRIPTION_STATE_PAUSED":
		return s.repo.EndSubscriptionByProviderSub(ctx, key)
	case "SUBSCRIPTION_STATE_ACTIVE", "SUBSCRIPTION_STATE_IN_GRACE_PERIOD", "SUBSCRIPTION_STATE_CANCELED":
		userID, ok := s.ownerOf(ctx, PlatformGoogle, sn.PurchaseToken, sub.AccountID())
		if !ok && sub.LinkedPurchaseToken != "" {
			// Nâng/hạ gói: token mới thay token cũ — gói thuộc chủ của token cũ
			userID, ok = s.ownerOf(ctx, PlatformGoogle, sub.LinkedPurchaseToken, "")
		}
		if !ok {
			return nil
		}
		g, err := googleSubscriptionGrant(userID, item, sn.PurchaseToken, sub)
		if err != nil {
			return nil
		}
		if _, err := s.grantStore(ctx, g); err != nil && !errors.Is(err, ErrForbidden) && !errors.Is(err, ErrInvalidInput) {
			return err
		}
		if sub.LinkedPurchaseToken != "" {
			// gói cũ đã được Google thay — kết thúc ở LacLingo (gói mới vừa tạo ở trên)
			if err := s.repo.EndSubscriptionByProviderSub(ctx, pgtype.Text{String: sub.LinkedPurchaseToken, Valid: true}); err != nil {
				return err
			}
		}
	}
	return nil
}

// googleVoidedProduct — mã sản phẩm của giao dịch bị hoàn tiền (đã ghi nhận), để biết là gói Pro hay gems
func (s *PaymentService) googleVoidedProduct(ctx context.Context, purchaseToken string) string {
	p, err := s.repo.GetIAPPurchaseByTransaction(ctx, db.GetIAPPurchaseByTransactionParams{Platform: PlatformGoogle, TransactionID: purchaseToken})
	if err != nil {
		return ""
	}
	return p.ProductID
}
