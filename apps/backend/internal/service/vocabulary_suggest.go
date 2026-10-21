package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"
	"unicode/utf8"
)

// Gợi ý tự động khi admin thêm từ: phiên âm + audio thật từ Free Dictionary API
// (tiếng Anh, miễn phí, không cần key) và nghĩa tiếng Việt, câu ví dụ + nghĩa câu,
// từ loại, trình độ, emoji từ AI (Claude hoặc Gemini — xem vocabulary_suggest_ai.go). Chỉ GỢI Ý — admin
// duyệt/sửa trên form rồi mới lưu, không tự ghi vào DB.

const (
	freeDictionaryURL       = "https://api.dictionaryapi.dev/api/v2/entries/en/"
	suggestDictTimeout      = 5 * time.Second
	suggestAITimeout        = 60 * time.Second
	maxSuggestTermLen       = 100
	maxDictionaryHintSenses = 6
	// Cache kết quả theo (ngôn ngữ, từ): admin bấm gợi ý lại cùng 1 từ không tốn thêm lần gọi AI
	suggestCacheTTL  = 24 * time.Hour
	suggestCacheSize = 1000
)

// ErrSuggestAIFailed — có cấu hình AI nhưng gọi lỗi (key sai/hết hạn, quá tải, timeout...) và từ
// điển cũng không có gì: lỗi phía hệ thống, KHÔNG phải "từ không tồn tại" (handler trả 502)
var ErrSuggestAIFailed = errors.New("dịch vụ AI gợi ý đang lỗi")

// VocabularySuggestion — các ô gợi ý điền sẵn vào form thêm từ
type VocabularySuggestion struct {
	Term           string `json:"term" example:"deploy"`
	Phonetic       string `json:"phonetic,omitempty" example:"dɪˈplɔɪ"`
	AudioURL       string `json:"audio_url,omitempty"`
	Meaning        string `json:"meaning,omitempty" example:"triển khai"`
	PartOfSpeech   string `json:"part_of_speech,omitempty" example:"verb"`
	Example        string `json:"example,omitempty"`
	ExampleMeaning string `json:"example_meaning,omitempty"`
	Level          string `json:"level,omitempty" example:"B1"`
	ImageEmoji     string `json:"image_emoji,omitempty" example:"🚀"`
	// Nguồn đã dùng: "dictionary" (Free Dictionary API), "ai" (Claude/Gemini)
	Sources []string `json:"sources"`
	// Server đã cấu hình AI chưa — false thì chỉ có phần từ điển (phiên âm/audio).
	// Sources rỗng = không tìm được gì (từ điển không có từ và AI chưa cấu hình)
	AIAvailable bool `json:"ai_available"`
	// AI có cấu hình nhưng lần này lỗi (vd hết credit) — vẫn trả phần từ điển, kèm lý do để admin biết
	AIError string `json:"ai_error,omitempty"`
}

type VocabularySuggestRequest struct {
	LanguageID string `json:"language_id" example:"en"`
	Term       string `json:"term" example:"deploy"`
}

type VocabularySuggester struct {
	http    *http.Client
	dictURL string
	ai      SuggestAI // nil = chưa cấu hình key AI nào

	mu    sync.Mutex
	cache map[string]cachedSuggestion
}

type cachedSuggestion struct {
	value   VocabularySuggestion
	expires time.Time
}

// NewVocabularySuggester — ai nil khi chưa có API key (chỉ gợi ý phần từ điển)
func NewVocabularySuggester(ai SuggestAI) *VocabularySuggester {
	return &VocabularySuggester{http: &http.Client{}, dictURL: freeDictionaryURL, ai: ai, cache: map[string]cachedSuggestion{}}
}

func (s *VocabularySuggester) Suggest(ctx context.Context, req VocabularySuggestRequest) (VocabularySuggestion, error) {
	term := strings.TrimSpace(req.Term)
	if req.LanguageID == "" || term == "" || utf8.RuneCountInString(term) > maxSuggestTermLen {
		return VocabularySuggestion{}, ErrInvalidInput
	}
	cacheKey := req.LanguageID + "\x00" + strings.ToLower(term)
	if cached, ok := s.cached(cacheKey); ok {
		cached.Term = term
		return cached, nil
	}
	out := VocabularySuggestion{Term: term, Sources: []string{}, AIAvailable: s.ai != nil}
	aiFailed := false

	// Tra từ điển trước (chỉ tiếng Anh) rồi mới hỏi AI: AI nhận các nghĩa tiếng Anh
	// từ từ điển làm ngữ cảnh để chọn đúng nghĩa thông dụng của từ đa nghĩa.
	var dict dictionaryEntry
	var dictOK bool
	if req.LanguageID == "en" {
		var err error
		dict, dictOK, err = s.lookupDictionary(ctx, term)
		if err != nil {
			log.Printf("⚠️  vocab suggest: Free Dictionary %q: %v", term, err)
		}
	}
	if dictOK {
		out.Phonetic, out.AudioURL, out.PartOfSpeech = dict.phonetic, dict.audioURL, dict.partOfSpeech
		out.Sources = append(out.Sources, "dictionary")
	}

	if s.ai != nil {
		ai, err := s.ai.Suggest(ctx, req.LanguageID, term, dict.senses)
		if err != nil {
			log.Printf("❌ vocab suggest: AI %q: %v", term, err)
			aiFailed = true
			out.AIError = aiErrorReason(err)
		} else {
			out.Meaning, out.Example, out.ExampleMeaning = ai.Meaning, ai.Example, ai.ExampleMeaning
			out.Level, out.ImageEmoji = ai.Level, ai.ImageEmoji
			if out.Phonetic == "" { // tiếng Trung: pinyin; tiếng Anh từ điển không có: IPA của AI
				out.Phonetic = ai.Phonetic
			}
			// Từ loại theo nghĩa AI đã chọn (từ đa nghĩa: từ điển chỉ trả loại của nghĩa đầu tiên)
			if ai.PartOfSpeech != "" {
				out.PartOfSpeech = ai.PartOfSpeech
			}
			out.Sources = append(out.Sources, "ai")
		}
	}
	if aiFailed && !dictOK {
		return VocabularySuggestion{}, fmt.Errorf("%w: %s", ErrSuggestAIFailed, out.AIError)
	}
	// Không lưu cache khi AI lỗi (lần sau thử lại được) hoặc không tìm được gì
	if !aiFailed && len(out.Sources) > 0 {
		s.store(cacheKey, out)
	}
	return out, nil
}

