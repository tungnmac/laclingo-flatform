package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"testing"

	"laclingo-backend/internal/repository/db"

	"github.com/google/uuid"
)

func TestParseContentLocale(t *testing.T) {
	cases := map[string]string{
		"":                   "",
		"en":                 "en",
		"en-US,en;q=0.9":     "en",
		" ZH-cn ; q=0.8, vi": "zh",
		"ja_JP":              "ja",
		"ko":                 "ko",
		"vi":                 "",
		"vi-VN,en;q=0.9":     "", // chỉ xét ngôn ngữ đầu tiên
		"fr":                 "",
		"*":                  "",
	}
	for header, want := range cases {
		if got := ParseContentLocale(header); got != want {
			t.Errorf("ParseContentLocale(%q) = %q, want %q", header, got, want)
		}
	}
}

// fakeTranslationRepo — bản dịch trong bộ nhớ (cả đọc lẫn ghi), đếm số query đọc
type fakeTranslationRepo struct {
	rows      map[string]db.ContentTranslation // key entity|id|field|locale
	reads     int
	vocab     []db.ListVocabularyTranslationSourcesRow
	topics    []string
	upserts   int
	readErr   error
	lastQuery db.ListContentTranslationsParams
}

func trKey(entity, id, field, locale string) string {
	return entity + "|" + id + "|" + field + "|" + locale
}

func (f *fakeTranslationRepo) put(entity, id, field, locale, source, text string) {
	if f.rows == nil {
		f.rows = map[string]db.ContentTranslation{}
	}
	f.rows[trKey(entity, id, field, locale)] = db.ContentTranslation{Entity: entity, EntityID: id, Field: field, Locale: locale, SourceHash: sourceHash(source), Text: text}
}

func (f *fakeTranslationRepo) ListContentTranslations(_ context.Context, arg db.ListContentTranslationsParams) ([]db.ListContentTranslationsRow, error) {
	f.reads++
	f.lastQuery = arg
	if f.readErr != nil {
		return nil, f.readErr
	}
	var out []db.ListContentTranslationsRow
	for i := range arg.Entities {
		if r, ok := f.rows[trKey(arg.Entities[i], arg.EntityIds[i], arg.Fields[i], arg.Locale)]; ok {
			out = append(out, db.ListContentTranslationsRow{Entity: r.Entity, EntityID: r.EntityID, Field: r.Field, SourceHash: r.SourceHash, Text: r.Text})
		}
	}
	return out, nil
}

func (f *fakeTranslationRepo) ListContentTranslationHashes(_ context.Context, arg db.ListContentTranslationHashesParams) ([]db.ListContentTranslationHashesRow, error) {
	var out []db.ListContentTranslationHashesRow
	for _, r := range f.rows {
		if r.Entity == arg.Entity && r.Locale == arg.Locale {
			out = append(out, db.ListContentTranslationHashesRow{EntityID: r.EntityID, Field: r.Field, SourceHash: r.SourceHash})
		}
	}
	return out, nil
}

func (f *fakeTranslationRepo) UpsertContentTranslations(_ context.Context, arg db.UpsertContentTranslationsParams) error {
	f.upserts++
	if f.rows == nil {
		f.rows = map[string]db.ContentTranslation{}
	}
	for i := range arg.EntityIds {
		f.rows[trKey(arg.Entity, arg.EntityIds[i], arg.Fields[i], arg.Locale)] = db.ContentTranslation{
			Entity: arg.Entity, EntityID: arg.EntityIds[i], Field: arg.Fields[i], Locale: arg.Locale, SourceHash: arg.SourceHashes[i], Text: arg.Texts[i],
		}
	}
	return nil
}

func (f *fakeTranslationRepo) ListVocabularyTranslationSources(context.Context) ([]db.ListVocabularyTranslationSourcesRow, error) {
	return f.vocab, nil
}

func (f *fakeTranslationRepo) ListTopicNameTranslationSources(context.Context) ([]string, error) {
	return f.topics, nil
}

