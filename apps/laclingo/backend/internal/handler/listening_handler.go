package handler

import (
	"path/filepath"
	"strings"

	"laclingo-backend/internal/service"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type ListeningHandler struct {
	svc *service.ListeningService
}

func NewListeningHandler(svc *service.ListeningService) *ListeningHandler {
	return &ListeningHandler{svc: svc}
}

func (h *ListeningHandler) RegisterRoutes(router fiber.Router) {
	router.Get("/languages/:id/listening", h.ListPassages)
	router.Get("/listening/topics", h.ListTopics)
	router.Get("/listening/passages/:id", h.GetPassage)
}

// RegisterProtectedRoutes gắn route cần đăng nhập (submit cần biết user để ghi nhận nhiệm vụ).
func (h *ListeningHandler) RegisterProtectedRoutes(router fiber.Router) {
	router.Post("/listening/questions/:id/submit", h.SubmitAnswer)
}

// RegisterAdminRoutes gắn route quản lý nội dung luyện nghe — PHẢI nằm sau
// RequireModule trong chain (đăng ký ở router.go).
func (h *ListeningHandler) RegisterAdminRoutes(router fiber.Router) {
	passages := router.Group("/admin/listening/passages")
	passages.Post("", h.CreatePassage)
	passages.Get("", h.ListPassagesAdmin)
	passages.Put("/:id", h.UpdatePassage)
	passages.Delete("/:id", h.DeletePassage)
	passages.Post("/bulk", h.BulkImportPassages)
	passages.Post("/:id/audio", h.UploadAudio)
	passages.Delete("/:id/audio", h.DeleteAudio)

	topics := router.Group("/admin/listening/topics")
	topics.Post("", h.CreateOrUpdateTopic)
	topics.Get("", h.ListTopicsAdmin)
	topics.Delete("", h.DeleteTopic)
	topics.Post("/bulk", h.BulkImportTopics)

	questions := router.Group("/admin/listening/questions")
	questions.Post("", h.CreateQuestionAdmin)
	questions.Get("", h.ListQuestionsAdmin)
	questions.Put("/:id", h.UpdateQuestionAdmin)
	questions.Delete("/:id", h.DeleteQuestionAdmin)
	questions.Post("/bulk", h.BulkImportQuestions)
}

// CreatePassage godoc
// @Summary      Tạo bài luyện nghe (admin)
// @Tags         admin-listening
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body  body      service.ListeningPassageRequest  true  "Thông tin bài luyện nghe"
// @Success      201   {object}  service.ListeningPassageAdminResponse
// @Router       /admin/listening/passages [post]
func (h *ListeningHandler) CreatePassage(c *fiber.Ctx) error {
	var req service.ListeningPassageRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}
	result, err := h.svc.CreatePassage(c.UserContext(), req)
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusCreated).JSON(result)
}

// ListPassagesAdmin godoc
// @Summary      Danh sách bài luyện nghe theo ngôn ngữ (admin, có script đầy đủ)
// @Tags         admin-listening
// @Produce      json
// @Security     BearerAuth
// @Param        language_id  query     string  true  "Language ID"
// @Param        topic        query     string  false  "Lọc đúng 1 chủ đề"
// @Success      200          {array}   service.ListeningPassageAdminResponse
// @Router       /admin/listening/passages [get]
func (h *ListeningHandler) ListPassagesAdmin(c *fiber.Ctx) error {
	page, pageSize := pageParams(c)
	results, err := h.svc.ListPassagesAdmin(c.UserContext(), c.Query("language_id"), c.Query("q"), c.Query("topic"), c.Query("level"), page, pageSize)
	if err != nil {
		return err
	}
	return c.JSON(results)
}

// UpdatePassage godoc
// @Summary      Sửa bài luyện nghe (admin)
// @Tags         admin-listening
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id    path      string                            true  "Passage ID"
// @Param        body  body      service.ListeningPassageRequest  true  "Thông tin bài luyện nghe"
// @Success      200   {object}  service.ListeningPassageAdminResponse
// @Router       /admin/listening/passages/{id} [put]
func (h *ListeningHandler) UpdatePassage(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "ID không hợp lệ")
	}
	var req service.ListeningPassageRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}
	result, err := h.svc.UpdatePassage(c.UserContext(), id, req)
	if err != nil {
		return err
	}
	return c.JSON(result)
}

