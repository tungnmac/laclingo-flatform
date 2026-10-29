package service

import (
	"context"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"

	"laclingo-backend/internal/repository/db"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

// Thanh toán gói Pro + gói gems qua VNPay (VND, trả trước theo kỳ) và Stripe (USD; gói tháng/năm tự gia hạn).
// Mọi luồng (VNPay IPN/Return, Stripe webhook, trang kết quả tra lại) cùng đi qua fulfill: chuyển đơn PENDING → PAID
// và giao hàng trong 1 transaction — chỉ lần đầu thành công, các lần gửi lại bỏ qua.

var ErrPaymentNotConfigured = errors.New("cổng thanh toán này chưa được cấu hình trên server")

type PaymentRepository interface {
	BeginTx(ctx context.Context) (pgx.Tx, error)
	WithTx(tx pgx.Tx) *db.Queries
	GetUserByID(ctx context.Context, id pgtype.UUID) (db.User, error)
	GetActiveSubscription(ctx context.Context, userID pgtype.UUID) (db.Subscription, error)
	CreatePaymentOrder(ctx context.Context, arg db.CreatePaymentOrderParams) (db.PaymentOrder, error)
	GetPaymentOrder(ctx context.Context, id pgtype.UUID) (db.PaymentOrder, error)
	GetPaymentOrderForUser(ctx context.Context, arg db.GetPaymentOrderForUserParams) (db.PaymentOrder, error)
	SetPaymentOrderProviderRef(ctx context.Context, arg db.SetPaymentOrderProviderRefParams) error
	MarkPaymentOrderClosed(ctx context.Context, arg db.MarkPaymentOrderClosedParams) (int64, error)
	ListPaymentOrdersForUser(ctx context.Context, arg db.ListPaymentOrdersForUserParams) ([]db.PaymentOrder, error)
	GetSubscriptionByProviderSub(ctx context.Context, providerSubscriptionID pgtype.Text) (db.Subscription, error)
	UpdateSubscriptionPeriod(ctx context.Context, arg db.UpdateSubscriptionPeriodParams) error
	EndSubscriptionByProviderSub(ctx context.Context, providerSubscriptionID pgtype.Text) error
	SetSubscriptionAutoRenew(ctx context.Context, arg db.SetSubscriptionAutoRenewParams) error
	GetUserStripeCustomer(ctx context.Context, userID pgtype.UUID) (string, error)
	EnsureUserInventory(ctx context.Context, userID pgtype.UUID) error
	GetUserInventory(ctx context.Context, userID pgtype.UUID) (db.UserInventory, error)
	ListGemTransactions(ctx context.Context, arg db.ListGemTransactionsParams) ([]db.GemTransaction, error)
	ListPendingGemRewards(ctx context.Context, userID pgtype.UUID) ([]db.GemReward, error)
	CountPendingGemRewards(ctx context.Context, userID pgtype.UUID) (db.CountPendingGemRewardsRow, error)
	GetRewardSettings(ctx context.Context) (db.RewardSetting, error)
	GetIAPOwner(ctx context.Context, arg db.GetIAPOwnerParams) (pgtype.UUID, error)
	GetIAPPurchaseByTransaction(ctx context.Context, arg db.GetIAPPurchaseByTransactionParams) (db.IapPurchase, error)
	ExtendStoreSubscription(ctx context.Context, arg db.ExtendStoreSubscriptionParams) error
	EndStoreSubscriptionIfDue(ctx context.Context, arg db.EndStoreSubscriptionIfDueParams) error
	ListAutoRenewSubscriptions(ctx context.Context, userID pgtype.UUID) ([]db.ListAutoRenewSubscriptionsRow, error)
	ListPendingStripeSessions(ctx context.Context, userID pgtype.UUID) ([]string, error)
	CancelPendingPaymentOrders(ctx context.Context, arg db.CancelPendingPaymentOrdersParams) error
}

type PaymentService struct {
	repo     PaymentRepository
	vnpay    *VNPayClient  // nil = chưa cấu hình VNPay
	stripe   *StripeClient // nil = chưa cấu hình Stripe
	webURL   string        // trang web (trang kết quả thanh toán)
	apiURL   string        // API public (VNPay Return URL)
	notifier Notifier
	// Mua trong app (iap.go) — nil = store đó chưa cấu hình
	apple           *AppleVerifier
	google          *GooglePlayClient
	googleRTDNToken string // bí mật trong URL push của Pub/Sub (Google RTDN)
	iapAllowSandbox bool   // nhận giao dịch thử nghiệm (Apple Sandbox / TestFlight, tài khoản test Google)
	now             func() time.Time

	syncMu   sync.Mutex
	lastSync map[uuid.UUID]time.Time // lần gần nhất trang kết quả hỏi lại Stripe cho 1 đơn
}

// Trang kết quả hỏi lại Stripe tối đa 1 lần / khoảng này cho mỗi đơn (tránh dùng hết hạn mức API Stripe)
const stripeSyncInterval = 5 * time.Second

func NewPaymentService(repo PaymentRepository, vnpay *VNPayClient, stripe *StripeClient, webURL, apiURL string, notifier Notifier) *PaymentService {
	return &PaymentService{
		repo: repo, vnpay: vnpay, stripe: stripe, notifier: notifier, now: time.Now, lastSync: map[uuid.UUID]time.Time{},
		webURL: strings.TrimRight(webURL, "/"), apiURL: strings.TrimRight(apiURL, "/"),
	}
}

// ===== Danh mục + tạo đơn =====

type PaymentProviders struct {
	VNPay      bool `json:"vnpay"`
	Stripe     bool `json:"stripe"`
	Apple      bool `json:"apple"`       // mua trong app iOS (App Store)
	GooglePlay bool `json:"google_play"` // mua trong app Android (Google Play)
}

type CatalogResponse struct {
	Items               []CatalogItem    `json:"items"`
	Providers           PaymentProviders `json:"providers"`
	StreakFreezeGemCost int              `json:"streak_freeze_gem_cost"`
	MaxStreakFreezes    int              `json:"max_streak_freezes"`
}

func (s *PaymentService) Catalog() CatalogResponse {
	return CatalogResponse{
		Items:               paymentCatalog,
		Providers:           PaymentProviders{VNPay: s.vnpay != nil, Stripe: s.stripe != nil, Apple: s.apple != nil, GooglePlay: s.google != nil},
		StreakFreezeGemCost: StreakFreezeGemCost, MaxStreakFreezes: MaxStreakFreezes,
	}
}

type CheckoutRequest struct {
	Item     string `json:"item" example:"MONTHLY" enums:"MONTHLY,YEARLY,LIFETIME,GEMS_100,GEMS_550,GEMS_1200"`
	Provider string `json:"provider" example:"VNPAY" enums:"VNPAY,STRIPE"`
}

type CheckoutResponse struct {
	OrderID uuid.UUID `json:"order_id" swaggertype:"string" format:"uuid"`
	URL     string    `json:"url"` // chuyển trình duyệt tới đây để thanh toán
}

// vnpayTxnRef — mã đơn gửi VNPay (UUID bỏ gạch, chỉ chữ số/chữ cái)
func vnpayTxnRef(id pgtype.UUID) string { return hex.EncodeToString(id.Bytes[:]) }

func orderIDFromTxnRef(ref string) (pgtype.UUID, bool) {
	b, err := hex.DecodeString(ref)
	if err != nil || len(b) != 16 {
		return pgtype.UUID{}, false
	}
	var id pgtype.UUID
	copy(id.Bytes[:], b)
	id.Valid = true
	return id, true
}

// Checkout tạo đơn + URL thanh toán. Gói Pro: không bán thêm khi đã có Pro trọn đời hoặc gói Stripe đang tự gia hạn.
func (s *PaymentService) Checkout(ctx context.Context, userID uuid.UUID, req CheckoutRequest, clientIP string) (CheckoutResponse, error) {
	item, ok := catalogItem(req.Item)
	if !ok {
		return CheckoutResponse{}, fmt.Errorf("mặt hàng không hợp lệ: %w", ErrInvalidInput)
	}
	switch {
	case req.Provider == ProviderVNPay && s.vnpay == nil, req.Provider == ProviderStripe && s.stripe == nil:
		return CheckoutResponse{}, ErrPaymentNotConfigured
	case req.Provider != ProviderVNPay && req.Provider != ProviderStripe:
		return CheckoutResponse{}, fmt.Errorf("cổng thanh toán phải là VNPAY hoặc STRIPE: %w", ErrInvalidInput)
	}
	user, err := s.repo.GetUserByID(ctx, toPgUUID(userID))
	if err != nil {
		return CheckoutResponse{}, err
	}
	if item.Kind == "plan" {
		active, err := s.repo.GetActiveSubscription(ctx, toPgUUID(userID))
		switch {
		case err == nil && active.Plan == PlanLifetime:
			return CheckoutResponse{}, fmt.Errorf("bạn đã có LacLingo Pro trọn đời: %w", ErrInvalidInput)
		case err == nil && active.AutoRenew:
			return CheckoutResponse{}, fmt.Errorf("gói Pro của bạn đang tự gia hạn qua Stripe — đổi/huỷ ở mục Quản lý gói: %w", ErrInvalidInput)
		case err != nil && !errors.Is(err, pgx.ErrNoRows):
			return CheckoutResponse{}, err
		}
	}

	params := db.CreatePaymentOrderParams{UserID: toPgUUID(userID), Item: item.ID, Provider: req.Provider}
	if req.Provider == ProviderVNPay {
		params.Amount, params.Currency = item.PriceVND, "VND"
	} else {
		params.Amount, params.Currency, params.AutoRenew = item.PriceUSD, "USD", item.Recurring
	}
	order, err := s.repo.CreatePaymentOrder(ctx, params)
	if err != nil {
		return CheckoutResponse{}, err
	}
	orderID := uuid.UUID(order.ID.Bytes)

	if req.Provider == ProviderVNPay {
		ref := vnpayTxnRef(order.ID)
		payURL := s.vnpay.PaymentURL(ref, order.Amount, "Thanh toan LacLingo "+item.ID+" "+ref, s.apiURL+"/billing/vnpay/return", clientIP)
		return CheckoutResponse{OrderID: orderID, URL: payURL}, nil
	}

	customer, err := s.repo.GetUserStripeCustomer(ctx, toPgUUID(userID))
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return CheckoutResponse{}, err
	}
	result := fmt.Sprintf("%s/billing/result?order=%s", s.webURL, orderID)
	interval := ""
	if params.AutoRenew {
		interval = map[string]string{PlanMonthly: "month", PlanYearly: "year"}[item.Plan]
	}
	sess, err := s.stripe.CreateCheckoutSession(ctx, StripeCheckoutParams{
		OrderID: orderID.String(), UserID: userID.String(), Email: user.Email, Title: itemTitle(item),
		AmountCents: order.Amount, Interval: interval, CustomerID: customer,
		SuccessURL: result + "&session_id={CHECKOUT_SESSION_ID}", CancelURL: result + "&cancelled=1",
	})
	if err != nil {
		s.closeOrder(ctx, order.ID, "FAILED", "không tạo được phiên thanh toán Stripe")
		return CheckoutResponse{}, fmt.Errorf("không tạo được phiên thanh toán Stripe: %w", err)
	}
	if err := s.repo.SetPaymentOrderProviderRef(ctx, db.SetPaymentOrderProviderRefParams{ID: order.ID, ProviderRef: pgtype.Text{String: sess.ID, Valid: true}}); err != nil {
		return CheckoutResponse{}, err
	}
	return CheckoutResponse{OrderID: orderID, URL: sess.URL}, nil
}

