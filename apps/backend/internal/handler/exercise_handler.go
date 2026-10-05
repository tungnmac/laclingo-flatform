package handler

import (
	"time"

	"laclingo-backend/internal/repository/db"
	"laclingo-backend/internal/service"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

// ExerciseHandler handles exercise types, decks, and progress endpoints
type ExerciseHandler struct {
	svc *service.ExerciseService
}

func NewExerciseHandler(svc *service.ExerciseService) *ExerciseHandler {
	return &ExerciseHandler{svc: svc}
}

func (h *ExerciseHandler) RegisterRoutes(router fiber.Router) {
	// Exercise Types
	router.Get("/exercise-types", h.GetExerciseTypes)

	// Decks
	router.Get("/decks", h.ListDecks)
	router.Post("/decks", h.CreateDeck)
	router.Get("/decks/:id", h.GetDeck)
	router.Put("/decks/:id", h.UpdateDeck)
	router.Delete("/decks/:id", h.DeleteDeck)
	router.Post("/decks/:id/vocabularies", h.AddVocabularyToDeck)
	router.Delete("/decks/:id/vocabularies/:vocabId", h.RemoveVocabularyFromDeck)

	// Grammar Progress
	router.Get("/grammar/:id/progress", h.GetGrammarProgress)
	router.Post("/grammar/exercises/submit", h.SubmitGrammarExercise)

	// User Progress
	router.Get("/progress", h.GetUserProgress)
	router.Get("/progress/stats", h.GetExerciseStats)
}

// ExerciseTypeResponse represents an exercise type for the API
type ExerciseTypeResponse struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Icon        string `json:"icon"`
	Config      any    `json:"config,omitempty"`
	IsActive    bool   `json:"is_active"`
	OrderIndex  int32  `json:"order_index"`
}

// GetExerciseTypes godoc
// @Summary      Get all active exercise types
// @Description  Returns list of all active exercise types
// @Tags         exercises
// @Produce      json
// @Success      200 {array} ExerciseTypeResponse
// @Failure      500 {object} ErrorResponse
// @Router       /exercise-types [get]
func (h *ExerciseHandler) GetExerciseTypes(c *fiber.Ctx) error {
	types, err := h.svc.GetExerciseTypes(c.UserContext())
	if err != nil {
		return err
	}

	results := make([]ExerciseTypeResponse, len(types))
	for i, t := range types {
		results[i] = ExerciseTypeResponse{
			ID:          t.ID,
			Name:        t.Name,
			Description: t.Description.String,
			Icon:        t.Icon.String,
			IsActive:    t.IsActive.Bool,
			OrderIndex:  t.OrderIndex.Int32,
		}
	}

	return c.JSON(results)
}