// DeletePassage godoc
// @Summary      Xoá bài luyện nghe (admin, cascade xoá câu hỏi bên trong)
// @Tags         admin-listening
// @Security     BearerAuth
// @Param        id   path  string  true  "Passage ID"
// @Success      204
// @Router       /admin/listening/passages/{id} [delete]
func (h *ListeningHandler) DeletePassage(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "ID không hợp lệ")
	}
	if err := h.svc.DeletePassage(c.UserContext(), id); err != nil {
		return err
	}
	return c.SendStatus(fiber.StatusNoContent)
}

// BulkImportPassages godoc
// @Summary      Nhập hàng loạt bài luyện nghe (admin)
// @Tags         admin-listening
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body  body      []service.ListeningPassageRequest  true  "Danh sách bài luyện nghe"
// @Success      200   {array}   service.BulkImportResult
// @Router       /admin/listening/passages/bulk [post]
func (h *ListeningHandler) BulkImportPassages(c *fiber.Ctx) error {
	var items []service.ListeningPassageRequest
	if err := c.BodyParser(&items); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}
	return c.JSON(h.svc.BulkImportPassages(c.UserContext(), items))
}

// UploadAudio godoc
// @Summary      Upload audio cho 1 bài luyện nghe (admin, lưu trên Cloudflare R2)
// @Description  multipart/form-data, field "audio" — thay audio cũ nếu đã có.
// @Tags         admin-listening
// @Accept       multipart/form-data
// @Produce      json
// @Security     BearerAuth
// @Param        id     path      string  true  "Passage ID"
// @Param        audio  formData  file    true  "File audio (mp3/wav/ogg/m4a/webm, tối đa 25MB)"
// @Success      200    {object}  service.ListeningPassageAdminResponse
// @Failure      400    {object}  ErrorResponse
// @Router       /admin/listening/passages/{id}/audio [post]
func (h *ListeningHandler) UploadAudio(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "ID không hợp lệ")
	}
	fileHeader, err := c.FormFile("audio")
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "thiếu file audio (field \"audio\")")
	}
	file, err := fileHeader.Open()
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "không đọc được file audio")
	}
	defer file.Close()

	contentType := fileHeader.Header.Get("Content-Type")
	ext := strings.ToLower(filepath.Ext(fileHeader.Filename))

	result, err := h.svc.UploadAudio(c.UserContext(), id, file, fileHeader.Size, contentType, ext)
	if err != nil {
		return err
	}
	return c.JSON(result)
}

// DeleteAudio godoc
// @Summary      Gỡ audio khỏi 1 bài luyện nghe (admin)
// @Tags         admin-listening
// @Produce      json
// @Security     BearerAuth
// @Param        id   path      string  true  "Passage ID"
// @Success      200  {object}  service.ListeningPassageAdminResponse
// @Router       /admin/listening/passages/{id}/audio [delete]
func (h *ListeningHandler) DeleteAudio(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "ID không hợp lệ")
	}
	result, err := h.svc.DeleteAudio(c.UserContext(), id)
	if err != nil {
		return err
	}
	return c.JSON(result)
}

// CreateQuestionAdmin godoc
// @Summary      Tạo câu hỏi nghe hiểu (admin)
// @Tags         admin-listening
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body  body      service.ListeningQuestionRequest  true  "Thông tin câu hỏi"
// @Success      201   {object}  service.ListeningQuestionAdminResponse
// @Router       /admin/listening/questions [post]
func (h *ListeningHandler) CreateQuestionAdmin(c *fiber.Ctx) error {
	var req service.ListeningQuestionRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}
	result, err := h.svc.CreateQuestion(c.UserContext(), req)
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusCreated).JSON(result)
}

