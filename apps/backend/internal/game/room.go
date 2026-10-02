package game

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"time"

	"laclingo-backend/internal/repository/db"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

const idleLobbyTimeout = 10 * time.Minute

type roomCommand struct {
	client *Client
	userID uuid.UUID
	msg    ClientMessage
}

type participantState struct {
	participantID    uuid.UUID
	score            int32
	answeredCurrentQ bool
}

// Room điều phối 1 phòng chơi. CHỈ goroutine run() được đọc/sửa các field dưới
// đây — mọi sự kiện bên ngoài (connect/disconnect, submit answer, start game,
// timer) đi qua channel vào 1 select loop duy nhất, nên không có race thật
// trên state của Room và không cần mutex cho các field này.
type Room struct {
	id         uuid.UUID
	hostUserID uuid.UUID
	hub        *Hub
	repo       Repository

	status      string
	questions   []db.ListGameRoomQuestionsRow
	questionIdx int
	timePerQ    time.Duration

	questionStartedAt time.Time
	questionTimer     *time.Timer
	idleTimer         *time.Timer

	clients      map[uuid.UUID]*Client
	participants map[uuid.UUID]*participantState

	registerCh   chan *Client
	unregisterCh chan *Client
	commandCh    chan roomCommand
	done         chan struct{}
}

func newRoom(id, hostUserID uuid.UUID, hub *Hub, repo Repository) *Room {
	return &Room{
		id:           id,
		hostUserID:   hostUserID,
		hub:          hub,
		repo:         repo,
		status:       "waiting",
		clients:      make(map[uuid.UUID]*Client),
		participants: make(map[uuid.UUID]*participantState),
		registerCh:   make(chan *Client),
		unregisterCh: make(chan *Client),
		commandCh:    make(chan roomCommand, 32),
		done:         make(chan struct{}),
	}
}

// Join đưa 1 kết nối WS vào phòng. Trả về false nếu phòng đã đóng (goroutine
// run() đã kết thúc) — khi đó caller tự đóng kết nối.
func (r *Room) Join(c *Client) bool {
	select {
	case r.registerCh <- c:
		return true
	case <-r.done:
		return false
	}
}

func (r *Room) unregister(c *Client) {
	select {
	case r.unregisterCh <- c:
	case <-r.done:
	}
}

func (r *Room) send(cmd roomCommand) {
	select {
	case r.commandCh <- cmd:
	case <-r.done:
	}
}

func timerChan(t *time.Timer) <-chan time.Time {
	if t == nil {
		return nil
	}
	return t.C
}

func (r *Room) run() {
	defer close(r.done)
	defer r.hub.reap(r.id)
	defer r.stopQuestionTimer()
	defer r.stopIdleTimer()

	for {
		select {
		case c := <-r.registerCh:
			r.handleRegister(c)
		case c := <-r.unregisterCh:
			if r.handleUnregister(c) {
				return
			}
		case cmd := <-r.commandCh:
			r.handleCommand(cmd)
		case <-timerChan(r.questionTimer):
			r.questionTimer = nil
			r.endQuestion()
		case <-timerChan(r.idleTimer):
			r.idleTimer = nil
			r.status = "cancelled"
			return
		}
	}
}

func (r *Room) handleRegister(c *Client) {
	r.stopIdleTimer()
	r.clients[c.userID] = c
	r.broadcast(serverMsgParticipantJoined, participantPayload{UserID: c.userID})
}

// handleUnregister trả về true nếu room loop nên dừng hẳn (phòng đã kết thúc
// và không còn ai kết nối).
func (r *Room) handleUnregister(c *Client) bool {
	if cur, ok := r.clients[c.userID]; !ok || cur != c {
		return false // đã bị thay bởi kết nối mới hơn của cùng user, hoặc đã xử lý rồi
	}
	delete(r.clients, c.userID)
	close(c.send)
	r.broadcast(serverMsgParticipantLeft, participantPayload{UserID: c.userID})

	// Người chơi rời giữa lúc đang chơi không được block cả phòng chờ hết giờ.
	if r.status == "in_progress" && r.allConnectedAnswered() {
		r.stopQuestionTimer()
		r.endQuestion()
	}

	if len(r.clients) == 0 {
		if r.status == "finished" || r.status == "cancelled" {
			return true
		}
		r.resetIdleTimer()
	}
	return false
}

func (r *Room) handleCommand(cmd roomCommand) {
	switch cmd.msg.Type {
	case clientMsgStartGame:
		r.handleStartGame(cmd)
	case clientMsgSubmitAnswer:
		r.handleSubmitAnswer(cmd)
	default:
		cmd.client.sendError("unknown_type", "loại message không hợp lệ")
	}
}

