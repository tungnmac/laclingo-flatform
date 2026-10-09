package service

import (
	"context"
	"errors"

	"laclingo-backend/internal/repository/db"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

// ClassRepository định nghĩa Interface tiếp xúc với cơ sở dữ liệu. BeginTx +
// WithTx (promoted từ *db.Queries) dùng để chạy ReplaceClassLessons trong 1
// transaction thật (xoá hết rồi insert lại theo thứ tự mảng mới) — khớp cách
// MissionService.RecordAction đã dùng.
type ClassRepository interface {
	BeginTx(ctx context.Context) (pgx.Tx, error)
	WithTx(tx pgx.Tx) *db.Queries

	ListClassesByLanguage(ctx context.Context, languageID string) ([]db.Class, error)
	GetClassByID(ctx context.Context, id pgtype.UUID) (db.Class, error)
	ListMyEnrollmentsByLanguage(ctx context.Context, arg db.ListMyEnrollmentsByLanguageParams) ([]pgtype.UUID, error)
	EnrollInClass(ctx context.Context, arg db.EnrollInClassParams) error
	ListClassProgressByLanguage(ctx context.Context, arg db.ListClassProgressByLanguageParams) ([]db.ListClassProgressByLanguageRow, error)
	ListClassLessonsByClass(ctx context.Context, classID pgtype.UUID) ([]db.ListClassLessonsByClassRow, error)
	ListClassLessonsWithProgress(ctx context.Context, arg db.ListClassLessonsWithProgressParams) ([]db.ListClassLessonsWithProgressRow, error)

	CreateClass(ctx context.Context, arg db.CreateClassParams) (db.Class, error)
	UpdateClass(ctx context.Context, arg db.UpdateClassParams) (db.Class, error)
	DeleteClass(ctx context.Context, id pgtype.UUID) error
	ListClassesAdminPaged(ctx context.Context, arg db.ListClassesAdminPagedParams) ([]db.ListClassesAdminPagedRow, error)
}

type ClassService struct {
	repo ClassRepository
}

func NewClassService(repo ClassRepository) *ClassService {
	return &ClassService{repo: repo}
}

// ClassRequest — body tạo/sửa lớp (admin)
type ClassRequest struct {
	LanguageID  string `json:"language_id"`
	Title       string `json:"title"`
	Description string `json:"description,omitempty"`
	Level       string `json:"level"`
	OrderIndex  int32  `json:"order_index"`
}

// ClassAdminResponse — 1 lớp nhìn từ phía admin (không kèm giáo án)
type ClassAdminResponse struct {
	ID          uuid.UUID `json:"id" swaggertype:"string" format:"uuid"`
	LanguageID  string    `json:"language_id"`
	Title       string    `json:"title"`
	Description string    `json:"description,omitempty"`
	Level       string    `json:"level"`
	OrderIndex  int32     `json:"order_index"`
}

// ClassSummary — 1 lớp trong danh sách (learner), kèm trạng thái ghi danh + % tiến độ của user hiện tại
type ClassSummary struct {
	ID              uuid.UUID `json:"id" swaggertype:"string" format:"uuid"`
	Title           string    `json:"title"`
	Description     string    `json:"description,omitempty"`
	Level           string    `json:"level"`
	OrderIndex      int32     `json:"order_index"`
	LessonCount     int       `json:"lesson_count"`
	Enrolled        bool      `json:"enrolled"`
	ProgressPercent int       `json:"progress_percent"`
}

// ClassLessonProgress — 1 bài trong giáo án, kèm trạng thái hoàn thành của user hiện tại
type ClassLessonProgress struct {
	LessonID   uuid.UUID `json:"lesson_id" swaggertype:"string" format:"uuid"`
	Code       string    `json:"code"`
	Title      string    `json:"title"`
	Level      string    `json:"level"`
	OrderIndex int32     `json:"order_index"`
	Completed  bool      `json:"completed"`
}

// ClassLessonAdmin — 1 bài trong giáo án (admin, không cần completed)
type ClassLessonAdmin struct {
	LessonID   uuid.UUID `json:"lesson_id" swaggertype:"string" format:"uuid"`
	Code       string    `json:"code"`
	Title      string    `json:"title"`
	Level      string    `json:"level"`
	OrderIndex int32     `json:"order_index"`
}

// ClassDetail — 1 lớp đầy đủ (learner), kèm giáo án có đánh dấu bài đã xong
type ClassDetail struct {
	ID              uuid.UUID             `json:"id" swaggertype:"string" format:"uuid"`
	Title           string                `json:"title"`
	Description     string                `json:"description,omitempty"`
	Level           string                `json:"level"`
	Enrolled        bool                  `json:"enrolled"`
	ProgressPercent int                   `json:"progress_percent"`
	Lessons         []ClassLessonProgress `json:"lessons"`
}

func toClassAdminResponse(c db.Class) ClassAdminResponse {
	return ClassAdminResponse{
		ID:          uuid.UUID(c.ID.Bytes),
		LanguageID:  c.LanguageID,
		Title:       c.Title,
		Description: c.Description.String,
		Level:       c.Level,
		OrderIndex:  c.OrderIndex,
	}
}

// lessonDone — bài "xong" khi có ít nhất 1 bài tập VÀ user đã làm đúng hết.
// Lớp chưa có bài tập nào (total=0) KHÔNG coi là xong — tránh 100% giả vì rỗng.
func lessonDone(totalExercises, completedExercises int64) bool {
	return totalExercises > 0 && completedExercises >= totalExercises
}

// percent — % nguyên, 0 nếu không có mẫu số (lớp chưa có giáo án).
func percent(done, total int) int {
	if total == 0 {
		return 0
	}
	return done * 100 / total
}

// ListByLanguage trả về toàn bộ lớp của 1 ngôn ngữ, kèm ghi danh + % tiến độ của userID
func (s *ClassService) ListByLanguage(ctx context.Context, userID uuid.UUID, languageID string) ([]ClassSummary, error) {
	classes, err := s.repo.ListClassesByLanguage(ctx, languageID)
	if err != nil {
		return nil, err
	}

	progressRows, err := s.repo.ListClassProgressByLanguage(ctx, db.ListClassProgressByLanguageParams{
		UserID: toPgUUID(userID), LanguageID: languageID,
	})
	if err != nil {
		return nil, err
	}
	type agg struct{ total, done int }
	byClass := map[uuid.UUID]*agg{}
	for _, r := range progressRows {
		classID := uuid.UUID(r.ClassID.Bytes)
		a := byClass[classID]
		if a == nil {
			a = &agg{}
			byClass[classID] = a
		}
		a.total++
		if lessonDone(r.TotalExercises, r.CompletedExercises) {
			a.done++
		}
	}

	enrolledRows, err := s.repo.ListMyEnrollmentsByLanguage(ctx, db.ListMyEnrollmentsByLanguageParams{
		UserID: toPgUUID(userID), LanguageID: languageID,
	})
	if err != nil {
		return nil, err
	}
	enrolled := make(map[uuid.UUID]bool, len(enrolledRows))
	for _, id := range enrolledRows {
		enrolled[uuid.UUID(id.Bytes)] = true
	}

	results := make([]ClassSummary, 0, len(classes))
	for _, c := range classes {
		id := uuid.UUID(c.ID.Bytes)
		a := byClass[id]
		lessonCount, done := 0, 0
		if a != nil {
			lessonCount, done = a.total, a.done
		}
		isEnrolled := enrolled[id]
		progressPercent := 0
		if isEnrolled {
			progressPercent = percent(done, lessonCount)
		}
		results = append(results, ClassSummary{
			ID: id, Title: c.Title, Description: c.Description.String, Level: c.Level, OrderIndex: c.OrderIndex,
			LessonCount: lessonCount, Enrolled: isEnrolled, ProgressPercent: progressPercent,
		})
	}
	return results, nil
}

// GetDetail trả về 1 lớp đầy đủ kèm giáo án có đánh dấu bài đã xong của userID
func (s *ClassService) GetDetail(ctx context.Context, userID, classID uuid.UUID) (ClassDetail, error) {
	class, err := s.repo.GetClassByID(ctx, toPgUUID(classID))
	if errors.Is(err, pgx.ErrNoRows) {
		return ClassDetail{}, ErrNotFound
	}
	if err != nil {
		return ClassDetail{}, err
	}

	lessonRows, err := s.repo.ListClassLessonsWithProgress(ctx, db.ListClassLessonsWithProgressParams{
		UserID: toPgUUID(userID), ClassID: toPgUUID(classID),
	})
	if err != nil {
		return ClassDetail{}, err
	}
	lessons := make([]ClassLessonProgress, 0, len(lessonRows))
	done := 0
	for _, r := range lessonRows {
		completed := lessonDone(r.TotalExercises, r.CompletedExercises)
		if completed {
			done++
		}
		lessons = append(lessons, ClassLessonProgress{
			LessonID: uuid.UUID(r.LessonID.Bytes), Code: r.Code, Title: r.Title, Level: r.Level.String,
			OrderIndex: r.OrderIndex, Completed: completed,
		})
	}

	enrolledRows, err := s.repo.ListMyEnrollmentsByLanguage(ctx, db.ListMyEnrollmentsByLanguageParams{
		UserID: toPgUUID(userID), LanguageID: class.LanguageID,
	})
	if err != nil {
		return ClassDetail{}, err
	}
	isEnrolled := false
	for _, id := range enrolledRows {
		if uuid.UUID(id.Bytes) == classID {
			isEnrolled = true
			break
		}
	}
	progressPercent := 0
	if isEnrolled {
		progressPercent = percent(done, len(lessons))
	}

	return ClassDetail{
		ID: classID, Title: class.Title, Description: class.Description.String, Level: class.Level,
		Enrolled: isEnrolled, ProgressPercent: progressPercent, Lessons: lessons,
	}, nil
}

// Enroll ghi danh userID vào 1 lớp — idempotent (ghi danh lại không lỗi).
func (s *ClassService) Enroll(ctx context.Context, userID, classID uuid.UUID) error {
	if _, err := s.repo.GetClassByID(ctx, toPgUUID(classID)); errors.Is(err, pgx.ErrNoRows) {
		return ErrNotFound
	} else if err != nil {
		return err
	}
	return s.repo.EnrollInClass(ctx, db.EnrollInClassParams{UserID: toPgUUID(userID), ClassID: toPgUUID(classID)})
}

// ===== Admin =====

func (s *ClassService) Create(ctx context.Context, req ClassRequest) (ClassAdminResponse, error) {
	if req.Title == "" || req.LanguageID == "" {
		return ClassAdminResponse{}, ErrInvalidInput
	}
	c, err := s.repo.CreateClass(ctx, db.CreateClassParams{
		LanguageID: req.LanguageID, Title: req.Title,
		Description: pgtype.Text{String: req.Description, Valid: req.Description != ""},
		Level:       req.Level, OrderIndex: req.OrderIndex,
	})
	if err != nil {
		return ClassAdminResponse{}, err
	}
	return toClassAdminResponse(c), nil
}

func (s *ClassService) Update(ctx context.Context, id uuid.UUID, req ClassRequest) (ClassAdminResponse, error) {
	if req.Title == "" {
		return ClassAdminResponse{}, ErrInvalidInput
	}
	c, err := s.repo.UpdateClass(ctx, db.UpdateClassParams{
		ID: toPgUUID(id), Title: req.Title,
		Description: pgtype.Text{String: req.Description, Valid: req.Description != ""},
		Level:       req.Level, OrderIndex: req.OrderIndex,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return ClassAdminResponse{}, ErrNotFound
	}
	if err != nil {
		return ClassAdminResponse{}, err
	}
	return toClassAdminResponse(c), nil
}

// Delete xoá 1 lớp (CASCADE xoá giáo án + ghi danh, KHÔNG đụng grammar_lessons gốc)
func (s *ClassService) Delete(ctx context.Context, id uuid.UUID) error {
	return s.repo.DeleteClass(ctx, toPgUUID(id))
}

func (s *ClassService) ListAdmin(ctx context.Context, languageID, search string, page, pageSize int32) (PageResult[ClassAdminResponse], error) {
	limit, offset := NormalizePage(page, pageSize)
	rows, err := s.repo.ListClassesAdminPaged(ctx, db.ListClassesAdminPagedParams{
		LanguageID: languageID, Search: pgtype.Text{String: search, Valid: search != ""}, Limit: limit, Offset: offset,
	})
	if err != nil {
		return PageResult[ClassAdminResponse]{}, err
	}
	results := make([]ClassAdminResponse, 0, len(rows))
	var total int64
	for _, r := range rows {
		total = r.TotalCount
		results = append(results, toClassAdminResponse(db.Class{
			ID: r.ID, LanguageID: r.LanguageID, Title: r.Title, Description: r.Description,
			Level: r.Level, OrderIndex: r.OrderIndex, CreatedAt: r.CreatedAt, UpdatedAt: r.UpdatedAt,
		}))
	}
	return PageResult[ClassAdminResponse]{Items: results, Total: total}, nil
}

// GetLessonsAdmin trả về giáo án hiện tại của 1 lớp (admin, để tiền-điền form sửa)
func (s *ClassService) GetLessonsAdmin(ctx context.Context, classID uuid.UUID) ([]ClassLessonAdmin, error) {
	rows, err := s.repo.ListClassLessonsByClass(ctx, toPgUUID(classID))
	if err != nil {
		return nil, err
	}
	results := make([]ClassLessonAdmin, 0, len(rows))
	for _, r := range rows {
		results = append(results, ClassLessonAdmin{
			LessonID: uuid.UUID(r.LessonID.Bytes), Code: r.Code, Title: r.Title, Level: r.Level.String, OrderIndex: r.OrderIndex,
		})
	}
	return results, nil
}

// ReplaceLessons set lại TOÀN BỘ giáo án của 1 lớp theo đúng thứ tự lessonIDs
// (xoá hết class_lessons cũ rồi insert lại) — 1 transaction, không add/remove/reorder rời.
func (s *ClassService) ReplaceLessons(ctx context.Context, classID uuid.UUID, lessonIDs []uuid.UUID) error {
	tx, err := s.repo.BeginTx(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	qtx := s.repo.WithTx(tx)

	if err := qtx.DeleteClassLessons(ctx, toPgUUID(classID)); err != nil {
		return err
	}
	for i, lessonID := range lessonIDs {
		if err := qtx.AddClassLesson(ctx, db.AddClassLessonParams{
			ClassID: toPgUUID(classID), LessonID: toPgUUID(lessonID), OrderIndex: int32(i),
		}); err != nil {
			return err
		}
	}
	return tx.Commit(ctx)
}