func TestContentTranslatorApply(t *testing.T) {
	id := uuid.New()
	repo := &fakeTranslationRepo{}
	repo.put(translationEntityVocabulary, id.String(), translationFieldMeaning, "en", "quả táo", "apple")
	repo.put(translationEntityVocabulary, id.String(), translationFieldExampleMeaning, "en", "câu cũ", "old sentence") // nguồn đã sửa
	repo.put(translationEntityTopicName, "Đồ ăn", translationFieldLabel, "en", "Đồ ăn", "Food")
	tr := NewContentTranslator(repo)

	meaning, example, topic, label := "quả táo", "Tôi ăn táo.", "Đồ ăn", ""
	fields := append(vocabularyFields(id, &meaning, &example), topicLabelField(topic, &label))
	tr.Apply(WithContentLocale(context.Background(), "en"), fields)

	if meaning != "apple" {
		t.Errorf("meaning = %q, want apple (hash khớp)", meaning)
	}
	if example != "Tôi ăn táo." {
		t.Errorf("example = %q, want giữ tiếng Việt (hash lệch)", example)
	}
	if label != "Food" || topic != "Đồ ăn" {
		t.Errorf("label/topic = %q/%q, want Food/Đồ ăn", label, topic)
	}
	if repo.reads != 1 {
		t.Errorf("reads = %d, want 1 query cho cả lô", repo.reads)
	}
}

func TestContentTranslatorApplyNoop(t *testing.T) {
	repo := &fakeTranslationRepo{}
	repo.put(translationEntityTopicName, "Đồ ăn", translationFieldLabel, "en", "Đồ ăn", "Food")
	tr := NewContentTranslator(repo)
	label, empty := "", ""
	fields := []TranslatableField{topicLabelField("Đồ ăn", &label), topicLabelField("", &empty)}

	tr.Apply(context.Background(), fields) // không có locale
	tr.Apply(WithContentLocale(context.Background(), "en"), nil)
	tr.Apply(WithContentLocale(context.Background(), "en"), []TranslatableField{topicLabelField("", &empty)}) // chỉ ô rỗng
	var nilTr *ContentTranslator
	nilTr.Apply(WithContentLocale(context.Background(), "en"), fields)
	if repo.reads != 0 || label != "Đồ ăn" {
		t.Fatalf("reads=%d label=%q, want 0 query và giữ nguyên", repo.reads, label)
	}

	// Lỗi DB → giữ tiếng Việt, không panic
	repo.readErr = errors.New("db down")
	tr.Apply(WithContentLocale(context.Background(), "ja"), fields)
	if label != "Đồ ăn" {
		t.Fatalf("label = %q sau lỗi DB", label)
	}
}

func TestTopicLabelsDedupesQuery(t *testing.T) {
	repo := &fakeTranslationRepo{}
	repo.put(translationEntityTopicName, "Gia đình", translationFieldLabel, "ko", "Gia đình", "가족")
	labels := NewContentTranslator(repo).TopicLabels(WithContentLocale(context.Background(), "ko"), []string{"Gia đình", "Du lịch", "Gia đình"})
	if labels["Gia đình"] != "가족" || labels["Du lịch"] != "Du lịch" {
		t.Fatalf("labels = %v", labels)
	}
	if len(repo.lastQuery.EntityIds) != 2 {
		t.Fatalf("query ids = %v, want gộp trùng còn 2", repo.lastQuery.EntityIds)
	}
}

// fakeTranslateAI — đọc lô trong prompt, trả "[locale] câu" cho từng mục; failAt > 0 = lỗi ở lần gọi thứ failAt,
// failFrom > 0 = lỗi từ lần gọi thứ failFrom trở đi
type fakeTranslateAI struct {
	calls    int
	sizes    []int
	failAt   int
	failFrom int
}

