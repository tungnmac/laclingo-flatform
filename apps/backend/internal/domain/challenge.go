package domain

import (
	"time"

	"github.com/google/uuid"
)

// CreateRoomRequest tạo 1 phòng thử thách mới — host lấy từ access token, không
// nhận từ body
type CreateRoomRequest struct {
	QuestionCount          int32  `json:"question_count" minimum:"1" maximum:"50" example:"10"`
	TimePerQuestionSeconds int32  `json:"time_per_question_seconds" minimum:"5" maximum:"120" example:"20"`
	LanguageID             string `json:"language_id,omitempty" example:"en"`
	Difficulty             int32  `json:"difficulty,omitempty" minimum:"1" maximum:"5" example:"2"`
	IsPractice             bool   `json:"is_practice,omitempty" example:"false"`
}

type CreateRoomResponse struct {
	ID                     uuid.UUID `json:"id" swaggertype:"string" format:"uuid"`
	Code                   string    `json:"code" example:"AB3K9Z"`
	Status                 string    `json:"status" example:"waiting"`
	QuestionCount          int32     `json:"question_count"`
	TimePerQuestionSeconds int32     `json:"time_per_question_seconds"`
	MaxParticipants        int32     `json:"max_participants"`
	IsPractice             bool      `json:"is_practice"`
	Difficulty             int32     `json:"difficulty,omitempty"`
}

// JoinRoomRequest tham gia phòng bằng mã — user lấy từ access token
type JoinRoomRequest struct {
	Code string `json:"code" example:"AB3K9Z"`
}

// InviteRequest — chỉ host mới gọi được, thêm trực tiếp 1 user vào phòng theo
// username (bỏ qua mã, tự gỡ ban nếu người này từng bị kick khỏi phòng).
type InviteRequest struct {
	Username string `json:"username" example:"nguyenvana"`
}

type ParticipantResponse struct {
	RoomID    uuid.UUID `json:"room_id" swaggertype:"string" format:"uuid"`
	UserID    uuid.UUID `json:"user_id" swaggertype:"string" format:"uuid"`
	Username  string    `json:"username,omitempty"`
	FullName  string    `json:"full_name,omitempty"`
	AvatarURL string    `json:"avatar_url,omitempty"`
	Score     int32     `json:"score"`
	JoinedAt  time.Time `json:"joined_at"`
}

type RoomDetailResponse struct {
	ID                     uuid.UUID             `json:"id" swaggertype:"string" format:"uuid"`
	Code                   string                `json:"code"`
	Status                 string                `json:"status"`
	HostUserID             uuid.UUID             `json:"host_user_id" swaggertype:"string" format:"uuid"`
	QuestionCount          int32                 `json:"question_count"`
	TimePerQuestionSeconds int32                 `json:"time_per_question_seconds"`
	IsPractice             bool                  `json:"is_practice"`
	Difficulty             int32                 `json:"difficulty,omitempty"`
	Participants           []ParticipantResponse `json:"participants"`
}

type LeaderboardEntryResponse struct {
	UserID    uuid.UUID `json:"user_id" swaggertype:"string" format:"uuid"`
	Username  string    `json:"username"`
	FullName  string    `json:"full_name,omitempty"`
	AvatarURL string    `json:"avatar_url,omitempty"`
	Score     int32     `json:"score"`
	Rank      int64     `json:"rank"`
}