func (s *PaymentService) closeOrder(ctx context.Context, id pgtype.UUID, status, reason string) {
	if _, err := s.repo.MarkPaymentOrderClosed(context.WithoutCancel(ctx), db.MarkPaymentOrderClosedParams{ID: id, Status: status, Reason: reason}); err != nil {
		log.Printf("❌ payment: đóng đơn %s: %v", uuid.UUID(id.Bytes), err)
	}
}

// ===== Giao hàng =====

type fulfillInput struct {
	OrderID     pgtype.UUID
	ProviderRef string
	SubID       string     // Stripe subscription
	CustomerID  string     // Stripe customer
	PeriodEnd   *time.Time // Stripe: hết kỳ hiện tại của subscription
}

func optText(s string) pgtype.Text { return pgtype.Text{String: s, Valid: s != ""} }

// fulfill — đơn PENDING → PAID + giao hàng trong 1 transaction; đơn đã xử lý → bỏ qua (nil)
func (s *PaymentService) fulfill(ctx context.Context, in fulfillInput) error {
	tx, err := s.repo.BeginTx(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	qtx := s.repo.WithTx(tx)
	order, err := qtx.MarkPaymentOrderPaid(ctx, db.MarkPaymentOrderPaidParams{
		ID: in.OrderID, ProviderRef: optText(in.ProviderRef), ProviderSubscriptionID: optText(in.SubID), ProviderCustomerID: optText(in.CustomerID),
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil // đã giao (IPN + Return URL, webhook gửi lại...)
	}
	if err != nil {
		return err
	}
	item, ok := catalogItem(order.Item)
	if !ok {
		return fmt.Errorf("đơn %s có mặt hàng lạ %q", uuid.UUID(order.ID.Bytes), order.Item)
	}
	var notice NotificationInput
	var cancelStripeSub string // subscription Stripe không còn dùng (bị gói mới thay) — huỷ sau khi commit
	if item.Kind == "gems" {
		balance, err := addGemsTx(ctx, qtx, order.UserID, int32(item.Gems), "PURCHASE", itemTitle(item), order.ID)
		if err != nil {
			return err
		}
		notice = NotificationInput{Type: NotificationPayment, Icon: "💎", URL: "/wallet",
			Title: fmt.Sprintf("Đã nạp %d gems", item.Gems), Body: fmt.Sprintf("Số dư ví: %d gems.", balance)}
	} else {
		if cancelStripeSub, err = s.grantPaidPlan(ctx, qtx, order, item, in); err != nil {
			return err
		}
		notice = NotificationInput{Type: NotificationPayment, Icon: "⭐", URL: "/pricing",
			Title: "Đã kích hoạt LacLingo Pro", Body: "Cảm ơn bạn! " + itemTitle(item) + " đã được kích hoạt."}
	}
	if err := tx.Commit(ctx); err != nil {
		return err
	}
	if cancelStripeSub != "" && s.stripe != nil {
		if err := s.stripe.CancelSubscription(context.WithoutCancel(ctx), cancelStripeSub); err != nil {
			// Cần xử lý tay trên Stripe Dashboard — nếu không Stripe vẫn trừ tiền kỳ sau
			log.Printf("❌ payment: huỷ Stripe subscription %s (đã bị gói khác thay) thất bại: %v", cancelStripeSub, err)
		}
	}
	if s.notifier != nil {
		s.notifier.Notify(ctx, uuid.UUID(order.UserID.Bytes), notice)
	}
	return nil
}

// grantPaidPlan — gói Pro đã thanh toán: trọn đời; Stripe tự gia hạn (hết kỳ theo Stripe, không ngắn hơn phần trả
// trước còn lại); trả trước 1 kỳ (VNPay — cộng nối tiếp vào hạn còn lại nếu đang Pro).
// cancelStripeSub: subscription Stripe cần huỷ trên Stripe sau khi commit (gói tự gia hạn bị thay / mua trùng khi
// đã trọn đời) — không huỷ thì Stripe vẫn trừ tiền các kỳ sau.
func (s *PaymentService) grantPaidPlan(ctx context.Context, qtx *db.Queries, order db.PaymentOrder, item CatalogItem, in fulfillInput) (cancelStripeSub string, err error) {
	now := s.now()
	active, err := qtx.GetActiveSubscription(ctx, order.UserID)
	hasActive := err == nil
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return "", err
	}
	if hasActive && active.Plan == PlanLifetime && item.Plan != PlanLifetime {
		// Đã trọn đời (2 thanh toán song song) — giữ trọn đời; subscription Stripe vừa tạo thì huỷ để không trừ tiếp
		return in.SubID, nil
	}
	if hasActive && active.AutoRenew && active.ProviderSubscriptionID.Valid && active.ProviderSubscriptionID.String != in.SubID {
		cancelStripeSub = active.ProviderSubscriptionID.String
	}
	var expires pgtype.Timestamptz
	switch {
	case item.Plan == PlanLifetime:
	case order.AutoRenew:
		end := now.AddDate(0, 1, 0)
		if in.PeriodEnd != nil {
			end = *in.PeriodEnd
		}
		if hasActive && !active.AutoRenew && active.ExpiresAt.Valid && active.ExpiresAt.Time.After(end) {
			end = active.ExpiresAt.Time // còn phần trả trước dài hơn kỳ Stripe đầu tiên — không làm mất
		}
		expires = pgtype.Timestamptz{Time: end, Valid: true}
	default:
		base := now
		if hasActive && active.ExpiresAt.Valid && active.ExpiresAt.Time.After(now) {
			base = active.ExpiresAt.Time
		}
		if item.Plan == PlanYearly {
			expires = pgtype.Timestamptz{Time: base.AddDate(1, 0, 0), Valid: true}
		} else {
			expires = pgtype.Timestamptz{Time: base.AddDate(0, 1, 0), Valid: true}
		}
	}
	if err := qtx.CancelActiveSubscriptions(ctx, order.UserID); err != nil {
		return "", err
	}
	_, err = qtx.CreatePaidSubscription(ctx, db.CreatePaidSubscriptionParams{
		UserID: order.UserID, Plan: item.Plan, StartsAt: pgtype.Timestamptz{Time: now, Valid: true}, ExpiresAt: expires,
		PaymentProvider: order.Provider, OrderID: order.ID, AutoRenew: order.AutoRenew,
		ProviderSubscriptionID: optText(in.SubID), ProviderCustomerID: optText(in.CustomerID),
	})
	return cancelStripeSub, err
}

// addGemsTx — cộng/trừ gems + ghi sổ trong transaction đang mở; trả số dư mới
func addGemsTx(ctx context.Context, qtx *db.Queries, userID pgtype.UUID, delta int32, reason, note string, orderID pgtype.UUID) (int32, error) {
	if err := qtx.EnsureUserInventory(ctx, userID); err != nil {
		return 0, err
	}
	balance, err := qtx.AddGems(ctx, db.AddGemsParams{UserID: userID, Delta: delta})
	if errors.Is(err, pgx.ErrNoRows) {
		return 0, fmt.Errorf("không đủ gems: %w", ErrInvalidInput)
	}
	if err != nil {
		return 0, err
	}
	err = qtx.InsertGemTransaction(ctx, db.InsertGemTransactionParams{
		UserID: userID, Delta: delta, BalanceAfter: balance, Reason: reason, Note: note, OrderID: orderID,
	})
	return balance, err
}

// ===== VNPay =====

// VNPayIPNResponse — VNPay đọc RspCode: 00 đã nhận; 01 không có đơn; 02 đơn đã xử lý; 04 sai số tiền; 97 sai chữ ký
type VNPayIPNResponse struct {
	RspCode string `json:"RspCode"`
	Message string `json:"Message"`
}

// handleVNPay — dùng chung cho IPN và Return URL. Trả mã đơn (nếu đọc được) để Return URL chuyển về trang kết quả.
func (s *PaymentService) handleVNPay(ctx context.Context, params url.Values) (pgtype.UUID, VNPayIPNResponse) {
	if s.vnpay == nil || !s.vnpay.Verify(params) {
		return pgtype.UUID{}, VNPayIPNResponse{"97", "Invalid signature"}
	}
	r := ParseVNPayResult(params)
	id, ok := orderIDFromTxnRef(r.TxnRef)
	if !ok {
		return pgtype.UUID{}, VNPayIPNResponse{"01", "Order not found"}
	}
	order, err := s.repo.GetPaymentOrder(ctx, id)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		log.Printf("❌ payment: VNPay đọc đơn %s: %v", uuid.UUID(id.Bytes), err)
		return id, VNPayIPNResponse{"99", "Unknown error"} // lỗi tạm — VNPay sẽ gửi lại IPN
	}
	if err != nil || order.Provider != ProviderVNPay {
		return id, VNPayIPNResponse{"01", "Order not found"}
	}
	if order.Amount != r.AmountVND {
		return id, VNPayIPNResponse{"04", "Invalid amount"}
	}
	if order.Status != "PENDING" {
		return id, VNPayIPNResponse{"02", "Order already confirmed"}
	}
	if !r.Success {
		s.closeOrder(ctx, id, "FAILED", "VNPay mã "+r.ResponseCode)
		return id, VNPayIPNResponse{"00", "Confirm Success"}
	}
	if err := s.fulfill(ctx, fulfillInput{OrderID: id, ProviderRef: r.TransactionNo}); err != nil {
		log.Printf("❌ payment: VNPay giao hàng đơn %s: %v", uuid.UUID(id.Bytes), err)
		return id, VNPayIPNResponse{"99", "Unknown error"}
	}
	return id, VNPayIPNResponse{"00", "Confirm Success"}
}

