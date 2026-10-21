package service

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"
	"unicode/utf8"

	"laclingo-backend/internal/repository/db"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

// DailyNoteRepository — Daily note (Nhật ký học). RIÊNG TƯ: mọi thao tác chỉ trên dữ liệu của chính user,
// không có hàm/route admin nào đọc note của học viên.
type DailyNoteRepository interface {
	BeginTx(ctx context.Context) (pgx.Tx, error)
	WithTx(tx pgx.Tx) *db.Queries
	GetUserTimezone(ctx context.Context, userID pgtype.UUID) (string, error)
	GetDailyNote(ctx context.Context, arg db.GetDailyNoteParams) (db.DailyNote, error)
	UpdateDailyNoteJournal(ctx context.Context, arg db.UpdateDailyNoteJournalParams) (db.DailyNote, error)
	ListDailyNoteTasks(ctx context.Context, noteID pgtype.UUID) ([]db.DailyNoteTask, error)
	CountDailyNoteTasks(ctx context.Context, noteID pgtype.UUID) (int32, error)
	GetDailyNoteTaskForUser(ctx context.Context, arg db.GetDailyNoteTaskForUserParams) (db.GetDailyNoteTaskForUserRow, error)
	UpdateDailyNoteTask(ctx context.Context, arg db.UpdateDailyNoteTaskParams) (db.DailyNoteTask, error)
	DeleteDailyNoteTask(ctx context.Context, id pgtype.UUID) error
	SetDailyNoteTaskPosition(ctx context.Context, arg db.SetDailyNoteTaskPositionParams) error
	AddDailyTaskProgress(ctx context.Context, arg db.AddDailyTaskProgressParams) error
	ListDailyNoteSummaries(ctx context.Context, arg db.ListDailyNoteSummariesParams) ([]db.ListDailyNoteSummariesRow, error)
	ListCarryableTasks(ctx context.Context, arg db.ListCarryableTasksParams) ([]db.DailyNoteTask, error)
	ListDailyTaskTemplates(ctx context.Context, userID pgtype.UUID) ([]db.DailyTaskTemplate, error)
	CreateDailyTaskTemplate(ctx context.Context, arg db.CreateDailyTaskTemplateParams) (db.DailyTaskTemplate, error)
	DeleteDailyTaskTemplate(ctx context.Context, arg db.DeleteDailyTaskTemplateParams) error
	CountDailyTaskTemplates(ctx context.Context, userID pgtype.UUID) (int32, error)
	ListDailyTaskItems(ctx context.Context, taskIds []pgtype.UUID) ([]db.DailyTaskItem, error)
	GetDailyTaskItemForUser(ctx context.Context, arg db.GetDailyTaskItemForUserParams) (db.GetDailyTaskItemForUserRow, error)
}

// DailyTask — 1 việc trong note
type DailyTask struct {
	ID          uuid.UUID  `json:"id" swaggertype:"string" format:"uuid"`
	Title       string     `json:"title"`
	Kind        string     `json:"kind" enums:"free,srs_review,learn_word,grammar_exercise,listening_practice,speaking_practice,challenge_participate"`
	Target      *int32     `json:"target,omitempty"` // nil = việc tích xong/chưa
	Progress    int32      `json:"progress"`
	Memo        string     `json:"memo"`
	Done        bool       `json:"done"`
	CompletedAt *time.Time `json:"completed_at,omitempty"`
	Repeat      bool       `json:"repeat"`  // đang lặp lại hằng ngày
	Carried     bool       `json:"carried"` // đã chuyển sang ngày sau
	CarriedIn   bool       `json:"carried_in"`
	// Checklist việc con — có việc con thì việc chỉ xong khi tích hết (và đủ mục tiêu nếu có)
	Items []DailyTaskItem `json:"items"`
}

// DailyTaskItem — 1 việc con trong checklist của việc
type DailyTaskItem struct {
	ID    uuid.UUID `json:"id" swaggertype:"string" format:"uuid"`
	Title string    `json:"title"`
	Done  bool      `json:"done"`
}

// DailyTaskItemRequest — thêm / sửa 1 việc con; trường bỏ trống = giữ nguyên
type DailyTaskItemRequest struct {
	Title *string `json:"title,omitempty" example:"Đọc lý thuyết"`
	Done  *bool   `json:"done,omitempty"`
}