func (f *fakeTranslateAI) GenerateJSON(_ context.Context, req AIJSONRequest) (string, error) {
	f.calls++
	if f.calls == f.failAt || (f.failFrom > 0 && f.calls >= f.failFrom) {
		return "", errors.New("overloaded")
	}
	head, body, _ := strings.Cut(req.User, ":\n")
	locale := strings.TrimPrefix(strings.SplitN(head, "\n", 2)[0], "Target language: ")
	var items map[string]string
	if err := json.Unmarshal([]byte(body), &items); err != nil {
		return "", err
	}
	f.sizes = append(f.sizes, len(items))
	type item struct {
		ID   string `json:"id"`
		Text string `json:"text"`
	}
	out := struct {
		Items []item `json:"items"`
	}{}
	for id, text := range items {
		out.Items = append(out.Items, item{ID: id, Text: fmt.Sprintf("[%s] %s", locale, text)})
	}
	raw, _ := json.Marshal(out)
	return string(raw), nil
}

func newTestWorker(repo *fakeTranslationRepo, ai AIClient, batch int) *contentTranslationWorker {
	return &contentTranslationWorker{repo: repo, ai: ai, sources: contentTranslationSources, locales: []string{"en", "ja"}, batchSize: batch}
}

func TestContentTranslationWorkerRound(t *testing.T) {
	a, b, c := uuid.New().String(), uuid.New().String(), uuid.New().String()
	repo := &fakeTranslationRepo{
		vocab: []db.ListVocabularyTranslationSourcesRow{
			{ID: a, Meaning: "con mèo", ExampleMeaning: "Con mèo ngủ."},
			{ID: b, Meaning: "con mèo", ExampleMeaning: ""}, // trùng câu với a, ví dụ rỗng bỏ qua
			{ID: c, Meaning: "con chó", ExampleMeaning: "Chó sủa."},
		},
		topics: []string{"Động vật"},
	}
	ai := &fakeTranslateAI{}
	w := newTestWorker(repo, ai, 2)
	if err := w.runRound(context.Background()); err != nil {
		t.Fatal(err)
	}
	// vocabulary: 4 câu khác nhau (gộp "con mèo") → lô 2+2 mỗi locale; topic: 1 lô mỗi locale
	if ai.calls != 6 {
		t.Fatalf("AI calls = %d (sizes %v), want 6", ai.calls, ai.sizes)
	}
	for _, size := range ai.sizes {
		if size > 2 {
			t.Fatalf("lô %d câu vượt batch 2", size)
		}
	}
	if got := repo.rows[trKey(translationEntityVocabulary, b, translationFieldMeaning, "ja")].Text; got != "[Japanese] con mèo" {
		t.Fatalf("b meaning ja = %q", got)
	}
	if _, ok := repo.rows[trKey(translationEntityVocabulary, b, translationFieldExampleMeaning, "en")]; ok {
		t.Fatal("câu rỗng không được dịch")
	}
	if got := repo.rows[trKey(translationEntityTopicName, "Động vật", translationFieldLabel, "en")].Text; got != "[English] Động vật" {
		t.Fatalf("topic en = %q", got)
	}

	// Lượt sau không có gì mới → không gọi AI
	ai.calls = 0
	if err := w.runRound(context.Background()); err != nil || ai.calls != 0 {
		t.Fatalf("lượt 2: calls=%d err=%v, want 0", ai.calls, err)
	}

	// Sửa nghĩa của c → chỉ dịch lại câu đó (mỗi locale 1 lần), bản dịch cũ bị Apply bỏ qua trong lúc chờ
	repo.vocab[2].Meaning = "chú chó"
	meaning := "chú chó"
	NewContentTranslator(repo).Apply(WithContentLocale(context.Background(), "en"), vocabularyFields(uuid.MustParse(c), &meaning, nil))
	if meaning != "chú chó" {
		t.Fatalf("bản dịch cũ vẫn được dùng: %q", meaning)
	}
	ai.calls, ai.sizes = 0, nil
	if err := w.runRound(context.Background()); err != nil || ai.calls != 2 || ai.sizes[0] != 1 {
		t.Fatalf("lượt 3: calls=%d sizes=%v err=%v", ai.calls, ai.sizes, err)
	}
	NewContentTranslator(repo).Apply(WithContentLocale(context.Background(), "en"), vocabularyFields(uuid.MustParse(c), &meaning, nil))
	if meaning != "[English] chú chó" {
		t.Fatalf("meaning sau khi dịch lại = %q", meaning)
	}
}

