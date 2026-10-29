package service

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"unicode/utf8"

	"laclingo-backend/internal/repository/db"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

// Checklist việc con trong 1 việc của Daily note. Mọi thao tác: khoá việc cha → đổi việc con → tính lại trạng thái
// xong của việc cha (RefreshDailyTaskCompletion) → việc đang lặp lại thì lưu checklist mới vào mẫu cho các ngày sau.

const maxDailyTaskItems = 20

func validateItemTitle(title string) error {
	if title == "" || utf8.RuneCountInString(title) > maxDailyTaskTitleLen {
		return fmt.Errorf("tên việc con cần 1–%d ký tự: %w", maxDailyTaskTitleLen, ErrInvalidInput)
	}
	return nil
}

// itemTitles — tên các việc con theo thứ tự (checklist lưu vào mẫu việc lặp lại); luôn khác nil (cột NOT NULL)
func itemTitles(ctx context.Context, q dailyItemLister, taskID pgtype.UUID) ([]string, error) {
	items, err := q.ListDailyTaskItems(ctx, []pgtype.UUID{taskID})
	if err != nil {
		return nil, err
	}
	titles := make([]string, 0, len(items))
	for _, it := range items {
		titles = append(titles, it.Title)
	}
	return titles, nil
}

// finishItemChange — sau khi đổi việc con (trong tx đã khoá việc cha): tính lại trạng thái xong, đồng bộ checklist
// của mẫu nếu danh sách việc con đổi (thêm/xoá/đổi tên), commit, trả việc cha kèm checklist
func (s *DailyNoteService) finishItemChange(ctx context.Context, tx pgx.Tx, qtx *db.Queries, userID uuid.UUID, taskID pgtype.UUID, listChanged bool) (DailyTask, error) {
	task, err := qtx.RefreshDailyTaskCompletion(ctx, taskID)
	if err != nil {
		return DailyTask{}, err
	}
	if listChanged && task.TemplateID.Valid {
		titles, err := itemTitles(ctx, qtx, taskID)
		if err != nil {
			return DailyTask{}, err
		}
		if err := qtx.SetDailyTaskTemplateChecklist(ctx, db.SetDailyTaskTemplateChecklistParams{ID: task.TemplateID, UserID: toPgUUID(userID), Checklist: titles}); err != nil {
			return DailyTask{}, err
		}
	}
	res, err := toDailyTaskWithItems(ctx, qtx, task)
	if err != nil {
		return DailyTask{}, err
	}
	return res, tx.Commit(ctx)
}

// AddTaskItem — thêm 1 việc con (chưa tích) vào việc hôm nay; việc cha đang xong sẽ thành chưa xong
func (s *DailyNoteService) AddTaskItem(ctx context.Context, userID, taskID uuid.UUID, req DailyTaskItemRequest) (DailyTask, error) {
	title := ""
	if req.Title != nil {
		title = strings.TrimSpace(*req.Title)
	}
	if err := validateItemTitle(title); err != nil {
		return DailyTask{}, err
	}
	row, _, err := s.todayTask(ctx, userID, taskID)
	if err != nil {
		return DailyTask{}, err
	}
	tx, err := s.repo.BeginTx(ctx)
	if err != nil {
		return DailyTask{}, err
	}
	defer tx.Rollback(ctx)
	qtx := s.repo.WithTx(tx)
	if _, err := qtx.LockDailyNoteTask(ctx, row.ID); err != nil {
		return DailyTask{}, err
	}
	if n, err := qtx.CountDailyTaskItems(ctx, row.ID); err != nil {
		return DailyTask{}, err
	} else if n >= maxDailyTaskItems {
		return DailyTask{}, fmt.Errorf("mỗi việc tối đa %d việc con: %w", maxDailyTaskItems, ErrInvalidInput)
	}
	if _, err := qtx.CreateDailyTaskItem(ctx, db.CreateDailyTaskItemParams{TaskID: row.ID, Title: title}); err != nil {
		return DailyTask{}, asDuplicate(err, fmt.Sprintf("Việc con \"%s\" đã có", shortText(title)))
	}
	return s.finishItemChange(ctx, tx, qtx, userID, row.ID, true)
}

// todayItem — việc con của user thuộc note HÔM NAY (của người khác → ErrNotFound; ngày cũ → không sửa được)
func (s *DailyNoteService) todayItem(ctx context.Context, userID, itemID uuid.UUID) (db.GetDailyTaskItemForUserRow, error) {
	item, err := s.repo.GetDailyTaskItemForUser(ctx, db.GetDailyTaskItemForUserParams{ID: toPgUUID(itemID), UserID: toPgUUID(userID)})
	if errors.Is(err, pgx.ErrNoRows) {
		return item, ErrNotFound
	}
	if err != nil {
		return item, err
	}
	today, err := s.today(ctx, userID)
	if err != nil {
		return item, err
	}
	if dateString(item.NoteDate) != today {
		return item, fmt.Errorf("chỉ sửa được việc của hôm nay: %w", ErrInvalidInput)
	}
	return item, nil
}

