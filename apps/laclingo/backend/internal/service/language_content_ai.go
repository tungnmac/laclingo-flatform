package service

import (
	"context"
	"encoding/json"
	"fmt"
	"strconv"
	"strings"
	"unicode/utf8"

	"laclingo-backend/internal/repository/db"
)

// Phần AI của LanguageContentService: dựng từ ở ngôn ngữ mới cùng nghĩa với các từ của 1 chủ đề nguồn.

const deriveSystemPrompt = `You build vocabulary flashcards for LacLingo, an app where Vietnamese learners study foreign languages.
You get words from one topic in a source language, each with its Vietnamese meaning. For every item, give the single most common everyday word or short phrase in the target language with that same meaning, as used in the topic.
- id: copy the item's id.
- term: the word in the target language, in its usual native script and dictionary form (German nouns keep der/die/das).
- phonetic: pronunciation guide — for Latin-script languages the IPA without slashes; otherwise the standard romanization (Japanese: kana reading then romaji, e.g. "かぞく (kazoku)"; Korean: Revised Romanization; Chinese: pinyin with tone marks).
- meaning: short natural Vietnamese meaning as shown on a flashcard — no explanations.
- part_of_speech: one of the allowed codes for the term.
- example: one short natural sentence in the target language (max 15 words) using the term, simple enough for a beginner.
- example_meaning: a natural Vietnamese translation of the example.
Return exactly one entry per input item.`

var deriveFields = []string{"id", "term", "phonetic", "meaning", "part_of_speech", "example", "example_meaning"}

var deriveSchema = func() map[string]any {
	props := map[string]any{}
	for _, f := range deriveFields {
		props[f] = map[string]any{"type": "string"}
	}
	props["part_of_speech"] = map[string]any{"type": "string", "enum": suggestPartsOfSpeechEnum}
	item := map[string]any{"type": "object", "properties": props, "required": deriveFields, "additionalProperties": false}
	return map[string]any{
		"type":                 "object",
		"properties":           map[string]any{"items": map[string]any{"type": "array", "items": item}},
		"required":             []string{"items"},
		"additionalProperties": false,
	}
}()

type derivedEntry struct {
	ID             string `json:"id"`
	Term           string `json:"term"`
	Phonetic       string `json:"phonetic"`
	Meaning        string `json:"meaning"`
	PartOfSpeech   string `json:"part_of_speech"`
	Example        string `json:"example"`
	ExampleMeaning string `json:"example_meaning"`
}

func deriveUserPrompt(source, target db.Language, topic string, words []db.ListTopicSourceWordsRow) string {
	var b strings.Builder
	fmt.Fprintf(&b, "Source language: %s\nTarget language: %s\nTopic (Vietnamese): %s\nItems (id | source word | Vietnamese meaning | part of speech):\n",
		languageEnglishName(source.ID, source.Name), languageEnglishName(target.ID, target.Name), topic)
	for i, w := range words {
		fmt.Fprintf(&b, "%d | %s | %s | %s\n", i, w.Term, w.Meaning, w.PartOfSpeech.String)
	}
	return b.String()
}

// parseDerivedEntries — kết quả xếp đúng thứ tự words (theo id); mục thiếu / không hợp lệ để Term rỗng
func parseDerivedEntries(text string, n int) ([]derivedEntry, error) {
	var out struct {
		Items []derivedEntry `json:"items"`
	}
	if err := json.Unmarshal([]byte(strings.TrimSpace(text)), &out); err != nil {
		return nil, errAIBadFormat(err)
	}
	entries := make([]derivedEntry, n)
	for _, e := range out.Items {
		i, err := strconv.Atoi(strings.TrimSpace(e.ID))
		if err != nil || i < 0 || i >= n {
			continue
		}
		e.Term, e.Meaning = strings.TrimSpace(e.Term), strings.TrimSpace(e.Meaning)
		if e.Term == "" || e.Meaning == "" || utf8.RuneCountInString(e.Term) > maxSuggestTermLen {
			continue
		}
		if !partsOfSpeech[e.PartOfSpeech] {
			e.PartOfSpeech = ""
		}
		if utf8.RuneCountInString(e.Phonetic) > 255 { // = vocabularies.phonetic VARCHAR(255)
			e.Phonetic = ""
		}
		entries[i] = e
	}
	return entries, nil
}

// askDeriveAI — 1 lần gọi AI cho cả chủ đề (tối đa maxDerivedWordsPerTopic từ)
func askDeriveAI(ctx context.Context, ai AIClient, source, target db.Language, topic string, words []db.ListTopicSourceWordsRow) ([]derivedEntry, error) {
	text, err := ai.GenerateJSON(ctx, AIJSONRequest{
		System: deriveSystemPrompt, User: deriveUserPrompt(source, target, topic, words), Schema: deriveSchema, MaxTokens: 8192,
	})
	if err != nil {
		return nil, err
	}
	return parseDerivedEntries(text, len(words))
}
