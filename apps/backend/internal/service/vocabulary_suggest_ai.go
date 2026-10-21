package service

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"maps"
	"net/http"
	"slices"
	"strings"
	"unicode/utf8"

	"github.com/anthropics/anthropic-sdk-go"
	"github.com/anthropics/anthropic-sdk-go/shared/constant"
)

// Nhà cung cấp AI cho "Gợi ý tự động" khi admin thêm từ — chọn qua AI_PROVIDER:
//   - claude: Claude API (ANTHROPIC_API_KEY, model VOCAB_SUGGEST_MODEL), trả phí theo lượng dùng
//   - gemini: Google Gemini API (GEMINI_API_KEY, model GEMINI_MODEL), có gói miễn phí giới hạn tần suất
// Cả hai dùng chung prompt + bộ trường kết quả (aiSuggestion) và cùng bước lọc giá trị.

const (
	DefaultSuggestModel = "claude-opus-5-5"
	DefaultGeminiModel  = "gemini-3.5-flash-lite"
	geminiBaseURL       = "https://generativelanguage.googleapis.com/v1beta"
)

// SuggestAI — 1 nhà cung cấp AI điền nghĩa/câu ví dụ/từ loại... cho 1 từ.
// senses: các nghĩa tiếng Anh từ từ điển (có thể rỗng) làm ngữ cảnh chọn nghĩa thông dụng.
type SuggestAI interface {
	Suggest(ctx context.Context, languageID, term string, senses []string) (aiSuggestion, error)
}

// aiError — lỗi AI kèm lý do dễ hiểu cho admin (không lộ chi tiết kỹ thuật / key)
type aiError struct {
	reason string
	cause  error
}

func (e *aiError) Error() string { return e.reason + ": " + e.cause.Error() }
func (e *aiError) Unwrap() error { return e.cause }

// aiErrorReason — lý do hiển thị cho admin của 1 lỗi từ SuggestAI
func aiErrorReason(err error) string {
	var ae *aiError
	if errors.As(err, &ae) {
		return ae.reason
	}
	if errors.Is(err, context.DeadlineExceeded) {
		return "AI phản hồi quá lâu, thử lại sau"
	}
	return "không kết nối được tới dịch vụ AI hoặc kết quả không hợp lệ"
}

type aiSuggestion struct {
	Meaning        string `json:"meaning"`
	PartOfSpeech   string `json:"part_of_speech"`
	Phonetic       string `json:"phonetic"`
	Example        string `json:"example"`
	ExampleMeaning string `json:"example_meaning"`
	Level          string `json:"level"`
	ImageEmoji     string `json:"image_emoji"`
}

var suggestLanguageNames = map[string]string{"en": "English", "zh": "Chinese (Mandarin, simplified characters)"}

const suggestSystemPrompt = `You fill in vocabulary entries for LacLingo, an app where Vietnamese learners study foreign languages.
Given a word or short phrase in the target language, return the entry for its most common everyday sense (use the dictionary senses, when given, to pick it):
- meaning: short natural Vietnamese meaning(s) as shown on a flashcard, e.g. "triển khai" or "cô, dì, bác gái" — no explanations.
- part_of_speech: one of the allowed codes for that sense.
- phonetic: for English, the IPA (American) without slashes; for Chinese, pinyin with tone marks.
- example: one short, natural example sentence in the target language (max 15 words) using the word in that sense, at the word's level.
- example_meaning: a natural Vietnamese translation of the example sentence.
- level: the CEFR level a learner would typically meet this word at.
- image_emoji: exactly one emoji that illustrates the word; use "" if none fits.`

var (
	suggestPartsOfSpeechEnum = slices.Sorted(maps.Keys(partsOfSpeech))
	suggestLevelsEnum        = []string{"A1", "A2", "B1", "B2", "C1", "C2"}
	suggestFields            = []string{"meaning", "part_of_speech", "phonetic", "example", "example_meaning", "level", "image_emoji"}
)

// suggestUserPrompt — nội dung câu hỏi gửi AI (giống nhau cho mọi nhà cung cấp)
func suggestUserPrompt(languageID, term string, senses []string) string {
	lang, ok := suggestLanguageNames[languageID]
	if !ok {
		lang = languageID
	}
	var b strings.Builder
	fmt.Fprintf(&b, "Target language: %s\nWord: %s\n", lang, term)
	if len(senses) > 0 {
		b.WriteString("Dictionary senses (English):\n- " + strings.Join(senses, "\n- ") + "\n")
	}
	return b.String()
}

// parseAISuggestion đọc JSON AI trả về và bỏ giá trị không hợp lệ
func parseAISuggestion(text string) (aiSuggestion, error) {
	var ai aiSuggestion
	if err := json.Unmarshal([]byte(strings.TrimSpace(text)), &ai); err != nil {
		return aiSuggestion{}, &aiError{reason: "AI trả kết quả không đúng định dạng", cause: err}
	}
	if !partsOfSpeech[ai.PartOfSpeech] {
		ai.PartOfSpeech = ""
	}
	if !slices.Contains(suggestLevelsEnum, ai.Level) { // enum trong schema chỉ là "cố gắng" với một số model
		ai.Level = ""
	}
	if utf8.RuneCountInString(ai.ImageEmoji) > 8 { // cột image_emoji VARCHAR(16) — bỏ nếu AI trả dài bất thường
		ai.ImageEmoji = ""
	}
	return ai, nil
}

