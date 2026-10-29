package handler

import (
	"laclingo-backend/internal/service"

	"github.com/gofiber/fiber/v2"
)

type OnboardingHandler struct {
	svc     *service.OnboardingService
	content *service.LanguageContentService
}

func NewOnboardingHandler(svc *service.OnboardingService, content *service.LanguageContentService) *OnboardingHandler {
	return &OnboardingHandler{svc: svc, content: content}
}

// RegisterPublicRoutes — ảnh đại diện phải public (thẻ <img> không gửi được Bearer token)
func (h *OnboardingHandler) RegisterPublicRoutes(router fiber.Router) {
	router.Get("/users/avatars/:id", h.ServeAvatar)
}

func (h *OnboardingHandler) RegisterRoutes(router fiber.Router) {
	router.Get("/users/me/onboarding", h.Get)
	router.Put("/users/me/onboarding", h.Save)
	router.Post("/users/me/onboarding/skip", h.Skip)
	router.Post("/users/me/avatar", h.UploadAvatar)
	router.Put("/users/me/languages/:languageId", h.AddLanguage)
	router.Get("/users/me/languages/:languageId/topic-sync", h.TopicSyncPreview)
	router.Post("/users/me/languages/:languageId/sync", h.SyncLanguage)
	router.Post("/users/me/languages/:languageId/sync/retry", h.RetrySync)
	router.Get("/users/me/language-sync", h.SyncJobs)
}

// SyncLanguage godoc
// @Summary      Đưa chủ đề (tên ở ngôn ngữ nguồn) vào hàng đợi dựng nội dung cho ngôn ngữ mới — worker dựng dần, user học bình thường
// @Tags         onboarding
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        languageId  path      string                       true  "Ngôn ngữ mới"
// @Param        body        body      service.SyncLanguageRequest  true  "Ngôn ngữ nguồn + chủ đề"
// @Success      202         {array}   service.LanguageSyncJob
// @Failure      400         {object}  ErrorResponse
// @Router       /users/me/languages/{languageId}/sync [post]
func (h *OnboardingHandler) SyncLanguage(c *fiber.Ctx) error {
	var req service.SyncLanguageRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}
	jobs, err := h.content.EnqueueSync(c.UserContext(), currentUserID(c), c.Params("languageId"), req)
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusAccepted).JSON(jobs)
}

// RetrySync godoc
// @Summary      Chạy lại các chủ đề dựng lỗi của 1 ngôn ngữ
// @Tags         onboarding
// @Produce      json
// @Security     BearerAuth
// @Param        languageId  path      string  true  "Ngôn ngữ mới"
// @Success      200         {array}   service.LanguageSyncJob
// @Router       /users/me/languages/{languageId}/sync/retry [post]
func (h *OnboardingHandler) RetrySync(c *fiber.Ctx) error {
	jobs, err := h.content.RetrySync(c.UserContext(), currentUserID(c), c.Params("languageId"))
	if err != nil {
		return err
	}
	return c.JSON(jobs)
}

// SyncJobs godoc
// @Summary      Tiến độ dựng nội dung: chủ đề đang chờ / đang dựng + xong / lỗi trong 24 giờ qua
// @Tags         onboarding
// @Produce      json
// @Security     BearerAuth
// @Param        language  query     string  false  "Lọc theo ngôn ngữ (trống = mọi ngôn ngữ)"
// @Success      200       {array}   service.LanguageSyncJob
// @Router       /users/me/language-sync [get]
func (h *OnboardingHandler) SyncJobs(c *fiber.Ctx) error {
	jobs, err := h.content.SyncJobs(c.UserContext(), currentUserID(c), c.Query("language"))
	if err != nil {
		return err
	}
	return c.JSON(jobs)
}

// Get godoc
// @Summary      Dữ liệu onboarding hiện tại (thông tin cơ bản, ngôn ngữ học + trình độ, chủ đề yêu thích)
// @Tags         onboarding
// @Produce      json
// @Security     BearerAuth
// @Success      200  {object}  service.OnboardingResponse
// @Router       /users/me/onboarding [get]
func (h *OnboardingHandler) Get(c *fiber.Ctx) error {
	res, err := h.svc.Get(c.UserContext(), currentUserID(c))
	if err != nil {
		return err
	}
	return c.JSON(res)
}

