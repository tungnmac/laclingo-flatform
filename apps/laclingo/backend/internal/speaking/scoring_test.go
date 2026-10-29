package speaking

import (
	"slices"
	"testing"
)

func TestTokenize(t *testing.T) {
	cases := map[string][]string{
		"I'm a full-stack developer.":     {"i", "am", "a", "full", "stack", "developer"},
		"I’ve worked 3 years with React!": {"i", "have", "worked", "three", "years", "with", "react"},
		"The team's API, 25 endpoints":    {"the", "teams", "api", "twenty", "five", "endpoints"},
		"Don't   worry —  CI/CD":          {"do", "not", "worry", "ci", "cd"},
		"by 40% faster":                   {"by", "forty", "percent", "faster"},
	}
	for in, want := range cases {
		if got := Tokenize(in, "en"); !slices.Equal(got, want) {
			t.Errorf("Tokenize(%q) = %v, muốn %v", in, got, want)
		}
	}
}

func TestScoreRepeat(t *testing.T) {
	exp := "I have three years of experience with React."
	if fb := ScoreRepeat(exp, "i have 3 years of experience with react", "en", 0); fb.Score != 100 || slices.ContainsFunc(fb.Words, func(w WordResult) bool { return !w.Matched }) {
		t.Errorf("nói đúng hết (số viết bằng chữ số) phải 100 điểm, nhận %+v", fb)
	}
	fb := ScoreRepeat(exp, "I have three years experience with React", "en", 0)
	if fb.Score >= 100 || fb.Score < 85 {
		t.Errorf("thiếu 1 từ: điểm %d", fb.Score)
	}
	for _, w := range fb.Words {
		if (w.Word == "of") == w.Matched {
			t.Errorf("chỉ từ 'of' bị đánh dấu thiếu, nhận %+v", fb.Words)
		}
	}
	if !slices.Contains(fb.Tips, TipMissedWords) {
		t.Errorf("thiếu từ phải có gợi ý missed_words: %v", fb.Tips)
	}
	if fb := ScoreRepeat(exp, "", "en", 0); fb.Score != 0 {
		t.Errorf("không nói gì phải 0 điểm, nhận %d", fb.Score)
	}
	if fb := ScoreRepeat("I'm ready.", "I am ready", "en", 0); fb.Score != 100 || len(fb.Words) != 2 {
		t.Errorf("'I'm' = 'I am', hiển thị giữ 2 từ gốc: %+v", fb)
	}
	// Nói thừa nhiều từ bị trừ điểm
	if fb := ScoreRepeat("I like Go.", "um I really really like the Go language a lot", "en", 0); fb.Score > 60 || fb.FillerCount != 1 {
		t.Errorf("nói thừa nhiều từ phải bị trừ: %+v", fb)
	}
}

func TestScoreAnswer(t *testing.T) {
	kw := []string{"REST|RESTful", "GraphQL", "endpoint", "over-fetching|overfetching"}
	good := "REST uses multiple endpoints with fixed responses while GraphQL exposes a single endpoint " +
		"where the client asks for exactly the fields it needs so it avoids over fetching and under fetching of data"
	fb := ScoreAnswer(good, kw, "en", 20000)
	if fb.Score != 100 || len(fb.KeywordsMissed) != 0 {
		t.Errorf("trả lời đủ ý + đủ dài phải 100 điểm: %+v", fb)
	}
	if fb.WordsPerMinute == 0 {
		t.Errorf("có thời lượng phải tính WPM: %+v", fb)
	}

	short := ScoreAnswer("um GraphQL is better uh", kw, "en", 0)
	if short.Score >= 40 || !slices.Contains(short.Tips, TipTooShort) || !slices.Contains(short.Tips, TipFillers) || !slices.Contains(short.Tips, TipMissedKeywords) {
		t.Errorf("trả lời ngắn, thiếu ý, có từ đệm: %+v", short)
	}
	if !slices.Equal(short.KeywordsHit, []string{"GraphQL"}) {
		t.Errorf("chỉ nhắc tới GraphQL: %v", short.KeywordsHit)
	}

	if fb := ScoreAnswer("", kw, "en", 0); fb.Score != 0 || len(fb.KeywordsMissed) != len(kw) {
		t.Errorf("không nói gì: %+v", fb)
	}
	// Không có từ khoá → chấm hoàn toàn theo độ dài
	if fb := ScoreAnswer("I am a backend developer who loves clean code", nil, "en", 0); fb.Score != 36 {
		t.Errorf("9 từ / 25 → 36 điểm, nhận %d", fb.Score)
	}
}

func TestNumbersAndNonEnglish(t *testing.T) {
	cases := map[string][]string{
		"in 2024 we shipped":     {"in", "twenty", "twenty", "four", "we", "shipped"},
		"100 users":              {"one", "hundred", "users"},
		"1999 and 2005 and 1900": {"nineteen", "ninety", "nine", "and", "two", "thousand", "five", "and", "nineteen", "hundred"},
		"version 12345":          {"version", "12345"},
	}
	for in, want := range cases {
		if got := Tokenize(in, "en"); !slices.Equal(got, want) {
			t.Errorf("Tokenize(%q) = %v, muốn %v", in, got, want)
		}
	}
	if got := Tokenize("Étudiant à Paris", "fr"); !slices.Equal(got, []string{"étudiant", "à", "paris"}) {
		t.Errorf("giữ chữ có dấu: %v", got)
	}
	if fb := ScoreRepeat("我有三年的经验。", "我有三年的经验", "zh", 0); fb.Score != 100 || len(fb.Words) != 7 {
		t.Errorf("tiếng Trung nói đúng phải 100 điểm, tô theo từng chữ: %+v", fb)
	}
	if fb := ScoreRepeat("我有三年的经验", "我有两年的经验", "zh", 0); fb.Score >= 100 || fb.Words[2].Matched {
		t.Errorf("sai 1 chữ (三→两) phải bị đánh dấu: %+v", fb)
	}
}

func TestShortWordsAreNotPlurals(t *testing.T) {
	if fb := ScoreRepeat("I have a car", "is have as car", "en", 0); fb.Score == 100 {
		t.Errorf("'is'≠'i', 'as'≠'a' — không được 100 điểm: %+v", fb)
	}
	if fb := ScoreRepeat("I build APIs", "I build API", "en", 0); fb.Score != 100 {
		t.Errorf("'API' = 'APIs' (từ ≥ 3 ký tự): %+v", fb)
	}
}
