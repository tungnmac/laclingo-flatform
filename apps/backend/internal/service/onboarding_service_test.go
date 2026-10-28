package service

import (
	"errors"
	"strings"
	"testing"
	"time"
)

func intPtr(v int) *int { return &v }

func TestOnboardingValidate(t *testing.T) {
	s := &OnboardingService{now: func() time.Time { return time.Date(2026, 10, 28, 0, 0, 0, 0, time.UTC) }}
	en := func(level string) []TargetLanguage { return []TargetLanguage{{LanguageID: "en", Level: level}} }
	cases := []struct {
		name string
		req  SaveOnboardingRequest
		ok   bool
	}{
		{"rỗng hợp lệ", SaveOnboardingRequest{}, true},
		{"đầy đủ", SaveOnboardingRequest{
			FullName: "An", AvatarURL: "https://app.example.com/avatars/lac.svg", Country: "vn", NativeLanguage: "vi",
			BirthYear: intPtr(2000), Bio: "Xin chào", TargetLanguages: en("b1"),
			PreferredTopics: []PreferredTopic{{LanguageID: "en", Topic: "Du lịch"}, {LanguageID: "en", Topic: "Du lịch"}},
		}, true},
		{"avatar đã tải lên", SaveOnboardingRequest{AvatarURL: "/users/avatars/3fa85f64-5717-4562-b3fc-2c963f66afa6"}, true},
		{"avatar đường dẫn lạ", SaveOnboardingRequest{AvatarURL: "/etc/passwd"}, false},
		{"avatar javascript", SaveOnboardingRequest{AvatarURL: "javascript:alert(1)"}, false},
		{"quốc gia sai", SaveOnboardingRequest{Country: "VNM"}, false},
		{"ngôn ngữ mẹ đẻ sai", SaveOnboardingRequest{NativeLanguage: "vi vn"}, false},
		{"năm sinh quá nhỏ", SaveOnboardingRequest{BirthYear: intPtr(1899)}, false},
		{"năm sinh tương lai", SaveOnboardingRequest{BirthYear: intPtr(2025)}, false},
		{"bio quá dài", SaveOnboardingRequest{Bio: strings.Repeat("a", 301)}, false},
		{"trình độ sai", SaveOnboardingRequest{TargetLanguages: en("D1")}, false},
		{"trùng ngôn ngữ", SaveOnboardingRequest{TargetLanguages: append(en("A1"), en("A2")...)}, false},
		{"chủ đề của ngôn ngữ không học", SaveOnboardingRequest{TargetLanguages: en("A1"), PreferredTopics: []PreferredTopic{{LanguageID: "zh", Topic: "Ăn uống"}}}, false},
		{"chủ đề rỗng", SaveOnboardingRequest{TargetLanguages: en("A1"), PreferredTopics: []PreferredTopic{{LanguageID: "en", Topic: " "}}}, false},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			req := c.req
			err := s.validate(&req)
			if c.ok && err != nil {
				t.Fatalf("muốn hợp lệ, lỗi: %v", err)
			}
			if !c.ok && !errors.Is(err, ErrInvalidInput) {
				t.Fatalf("muốn ErrInvalidInput, được %v", err)
			}
		})
	}
}

func TestOnboardingValidateNormalizes(t *testing.T) {
	s := &OnboardingService{now: time.Now}
	req := SaveOnboardingRequest{
		Country: " vn ", TargetLanguages: []TargetLanguage{{LanguageID: " en ", Level: "b2"}},
		PreferredTopics: []PreferredTopic{{LanguageID: "en", Topic: " Du lịch "}, {LanguageID: "en", Topic: "Du lịch"}},
	}
	if err := s.validate(&req); err != nil {
		t.Fatal(err)
	}
	if req.Country != "VN" || req.TargetLanguages[0] != (TargetLanguage{LanguageID: "en", Level: "B2"}) {
		t.Fatalf("chưa chuẩn hoá: %+v", req)
	}
	if len(req.PreferredTopics) != 1 || req.PreferredTopics[0].Topic != "Du lịch" {
		t.Fatalf("chủ đề trùng chưa gộp: %+v", req.PreferredTopics)
	}
}