// ===== Claude =====

type claudeSuggestAI struct {
	client *anthropic.Client
	model  string
}

func NewClaudeSuggestAI(client *anthropic.Client, model string) SuggestAI {
	if model == "" {
		model = DefaultSuggestModel
	}
	return &claudeSuggestAI{client: client, model: model}
}

var claudeSuggestionSchema = func() map[string]any {
	props := map[string]any{}
	for _, f := range suggestFields {
		props[f] = map[string]any{"type": "string"}
	}
	props["part_of_speech"] = map[string]any{"type": "string", "enum": suggestPartsOfSpeechEnum}
	props["level"] = map[string]any{"type": "string", "enum": suggestLevelsEnum}
	return map[string]any{"type": "object", "properties": props, "required": suggestFields, "additionalProperties": false}
}()

func (c *claudeSuggestAI) Suggest(ctx context.Context, languageID, term string, senses []string) (aiSuggestion, error) {
	ctx, cancel := context.WithTimeout(ctx, suggestAITimeout)
	defer cancel()
	resp, err := c.client.Beta.Messages.New(ctx, anthropic.BetaMessageNewParams{
		Model:     c.model,
		MaxTokens: 2048,
		System:    []anthropic.BetaTextBlockParam{{Text: suggestSystemPrompt}},
		Messages:  []anthropic.BetaMessageParam{anthropic.NewBetaUserMessage(anthropic.NewBetaTextBlock(suggestUserPrompt(languageID, term, senses)))},
		OutputConfig: anthropic.BetaOutputConfigParam{
			Effort: anthropic.BetaOutputConfigEffortLow, // tra cứu ngắn — không cần suy luận sâu
			Format: anthropic.BetaJSONOutputFormatParam{Schema: claudeSuggestionSchema},
		},
		// Bị bộ lọc an toàn từ chối (hiếm với từ vựng) thì server tự chuyển sang model dự phòng phù hợp
		Fallbacks: anthropic.BetaFallbacksParamUnion{OfDefault: constant.ValueOf[constant.Default]()},
		Betas:     []anthropic.AnthropicBeta{anthropic.AnthropicBetaServerSideFallback2026_07_01},
	})
	if err != nil {
		return aiSuggestion{}, &aiError{reason: claudeErrorReason(err), cause: err}
	}
	if resp.StopReason == anthropic.BetaStopReasonRefusal {
		return aiSuggestion{}, &aiError{reason: "AI từ chối trả lời cho từ này", cause: errors.New("refusal")}
	}
	var text strings.Builder
	for _, block := range resp.Content {
		if b, ok := block.AsAny().(anthropic.BetaTextBlock); ok {
			text.WriteString(b.Text)
		}
	}
	return parseAISuggestion(text.String())
}

func claudeErrorReason(err error) string {
	var apiErr *anthropic.Error
	if !errors.As(err, &apiErr) {
		return aiErrorReason(err)
	}
	switch {
	case strings.Contains(strings.ToLower(apiErr.Error()), "credit balance"):
		return "tài khoản Anthropic đã hết credit — nạp thêm ở console.anthropic.com → Plans & Billing"
	case apiErr.StatusCode == http.StatusUnauthorized || apiErr.StatusCode == http.StatusForbidden:
		return "ANTHROPIC_API_KEY không hợp lệ hoặc đã bị thu hồi"
	case apiErr.StatusCode == http.StatusTooManyRequests:
		return "vượt giới hạn tần suất gọi AI, thử lại sau ít phút"
	case apiErr.StatusCode == http.StatusNotFound:
		return "model AI trong VOCAB_SUGGEST_MODEL không tồn tại"
	case apiErr.StatusCode >= 500:
		return "dịch vụ AI đang quá tải, thử lại sau"
	default:
		return fmt.Sprintf("AI trả lỗi %d", apiErr.StatusCode)
	}
}

// ===== Gemini (REST generateContent + JSON schema) =====

type geminiSuggestAI struct {
	http    *http.Client
	apiKey  string
	model   string
	baseURL string
}

func NewGeminiSuggestAI(apiKey, model string) SuggestAI {
	// Chấp nhận cả dạng "models/gemini-..." như trong docs/ListModels
	model = strings.TrimPrefix(strings.TrimSpace(model), "models/")
	if model == "" {
		model = DefaultGeminiModel
	}
	return &geminiSuggestAI{http: &http.Client{}, apiKey: strings.TrimSpace(apiKey), model: model, baseURL: geminiBaseURL}
}