// VNPayIPN — VNPay gọi server-to-server (nguồn tin chính khi chạy thật)
func (s *PaymentService) VNPayIPN(ctx context.Context, params url.Values) VNPayIPNResponse {
	_, res := s.handleVNPay(ctx, params)
	return res
}

// VNPayReturn — trình duyệt quay về sau khi thanh toán: xử lý như IPN (máy local không nhận được IPN) rồi trả URL
// trang kết quả
func (s *PaymentService) VNPayReturn(ctx context.Context, params url.Values) string {
	id, _ := s.handleVNPay(ctx, params)
	if !id.Valid {
		return s.webURL + "/billing/result?error=invalid"
	}
	return fmt.Sprintf("%s/billing/result?order=%s", s.webURL, uuid.UUID(id.Bytes))
}

// ===== Stripe =====

// StripeWebhook — xác thực chữ ký rồi xử lý: thanh toán xong (giao hàng), gia hạn kỳ mới, huỷ / kết thúc gói
func (s *PaymentService) StripeWebhook(ctx context.Context, body []byte, signature string) error {
	if s.stripe == nil {
		return ErrPaymentNotConfigured
	}
	if err := s.stripe.VerifyWebhook(body, signature); err != nil {
		return fmt.Errorf("%w: %v", ErrInvalidInput, err)
	}
	var ev StripeEvent
	if err := json.Unmarshal(body, &ev); err != nil {
		return fmt.Errorf("sự kiện Stripe không đọc được: %w", ErrInvalidInput)
	}
	switch ev.Type {
	case "checkout.session.completed", "checkout.session.async_payment_succeeded":
		var sess StripeCheckoutSession
		if err := json.Unmarshal(ev.Data.Object, &sess); err != nil {
			return err
		}
		return s.completeStripeSession(ctx, sess)
	case "checkout.session.expired", "checkout.session.async_payment_failed":
		var sess StripeCheckoutSession
		if err := json.Unmarshal(ev.Data.Object, &sess); err != nil {
			return err
		}
		if id, err := uuid.Parse(sess.ClientRefID); err == nil {
			s.closeOrder(ctx, toPgUUID(id), "CANCELLED", "Stripe: "+ev.Type)
		}
		return nil
	case "invoice.paid":
		var inv StripeInvoice
		if err := json.Unmarshal(ev.Data.Object, &inv); err != nil {
			return err
		}
		if subID := inv.SubscriptionID(); subID != "" {
			return s.syncStripeSubscription(ctx, subID)
		}
		return nil
	case "customer.subscription.updated", "customer.subscription.deleted":
		var sub StripeSubscription
		if err := json.Unmarshal(ev.Data.Object, &sub); err != nil {
			return err
		}
		return s.applyStripeSubscription(ctx, sub, ev.Type == "customer.subscription.deleted")
	}
	return nil // sự kiện không dùng
}

