package service

import (
	"context"
	"encoding/json"
	"testing"

	"laclingo-backend/internal/repository/db"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

const testLessonContent = `{"summary": "是 nối chủ ngữ với danh từ.", "formulas": [{"type": "AFFIRMATIVE", "pattern": "S + 是 + N", "example": "我是学生。"}], "signals": ["是"]}`

func TestJSONTextFields(t *testing.T) {
	if got := jsonTextFields([]byte(testLessonContent), []string{"summary", "missing", "signals"}); got[0] != "是 nối chủ ngữ với danh từ." || got[1] != "" || got[2] != "" {
		t.Fatalf("jsonTextFields = %q", got)
	}
	if got := jsonTextFields([]byte(`[1,2]`), []string{"summary"}); got[0] != "" {
		t.Fatalf("JSON không phải object: %q", got)
	}

	out := setJSONTextFields(json.RawMessage(testLessonContent), map[string]string{"summary": `"is" links "A" & B`})
	var got, want map[string]any
	_ = json.Unmarshal(out, &got)
	_ = json.Unmarshal([]byte(testLessonContent), &want)
	if got["summary"] != `"is" links "A" & B` {
		t.Fatalf("summary = %v", got["summary"])
	}
	gotF, _ := json.Marshal(got["formulas"])
	wantF, _ := json.Marshal(want["formulas"])
	if string(gotF) != string(wantF) || len(got) != len(want) {
		t.Fatalf("khoá khác bị đổi: %s", out)
	}
	if string(setJSONTextFields(json.RawMessage(`null`), map[string]string{"summary": "x"})) != "null" {
		t.Fatal("content null phải giữ nguyên")
	}
	if string(setJSONTextFields(json.RawMessage(testLessonContent), nil)) != testLessonContent {
		t.Fatal("không có gì đổi thì giữ nguyên byte")
	}
}

// putAnswers — bản dịch từ điển đáp án (grammar_answer) cho 1 locale
func putAnswers(repo *fakeTranslationRepo, locale string, pairs map[string]string) {
	for vi, text := range pairs {
		repo.put(translationEntityGrammarAnswer, vi, translationFieldText, locale, vi, text)
	}
}

func TestTranslateLessonAllOrNothing(t *testing.T) {
	lessonID, full, partial, dup := uuid.New(), uuid.New(), uuid.New(), uuid.New()
	repo := &fakeTranslationRepo{}
	repo.put(translationEntityGrammarLesson, lessonID.String(), translationFieldTitle, "en", "Câu với 是", "Sentences with 是")
	repo.put(translationEntityGrammarLesson, lessonID.String(), "content.summary", "en", "是 nối chủ ngữ với danh từ.", "是 links subject and noun.")
	for _, id := range []uuid.UUID{full, partial, dup} {
		repo.put(translationEntityGrammarExercise, id.String(), translationFieldQuestion, "en", "她 ___ 老师。(Cô ấy là giáo viên.)", "她 ___ 老师。(She is a teacher.)")
	}
	repo.put(translationEntityGrammarExercise, full.String(), translationFieldExplanation, "en", "Dùng 是 trước danh từ.", "Use 是 before nouns.")
	// "是" dịch ra nguyên văn (chỉ có chữ Hán) — vẫn tính là đã dịch; "bạn" chưa dịch; "rất"/"lắm" cùng ra "very"
	putAnswers(repo, "en", map[string]string{"是": "是", "很": "很", "là": "is", "rất": "very", "lắm": "very"})

	question := "她 ___ 老师。(Cô ấy là giáo viên.)"
	detail := GrammarLessonDetail{
		ID: lessonID, Title: "Câu với 是", Content: json.RawMessage(testLessonContent),
		Exercises: []GrammarExerciseResponse{
			{ID: full, Question: question, Options: json.RawMessage(`["是", "很"]`), CorrectAnswer: "是", Explanation: "Dùng 是 trước danh từ."},
			{ID: partial, Question: question, Options: json.RawMessage(`["là", "bạn"]`), CorrectAnswer: "là"},
			{ID: dup, Question: question, Options: json.RawMessage(`["là", "rất", "lắm"]`), CorrectAnswer: "là"},
		},
	}
	s := &GrammarService{tr: NewContentTranslator(repo)}

	vi := detail
	vi.Exercises = append([]GrammarExerciseResponse(nil), detail.Exercises...)
	s.translateLesson(context.Background(), &vi)
	if repo.reads != 0 || vi.Title != "Câu với 是" {
		t.Fatalf("giao diện tiếng Việt không được dịch / query (reads=%d)", repo.reads)
	}

	s.translateLesson(WithContentLocale(context.Background(), "en"), &detail)
	if repo.reads != 1 {
		t.Fatalf("reads = %d, want 1 query cho cả bài", repo.reads)
	}
	if detail.Title != "Sentences with 是" {
		t.Errorf("title = %q", detail.Title)
	}
	var content map[string]json.RawMessage
	_ = json.Unmarshal(detail.Content, &content)
	if string(content["summary"]) != `"是 links subject and noun."` {
		t.Errorf("summary = %s", content["summary"])
	}
	if string(content["formulas"]) != `[{"type":"AFFIRMATIVE","pattern":"S + 是 + N","example":"我是学生。"}]` {
		t.Errorf("formulas bị đổi: %s", content["formulas"])
	}

	e := detail.Exercises[0]
	if e.Question != "她 ___ 老师。(She is a teacher.)" || e.Explanation != "Use 是 before nouns." || e.CorrectAnswer != "是" || string(e.Options) != `["是","很"]` {
		t.Errorf("bài đủ bản dịch: %+v / %s", e, e.Options)
	}
	// Thiếu bản dịch 1 lựa chọn → cả bài (kể cả câu hỏi) giữ tiếng Việt
	e = detail.Exercises[1]
	if e.Question != question || e.CorrectAnswer != "là" || string(e.Options) != `["là", "bạn"]` {
		t.Errorf("bài thiếu bản dịch: %+v / %s", e, e.Options)
	}
	// 2 lựa chọn dịch ra trùng nhau → giữ tiếng Việt
	e = detail.Exercises[2]
	if e.Question != question || e.CorrectAnswer != "là" || string(e.Options) != `["là", "rất", "lắm"]` {
		t.Errorf("bài có lựa chọn trùng sau dịch: %+v / %s", e, e.Options)
	}
}

// fakeGrammarRepo — chỉ các hàm SubmitExercise dùng
type fakeGrammarRepo struct {
	GrammarRepository
	exercise  db.GrammarExercise
	completed int
}

func (f *fakeGrammarRepo) GetGrammarExerciseByID(context.Context, pgtype.UUID) (db.GrammarExercise, error) {
	return f.exercise, nil
}

func (f *fakeGrammarRepo) CompleteExercise(context.Context, db.CompleteExerciseParams) error {
	f.completed++
	return nil
}

func TestSubmitExerciseAcceptsTranslatedAnswer(t *testing.T) {
	exerciseID := uuid.New()
	trRepo := &fakeTranslationRepo{}
	putAnswers(trRepo, "en", map[string]string{"là": "is"})
	putAnswers(trRepo, "ja", map[string]string{"là": "です"})
	grammarRepo := &fakeGrammarRepo{exercise: db.GrammarExercise{ID: toPgUUID(exerciseID), CorrectAnswer: "là"}}
	s := NewGrammarService(grammarRepo, NewMissionService(&fakeSRSMissionRepo{}, nil), NewContentTranslator(trRepo))

	en := WithContentLocale(context.Background(), "en")
	ja := WithContentLocale(context.Background(), "ja")
	cases := []struct {
		name   string
		ctx    context.Context
		answer string
		want   bool
	}{
		{"vi gốc ở giao diện vi", context.Background(), " Là ", true},
		{"bản dịch ở giao diện vi", context.Background(), "is", false},
		{"bản dịch en ở giao diện en", en, "IS", true},
		{"vi gốc ở giao diện en", en, "là", true},
		{"bản dịch ja ở giao diện en", en, "です", false},
		{"bản dịch en ở giao diện ja", ja, "is", false},
		{"sai", en, "very", false},
	}
	for _, c := range cases {
		res, err := s.SubmitExercise(c.ctx, uuid.New(), exerciseID, c.answer)
		if err != nil || res.Correct != c.want {
			t.Errorf("%s: correct=%v err=%v, want %v", c.name, res.Correct, err, c.want)
		}
	}
	if grammarRepo.completed != 3 {
		t.Errorf("completed = %d, want 3", grammarRepo.completed)
	}

	// Bản dịch cũ (đáp án đã sửa) không được nhận
	grammarRepo.exercise.CorrectAnswer = "là ạ"
	if res, _ := s.SubmitExercise(en, uuid.New(), exerciseID, "is"); res.Correct {
		t.Error("bản dịch của đáp án cũ vẫn được nhận")
	}
}

func TestContentTranslationWorkerGrammarSources(t *testing.T) {
	lessonID, exID := uuid.New().String(), uuid.New().String()
	repo := &fakeTranslationRepo{
		lessons:   []db.ListGrammarLessonTranslationSourcesRow{{ID: lessonID, Title: "Câu với 是", Content: []byte(testLessonContent)}},
		exercises: []db.ListGrammarExerciseTranslationSourcesRow{{ID: exID, Question: "她 ___ 老师。(Cô ấy là giáo viên.)"}}, // explanation rỗng bỏ qua
		answers:   []string{"是", "goes", "là"},
	}
	ai := &fakeTranslateAI{}
	w := &contentTranslationWorker{repo: repo, ai: ai, sources: contentTranslationSources, locales: []string{"en"}, batchSize: 40}
	if err := w.runRound(context.Background()); err != nil {
		t.Fatal(err)
	}
	if got := repo.rows[trKey(translationEntityGrammarLesson, lessonID, "content.summary", "en")].Text; got != "[English] 是 nối chủ ngữ với danh từ." {
		t.Fatalf("content.summary = %q", got)
	}
	if _, ok := repo.rows[trKey(translationEntityGrammarExercise, exID, translationFieldExplanation, "en")]; ok {
		t.Fatal("giải thích rỗng không được dịch")
	}
	// Lựa chọn không có chữ tiếng Việt ghi nguyên văn, không gửi AI; chỉ "là" qua AI
	for vi, want := range map[string]string{"是": "是", "goes": "goes", "là": "[English] là"} {
		if got := repo.rows[trKey(translationEntityGrammarAnswer, vi, translationFieldText, "en")].Text; got != want {
			t.Fatalf("answer %q = %q, want %q", vi, got, want)
		}
	}
	// lesson (title+summary) 1 lô, exercise (câu hỏi có tiếng Việt) 1 lô, answer ("là") 1 lô
	if ai.calls != 3 {
		t.Fatalf("AI calls = %d (sizes %v), want 3", ai.calls, ai.sizes)
	}

	// Bản worker ghi phủ lên đúng ô của response (hash khớp với câu lấy từ content)
	detail := GrammarLessonDetail{ID: uuid.MustParse(lessonID), Title: "Câu với 是", Content: json.RawMessage(testLessonContent)}
	(&GrammarService{tr: NewContentTranslator(repo)}).translateLesson(WithContentLocale(context.Background(), "en"), &detail)
	if summary := jsonTextFields(detail.Content, []string{"summary"})[0]; summary != "[English] 是 nối chủ ngữ với danh từ." || detail.Title != "[English] Câu với 是" {
		t.Fatalf("title=%q summary=%q", detail.Title, summary)
	}
}

func TestHasVietnamese(t *testing.T) {
	for text, want := range map[string]bool{"là": true, "Đi": true, "ở": true, "goes": false, "是": false, "She ___ to school.": false, "café": true, "": false} {
		if got := hasVietnamese(text); got != want {
			t.Errorf("hasVietnamese(%q) = %v, want %v", text, got, want)
		}
	}
}

func TestTranslateLessonGuards(t *testing.T) {
	caseID, rawID := uuid.New(), uuid.New()
	repo := &fakeTranslationRepo{}
	// "Đi" (đáp án) và "đi " (lựa chọn) là 2 khoá riêng, AI dịch lệch nhau → đáp án không còn trong lựa chọn
	putAnswers(repo, "en", map[string]string{"Đi": "Go", "đi ": "to go", "ở": "stay", "1": "1"})
	repo.put(translationEntityGrammarExercise, rawID.String(), translationFieldQuestion, "en", "Câu hỏi", "Question")
	detail := GrammarLessonDetail{ID: uuid.New(), Content: json.RawMessage(`{}`), Exercises: []GrammarExerciseResponse{
		{ID: caseID, Options: json.RawMessage(`["đi ", "ở"]`), CorrectAnswer: "Đi"},
		{ID: rawID, Question: "Câu hỏi", Options: json.RawMessage(`[1, 2]`), CorrectAnswer: "1"}, // không phải mảng chuỗi
	}}
	(&GrammarService{tr: NewContentTranslator(repo)}).translateLesson(WithContentLocale(context.Background(), "en"), &detail)
	if e := detail.Exercises[0]; e.CorrectAnswer != "Đi" || string(e.Options) != `["đi ", "ở"]` {
		t.Errorf("đáp án lệch lựa chọn sau dịch phải giữ tiếng Việt: %q / %s", e.CorrectAnswer, e.Options)
	}
	if e := detail.Exercises[1]; e.Question != "Câu hỏi" || e.CorrectAnswer != "1" || string(e.Options) != `[1, 2]` {
		t.Errorf("options không phải mảng chuỗi phải giữ tiếng Việt cả bài: %+v", e)
	}
}

// fakeClassRepo — chỉ các hàm ListByLanguage / GetDetail dùng
type fakeClassRepo struct {
	ClassRepository
	class   db.Class
	lessons []db.ListClassLessonsWithProgressRow
}

func (f *fakeClassRepo) ListClassesByLanguage(context.Context, string) ([]db.Class, error) {
	return []db.Class{f.class}, nil
}

func (f *fakeClassRepo) GetClassByID(context.Context, pgtype.UUID) (db.Class, error) {
	return f.class, nil
}

func (f *fakeClassRepo) ListClassProgressByLanguage(context.Context, db.ListClassProgressByLanguageParams) ([]db.ListClassProgressByLanguageRow, error) {
	return nil, nil
}

func (f *fakeClassRepo) ListMyEnrollmentsByLanguage(context.Context, db.ListMyEnrollmentsByLanguageParams) ([]pgtype.UUID, error) {
	return nil, nil
}

func (f *fakeClassRepo) ListClassLessonsWithProgress(context.Context, db.ListClassLessonsWithProgressParams) ([]db.ListClassLessonsWithProgressRow, error) {
	return f.lessons, nil
}

func TestClassServiceTranslates(t *testing.T) {
	classID, lessonID := uuid.New(), uuid.New()
	trRepo := &fakeTranslationRepo{}
	trRepo.put(translationEntityClass, classID.String(), translationFieldTitle, "ja", "Lớp sơ cấp", "初級クラス")
	trRepo.put(translationEntityClass, classID.String(), translationFieldDescription, "ja", "Câu cơ bản", "基本文")
	trRepo.put(translationEntityGrammarLesson, lessonID.String(), translationFieldTitle, "ja", "Câu với 是", "是の文")
	repo := &fakeClassRepo{
		class:   db.Class{ID: toPgUUID(classID), LanguageID: "zh", Title: "Lớp sơ cấp", Description: pgtype.Text{String: "Câu cơ bản", Valid: true}},
		lessons: []db.ListClassLessonsWithProgressRow{{LessonID: toPgUUID(lessonID), Title: "Câu với 是"}},
	}
	s := NewClassService(repo, NewContentTranslator(trRepo))
	ja := WithContentLocale(context.Background(), "ja")

	list, err := s.ListByLanguage(ja, uuid.New(), "zh")
	if err != nil || list[0].Title != "初級クラス" || list[0].Description != "基本文" {
		t.Fatalf("list = %+v err=%v", list, err)
	}
	detail, err := s.GetDetail(ja, uuid.New(), classID)
	if err != nil || detail.Title != "初級クラス" || detail.Lessons[0].Title != "是の文" {
		t.Fatalf("detail = %+v err=%v", detail, err)
	}
	vi, _ := s.GetDetail(context.Background(), uuid.New(), classID)
	if vi.Title != "Lớp sơ cấp" || vi.Lessons[0].Title != "Câu với 是" {
		t.Fatalf("vi = %+v", vi)
	}
}
