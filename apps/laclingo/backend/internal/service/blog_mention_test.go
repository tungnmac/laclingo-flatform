package service

import (
	"reflect"
	"testing"
)

func TestExtractMentions(t *testing.T) {
	cases := []struct {
		in   string
		want []string
	}{
		{"chào @nguyenvana nhé", []string{"nguyenvana"}},
		{"@An.B và @an.b, @c_d-e!", []string{"an.b", "c_d-e"}}, // không phân biệt hoa thường, bỏ trùng, giữ thứ tự
		{"cuối câu @bob.", []string{"bob"}},                    // dấu chấm cuối câu không thuộc username
		{"email a@example.com không phải tag", nil},            // @ dính chữ phía trước
		{"@ab quá ngắn, @@xyz", nil},                           // < 3 ký tự; @@ không hợp lệ
		{"(@hoa) [@lan]", []string{"hoa", "lan"}},
	}
	for _, c := range cases {
		if got := extractMentions(c.in); !reflect.DeepEqual(got, c.want) {
			t.Errorf("extractMentions(%q) = %v, want %v", c.in, got, c.want)
		}
	}
}

func TestExtractMentionsCapsAtTen(t *testing.T) {
	in := ""
	for i := 0; i < 15; i++ {
		in += " @user" + string(rune('a'+i)) + "xx"
	}
	if got := extractMentions(in); len(got) != maxMentionsPerComment {
		t.Fatalf("got %d mentions, want %d", len(got), maxMentionsPerComment)
	}
}

func TestExtractMentionsIgnoresUrlsCodeAndPartialUnicode(t *testing.T) {
	cases := []struct {
		in   string
		want []string
	}{
		{"xem https://youtube.com/@channel nhé", nil},          // @ trong URL
		{"dùng `@Override` và ```\n@app.route\n``` thôi", nil}, // trong code
		{"chào @nguyễn", nil},                                  // username không có dấu → @nguyễn không phải tag
		{"@lan: xem này", []string{"lan"}},                     // dấu : sau tên vẫn là tag
	}
	for _, c := range cases {
		if got := extractMentions(c.in); !reflect.DeepEqual(got, c.want) {
			t.Errorf("extractMentions(%q) = %v, want %v", c.in, got, c.want)
		}
	}
}

func TestAddedMentionsOnlyReturnsNewTags(t *testing.T) {
	cases := []struct {
		old, new string
		want     []string
	}{
		{"@lan chào", "@lan chào (sửa)", nil},  // giữ nguyên tag cũ → không báo lại
		{"@lan", "@LAN @hoa", []string{"hoa"}}, // không phân biệt hoa thường
		{"không tag", "@lan @hoa", []string{"lan", "hoa"}},
		{"@lan @hoa", "@hoa", nil},                          // bỏ bớt tag → không ai mới
		{"`@lan` trong code", "@lan thật", []string{"lan"}}, // tag cũ trong code không tính là đã tag
	}
	for _, c := range cases {
		if got := addedMentions(c.old, c.new); !reflect.DeepEqual(got, c.want) {
			t.Errorf("addedMentions(%q, %q) = %v, want %v", c.old, c.new, got, c.want)
		}
	}
}