// completeStripeSession — Checkout đã trả tiền → giao hàng (subscription: lấy hạn kỳ hiện tại từ Stripe)
func (s *PaymentService) completeStripeSession(ctx context.Context, sess StripeCheckoutSession) error {
	id, err := uuid.Parse(sess.ClientRefID)
	if err != nil {
		return nil // không phải đơn của app
	}
	if sess.PaymentStatus != "paid" && sess.PaymentStatus != "no_payment_required" {
		return nil // thanh toán chậm (chuyển khoản...) — chờ async_payment_succeeded
	}
	// Đối chiếu với đơn: đúng cổng, đúng phiên đã tạo, đúng số tiền + loại tiền (phiên tạo ngoài app / giá khác không
	// được giao hàng của đơn khác)
	order, err := s.repo.GetPaymentOrder(ctx, toPgUUID(id))
	if errors.Is(err, pgx.ErrNoRows) {
		return nil
	}
	if err != nil {
		return err
	}
	if !order.UserID.Valid {
		// Tài khoản đã xoá mà phiên vẫn được trả (expire lỗi) — huỷ gói để Stripe không trừ tiền các kỳ sau;
		// khoản đã trả cần hoàn tay trên Stripe Dashboard
		log.Printf("❌ payment: phiên Stripe %s được thanh toán sau khi tài khoản của đơn %s đã xoá — cần hoàn tiền", sess.ID, id)
		if sess.Subscription != "" {
			if err := s.stripe.CancelSubscription(ctx, sess.Subscription); err != nil && !isStripeNotFound(err) {
				return err
			}
		}
		return nil
	}
	if order.Provider != ProviderStripe || (order.ProviderRef.Valid && order.ProviderRef.String != sess.ID) ||
		sess.AmountTotal != order.Amount || !strings.EqualFold(sess.Currency, order.Currency) {
		log.Printf("❌ payment: phiên Stripe %s không khớp đơn %s (cổng %s, %d %s ≠ %d %s) — bỏ qua",
			sess.ID, id, order.Provider, sess.AmountTotal, sess.Currency, order.Amount, order.Currency)
		return nil
	}
	in := fulfillInput{OrderID: toPgUUID(id), ProviderRef: sess.ID, SubID: sess.Subscription, CustomerID: sess.Customer}
	if sess.Subscription != "" {
		sub, err := s.stripe.GetSubscription(ctx, sess.Subscription)
		if err != nil {
			return err
		}
		end := sub.PeriodEnd()
		in.PeriodEnd = &end
	}
	return s.fulfill(ctx, in)
}

