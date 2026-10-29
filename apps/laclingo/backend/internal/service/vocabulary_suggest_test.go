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

	"github.com/anthropics/anthropic-sdk-go"
	"github.com/anthropics/anthropic-sdk-go/option"
)

const fakeDictJSON = `[{"word":"deploy","phonetic":"/dɪˈplɔɪ/","phonetics":[{"text":"/dɪˈplɔɪ/","audio":"https://api.dictionaryapi.dev/media/pronunciations/en/deploy-uk.mp3"},{"text":"","audio":"https://api.dictionaryapi.dev/media/pronunciations/en/deploy-us.mp3"}],
 "meanings":[{"partOfSpeech":"noun","definitions":[{"definition":"The act of deploying."}]},{"partOfSpeech":"verb","definitions":[{"definition":"To prepare and arrange for use."},{"definition":"To install software on a server."}]}]}]`

func fakeDictionary(t *testing.T) *httptest.Server {
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasSuffix(r.URL.Path, "/deploy") {
			_, _ = io.WriteString(w, fakeDictJSON)
			return
		}
		w.WriteHeader(http.StatusNotFound)
	}))
}

// fakeClaude kiểm tra request rồi trả JSON gợi ý như Claude (structured output → 1 text block)
func fakeClaude(t *testing.T, captured *map[string]any, answer string) *httptest.Server {
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		body, _ := io.ReadAll(r.Body)
		var req map[string]any
		_ = json.Unmarshal(body, &req)
		req["_beta"] = r.Header.Get("anthropic-beta")
		*captured = req
		text, _ := json.Marshal(answer)
		w.Header().Set("Content-Type", "application/json")
		_, _ = io.WriteString(w, `{"id":"msg_1","type":"message","role":"assistant","model":"claude-opus-5-5",
			"content":[{"type":"text","text":`+string(text)+`}],"stop_reason":"end_turn","usage":{"input_tokens":10,"output_tokens":20}}`)
	}))
}

func newTestSuggester(dictURL string, claudeURL string) *VocabularySuggester {
	var ai AIClient
	if claudeURL != "" {
		client := anthropic.NewClient(option.WithAPIKey("test"), option.WithBaseURL(claudeURL), option.WithMaxRetries(0))
		ai = NewClaudeClient(&client, "")
	}
	s := NewVocabularySuggester(ai)
	s.dictURL = dictURL + "/"
	return s
}

func TestSuggestCombinesDictionaryAndAI(t *testing.T) {
	dict := fakeDictionary(t)
	defer dict.Close()
	var req map[string]any
	ai := fakeClaude(t, &req, `{"meaning":"triển khai","part_of_speech":"verb","phonetic":"dɪˈplɔɪ","example":"We deploy the app every Friday.","example_meaning":"Chúng tôi triển khai ứng dụng mỗi thứ Sáu.","level":"B1","image_emoji":"🚀"}`)
	defer ai.Close()

	got, err := newTestSuggester(dict.URL, ai.URL).Suggest(context.Background(), VocabularySuggestRequest{LanguageID: "en", Term: " deploy "})
	if err != nil {
		t.Fatalf("Suggest: %v", err)
	}
	if got.Phonetic != "dɪˈplɔɪ" || !strings.HasSuffix(got.AudioURL, "deploy-us.mp3") {
		t.Errorf("phiên âm (bỏ /…/) và audio giọng Mỹ từ từ điển: %+v", got)
	}
	if got.Meaning != "triển khai" || got.PartOfSpeech != "verb" || got.Level != "B1" || got.ImageEmoji != "🚀" || got.ExampleMeaning == "" {
		t.Errorf("nghĩa/từ loại (theo AI)/trình độ/emoji: %+v", got)
	}
	if !slices.Equal(got.Sources, []string{"dictionary", "ai"}) || !got.AIAvailable {
		t.Errorf("nguồn: %+v", got)
	}

	// Request gửi Claude: model mặc định, structured output, effort low, fallback mặc định, ngữ cảnh từ điển
	if req["model"] != DefaultSuggestModel {
		t.Errorf("model = %v", req["model"])
	}
	oc, _ := req["output_config"].(map[string]any)
	format, _ := oc["format"].(map[string]any)
	if oc["effort"] != "low" || format["type"] != "json_schema" || format["schema"] == nil {
		t.Errorf("output_config = %v", oc)
	}
	if req["fallbacks"] != "default" || !strings.Contains(req["_beta"].(string), "server-side-fallback-2026-07-01") {
		t.Errorf("fallbacks = %v, beta = %v", req["fallbacks"], req["_beta"])
	}
	msgs, _ := json.Marshal(req["messages"])
	if !strings.Contains(string(msgs), "verb: To prepare and arrange for use.") {
		t.Errorf("AI phải nhận các nghĩa từ điển làm ngữ cảnh: %s", msgs)
	}
}

func TestSuggestWithoutAIKeyReturnsDictionaryOnly(t *testing.T) {
	dict := fakeDictionary(t)
	defer dict.Close()
	got, err := newTestSuggester(dict.URL, "").Suggest(context.Background(), VocabularySuggestRequest{LanguageID: "en", Term: "deploy"})
	if err != nil || got.AIAvailable || got.Meaning != "" || got.Phonetic == "" || got.PartOfSpeech != "verb" {
		t.Errorf("chỉ có phần từ điển (từ loại có nhiều nghĩa nhất: verb 2 > noun 1): %+v, err=%v", got, err)
	}
}

