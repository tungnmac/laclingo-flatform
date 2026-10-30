package service

import (
	"strings"
	"testing"
)

func TestSanitizeTaskMemo(t *testing.T) {
	cases := []struct{ in, want string }{
		{"<p><strong>Học</strong> 20 từ <em>mới</em></p><ul><li>ôn</li></ul>", "<p><strong>Học</strong> 20 từ <em>mới</em></p><ul><li>ôn</li></ul>"},
		{`<p>xem <a href="https://laclingo.vn">link</a></p>`, `<p>xem <a href="https://laclingo.vn" rel="nofollow">link</a></p>`},
		{`<p onclick="alert(1)">a</p><script>alert(1)</script><iframe src="https://evil"></iframe>`, `<p>a</p>`},
		{`<a href="javascript:alert(1)">x</a>`, `x`},
		{"<p></p>", ""},
		{"<p> &nbsp; </p>", ""},
		{"  ", ""},
	}
	for _, c := range cases {
		if got := sanitizeTaskMemo(c.in); got != c.want {
			t.Errorf("sanitizeTaskMemo(%q) = %q, muốn %q", c.in, got, c.want)
		}
	}
	// Ghi chú dài (trước đây tối đa 500 ký tự) vẫn hợp lệ
	long := "<p>" + strings.Repeat("học ", 5000) + "</p>"
	if err := validateTaskInput(dailyTaskInput{Title: "x", Kind: "free", Memo: sanitizeTaskMemo(long)}); err != nil {
		t.Errorf("ghi chú 20.000 ký tự phải hợp lệ: %v", err)
	}
}

func TestTaskMemoHTML(t *testing.T) {
	cases := []struct{ in, want string }{
		{"", ""},
		{"Ôn 20 từ\nđọc 1 bài", "<p>Ôn 20 từ</p><p>đọc 1 bài</p>"},
		{"a < b <img src=x onerror=alert(1)>", "<p>a &lt; b &lt;img src=x onerror=alert(1)&gt;</p>"},
		{"<p><strong>đậm</strong></p>", "<p><strong>đậm</strong></p>"},
		{`<p>x<img src=x onerror="alert(1)"></p>`, `<p>x<img src="x"></p>`},
	}
	for _, c := range cases {
		if got := taskMemoHTML(c.in); got != c.want {
			t.Errorf("taskMemoHTML(%q) = %q, muốn %q", c.in, got, c.want)
		}
	}
}
