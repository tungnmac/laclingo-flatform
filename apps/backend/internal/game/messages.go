package game

import "github.com/google/uuid"

// ClientMessage là message JSON client gửi lên server qua WebSocket.
type ClientMessage struct {
	Type          string `json:"type"`
	QuestionIndex int32  `json:"question_index"`
	SelectedIndex int32  `json:"selected_index"`
}

// Các loại message client -> server.
const (
	clientMsgStartGame    = "start_game"
	clientMsgSubmitAnswer = "submit_answer"
)

// Các loại message server -> client.
const (
	serverMsgParticipantJoined = "participant_joined"
	serverMsgParticipantLeft   = "participant_left"
	serverMsgGameStarted       = "game_started"
	serverMsgQuestion          = "question"
	serverMsgQuestionEnded     = "question_ended"
	serverMsgGameFinished      = "game_finished"
	serverMsgAnswerResult      = "answer_result"
	serverMsgError             = "error"
)

type serverEnvelope struct {
	Type string `json:"type"`
	Data any    `json:"data,omitempty"`
}

type participantPayload struct {
	UserID uuid.UUID `json:"user_id"`
}

type gameStartedPayload struct {
	TotalQuestions         int `json:"total_questions"`
	TimePerQuestionSeconds int `json:"time_per_question_seconds"`
}

// questionPayload KHÔNG có correct_index — câu trả lời đúng chỉ tiết lộ ở
// question_ended, sau khi hết giờ/mọi người đã trả lời.
type questionPayload struct {
	Index            int      `json:"index"`
	Total            int      `json:"total"`
	Question         string   `json:"question"`
	Options          []string `json:"options"`
	TimeLimitSeconds int      `json:"time_limit_seconds"`
}

type leaderboardEntryPayload struct {
	UserID   uuid.UUID `json:"user_id"`
	Username string    `json:"username"`
	Score    int32     `json:"score"`
	Rank     int64     `json:"rank"`
}

type questionEndedPayload struct {
	Index        int                       `json:"index"`
	CorrectIndex int                       `json:"correct_index"`
	Leaderboard  []leaderboardEntryPayload `json:"leaderboard"`
}

type gameFinishedPayload struct {
	Leaderboard []leaderboardEntryPayload `json:"leaderboard"`
}

type answerResultPayload struct {
	QuestionIndex int   `json:"question_index"`
	Correct       bool  `json:"correct"`
	PointsEarned  int   `json:"points_earned"`
	TotalScore    int32 `json:"total_score"`
}

type errorPayload struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}