// DeckResponse represents a deck for the API
type DeckResponse struct {
	ID          uuid.UUID `json:"id"`
	UserID      uuid.UUID `json:"user_id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Color       string    `json:"color"`
	Icon        string    `json:"icon"`
	IsPublic    bool      `json:"is_public"`
	IsSystem    bool      `json:"is_system"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// CreateDeckRequest for creating a new deck
type CreateDeckRequest struct {
	Name        string `json:"name"`
	Description string `json:"description,omitempty"`
	Color       string `json:"color,omitempty"`
	Icon        string `json:"icon,omitempty"`
}

// UpdateDeckRequest for updating a deck
type UpdateDeckRequest struct {
	Name        string `json:"name,omitempty"`
	Description string `json:"description,omitempty"`
	Color       string `json:"color,omitempty"`
	Icon        string `json:"icon,omitempty"`
}

// ListDecks godoc
// @Summary      List user's decks
// @Description  Get all decks belonging to the current user
// @Tags         decks
// @Produce      json
// @Security     BearerAuth
// @Success      200 {array} DeckResponse
// @Failure      401 {object} ErrorResponse
// @Failure      500 {object} ErrorResponse
// @Router       /decks [get]
func (h *ExerciseHandler) ListDecks(c *fiber.Ctx) error {
	userID := currentUserID(c)

	decks, err := h.svc.ListUserDecks(c.UserContext(), pgtype.UUID{Bytes: userID, Valid: true})
	if err != nil {
		return err
	}

	results := make([]DeckResponse, len(decks))
	for i, d := range decks {
		results[i] = deckToResponse(d)
	}

	return c.JSON(results)
}

// CreateDeck godoc
// @Summary      Create a new deck
// @Description  Create a new deck for the current user
// @Tags         decks
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body body CreateDeckRequest true "Deck data"
// @Success      201 {object} DeckResponse
// @Failure      400 {object} ErrorResponse
// @Failure      401 {object} ErrorResponse
// @Failure      500 {object} ErrorResponse
// @Router       /decks [post]
func (h *ExerciseHandler) CreateDeck(c *fiber.Ctx) error {
	userID := currentUserID(c)

	var req CreateDeckRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}

	if req.Name == "" {
		return fiber.NewError(fiber.StatusBadRequest, "tên deck không được để trống")
	}

	deck, err := h.svc.CreateDeck(c.UserContext(), db.CreateDeckParams{
		UserID:      pgtype.UUID{Bytes: userID, Valid: true},
		Name:        req.Name,
		Description: toPgText(req.Description),
		Color:       toPgText(req.Color),
		Icon:        toPgText(req.Icon),
	})
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusCreated).JSON(deckToResponse(deck))
}

// GetDeck godoc
// @Summary      Get a deck by ID
// @Description  Get deck details including vocabularies
// @Tags         decks
// @Produce      json
// @Security     BearerAuth
// @Param        id path string true "Deck ID"
// @Success      200 {object} DeckWithVocabulariesResponse
// @Failure      400 {object} ErrorResponse
// @Failure      401 {object} ErrorResponse
// @Failure      404 {object} ErrorResponse
// @Router       /decks/{id} [get]
func (h *ExerciseHandler) GetDeck(c *fiber.Ctx) error {
	userID := currentUserID(c)

	deckID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "deck id không hợp lệ")
	}

	deck, err := h.svc.GetDeck(c.UserContext(), db.GetDeckParams{
		ID:     pgtype.UUID{Bytes: deckID, Valid: true},
		UserID: pgtype.UUID{Bytes: userID, Valid: true},
	})
	if err != nil {
		return service.ErrNotFound
	}

	vocabularies, _ := h.svc.GetDeckVocabularies(c.UserContext(), pgtype.UUID{Bytes: deckID, Valid: true})

	return c.JSON(DeckWithVocabulariesResponse{
		DeckResponse: deckToResponse(deck),
		Vocabularies: vocabulariesToResponse(vocabularies),
	})
}

// UpdateDeck godoc
// @Summary      Update a deck
// @Description  Update deck details
// @Tags         decks
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id path string true "Deck ID"
// @Param        body body UpdateDeckRequest true "Deck data"
// @Success      200 {object} DeckResponse
// @Failure      400 {object} ErrorResponse
// @Failure      401 {object} ErrorResponse
// @Failure      404 {object} ErrorResponse
// @Router       /decks/{id} [put]
func (h *ExerciseHandler) UpdateDeck(c *fiber.Ctx) error {
	userID := currentUserID(c)

	deckID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "deck id không hợp lệ")
	}

	var req UpdateDeckRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}

	deck, err := h.svc.UpdateDeck(c.UserContext(), db.UpdateDeckParams{
		ID:          pgtype.UUID{Bytes: deckID, Valid: true},
		UserID:      pgtype.UUID{Bytes: userID, Valid: true},
		Name:        req.Name,
		Description: toPgText(req.Description),
		Color:       toPgText(req.Color),
		Icon:        toPgText(req.Icon),
	})
	if err != nil {
		return service.ErrNotFound
	}

	return c.JSON(deckToResponse(deck))
}