func (r *Room) handleStartGame(cmd roomCommand) {
	if cmd.userID != r.hostUserID {
		cmd.client.sendError("forbidden", "chỉ chủ phòng mới bắt đầu được trò chơi")
		return
	}
	if r.status != "waiting" {
		cmd.client.sendError("already_started", "trò chơi đã bắt đầu hoặc đã kết thúc")
		return
	}

	ctx := context.Background()
	startedRoom, err := r.repo.StartGameRoom(ctx, toPgUUID(r.id))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			cmd.client.sendError("already_started", "trò chơi đã bắt đầu hoặc đã kết thúc")
			return
		}
		log.Printf("❌ game: StartGameRoom room=%s: %v", r.id, err)
		cmd.client.sendError("internal_error", "không thể bắt đầu trò chơi")
		return
	}

	questions, err := r.repo.ListGameRoomQuestions(ctx, toPgUUID(r.id))
	if err != nil || len(questions) == 0 {
		log.Printf("❌ game: room %s thiếu câu hỏi hoặc lỗi tải câu hỏi: %v", r.id, err)
		cmd.client.sendError("internal_error", "phòng chơi thiếu câu hỏi, không thể bắt đầu")
		return
	}

	rows, err := r.repo.ListGameParticipants(ctx, toPgUUID(r.id))
	if err != nil {
		cmd.client.sendError("internal_error", "không thể tải danh sách người chơi")
		return
	}
	r.participants = make(map[uuid.UUID]*participantState, len(rows))
	for _, p := range rows {
		r.participants[uuid.UUID(p.UserID.Bytes)] = &participantState{
			participantID: uuid.UUID(p.ID.Bytes),
			score:         p.Score,
		}
	}

	r.questions = questions
	r.timePerQ = time.Duration(startedRoom.TimePerQuestionSeconds) * time.Second
	r.status = "in_progress"
	r.broadcast(serverMsgGameStarted, gameStartedPayload{
		TotalQuestions:         len(r.questions),
		TimePerQuestionSeconds: int(startedRoom.TimePerQuestionSeconds),
	})
	r.startQuestion(0)
}

func (r *Room) startQuestion(idx int) {
	if idx >= len(r.questions) {
		r.finishGame()
		return
	}
	r.questionIdx = idx
	r.questionStartedAt = time.Now()
	for _, p := range r.participants {
		p.answeredCurrentQ = false
	}

	q := r.questions[idx]
	options := decodeOptions(q.Options)

	r.broadcast(serverMsgQuestion, questionPayload{
		Index:            idx,
		Total:            len(r.questions),
		Question:         q.Question,
		Options:          options,
		TimeLimitSeconds: int(r.timePerQ / time.Second),
	})
	r.resetQuestionTimer(r.timePerQ)
}

func (r *Room) handleSubmitAnswer(cmd roomCommand) {
	if r.status != "in_progress" {
		cmd.client.sendError("not_in_progress", "trò chơi chưa bắt đầu hoặc đã kết thúc")
		return
	}
	participant, ok := r.participants[cmd.userID]
	if !ok {
		cmd.client.sendError("not_participant", "bạn chưa tham gia phòng này")
		return
	}
	if int(cmd.msg.QuestionIndex) != r.questionIdx {
		return // câu hỏi cũ/trễ — bỏ qua lặng lẽ
	}
	if participant.answeredCurrentQ {
		cmd.client.sendError("already_answered", "bạn đã trả lời câu hỏi này")
		return
	}

	q := r.questions[r.questionIdx]
	options := decodeOptions(q.Options)
	selected := int(cmd.msg.SelectedIndex)
	if selected < 0 || selected >= len(options) {
		cmd.client.sendError("invalid_answer", "lựa chọn không hợp lệ")
		return
	}

	elapsed := time.Since(r.questionStartedAt)
	isCorrect := selected == int(q.CorrectIndex)
	points := ComputePoints(isCorrect, elapsed, r.timePerQ)

	r.recordAnswer(cmd.client, participant, q.ID, pgtype.Int4{Int32: int32(selected), Valid: true}, isCorrect, points, elapsed)
	r.maybeAdvanceEarly()
}

