package auth

import (
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

func TestTokenRoundTrip(t *testing.T) {
	m := NewTokenManager("secret", time.Hour)
	id := uuid.New()

	token, exp, err := m.Issue(id)
	if err != nil {
		t.Fatalf("Issue: %v", err)
	}
	if time.Until(exp) <= 0 {
		t.Fatalf("expiresAt phải ở tương lai, got %v", exp)
	}

	got, err := m.Parse(token)
	if err != nil {
		t.Fatalf("Parse: %v", err)
	}
	if got != id {
		t.Fatalf("user id = %v, want %v", got, id)
	}
}

func TestParseRejects(t *testing.T) {
	m := NewTokenManager("secret", time.Hour)
	id := uuid.New()
	valid, _, _ := m.Issue(id)

	expired := NewTokenManager("secret", time.Hour)
	expired.now = func() time.Time { return time.Now().Add(-2 * time.Hour) }
	expiredToken, _, _ := expired.Issue(id)

	otherSecret, _, _ := NewTokenManager("other", time.Hour).Issue(id)

	noneAlg, _ := jwt.NewWithClaims(jwt.SigningMethodNone, jwt.RegisteredClaims{
		Subject: id.String(), Issuer: issuer, ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour)),
	}).SignedString(jwt.UnsafeAllowNoneSignatureType)

	tests := map[string]string{
		"rỗng":       "",
		"rác":        "not-a-token",
		"hết hạn":    expiredToken,
		"sai secret": otherSecret,
		"alg none":   noneAlg,
		"bị sửa đổi": valid[:len(valid)-2] + "xx",
	}
	for name, token := range tests {
		t.Run(name, func(t *testing.T) {
			if _, err := m.Parse(token); err != ErrInvalidToken {
				t.Fatalf("err = %v, want ErrInvalidToken", err)
			}
		})
	}
}