// DeleteDeck godoc
// @Summary      Delete a deck
// @Description  Delete a deck and its vocabulary associations
// @Tags         decks
// @Produce      json
// @Security     BearerAuth
// @Param        id path string true "Deck ID"
// @Success      200 {object} map[string]bool
// @Failure      400 {object} ErrorResponse
// @Failure      401 {object} ErrorResponse
// @Failure      404 {object} ErrorResponse
// @Router       /decks/{id} [delete]
func (h *ExerciseHandler) DeleteDeck(c *fiber.Ctx) error {
	userID := currentUserID(c)

	deckID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "deck id không hợp lệ")
	}

	rows, err := h.svc.DeleteDeck(c.UserContext(), db.DeleteDeckParams{
		ID:     pgtype.UUID{Bytes: deckID, Valid: true},
		UserID: pgtype.UUID{Bytes: userID, Valid: true},
	})
	if err != nil {
		return err
	}

	if rows == 0 {
		return service.ErrNotFound
	}

	return c.JSON(fiber.Map{"deleted": true})
}

// AddVocabularyToDeckRequest for adding vocabulary to deck
type AddVocabularyToDeckRequest struct {
	VocabularyID string `json:"vocabulary_id"`
}

// AddVocabularyToDeck godoc
// @Summary      Add vocabulary to deck
// @Description  Add a vocabulary item to a deck
// @Tags         decks
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id path string true "Deck ID"
// @Param        body body AddVocabularyToDeckRequest true "Vocabulary ID"
// @Success      200 {object} map[string]bool
// @Failure      400 {object} ErrorResponse
// @Failure      401 {object} ErrorResponse
// @Failure      404 {object} ErrorResponse
// @Router       /decks/{id}/vocabularies [post]
func (h *ExerciseHandler) AddVocabularyToDeck(c *fiber.Ctx) error {
	userID := currentUserID(c)

	deckID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "deck id không hợp lệ")
	}

	var req AddVocabularyToDeckRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}

	vocabID, err := uuid.Parse(req.VocabularyID)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "vocabulary id không hợp lệ")
	}

	// Verify deck belongs to user
	_, err = h.svc.GetDeck(c.UserContext(), db.GetDeckParams{
		ID:     pgtype.UUID{Bytes: deckID, Valid: true},
		UserID: pgtype.UUID{Bytes: userID, Valid: true},
	})
	if err != nil {
		return service.ErrNotFound
	}

	_, err = h.svc.AddVocabularyToDeck(c.UserContext(), db.AddVocabularyToDeckParams{
		DeckID:       pgtype.UUID{Bytes: deckID, Valid: true},
		VocabularyID: pgtype.UUID{Bytes: vocabID, Valid: true},
	})
	if err != nil {
		return err
	}

	return c.JSON(fiber.Map{"added": true})
}

// RemoveVocabularyFromDeck godoc
// @Summary      Remove vocabulary from deck
// @Description  Remove a vocabulary item from a deck
// @Tags         decks
// @Produce      json
// @Security     BearerAuth
// @Param        id path string true "Deck ID"
// @Param        vocabId path string true "Vocabulary ID"
// @Success      200 {object} map[string]bool
// @Failure      400 {object} ErrorResponse
// @Failure      401 {object} ErrorResponse
// @Failure      404 {object} ErrorResponse
// @Router       /decks/{id}/vocabularies/{vocabId} [delete]
func (h *ExerciseHandler) RemoveVocabularyFromDeck(c *fiber.Ctx) error {
	userID := currentUserID(c)

	deckID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "deck id không hợp lệ")
	}

	vocabID, err := uuid.Parse(c.Params("vocabId"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "vocabulary id không hợp lệ")
	}

	// Verify deck belongs to user
	_, err = h.svc.GetDeck(c.UserContext(), db.GetDeckParams{
		ID:     pgtype.UUID{Bytes: deckID, Valid: true},
		UserID: pgtype.UUID{Bytes: userID, Valid: true},
	})
	if err != nil {
		return service.ErrNotFound
	}

	_, err = h.svc.RemoveVocabularyFromDeck(c.UserContext(), db.RemoveVocabularyFromDeckParams{
		DeckID:       pgtype.UUID{Bytes: deckID, Valid: true},
		VocabularyID: pgtype.UUID{Bytes: vocabID, Valid: true},
	})
	if err != nil {
		return err
	}

	return c.JSON(fiber.Map{"removed": true})
}