// syncStripeSubscription — đọc subscription từ Stripe rồi cập nhật gói (gia hạn kỳ mới)
func (s *PaymentService) syncStripeSubscription(ctx context.Context, subID string) error {
	sub, err := s.stripe.GetSubscription(ctx, subID)
	if err != nil {
		return err
	}
	return s.applyStripeSubscription(ctx, sub, false)
}

// applyStripeSubscription — trạng thái subscription Stripe → gói của học viên. Chưa có gói local (sự kiện tới trước
// checkout.session.completed) → bỏ qua, checkout xong sẽ tạo.
func (s *PaymentService) applyStripeSubscription(ctx context.Context, sub StripeSubscription, deleted bool) error {
	key := pgtype.Text{String: sub.ID, Valid: sub.ID != ""}
	if _, err := s.repo.GetSubscriptionByProviderSub(ctx, key); errors.Is(err, pgx.ErrNoRows) {
		return nil
	} else if err != nil {
		return err
	}
	switch {
	case deleted, sub.Status == "canceled", sub.Status == "unpaid", sub.Status == "incomplete_expired":
		return s.repo.EndSubscriptionByProviderSub(ctx, key)
	case sub.Status == "past_due":
		// Kỳ mới chưa trả được (Stripe đang thử trừ lại): giữ hạn của kỳ đã trả, chỉ cập nhật cờ tự gia hạn
		return s.repo.SetSubscriptionAutoRenew(ctx, db.SetSubscriptionAutoRenewParams{ProviderSubscriptionID: key, AutoRenew: !sub.CancelAtPeriodEnd})
	case sub.Status == "active", sub.Status == "trialing":
		return s.repo.UpdateSubscriptionPeriod(ctx, db.UpdateSubscriptionPeriodParams{
			ProviderSubscriptionID: key, ExpiresAt: pgtype.Timestamptz{Time: sub.PeriodEnd(), Valid: true}, AutoRenew: !sub.CancelAtPeriodEnd,
		})
	}
	return nil
}