// recordAnswer lưu câu trả lời + cộng điểm, rồi gửi answer_result riêng cho
// người trả lời (client == nil khi được gọi để tự "trả lời hộ" người hết giờ
// chưa trả lời trong endQuestion — không gửi answer_result cho trường hợp đó).
func (r *Room) recordAnswer(client *Client, p *participantState, questionID pgtype.UUID, selected pgtype.Int4, isCorrect bool, points int, elapsed time.Duration) {
	row, err := r.repo.SubmitGameAnswer(context.Background(), db.SubmitGameAnswerParams{
		RoomID:        toPgUUID(r.id),
		ParticipantID: toPgUUID(p.participantID),
		QuestionID:    questionID,
		SelectedIndex: selected,
		IsCorrect:     isCorrect,
		PointsEarned:  int32(points),
		TimeTakenMs:   int32(elapsed.Milliseconds()),
	})
	if err != nil {
		if !errors.Is(err, pgx.ErrNoRows) { // ErrNoRows = đã trả lời rồi (DB backstop)
			log.Printf("❌ game: SubmitGameAnswer room=%s participant=%s: %v", r.id, p.participantID, err)
		}
		return
	}

	p.answeredCurrentQ = true
	p.score = row.NewTotalScore

	if client != nil {
		client.sendJSON(serverMsgAnswerResult, answerResultPayload{
			QuestionIndex: r.questionIdx,
			Correct:       isCorrect,
			PointsEarned:  points,
			TotalScore:    row.NewTotalScore,
		})
	}
}

func (r *Room) maybeAdvanceEarly() {
	if r.allConnectedAnswered() {
		r.stopQuestionTimer()
		r.endQuestion()
	}
}

// allConnectedAnswered true khi mọi người chơi ĐANG KẾT NỐI đã trả lời câu hiện
// tại — người bị mất kết nối không được tính, để không block cả phòng.
func (r *Room) allConnectedAnswered() bool {
	if len(r.clients) == 0 {
		return false
	}
	for userID := range r.clients {
		p, ok := r.participants[userID]
		if !ok || !p.answeredCurrentQ {
			return false
		}
	}
	return true
}

func (r *Room) endQuestion() {
	q := r.questions[r.questionIdx]

	// Người chơi đang kết nối nhưng chưa trả lời -> tính như hết giờ (0 điểm).
	for userID, c := range r.clients {
		p, ok := r.participants[userID]
		if !ok || p.answeredCurrentQ {
			continue
		}
		r.recordAnswer(c, p, q.ID, pgtype.Int4{}, false, 0, r.timePerQ)
	}

	leaderboard, err := r.repo.GetLeaderboard(context.Background(), toPgUUID(r.id))
	if err != nil {
		log.Printf("❌ game: GetLeaderboard room=%s: %v", r.id, err)
	}

	r.broadcast(serverMsgQuestionEnded, questionEndedPayload{
		Index:        r.questionIdx,
		CorrectIndex: int(q.CorrectIndex),
		Leaderboard:  toLeaderboardPayload(leaderboard),
	})

	r.startQuestion(r.questionIdx + 1)
}

func (r *Room) finishGame() {
	if _, err := r.repo.FinishGameRoom(context.Background(), toPgUUID(r.id)); err != nil && !errors.Is(err, pgx.ErrNoRows) {
		log.Printf("❌ game: FinishGameRoom room=%s: %v", r.id, err)
	}
	r.status = "finished"
	r.stopQuestionTimer()

	leaderboard, err := r.repo.GetLeaderboard(context.Background(), toPgUUID(r.id))
	if err != nil {
		log.Printf("❌ game: GetLeaderboard (finish) room=%s: %v", r.id, err)
	}
	r.broadcast(serverMsgGameFinished, gameFinishedPayload{Leaderboard: toLeaderboardPayload(leaderboard)})
}

func (r *Room) broadcast(msgType string, data any) {
	for _, c := range r.clients {
		c.sendJSON(msgType, data)
	}
}

func (r *Room) resetQuestionTimer(d time.Duration) {
	r.stopQuestionTimer()
	r.questionTimer = time.NewTimer(d)
}

func (r *Room) stopQuestionTimer() {
	if r.questionTimer != nil {
		r.questionTimer.Stop()
		r.questionTimer = nil
	}
}

func (r *Room) resetIdleTimer() {
	r.stopIdleTimer()
	r.idleTimer = time.NewTimer(idleLobbyTimeout)
}

func (r *Room) stopIdleTimer() {
	if r.idleTimer != nil {
		r.idleTimer.Stop()
		r.idleTimer = nil
	}
}

func decodeOptions(raw []byte) []string {
	var options []string
	if err := json.Unmarshal(raw, &options); err != nil {
		log.Printf("❌ game: parse options lỗi: %v", err)
	}
	return options
}

func toLeaderboardPayload(rows []db.GetLeaderboardRow) []leaderboardEntryPayload {
	out := make([]leaderboardEntryPayload, 0, len(rows))
	for _, row := range rows {
		out = append(out, leaderboardEntryPayload{
			UserID:   uuid.UUID(row.UserID.Bytes),
			Username: row.Username,
			Score:    row.Score,
			Rank:     row.Rank,
		})
	}
	return out
}
