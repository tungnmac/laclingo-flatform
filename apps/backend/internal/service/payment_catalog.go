package service

import "fmt"

// Danh mục hàng bán — giá đặt ở backend (client chỉ gửi mã hàng, không gửi số tiền).
// VNPay thu VND, Stripe thu USD. Đổi giá: sửa bảng dưới (đơn cũ giữ số tiền đã lưu lúc tạo).

const (
	ItemMonthly  = PlanMonthly
	ItemYearly   = PlanYearly
	ItemLifetime = PlanLifetime
	ItemGems100  = "GEMS_100"
	ItemGems550  = "GEMS_550"
	ItemGems1200 = "GEMS_1200"

	ProviderVNPay  = "VNPAY"
	ProviderStripe = "STRIPE"

	// Ví gems: giá 1 Streak Freeze và số Streak Freeze giữ tối đa
	StreakFreezeGemCost = 100
	MaxStreakFreezes    = 5
)

// CatalogItem — 1 món bán được
type CatalogItem struct {
	ID       string `json:"id" example:"MONTHLY"`
	Kind     string `json:"kind" enums:"plan,gems"`
	Plan     string `json:"plan,omitempty" enums:"MONTHLY,YEARLY,LIFETIME"`
	Gems     int    `json:"gems,omitempty"`
	PriceVND int64  `json:"price_vnd"`       // đồng
	PriceUSD int64  `json:"price_usd_cents"` // cent
	// Gói tháng/năm mua qua Stripe tự gia hạn mỗi kỳ; qua VNPay là trả trước 1 kỳ
	Recurring bool `json:"recurring"`
}

var paymentCatalog = []CatalogItem{
	{ID: ItemMonthly, Kind: "plan", Plan: PlanMonthly, PriceVND: 79_000, PriceUSD: 499, Recurring: true},
	{ID: ItemYearly, Kind: "plan", Plan: PlanYearly, PriceVND: 599_000, PriceUSD: 3_999, Recurring: true},
	{ID: ItemLifetime, Kind: "plan", Plan: PlanLifetime, PriceVND: 1_490_000, PriceUSD: 9_999},
	{ID: ItemGems100, Kind: "gems", Gems: 100, PriceVND: 25_000, PriceUSD: 99},
	{ID: ItemGems550, Kind: "gems", Gems: 550, PriceVND: 99_000, PriceUSD: 399},
	{ID: ItemGems1200, Kind: "gems", Gems: 1_200, PriceVND: 199_000, PriceUSD: 799},
}

func catalogItem(id string) (CatalogItem, bool) {
	for _, it := range paymentCatalog {
		if it.ID == id {
			return it, true
		}
	}
	return CatalogItem{}, false
}

// itemTitle — tên hàng hiển thị ở trang thanh toán của cổng
func itemTitle(it CatalogItem) string {
	switch it.ID {
	case ItemMonthly:
		return "LacLingo Pro - 1 tháng"
	case ItemYearly:
		return "LacLingo Pro - 1 năm"
	case ItemLifetime:
		return "LacLingo Pro - trọn đời"
	}
	return fmt.Sprintf("LacLingo %d gems", it.Gems)
}