// DailyNoteResponse — note của 1 ngày
type DailyNoteResponse struct {
	Date     string      `json:"date" example:"2026-10-20"`
	Today    string      `json:"today" example:"2026-10-20"`
	Editable bool        `json:"editable"` // chỉ note hôm nay
	Exists   bool        `json:"exists"`
	Journal  string      `json:"journal"`
	Tasks    []DailyTask `json:"tasks"`
	Streak   int         `json:"streak"`
	// YesterdayUnfinished — việc dở của hôm qua chưa chuyển (chỉ có khi xem hôm nay)
	YesterdayUnfinished []DailyTask `json:"yesterday_unfinished"`
}

// DailyNoteDay — tổng kết 1 ngày cho lịch tháng
type DailyNoteDay struct {
	Date      string `json:"date"`
	Total     int32  `json:"total"`
	Completed int32  `json:"completed"`
}

// DailyTaskCreateRequest — thêm việc vào note hôm nay
type DailyTaskCreateRequest struct {
	Title  string `json:"title" example:"Ôn 30 từ"`
	Kind   string `json:"kind" example:"srs_review"`
	Target *int32 `json:"target,omitempty" example:"30"`
	Memo   string `json:"memo,omitempty"`
	Repeat bool   `json:"repeat,omitempty"` // lặp lại hằng ngày
}

// DailyTaskUpdateRequest — sửa 1 việc hôm nay; trường bỏ trống = giữ nguyên. ClearTarget = đổi thành việc tích.
type DailyTaskUpdateRequest struct {
	Title       *string `json:"title,omitempty"`
	Target      *int32  `json:"target,omitempty"`
	ClearTarget bool    `json:"clear_target,omitempty"`
	Progress    *int32  `json:"progress,omitempty"`
	Done        *bool   `json:"done,omitempty"`
	Memo        *string `json:"memo,omitempty"`
	Repeat      *bool   `json:"repeat,omitempty"`
}

const maxDailyTaskProgress = 100000

type DailyNoteService struct {
	repo DailyNoteRepository
	now  func() time.Time
}

func NewDailyNoteService(repo DailyNoteRepository) *DailyNoteService {
	return &DailyNoteService{repo: repo, now: time.Now}
}

func pgDate(d string) (pgtype.Date, error) {
	t, err := time.Parse(dailyDateLayout, d)
	if err != nil {
		return pgtype.Date{}, fmt.Errorf("ngày không hợp lệ (YYYY-MM-DD): %w", ErrInvalidInput)
	}
	return pgtype.Date{Time: t, Valid: true}, nil
}

func dateString(d pgtype.Date) string { return d.Time.Format(dailyDateLayout) }

func (s *DailyNoteService) today(ctx context.Context, userID uuid.UUID) (string, error) {
	tz, err := s.repo.GetUserTimezone(ctx, toPgUUID(userID))
	if err != nil {
		return "", err
	}
	return localDate(s.now(), tz), nil
}

func toDailyTask(t db.DailyNoteTask) DailyTask {
	out := DailyTask{
		ID: uuid.UUID(t.ID.Bytes), Title: t.Title, Kind: t.Kind, Progress: t.Progress, Memo: t.Memo,
		Repeat: t.IsRepeat, Carried: t.CarriedAt.Valid, CarriedIn: t.CarriedFrom.Valid,
		Done: t.CompletedAt.Valid, Items: []DailyTaskItem{},
	}
	if t.Target.Valid {
		v := t.Target.Int32
		out.Target = &v
	}
	if t.CompletedAt.Valid {
		c := t.CompletedAt.Time
		out.CompletedAt = &c
	}
	return out
}

type dailyItemLister interface {
	ListDailyTaskItems(ctx context.Context, taskIds []pgtype.UUID) ([]db.DailyTaskItem, error)
}

// toDailyTasks — các việc kèm checklist việc con (1 query cho cả danh sách)
func toDailyTasks(ctx context.Context, q dailyItemLister, rows []db.DailyNoteTask) ([]DailyTask, error) {
	out := make([]DailyTask, 0, len(rows))
	if len(rows) == 0 {
		return out, nil
	}
	ids := make([]pgtype.UUID, 0, len(rows))
	for _, r := range rows {
		ids = append(ids, r.ID)
	}
	items, err := q.ListDailyTaskItems(ctx, ids)
	if err != nil {
		return nil, err
	}
	byTask := make(map[pgtype.UUID][]DailyTaskItem, len(rows))
	for _, it := range items {
		byTask[it.TaskID] = append(byTask[it.TaskID], DailyTaskItem{ID: uuid.UUID(it.ID.Bytes), Title: it.Title, Done: it.DoneAt.Valid})
	}
	for _, r := range rows {
		t := toDailyTask(r)
		if its := byTask[r.ID]; its != nil {
			t.Items = its
		}
		out = append(out, t)
	}
	return out, nil
}

