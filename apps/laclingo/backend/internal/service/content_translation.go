package service

import (
	"context"
	"crypto/md5"
	"encoding/hex"
	"log"
	"strings"

	"laclingo-backend/internal/repository/db"

	"github.com/google/uuid"
)

// Dịch nội dung học theo ngôn ngữ giao diện: nội dung gốc (nghĩa từ, tên chủ đề...) là tiếng Việt; bản dịch sang
// en/zh/ja/ko do worker AI dịch sẵn vào content_translations (content_translation_worker.go). Web gửi ngôn ngữ giao
// diện qua Accept-Language → middleware gắn vào ctx (WithContentLocale) → service phủ bản dịch lên response học viên
// bằng ContentTranslator.Apply. Admin luôn thấy tiếng Việt (sửa nguồn).

// contentLocales — ngôn ngữ giao diện có bản dịch nội dung (tiếng Việt là nguồn, không dịch)
var contentLocales = []string{"en", "zh", "ja", "ko"}

// Entity / field của content_translations
const (
	translationEntityVocabulary = "vocabulary" // id = vocabularies.id
	translationEntityTopicName  = "topic_name" // id = chính tên chủ đề tiếng Việt (từ điển dùng chung mọi ngôn ngữ)

	translationEntityGrammarTopic    = "grammar_topic"    // id = grammar_topics.id
	translationEntityGrammarLesson   = "grammar_lesson"   // id = grammar_lessons.id (lớp học dùng lại tên bài)
	translationEntityGrammarExercise = "grammar_exercise" // id = grammar_exercises.id
	translationEntityGrammarAnswer   = "grammar_answer"   // id = chính câu tiếng Việt của đáp án / lựa chọn (từ điển)
	translationEntityClass           = "class"            // id = classes.id

	translationEntityListeningPassage  = "listening_passage"  // id = listening_passages.id
	translationEntityListeningQuestion = "listening_question" // id = listening_questions.id (đáp án / lựa chọn: grammar_answer)
	translationEntitySpeakingTopic     = "speaking_topic"     // id = "<language_id>/<name>" (khoá chính của speaking_topics)
	translationEntitySpeakingItem      = "speaking_item"      // id = speaking_items.id

	translationEntityMission           = "mission"            // id = missions.id
	translationEntityChallengeQuestion = "challenge_question" // id = challenge_questions.id (lựa chọn: grammar_answer)

	translationFieldMeaning        = "meaning"
	translationFieldExampleMeaning = "example_meaning"
	translationFieldLabel          = "label"
	translationFieldTitle          = "title"
	translationFieldDescription    = "description"
	translationFieldQuestion       = "question"
	translationFieldExplanation    = "explanation"
	translationFieldText           = "text"
	translationFieldPromptMeaning  = "prompt_meaning"
	translationFieldContentPrefix  = "content." // ô trong JSON content: "content.<khoá>", xem grammarLessonContentKeys
)

type contentLocaleKey struct{}

// WithContentLocale gắn ngôn ngữ giao diện cần dịch nội dung vào ctx ("" = giữ tiếng Việt)
func WithContentLocale(ctx context.Context, locale string) context.Context {
	return context.WithValue(ctx, contentLocaleKey{}, locale)
}

// ContentLocale — ngôn ngữ cần dịch nội dung của request ("" = tiếng Việt / không dịch)
func ContentLocale(ctx context.Context) string {
	locale, _ := ctx.Value(contentLocaleKey{}).(string)
	return locale
}

// ParseContentLocale lấy ngôn ngữ đầu tiên của header Accept-Language (vd "en-US,en;q=0.9" → "en"); chỉ nhận ngôn ngữ
// có bản dịch — vi / không rõ / rỗng trả "" (giữ tiếng Việt)
func ParseContentLocale(header string) string {
	first, _, _ := strings.Cut(header, ",")
	first, _, _ = strings.Cut(first, ";")
	first = strings.ToLower(strings.TrimSpace(first))
	if i := strings.IndexAny(first, "-_"); i >= 0 {
		first = first[:i]
	}
	for _, l := range contentLocales {
		if first == l {
			return l
		}
	}
	return ""
}

// sourceHash — md5 hex của câu tiếng Việt: bản dịch chỉ dùng khi hash khớp câu hiện tại (sửa câu gốc → bản dịch cũ bỏ qua)
func sourceHash(text string) string {
	sum := md5.Sum([]byte(text))
	return hex.EncodeToString(sum[:])
}