// Gemini responseSchema: tập con OpenAPI (kiểu viết hoa, không có additionalProperties)
var geminiSuggestionSchema = func() map[string]any {
	props := map[string]any{}
	for _, f := range suggestFields {
		props[f] = map[string]any{"type": "STRING"}
	}
	props["part_of_speech"] = map[string]any{"type": "STRING", "enum": suggestPartsOfSpeechEnum}
	props["level"] = map[string]any{"type": "STRING", "enum": suggestLevelsEnum}
	return map[string]any{"type": "OBJECT", "properties": props, "required": suggestFields, "propertyOrdering": suggestFields}
}()

type geminiResponse struct {
	Candidates []struct {
		Content struct {
			Parts []struct {
				Text string `json:"text"`
			} `json:"parts"`
		} `json:"content"`
		FinishReason string `json:"finishReason"` // STOP | MAX_TOKENS | SAFETY | RECITATION | PROHIBITED_CONTENT...
	} `json:"candidates"`
	PromptFeedback struct {
		BlockReason string `json:"blockReason"`
	} `json:"promptFeedback"`
	Error struct {
		Code    int    `json:"code"`
		Message string `json:"message"`
		Status  string `json:"status"`
	} `json:"error"`
}

func (g *geminiSuggestAI) Suggest(ctx context.Context, languageID, term string, senses []string) (aiSuggestion, error) {
	ctx, cancel := context.WithTimeout(ctx, suggestAITimeout)
	defer cancel()
	body, err := json.Marshal(map[string]any{
		"systemInstruction": map[string]any{"parts": []map[string]string{{"text": suggestSystemPrompt}}},
		"contents":          []map[string]any{{"role": "user", "parts": []map[string]string{{"text": suggestUserPrompt(languageID, term, senses)}}}},
		"generationConfig": map[string]any{
			"responseMimeType": "application/json",
			"responseSchema":   geminiSuggestionSchema,
		},
	})
	if err != nil {
		return aiSuggestion{}, err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, fmt.Sprintf("%s/models/%s:generateContent", g.baseURL, g.model), bytes.NewReader(body))
	if err != nil {
		return aiSuggestion{}, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-goog-api-key", g.apiKey) // header thay vì ?key= — key không lọt vào log URL
	resp, err := g.http.Do(req)
	if err != nil {
		return aiSuggestion{}, &aiError{reason: aiErrorReason(err), cause: err}
	}
	defer resp.Body.Close()
	raw, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if err != nil {
		return aiSuggestion{}, &aiError{reason: aiErrorReason(err), cause: err}
	}
	var gr geminiResponse
	if err := json.Unmarshal(raw, &gr); err != nil && resp.StatusCode == http.StatusOK {
		return aiSuggestion{}, &aiError{reason: "AI trả kết quả không đúng định dạng", cause: err}
	}

	if resp.StatusCode != http.StatusOK {
		cause := fmt.Errorf("gemini HTTP %d %s: %s", resp.StatusCode, gr.Error.Status, gr.Error.Message)
		return aiSuggestion{}, &aiError{reason: geminiErrorReason(resp.StatusCode, gr.Error.Status, gr.Error.Message), cause: cause}
	}
	if gr.PromptFeedback.BlockReason != "" {
		return aiSuggestion{}, &aiError{reason: "AI từ chối trả lời cho từ này", cause: errors.New("blocked: " + gr.PromptFeedback.BlockReason)}
	}
	if len(gr.Candidates) == 0 {
		return aiSuggestion{}, &aiError{reason: "AI không trả kết quả", cause: fmt.Errorf("empty candidates: %s", raw)}
	}
	switch fr := gr.Candidates[0].FinishReason; fr {
	case "", "STOP":
	case "MAX_TOKENS":
		return aiSuggestion{}, &aiError{reason: "AI trả lời bị cắt giữa chừng, thử lại sau", cause: errors.New("finishReason " + fr)}
	default: // SAFETY, RECITATION, PROHIBITED_CONTENT, BLOCKLIST...
		return aiSuggestion{}, &aiError{reason: "AI từ chối trả lời cho từ này", cause: errors.New("finishReason " + fr)}
	}
	var text strings.Builder
	for _, p := range gr.Candidates[0].Content.Parts {
		text.WriteString(p.Text)
	}
	return parseAISuggestion(text.String())
}

func geminiErrorReason(code int, status, message string) string {
	msg := strings.ToLower(message)
	switch {
	case strings.Contains(msg, "api key expired"):
		return "GEMINI_API_KEY đã hết hạn — tạo key mới ở aistudio.google.com/apikey"
	case strings.Contains(msg, "api key not valid") || strings.Contains(msg, "api_key_invalid") || code == http.StatusUnauthorized:
		return "GEMINI_API_KEY không hợp lệ"
	case code == http.StatusForbidden:
		return "GEMINI_API_KEY không có quyền dùng Gemini API (bật Generative Language API cho project)"
	case code == http.StatusTooManyRequests || status == "RESOURCE_EXHAUSTED":
		return "đã dùng hết hạn mức miễn phí của Gemini (theo phút/ngày), thử lại sau"
	case code == http.StatusNotFound:
		return "model AI trong GEMINI_MODEL không tồn tại"
	case code >= 500:
		return "dịch vụ AI đang quá tải, thử lại sau"
	default:
		return fmt.Sprintf("AI trả lỗi %d", code)
	}
}