func toDailyTaskWithItems(ctx context.Context, q dailyItemLister, row db.DailyNoteTask) (DailyTask, error) {
	tasks, err := toDailyTasks(ctx, q, []db.DailyNoteTask{row})
	if err != nil {
		return DailyTask{}, err
	}
	return tasks[0], nil
}

// ensureNote trả note của ngày date; note HÔM NAY chưa có thì tạo kèm các việc lặp lại (1 transaction — 2 request
// cùng lúc chỉ 1 request tạo được note nên việc lặp không bị thêm 2 lần)
func (s *DailyNoteService) ensureNote(ctx context.Context, userID uuid.UUID, date pgtype.Date) (db.DailyNote, error) {
	note, err := s.repo.GetDailyNote(ctx, db.GetDailyNoteParams{UserID: toPgUUID(userID), NoteDate: date})
	if err == nil || !errors.Is(err, pgx.ErrNoRows) {
		return note, err
	}
	tx, err := s.repo.BeginTx(ctx)
	if err != nil {
		return db.DailyNote{}, err
	}
	defer tx.Rollback(ctx)
	qtx := s.repo.WithTx(tx)
	note, err = qtx.InsertDailyNote(ctx, db.InsertDailyNoteParams{UserID: toPgUUID(userID), NoteDate: date})
	if errors.Is(err, pgx.ErrNoRows) { // request khác vừa tạo
		return s.repo.GetDailyNote(ctx, db.GetDailyNoteParams{UserID: toPgUUID(userID), NoteDate: date})
	}
	if err != nil {
		return db.DailyNote{}, err
	}
	templates, err := qtx.ListDailyTaskTemplates(ctx, toPgUUID(userID))
	if err != nil {
		return db.DailyNote{}, err
	}
	for i, tpl := range templates {
		if i >= maxDailyTasks {
			break
		}
		task, err := qtx.CreateDailyNoteTask(ctx, db.CreateDailyNoteTaskParams{
			NoteID: note.ID, Title: tpl.Title, Kind: tpl.Kind, Target: tpl.Target, TemplateID: tpl.ID, IsRepeat: true,
		})
		if err != nil {
			return db.DailyNote{}, err
		}
		for k, title := range tpl.Checklist { // checklist của mẫu → việc con chưa tích
			if k >= maxDailyTaskItems {
				break
			}
			if _, err := qtx.CreateDailyTaskItem(ctx, db.CreateDailyTaskItemParams{TaskID: task.ID, Title: title}); err != nil {
				return db.DailyNote{}, err
			}
		}
	}
	return note, tx.Commit(ctx)
}

// Today — note hôm nay (tạo nếu chưa có) + chuỗi ngày + việc dở hôm qua
func (s *DailyNoteService) Today(ctx context.Context, userID uuid.UUID) (DailyNoteResponse, error) {
	today, err := s.today(ctx, userID)
	if err != nil {
		return DailyNoteResponse{}, err
	}
	date, _ := pgDate(today)
	note, err := s.ensureNote(ctx, userID, date)
	if err != nil {
		return DailyNoteResponse{}, err
	}
	tasks, err := s.repo.ListDailyNoteTasks(ctx, note.ID)
	if err != nil {
		return DailyNoteResponse{}, err
	}
	yesterday := pgtype.Date{Time: date.Time.AddDate(0, 0, -1), Valid: true}
	unfinished, err := s.repo.ListCarryableTasks(ctx, db.ListCarryableTasksParams{UserID: toPgUUID(userID), NoteDate: yesterday})
	if err != nil {
		return DailyNoteResponse{}, err
	}
	st, err := s.streak(ctx, userID, date)
	if err != nil {
		return DailyNoteResponse{}, err
	}
	out, err := toDailyTasks(ctx, s.repo, tasks)
	if err != nil {
		return DailyNoteResponse{}, err
	}
	outUnfinished, err := toDailyTasks(ctx, s.repo, unfinished)
	if err != nil {
		return DailyNoteResponse{}, err
	}
	return DailyNoteResponse{
		Date: today, Today: today, Editable: true, Exists: true, Journal: note.Journal,
		Tasks: out, Streak: st, YesterdayUnfinished: outUnfinished,
	}, nil
}

