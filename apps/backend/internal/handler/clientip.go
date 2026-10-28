package handler

import (
	"fmt"
	"net/netip"
	"strings"

	"github.com/gofiber/fiber/v2"
)

// trustedProxies — IP / dải IP reverse proxy (TRUSTED_PROXIES). Không dùng ProxyHeader của Fiber: nó lấy nguyên
// X-Forwarded-For (giá trị bên trái do client tự đặt) → giả IP để vượt giới hạn đăng nhập.
var trustedProxies []netip.Prefix

// SetTrustedProxies đọc danh sách IP / CIDR proxy tin cậy (gọi 1 lần lúc khởi động)
func SetTrustedProxies(list []string) error {
	trustedProxies = nil
	for _, s := range list {
		if !strings.Contains(s, "/") {
			addr, err := netip.ParseAddr(s)
			if err != nil {
				return fmt.Errorf("TRUSTED_PROXIES: %q không phải IP / CIDR", s)
			}
			s = netip.PrefixFrom(addr, addr.BitLen()).String()
		}
		p, err := netip.ParsePrefix(s)
		if err != nil {
			return fmt.Errorf("TRUSTED_PROXIES: %q không phải IP / CIDR", s)
		}
		trustedProxies = append(trustedProxies, p.Masked())
	}
	return nil
}

func isTrustedProxy(addr netip.Addr) bool {
	for _, p := range trustedProxies {
		if p.Contains(addr.Unmap()) {
			return true
		}
	}
	return false
}

// clientIP — IP người dùng. Kết nối tới từ proxy tin cậy: đọc X-Forwarded-For từ PHẢI sang trái (proxy nối IP nó
// thấy vào cuối), bỏ qua các hop là proxy tin cậy, lấy hop đầu tiên không phải proxy — phần client tự thêm ở bên trái
// không được dùng. Không có proxy tin cậy → IP kết nối trực tiếp.
func clientIP(c *fiber.Ctx) string {
	remote, ok := netip.AddrFromSlice(c.Context().RemoteIP())
	if !ok {
		return c.IP()
	}
	remote = remote.Unmap()
	if len(trustedProxies) == 0 || !isTrustedProxy(remote) {
		return remote.String()
	}
	hops := strings.Split(c.Get(fiber.HeaderXForwardedFor), ",")
	for i := len(hops) - 1; i >= 0; i-- {
		addr, err := netip.ParseAddr(strings.TrimSpace(hops[i]))
		if err != nil {
			break // header hỏng — không tin phần còn lại
		}
		if !isTrustedProxy(addr) {
			return addr.Unmap().String()
		}
	}
	return remote.String()
}
