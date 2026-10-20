package service

import (
	"context"
	"testing"

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
	noticed  map[[2]uuid.UUID]bool // (liker, comment) đã báo ♥
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
	svc := NewBlogService(&fakeBlogUsers{users: map[string]uuid.UUID{"lan": lan, "hoa": hoa, "me": me}}, nil, notifier)

	skip := map[uuid.UUID]bool{me: true, hoa: true} // người bình luận + người đã nhận thông báo trả lời
	svc.notifyMentions(context.Background(), "@lan @hoa @me @ghost @lan", skip, NotificationInput{Type: NotificationBlogMention})

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
	svc.notifyMentions(context.Background(), "@locked", map[uuid.UUID]bool{}, NotificationInput{Type: NotificationBlogMention})
	if len(notifier.sent) != 0 {
		t.Fatalf("locked account notified: %+v", notifier.sent)
	}
}
