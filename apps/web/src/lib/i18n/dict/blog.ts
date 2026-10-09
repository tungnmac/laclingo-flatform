import type { Locale } from '@/store/locale'

// Namespace "blog" (học viên — diễn đàn chia sẻ bài viết) và "adminBlog"
// (quản trị hậu kiểm). Chỉ vi+en.
export interface BlogDict {
  blog: {
    pageTitle: string
    pageDesc: string
    writeNewBtn: string
    allLanguagesOption: string
    tagFilterPlaceholder: string
    mineOnlyLabel: string
    emptyPosts: string
    loadingPosts: string
    loadingPost: string
    loadingComments: string
    viewsSuffix: string
    commentsSuffix: string
    hiddenBadge: string
    byLabel: (name: string) => string

    newPostTitle: string
    editPostTitle: string
    titleLabel: string
    contentLabel: string
    tagsLabel: string
    tagsHint: string
    tagsPlaceholder: string
    languageOptionalLabel: string
    contentPlaceholder: string
    linkPrompt: string
    youtubePrompt: string
    insertImageLabel: string
    insertYoutubeLabel: string
    submitCreateBtn: string
    submitUpdateBtn: string
    submittingBtn: string
    editBtn: string
    deleteBtn: string
    deletePostConfirm: (title: string) => string
    viewPostBtn: string

    commentsTitle: string
    addCommentPlaceholder: string
    submitCommentBtn: string
    replyBtn: string
    cancelReplyBtn: string
    editCommentBtn: string
    deleteCommentBtn: string
    deleteCommentConfirm: string
    emptyComments: string
    saveCommentBtn: string
    cancelEditCommentBtn: string
  }
  adminBlog: {
    pageTitle: string
    pageDesc: string
    hiddenOnlyLabel: string
    emptyPosts: string
    hideBtn: string
    unhideBtn: string
    deleteBtn: string
    deletePostConfirm: (title: string) => string
    deleteCommentConfirm: string
    hiddenBadge: string
    viewPostBtn: string
    authorColumn: string
    viewsColumn: string
    commentsColumn: string
  }
}

