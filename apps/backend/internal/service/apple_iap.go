package service

import (
	"crypto/ecdsa"
	"crypto/sha256"
	"crypto/x509"
	"encoding/asn1"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"math/big"
	"strings"
	"time"
)

// Xác thực dữ liệu StoreKit 2 / App Store Server Notifications V2 ngay trên server: mỗi giao dịch là 1 JWS (ES256)
// có chuỗi chứng chỉ x5c [leaf, intermediate, root] — kiểm chuỗi tới Apple Root CA G3 rồi kiểm chữ ký bằng khoá
// của leaf. Không cần gọi API Apple hay khoá .p8.

// appleRootCAG3 — https://www.apple.com/certificateauthority/AppleRootCA-G3.cer (SHA-256
// 63:34:3A:BF:B8:9A:6A:03:EB:B5:7E:9B:3F:5F:A7:BE:7C:4F:5C:75:6F:30:17:B3:A8:C4:88:C3:65:3E:91:79), hết hạn 2039
const appleRootCAG3 = `-----BEGIN CERTIFICATE-----
MIICQzCCAcmgAwIBAgIILcX8iNLFS5UwCgYIKoZIzj0EAwMwZzEbMBkGA1UEAwwS
QXBwbGUgUm9vdCBDQSAtIEczMSYwJAYDVQQLDB1BcHBsZSBDZXJ0aWZpY2F0aW9u
IEF1dGhvcml0eTETMBEGA1UECgwKQXBwbGUgSW5jLjELMAkGA1UEBhMCVVMwHhcN
MTQwNDMwMTgxOTA2WhcNMzkwNDMwMTgxOTA2WjBnMRswGQYDVQQDDBJBcHBsZSBS
b290IENBIC0gRzMxJjAkBgNVBAsMHUFwcGxlIENlcnRpZmljYXRpb24gQXV0aG9y
aXR5MRMwEQYDVQQKDApBcHBsZSBJbmMuMQswCQYDVQQGEwJVUzB2MBAGByqGSM49
AgEGBSuBBAAiA2IABJjpLz1AcqTtkyJygRMc3RCV8cWjTnHcFBbZDuWmBSp3ZHtf
TjjTuxxEtX/1H7YyYl3J6YRbTzBPEVoA/VhYDKX1DyxNB0cTddqXl5dvMVztK517
IDvYuVTZXpmkOlEKMaNCMEAwHQYDVR0OBBYEFLuw3qFYM4iapIqZ3r6966/ayySr
MA8GA1UdEwEB/wQFMAMBAf8wDgYDVR0PAQH/BAQDAgEGMAoGCCqGSM49BAMDA2gA
MGUCMQCD6cHEFl4aXTQY2e3v9GwOAEZLuN+yRhHFD/3meoyhpmvOwgPUnPWTxnS4
at+qIxUCMG1mihDK1A3UT82NQz60imOlM27jbdoXt2QfyFMm+YhidDkLF1vLUagM
6BgD56KyKA==
-----END CERTIFICATE-----
`

var (
	// OID Apple đánh dấu chứng chỉ ký dữ liệu App Store (leaf) và chứng chỉ trung gian WWDR
	oidAppleReceiptSigning = asn1.ObjectIdentifier{1, 2, 840, 113635, 100, 6, 11, 1}
	oidAppleWWDR           = asn1.ObjectIdentifier{1, 2, 840, 113635, 100, 6, 2, 1}

	errAppleJWS = errors.New("chữ ký giao dịch Apple không hợp lệ")
)

// AppleVerifier kiểm JWS của Apple; bundleID = Bundle ID của app (vd vn.laclingo.app)
type AppleVerifier struct {
	roots    *x509.CertPool
	bundleID string
	now      func() time.Time
}

func NewAppleVerifier(bundleID string) *AppleVerifier {
	roots := x509.NewCertPool()
	roots.AppendCertsFromPEM([]byte(appleRootCAG3))
	return &AppleVerifier{roots: roots, bundleID: bundleID, now: time.Now}
}

// AppleTransaction — các trường cần của JWSTransactionDecodedPayload
type AppleTransaction struct {
	TransactionID         string `json:"transactionId"`
	OriginalTransactionID string `json:"originalTransactionId"`
	BundleID              string `json:"bundleId"`
	ProductID             string `json:"productId"`
	Type                  string `json:"type"`         // Auto-Renewable Subscription | Non-Consumable | Consumable
	PurchaseDate          int64  `json:"purchaseDate"` // ms
	ExpiresDate           int64  `json:"expiresDate"`  // ms, chỉ có ở subscription
	RevocationDate        int64  `json:"revocationDate"`
	AppAccountToken       string `json:"appAccountToken"`
	Environment           string `json:"environment"` // Sandbox | Production
}

// AppleRenewalInfo — các trường cần của JWSRenewalInfoDecodedPayload
type AppleRenewalInfo struct {
	OriginalTransactionID string `json:"originalTransactionId"`
	AutoRenewStatus       int    `json:"autoRenewStatus"` // 1 = còn tự gia hạn
	// Ân hạn khi chưa trừ được tiền kỳ mới (ms) — chỉ có khi app bật Billing Grace Period trên App Store Connect
	GracePeriodExpiresDate int64 `json:"gracePeriodExpiresDate"`
}