func (s *DailyNoteService) streak(ctx context.Context, userID uuid.UUID, today pgtype.Date) (int, error) {
	rows, err := s.repo.ListDailyNoteSummaries(ctx, db.ListDailyNoteSummariesParams{
		UserID: toPgUUID(userID), FromDate: pgtype.Date{Time: today.Time.AddDate(0, 0, -dailyStreakLookbackDs), Valid: true}, ToDate: today,
	})
	if err != nil {
		return 0, err
	}
	days := make(map[string]daySummary, len(rows))
	for _, r := range rows {
		days[dateString(r.NoteDate)] = daySummary{Total: r.Total, Completed: r.Completed}
	}
	return streak(days, dateString(today)), nil
}

// Day — note của 1 ngày (YYYY-MM-DD). Hôm nay → như Today; ngày cũ chỉ xem (không tạo); ngày tương lai → lỗi.
func (s *DailyNoteService) Day(ctx context.Context, userID uuid.UUID, day string) (DailyNoteResponse, error) {
	date, err := pgDate(day)
	if err != nil {
		return DailyNoteResponse{}, err
	}
	today, err := s.today(ctx, userID)
	if err != nil {
		return DailyNoteResponse{}, err
	}
	switch {
	case day == today:
		return s.Today(ctx, userID)
	case day > today:
		return DailyNoteResponse{}, fmt.Errorf("chưa tới ngày %s: %w", day, ErrInvalidInput)
	}
	resp := DailyNoteResponse{Date: day, Today: today, Tasks: []DailyTask{}, YesterdayUnfinished: []DailyTask{}}
	note, err := s.repo.GetDailyNote(ctx, db.GetDailyNoteParams{UserID: toPgUUID(userID), NoteDate: date})
	if errors.Is(err, pgx.ErrNoRows) {
		return resp, nil
	}
	if err != nil {
		return DailyNoteResponse{}, err
	}
	tasks, err := s.repo.ListDailyNoteTasks(ctx, note.ID)
	if err != nil {
		return DailyNoteResponse{}, err
	}
	out, err := toDailyTasks(ctx, s.repo, tasks)
	if err != nil {
		return DailyNoteResponse{}, err
	}
	resp.Exists, resp.Journal, resp.Tasks = true, note.Journal, out
	return resp, nil
}

// Month — tổng kết từng ngày có note trong tháng YYYY-MM (lịch)
func (s *DailyNoteService) Month(ctx context.Context, userID uuid.UUID, month string) ([]DailyNoteDay, error) {
	start, err := time.Parse("2006-01", month)
	if err != nil {
		return nil, fmt.Errorf("tháng không hợp lệ (YYYY-MM): %w", ErrInvalidInput)
	}
	rows, err := s.repo.ListDailyNoteSummaries(ctx, db.ListDailyNoteSummariesParams{
		UserID: toPgUUID(userID), FromDate: pgtype.Date{Time: start, Valid: true}, ToDate: pgtype.Date{Time: start.AddDate(0, 1, -1), Valid: true},
	})
	if err != nil {
		return nil, err
	}
	out := make([]DailyNoteDay, 0, len(rows))
	for _, r := range rows {
		out = append(out, DailyNoteDay{Date: dateString(r.NoteDate), Total: r.Total, Completed: r.Completed})
	}
	return out, nil
}

// SaveJournal — lưu ghi chú trong ngày của hôm nay
func (s *DailyNoteService) SaveJournal(ctx context.Context, userID uuid.UUID, journal string) (DailyNoteResponse, error) {
	if utf8.RuneCountInString(journal) > maxDailyJournalLen {
		return DailyNoteResponse{}, fmt.Errorf("ghi chú trong ngày tối đa %d ký tự: %w", maxDailyJournalLen, ErrInvalidInput)
	}
	today, err := s.today(ctx, userID)
	if err != nil {
		return DailyNoteResponse{}, err
	}
	date, _ := pgDate(today)
	if _, err := s.ensureNote(ctx, userID, date); err != nil {
		return DailyNoteResponse{}, err
	}
	if _, err := s.repo.UpdateDailyNoteJournal(ctx, db.UpdateDailyNoteJournalParams{UserID: toPgUUID(userID), NoteDate: date, Journal: journal}); err != nil {
		return DailyNoteResponse{}, err
	}
	return s.Today(ctx, userID)
}