export const blogTranslations: Partial<Record<Locale, BlogDict>> = {
  vi: {
    blog: {
      pageTitle: '📝 Blog',
      pageDesc: 'Diễn đàn chia sẻ bài viết, kinh nghiệm học tập — cùng thảo luận với học viên khác.',
      writeNewBtn: '+ Viết bài mới',
      allLanguagesOption: 'Mọi ngôn ngữ',
      tagFilterPlaceholder: 'Lọc theo tag...',
      mineOnlyLabel: 'Chỉ bài của tôi',
      emptyPosts: 'Chưa có bài viết nào',
      loadingPosts: 'Đang tải bài viết...',
      loadingPost: 'Đang tải bài viết...',
      loadingComments: 'Đang tải bình luận...',
      viewsSuffix: 'lượt xem',
      commentsSuffix: 'bình luận',
      hiddenBadge: 'Đã bị ẩn',
      byLabel: (name) => `bởi ${name}`,

      newPostTitle: 'Viết bài mới',
      editPostTitle: 'Sửa bài viết',
      titleLabel: 'Tiêu đề',
      contentLabel: 'Nội dung',
      tagsLabel: 'Chủ đề (tag)',
      tagsHint: 'Gõ tên chủ đề rồi nhấn Enter để thêm.',
      tagsPlaceholder: 'VD: ngữ pháp, kinh nghiệm...',
      languageOptionalLabel: 'Ngôn ngữ (không bắt buộc)',
      contentPlaceholder: 'Viết nội dung bài... dùng toolbar để định dạng, chèn ảnh hoặc video YouTube.',
      linkPrompt: 'Nhập URL:',
      youtubePrompt: 'Dán link video YouTube:',
      insertImageLabel: 'Chèn ảnh (tối đa 5MB)',
      insertYoutubeLabel: 'Chèn video YouTube',
      submitCreateBtn: 'Đăng bài',
      submitUpdateBtn: 'Lưu thay đổi',
      submittingBtn: 'Đang xử lý...',
      editBtn: 'Sửa',
      deleteBtn: 'Xoá',
      deletePostConfirm: (title) => `Xoá bài viết "${title}"? Toàn bộ bình luận sẽ bị xoá theo.`,
      viewPostBtn: 'Xem bài viết',

      commentsTitle: 'Bình luận',
      addCommentPlaceholder: 'Viết bình luận...',
      submitCommentBtn: 'Gửi',
      replyBtn: 'Trả lời',
      cancelReplyBtn: 'Hủy',
      editCommentBtn: 'Sửa',
      deleteCommentBtn: 'Xoá',
      deleteCommentConfirm: 'Xoá bình luận này? Các trả lời bên dưới cũng sẽ bị xoá theo.',
      emptyComments: 'Chưa có bình luận nào — hãy là người đầu tiên!',
      saveCommentBtn: 'Lưu',
      cancelEditCommentBtn: 'Hủy',
    },
    adminBlog: {
      pageTitle: 'Blog',
      pageDesc: 'Kiểm duyệt bài viết và bình luận trong diễn đàn (ẩn hoặc xoá nội dung vi phạm).',
      hiddenOnlyLabel: 'Chỉ xem bài đã ẩn',
      emptyPosts: 'Chưa có bài viết nào',
      hideBtn: 'Ẩn',
      unhideBtn: 'Bỏ ẩn',
      deleteBtn: 'Xoá',
      deletePostConfirm: (title) => `Xoá cứng bài viết "${title}"? Hành động này không thể hoàn tác.`,
      deleteCommentConfirm: 'Xoá cứng bình luận này (và các trả lời bên dưới)? Hành động này không thể hoàn tác.',
      hiddenBadge: 'Đã ẩn',
      viewPostBtn: 'Xem bài',
      authorColumn: 'Tác giả',
      viewsColumn: 'Lượt xem',
      commentsColumn: 'Bình luận',
    },
  },
  en: {
    blog: {
      pageTitle: '📝 Blog',
      pageDesc: 'A forum for sharing posts and learning experiences — discuss with other students.',
      writeNewBtn: '+ Write a post',
      allLanguagesOption: 'All languages',
      tagFilterPlaceholder: 'Filter by tag...',
      mineOnlyLabel: 'My posts only',
      emptyPosts: 'No posts yet',
      loadingPosts: 'Loading posts...',
      loadingPost: 'Loading post...',
      loadingComments: 'Loading comments...',
      viewsSuffix: 'views',
      commentsSuffix: 'comments',
      hiddenBadge: 'Hidden',
      byLabel: (name) => `by ${name}`,

      newPostTitle: 'Write a new post',
      editPostTitle: 'Edit post',
      titleLabel: 'Title',
      contentLabel: 'Content',
      tagsLabel: 'Tags',
      tagsHint: 'Type a tag and press Enter to add it.',
      tagsPlaceholder: 'e.g. grammar, tips...',
      languageOptionalLabel: 'Language (optional)',
      contentPlaceholder: 'Write your post... use the toolbar to format text or insert images/YouTube videos.',
      linkPrompt: 'Enter URL:',
      youtubePrompt: 'Paste a YouTube video link:',
      insertImageLabel: 'Insert image (up to 5MB)',
      insertYoutubeLabel: 'Insert YouTube video',
      submitCreateBtn: 'Publish',
      submitUpdateBtn: 'Save changes',
      submittingBtn: 'Processing...',
      editBtn: 'Edit',
      deleteBtn: 'Delete',
      deletePostConfirm: (title) => `Delete post "${title}"? All its comments will be deleted too.`,
      viewPostBtn: 'View post',

      commentsTitle: 'Comments',
      addCommentPlaceholder: 'Write a comment...',
      submitCommentBtn: 'Post',
      replyBtn: 'Reply',
      cancelReplyBtn: 'Cancel',
      editCommentBtn: 'Edit',
      deleteCommentBtn: 'Delete',
      deleteCommentConfirm: 'Delete this comment? Replies below it will be deleted too.',
      emptyComments: 'No comments yet — be the first!',
      saveCommentBtn: 'Save',
      cancelEditCommentBtn: 'Cancel',
    },
    adminBlog: {
      pageTitle: 'Blog',
      pageDesc: 'Moderate forum posts and comments (hide or delete content that violates the rules).',
      hiddenOnlyLabel: 'Hidden posts only',
      emptyPosts: 'No posts yet',
      hideBtn: 'Hide',
      unhideBtn: 'Unhide',
      deleteBtn: 'Delete',
      deletePostConfirm: (title) => `Permanently delete post "${title}"? This cannot be undone.`,
      deleteCommentConfirm: 'Permanently delete this comment (and its replies)? This cannot be undone.',
      hiddenBadge: 'Hidden',
      viewPostBtn: 'View post',
      authorColumn: 'Author',
      viewsColumn: 'Views',
      commentsColumn: 'Comments',
    },
  },
}