// GrammarProgressResponse for grammar progress
type GrammarProgressResponse struct {
	ID                uuid.UUID  `json:"id"`
	UserID            uuid.UUID  `json:"user_id"`
	LessonID          uuid.UUID  `json:"lesson_id"`
	Level             int32      `json:"level"`
	Attempts          int32      `json:"attempts"`
	CorrectCount      int32      `json:"correct_count"`
	XpEarned          int64      `json:"xp_earned"`
	Status            string     `json:"status"`
	ConsecutiveFails  int32      `json:"consecutive_fails"`
	SrsStage          int32      `json:"srs_stage"`
	EaseFactor        float64    `json:"ease_factor"`
	IntervalDays      int32      `json:"interval_days"`
	NextReviewAt      *time.Time `json:"next_review_at,omitempty"`
	CreatedAt         time.Time  `json:"created_at"`
	UpdatedAt         time.Time  `json:"updated_at"`
}

// GetGrammarProgress godoc
// @Summary      Get grammar lesson progress
// @Description  Get user's progress for a specific grammar lesson at all levels
// @Tags         grammar
// @Produce      json
// @Security     BearerAuth
// @Param        id path string true "Lesson ID"
// @Success      200 {array} GrammarProgressResponse
// @Failure      400 {object} ErrorResponse
// @Failure      401 {object} ErrorResponse
// @Failure      500 {object} ErrorResponse
// @Router       /grammar/{id}/progress [get]
func (h *ExerciseHandler) GetGrammarProgress(c *fiber.Ctx) error {
	userID := currentUserID(c)

	lessonID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "lesson id không hợp lệ")
	}

	progress, err := h.svc.GetGrammarProgress(c.UserContext(), db.GetLessonProgressAllLevelsParams{
		UserID:   pgtype.UUID{Bytes: userID, Valid: true},
		LessonID: pgtype.UUID{Bytes: lessonID, Valid: true},
	})
	if err != nil {
		return err
	}

	results := make([]GrammarProgressResponse, len(progress))
	for i, p := range progress {
		results[i] = grammarProgressToResponse(p)
	}

	return c.JSON(results)
}

// SubmitGrammarExerciseRequest for submitting grammar exercise answer
type SubmitGrammarExerciseRequest struct {
	LessonID    string `json:"lesson_id"`
	Level       int32  `json:"level"`
	IsCorrect   bool   `json:"is_correct"`
	XpEarned    int64  `json:"xp_earned"`
	CorrectCount int32  `json:"correct_count"`
	Attempts    int32  `json:"attempts"`
}

// SubmitGrammarExercise godoc
// @Summary      Submit grammar exercise answer
// @Description  Submit answer and update user grammar progress
// @Tags         grammar
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body body SubmitGrammarExerciseRequest true "Exercise result"
// @Success      200 {object} GrammarProgressResponse
// @Failure      400 {object} ErrorResponse
// @Failure      401 {object} ErrorResponse
// @Failure      500 {object} ErrorResponse
// @Router       /grammar/exercises/submit [post]
func (h *ExerciseHandler) SubmitGrammarExercise(c *fiber.Ctx) error {
	userID := currentUserID(c)

	var req SubmitGrammarExerciseRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}

	lessonID, err := uuid.Parse(req.LessonID)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "lesson id không hợp lệ")
	}

	status := "in_progress"
	if req.IsCorrect {
		status = "passed"
	}

	progress, err := h.svc.UpsertGrammarProgress(c.UserContext(), db.UpsertGrammarProgressParams{
		UserID:             pgtype.UUID{Bytes: userID, Valid: true},
		LessonID:          pgtype.UUID{Bytes: lessonID, Valid: true},
		Level:             req.Level,
		Attempts:          pgtype.Int4{Int32: req.Attempts, Valid: true},
		CorrectCount:      pgtype.Int4{Int32: req.CorrectCount, Valid: true},
		XpEarned:          pgtype.Int8{Int64: req.XpEarned, Valid: true},
		Status:            pgtype.Text{String: status, Valid: true},
		ConsecutiveFails:  pgtype.Int4{Int32: 0, Valid: true},
	})
	if err != nil {
		return err
	}

	return c.JSON(grammarProgressToResponse(progress))
}