func TestContentTranslationWorkerSkipsFailedBatch(t *testing.T) {
	repo := &fakeTranslationRepo{topics: []string{"A", "B", "C"}}
	ai := &fakeTranslateAI{failAt: 2}
	w := newTestWorker(repo, ai, 1)
	if err := w.runRound(context.Background()); err != nil {
		t.Fatal(err)
	}
	// 6 lô (3 tên × 2 locale), lô thứ 2 lỗi bị bỏ qua — các lô sau vẫn dịch
	if ai.calls != 6 || len(repo.rows) != 5 {
		t.Fatalf("calls=%d rows=%d, want 6 lần gọi, 5 bản dịch", ai.calls, len(repo.rows))
	}
	// Lượt sau dịch nốt lô lỗi
	ai.calls = 0
	if err := w.runRound(context.Background()); err != nil || ai.calls != 1 || len(repo.rows) != 6 {
		t.Fatalf("lượt 2: calls=%d rows=%d err=%v", ai.calls, len(repo.rows), err)
	}
}

func TestContentTranslationWorkerStopsWhenAIDown(t *testing.T) {
	repo := &fakeTranslationRepo{topics: []string{"A", "B", "C", "D", "E"}}
	ai := &fakeTranslateAI{failFrom: 1}
	w := newTestWorker(repo, ai, 1)
	if err := w.runRound(context.Background()); err == nil {
		t.Fatal("want lỗi khi AI lỗi liên tục")
	}
	if ai.calls != contentTranslationMaxFailures || len(repo.rows) != 0 {
		t.Fatalf("calls=%d rows=%d, want dừng sau %d lô lỗi liền", ai.calls, len(repo.rows), contentTranslationMaxFailures)
	}
}

func TestParseContentTranslationsSkipsBadItems(t *testing.T) {
	texts, err := parseContentTranslations(`{"items":[{"id":"1","text":" hi "},{"id":"9","text":"x"},{"id":"a","text":"y"}]}`, 2)
	if err != nil || texts[0] != "" || texts[1] != "hi" {
		t.Fatalf("texts=%q err=%v", texts, err)
	}
	if _, err := parseContentTranslations("not json", 1); err == nil {
		t.Fatal("want lỗi định dạng")
	}
}

func TestTranslateChoicesKeepsOneLanguage(t *testing.T) {
	a, b, d1, d2 := uuid.New(), uuid.New(), uuid.New(), uuid.New()
	repo := &fakeTranslationRepo{}
	for id, vi := range map[uuid.UUID]string{a: "con mèo", b: "con chó", d1: "con gà"} { // d2 chưa dịch
		repo.put(translationEntityVocabulary, id.String(), translationFieldMeaning, "en", vi, "[en] "+vi)
	}
	s := &SRSService{tr: NewContentTranslator(repo)}
	results := []DueVocabulary{{VocabularyID: a, Meaning: "con mèo"}, {VocabularyID: b, Meaning: "con chó"}}
	distractors := []db.ListMeaningDistractorsForVocabulariesRow{
		{VocabularyID: toPgUUID(a), DistractorID: toPgUUID(d1), Meaning: "con gà"},
		{VocabularyID: toPgUUID(b), DistractorID: toPgUUID(d1), Meaning: "con gà"},
		{VocabularyID: toPgUUID(b), DistractorID: toPgUUID(d2), Meaning: "con vịt"},
	}
	s.translateChoices(WithContentLocale(context.Background(), "en"), results, distractors)
	if results[0].Meaning != "[en] con mèo" || distractors[0].Meaning != "[en] con gà" {
		t.Fatalf("a: %q / %q, want đã dịch hết", results[0].Meaning, distractors[0].Meaning)
	}
	// b có 1 nghĩa nhiễu chưa dịch → cả bài giữ tiếng Việt
	if results[1].Meaning != "con chó" || distractors[1].Meaning != "con gà" || distractors[2].Meaning != "con vịt" {
		t.Fatalf("b: %q / %q / %q, want giữ tiếng Việt", results[1].Meaning, distractors[1].Meaning, distractors[2].Meaning)
	}
}
