package service

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/anthropics/anthropic-sdk-go"
	"github.com/anthropics/anthropic-sdk-go/shared/constant"
)

// Nhà cung cấp AI dùng chung (gợi ý từ mới cho admin, phân tích câu cho học viên) — chọn qua AI_PROVIDER:
//   - claude: Claude API (ANTHROPIC_API_KEY, model VOCAB_SUGGEST_MODEL), trả phí theo lượng dùng
//   - gemini: Google Gemini API (GEMINI_API_KEY, model GEMINI_MODEL), có gói miễn phí giới hạn tần suất
// Mỗi tính năng tự lo prompt + schema; client chỉ gửi yêu cầu và trả JSON đúng schema.

const (
	DefaultSuggestModel = "claude-opus-5-5"
	DefaultGeminiModel  = "gemini-3.5-flash-lite"
	geminiBaseURL       = "https://generativelanguage.googleapis.com/v1beta"
	aiRequestTimeout    = 60 * time.Second
)

// AIJSONRequest — 1 yêu cầu sinh JSON. Schema viết theo JSON Schema (kiểu chữ thường, additionalProperties:false);
// client Gemini tự chuyển sang dạng OpenAPI của Gemini.
type AIJSONRequest struct {
	System    string
	User      string
	Schema    map[string]any
	MaxTokens int64
}

// AIClient — 1 nhà cung cấp AI trả về chuỗi JSON đúng schema. Lỗi luôn là *aiError (lý do dễ hiểu) hoặc lỗi ctx.
type AIClient interface {
	GenerateJSON(ctx context.Context, req AIJSONRequest) (string, error)
}

// aiError — lỗi AI kèm lý do dễ hiểu cho người dùng (không lộ chi tiết kỹ thuật / key)
type aiError struct {
	reason string
	cause  error
}

func (e *aiError) Error() string { return e.reason + ": " + e.cause.Error() }
func (e *aiError) Unwrap() error { return e.cause }

// Lý do khi nhà cung cấp AI từ chối vì vượt tần suất / hết hạn mức — gọi tiếp ngay cũng vô ích (xem isAIRateLimited)
const (
	claudeRateLimitedReason = "vượt giới hạn tần suất gọi AI, thử lại sau ít phút"
	geminiQuotaReason       = "đã dùng hết hạn mức miễn phí của Gemini (theo phút/ngày), thử lại sau"
)

// isAIRateLimited — lỗi AI do vượt tần suất / hết hạn mức (HTTP 429)
func isAIRateLimited(err error) bool {
	reason := aiErrorReason(err)
	return reason == claudeRateLimitedReason || reason == geminiQuotaReason
}

// aiErrorReason — lý do hiển thị của 1 lỗi từ AIClient
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

func errAIRefused(cause error) error {
	return &aiError{reason: "AI từ chối trả lời nội dung này", cause: cause}
}

func errAIBadFormat(cause error) error {
	return &aiError{reason: "AI trả kết quả không đúng định dạng", cause: cause}
}

// ===== Claude =====

type claudeClient struct {
	client *anthropic.Client
	model  string
}

func NewClaudeClient(client *anthropic.Client, model string) AIClient {
	if model == "" {
		model = DefaultSuggestModel
	}
	return &claudeClient{client: client, model: model}
}

func (c *claudeClient) GenerateJSON(ctx context.Context, req AIJSONRequest) (string, error) {
	ctx, cancel := context.WithTimeout(ctx, aiRequestTimeout)
	defer cancel()
	resp, err := c.client.Beta.Messages.New(ctx, anthropic.BetaMessageNewParams{
		Model:     c.model,
		MaxTokens: req.MaxTokens,
		System:    []anthropic.BetaTextBlockParam{{Text: req.System}},
		Messages:  []anthropic.BetaMessageParam{anthropic.NewBetaUserMessage(anthropic.NewBetaTextBlock(req.User))},
		OutputConfig: anthropic.BetaOutputConfigParam{
			Effort: anthropic.BetaOutputConfigEffortLow, // tra cứu / phân tích ngắn — không cần suy luận sâu
			Format: anthropic.BetaJSONOutputFormatParam{Schema: req.Schema},
		},
		// Bị bộ lọc an toàn từ chối thì server tự chuyển sang model dự phòng phù hợp
		Fallbacks: anthropic.BetaFallbacksParamUnion{OfDefault: constant.ValueOf[constant.Default]()},
		Betas:     []anthropic.AnthropicBeta{anthropic.AnthropicBetaServerSideFallback2026_07_01},
	})
	if err != nil {
		return "", &aiError{reason: claudeErrorReason(err), cause: err}
	}
	switch resp.StopReason {
	case anthropic.BetaStopReasonRefusal:
		return "", errAIRefused(errors.New("refusal"))
	case anthropic.BetaStopReasonMaxTokens:
		return "", &aiError{reason: "AI trả lời bị cắt giữa chừng, thử lại sau", cause: errors.New("max_tokens")}
	}
	var text strings.Builder
	for _, block := range resp.Content {
		if b, ok := block.AsAny().(anthropic.BetaTextBlock); ok {
			text.WriteString(b.Text)
		}
	}
	return text.String(), nil
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
		return claudeRateLimitedReason
	case apiErr.StatusCode == http.StatusNotFound:
		return "model AI trong VOCAB_SUGGEST_MODEL không tồn tại"
	case apiErr.StatusCode >= 500:
		return "dịch vụ AI đang quá tải, thử lại sau"
	default:
		return fmt.Sprintf("AI trả lỗi %d", apiErr.StatusCode)
	}
}

