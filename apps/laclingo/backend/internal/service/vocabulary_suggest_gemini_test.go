package service

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"net/http/httptest"
	"slices"
	"strings"
	"testing"
)

// fakeGemini trả lời như generateContent; status != 200 thì trả body lỗi kiểu Google API
func fakeGemini(t *testing.T, captured *map[string]any, status int, body string) *httptest.Server {
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		raw, _ := io.ReadAll(r.Body)
		var req map[string]any
		_ = json.Unmarshal(raw, &req)
		req["_path"] = r.URL.Path
		req["_query"] = r.URL.RawQuery
		req["_key"] = r.Header.Get("x-goog-api-key")
		*captured = req
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(status)
		_, _ = io.WriteString(w, body)
	}))
}

func geminiAnswer(text string) string {
	t, _ := json.Marshal(text)
	return `{"candidates":[{"content":{"role":"model","parts":[{"text":` + string(t) + `}]},"finishReason":"STOP"}]}`
}

func newTestGemini(url string) AIClient {
	g := NewGeminiClient("test-key", "").(*geminiClient)
	g.baseURL = url
	return g
}

func TestGeminiSuggestWithDictionary(t *testing.T) {
	dict := fakeDictionary(t)
	defer dict.Close()
	var req map[string]any
	gem := fakeGemini(t, &req, http.StatusOK, geminiAnswer(`{"meaning":"triển khai","part_of_speech":"verb","phonetic":"x","example":"We deploy on Fridays.","example_meaning":"Chúng tôi triển khai vào thứ Sáu.","level":"B2","image_emoji":"🚀"}`))
	defer gem.Close()

	s := NewVocabularySuggester(newTestGemini(gem.URL))
	s.dictURL = dict.URL + "/"
	got, err := s.Suggest(context.Background(), VocabularySuggestRequest{LanguageID: "en", Term: "deploy"})
	if err != nil {
		t.Fatal(err)
	}
	if got.Meaning != "triển khai" || got.Level != "B2" || got.ImageEmoji != "🚀" || got.Phonetic != "dɪˈplɔɪ" || !got.AIAvailable {
		t.Fatalf("unexpected suggestion: %+v", got)
	}
	if req["_path"] != "/models/"+DefaultGeminiModel+":generateContent" || req["_key"] != "test-key" || req["_query"] != "" {
		t.Fatalf("bad request target: path=%v query=%v key-set=%v", req["_path"], req["_query"], req["_key"] != "")
	}
	cfg := req["generationConfig"].(map[string]any)
	if cfg["responseMimeType"] != "application/json" || cfg["responseSchema"] == nil {
		t.Fatalf("missing JSON schema config: %v", cfg)
	}
	contents, _ := json.Marshal(req["contents"])
	if !strings.Contains(string(contents), "To install software on a server.") {
		t.Fatalf("dictionary senses not sent to AI: %s", contents)
	}
}

func TestGeminiFailureKeepsDictionary(t *testing.T) {
	dict := fakeDictionary(t)
	defer dict.Close()
	var req map[string]any
	gem := fakeGemini(t, &req, http.StatusTooManyRequests, `{"error":{"code":429,"message":"quota","status":"RESOURCE_EXHAUSTED"}}`)
	defer gem.Close()
	s := NewVocabularySuggester(newTestGemini(gem.URL))
	s.dictURL = dict.URL + "/"
	got, err := s.Suggest(context.Background(), VocabularySuggestRequest{LanguageID: "en", Term: "deploy"})
	if err != nil || got.Phonetic == "" || !strings.Contains(got.AIError, "hạn mức") || slices.Contains(got.Sources, "ai") {
		t.Fatalf("want dictionary result with ai_error, got %+v err=%v", got, err)
	}
}

func TestGeminiModelName(t *testing.T) {
	g := NewGeminiClient(" k ", " models/gemini-x\n").(*geminiClient)
	if g.model != "gemini-x" || g.apiKey != "k" {
		t.Fatalf("model=%q key-trimmed=%v", g.model, g.apiKey == "k")
	}
}

