package handler

import (
	"context"

	"laclingo-backend/internal/domain"
	"laclingo-backend/internal/game"
	"laclingo-backend/internal/service"

	"github.com/gofiber/contrib/websocket"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type ChallengeHandler struct {
	svc *service.ChallengeService
	hub *game.Hub
}

func NewChallengeHandler(svc *service.ChallengeService, hub *game.Hub) *ChallengeHandler {
	return &ChallengeHandler{svc: svc, hub: hub}
}

func (h *ChallengeHandler) RegisterRoutes(router fiber.Router) {
	api := router.Group("/challenges/rooms")
	api.Post("/", h.CreateRoom)
	api.Post("/join", h.JoinRoom)
	api.Get("/:id", h.GetRoom)
	api.Get("/:id/leaderboard", h.GetLeaderboard)
}

// RegisterWSRoute đăng ký endpoint WebSocket /challenges/rooms/:id/ws. Tách
// riêng khỏi RegisterRoutes vì cần đăng ký trên group KHÔNG có RequireAuth
// (header-only) — WS tự xác thực riêng qua RequireAuthWS (query ?token=).
func (h *ChallengeHandler) RegisterWSRoute(router fiber.Router, tokens TokenParser) {
	ws := router.Group("/challenges/rooms/:id/ws", RequireAuthWS(tokens))
	ws.Get("", websocket.New(h.HandleWS))
}

// CreateRoom tạo 1 phòng thử thách mới, chọn ngẫu nhiên đủ câu hỏi theo bộ lọc.
//
// @Summary      Tạo phòng thử thách
// @Tags         challenges
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body  body      domain.CreateRoomRequest  true  "Cấu hình phòng"
// @Success      200   {object}  domain.CreateRoomResponse
// @Failure      400   {object}  ErrorResponse
// @Failure      401   {object}  ErrorResponse
// @Router       /challenges/rooms [post]
func (h *ChallengeHandler) CreateRoom(c *fiber.Ctx) error {
	var req domain.CreateRoomRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}

	result, err := h.svc.CreateRoom(c.UserContext(), currentUserID(c), req)
	if err != nil {
		return err
	}
	return c.JSON(result)
}

// JoinRoom cho user hiện tại tham gia 1 phòng bằng mã.
//
// @Summary      Tham gia phòng bằng mã
// @Tags         challenges
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body  body      domain.JoinRoomRequest  true  "Mã phòng"
// @Success      200   {object}  domain.ParticipantResponse
// @Failure      400   {object}  ErrorResponse
// @Failure      401   {object}  ErrorResponse
// @Failure      404   {object}  ErrorResponse
// @Failure      409   {object}  ErrorResponse
// @Router       /challenges/rooms/join [post]
func (h *ChallengeHandler) JoinRoom(c *fiber.Ctx) error {
	var req domain.JoinRoomRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}

	result, err := h.svc.JoinRoom(c.UserContext(), currentUserID(c), req.Code)
	if err != nil {
		return err
	}
	return c.JSON(result)
}

// GetRoom trả về thông tin phòng + danh sách người tham gia (không gồm nội
// dung câu hỏi).
//
// @Summary      Thông tin phòng thử thách
// @Tags         challenges
// @Produce      json
// @Security     BearerAuth
// @Param        id   path      string  true  "Room ID"
// @Success      200  {object}  domain.RoomDetailResponse
// @Failure      401  {object}  ErrorResponse
// @Failure      404  {object}  ErrorResponse
// @Router       /challenges/rooms/{id} [get]
func (h *ChallengeHandler) GetRoom(c *fiber.Ctx) error {
	roomID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "room id không hợp lệ")
	}

	result, err := h.svc.GetRoom(c.UserContext(), roomID)
	if err != nil {
		return err
	}
	return c.JSON(result)
}

// GetLeaderboard trả về bảng xếp hạng hiện tại của phòng.
//
// @Summary      Bảng xếp hạng phòng thử thách
// @Tags         challenges
// @Produce      json
// @Security     BearerAuth
// @Param        id   path      string  true  "Room ID"
// @Success      200  {array}   domain.LeaderboardEntryResponse
// @Failure      401  {object}  ErrorResponse
// @Failure      404  {object}  ErrorResponse
// @Router       /challenges/rooms/{id}/leaderboard [get]
func (h *ChallengeHandler) GetLeaderboard(c *fiber.Ctx) error {
	roomID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "room id không hợp lệ")
	}

	result, err := h.svc.GetLeaderboard(c.UserContext(), roomID)
	if err != nil {
		return err
	}
	return c.JSON(result)
}

// HandleWS xử lý kết nối WebSocket thực tế của 1 người chơi trong phòng. Token
// hợp lệ (đã qua RequireAuthWS) chỉ xác thực DANH TÍNH — còn phải là host hoặc
// đã tham gia phòng (POST .../join trước đó) mới được kết nối vào phòng này.
func (h *ChallengeHandler) HandleWS(conn *websocket.Conn) {
	userID, _ := conn.Locals(userIDKey).(uuid.UUID)
	roomID, err := uuid.Parse(conn.Params("id"))
	if err != nil {
		_ = conn.Close()
		return
	}

	room, err := h.svc.GetRoom(context.Background(), roomID)
	if err != nil {
		_ = conn.Close()
		return
	}

	isParticipant := room.HostUserID == userID
	for _, p := range room.Participants {
		if p.UserID == userID {
			isParticipant = true
			break
		}
	}
	if !isParticipant {
		_ = conn.Close()
		return
	}

	gameRoom := h.hub.GetOrCreateRoom(roomID, room.HostUserID)
	client := game.NewClient(conn, gameRoom, userID)
	if !gameRoom.Join(client) {
		_ = conn.Close()
		return
	}

	go client.WritePump()
	client.ReadPump()
}
