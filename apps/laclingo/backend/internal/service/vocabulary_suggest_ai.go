package service

import (
	"context"
	"encoding/json"
	"fmt"
	"maps"
	"slices"
	"strings"
	"unicode/utf8"
)

// Phần AI của "Gợi ý tự động" khi admin thêm từ: prompt + schema + lọc kết quả. Gọi AI qua AIClient (ai_client.go).

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
Given a word or short phrase in the target language, return the entry for its most common everyday sense (use the dictionary senses, when given, to pick it).
When a topic is given, use the sense the word has in that topic instead (e.g. "bus" in a computing topic is a data bus, not a vehicle), and make the example sentence fit the topic.
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
func suggestUserPrompt(languageID, term, topic string, senses []string) string {
	lang, ok := suggestLanguageNames[languageID]
	if !ok {
		lang = languageID
	}
	var b strings.Builder
	fmt.Fprintf(&b, "Target language: %s\nWord: %s\n", lang, term)
	if topic != "" {
		fmt.Fprintf(&b, "Topic: %s\n", topic)
	}
	if len(senses) > 0 {
		b.WriteString("Dictionary senses (English):\n- " + strings.Join(senses, "\n- ") + "\n")
	}
	return b.String()
}

// parseAISuggestion đọc JSON AI trả về và bỏ giá trị không hợp lệ
func parseAISuggestion(text string) (aiSuggestion, error) {
	var ai aiSuggestion
	if err := json.Unmarshal([]byte(strings.TrimSpace(text)), &ai); err != nil {
		return aiSuggestion{}, errAIBadFormat(err)
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

var suggestionSchema = func() map[string]any {
	props := map[string]any{}
	for _, f := range suggestFields {
		props[f] = map[string]any{"type": "string"}
	}
	props["part_of_speech"] = map[string]any{"type": "string", "enum": suggestPartsOfSpeechEnum}
	props["level"] = map[string]any{"type": "string", "enum": suggestLevelsEnum}
	return map[string]any{"type": "object", "properties": props, "required": suggestFields, "additionalProperties": false}
}()

// askSuggestAI — hỏi AI các ô của 1 từ; topic: chủ đề (có thể rỗng); senses: nghĩa tiếng Anh từ từ điển (có thể rỗng) làm ngữ cảnh
func askSuggestAI(ctx context.Context, ai AIClient, languageID, term, topic string, senses []string) (aiSuggestion, error) {
	text, err := ai.GenerateJSON(ctx, AIJSONRequest{
		System: suggestSystemPrompt, User: suggestUserPrompt(languageID, term, topic, senses), Schema: suggestionSchema, MaxTokens: 2048,
	})
	if err != nil {
		return aiSuggestion{}, err
	}
	return parseAISuggestion(text)
}