// UpdateTaskItem — đổi tên / tích xong 1 việc con hôm nay
func (s *DailyNoteService) UpdateTaskItem(ctx context.Context, userID, itemID uuid.UUID, req DailyTaskItemRequest) (DailyTask, error) {
	item, err := s.todayItem(ctx, userID, itemID)
	if err != nil {
		return DailyTask{}, err
	}
	title := item.Title
	if req.Title != nil {
		title = strings.TrimSpace(*req.Title)
		if err := validateItemTitle(title); err != nil {
			return DailyTask{}, err
		}
	}
	doneAt := item.DoneAt
	if req.Done != nil {
		switch {
		case *req.Done && !doneAt.Valid:
			doneAt = pgtype.Timestamptz{Time: s.now(), Valid: true}
		case !*req.Done:
			doneAt = pgtype.Timestamptz{}
		}
	}
	tx, err := s.repo.BeginTx(ctx)
	if err != nil {
		return DailyTask{}, err
	}
	defer tx.Rollback(ctx)
	qtx := s.repo.WithTx(tx)
	if _, err := qtx.LockDailyNoteTask(ctx, item.TaskID); err != nil {
		return DailyTask{}, err
	}
	if n, err := qtx.UpdateDailyTaskItem(ctx, db.UpdateDailyTaskItemParams{ID: item.ID, Title: title, DoneAt: doneAt}); err != nil {
		return DailyTask{}, asDuplicate(err, fmt.Sprintf("Việc con \"%s\" đã có", shortText(title)))
	} else if n == 0 { // vừa bị xoá ở tab khác
		return DailyTask{}, ErrNotFound
	}
	return s.finishItemChange(ctx, tx, qtx, userID, item.TaskID, title != item.Title)
}

// DeleteTaskItem — xoá 1 việc con hôm nay; còn lại đều đã tích → việc cha thành xong
func (s *DailyNoteService) DeleteTaskItem(ctx context.Context, userID, itemID uuid.UUID) (DailyTask, error) {
	item, err := s.todayItem(ctx, userID, itemID)
	if err != nil {
		return DailyTask{}, err
	}
	tx, err := s.repo.BeginTx(ctx)
	if err != nil {
		return DailyTask{}, err
	}
	defer tx.Rollback(ctx)
	qtx := s.repo.WithTx(tx)
	if _, err := qtx.LockDailyNoteTask(ctx, item.TaskID); err != nil {
		return DailyTask{}, err
	}
	if err := qtx.DeleteDailyTaskItem(ctx, item.ID); err != nil {
		return DailyTask{}, err
	}
	// Việc tích có checklist chỉ xong nhờ việc con → xoá việc con cuối thì về chưa xong (người học tự tích lại)
	if err := qtx.ResetDailyTaskCompletionWithoutItems(ctx, item.TaskID); err != nil {
		return DailyTask{}, err
	}
	return s.finishItemChange(ctx, tx, qtx, userID, item.TaskID, true)
}

// ReorderTaskItems — sắp lại thứ tự việc con (ưu tiên) của việc hôm nay; itemIDs phải đúng bằng tập việc con hiện có
func (s *DailyNoteService) ReorderTaskItems(ctx context.Context, userID, taskID uuid.UUID, itemIDs []uuid.UUID) (DailyTask, error) {
	row, _, err := s.todayTask(ctx, userID, taskID)
	if err != nil {
		return DailyTask{}, err
	}
	tx, err := s.repo.BeginTx(ctx)
	if err != nil {
		return DailyTask{}, err
	}
	defer tx.Rollback(ctx)
	qtx := s.repo.WithTx(tx)
	if _, err := qtx.LockDailyNoteTask(ctx, row.ID); err != nil {
		return DailyTask{}, err
	}
	items, err := qtx.ListDailyTaskItems(ctx, []pgtype.UUID{row.ID})
	if err != nil {
		return DailyTask{}, err
	}
	current := make(map[pgtype.UUID]bool, len(items))
	for _, it := range items {
		current[it.ID] = true
	}
	if len(itemIDs) != len(items) {
		return DailyTask{}, newDuplicate("Danh sách việc con vừa thay đổi, vui lòng tải lại")
	}
	ids := make([]pgtype.UUID, 0, len(itemIDs))
	for _, id := range itemIDs {
		pid := toPgUUID(id)
		if !current[pid] { // thiếu / thừa / trùng id → danh sách đã đổi ở nơi khác
			return DailyTask{}, newDuplicate("Danh sách việc con vừa thay đổi, vui lòng tải lại")
		}
		delete(current, pid)
		ids = append(ids, pid)
	}
	if _, err := qtx.SetDailyTaskItemsOrder(ctx, db.SetDailyTaskItemsOrderParams{ItemIds: ids, TaskID: row.ID}); err != nil {
		return DailyTask{}, err
	}
	// listChanged: việc đang lặp lại → mẫu lưu checklist theo thứ tự mới
	return s.finishItemChange(ctx, tx, qtx, userID, row.ID, true)
}
