package game

import (
	"time"

	"github.com/google/uuid"
)

// ClientMessage là message JSON client gửi lên server qua WebSocket. Giữ 1
// struct phẳng với field optional cho từng loại message (đúng style đã có
// với question_index/selected_index) thay vì union type.
type ClientMessage struct {
	Type          string `json:"type"`
	QuestionIndex int32  `json:"question_index,omitempty"`
	SelectedIndex int32  `json:"selected_index,omitempty"`
	TargetUserID  string `json:"user_id,omitempty"` // kick
	Ready         bool   `json:"ready,omitempty"`   // set_ready
	Message       string `json:"message,omitempty"` // send_chat
	Emoji         string `json:"emoji,omitempty"`   // send_reaction
}

// Các loại message client -> server.
const (
	clientMsgStartGame    = "start_game"
	clientMsgSubmitAnswer = "submit_answer"
	clientMsgLeaveRoom    = "leave_room"
	clientMsgKick         = "kick"
	clientMsgSetReady     = "set_ready"
	clientMsgSendChat     = "send_chat"
	clientMsgSendReaction = "send_reaction"
)

// Các loại message server -> client.
const (
	serverMsgParticipantJoined = "participant_joined"
	serverMsgParticipantLeft   = "participant_left"
	serverMsgParticipantKicked = "participant_kicked"
	serverMsgParticipantReady  = "participant_ready"
	serverMsgGameStarted       = "game_started"
	serverMsgQuestion          = "question"
	serverMsgQuestionEnded     = "question_ended"
	serverMsgGameFinished      = "game_finished"
	serverMsgAnswerResult      = "answer_result"
	serverMsgChatMessage       = "chat_message"
	serverMsgReaction          = "reaction"
	serverMsgKicked            = "kicked" // gửi riêng cho người bị kick, không broadcast
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

type participantReadyPayload struct {
	UserID uuid.UUID `json:"user_id"`
	Ready  bool      `json:"ready"`
}

type chatMessagePayload struct {
	UserID  uuid.UUID `json:"user_id"`
	Message string    `json:"message"`
	SentAt  time.Time `json:"sent_at"`
}

type reactionPayload struct {
	UserID uuid.UUID `json:"user_id"`
	Emoji  string    `json:"emoji"`
}

// kickedPayload gửi riêng cho người bị kick — không broadcast cho cả phòng.
type kickedPayload struct {
	Reason string `json:"reason"`
}