// ===== Đơn của học viên =====

type PaymentOrderInfo struct {
	ID        uuid.UUID  `json:"id" swaggertype:"string" format:"uuid"`
	Item      string     `json:"item"`
	Provider  string     `json:"provider"`
	Amount    int64      `json:"amount"`
	Currency  string     `json:"currency"`
	Status    string     `json:"status" enums:"PENDING,PAID,FAILED,CANCELLED"`
	AutoRenew bool       `json:"auto_renew"`
	Reason    string     `json:"failure_reason,omitempty"`
	CreatedAt time.Time  `json:"created_at"`
	PaidAt    *time.Time `json:"paid_at,omitempty"`
}

func toOrderInfo(o db.PaymentOrder) PaymentOrderInfo {
	out := PaymentOrderInfo{
		ID: uuid.UUID(o.ID.Bytes), Item: o.Item, Provider: o.Provider, Amount: o.Amount, Currency: o.Currency,
		Status: o.Status, AutoRenew: o.AutoRenew, Reason: o.FailureReason, CreatedAt: o.CreatedAt.Time,
	}
	if o.PaidAt.Valid {
		t := o.PaidAt.Time
		out.PaidAt = &t
	}
	return out
}

// GetOrder — trạng thái 1 đơn (trang kết quả). sync + đơn Stripe còn PENDING → hỏi lại Stripe (máy local không nhận
// webhook), tối đa 1 lần / stripeSyncInterval mỗi đơn
func (s *PaymentService) GetOrder(ctx context.Context, userID, orderID uuid.UUID, sync bool) (PaymentOrderInfo, error) {
	order, err := s.repo.GetPaymentOrderForUser(ctx, db.GetPaymentOrderForUserParams{ID: toPgUUID(orderID), UserID: toPgUUID(userID)})
	if errors.Is(err, pgx.ErrNoRows) {
		return PaymentOrderInfo{}, ErrNotFound
	}
	if err != nil {
		return PaymentOrderInfo{}, err
	}
	if sync && order.Status == "PENDING" && order.Provider == ProviderStripe && s.stripe != nil && order.ProviderRef.Valid && s.allowSync(orderID) {
		sess, err := s.stripe.GetCheckoutSession(ctx, order.ProviderRef.String)
		switch {
		case err != nil:
			log.Printf("⚠️  payment: tra phiên Stripe đơn %s: %v", orderID, err)
		case sess.Status == "expired":
			s.closeOrder(ctx, order.ID, "CANCELLED", "Stripe: phiên thanh toán hết hạn")
		default:
			if err := s.completeStripeSession(ctx, sess); err != nil {
				log.Printf("❌ payment: Stripe giao hàng đơn %s: %v", orderID, err)
			}
		}
		if order, err = s.repo.GetPaymentOrder(ctx, order.ID); err != nil {
			return PaymentOrderInfo{}, err
		}
	}
	return toOrderInfo(order), nil
}