// ListQuestionsAdmin godoc
// @Summary      Danh sách câu hỏi của 1 bài luyện nghe (admin, CÓ đáp án đúng)
// @Tags         admin-listening
// @Produce      json
// @Security     BearerAuth
// @Param        passage_id  query     string  true  "Passage ID"
// @Success      200         {array}   service.ListeningQuestionAdminResponse
// @Router       /admin/listening/questions [get]
func (h *ListeningHandler) ListQuestionsAdmin(c *fiber.Ctx) error {
	passageID, err := uuid.Parse(c.Query("passage_id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "passage_id không hợp lệ")
	}
	page, pageSize := pageParams(c)
	results, err := h.svc.ListQuestionsAdmin(c.UserContext(), passageID, c.Query("q"), page, pageSize)
	if err != nil {
		return err
	}
	return c.JSON(results)
}

// UpdateQuestionAdmin godoc
// @Summary      Sửa câu hỏi nghe hiểu (admin)
// @Tags         admin-listening
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id    path      string                             true  "Question ID"
// @Param        body  body      service.ListeningQuestionRequest  true  "Thông tin câu hỏi"
// @Success      200   {object}  service.ListeningQuestionAdminResponse
// @Router       /admin/listening/questions/{id} [put]
func (h *ListeningHandler) UpdateQuestionAdmin(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "ID không hợp lệ")
	}
	var req service.ListeningQuestionRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}
	result, err := h.svc.UpdateQuestion(c.UserContext(), id, req)
	if err != nil {
		return err
	}
	return c.JSON(result)
}

// DeleteQuestionAdmin godoc
// @Summary      Xoá câu hỏi nghe hiểu (admin)
// @Tags         admin-listening
// @Security     BearerAuth
// @Param        id   path  string  true  "Question ID"
// @Success      204
// @Router       /admin/listening/questions/{id} [delete]
func (h *ListeningHandler) DeleteQuestionAdmin(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "ID không hợp lệ")
	}
	if err := h.svc.DeleteQuestion(c.UserContext(), id); err != nil {
		return err
	}
	return c.SendStatus(fiber.StatusNoContent)
}

// BulkImportQuestions godoc
// @Summary      Nhập hàng loạt câu hỏi nghe hiểu (admin)
// @Tags         admin-listening
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body  body      []service.ListeningQuestionRequest  true  "Danh sách câu hỏi"
// @Success      200   {array}   service.BulkImportResult
// @Router       /admin/listening/questions/bulk [post]
func (h *ListeningHandler) BulkImportQuestions(c *fiber.Ctx) error {
	var items []service.ListeningQuestionRequest
	if err := c.BodyParser(&items); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}
	return c.JSON(h.svc.BulkImportQuestions(c.UserContext(), items))
}

// ListPassages godoc
// @Summary      Danh sách bài luyện nghe của một ngôn ngữ
// @Description  topic để trống thì lấy mọi chủ đề; truyền topic thì chỉ lấy bài của đúng chủ đề đó.
// @Tags         listening
// @Produce      json
// @Param        id     path      string  true   "Language ID"  example(en)
// @Param        topic  query     string  false  "Tên chủ đề"    example(Daily life)
// @Success      200    {array}   service.ListeningPassageSummary
// @Failure      500    {object}  ErrorResponse
// @Router       /languages/{id}/listening [get]
func (h *ListeningHandler) ListPassages(c *fiber.Ctx) error {
	results, err := h.svc.ListPassages(c.UserContext(), c.Params("id"), c.Query("topic"))
	if err != nil {
		return err
	}
	return c.JSON(results)
}

// ListTopics godoc
// @Summary      Chủ đề luyện nghe
// @Tags         listening
// @Produce      json
// @Param        language  query     string  true  "Mã ngôn ngữ"  example(en)
// @Success      200       {array}   service.ListeningTopic
// @Router       /listening/topics [get]
func (h *ListeningHandler) ListTopics(c *fiber.Ctx) error {
	results, err := h.svc.ListTopics(c.UserContext(), c.Query("language"))
	if err != nil {
		return err
	}
	return c.JSON(results)
}

// CreateOrUpdateTopic godoc
// @Summary      Tạo/sửa chủ đề luyện nghe (admin, upsert theo language_id+name)
// @Tags         admin-listening
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body  body      service.ListeningTopicRequest  true  "Thông tin chủ đề"
// @Success      200   {object}  service.ListeningTopicAdminResponse
// @Router       /admin/listening/topics [post]
func (h *ListeningHandler) CreateOrUpdateTopic(c *fiber.Ctx) error {
	var req service.ListeningTopicRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}
	result, err := h.svc.CreateOrUpdateTopic(c.UserContext(), req)
	if err != nil {
		return err
	}
	return c.JSON(result)
}