// UserProgressResponse for user exercise progress
type UserProgressResponse struct {
	ID               uuid.UUID  `json:"id"`
	UserID           uuid.UUID  `json:"user_id"`
	VocabularyID     uuid.UUID  `json:"vocabulary_id"`
	ExerciseType     string     `json:"exercise_type"`
	Status           string     `json:"status"`
	Attempts         int32      `json:"attempts"`
	CorrectCount     int32      `json:"correct_count"`
	XpEarned         int64      `json:"xp_earned"`
	MasteredAt       *time.Time `json:"mastered_at,omitempty"`
	LastAttemptedAt  *time.Time `json:"last_attempted_at,omitempty"`
}

// GetUserProgress godoc
// @Summary      Get user's exercise progress
// @Description  Get all exercise progress records for the current user
// @Tags         progress
// @Produce      json
// @Security     BearerAuth
// @Success      200 {array} UserProgressResponse
// @Failure      401 {object} ErrorResponse
// @Failure      500 {object} ErrorResponse
// @Router       /progress [get]
func (h *ExerciseHandler) GetUserProgress(c *fiber.Ctx) error {
	userID := currentUserID(c)

	sessions, err := h.svc.GetUserExerciseSessions(c.UserContext(), db.GetUserExerciseSessionsParams{
		UserID: pgtype.UUID{Bytes: userID, Valid: true},
		Limit:  100,
	})
	if err != nil {
		return err
	}

	results := make([]UserProgressResponse, len(sessions))
	for i, s := range sessions {
		results[i] = UserProgressResponse{
			ID:              uuid.UUID(s.ID.Bytes),
			UserID:          uuid.UUID(s.UserID.Bytes),
			VocabularyID:    uuid.UUID(s.DeckID.Bytes), // Using deck_id as reference
			ExerciseType:    s.ExerciseType,
			Status:          "completed",
			Attempts:        s.TotalQuestions.Int32,
			CorrectCount:    s.CorrectAnswers.Int32,
			XpEarned:        s.XpEarned.Int64,
			LastAttemptedAt: toTimePtr(s.CompletedAt),
		}
	}

	return c.JSON(results)
}

// ExerciseStatsResponse for exercise statistics
type ExerciseStatsResponse struct {
	TotalSessions   int64   `json:"total_sessions"`
	TotalXP        int64   `json:"total_xp"`
	TotalCorrect   int64   `json:"total_correct"`
	TotalQuestions int64   `json:"total_questions"`
	AvgAccuracy    float64 `json:"avg_accuracy"`
	AvgDuration    float64 `json:"avg_duration_seconds"`
}

// GetExerciseStats godoc
// @Summary      Get exercise statistics
// @Description  Get aggregate statistics for user's exercise sessions
// @Tags         progress
// @Produce      json
// @Security     BearerAuth
// @Success      200 {object} ExerciseStatsResponse
// @Failure      401 {object} ErrorResponse
// @Failure      500 {object} ErrorResponse
// @Router       /progress/stats [get]
func (h *ExerciseHandler) GetExerciseStats(c *fiber.Ctx) error {
	userID := currentUserID(c)

	sessions, err := h.svc.GetUserExerciseSessions(c.UserContext(), db.GetUserExerciseSessionsParams{
		UserID: pgtype.UUID{Bytes: userID, Valid: true},
		Limit:  1000,
	})
	if err != nil {
		return err
	}

	var totalXP, totalCorrect, totalQuestions int64
	var totalDuration float64
	for _, s := range sessions {
		totalXP += s.XpEarned.Int64
		totalCorrect += int64(s.CorrectAnswers.Int32)
		totalQuestions += int64(s.TotalQuestions.Int32)
		totalDuration += float64(s.DurationSeconds.Int32)
	}

	avgAccuracy := 0.0
	if totalQuestions > 0 {
		avgAccuracy = float64(totalCorrect) / float64(totalQuestions) * 100
	}

	avgDuration := 0.0
	if len(sessions) > 0 {
		avgDuration = totalDuration / float64(len(sessions))
	}

	return c.JSON(ExerciseStatsResponse{
		TotalSessions:   int64(len(sessions)),
		TotalXP:        totalXP,
		TotalCorrect:   totalCorrect,
		TotalQuestions: totalQuestions,
		AvgAccuracy:    avgAccuracy,
		AvgDuration:    avgDuration,
	})
}