// TranslatableField — 1 ô tiếng Việt trong response; Apply thay *Value bằng bản dịch nếu có
type TranslatableField struct {
	Entity, ID, Field string
	Value             *string
}

// vocabularyFields — các ô dịch được của 1 từ (exampleMeaning nil = response không có ô đó)
func vocabularyFields(id uuid.UUID, meaning, exampleMeaning *string) []TranslatableField {
	fields := []TranslatableField{{Entity: translationEntityVocabulary, ID: id.String(), Field: translationFieldMeaning, Value: meaning}}
	if exampleMeaning != nil {
		fields = append(fields, TranslatableField{Entity: translationEntityVocabulary, ID: id.String(), Field: translationFieldExampleMeaning, Value: exampleMeaning})
	}
	return fields
}

// topicLabelField — nhãn hiển thị của 1 chủ đề: gán *label = name rồi dịch (name vẫn là khoá dùng trong URL / bộ lọc)
func topicLabelField(name string, label *string) TranslatableField {
	*label = name
	return TranslatableField{Entity: translationEntityTopicName, ID: name, Field: translationFieldLabel, Value: label}
}

type ContentTranslationReader interface {
	ListContentTranslations(ctx context.Context, arg db.ListContentTranslationsParams) ([]db.ListContentTranslationsRow, error)
}

// ContentTranslator phủ bản dịch lên response. nil-safe: service tạo không kèm translator (test) thì không dịch.
type ContentTranslator struct {
	repo ContentTranslationReader
}

func NewContentTranslator(repo ContentTranslationReader) *ContentTranslator {
	return &ContentTranslator{repo: repo}
}

type translationKey struct{ entity, id, field string }

// Apply thay các ô bằng bản dịch theo ngôn ngữ trong ctx — 1 query cho cả lô. Bản dịch cũ (câu gốc đã sửa) / chưa
// dịch / lỗi DB thì giữ tiếng Việt: dịch là phần phụ, không được làm hỏng response. Trả về ô nào đã dùng bản dịch (theo
// vị trí) — bản dịch có thể trùng nguyên văn câu gốc (vd lựa chọn chỉ có chữ Hán) nên không so giá trị để biết được.
func (t *ContentTranslator) Apply(ctx context.Context, fields []TranslatableField) []bool {
	hits := make([]bool, len(fields))
	locale := ContentLocale(ctx)
	if t == nil || locale == "" || len(fields) == 0 {
		return hits
	}
	params := db.ListContentTranslationsParams{Locale: locale}
	seen := make(map[translationKey]bool, len(fields))
	for _, f := range fields {
		k := translationKey{f.Entity, f.ID, f.Field}
		if *f.Value == "" || seen[k] {
			continue
		}
		seen[k] = true
		params.Entities = append(params.Entities, f.Entity)
		params.EntityIds = append(params.EntityIds, f.ID)
		params.Fields = append(params.Fields, f.Field)
	}
	if len(params.Entities) == 0 {
		return hits
	}
	rows, err := t.repo.ListContentTranslations(ctx, params)
	if err != nil {
		if ctx.Err() == nil {
			log.Printf("❌ content translation: đọc bản dịch %s: %v", locale, err)
		}
		return hits
	}
	found := make(map[translationKey]db.ListContentTranslationsRow, len(rows))
	for _, r := range rows {
		found[translationKey{r.Entity, r.EntityID, r.Field}] = r
	}
	for i, f := range fields {
		r, ok := found[translationKey{f.Entity, f.ID, f.Field}]
		if ok && *f.Value != "" && r.SourceHash == sourceHash(*f.Value) {
			*f.Value = r.Text
			hits[i] = true
		}
	}
	return hits
}

// TopicLabels — nhãn hiển thị (đã dịch) cho 1 nhóm tên chủ đề, map tên → nhãn (mọi tên đều có mặt)
func (t *ContentTranslator) TopicLabels(ctx context.Context, names []string) map[string]string {
	labels := make([]string, len(names))
	fields := make([]TranslatableField, 0, len(names))
	for i, name := range names {
		fields = append(fields, topicLabelField(name, &labels[i]))
	}
	t.Apply(ctx, fields)
	out := make(map[string]string, len(names))
	for i, name := range names {
		out[name] = labels[i]
	}
	return out
}
