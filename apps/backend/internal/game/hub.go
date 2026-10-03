package game

import (
	"sync"

	"github.com/google/uuid"
)

// Hub quản lý các Room đang hoạt động. Mỗi Room có goroutine run() riêng; Hub
// chỉ giữ map tra cứu nên cần mutex riêng cho chính map đó (nhiều request WS
// có thể gọi GetOrCreateRoom đồng thời) — không liên quan tới mutex-free design
// bên trong Room.
type Hub struct {
	mu    sync.Mutex
	rooms map[uuid.UUID]*Room
	repo  Repository
}

func NewHub(repo Repository) *Hub {
	return &Hub{rooms: make(map[uuid.UUID]*Room), repo: repo}
}

// GetOrCreateRoom trả về Room đang chạy cho roomID, tạo mới (và chạy goroutine
// run()) nếu chưa có.
func (h *Hub) GetOrCreateRoom(roomID, hostUserID uuid.UUID) *Room {
	h.mu.Lock()
	defer h.mu.Unlock()

	if r, ok := h.rooms[roomID]; ok {
		return r
	}

	r := newRoom(roomID, hostUserID, h, h.repo)
	h.rooms[roomID] = r
	go r.run()
	return r
}

// NotifyParticipantJoined báo cho Room đang chạy (nếu đã có ai kết nối) biết 1
// participant mới vừa được thêm qua REST (invite bằng username) — để những
// người đang xem thấy ngay qua broadcast, không cần tự reload. No-op nếu
// chưa ai mở WebSocket tới phòng này (Room chưa được tạo trong Hub).
func (h *Hub) NotifyParticipantJoined(roomID, userID uuid.UUID) {
	h.mu.Lock()
	r, ok := h.rooms[roomID]
	h.mu.Unlock()
	if ok {
		r.send(roomCommand{userID: userID, msg: ClientMessage{Type: internalMsgParticipantAdded}})
	}
}

// reap xoá room khỏi map khi goroutine run() của nó đã kết thúc (phòng finished
// hoặc cancelled và không còn ai kết nối) — tránh leak goroutine/map entry cho
// mọi phòng đã từng chơi.
func (h *Hub) reap(roomID uuid.UUID) {
	h.mu.Lock()
	delete(h.rooms, roomID)
	h.mu.Unlock()
}
