package service

import (
	"context"
	"testing"

	"laclingo-backend/internal/repository/db"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

// fakeListeningRepo — chỉ các hàm học viên dùng
type fakeListeningRepo struct {
	ListeningRepository
	passage   db.ListeningPassage
	summaries []db.ListListeningPassagesByLanguageRow
	topics    []db.ListListeningTopicsRow
	questions []db.ListeningQuestion
}

func (f *fakeListeningRepo) GetListeningPassageByID(context.Context, pgtype.UUID) (db.ListeningPassage, error) {
	return f.passage, nil
}

func (f *fakeListeningRepo) ListListeningQuestionsByPassage(context.Context, pgtype.UUID) ([]db.ListeningQuestion, error) {
	return f.questions, nil
}

func (f *fakeListeningRepo) GetListeningQuestionByID(_ context.Context, id pgtype.UUID) (db.ListeningQuestion, error) {
	for _, q := range f.questions {
		if q.ID == id {
			return q, nil
		}
	}
	return db.ListeningQuestion{}, nil
}

func (f *fakeListeningRepo) ListListeningPassagesByLanguage(context.Context, db.ListListeningPassagesByLanguageParams) ([]db.ListListeningPassagesByLanguageRow, error) {
	return f.summaries, nil
}

func (f *fakeListeningRepo) ListListeningTopics(context.Context, string) ([]db.ListListeningTopicsRow, error) {
	return f.topics, nil
}

func pgText(s string) pgtype.Text { return pgtype.Text{String: s, Valid: s != ""} }

func TestListeningPassageTranslation(t *testing.T) {
	passageID, full, partial := uuid.New(), uuid.New(), uuid.New()
	script := "Lan goes to the market every Saturday morning."
	trRepo := &fakeTranslationRepo{}
	trRepo.put(translationEntityListeningPassage, passageID.String(), translationFieldTitle, "ko", "Đi chợ", "시장 가기")
	trRepo.put(translationEntityTopicName, "Đời sống", translationFieldLabel, "ko", "Đời sống", "일상")
	trRepo.put(translationEntityListeningQuestion, full.String(), translationFieldQuestion, "ko", "Lan đi đâu?", "란은 어디에 가요?")
	trRepo.put(translationEntityListeningQuestion, full.String(), translationFieldExplanation, "ko", "Câu đầu nói rõ.", "첫 문장에 나와요.")
	trRepo.put(translationEntityListeningQuestion, partial.String(), translationFieldQuestion, "ko", "Lan mua gì?", "란은 무엇을 사요?")
	putAnswers(trRepo, "ko", map[string]string{"Đi chợ": "시장에", "Đi học": "학교에", "Táo": "사과"}) // "Chuối" chưa dịch
	repo := &fakeListeningRepo{
		passage: db.ListeningPassage{ID: toPgUUID(passageID), Title: "Đi chợ", Script: script, Topic: pgText("Đời sống")},
		questions: []db.ListeningQuestion{
			{ID: toPgUUID(full), Question: "Lan đi đâu?", Options: []byte(`["Đi học", "Đi chợ"]`), CorrectAnswer: "Đi chợ", Explanation: pgText("Câu đầu nói rõ.")},
			{ID: toPgUUID(partial), Question: "Lan mua gì?", Options: []byte(`["Táo", "Chuối"]`), CorrectAnswer: "Táo"},
		},
	}
	s := NewListeningService(repo, NewMissionService(&fakeSRSMissionRepo{}, nil), nil, NewContentTranslator(trRepo))
	ko := WithContentLocale(context.Background(), "ko")

	detail, err := s.GetPassageDetail(ko, passageID)
	if err != nil {
		t.Fatal(err)
	}
	if trRepo.reads != 1 {
		t.Errorf("reads = %d, want 1 query cho cả bài", trRepo.reads)
	}
	if detail.Title != "시장 가기" || detail.Topic != "Đời sống" || detail.TopicLabel != "일상" || detail.Script != script {
		t.Errorf("detail = %q / %q / %q / %q (script không được dịch)", detail.Title, detail.Topic, detail.TopicLabel, detail.Script)
	}
	if q := detail.Questions[0]; q.Question != "란은 어디에 가요?" || string(q.Options) != `["학교에","시장에"]` {
		t.Errorf("câu đủ bản dịch: %q / %s", q.Question, q.Options)
	}
	// Thiếu bản dịch 1 lựa chọn → cả câu giữ tiếng Việt
	if q := detail.Questions[1]; q.Question != "Lan mua gì?" || string(q.Options) != `["Táo", "Chuối"]` {
		t.Errorf("câu thiếu bản dịch: %q / %s", q.Question, q.Options)
	}

	vi, _ := s.GetPassageDetail(context.Background(), passageID)
	if vi.Title != "Đi chợ" || vi.TopicLabel != "Đời sống" || vi.Questions[0].Question != "Lan đi đâu?" {
		t.Errorf("vi = %+v", vi)
	}

	// Chấm: nhận đáp án tiếng Việt hoặc bản dịch của ngôn ngữ request; kết quả trả về theo bản đang hiện
	cases := []struct {
		name                string
		ctx                 context.Context
		question            uuid.UUID
		answer              string
		correct             bool
		wantAnswer, wantExp string
	}{
		{"bản dịch ko", ko, full, "시장에", true, "시장에", "첫 문장에 나와요."},
		{"vi gốc ở giao diện ko", ko, full, "Đi chợ", true, "시장에", "첫 문장에 나와요."},
		{"sai ở giao diện ko", ko, full, "학교에", false, "시장에", "첫 문장에 나와요."},
		{"bản dịch ở giao diện vi", context.Background(), full, "시장에", false, "Đi chợ", "Câu đầu nói rõ."},
		{"câu chưa dịch đủ vẫn nhận bản dịch đáp án", ko, partial, "사과", true, "Táo", ""},
	}
	for _, c := range cases {
		res, err := s.SubmitAnswer(c.ctx, uuid.New(), c.question, c.answer)
		if err != nil || res.Correct != c.correct || res.CorrectAnswer != c.wantAnswer || res.Explanation != c.wantExp {
			t.Errorf("%s: %+v err=%v", c.name, res, err)
		}
	}
}

func TestListeningListTranslation(t *testing.T) {
	id := uuid.New()
	trRepo := &fakeTranslationRepo{}
	trRepo.put(translationEntityTopicName, "Daily life", translationFieldLabel, "ja", "Daily life", "Daily life")
	trRepo.put(translationEntityListeningPassage, id.String(), translationFieldTitle, "ja", "A Day at the Market", "A Day at the Market")
	repo := &fakeListeningRepo{
		summaries: []db.ListListeningPassagesByLanguageRow{{ID: toPgUUID(id), Title: "A Day at the Market", Topic: pgText("Daily life")}, {ID: toPgUUID(uuid.New()), Title: "Không chủ đề"}},
		topics:    []db.ListListeningTopicsRow{{Name: "Daily life"}, {Name: "Du lịch"}},
	}
	s := NewListeningService(repo, nil, nil, NewContentTranslator(trRepo))
	ja := WithContentLocale(context.Background(), "ja")

	topics, _ := s.ListTopics(ja, "en")
	if topics[0].Label != "Daily life" || topics[1].Label != "Du lịch" || topics[1].Name != "Du lịch" {
		t.Errorf("topics = %+v (chưa dịch thì label = name)", topics)
	}
	passages, _ := s.ListPassages(ja, "en", "")
	if passages[0].TopicLabel != "Daily life" || passages[0].Title != "A Day at the Market" || passages[1].TopicLabel != "" {
		t.Errorf("passages = %+v", passages)
	}
	if trRepo.reads != 2 {
		t.Errorf("reads = %d, want 1 query / response", trRepo.reads)
	}
}

// fakeSpeakingRepo — chỉ các hàm học viên dùng
type fakeSpeakingRepo struct {
	SpeakingRepository
	topics []db.ListSpeakingTopicsRow
	items  []db.ListSpeakingItemsByTopicRow
}

func (f *fakeSpeakingRepo) ListSpeakingTopics(context.Context, db.ListSpeakingTopicsParams) ([]db.ListSpeakingTopicsRow, error) {
	return f.topics, nil
}

func (f *fakeSpeakingRepo) ListSpeakingItemsByTopic(context.Context, db.ListSpeakingItemsByTopicParams) ([]db.ListSpeakingItemsByTopicRow, error) {
	return f.items, nil
}

func TestSpeakingTranslation(t *testing.T) {
	itemID := uuid.New()
	trRepo := &fakeTranslationRepo{}
	trRepo.put(translationEntityTopicName, "Phỏng vấn CNTT", translationFieldLabel, "en", "Phỏng vấn CNTT", "IT interview")
	trRepo.put(translationEntitySpeakingTopic, "en/Phỏng vấn CNTT", translationFieldDescription, "en", "Luyện nói phỏng vấn.", "Interview speaking practice.")
	trRepo.put(translationEntitySpeakingItem, itemID.String(), translationFieldPromptMeaning, "en", "Hãy giới thiệu bản thân.", "Introduce yourself.")
	repo := &fakeSpeakingRepo{
		topics: []db.ListSpeakingTopicsRow{{Name: "Phỏng vấn CNTT", Description: "Luyện nói phỏng vấn."}},
		items: []db.ListSpeakingItemsByTopicRow{{
			ID: toPgUUID(itemID), Kind: SpeakingKindAnswer, Prompt: "Tell me about yourself.", PromptMeaning: "Hãy giới thiệu bản thân.",
			SampleAnswer: "I am a developer.", Keywords: []string{"developer"}, BestScore: -1,
		}},
	}
	s := NewSpeakingService(repo, nil, nil, NewContentTranslator(trRepo))
	en := WithContentLocale(context.Background(), "en")

	topics, _ := s.ListTopics(en, uuid.New(), "en")
	if t0 := topics[0]; t0.Name != "Phỏng vấn CNTT" || t0.Label != "IT interview" || t0.Description != "Interview speaking practice." {
		t.Errorf("topic = %+v", t0)
	}
	items, _ := s.ListItems(en, uuid.New(), "en", "Phỏng vấn CNTT")
	if it := items[0]; it.PromptMeaning != "Introduce yourself." || it.Prompt != "Tell me about yourself." || it.SampleAnswer != "I am a developer." || it.TopicLabel != "IT interview" {
		t.Errorf("item = %+v", it)
	}
	if trRepo.reads != 2 {
		t.Errorf("reads = %d, want 1 query / response", trRepo.reads)
	}

	vi, _ := s.ListItems(context.Background(), uuid.New(), "en", "Phỏng vấn CNTT")
	if vi[0].PromptMeaning != "Hãy giới thiệu bản thân." || vi[0].TopicLabel != "Phỏng vấn CNTT" {
		t.Errorf("vi = %+v", vi[0])
	}
}

func TestContentTranslationWorkerListeningSpeakingSources(t *testing.T) {
	passageID, questionID, itemID := uuid.New().String(), uuid.New().String(), uuid.New().String()
	repo := &fakeTranslationRepo{
		topics:    []string{"Daily life", "Phỏng vấn CNTT"},
		passages:  []db.ListListeningPassageTranslationSourcesRow{{ID: passageID, Title: "A Day at the Market"}},
		questions: []db.ListListeningQuestionTranslationSourcesRow{{ID: questionID, Question: "Where does Lan go?", Explanation: "Câu đầu nói rõ."}},
		spTopics:  []db.ListSpeakingTopicTranslationSourcesRow{{ID: "en/Phỏng vấn CNTT", Description: "Luyện nói phỏng vấn."}},
		spItems:   []db.ListSpeakingItemTranslationSourcesRow{{ID: itemID, PromptMeaning: "Hãy giới thiệu bản thân."}},
	}
	ai := &fakeTranslateAI{}
	w := &contentTranslationWorker{repo: repo, ai: ai, sources: contentTranslationSources, locales: []string{"en"}, batchSize: 40}
	if err := w.runRound(context.Background()); err != nil {
		t.Fatal(err)
	}
	want := map[[3]string]string{
		// Không có chữ tiếng Việt → ghi nguyên văn, không gửi AI
		{translationEntityTopicName, "Daily life", translationFieldLabel}:                  "Daily life",
		{translationEntityListeningPassage, passageID, translationFieldTitle}:              "A Day at the Market",
		{translationEntityListeningQuestion, questionID, translationFieldQuestion}:         "Where does Lan go?",
		{translationEntityTopicName, "Phỏng vấn CNTT", translationFieldLabel}:              "[English] Phỏng vấn CNTT",
		{translationEntityListeningQuestion, questionID, translationFieldExplanation}:      "[English] Câu đầu nói rõ.",
		{translationEntitySpeakingTopic, "en/Phỏng vấn CNTT", translationFieldDescription}: "[English] Luyện nói phỏng vấn.",
		{translationEntitySpeakingItem, itemID, translationFieldPromptMeaning}:             "[English] Hãy giới thiệu bản thân.",
	}
	for k, text := range want {
		if got := repo.rows[trKey(k[0], k[1], k[2], "en")].Text; got != text {
			t.Errorf("%v = %q, want %q", k, got, text)
		}
	}
	// topic_name, listening_question, speaking_topic, speaking_item — mỗi nguồn 1 lô có câu tiếng Việt
	if ai.calls != 4 {
		t.Errorf("AI calls = %d (sizes %v), want 4", ai.calls, ai.sizes)
	}
}
