// Package speaking chấm điểm bài luyện nói theo quy tắc, từ transcript mà
// trình duyệt nhận diện được (Web Speech API) — không dùng AI.
//   - repeat: nhắc lại 1 câu mẫu → khớp từng từ theo LCS
//   - answer: trả lời 1 câu hỏi → từ khoá/ý chính đã nhắc tới + độ dài + từ đệm
package speaking

import (
	"math"
	"strconv"
	"strings"
	"unicode"
)

const (
	answerTargetWords = 25 // câu trả lời ngắn hơn thì bị trừ điểm độ dài
	minDurationForWPM = 2000
	slowWPM           = 90
	fastWPM           = 180
)

// Mã gợi ý — FE tự dịch theo ngôn ngữ giao diện
const (
	TipTooShort       = "too_short"
	TipFillers        = "fillers"
	TipTooSlow        = "too_slow"
	TipTooFast        = "too_fast"
	TipMissedKeywords = "missed_keywords"
	TipMissedWords    = "missed_words"
)

// WordResult — 1 từ của câu mẫu (giữ nguyên cách viết gốc) và đã nói đúng chưa
type WordResult struct {
	Word    string `json:"word"`
	Matched bool   `json:"matched"`
}

// Feedback — kết quả chấm 1 lần nói
type Feedback struct {
	Score          int          `json:"score"`                     // 0-100
	Words          []WordResult `json:"words,omitempty"`           // repeat: từng từ của câu mẫu
	KeywordsHit    []string     `json:"keywords_hit,omitempty"`    // answer
	KeywordsMissed []string     `json:"keywords_missed,omitempty"` // answer
	WordCount      int          `json:"word_count"`
	FillerCount    int          `json:"filler_count"`
	WordsPerMinute int          `json:"words_per_minute"` // 0 = không đủ dữ liệu thời gian
	Tips           []string     `json:"tips"`
}