// DeckWithVocabulariesResponse includes deck with its vocabularies
type DeckWithVocabulariesResponse struct {
	DeckResponse
	Vocabularies []VocabularyResponse `json:"vocabularies"`
}

// VocabularyResponse represents vocabulary for the API
type VocabularyResponse struct {
	ID         uuid.UUID `json:"id"`
	LanguageID string    `json:"language_id"`
	Term       string    `json:"term"`
	Phonetic   string    `json:"phonetic"`
	Meaning    string    `json:"meaning"`
	Example    string    `json:"example"`
	Topic      string    `json:"topic"`
	Level      string    `json:"level"`
	AudioURL   string    `json:"audio_url"`
	ImageURL   string    `json:"image_url"`
}

// Helper functions

func deckToResponse(d db.UserDeck) DeckResponse {
	return DeckResponse{
		ID:          uuid.UUID(d.ID.Bytes),
		UserID:      uuid.UUID(d.UserID.Bytes),
		Name:        d.Name,
		Description: d.Description.String,
		Color:       d.Color.String,
		Icon:        d.Icon.String,
		IsPublic:    d.IsPublic.Bool,
		IsSystem:    d.IsSystem.Bool,
		CreatedAt:   d.CreatedAt.Time,
		UpdatedAt:   d.UpdatedAt.Time,
	}
}

func grammarProgressToResponse(p db.UserGrammarProgress) GrammarProgressResponse {
	resp := GrammarProgressResponse{
		ID:               uuid.UUID(p.ID.Bytes),
		UserID:           uuid.UUID(p.UserID.Bytes),
		LessonID:         uuid.UUID(p.LessonID.Bytes),
		Level:            p.Level,
		Attempts:         p.Attempts.Int32,
		CorrectCount:     p.CorrectCount.Int32,
		XpEarned:         p.XpEarned.Int64,
		Status:           p.Status.String,
		ConsecutiveFails: p.ConsecutiveFails.Int32,
		SrsStage:         p.SrsStage.Int32,
		EaseFactor:       p.EaseFactor.Float64,
		IntervalDays:     p.IntervalDays.Int32,
		NextReviewAt:     toTimePtr(p.NextReviewAt),
		CreatedAt:        p.CreatedAt.Time,
		UpdatedAt:        p.UpdatedAt.Time,
	}
	return resp
}

func vocabulariesToResponse(vocabularies []db.Vocabulary) []VocabularyResponse {
	results := make([]VocabularyResponse, len(vocabularies))
	for i, v := range vocabularies {
		results[i] = VocabularyResponse{
			ID:         uuid.UUID(v.ID.Bytes),
			LanguageID: v.LanguageID,
			Term:       v.Term,
			Phonetic:   v.Phonetic.String,
			Meaning:    v.Meaning,
			Example:    v.Example.String,
			Topic:      v.Topic.String,
			Level:      v.Level.String,
			AudioURL:   v.AudioUrl.String,
			ImageURL:   v.ImageUrl.String,
		}
	}
	return results
}

func toPgText(s string) pgtype.Text {
	if s == "" {
		return pgtype.Text{Valid: false}
	}
	return pgtype.Text{String: s, Valid: true}
}

func toTimePtr(t pgtype.Timestamptz) *time.Time {
	if !t.Valid {
		return nil
	}
	return &t.Time
}
