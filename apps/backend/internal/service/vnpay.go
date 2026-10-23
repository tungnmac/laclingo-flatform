package service

import (
	"crypto/hmac"
	"crypto/sha512"
	"encoding/hex"
	"net/url"
	"sort"
	"strconv"
	"strings"
	"time"
)

// VNPay (cổng thanh toán nội địa, VND) — phiên bản 2.1.0. Luồng: tạo URL thanh toán đã ký → người dùng trả tiền
// trên trang VNPay → VNPay gọi IPN (server-to-server, nguồn tin chính) và chuyển trình duyệt về Return URL.
// Chữ ký: HMAC-SHA512(hash secret, chuỗi query các tham số vnp_* đã sắp xếp theo tên, giá trị URL-encode).

const DefaultVNPayPayURL = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"

type VNPayClient struct {
	TmnCode    string
	HashSecret string
	PayURL     string
	now        func() time.Time
}

func NewVNPayClient(tmnCode, hashSecret, payURL string) *VNPayClient {
	if payURL == "" {
		payURL = DefaultVNPayPayURL
	}
	return &VNPayClient{TmnCode: tmnCode, HashSecret: hashSecret, PayURL: payURL, now: time.Now}
}

var vnpayLocation = func() *time.Location {
	loc, err := time.LoadLocation("Asia/Ho_Chi_Minh")
	if err != nil {
		return time.FixedZone("ICT", 7*3600)
	}
	return loc
}()

// vnpaySignData — chuỗi được ký: tham số sắp xếp theo tên, key=value (value URL-encode như query string)
func vnpaySignData(params url.Values) string {
	keys := make([]string, 0, len(params))
	for k := range params {
		if k == "vnp_SecureHash" || k == "vnp_SecureHashType" || params.Get(k) == "" {
			continue
		}
		keys = append(keys, k)
	}
	sort.Strings(keys)
	parts := make([]string, 0, len(keys))
	for _, k := range keys {
		parts = append(parts, url.QueryEscape(k)+"="+url.QueryEscape(params.Get(k)))
	}
	return strings.Join(parts, "&")
}

func (c *VNPayClient) sign(data string) string {
	mac := hmac.New(sha512.New, []byte(c.HashSecret))
	mac.Write([]byte(data))
	return hex.EncodeToString(mac.Sum(nil))
}

// PaymentURL — URL chuyển người dùng sang trang thanh toán VNPay. txnRef: mã đơn (duy nhất); amountVND: số đồng.
func (c *VNPayClient) PaymentURL(txnRef string, amountVND int64, orderInfo, returnURL, clientIP string) string {
	now := c.now().In(vnpayLocation)
	p := url.Values{}
	p.Set("vnp_Version", "2.1.0")
	p.Set("vnp_Command", "pay")
	p.Set("vnp_TmnCode", c.TmnCode)
	p.Set("vnp_Amount", strconv.FormatInt(amountVND*100, 10)) // VNPay nhận số tiền × 100
	p.Set("vnp_CurrCode", "VND")
	p.Set("vnp_TxnRef", txnRef)
	p.Set("vnp_OrderInfo", orderInfo)
	p.Set("vnp_OrderType", "other")
	p.Set("vnp_Locale", "vn")
	p.Set("vnp_ReturnUrl", returnURL)
	p.Set("vnp_IpAddr", clientIP)
	p.Set("vnp_CreateDate", now.Format("20060102150405"))
	p.Set("vnp_ExpireDate", now.Add(15*time.Minute).Format("20060102150405"))
	data := vnpaySignData(p)
	return c.PayURL + "?" + data + "&vnp_SecureHash=" + c.sign(data)
}

// Verify — tham số VNPay gửi về (Return URL / IPN) có đúng chữ ký không
func (c *VNPayClient) Verify(params url.Values) bool {
	got := strings.ToLower(params.Get("vnp_SecureHash"))
	if got == "" {
		return false
	}
	want := c.sign(vnpaySignData(params))
	return hmac.Equal([]byte(got), []byte(want))
}

// VNPayResult — kết quả giao dịch đọc từ tham số VNPay (đã kiểm tra chữ ký)
type VNPayResult struct {
	TxnRef        string
	AmountVND     int64
	TransactionNo string
	Success       bool   // vnp_ResponseCode = 00 và vnp_TransactionStatus = 00
	ResponseCode  string // mã lỗi VNPay khi thất bại (vd 24 = khách huỷ)
}

func ParseVNPayResult(params url.Values) VNPayResult {
	amount, _ := strconv.ParseInt(params.Get("vnp_Amount"), 10, 64)
	return VNPayResult{
		TxnRef:        params.Get("vnp_TxnRef"),
		AmountVND:     amount / 100,
		TransactionNo: params.Get("vnp_TransactionNo"),
		Success:       params.Get("vnp_ResponseCode") == "00" && params.Get("vnp_TransactionStatus") == "00",
		ResponseCode:  params.Get("vnp_ResponseCode"),
	}
}