// Save godoc
// @Summary      Lưu onboarding (ghi đè toàn bộ); complete=true đánh dấu đã hoàn tất
// @Tags         onboarding
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body  body      service.SaveOnboardingRequest  true  "Dữ liệu onboarding"
// @Success      200   {object}  service.OnboardingResponse
// @Failure      400   {object}  ErrorResponse
// @Router       /users/me/onboarding [put]
func (h *OnboardingHandler) Save(c *fiber.Ctx) error {
	var req service.SaveOnboardingRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}
	res, err := h.svc.Save(c.UserContext(), currentUserID(c), req)
	if err != nil {
		return err
	}
	return c.JSON(res)
}

// Skip godoc
// @Summary      "Để sau" — không hiện onboarding nữa (mở lại được từ Hồ sơ)
// @Tags         onboarding
// @Produce      json
// @Security     BearerAuth
// @Success      200  {object}  service.UserResponse
// @Router       /users/me/onboarding/skip [post]
func (h *OnboardingHandler) Skip(c *fiber.Ctx) error {
	res, err := h.svc.Skip(c.UserContext(), currentUserID(c))
	if err != nil {
		return err
	}
	return c.JSON(res)
}

// AddLanguage godoc
// @Summary      Học ngôn ngữ mới: thêm ngôn ngữ (đã có thì đổi trình độ) + ghi đè chủ đề yêu thích của riêng ngôn ngữ đó
// @Tags         onboarding
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        languageId  path      string                      true  "Ngôn ngữ muốn học"
// @Param        body        body      service.AddLanguageRequest  true  "Trình độ + chủ đề"
// @Success      200         {object}  service.OnboardingResponse
// @Failure      400         {object}  ErrorResponse
// @Router       /users/me/languages/{languageId} [put]
func (h *OnboardingHandler) AddLanguage(c *fiber.Ctx) error {
	var req service.AddLanguageRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}
	res, err := h.svc.AddLanguage(c.UserContext(), currentUserID(c), c.Params("languageId"), req)
	if err != nil {
		return err
	}
	return c.JSON(res)
}

// TopicSyncPreview godoc
// @Summary      Chủ đề đã chọn / đã học ở ngôn ngữ "from" ứng với chủ đề nào ở ngôn ngữ mới (khớp theo topic_key, rồi theo tên)
// @Tags         onboarding
// @Produce      json
// @Security     BearerAuth
// @Param        languageId  path      string  true  "Ngôn ngữ mới"
// @Param        from        query     string  true  "Ngôn ngữ nguồn (đang học)"
// @Success      200         {object}  service.TopicSyncPreview
// @Failure      400         {object}  ErrorResponse
// @Router       /users/me/languages/{languageId}/topic-sync [get]
func (h *OnboardingHandler) TopicSyncPreview(c *fiber.Ctx) error {
	res, err := h.svc.TopicSyncPreview(c.UserContext(), currentUserID(c), c.Params("languageId"), c.Query("from"))
	if err != nil {
		return err
	}
	return c.JSON(res)
}

// UploadAvatar godoc
// @Summary      Tải ảnh đại diện lên (chưa đổi avatar — lưu onboarding / hồ sơ với url trả về)
// @Tags         onboarding
// @Accept       multipart/form-data
// @Produce      json
// @Security     BearerAuth
// @Param        image  formData  file  true  "Ảnh (jpeg/png/webp/gif, tối đa 5MB)"
// @Success      201    {object}  service.AvatarUploadResponse
// @Failure      400    {object}  ErrorResponse
// @Router       /users/me/avatar [post]
func (h *OnboardingHandler) UploadAvatar(c *fiber.Ctx) error {
	fileHeader, err := c.FormFile("image")
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "thiếu file ảnh (field \"image\")")
	}
	file, err := fileHeader.Open()
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "không đọc được file ảnh")
	}
	defer file.Close()

	res, err := h.svc.UploadAvatar(c.UserContext(), currentUserID(c), file, fileHeader.Size)
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusCreated).JSON(res)
}

// ServeAvatar godoc
// @Summary      Redirect sang URL thật của ảnh đại diện đã tải lên (public)
// @Tags         onboarding
// @Param        id   path  string  true  "Avatar ID"  format(uuid)
// @Success      302
// @Failure      404  {object}  ErrorResponse
// @Router       /users/avatars/{id} [get]
func (h *OnboardingHandler) ServeAvatar(c *fiber.Ctx) error {
	id, err := parseUUIDParam(c, "id")
	if err != nil {
		return err
	}
	url, err := h.svc.ResolveAvatarURL(c.UserContext(), id)
	if err != nil {
		return err
	}
	return c.Redirect(url, fiber.StatusFound)
}