func pgInt4(v *int32) pgtype.Int4 {
	if v == nil {
		return pgtype.Int4{}
	}
	return pgtype.Int4{Int32: *v, Valid: true}
}

func pgTime(t *time.Time) pgtype.Timestamptz {
	if t == nil {
		return pgtype.Timestamptz{}
	}
	return pgtype.Timestamptz{Time: *t, Valid: true}
}

func tooManyTasks() error {
	return fmt.Errorf("mỗi ngày tối đa %d việc: %w", maxDailyTasks, ErrInvalidInput)
}

// lockAndCheckLimit khoá note (FOR UPDATE) rồi đếm việc — 2 request cùng lúc không vượt giới hạn 20 việc
func lockAndCheckLimit(ctx context.Context, qtx *db.Queries, noteID pgtype.UUID) error {
	if _, err := qtx.LockDailyNote(ctx, noteID); err != nil {
		return err
	}
	n, err := qtx.CountDailyNoteTasks(ctx, noteID)
	if err != nil {
		return err
	}
	if n >= maxDailyTasks {
		return tooManyTasks()
	}
	return nil
}

func (s *DailyNoteService) checkTemplateLimit(ctx context.Context, userID uuid.UUID) error {
	n, err := s.repo.CountDailyTaskTemplates(ctx, toPgUUID(userID))
	if err != nil {
		return err
	}
	if n >= maxDailyTasks {
		return fmt.Errorf("tối đa %d việc lặp lại: %w", maxDailyTasks, ErrInvalidInput)
	}
	return nil
}

// CreateTask — thêm việc vào note hôm nay (repeat → lưu thành việc lặp lại hằng ngày)
func (s *DailyNoteService) CreateTask(ctx context.Context, userID uuid.UUID, req DailyTaskCreateRequest) (DailyTask, error) {
	req.Title, req.Memo = strings.TrimSpace(req.Title), strings.TrimSpace(req.Memo)
	if err := validateTaskInput(dailyTaskInput{Title: req.Title, Kind: req.Kind, Target: req.Target, Memo: req.Memo}); err != nil {
		return DailyTask{}, err
	}
	today, err := s.today(ctx, userID)
	if err != nil {
		return DailyTask{}, err
	}
	date, _ := pgDate(today)
	note, err := s.ensureNote(ctx, userID, date)
	if err != nil {
		return DailyTask{}, err
	}
	tx, err := s.repo.BeginTx(ctx)
	if err != nil {
		return DailyTask{}, err
	}
	defer tx.Rollback(ctx)
	qtx := s.repo.WithTx(tx)
	if err := lockAndCheckLimit(ctx, qtx, note.ID); err != nil {
		return DailyTask{}, err
	}
	var templateID pgtype.UUID
	if req.Repeat {
		if err := s.checkTemplateLimit(ctx, userID); err != nil {
			return DailyTask{}, err
		}
		tpl, err := qtx.CreateDailyTaskTemplate(ctx, db.CreateDailyTaskTemplateParams{
			UserID: toPgUUID(userID), Title: req.Title, Kind: req.Kind, Target: pgInt4(req.Target), Checklist: []string{},
		})
		if err != nil {
			return DailyTask{}, asDuplicate(err, fmt.Sprintf("Việc lặp lại \"%s\" đã có", shortText(req.Title)))
		}
		templateID = tpl.ID
	}
	task, err := qtx.CreateDailyNoteTask(ctx, db.CreateDailyNoteTaskParams{
		NoteID: note.ID, Title: req.Title, Kind: req.Kind, Target: pgInt4(req.Target), Memo: req.Memo, TemplateID: templateID, IsRepeat: req.Repeat,
	})
	if err != nil {
		return DailyTask{}, asDuplicate(err, fmt.Sprintf("Hôm nay đã có việc \"%s\"", shortText(req.Title)))
	}
	if err := tx.Commit(ctx); err != nil {
		return DailyTask{}, err
	}
	return toDailyTask(task), nil
}

// todayTask — việc của user thuộc note HÔM NAY (việc của người khác → ErrNotFound; ngày cũ → không sửa được)
func (s *DailyNoteService) todayTask(ctx context.Context, userID, taskID uuid.UUID) (db.GetDailyNoteTaskForUserRow, string, error) {
	row, err := s.repo.GetDailyNoteTaskForUser(ctx, db.GetDailyNoteTaskForUserParams{ID: toPgUUID(taskID), UserID: toPgUUID(userID)})
	if errors.Is(err, pgx.ErrNoRows) {
		return row, "", ErrNotFound
	}
	if err != nil {
		return row, "", err
	}
	today, err := s.today(ctx, userID)
	if err != nil {
		return row, "", err
	}
	if dateString(row.NoteDate) != today {
		return row, today, fmt.Errorf("chỉ sửa được việc của hôm nay: %w", ErrInvalidInput)
	}
	return row, today, nil
}