func TestSuggestNothingFound(t *testing.T) {
	dict := fakeDictionary(t)
	defer dict.Close()
	got, err := newTestSuggester(dict.URL, "").Suggest(context.Background(), VocabularySuggestRequest{LanguageID: "zh", Term: "学习"})
	if err != nil || len(got.Sources) != 0 || got.AIAvailable {
		t.Errorf("không có AI + không phải tiếng Anh → 200, sources rỗng, ai_available=false (để FE báo chưa cấu hình AI): %+v, err=%v", got, err)
	}
	if _, err := newTestSuggester(dict.URL, "").Suggest(context.Background(), VocabularySuggestRequest{LanguageID: "en", Term: " "}); !errors.Is(err, ErrInvalidInput) {
		t.Errorf("từ rỗng → ErrInvalidInput, nhận %v", err)
	}
}

func TestSuggestAIFailureIsNotNotFound(t *testing.T) {
	dict := fakeDictionary(t)
	defer dict.Close()
	broken := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		_, _ = io.WriteString(w, `{"type":"error","error":{"type":"authentication_error","message":"invalid x-api-key"}}`)
	}))
	defer broken.Close()
	s := newTestSuggester(dict.URL, broken.URL)
	if _, err := s.Suggest(context.Background(), VocabularySuggestRequest{LanguageID: "zh", Term: "学习"}); !errors.Is(err, ErrSuggestAIFailed) || !strings.Contains(err.Error(), "API_KEY") {
		t.Errorf("AI lỗi + từ điển không có → ErrSuggestAIFailed (502) kèm lý do, nhận %v", err)
	}
	// Tiếng Anh có từ điển: AI lỗi vẫn trả phần từ điển, không cache để lần sau thử lại AI
	got, err := s.Suggest(context.Background(), VocabularySuggestRequest{LanguageID: "en", Term: "deploy"})
	if err != nil || !slices.Equal(got.Sources, []string{"dictionary"}) || !strings.Contains(got.AIError, "API_KEY không hợp lệ") {
		t.Errorf("AI lỗi nhưng còn từ điển — vẫn trả từ điển + lý do lỗi AI: %+v, err=%v", got, err)
	}
	if _, ok := s.cached("en\x00deploy"); ok {
		t.Error("kết quả khi AI lỗi không được lưu cache")
	}
}

func TestSuggestCachesSuccessfulResults(t *testing.T) {
	dict := fakeDictionary(t)
	defer dict.Close()
	calls := 0
	var req map[string]any
	inner := fakeClaude(t, &req, `{"meaning":"triển khai","part_of_speech":"verb","phonetic":"","example":"e","example_meaning":"m","level":"B1","image_emoji":""}`)
	defer inner.Close()
	counting := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		calls++
		inner.Config.Handler.ServeHTTP(w, r)
	}))
	defer counting.Close()
	s := newTestSuggester(dict.URL, counting.URL)
	for _, term := range []string{"deploy", "Deploy", " deploy "} {
		got, err := s.Suggest(context.Background(), VocabularySuggestRequest{LanguageID: "en", Term: term})
		if err != nil || got.Meaning != "triển khai" || got.Term != strings.TrimSpace(term) {
			t.Fatalf("%q: %+v, err=%v", term, got, err)
		}
	}
	if calls != 1 {
		t.Errorf("cùng 1 từ (khác hoa thường/khoảng trắng) chỉ gọi AI 1 lần, gọi %d lần", calls)
	}
}

func TestSuggestChineseUsesAIPinyin(t *testing.T) {
	dict := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Errorf("tiếng Trung không được gọi Free Dictionary (chỉ có tiếng Anh): %s", r.URL)
	}))
	defer dict.Close()
	var req map[string]any
	ai := fakeClaude(t, &req, `{"meaning":"học tập","part_of_speech":"verb","phonetic":"xuéxí","example":"我喜欢学习中文。","example_meaning":"Tôi thích học tiếng Trung.","level":"A1","image_emoji":"📚"}`)
	defer ai.Close()
	got, err := newTestSuggester(dict.URL, ai.URL).Suggest(context.Background(), VocabularySuggestRequest{LanguageID: "zh", Term: "学习"})
	if err != nil || got.Phonetic != "xuéxí" || got.AudioURL != "" || !slices.Equal(got.Sources, []string{"ai"}) {
		t.Errorf("tiếng Trung: pinyin từ AI, không audio: %+v, err=%v", got, err)
	}
	msgs, _ := json.Marshal(req["messages"])
	if !strings.Contains(string(msgs), "Chinese") {
		t.Errorf("prompt phải nói ngôn ngữ là tiếng Trung: %s", msgs)
	}
}

func TestSuggestDropsInvalidAIValues(t *testing.T) {
	var req map[string]any
	ai := fakeClaude(t, &req, `{"meaning":"x","part_of_speech":"weird","phonetic":"","example":"","example_meaning":"","level":"B1","image_emoji":"🚀🚀🚀🚀🚀🚀🚀🚀🚀"}`)
	defer ai.Close()
	dict := fakeDictionary(t)
	defer dict.Close()
	got, _ := newTestSuggester(dict.URL, ai.URL).Suggest(context.Background(), VocabularySuggestRequest{LanguageID: "en", Term: "qwzx"})
	if got.PartOfSpeech != "" || got.ImageEmoji != "" {
		t.Errorf("từ loại lạ / emoji quá dài phải bị bỏ: %+v", got)
	}
}