func (s *PaymentService) ListOrders(ctx context.Context, userID uuid.UUID) ([]PaymentOrderInfo, error) {
	rows, err := s.repo.ListPaymentOrdersForUser(ctx, db.ListPaymentOrdersForUserParams{UserID: toPgUUID(userID), Limit: 50})
	if err != nil {
		return nil, err
	}
	out := make([]PaymentOrderInfo, 0, len(rows))
	for _, r := range rows {
		out = append(out, toOrderInfo(r))
	}
	return out, nil
}

// PortalURL — trang Stripe quản lý gói tự gia hạn (đổi thẻ, xem hoá đơn, huỷ)
func (s *PaymentService) PortalURL(ctx context.Context, userID uuid.UUID) (string, error) {
	if s.stripe == nil {
		return "", ErrPaymentNotConfigured
	}
	active, err := s.repo.GetActiveSubscription(ctx, toPgUUID(userID))
	if errors.Is(err, pgx.ErrNoRows) || (err == nil && !active.ProviderCustomerID.Valid) {
		return "", fmt.Errorf("bạn chưa có gói thanh toán qua Stripe: %w", ErrInvalidInput)
	}
	if err != nil {
		return "", err
	}
	return s.stripe.CreatePortalSession(ctx, active.ProviderCustomerID.String, s.webURL+"/wallet")
}

// PrepareAccountDeletion — dọn thanh toán trước khi xoá tài khoản (không còn ai để giao hàng / trừ tiền):
//   - huỷ ngay mọi gói Stripe / Google Play còn tự gia hạn (kể cả past_due) — lỗi thì báo lại, KHÔNG xoá tài khoản.
//     Gói App Store thì server không huỷ được (Apple không có API) — app nhắc học viên tự huỷ trong cài đặt App Store;
//   - expire phiên Stripe Checkout đang mở + đóng đơn PENDING (best-effort; webhook vẫn chặn đơn mồ côi).
func (s *PaymentService) PrepareAccountDeletion(ctx context.Context, userID uuid.UUID) error {
	subs, err := s.repo.ListAutoRenewSubscriptions(ctx, toPgUUID(userID))
	if err != nil {
		return err
	}
	for _, sub := range subs {
		switch sub.PaymentProvider {
		case ProviderStripe:
			if s.stripe == nil {
				return fmt.Errorf("chưa huỷ được gói tự gia hạn qua Stripe: %w", ErrPaymentNotConfigured)
			}
			if err := s.stripe.CancelSubscription(ctx, sub.ID); err != nil && !isStripeNotFound(err) {
				return err
			}
		case providerGooglePlay:
			if s.google == nil {
				return fmt.Errorf("chưa huỷ được gói tự gia hạn qua Google Play: %w", ErrIAPNotConfigured)
			}
			item, _ := catalogItem(sub.Plan)
			if err := s.google.CancelSubscription(ctx, item.StoreProductID, sub.ID); err != nil && !errors.Is(err, errGooglePlayNotFound) {
				return err
			}
		}
	}
	sessions, err := s.repo.ListPendingStripeSessions(ctx, toPgUUID(userID))
	if err != nil {
		return err
	}
	for _, id := range sessions {
		if s.stripe == nil {
			break
		}
		if err := s.stripe.ExpireCheckoutSession(ctx, id); err != nil {
			log.Printf("⚠️  payment: expire phiên Stripe %s khi xoá tài khoản: %v", id, err)
		}
	}
	return s.repo.CancelPendingPaymentOrders(ctx, db.CancelPendingPaymentOrdersParams{UserID: toPgUUID(userID), Reason: "tài khoản đã xoá"})
}