func taskFromRow(r db.GetDailyNoteTaskForUserRow) db.DailyNoteTask {
	return db.DailyNoteTask{
		ID: r.ID, NoteID: r.NoteID, Title: r.Title, Kind: r.Kind, Target: r.Target, Progress: r.Progress, Memo: r.Memo,
		CompletedAt: r.CompletedAt, CarriedFrom: r.CarriedFrom, CarriedAt: r.CarriedAt, TemplateID: r.TemplateID,
		Position: r.Position, CreatedAt: r.CreatedAt,
	}
}

// UpdateTask — sửa tiêu đề / mục tiêu / tiến độ / tích xong / ghi chú / lặp lại của 1 việc hôm nay
func (s *DailyNoteService) UpdateTask(ctx context.Context, userID, taskID uuid.UUID, req DailyTaskUpdateRequest) (DailyTask, error) {
	row, _, err := s.todayTask(ctx, userID, taskID)
	if err != nil {
		return DailyTask{}, err
	}
	t := taskFromRow(row)
	title, memo := t.Title, t.Memo
	if req.Title != nil {
		title = strings.TrimSpace(*req.Title)
	}
	if req.Memo != nil {
		memo = strings.TrimSpace(*req.Memo)
	}
	var target *int32
	if t.Target.Valid {
		v := t.Target.Int32
		target = &v
	}
	if req.ClearTarget {
		target = nil
	} else if req.Target != nil {
		target = req.Target
	}
	if err := validateTaskInput(dailyTaskInput{Title: title, Kind: t.Kind, Target: target, Memo: memo}); err != nil {
		return DailyTask{}, err
	}
	progress := t.Progress
	if req.Progress != nil {
		if *req.Progress < 0 || *req.Progress > maxDailyTaskProgress {
			return DailyTask{}, fmt.Errorf("tiến độ phải từ 0 đến %d: %w", maxDailyTaskProgress, ErrInvalidInput)
		}
		progress = *req.Progress
	}
	done := req.Done
	if target != nil && done != nil { // việc có mục tiêu: tích xong = đủ mục tiêu, bỏ tích = dưới mục tiêu
		if *done {
			progress = max(progress, *target)
		} else {
			progress = min(progress, *target-1)
		}
		done = nil
	}
	var prev *time.Time
	if t.CompletedAt.Valid {
		c := t.CompletedAt.Time
		prev = &c
	}
	completed := completedAt(target, progress, prev, done, s.now())

	tx, err := s.repo.BeginTx(ctx)
	if err != nil {
		return DailyTask{}, err
	}
	defer tx.Rollback(ctx)
	qtx := s.repo.WithTx(tx)
	// Khoá việc: chạy lần lượt với thao tác việc con (checklist đọc dưới đây không bị thiếu việc con vừa thêm)
	if _, err := qtx.LockDailyNoteTask(ctx, t.ID); err != nil {
		return DailyTask{}, err
	}
	if req.Done != nil { // việc có checklist: xong/chưa theo việc con, không tích tay
		if n, err := qtx.CountDailyTaskItems(ctx, t.ID); err != nil {
			return DailyTask{}, err
		} else if n > 0 {
			return DailyTask{}, fmt.Errorf("việc có checklist tự xong khi tích hết việc con: %w", ErrInvalidInput)
		}
	}
	templateID, isRepeat := t.TemplateID, t.IsRepeat
	if req.Repeat != nil {
		switch {
		case *req.Repeat && !templateID.Valid:
			if err := s.checkTemplateLimit(ctx, userID); err != nil {
				return DailyTask{}, err
			}
			checklist, err := itemTitles(ctx, qtx, t.ID)
			if err != nil {
				return DailyTask{}, err
			}
			tpl, err := qtx.CreateDailyTaskTemplate(ctx, db.CreateDailyTaskTemplateParams{
				UserID: toPgUUID(userID), Title: title, Kind: t.Kind, Target: pgInt4(target), Checklist: checklist,
			})
			if err != nil {
				return DailyTask{}, asDuplicate(err, fmt.Sprintf("Việc lặp lại \"%s\" đã có", shortText(title)))
			}
			templateID, isRepeat = tpl.ID, true
		case !*req.Repeat && templateID.Valid:
			if err := qtx.DeleteDailyTaskTemplate(ctx, db.DeleteDailyTaskTemplateParams{ID: templateID, UserID: toPgUUID(userID)}); err != nil {
				return DailyTask{}, err
			}
			templateID, isRepeat = pgtype.UUID{}, false
		case !*req.Repeat:
			isRepeat = false
		}
	}
	// Đang lặp lại và đổi tiêu đề/mục tiêu → áp dụng cho các ngày sau
	if templateID.Valid && (title != t.Title || pgInt4(target) != t.Target) {
		if err := qtx.UpdateDailyTaskTemplate(ctx, db.UpdateDailyTaskTemplateParams{ID: templateID, UserID: toPgUUID(userID), Title: title, Target: pgInt4(target)}); err != nil {
			return DailyTask{}, asDuplicate(err, fmt.Sprintf("Việc lặp lại \"%s\" đã có", shortText(title)))
		}
	}
	updated, err := qtx.UpdateDailyNoteTask(ctx, db.UpdateDailyNoteTaskParams{
		ID: t.ID, Title: title, Target: pgInt4(target), Progress: progress, Memo: memo, CompletedAt: pgTime(completed),
		TemplateID: templateID, IsRepeat: isRepeat, ExpectedProgress: t.Progress,
	})
	if errors.Is(err, pgx.ErrNoRows) { // hoạt động học vừa cộng tiến độ giữa chừng
		return DailyTask{}, &duplicateError{msg: "Tiến độ vừa được cập nhật, vui lòng thử lại"}
	}
	if err != nil {
		return DailyTask{}, asDuplicate(err, fmt.Sprintf("Hôm nay đã có việc \"%s\"", shortText(title)))
	}
	// Có checklist: trạng thái xong theo việc con (+ mục tiêu)
	if updated, err = qtx.RefreshDailyTaskCompletion(ctx, updated.ID); err != nil {
		return DailyTask{}, err
	}
	res, err := toDailyTaskWithItems(ctx, qtx, updated)
	if err != nil {
		return DailyTask{}, err
	}
	return res, tx.Commit(ctx)
}

