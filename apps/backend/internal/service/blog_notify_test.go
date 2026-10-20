package service

import (
	"context"
	"fmt"
	"strings"
	"testing"
	"time"

	"laclingo-backend/internal/repository/db"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

type blogSentNotification struct {
	to uuid.UUID
	n  NotificationInput
}

type blogFakeNotifier struct{ sent []blogSentNotification }

func (f *blogFakeNotifier) Notify(_ context.Context, userID uuid.UUID, n NotificationInput) {
	f.sent = append(f.sent, blogSentNotification{userID, n})
}

// fakeBlogUsers — chỉ cài phần tra user; method khác của BlogRepository panic (interface nhúng nil)
type fakeBlogUsers struct {
	BlogRepository
	users    map[string]uuid.UUID // username → id
	inactive map[string]bool
	noticed  map[[2]uuid.UUID]bool  // (liker, comment) đã báo ♥
	mentions []db.BlogMentionNotice // các lần đã báo tag (comment, người được tag, người tag)
	now      time.Time
}

func (f *fakeBlogUsers) MarkMentionNoticed(_ context.Context, arg db.MarkMentionNoticedParams) (int64, error) {
	for _, m := range f.mentions {
		if m.CommentID == arg.CommentID && m.UserID == arg.UserID {
			return 0, nil
		}
	}
	f.mentions = append(f.mentions, db.BlogMentionNotice{CommentID: arg.CommentID, UserID: arg.UserID, MentionerID: arg.MentionerID, Notified: arg.Notified, CreatedAt: pgtype.Timestamptz{Time: f.now, Valid: true}})
	return 1, nil
}

func (f *fakeBlogUsers) CountRecentMentionNotices(_ context.Context, arg db.CountRecentMentionNoticesParams) (int64, error) {
	var n int64
	for _, m := range f.mentions {
		if m.MentionerID == arg.MentionerID && m.Notified && !m.CreatedAt.Time.Before(f.now.Add(-time.Duration(arg.WindowSeconds)*time.Second)) {
			n++
		}
	}
	return n, nil
}

func (f *fakeBlogUsers) HasRecentMentionNotice(_ context.Context, arg db.HasRecentMentionNoticeParams) (bool, error) {
	for _, m := range f.mentions {
		if m.MentionerID == arg.MentionerID && m.UserID == arg.UserID && m.Notified && !m.CreatedAt.Time.Before(f.now.Add(-time.Duration(arg.WindowSeconds)*time.Second)) {
			return true, nil
		}
	}
	return false, nil
}

func (f *fakeBlogUsers) MarkCommentLikeNoticed(_ context.Context, arg db.MarkCommentLikeNoticedParams) (int64, error) {
	if f.noticed == nil {
		f.noticed = map[[2]uuid.UUID]bool{}
	}
	key := [2]uuid.UUID{uuid.UUID(arg.UserID.Bytes), uuid.UUID(arg.CommentID.Bytes)}
	if f.noticed[key] {
		return 0, nil
	}
	f.noticed[key] = true
	return 1, nil
}

func (f *fakeBlogUsers) GetUserByUsername(_ context.Context, username string) (db.User, error) {
	id, ok := f.users[username]
	if !ok {
		return db.User{}, pgx.ErrNoRows
	}
	return db.User{ID: toPgUUID(id), Username: username, IsActive: !f.inactive[username]}, nil
}

func (f *fakeBlogUsers) GetUserByID(_ context.Context, id pgtype.UUID) (db.User, error) {
	for name, uid := range f.users {
		if uid == uuid.UUID(id.Bytes) {
			return db.User{ID: id, Username: name}, nil
		}
	}
	return db.User{}, pgx.ErrNoRows
}

func TestNotifyMentionsSkipsUnknownSelfAndAlreadyNotified(t *testing.T) {
	lan, hoa, me := uuid.New(), uuid.New(), uuid.New()
	notifier := &blogFakeNotifier{}
	svc := NewBlogService(&fakeBlogUsers{users: map[string]uuid.UUID{"lan": lan, "hoa": hoa, "me": me}, now: time.Now()}, nil, notifier)

	skip := map[uuid.UUID]bool{me: true, hoa: true} // người bình luận + người đã nhận thông báo trả lời
	svc.notifyMentions(context.Background(), uuid.New(), me, extractMentions("@lan @hoa @me @ghost @lan"), skip, NotificationInput{Type: NotificationBlogMention})

	if len(notifier.sent) != 1 || notifier.sent[0].to != lan || notifier.sent[0].n.Type != NotificationBlogMention {
		t.Fatalf("sent = %+v, want exactly one mention to lan", notifier.sent)
	}
}

func TestNotifyCommentLikedTellsAuthorButNotSelf(t *testing.T) {
	author, liker := uuid.New(), uuid.New()
	notifier := &blogFakeNotifier{}
	svc := NewBlogService(&fakeBlogUsers{users: map[string]uuid.UUID{"author": author, "liker": liker}}, nil, notifier)
	comment := db.BlogComment{ID: toPgUUID(uuid.New()), PostID: toPgUUID(uuid.New()), AuthorID: toPgUUID(author), Content: "hay quá"}

	svc.notifyCommentLiked(context.Background(), comment, author) // tự ♥ comment của mình
	if len(notifier.sent) != 0 {
		t.Fatalf("self-like notified: %+v", notifier.sent)
	}
	svc.notifyCommentLiked(context.Background(), comment, liker)
	if len(notifier.sent) != 1 || notifier.sent[0].to != author || notifier.sent[0].n.Type != NotificationBlogCommentLike {
		t.Fatalf("sent = %+v, want one like notification to author", notifier.sent)
	}
	if notifier.sent[0].n.Title != "liker đã thích bình luận của bạn" || notifier.sent[0].n.Body != "hay quá" {
		t.Fatalf("content = %+v", notifier.sent[0].n)
	}
}

func TestNotifyCommentLikedOnlyOncePerLikerAndComment(t *testing.T) {
	author, liker := uuid.New(), uuid.New()
	notifier := &blogFakeNotifier{}
	svc := NewBlogService(&fakeBlogUsers{users: map[string]uuid.UUID{"author": author, "liker": liker}}, nil, notifier)
	comment := db.BlogComment{ID: toPgUUID(uuid.New()), PostID: toPgUUID(uuid.New()), AuthorID: toPgUUID(author), Content: "x"}

	for i := 0; i < 3; i++ { // ♥ → bỏ ♥ → ♥ lại … không spam tác giả
		svc.notifyCommentLiked(context.Background(), comment, liker)
	}
	if len(notifier.sent) != 1 {
		t.Fatalf("sent %d notifications, want 1", len(notifier.sent))
	}
}

func TestNotifyMentionsSkipsLockedAccounts(t *testing.T) {
	locked := uuid.New()
	notifier := &blogFakeNotifier{}
	svc := NewBlogService(&fakeBlogUsers{users: map[string]uuid.UUID{"locked": locked}, inactive: map[string]bool{"locked": true}}, nil, notifier)
	svc.notifyMentions(context.Background(), uuid.New(), uuid.New(), extractMentions("@locked"), map[uuid.UUID]bool{}, NotificationInput{Type: NotificationBlogMention})
	if len(notifier.sent) != 0 {
		t.Fatalf("locked account notified: %+v", notifier.sent)
	}
}

func TestNotifyMentionsOncePerCommentAndOnlyNewOnEdit(t *testing.T) {
	lan, hoa, me := uuid.New(), uuid.New(), uuid.New()
	notifier := &blogFakeNotifier{}
	repo := &fakeBlogUsers{users: map[string]uuid.UUID{"lan": lan, "hoa": hoa, "me": me}, now: time.Now()}
	svc := NewBlogService(repo, nil, notifier)
	comment := uuid.New()

	svc.notifyMentions(context.Background(), comment, me, extractMentions("@lan"), map[uuid.UUID]bool{me: true}, NotificationInput{})
	// Sửa comment: thêm @hoa, vẫn giữ @lan → chỉ hoa được báo thêm
	svc.notifyMentions(context.Background(), comment, me, extractMentions("@lan @hoa"), map[uuid.UUID]bool{me: true}, NotificationInput{})

	if len(notifier.sent) != 2 || notifier.sent[0].to != lan || notifier.sent[1].to != hoa {
		t.Fatalf("sent = %+v, want lan then hoa once each", notifier.sent)
	}
}

func TestNotifyMentionsThrottlesSamePairAcrossComments(t *testing.T) {
	lan, me := uuid.New(), uuid.New()
	notifier := &blogFakeNotifier{}
	repo := &fakeBlogUsers{users: map[string]uuid.UUID{"lan": lan, "me": me}, now: time.Now()}
	svc := NewBlogService(repo, nil, notifier)

	for i := 0; i < 3; i++ { // 3 comment liên tiếp cùng tag @lan
		svc.notifyMentions(context.Background(), uuid.New(), me, extractMentions("@lan"), map[uuid.UUID]bool{me: true}, NotificationInput{})
	}
	if len(notifier.sent) != 1 {
		t.Fatalf("sent %d, want 1 within the throttle window", len(notifier.sent))
	}
}

func TestNotifyMentionsCapsPerMentionerPerHour(t *testing.T) {
	me := uuid.New()
	users := map[string]uuid.UUID{"me": me}
	content := ""
	for i := 0; i < maxMentionNoticesPerHour+5; i++ {
		name := fmt.Sprintf("user%03d", i)
		users[name] = uuid.New()
		content += " @" + name
	}
	notifier := &blogFakeNotifier{}
	repo := &fakeBlogUsers{users: users, now: time.Now()}
	svc := NewBlogService(repo, nil, notifier)

	// Nhiều comment, mỗi comment tối đa 10 tag — tổng không vượt giới hạn mỗi giờ
	names := strings.Fields(content)
	for i := 0; i < len(names); i += maxMentionsPerComment {
		end := min(i+maxMentionsPerComment, len(names))
		svc.notifyMentions(context.Background(), uuid.New(), me, extractMentions(strings.Join(names[i:end], " ")), map[uuid.UUID]bool{me: true}, NotificationInput{})
	}
	if len(notifier.sent) != maxMentionNoticesPerHour {
		t.Fatalf("sent %d, want cap %d", len(notifier.sent), maxMentionNoticesPerHour)
	}
}

func TestEditDoesNotNotifyUsersSkippedOrThrottledEarlier(t *testing.T) {
	bob, me := uuid.New(), uuid.New()
	notifier := &blogFakeNotifier{}
	repo := &fakeBlogUsers{users: map[string]uuid.UUID{"bob": bob, "me": me}, now: time.Now()}
	svc := NewBlogService(repo, nil, notifier)

	// Comment X: bob là người được trả lời (đã nhận thông báo reply) → bỏ qua tag; sửa X sau đó cũng không báo
	x := uuid.New()
	svc.notifyMentions(context.Background(), x, me, extractMentions("@bob"), map[uuid.UUID]bool{me: true, bob: true}, NotificationInput{})
	svc.notifyMentions(context.Background(), x, me, extractMentions("@bob sửa"), map[uuid.UUID]bool{me: true}, NotificationInput{})
	if len(notifier.sent) != 0 {
		t.Fatalf("skipped user notified on edit: %+v", notifier.sent)
	}

	// Comment Y báo bob; comment Z tag lại bob trong 10' → chặn; 15' sau sửa Z → vẫn không báo
	svc.notifyMentions(context.Background(), uuid.New(), me, extractMentions("@bob"), map[uuid.UUID]bool{me: true}, NotificationInput{})
	z := uuid.New()
	svc.notifyMentions(context.Background(), z, me, extractMentions("@bob"), map[uuid.UUID]bool{me: true}, NotificationInput{})
	repo.now = repo.now.Add(15 * time.Minute)
	svc.notifyMentions(context.Background(), z, me, extractMentions("@bob sửa chính tả"), map[uuid.UUID]bool{me: true}, NotificationInput{})
	if len(notifier.sent) != 1 {
		t.Fatalf("sent %d, want only the first mention in Y", len(notifier.sent))
	}
}
