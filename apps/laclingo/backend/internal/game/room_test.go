package game

import (
	"context"
	"encoding/json"
	"strings"
	"testing"

	"laclingo-backend/internal/repository/db"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

// fakeGameRepo — chỉ các hàm luồng bắt đầu ván / trả lời / kết thúc câu dùng
type fakeGameRepo struct {
	Repository
	questions    []db.ListGameRoomQuestionsRow
	participants []db.ListGameParticipantsRow
	scores       map[[16]byte]int32 // participant → tổng điểm
	answers      []db.SubmitGameAnswerParams
}

func (f *fakeGameRepo) StartGameRoom(context.Context, pgtype.UUID) (db.GameRoom, error) {
	return db.GameRoom{TimePerQuestionSeconds: 20}, nil
}

func (f *fakeGameRepo) ListGameRoomQuestions(context.Context, pgtype.UUID) ([]db.ListGameRoomQuestionsRow, error) {
	return f.questions, nil
}

func (f *fakeGameRepo) ListGameParticipants(context.Context, pgtype.UUID) ([]db.ListGameParticipantsRow, error) {
	return f.participants, nil
}

func (f *fakeGameRepo) SubmitGameAnswer(_ context.Context, arg db.SubmitGameAnswerParams) (db.SubmitGameAnswerRow, error) {
	f.answers = append(f.answers, arg)
	f.scores[arg.ParticipantID.Bytes] += arg.PointsEarned
	return db.SubmitGameAnswerRow{NewTotalScore: f.scores[arg.ParticipantID.Bytes]}, nil
}

func (f *fakeGameRepo) GetLeaderboard(context.Context, pgtype.UUID) ([]db.GetLeaderboardRow, error) {
	return nil, nil
}

func (f *fakeGameRepo) FinishGameRoom(context.Context, pgtype.UUID) (db.GameRoom, error) {
	return db.GameRoom{}, nil
}

// fakeQuestionTranslator — "en" dịch câu hỏi + lựa chọn (giữ thứ tự), đếm số lần dịch theo ngôn ngữ
type fakeQuestionTranslator struct{ calls map[string]int }

func (f *fakeQuestionTranslator) TranslateChallengeQuestions(_ context.Context, locale string, qs []db.ListGameRoomQuestionsRow) []db.ListGameRoomQuestionsRow {
	f.calls[locale]++
	out := make([]db.ListGameRoomQuestionsRow, len(qs))
	copy(out, qs)
	if locale != "en" {
		return out
	}
	for i := range out {
		var opts []string
		_ = json.Unmarshal(out[i].Options, &opts)
		for j := range opts {
			opts[j] = "EN " + opts[j]
		}
		out[i].Question = "EN " + out[i].Question
		out[i].Options, _ = json.Marshal(opts)
	}
	return out
}

func testClient(userID uuid.UUID, locale string) *Client {
	return &Client{userID: userID, locale: locale, send: make(chan []byte, 64)}
}

// drain trả các message (type → data) client đã nhận theo thứ tự
func drain(t *testing.T, c *Client) []serverEnvelope {
	t.Helper()
	var out []serverEnvelope
	for {
		select {
		case raw := <-c.send:
			var env struct {
				Type string          `json:"type"`
				Data json.RawMessage `json:"data"`
			}
			if err := json.Unmarshal(raw, &env); err != nil {
				t.Fatal(err)
			}
			out = append(out, serverEnvelope{Type: env.Type, Data: env.Data})
		default:
			return out
		}
	}
}

func lastOfType[T any](t *testing.T, msgs []serverEnvelope, msgType string) T {
	t.Helper()
	var v T
	found := false
	for _, m := range msgs {
		if m.Type == msgType {
			found = true
			if err := json.Unmarshal(m.Data.(json.RawMessage), &v); err != nil {
				t.Fatal(err)
			}
		}
	}
	if !found {
		t.Fatalf("không nhận được %s (có %v)", msgType, msgs)
	}
	return v
}

// Phòng 2 người khác ngôn ngữ giao diện: mỗi người nhận câu hỏi theo ngôn ngữ của mình (cùng chỉ số câu / lựa chọn),
// chấm theo chỉ số lựa chọn nên cả 2 cùng chọn đúng đều được điểm, chọn sai thì 0 — không phụ thuộc ngôn ngữ.
func TestRoomMixedLocaleQuestionsAndScoring(t *testing.T) {
	host, guest := uuid.New(), uuid.New()
	hostPart, guestPart := uuid.New(), uuid.New()
	repo := &fakeGameRepo{
		questions: []db.ListGameRoomQuestionsRow{
			{ID: toPgUUID(uuid.New()), Question: "Từ nào nghĩa là con mèo?", Options: []byte(`["猫","狗"]`), CorrectIndex: 0},
			{ID: toPgUUID(uuid.New()), Question: "Chọn nghĩa của 狗", Options: []byte(`["con mèo","con chó","con gà"]`), CorrectIndex: 1},
		},
		participants: []db.ListGameParticipantsRow{
			{ID: toPgUUID(hostPart), UserID: toPgUUID(host)},
			{ID: toPgUUID(guestPart), UserID: toPgUUID(guest)},
		},
		scores: map[[16]byte]int32{},
	}
	tr := &fakeQuestionTranslator{calls: map[string]int{}}
	r := newRoom(uuid.New(), host, NewHub(repo, nil, tr), repo)
	hostC, guestC := testClient(host, "en"), testClient(guest, "")
	r.handleRegister(hostC)
	r.handleRegister(guestC)
	r.lobbyReady[guest] = true

	r.handleStartGame(roomCommand{client: hostC, userID: host, msg: ClientMessage{Type: clientMsgStartGame}})
	t.Cleanup(r.stopQuestionTimer)

	enQ := lastOfType[questionPayload](t, drain(t, hostC), serverMsgQuestion)
	viQ := lastOfType[questionPayload](t, drain(t, guestC), serverMsgQuestion)
	if enQ.Index != 0 || enQ.Question != "EN Từ nào nghĩa là con mèo?" || strings.Join(enQ.Options, "|") != "EN 猫|EN 狗" {
		t.Errorf("host (en) câu 0 = %+v", enQ)
	}
	if viQ.Index != 0 || viQ.Question != "Từ nào nghĩa là con mèo?" || strings.Join(viQ.Options, "|") != "猫|狗" {
		t.Errorf("guest (vi) câu 0 = %+v", viQ)
	}

	// Câu 0: cả 2 chọn lựa chọn 0 (đúng) trên bản hiển thị của mình
	r.handleSubmitAnswer(roomCommand{client: hostC, userID: host, msg: ClientMessage{Type: clientMsgSubmitAnswer, QuestionIndex: 0, SelectedIndex: 0}})
	if res := lastOfType[answerResultPayload](t, drain(t, hostC), serverMsgAnswerResult); !res.Correct || res.PointsEarned == 0 {
		t.Errorf("host đúng câu 0: %+v", res)
	}
	r.handleSubmitAnswer(roomCommand{client: guestC, userID: guest, msg: ClientMessage{Type: clientMsgSubmitAnswer, QuestionIndex: 0, SelectedIndex: 0}})
	guestMsgs := drain(t, guestC)
	if res := lastOfType[answerResultPayload](t, guestMsgs, serverMsgAnswerResult); !res.Correct || res.PointsEarned == 0 {
		t.Errorf("guest đúng câu 0: %+v", res)
	}
	// Mọi người đã trả lời → sang câu 1, vẫn theo ngôn ngữ của từng người (bản dịch dùng lại, không dịch lại)
	if ended := lastOfType[questionEndedPayload](t, guestMsgs, serverMsgQuestionEnded); ended.CorrectIndex != 0 {
		t.Errorf("question_ended = %+v", ended)
	}
	if q := lastOfType[questionPayload](t, guestMsgs, serverMsgQuestion); q.Index != 1 || q.Question != "Chọn nghĩa của 狗" {
		t.Errorf("guest câu 1 = %+v", q)
	}
	hostMsgs := drain(t, hostC)
	if q := lastOfType[questionPayload](t, hostMsgs, serverMsgQuestion); q.Index != 1 || strings.Join(q.Options, "|") != "EN con mèo|EN con chó|EN con gà" {
		t.Errorf("host câu 1 = %+v", q)
	}

	// Câu 1: host chọn sai (0), guest chọn đúng (1)
	r.handleSubmitAnswer(roomCommand{client: hostC, userID: host, msg: ClientMessage{Type: clientMsgSubmitAnswer, QuestionIndex: 1, SelectedIndex: 0}})
	if res := lastOfType[answerResultPayload](t, drain(t, hostC), serverMsgAnswerResult); res.Correct || res.PointsEarned != 0 {
		t.Errorf("host sai câu 1: %+v", res)
	}
	r.handleSubmitAnswer(roomCommand{client: guestC, userID: guest, msg: ClientMessage{Type: clientMsgSubmitAnswer, QuestionIndex: 1, SelectedIndex: 1}})
	if res := lastOfType[answerResultPayload](t, drain(t, guestC), serverMsgAnswerResult); !res.Correct {
		t.Errorf("guest đúng câu 1: %+v", res)
	}
	if r.status != "finished" {
		t.Errorf("status = %s, want finished", r.status)
	}
	if tr.calls["en"] != 1 || len(tr.calls) != 1 {
		t.Errorf("số lần dịch = %v, want en 1 lần (vi không dịch)", tr.calls)
	}
	if len(repo.answers) != 4 {
		t.Fatalf("answers = %d, want 4", len(repo.answers))
	}
	correct := map[pgtype.UUID]int32{repo.questions[0].ID: 0, repo.questions[1].ID: 1}
	for _, a := range repo.answers {
		if a.IsCorrect != (a.SelectedIndex.Int32 == correct[a.QuestionID]) {
			t.Errorf("chấm sai: %+v", a)
		}
	}
}

// Không có bộ dịch (hub nil translator) → mọi người nhận câu hỏi gốc
func TestRoomQuestionWithoutTranslator(t *testing.T) {
	host := uuid.New()
	repo := &fakeGameRepo{
		questions:    []db.ListGameRoomQuestionsRow{{ID: toPgUUID(uuid.New()), Question: "Câu hỏi", Options: []byte(`["a","b"]`)}},
		participants: []db.ListGameParticipantsRow{{ID: toPgUUID(uuid.New()), UserID: toPgUUID(host)}},
		scores:       map[[16]byte]int32{},
	}
	r := newRoom(uuid.New(), host, NewHub(repo, nil, nil), repo)
	c := testClient(host, "ja")
	r.handleRegister(c)
	r.handleStartGame(roomCommand{client: c, userID: host, msg: ClientMessage{Type: clientMsgStartGame}})
	t.Cleanup(r.stopQuestionTimer)
	if q := lastOfType[questionPayload](t, drain(t, c), serverMsgQuestion); q.Question != "Câu hỏi" {
		t.Errorf("q = %+v", q)
	}
}