// DeleteTask — xoá 1 việc hôm nay (việc lặp lại vẫn lặp từ hôm sau — tắt bằng repeat=false)
func (s *DailyNoteService) DeleteTask(ctx context.Context, userID, taskID uuid.UUID) error {
	row, _, err := s.todayTask(ctx, userID, taskID)
	if err != nil {
		return err
	}
	tx, err := s.repo.BeginTx(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	qtx := s.repo.WithTx(tx)
	if err := qtx.DeleteDailyNoteTask(ctx, row.ID); err != nil {
		return err
	}
	if row.CarriedFrom.Valid { // xoá bản đã chuyển → việc gốc chuyển lại được, không còn tính là "đã chuyển"
		if err := qtx.ClearDailyTaskCarried(ctx, row.CarriedFrom); err != nil {
			return err
		}
	}
	return tx.Commit(ctx)
}

// MoveTask — đổi chỗ với việc kề trong note hôm nay, đánh lại thứ tự 0..n-1; ở đầu/cuối → không đổi
func (s *DailyNoteService) MoveTask(ctx context.Context, userID, taskID uuid.UUID, direction string) error {
	if direction != "up" && direction != "down" {
		return fmt.Errorf("direction phải là up hoặc down: %w", ErrInvalidInput)
	}
	row, _, err := s.todayTask(ctx, userID, taskID)
	if err != nil {
		return err
	}
	tasks, err := s.repo.ListDailyNoteTasks(ctx, row.NoteID)
	if err != nil {
		return err
	}
	i := -1
	for k, t := range tasks {
		if t.ID == row.ID {
			i = k
		}
	}
	j := i - 1
	if direction == "down" {
		j = i + 1
	}
	if i < 0 || j < 0 || j >= len(tasks) {
		return nil
	}
	tasks[i], tasks[j] = tasks[j], tasks[i]
	tx, err := s.repo.BeginTx(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	qtx := s.repo.WithTx(tx)
	for pos, t := range tasks {
		if err := qtx.SetDailyNoteTaskPosition(ctx, db.SetDailyNoteTaskPositionParams{ID: t.ID, Position: int32(pos)}); err != nil {
			return err
		}
	}
	return tx.Commit(ctx)
}

// CarryOver — chuyển 1 việc dở của ngày trước sang hôm nay với phần tiến độ còn thiếu (mỗi việc 1 lần)
func (s *DailyNoteService) CarryOver(ctx context.Context, userID, taskID uuid.UUID) (DailyTask, error) {
	row, err := s.repo.GetDailyNoteTaskForUser(ctx, db.GetDailyNoteTaskForUserParams{ID: toPgUUID(taskID), UserID: toPgUUID(userID)})
	if errors.Is(err, pgx.ErrNoRows) {
		return DailyTask{}, ErrNotFound
	}
	if err != nil {
		return DailyTask{}, err
	}
	today, err := s.today(ctx, userID)
	if err != nil {
		return DailyTask{}, err
	}
	if dateString(row.NoteDate) >= today {
		return DailyTask{}, fmt.Errorf("chỉ chuyển được việc của ngày trước: %w", ErrInvalidInput)
	}
	if row.CompletedAt.Valid || row.IsRepeat {
		return DailyTask{}, fmt.Errorf("việc đã xong hoặc là việc lặp lại, không cần chuyển: %w", ErrInvalidInput)
	}
	date, _ := pgDate(today)
	note, err := s.ensureNote(ctx, userID, date)
	if err != nil {
		return DailyTask{}, err
	}
	tx, err := s.repo.BeginTx(ctx)
	if err != nil {
		return DailyTask{}, err
	}
	defer tx.Rollback(ctx)
	qtx := s.repo.WithTx(tx)
	if err := lockAndCheckLimit(ctx, qtx, note.ID); err != nil {
		return DailyTask{}, err
	}
	if n, err := qtx.MarkDailyNoteTaskCarried(ctx, row.ID); err != nil {
		return DailyTask{}, err
	} else if n == 0 {
		return DailyTask{}, newDuplicate("Việc \"%s\" đã được chuyển trước đó", shortText(row.Title))
	}
	var target *int32
	if row.Target.Valid {
		v := row.Target.Int32
		target = &v
	}
	task, err := qtx.CreateDailyNoteTask(ctx, db.CreateDailyNoteTaskParams{
		NoteID: note.ID, Title: row.Title, Kind: row.Kind, Target: pgInt4(carryTarget(target, row.Progress)),
		Memo: row.Memo, CarriedFrom: row.ID,
	})
	if err != nil {
		return DailyTask{}, asDuplicate(err, fmt.Sprintf("Hôm nay đã có việc \"%s\"", shortText(row.Title)))
	}
	items, err := qtx.ListDailyTaskItems(ctx, []pgtype.UUID{row.ID})
	if err != nil {
		return DailyTask{}, err
	}
	for _, it := range items { // chỉ mang theo việc con chưa xong
		if it.DoneAt.Valid {
			continue
		}
		if _, err := qtx.CreateDailyTaskItem(ctx, db.CreateDailyTaskItemParams{TaskID: task.ID, Title: it.Title}); err != nil {
			return DailyTask{}, err
		}
	}
	res, err := toDailyTaskWithItems(ctx, qtx, task)
	if err != nil {
		return DailyTask{}, err
	}
	return res, tx.Commit(ctx)
}

// RecordAction — hoạt động học (gọi từ MissionService.RecordAction) cộng tiến độ cho các việc cùng loại trong note
// HÔM NAY của user. Chưa có note hôm nay → không làm gì (không tự tạo note).
func (s *DailyNoteService) RecordAction(ctx context.Context, userID uuid.UUID, kind string, amount int32) error {
	if kind == "free" || !dailyTaskKinds[kind] || amount <= 0 {
		return nil
	}
	today, err := s.today(ctx, userID)
	if err != nil {
		return err
	}
	date, _ := pgDate(today)
	// Có việc lặp lại → tạo note hôm nay ngay (kèm việc lặp) để hoạt động học trước khi mở trang vẫn được tính
	if n, err := s.repo.CountDailyTaskTemplates(ctx, toPgUUID(userID)); err != nil {
		return err
	} else if n > 0 {
		if _, err := s.ensureNote(ctx, userID, date); err != nil {
			return err
		}
	}
	return s.repo.AddDailyTaskProgress(ctx, db.AddDailyTaskProgressParams{Amount: amount, UserID: toPgUUID(userID), NoteDate: date, Kind: kind})
}