func (s *VocabularySuggester) cached(key string) (VocabularySuggestion, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	c, ok := s.cache[key]
	if !ok || time.Now().After(c.expires) {
		return VocabularySuggestion{}, false
	}
	return c.value, true
}

func (s *VocabularySuggester) store(key string, v VocabularySuggestion) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if len(s.cache) >= suggestCacheSize {
		clear(s.cache) // đơn giản: đầy thì làm mới toàn bộ (chỉ là cache tiết kiệm chi phí)
	}
	s.cache[key] = cachedSuggestion{value: v, expires: time.Now().Add(suggestCacheTTL)}
}

// ===== Free Dictionary API =====

type dictionaryEntry struct {
	phonetic     string
	audioURL     string
	partOfSpeech string
	senses       []string // "noun: definition" — gợi ý ngữ cảnh cho AI
}

type freeDictResponse []struct {
	Phonetic  string `json:"phonetic"`
	Phonetics []struct {
		Text  string `json:"text"`
		Audio string `json:"audio"`
	} `json:"phonetics"`
	Meanings []struct {
		PartOfSpeech string `json:"partOfSpeech"`
		Definitions  []struct {
			Definition string `json:"definition"`
		} `json:"definitions"`
	} `json:"meanings"`
}

var dictPartsOfSpeech = map[string]string{
	"noun": "noun", "verb": "verb", "adjective": "adj", "adverb": "adv", "pronoun": "pron",
	"preposition": "prep", "conjunction": "conj", "interjection": "interj", "determiner": "det", "numeral": "num",
}

// lookupDictionary — ok=false khi từ điển không có từ này (404) hoặc lỗi mạng
func (s *VocabularySuggester) lookupDictionary(ctx context.Context, term string) (dictionaryEntry, bool, error) {
	ctx, cancel := context.WithTimeout(ctx, suggestDictTimeout)
	defer cancel()
	httpReq, err := http.NewRequestWithContext(ctx, http.MethodGet, s.dictURL+url.PathEscape(strings.ToLower(term)), nil)
	if err != nil {
		return dictionaryEntry{}, false, err
	}
	resp, err := s.http.Do(httpReq)
	if err != nil {
		return dictionaryEntry{}, false, err
	}
	defer resp.Body.Close()
	if resp.StatusCode == http.StatusNotFound {
		return dictionaryEntry{}, false, nil
	}
	if resp.StatusCode != http.StatusOK {
		return dictionaryEntry{}, false, fmt.Errorf("HTTP %d", resp.StatusCode)
	}
	var entries freeDictResponse
	if err := json.NewDecoder(resp.Body).Decode(&entries); err != nil {
		return dictionaryEntry{}, false, err
	}

	var e dictionaryEntry
	// Từ loại = loại có NHIỀU nghĩa nhất (hoà thì loại xuất hiện trước) — từ điển hay
	// liệt kê danh từ trước dù từ chủ yếu là động từ (vd "deploy": 1 nghĩa noun, 3 nghĩa verb)
	defsByPOS := map[string]int{}
	var posOrder []string
	for _, entry := range entries {
		if e.phonetic == "" {
			e.phonetic = entry.Phonetic
		}
		for _, p := range entry.Phonetics {
			if e.phonetic == "" && p.Text != "" {
				e.phonetic = p.Text
			}
			// Ưu tiên giọng Mỹ (khớp giọng en-US đọc tự động trong app)
			if p.Audio != "" && (e.audioURL == "" || strings.Contains(p.Audio, "-us.")) && strings.HasPrefix(p.Audio, "https://") {
				e.audioURL = p.Audio
			}
		}
		for _, m := range entry.Meanings {
			if pos := dictPartsOfSpeech[m.PartOfSpeech]; pos != "" {
				if _, seen := defsByPOS[pos]; !seen {
					posOrder = append(posOrder, pos)
				}
				defsByPOS[pos] += len(m.Definitions)
			}
			for _, d := range m.Definitions {
				if len(e.senses) < maxDictionaryHintSenses {
					e.senses = append(e.senses, m.PartOfSpeech+": "+d.Definition)
				}
			}
		}
	}
	for _, pos := range posOrder {
		if e.partOfSpeech == "" || defsByPOS[pos] > defsByPOS[e.partOfSpeech] {
			e.partOfSpeech = pos
		}
	}
	e.phonetic = strings.Trim(e.phonetic, "/[] ") // app tự hiện trong /.../
	return e, e.phonetic != "" || e.audioURL != "" || len(e.senses) > 0, nil
}
