package service

import "testing"

func TestCompareVersions(t *testing.T) {
	cases := []struct {
		a, b string
		want int
	}{
		{"1.2.10", "1.2.9", 1}, {"1.10", "1.9.9", 1}, {"1.0", "1.0.0", 0}, {"2", "10", -1}, {"1.2.3", "1.2.3", 0}, {"0.9", "1", -1},
	}
	for _, c := range cases {
		if got := compareVersions(c.a, c.b); got != c.want {
			t.Errorf("compareVersions(%q, %q) = %d, muốn %d", c.a, c.b, got, c.want)
		}
	}
	for _, v := range []string{"1", "1.2", "1.2.3"} {
		if !versionPattern.MatchString(v) {
			t.Errorf("%q phải hợp lệ", v)
		}
	}
	for _, v := range []string{"", "v1.2", "1.2.3.4", "1..2", "1.2-beta"} {
		if versionPattern.MatchString(v) {
			t.Errorf("%q phải bị từ chối", v)
		}
	}
}
