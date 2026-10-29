package service

import (
	"context"
	"testing"

	"laclingo-backend/internal/repository/db"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

// fakeMissionListRepo — chỉ danh sách nhiệm vụ của học viên
type fakeMissionListRepo struct {
	MissionRepository
	rows []db.ListMissionsWithProgressRow
}

func (f *fakeMissionListRepo) ListMissionsWithProgress(context.Context, pgtype.UUID) ([]db.ListMissionsWithProgressRow, error) {
	return f.rows, nil
}

func TestListMyMissionsTranslation(t *testing.T) {
	a, b := uuid.New(), uuid.New()
	trRepo := &fakeTranslationRepo{}
	trRepo.put(translationEntityMission, a.String(), translationFieldTitle, "en", "Ôn tập 10 từ", "Review 10 words")
	trRepo.put(translationEntityMission, a.String(), translationFieldDescription, "en", "Ôn mỗi ngày", "Review daily")
	trRepo.put(translationEntityMission, b.String(), translationFieldTitle, "en", "Tên cũ", "Old name") // câu gốc đã sửa
	repo := &fakeMissionListRepo{rows: []db.ListMissionsWithProgressRow{
		{ID: toPgUUID(a), Title: "Ôn tập 10 từ", Description: pgText("Ôn mỗi ngày"), Period: "daily", TargetCount: 10, ProgressCount: 3},
		{ID: toPgUUID(b), Title: "Thắng 5 trận", Period: "weekly", TargetCount: 5},
	}}
	s := NewMissionService(repo, nil)
	s.SetTranslator(NewContentTranslator(trRepo))

	en, err := s.ListMyMissions(WithContentLocale(context.Background(), "en"), uuid.New())
	if err != nil {
		t.Fatal(err)
	}
	if trRepo.reads != 1 {
		t.Errorf("reads = %d, want 1 query cho cả danh sách", trRepo.reads)
	}
	if en[0].Title != "Review 10 words" || en[0].Description != "Review daily" || en[0].ProgressCount != 3 {
		t.Errorf("en[0] = %+v", en[0])
	}
	if en[1].Title != "Thắng 5 trận" || en[1].Description != "" {
		t.Errorf("bản dịch cũ (hash lệch) phải giữ tiếng Việt: %+v", en[1])
	}

	vi, _ := s.ListMyMissions(context.Background(), uuid.New())
	if vi[0].Title != "Ôn tập 10 từ" || trRepo.reads != 1 {
		t.Errorf("vi = %+v, reads = %d (giao diện vi không query)", vi[0], trRepo.reads)
	}

	// Không nối translator (test cũ / khởi động thiếu) → giữ nguyên, không panic
	plain, _ := NewMissionService(repo, nil).ListMyMissions(WithContentLocale(context.Background(), "en"), uuid.New())
	if plain[0].Title != "Ôn tập 10 từ" {
		t.Errorf("không translator: %+v", plain[0])
	}
}

func TestTranslateChallengeQuestions(t *testing.T) {
	full, partial, foreign := uuid.New(), uuid.New(), uuid.New()
	trRepo := &fakeTranslationRepo{}
	trRepo.put(translationEntityChallengeQuestion, full.String(), translationFieldQuestion, "en", "Từ nào nghĩa là \"con mèo\"?", "Which word means \"cat\"?")
	trRepo.put(translationEntityChallengeQuestion, partial.String(), translationFieldQuestion, "en", "Chọn nghĩa của \"狗\"", "Choose the meaning of \"狗\"")
	trRepo.put(translationEntityChallengeQuestion, foreign.String(), translationFieldQuestion, "en", "She ___ to school.", "She ___ to school.")
	putAnswers(trRepo, "en", map[string]string{"con chó": "dog", "con gà": "chicken", "go": "go", "goes": "goes"}) // "con mèo" chưa dịch
	questions := []db.ListGameRoomQuestionsRow{
		{ID: toPgUUID(full), Question: "Từ nào nghĩa là \"con mèo\"?", Options: []byte(`["猫", "狗"]`), CorrectIndex: 0, Explanation: pgText("猫 = mèo")},
		{ID: toPgUUID(partial), Question: "Chọn nghĩa của \"狗\"", Options: []byte(`["con mèo", "con chó", "con gà"]`), CorrectIndex: 1},
		{ID: toPgUUID(foreign), Question: "She ___ to school.", Options: []byte(`["go", "goes"]`), CorrectIndex: 1},
	}
	trRepo.put(translationEntityGrammarAnswer, "猫", translationFieldText, "en", "猫", "猫")
	trRepo.put(translationEntityGrammarAnswer, "狗", translationFieldText, "en", "狗", "狗")
	tr := NewContentTranslator(trRepo)

	en := tr.TranslateChallengeQuestions(context.Background(), "en", questions)
	if trRepo.reads != 1 {
		t.Errorf("reads = %d, want 1 query cho cả phòng", trRepo.reads)
	}
	if en[0].Question != "Which word means \"cat\"?" || string(en[0].Options) != `["猫","狗"]` || en[0].CorrectIndex != 0 {
		t.Errorf("câu đủ bản dịch: %+v / %s", en[0].Question, en[0].Options)
	}
	// Thiếu bản dịch 1 lựa chọn → cả câu giữ tiếng Việt (không nửa dịch nửa không)
	if en[1].Question != "Chọn nghĩa của \"狗\"" || string(en[1].Options) != `["con mèo", "con chó", "con gà"]` {
		t.Errorf("câu thiếu bản dịch: %q / %s", en[1].Question, en[1].Options)
	}
	if en[2].Question != "She ___ to school." || string(en[2].Options) != `["go","goes"]` || en[2].CorrectIndex != 1 {
		t.Errorf("câu ngoại ngữ: %q / %s", en[2].Question, en[2].Options)
	}
	// Bản gốc của phòng không bị sửa (người chơi tiếng Việt + chấm điểm dùng bản gốc)
	if questions[0].Question != "Từ nào nghĩa là \"con mèo\"?" || string(questions[0].Options) != `["猫", "狗"]` {
		t.Errorf("bản gốc bị sửa: %+v", questions[0])
	}

	vi := tr.TranslateChallengeQuestions(context.Background(), "", questions)
	if trRepo.reads != 1 || vi[0].Question != questions[0].Question {
		t.Errorf("locale rỗng: reads=%d q=%q", trRepo.reads, vi[0].Question)
	}
	var nilTr *ContentTranslator
	if got := nilTr.TranslateChallengeQuestions(context.Background(), "en", questions); len(got) != 3 || got[1].Question != questions[1].Question {
		t.Errorf("translator nil: %+v", got)
	}
}

func TestContentTranslationWorkerMissionsAndChallenge(t *testing.T) {
	m, q := uuid.New().String(), uuid.New().String()
	repo := &fakeTranslationRepo{
		missions: []db.ListMissionTranslationSourcesRow{
			{ID: m, Title: "Ôn tập 10 từ", Description: "Daily review"}, // mô tả tiếng Anh → ghi nguyên văn, không gửi AI
		},
		chQs: []db.ListChallengeQuestionTranslationSourcesRow{{ID: q, Question: "She ___ to school."}},
	}
	ai := &fakeTranslateAI{}
	w := &contentTranslationWorker{repo: repo, ai: ai, sources: contentTranslationSources, locales: []string{"en"}, batchSize: 40}
	if err := w.runRound(context.Background()); err != nil {
		t.Fatal(err)
	}
	if ai.calls != 1 || ai.sizes[0] != 1 {
		t.Fatalf("AI calls = %d sizes %v, want 1 lô 1 câu (chỉ tên nhiệm vụ tiếng Việt)", ai.calls, ai.sizes)
	}
	if got := repo.rows[trKey(translationEntityMission, m, translationFieldTitle, "en")].Text; got != "[English] Ôn tập 10 từ" {
		t.Errorf("mission title = %q", got)
	}
	if got := repo.rows[trKey(translationEntityMission, m, translationFieldDescription, "en")].Text; got != "Daily review" {
		t.Errorf("mission description = %q", got)
	}
	if got := repo.rows[trKey(translationEntityChallengeQuestion, q, translationFieldQuestion, "en")].Text; got != "She ___ to school." {
		t.Errorf("challenge question = %q", got)
	}
}
