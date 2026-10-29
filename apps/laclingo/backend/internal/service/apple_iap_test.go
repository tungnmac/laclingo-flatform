package service

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/sha256"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/base64"
	"encoding/json"
	"errors"
	"math/big"
	"strings"
	"testing"
	"time"
)

// appleTestChain — CA giả lập chuỗi Apple (root → WWDR → leaf có đúng OID) để ký JWS trong test
type appleTestChain struct {
	root, inter, leaf *x509.Certificate
	leafKey           *ecdsa.PrivateKey
}

func newAppleTestChain(t *testing.T, leafOID bool) appleTestChain {
	t.Helper()
	mk := func(serial int64, cn string, pub, signerKey any, parent *x509.Certificate, isCA bool, ext []pkix.Extension) *x509.Certificate {
		tpl := &x509.Certificate{
			SerialNumber: big.NewInt(serial), Subject: pkix.Name{CommonName: cn},
			NotBefore: time.Now().Add(-time.Hour), NotAfter: time.Now().Add(24 * time.Hour),
			IsCA: isCA, BasicConstraintsValid: true, ExtraExtensions: ext,
			KeyUsage: x509.KeyUsageDigitalSignature | x509.KeyUsageCertSign,
		}
		if parent == nil {
			parent = tpl
		}
		der, err := x509.CreateCertificate(rand.Reader, tpl, parent, pub, signerKey)
		if err != nil {
			t.Fatal(err)
		}
		c, _ := x509.ParseCertificate(der)
		return c
	}
	rootKey, _ := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	interKey, _ := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	leafKey, _ := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	root := mk(1, "Test Root", &rootKey.PublicKey, rootKey, nil, true, nil)
	inter := mk(2, "Test WWDR", &interKey.PublicKey, rootKey, root, true, []pkix.Extension{{Id: oidAppleWWDR, Value: []byte{5, 0}}})
	var leafExt []pkix.Extension
	if leafOID {
		leafExt = []pkix.Extension{{Id: oidAppleReceiptSigning, Value: []byte{5, 0}}}
	}
	leaf := mk(3, "Test Leaf", &leafKey.PublicKey, interKey, inter, false, leafExt)
	return appleTestChain{root: root, inter: inter, leaf: leaf, leafKey: leafKey}
}

func (c appleTestChain) sign(t *testing.T, payload any) string {
	t.Helper()
	x5c := []string{}
	for _, cert := range []*x509.Certificate{c.leaf, c.inter, c.root} {
		x5c = append(x5c, base64.StdEncoding.EncodeToString(cert.Raw))
	}
	h, _ := json.Marshal(map[string]any{"alg": "ES256", "x5c": x5c})
	p, _ := json.Marshal(payload)
	input := base64.RawURLEncoding.EncodeToString(h) + "." + base64.RawURLEncoding.EncodeToString(p)
	digest := sha256.Sum256([]byte(input))
	r, s, err := ecdsa.Sign(rand.Reader, c.leafKey, digest[:])
	if err != nil {
		t.Fatal(err)
	}
	sig := make([]byte, 64)
	r.FillBytes(sig[:32])
	s.FillBytes(sig[32:])
	return input + "." + base64.RawURLEncoding.EncodeToString(sig)
}

func (c appleTestChain) verifier() *AppleVerifier {
	v := NewAppleVerifier("vn.laclingo.app")
	v.roots = x509.NewCertPool()
	v.roots.AddCert(c.root)
	return v
}

func TestAppleRootCAParses(t *testing.T) {
	roots := x509.NewCertPool()
	if !roots.AppendCertsFromPEM([]byte(appleRootCAG3)) {
		t.Fatal("không đọc được Apple Root CA G3")
	}
}

func TestAppleVerifyTransaction(t *testing.T) {
	chain := newAppleTestChain(t, true)
	v := chain.verifier()
	tx := AppleTransaction{
		TransactionID: "2000001", OriginalTransactionID: "2000000", BundleID: "vn.laclingo.app",
		ProductID: "laclingo.pro.monthly", Type: "Auto-Renewable Subscription", ExpiresDate: time.Now().Add(720 * time.Hour).UnixMilli(),
		AppAccountToken: "6f1c7c1e-0000-4000-8000-000000000001", Environment: "Sandbox",
	}
	got, err := v.Transaction(chain.sign(t, tx))
	if err != nil || got.ProductID != tx.ProductID || got.AppAccountToken != tx.AppAccountToken {
		t.Fatalf("JWS hợp lệ phải qua: %+v, %v", got, err)
	}

	// Sửa payload sau khi ký → sai chữ ký
	jws := chain.sign(t, tx)
	parts := strings.Split(jws, ".")
	forged := tx
	forged.ProductID = "laclingo.pro.lifetime"
	fp, _ := json.Marshal(forged)
	if _, err := v.Transaction(parts[0] + "." + base64.RawURLEncoding.EncodeToString(fp) + "." + parts[2]); !errors.Is(err, errAppleJWS) {
		t.Errorf("payload bị sửa phải bị từ chối: %v", err)
	}

	// App khác
	other := tx
	other.BundleID = "com.other.app"
	if _, err := v.Transaction(chain.sign(t, other)); !errors.Is(err, errAppleJWS) {
		t.Errorf("bundle khác phải bị từ chối: %v", err)
	}

	// Chuỗi không về root tin cậy (root thật của Apple)
	if _, err := NewAppleVerifier("vn.laclingo.app").Transaction(chain.sign(t, tx)); !errors.Is(err, errAppleJWS) {
		t.Errorf("chuỗi tự ký phải bị từ chối với root Apple thật: %v", err)
	}

	// Leaf thiếu OID của Apple
	noOID := newAppleTestChain(t, false)
	if _, err := noOID.verifier().Transaction(noOID.sign(t, tx)); !errors.Is(err, errAppleJWS) {
		t.Errorf("leaf thiếu OID phải bị từ chối: %v", err)
	}

	if _, err := v.Transaction("abc.def"); !errors.Is(err, errAppleJWS) {
		t.Errorf("JWS hỏng phải bị từ chối: %v", err)
	}
}

func TestAppleVerifyNotification(t *testing.T) {
	chain := newAppleTestChain(t, true)
	v := chain.verifier()
	tx := chain.sign(t, AppleTransaction{TransactionID: "2000002", OriginalTransactionID: "2000000", BundleID: "vn.laclingo.app", ProductID: "laclingo.pro.monthly"})
	renewal := chain.sign(t, AppleRenewalInfo{OriginalTransactionID: "2000000", AutoRenewStatus: 0})
	payload := map[string]any{
		"notificationType": "DID_CHANGE_RENEWAL_STATUS", "subtype": "AUTO_RENEW_DISABLED",
		"data": map[string]any{"bundleId": "vn.laclingo.app", "environment": "Sandbox", "signedTransactionInfo": tx, "signedRenewalInfo": renewal},
	}
	n, gotTx, gotRenewal, err := v.Notification(chain.sign(t, payload))
	if err != nil || n.NotificationType != "DID_CHANGE_RENEWAL_STATUS" || gotTx == nil || gotTx.TransactionID != "2000002" || gotRenewal == nil || gotRenewal.AutoRenewStatus != 0 {
		t.Fatalf("thông báo hợp lệ phải qua: %+v %+v %+v %v", n, gotTx, gotRenewal, err)
	}
	payload["data"].(map[string]any)["bundleId"] = "com.other.app"
	if _, _, _, err := v.Notification(chain.sign(t, payload)); !errors.Is(err, errAppleJWS) {
		t.Errorf("thông báo của app khác phải bị từ chối: %v", err)
	}
}