func TestGeminiErrors(t *testing.T) {
	cases := []struct {
		name, body, want string
		status           int
	}{
		{"bad key", `{"error":{"code":400,"message":"API key not valid. Please pass a valid API key.","status":"INVALID_ARGUMENT"}}`, "GEMINI_API_KEY không hợp lệ", 400},
		{"quota", `{"error":{"code":429,"message":"You exceeded your current quota","status":"RESOURCE_EXHAUSTED"}}`, "hạn mức miễn phí", 429},
		{"model", `{"error":{"code":404,"message":"models/x is not found","status":"NOT_FOUND"}}`, "GEMINI_MODEL", 404},
		{"blocked", `{"promptFeedback":{"blockReason":"SAFETY"}}`, "từ chối", 200},
		{"expired key", `{"error":{"code":400,"message":"API key expired. Please renew the API key.","status":"INVALID_ARGUMENT"}}`, "hết hạn", 400},
		{"no permission", `{"error":{"code":403,"message":"Permission denied","status":"PERMISSION_DENIED"}}`, "không có quyền", 403},
		{"safety finish", `{"candidates":[{"finishReason":"SAFETY"}]}`, "từ chối", 200},
		{"truncated", `{"candidates":[{"content":{"parts":[{"text":"{\"meaning\":"}]},"finishReason":"MAX_TOKENS"}]}`, "bị cắt", 200},
		{"no candidates", `{"candidates":[]}`, "không trả kết quả", 200},
		{"bad json", geminiAnswer("not json"), "không đúng định dạng", 200},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			var req map[string]any
			gem := fakeGemini(t, &req, c.status, c.body)
			defer gem.Close()
			s := NewVocabularySuggester(newTestGemini(gem.URL))
			// tiếng Trung: không tra từ điển → AI lỗi = lỗi hệ thống
			_, err := s.Suggest(context.Background(), VocabularySuggestRequest{LanguageID: "zh", Term: "学习"})
			if !errors.Is(err, ErrSuggestAIFailed) || !strings.Contains(err.Error(), c.want) {
				t.Fatalf("want ErrSuggestAIFailed containing %q, got %v", c.want, err)
			}
			if strings.Contains(err.Error(), "test-key") {
				t.Fatal("error leaks API key")
			}
		})
	}
}

func TestSuggestWithTopic(t *testing.T) {
	var req map[string]any
	gem := fakeGemini(t, &req, http.StatusOK, geminiAnswer(`{"meaning":"bus dữ liệu","part_of_speech":"noun","phonetic":"bʌs","example":"The CPU sends data over the bus.","example_meaning":"CPU gửi dữ liệu qua bus.","level":"B2","image_emoji":"🖥️"}`))
	defer gem.Close()
	s := NewVocabularySuggester(newTestGemini(gem.URL))
	s.dictURL = "http://127.0.0.1:0/" // tra từ điển lỗi → chỉ dùng AI

	ask := func(topic string) string {
		req = nil
		if _, err := s.Suggest(context.Background(), VocabularySuggestRequest{LanguageID: "en", Term: "bus", Topic: topic}); err != nil {
			t.Fatal(err)
		}
		if req == nil {
			return "(cache)"
		}
		contents, _ := json.Marshal(req["contents"])
		return string(contents)
	}
	if got := ask("Công nghệ thông tin"); !strings.Contains(got, "Topic: Công nghệ thông tin") {
		t.Fatalf("topic not sent to AI: %s", got)
	}
	if got := ask("Công nghệ thông tin"); got != "(cache)" {
		t.Errorf("same word + topic → cache, got AI call %s", got)
	}
	if got := ask("Giao thông"); !strings.Contains(got, "Topic: Giao thông") {
		t.Errorf("other topic must ask AI again: %s", got)
	}
	if got := ask(""); strings.Contains(got, "Topic:") {
		t.Errorf("no topic → no Topic line: %s", got)
	}
	if _, err := s.Suggest(context.Background(), VocabularySuggestRequest{LanguageID: "en", Term: "bus", Topic: strings.Repeat("x", 51)}); !errors.Is(err, ErrInvalidInput) {
		t.Errorf("topic too long → ErrInvalidInput, got %v", err)
	}
}