var (
	fillers   = map[string]bool{"um": true, "umm": true, "uh": true, "uhm": true, "er": true, "erm": true, "ah": true, "hmm": true}
	ones      = []string{"zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"}
	tens      = []string{"", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"}
	expansion = map[string]string{
		"i'm": "i am", "you're": "you are", "we're": "we are", "they're": "they are", "he's": "he is", "she's": "she is",
		"it's": "it is", "that's": "that is", "there's": "there is", "what's": "what is", "let's": "let us",
		"i've": "i have", "you've": "you have", "we've": "we have", "they've": "they have",
		"i'll": "i will", "you'll": "you will", "we'll": "we will", "they'll": "they will", "it'll": "it will",
		"i'd": "i would", "you'd": "you would", "we'd": "we would", "they'd": "they would",
		"don't": "do not", "doesn't": "does not", "didn't": "did not", "can't": "can not", "cannot": "can not",
		"won't": "will not", "isn't": "is not", "aren't": "are not", "wasn't": "was not", "weren't": "were not",
		"haven't": "have not", "hasn't": "has not", "hadn't": "had not", "wouldn't": "would not",
		"shouldn't": "should not", "couldn't": "could not",
	}
)

// isCJK — chữ Hán/Kana: viết liền không cách, so khớp theo từng chữ
func isCJK(r rune) bool {
	return unicode.In(r, unicode.Han, unicode.Hiragana, unicode.Katakana)
}

// Tokenize chuẩn hoá 1 câu thành các từ so sánh được: chữ thường, bỏ dấu câu
// (giữ chữ có dấu như "é", "đ"), tách "full-stack" → "full stack", chữ Hán/Kana
// tách từng chữ. Riêng tiếng Anh (lang "en"): triển khai viết tắt ("I'm" → "i am")
// và đổi số thành chữ ("3" → "three", "2024" → "twenty twenty four") vì trình
// duyệt hay nhận ra chữ số.
func Tokenize(s, lang string) []string {
	s = strings.ToLower(strings.NewReplacer("’", "'", "‘", "'", "-", " ", "/", " ").Replace(s))
	if lang == "en" {
		s = strings.ReplaceAll(s, "%", " percent ")
	}
	var out []string
	var word []rune
	flush := func() {
		raw := strings.Trim(string(word), "'")
		word = word[:0]
		if raw == "" {
			return
		}
		if lang == "en" {
			if exp, ok := expansion[raw]; ok {
				out = append(out, strings.Fields(exp)...)
				return
			}
			if n, err := strconv.Atoi(raw); err == nil {
				if words := numberWords(n); words != nil {
					out = append(out, words...)
					return
				}
			}
		}
		out = append(out, strings.ReplaceAll(raw, "'", "")) // developer's → developers
	}
	for _, r := range s {
		switch {
		case isCJK(r):
			flush()
			out = append(out, string(r))
		case unicode.IsLetter(r) || unicode.IsDigit(r) || unicode.Is(unicode.Mn, r) || r == '\'':
			word = append(word, r)
		default:
			flush()
		}
	}
	flush()
	return out
}

// numberWords đọc số kiểu tiếng Anh; nil = không đổi (số quá lớn)
func numberWords(n int) []string {
	switch {
	case n < 0 || n > 9999:
		return nil
	case n < 20:
		return []string{ones[n]}
	case n < 100:
		if n%10 == 0 {
			return []string{tens[n/10]}
		}
		return []string{tens[n/10], ones[n%10]}
	case n < 1000:
		return append([]string{ones[n/100], "hundred"}, restWords(n%100)...)
	case n >= 1100 && n < 2000 || n >= 2010 && n < 2100:
		// Kiểu đọc năm: 1999 → nineteen ninety nine, 2024 → twenty twenty four
		if n%100 == 0 {
			return append(numberWords(n/100), "hundred")
		}
		return append(numberWords(n/100), numberWords(n%100)...)
	default:
		return append([]string{ones[n/1000], "thousand"}, restWords(n%1000)...)
	}
}

func restWords(n int) []string {
	if n == 0 {
		return nil
	}
	return numberWords(n)
}

// sameWord — coi số ít/số nhiều là 1 ("api" = "apis", lỗi nhận diện hay gặp),
// chỉ với từ gốc ≥ 3 ký tự: tránh "i"="is", "a"="as", "it"="its"
func sameWord(a, b string) bool {
	if a == b {
		return true
	}
	if len(a) > len(b) {
		a, b = b, a
	}
	return len(a) >= 3 && (a+"s" == b || a+"es" == b)
}

// ScoreRepeat chấm lần nhắc lại câu mẫu: điểm = 2·khớp / (số từ mẫu + số từ đã nói)
// — vừa trừ từ bị thiếu vừa trừ từ thừa.
func ScoreRepeat(expected, spoken, lang string, durationMs int) Feedback {
	// Từng từ hiển thị của câu mẫu → các token của nó (1 từ có thể ra 2 token: "I'm" → i am)
	display := displayUnits(expected)
	var expTokens []string
	var owner []int
	for i, w := range display {
		for _, t := range Tokenize(w, lang) {
			expTokens = append(expTokens, t)
			owner = append(owner, i)
		}
	}
	got := Tokenize(spoken, lang)
	matched := lcsMatches(expTokens, got)

	fb := Feedback{WordCount: len(got), FillerCount: countFillers(got), Tips: []string{}}
	tokenOK := make([]bool, len(display))
	for i := range tokenOK {
		tokenOK[i] = true
	}
	hasToken := make([]bool, len(display))
	m := 0
	for i, ok := range matched {
		hasToken[owner[i]] = true
		if ok {
			m++
		} else {
			tokenOK[owner[i]] = false
		}
	}
	missed := false
	for i, w := range display {
		ok := hasToken[i] && tokenOK[i]
		if !hasToken[i] { // chỉ là dấu câu — không tính
			ok = true
		}
		missed = missed || !ok
		fb.Words = append(fb.Words, WordResult{Word: w, Matched: ok})
	}
	if denom := len(expTokens) + len(got); denom > 0 {
		fb.Score = int(math.Round(200 * float64(m) / float64(denom)))
	}
	fb.WordsPerMinute = wpm(len(got), durationMs)
	if missed {
		fb.Tips = append(fb.Tips, TipMissedWords)
	}
	fb.Tips = append(fb.Tips, paceTips(fb)...)
	return fb
}

// ScoreAnswer chấm câu trả lời tự do: 70% từ khoá/ý chính đã nhắc tới (không có
// từ khoá thì tính hết theo độ dài) + 30% độ dài (đủ answerTargetWords từ), trừ
// tối đa 15 điểm vì từ đệm. Từ khoá "REST|RESTful" = nói 1 trong các cách là được.
func ScoreAnswer(spoken string, keywords []string, lang string, durationMs int) Feedback {
	got := Tokenize(spoken, lang)
	fb := Feedback{WordCount: len(got), FillerCount: countFillers(got), Tips: []string{}}
	if len(got) == 0 {
		fb.Tips = append(fb.Tips, TipTooShort)
		fb.KeywordsMissed = keywords
		return fb
	}
	for _, kw := range keywords {
		if keywordSpoken(kw, got, lang) {
			fb.KeywordsHit = append(fb.KeywordsHit, kw)
		} else {
			fb.KeywordsMissed = append(fb.KeywordsMissed, kw)
		}
	}
	lengthFactor := math.Min(1, float64(len(got)-fb.FillerCount)/answerTargetWords)
	score := 100 * lengthFactor
	if len(keywords) > 0 {
		score = 70*float64(len(fb.KeywordsHit))/float64(len(keywords)) + 30*lengthFactor
	}
	score -= math.Min(15, float64(3*fb.FillerCount))
	fb.Score = clamp(int(math.Round(score)))
	fb.WordsPerMinute = wpm(len(got), durationMs)
	if lengthFactor < 1 {
		fb.Tips = append(fb.Tips, TipTooShort)
	}
	if len(fb.KeywordsMissed) > 0 {
		fb.Tips = append(fb.Tips, TipMissedKeywords)
	}
	fb.Tips = append(fb.Tips, paceTips(fb)...)
	return fb
}

func keywordSpoken(keyword string, got []string, lang string) bool {
	for _, alt := range strings.Split(keyword, "|") {
		want := Tokenize(alt, lang)
		if len(want) == 0 || len(want) > len(got) {
			continue
		}
		for i := 0; i+len(want) <= len(got); i++ {
			ok := true
			for j, w := range want {
				if !sameWord(w, got[i+j]) {
					ok = false
					break
				}
			}
			if ok {
				return true
			}
		}
	}
	return false
}

// displayUnits tách câu mẫu thành các đơn vị hiển thị (tô xanh/đỏ): theo khoảng
// trắng, riêng chữ Hán/Kana thì từng chữ (dấu câu dính kèm chữ đứng trước)
func displayUnits(s string) []string {
	var units []string
	for _, field := range strings.Fields(s) {
		var cur []rune
		for _, r := range field {
			if isCJK(r) && len(cur) > 0 {
				units = append(units, string(cur))
				cur = cur[:0]
			}
			cur = append(cur, r)
		}
		if len(cur) > 0 {
			units = append(units, string(cur))
		}
	}
	return units
}

// lcsMatches đánh dấu từng token của exp có nằm trong dãy con chung dài nhất với got không
func lcsMatches(exp, got []string) []bool {
	n, m := len(exp), len(got)
	dp := make([][]int, n+1)
	for i := range dp {
		dp[i] = make([]int, m+1)
	}
	for i := n - 1; i >= 0; i-- {
		for j := m - 1; j >= 0; j-- {
			if sameWord(exp[i], got[j]) {
				dp[i][j] = dp[i+1][j+1] + 1
			} else {
				dp[i][j] = max(dp[i+1][j], dp[i][j+1])
			}
		}
	}
	matched := make([]bool, n)
	for i, j := 0, 0; i < n && j < m; {
		switch {
		case sameWord(exp[i], got[j]):
			matched[i] = true
			i, j = i+1, j+1
		case dp[i+1][j] >= dp[i][j+1]:
			i++
		default:
			j++
		}
	}
	return matched
}

func countFillers(tokens []string) int {
	n := 0
	for _, t := range tokens {
		if fillers[t] {
			n++
		}
	}
	return n
}

func wpm(words, durationMs int) int {
	if durationMs < minDurationForWPM || words == 0 {
		return 0
	}
	return int(math.Round(float64(words) * 60000 / float64(durationMs)))
}

func paceTips(fb Feedback) []string {
	var tips []string
	if fb.FillerCount > 0 {
		tips = append(tips, TipFillers)
	}
	switch {
	case fb.WordsPerMinute == 0:
	case fb.WordsPerMinute < slowWPM:
		tips = append(tips, TipTooSlow)
	case fb.WordsPerMinute > fastWPM:
		tips = append(tips, TipTooFast)
	}
	return tips
}

func clamp(n int) int { return max(0, min(100, n)) }