// ListTopicsAdmin godoc
// @Summary      Danh sách chủ đề luyện nghe theo ngôn ngữ (admin)
// @Tags         admin-listening
// @Produce      json
// @Security     BearerAuth
// @Param        language_id  query     string  true  "Language ID"
// @Success      200          {array}   service.ListeningTopicAdminResponse
// @Router       /admin/listening/topics [get]
func (h *ListeningHandler) ListTopicsAdmin(c *fiber.Ctx) error {
	page, pageSize := pageParams(c)
	results, err := h.svc.ListTopicsAdmin(c.UserContext(), c.Query("language_id"), c.Query("q"), page, pageSize)
	if err != nil {
		return err
	}
	return c.JSON(results)
}

type deleteListeningTopicRequest struct {
	LanguageID string `json:"language_id"`
	Name       string `json:"name"`
}

// DeleteTopic godoc
// @Summary      Xoá chủ đề luyện nghe (admin, chỉ xoá metadata icon/thứ tự)
// @Tags         admin-listening
// @Accept       json
// @Security     BearerAuth
// @Param        body  body  deleteListeningTopicRequest  true  "language_id + name"
// @Success      204
// @Router       /admin/listening/topics [delete]
func (h *ListeningHandler) DeleteTopic(c *fiber.Ctx) error {
	var req deleteListeningTopicRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}
	if err := h.svc.DeleteTopic(c.UserContext(), req.LanguageID, req.Name); err != nil {
		return err
	}
	return c.SendStatus(fiber.StatusNoContent)
}

// BulkImportTopics godoc
// @Summary      Nhập hàng loạt chủ đề luyện nghe (admin)
// @Tags         admin-listening
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body  body      []service.ListeningTopicRequest  true  "Danh sách chủ đề"
// @Success      200   {array}   service.BulkImportResult
// @Router       /admin/listening/topics/bulk [post]
func (h *ListeningHandler) BulkImportTopics(c *fiber.Ctx) error {
	var items []service.ListeningTopicRequest
	if err := c.BodyParser(&items); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}
	return c.JSON(h.svc.BulkImportTopics(c.UserContext(), items))
}

// GetPassage godoc
// @Summary      Chi tiết bài luyện nghe
// @Description  Trả về script (FE tự phát bằng Web Speech TTS) và câu hỏi (không kèm đáp án đúng).
// @Tags         listening
// @Produce      json
// @Param        id   path      string  true  "Passage ID (UUID)"  format(uuid)
// @Success      200  {object}  service.ListeningPassageDetail
// @Failure      400  {object}  ErrorResponse
// @Failure      404  {object}  ErrorResponse
// @Router       /listening/passages/{id} [get]
func (h *ListeningHandler) GetPassage(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "ID không hợp lệ")
	}

	result, err := h.svc.GetPassageDetail(c.UserContext(), id)
	if err != nil {
		return err
	}
	return c.JSON(result)
}

type submitListeningAnswerRequest struct {
	Answer string `json:"answer" example:"At the market"`
}

// SubmitAnswer godoc
// @Summary      Chấm 1 câu hỏi nghe hiểu
// @Description  Trả đúng/sai + đáp án đúng + giải thích; đúng thì ghi nhận tiến độ nhiệm vụ.
// @Tags         listening
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id    path      string                         true  "Question ID (UUID)"
// @Param        body  body      submitListeningAnswerRequest  true  "Câu trả lời"
// @Success      200   {object}  service.SubmitListeningAnswerResponse
// @Failure      400   {object}  ErrorResponse
// @Failure      404   {object}  ErrorResponse
// @Router       /listening/questions/{id}/submit [post]
func (h *ListeningHandler) SubmitAnswer(c *fiber.Ctx) error {
	questionID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "ID không hợp lệ")
	}

	var req submitListeningAnswerRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}

	result, err := h.svc.SubmitAnswer(c.UserContext(), currentUserID(c), questionID, req.Answer)
	if err != nil {
		return err
	}
	return c.JSON(result)
}