// isStripeNotFound — Stripe không còn đối tượng đó (đã huỷ/xoá) → coi như xong
func isStripeNotFound(err error) bool {
	var se *stripeError
	return errors.As(err, &se) && se.Status == http.StatusNotFound
}

// ===== Ví gems =====

type GemTransactionInfo struct {
	Delta        int32     `json:"delta"`
	BalanceAfter int32     `json:"balance_after"`
	Reason       string    `json:"reason" enums:"PURCHASE,MISSION_REWARD,BUY_STREAK_FREEZE,ADMIN"`
	Note         string    `json:"note"`
	CreatedAt    time.Time `json:"created_at"`
}

type WalletResponse struct {
	Gems                int32                `json:"gems"`
	StreakFreezes       int32                `json:"streak_freezes"`
	StreakFreezeGemCost int                  `json:"streak_freeze_gem_cost"`
	MaxStreakFreezes    int                  `json:"max_streak_freezes"`
	Transactions        []GemTransactionInfo `json:"transactions"`
	Claimed             int32                `json:"claimed,omitempty"` // gems vừa nhận (nhận quà)
}

func (s *PaymentService) Wallet(ctx context.Context, userID uuid.UUID) (WalletResponse, error) {
	if err := s.repo.EnsureUserInventory(ctx, toPgUUID(userID)); err != nil {
		return WalletResponse{}, err
	}
	inv, err := s.repo.GetUserInventory(ctx, toPgUUID(userID))
	if err != nil {
		return WalletResponse{}, err
	}
	rows, err := s.repo.ListGemTransactions(ctx, db.ListGemTransactionsParams{UserID: toPgUUID(userID), Limit: 50})
	if err != nil {
		return WalletResponse{}, err
	}
	out := WalletResponse{
		Gems: inv.Gems, StreakFreezes: inv.StreakFreezes, StreakFreezeGemCost: StreakFreezeGemCost, MaxStreakFreezes: MaxStreakFreezes,
		Transactions: make([]GemTransactionInfo, 0, len(rows)),
	}
	for _, r := range rows {
		out.Transactions = append(out.Transactions, GemTransactionInfo{Delta: r.Delta, BalanceAfter: r.BalanceAfter, Reason: r.Reason, Note: r.Note, CreatedAt: r.CreatedAt.Time})
	}
	return out, nil
}

// BuyStreakFreeze — đổi gems lấy 1 Streak Freeze (mọi gói; giữ tối đa MaxStreakFreezes)
func (s *PaymentService) BuyStreakFreeze(ctx context.Context, userID uuid.UUID) (WalletResponse, error) {
	tx, err := s.repo.BeginTx(ctx)
	if err != nil {
		return WalletResponse{}, err
	}
	defer tx.Rollback(ctx)
	qtx := s.repo.WithTx(tx)
	uid := toPgUUID(userID)
	if err := qtx.EnsureUserInventory(ctx, uid); err != nil {
		return WalletResponse{}, err
	}
	inv, err := qtx.LockUserInventory(ctx, uid) // 2 lần bấm cùng lúc không vượt giới hạn / không trừ âm
	if err != nil {
		return WalletResponse{}, err
	}
	if inv.StreakFreezes >= MaxStreakFreezes {
		return WalletResponse{}, fmt.Errorf("bạn đang giữ tối đa %d Streak Freeze: %w", MaxStreakFreezes, ErrInvalidInput)
	}
	if inv.Gems < StreakFreezeGemCost {
		return WalletResponse{}, fmt.Errorf("cần %d gems để mua 1 Streak Freeze (bạn có %d): %w", StreakFreezeGemCost, inv.Gems, ErrInvalidInput)
	}
	if _, err := addGemsTx(ctx, qtx, uid, -StreakFreezeGemCost, "BUY_STREAK_FREEZE", "Mua 1 Streak Freeze", pgtype.UUID{}); err != nil {
		return WalletResponse{}, err
	}
	if _, err := qtx.AddStreakFreezes(ctx, db.AddStreakFreezesParams{UserID: uid, N: 1, MaxHold: MaxStreakFreezes}); err != nil {
		return WalletResponse{}, err
	}
	if err := tx.Commit(ctx); err != nil {
		return WalletResponse{}, err
	}
	return s.Wallet(ctx, userID)
}

func (s *PaymentService) allowSync(orderID uuid.UUID) bool {
	s.syncMu.Lock()
	defer s.syncMu.Unlock()
	now := s.now()
	if last, ok := s.lastSync[orderID]; ok && now.Sub(last) < stripeSyncInterval {
		return false
	}
	if len(s.lastSync) > 10_000 {
		clear(s.lastSync)
	}
	s.lastSync[orderID] = now
	return true
}
