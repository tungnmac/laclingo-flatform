package game

import (
	"encoding/json"
	"log"
	"time"

	"github.com/gofiber/contrib/websocket"
	"github.com/google/uuid"
)

const (
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = (pongWait * 9) / 10
	sendBufferSize = 16
)

// Client bọc 1 kết nối WebSocket của 1 người chơi trong 1 phòng.
type Client struct {
	conn   *websocket.Conn
	room   *Room
	userID uuid.UUID
	send   chan []byte
}

func NewClient(conn *websocket.Conn, room *Room, userID uuid.UUID) *Client {
	return &Client{conn: conn, room: room, userID: userID, send: make(chan []byte, sendBufferSize)}
}

// ReadPump đọc message từ client, parse và đẩy vào room loop. Block tới khi
// kết nối lỗi/đóng — lúc đó tự unregister khỏi room. Gọi trực tiếp (không
// `go`), chạy trên goroutine của request WS.
func (c *Client) ReadPump() {
	defer c.room.unregister(c)

	_ = c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error {
		return c.conn.SetReadDeadline(time.Now().Add(pongWait))
	})

	for {
		_, data, err := c.conn.ReadMessage()
		if err != nil {
			return
		}

		var msg ClientMessage
		if err := json.Unmarshal(data, &msg); err != nil {
			c.sendError("invalid_message", "dữ liệu gửi lên không hợp lệ")
			continue
		}
		c.room.send(roomCommand{client: c, userID: c.userID, msg: msg})
	}
}

// WritePump gửi message từ send channel ra kết nối, kèm ping giữ kết nối sống
// (bắt buộc — thiếu ping/pong thì 1 kết nối "chết" không đóng sạch TCP sẽ khiến
// room phải chờ hết giờ mỗi câu thay vì phát hiện người chơi đã rời).
func (c *Client) WritePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		_ = c.conn.Close()
	}()

	for {
		select {
		case data, ok := <-c.send:
			if !ok {
				_ = c.conn.WriteMessage(websocket.CloseMessage, nil)
				return
			}
			_ = c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.TextMessage, data); err != nil {
				return
			}
		case <-ticker.C:
			_ = c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func (c *Client) sendJSON(msgType string, data any) {
	payload, err := json.Marshal(serverEnvelope{Type: msgType, Data: data})
	if err != nil {
		log.Printf("❌ game: marshal message %s: %v", msgType, err)
		return
	}
	select {
	case c.send <- payload:
	default:
		// Send buffer đầy (client chậm/đứng) — bỏ qua thay vì block room loop.
		log.Printf("⚠️ game: send buffer đầy cho client %s, bỏ qua message %s", c.userID, msgType)
	}
}

func (c *Client) sendError(code, message string) {
	c.sendJSON(serverMsgError, errorPayload{Code: code, Message: message})
}