// AppleNotification — ResponseBodyV2DecodedPayload (App Store Server Notifications V2)
type AppleNotification struct {
	NotificationType string `json:"notificationType"`
	Subtype          string `json:"subtype"`
	NotificationUUID string `json:"notificationUUID"`
	Data             struct {
		BundleID              string `json:"bundleId"`
		Environment           string `json:"environment"`
		SignedTransactionInfo string `json:"signedTransactionInfo"`
		SignedRenewalInfo     string `json:"signedRenewalInfo"`
	} `json:"data"`
}

func msTime(ms int64) time.Time { return time.UnixMilli(ms) }

// verify kiểm chuỗi chứng chỉ + chữ ký của 1 JWS Apple rồi giải payload vào out
func (v *AppleVerifier) verify(jws string, out any) error {
	parts := strings.Split(jws, ".")
	if len(parts) != 3 {
		return errAppleJWS
	}
	rawHeader, err := base64.RawURLEncoding.DecodeString(parts[0])
	if err != nil {
		return errAppleJWS
	}
	var header struct {
		Alg string   `json:"alg"`
		X5C []string `json:"x5c"`
	}
	if json.Unmarshal(rawHeader, &header) != nil || header.Alg != "ES256" || len(header.X5C) < 2 {
		return errAppleJWS
	}
	certs := make([]*x509.Certificate, len(header.X5C))
	for i, c := range header.X5C {
		der, err := base64.StdEncoding.DecodeString(c)
		if err != nil {
			return errAppleJWS
		}
		if certs[i], err = x509.ParseCertificate(der); err != nil {
			return errAppleJWS
		}
	}
	leaf, intermediates := certs[0], x509.NewCertPool()
	for _, c := range certs[1:] {
		intermediates.AddCert(c)
	}
	if !hasExtension(leaf, oidAppleReceiptSigning) || !hasExtension(certs[1], oidAppleWWDR) {
		return errAppleJWS
	}
	if _, err := leaf.Verify(x509.VerifyOptions{
		Roots: v.roots, Intermediates: intermediates, CurrentTime: v.now(), KeyUsages: []x509.ExtKeyUsage{x509.ExtKeyUsageAny},
	}); err != nil {
		return fmt.Errorf("%w: %v", errAppleJWS, err)
	}
	pub, ok := leaf.PublicKey.(*ecdsa.PublicKey)
	if !ok {
		return errAppleJWS
	}
	sig, err := base64.RawURLEncoding.DecodeString(parts[2])
	if err != nil || len(sig) != 64 {
		return errAppleJWS
	}
	digest := sha256.Sum256([]byte(parts[0] + "." + parts[1]))
	if !ecdsa.Verify(pub, digest[:], new(big.Int).SetBytes(sig[:32]), new(big.Int).SetBytes(sig[32:])) {
		return errAppleJWS
	}
	payload, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return errAppleJWS
	}
	return json.Unmarshal(payload, out)
}

func hasExtension(c *x509.Certificate, oid asn1.ObjectIdentifier) bool {
	for _, e := range c.Extensions {
		if e.Id.Equal(oid) {
			return true
		}
	}
	return false
}

// Transaction kiểm 1 giao dịch StoreKit 2 (jwsRepresentation) của đúng app này
func (v *AppleVerifier) Transaction(jws string) (AppleTransaction, error) {
	var t AppleTransaction
	if err := v.verify(jws, &t); err != nil {
		return t, err
	}
	if t.BundleID != v.bundleID || t.TransactionID == "" || t.OriginalTransactionID == "" {
		return t, fmt.Errorf("giao dịch không thuộc app này: %w", errAppleJWS)
	}
	return t, nil
}

// Notification kiểm thông báo từ App Store (signedPayload) + giao dịch / thông tin gia hạn đi kèm
func (v *AppleVerifier) Notification(signedPayload string) (AppleNotification, *AppleTransaction, *AppleRenewalInfo, error) {
	var n AppleNotification
	if err := v.verify(signedPayload, &n); err != nil {
		return n, nil, nil, err
	}
	if n.NotificationType == "TEST" {
		return n, nil, nil, nil
	}
	if n.Data.BundleID != v.bundleID {
		return n, nil, nil, fmt.Errorf("thông báo không thuộc app này: %w", errAppleJWS)
	}
	var tx *AppleTransaction
	if n.Data.SignedTransactionInfo != "" {
		t, err := v.Transaction(n.Data.SignedTransactionInfo)
		if err != nil {
			return n, nil, nil, err
		}
		tx = &t
	}
	var renewal *AppleRenewalInfo
	if n.Data.SignedRenewalInfo != "" {
		var r AppleRenewalInfo
		if err := v.verify(n.Data.SignedRenewalInfo, &r); err != nil {
			return n, nil, nil, err
		}
		renewal = &r
	}
	return n, tx, renewal, nil
}