// ===== Gemini (REST generateContent + responseSchema) =====

type geminiClient struct {
	http    *http.Client
	apiKey  string
	model   string
	baseURL string
}

func NewGeminiClient(apiKey, model string) AIClient {
	// Chấp nhận cả dạng "models/gemini-..." như trong docs/ListModels
	model = strings.TrimPrefix(strings.TrimSpace(model), "models/")
	if model == "" {
		model = DefaultGeminiModel
	}
	return &geminiClient{http: &http.Client{}, apiKey: strings.TrimSpace(apiKey), model: model, baseURL: geminiBaseURL}
}

// toGeminiSchema chuyển JSON Schema sang responseSchema của Gemini (tập con OpenAPI): kiểu viết hoa, bỏ
// additionalProperties, thêm propertyOrdering theo thứ tự "required" để JSON trả về giữ thứ tự trường
func toGeminiSchema(s map[string]any) map[string]any {
	out := make(map[string]any, len(s))
	for k, v := range s {
		switch k {
		case "additionalProperties":
		case "type":
			if t, ok := v.(string); ok {
				out[k] = strings.ToUpper(t)
			} else {
				out[k] = v
			}
		case "properties":
			props := map[string]any{}
			if m, ok := v.(map[string]any); ok {
				for name, p := range m {
					if pm, ok := p.(map[string]any); ok {
						props[name] = toGeminiSchema(pm)
					}
				}
			}
			out[k] = props
		case "items":
			if m, ok := v.(map[string]any); ok {
				out[k] = toGeminiSchema(m)
			} else {
				out[k] = v
			}
		default:
			out[k] = v
		}
	}
	if req, ok := s["required"]; ok {
		out["propertyOrdering"] = req
	}
	return out
}

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

func (g *geminiClient) GenerateJSON(ctx context.Context, req AIJSONRequest) (string, error) {
	ctx, cancel := context.WithTimeout(ctx, aiRequestTimeout)
	defer cancel()
	body, err := json.Marshal(map[string]any{
		"systemInstruction": map[string]any{"parts": []map[string]string{{"text": req.System}}},
		"contents":          []map[string]any{{"role": "user", "parts": []map[string]string{{"text": req.User}}}},
		"generationConfig": map[string]any{
			"responseMimeType": "application/json",
			"responseSchema":   toGeminiSchema(req.Schema),
		},
	})
	if err != nil {
		return "", err
	}
	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, fmt.Sprintf("%s/models/%s:generateContent", g.baseURL, g.model), bytes.NewReader(body))
	if err != nil {
		return "", err
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("x-goog-api-key", g.apiKey) // header thay vì ?key= — key không lọt vào log URL
	resp, err := g.http.Do(httpReq)
	if err != nil {
		return "", &aiError{reason: aiErrorReason(err), cause: err}
	}
	defer resp.Body.Close()
	raw, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if err != nil {
		return "", &aiError{reason: aiErrorReason(err), cause: err}
	}
	var gr geminiResponse
	if err := json.Unmarshal(raw, &gr); err != nil && resp.StatusCode == http.StatusOK {
		return "", errAIBadFormat(err)
	}

	if resp.StatusCode != http.StatusOK {
		cause := fmt.Errorf("gemini HTTP %d %s: %s", resp.StatusCode, gr.Error.Status, gr.Error.Message)
		return "", &aiError{reason: geminiErrorReason(resp.StatusCode, gr.Error.Status, gr.Error.Message), cause: cause}
	}
	if gr.PromptFeedback.BlockReason != "" {
		return "", errAIRefused(errors.New("blocked: " + gr.PromptFeedback.BlockReason))
	}
	if len(gr.Candidates) == 0 {
		return "", &aiError{reason: "AI không trả kết quả", cause: fmt.Errorf("empty candidates: %s", raw)}
	}
	switch fr := gr.Candidates[0].FinishReason; fr {
	case "", "STOP":
	case "MAX_TOKENS":
		return "", &aiError{reason: "AI trả lời bị cắt giữa chừng, thử lại sau", cause: errors.New("finishReason " + fr)}
	default: // SAFETY, RECITATION, PROHIBITED_CONTENT, BLOCKLIST...
		return "", errAIRefused(errors.New("finishReason " + fr))
	}
	var text strings.Builder
	for _, p := range gr.Candidates[0].Content.Parts {
		text.WriteString(p.Text)
	}
	return text.String(), nil
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
		return geminiQuotaReason
	case code == http.StatusNotFound:
		return "model AI trong GEMINI_MODEL không tồn tại"
	case code >= 500:
		return "dịch vụ AI đang quá tải, thử lại sau"
	default:
		return fmt.Sprintf("AI trả lỗi %d", code)
	}
}
