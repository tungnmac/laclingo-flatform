'use client'

import { useState } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { useConfirm } from '@/components/ui/ConfirmDialogProvider'
import { inputClass } from '@/features/auth/components/AuthForm'
import { blogService } from '@/features/blog/blog.service'
import { useTranslation } from '@/hooks/useTranslation'
import { cn, formatDate } from '@/lib/utils'
import type { BlogCommentNode } from '@/types/api'

// Thụt lề tăng dần theo độ sâu nhưng dừng ở cấp 4 — reply sâu hơn vẫn đúng
// cây dữ liệu, chỉ không thụt lề thêm để tránh cột bình luận quá hẹp.
const MAX_INDENT_DEPTH = 4

function authorName(c: Pick<BlogCommentNode, 'author_full_name' | 'author_username'>) {
  return c.author_full_name || c.author_username
}

/** Cây bình luận lồng nhau (đệ quy) — mỗi node tự quản lý ô reply/sửa của chính nó. */
export function CommentThread({
  postId,
  comments,
  currentUserId,
  onChanged,
  depth = 0,
}: {
  postId: string
  comments: BlogCommentNode[]
  currentUserId?: string
  onChanged: () => void
  depth?: number
}) {
  if (comments.length === 0) return null
  return (
    <ul className={cn('space-y-4', depth > 0 && 'mt-3 border-l border-slate-100 pl-4')}>
      {comments.map((c) => (
        <CommentItem key={c.id} postId={postId} comment={c} currentUserId={currentUserId} onChanged={onChanged} depth={depth} />
      ))}
    </ul>
  )
}

function CommentItem({
  postId,
  comment,
  currentUserId,
  onChanged,
  depth,
}: {
  postId: string
  comment: BlogCommentNode
  currentUserId?: string
  onChanged: () => void
  depth: number
}) {
  const t = useTranslation()
  const confirm = useConfirm()
  const isOwn = currentUserId === comment.author_id

  const [replying, setReplying] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(comment.content)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submitReply = async () => {
    if (!replyText.trim()) return
    setSaving(true)
    setError(null)
    try {
      await blogService.createComment(postId, { content: replyText.trim(), parent_comment_id: comment.id })
      setReplyText('')
      setReplying(false)
      onChanged()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const submitEdit = async () => {
    if (!editText.trim()) return
    setSaving(true)
    setError(null)
    try {
      await blogService.updateComment(comment.id, editText.trim())
      setEditing(false)
      onChanged()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const onDelete = async () => {
    if (!(await confirm({ description: t.blog.deleteCommentConfirm, danger: true }))) return
    await blogService.deleteComment(comment.id)
    onChanged()
  }

  return (
    <li>
      <div className="flex items-start gap-3">
        <Avatar name={authorName(comment)} src={comment.author_avatar_url} className="h-8 w-8 shrink-0 text-xs" />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold text-slate-900">{authorName(comment)}</span>
            <span className="text-xs text-slate-400">{formatDate(comment.created_at)}</span>
            {comment.is_hidden && (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-200">
                {t.blog.hiddenBadge}
              </span>
            )}
          </div>

          {editing ? (
            <div className="mt-1.5 space-y-2">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={2}
                className={cn(inputClass, 'mt-0')}
              />
              <div className="flex gap-2">
                <Button size="sm" disabled={saving} onClick={submitEdit}>
                  {t.blog.saveCommentBtn}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setEditing(false)
                    setEditText(comment.content)
                  }}
                >
                  {t.blog.cancelEditCommentBtn}
                </Button>
              </div>
            </div>
          ) : (
            <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-slate-700">{comment.content}</p>
          )}

          {!editing && (
            <div className="mt-1 flex gap-3 text-xs font-medium text-slate-500">
              <button type="button" onClick={() => setReplying((v) => !v)} className="hover:text-indigo-600">
                {t.blog.replyBtn}
              </button>
              {isOwn && (
                <>
                  <button type="button" onClick={() => setEditing(true)} className="hover:text-indigo-600">
                    {t.blog.editCommentBtn}
                  </button>
                  <button type="button" onClick={onDelete} className="hover:text-rose-600">
                    {t.blog.deleteCommentBtn}
                  </button>
                </>
              )}
            </div>
          )}

          {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}

          {replying && (
            <div className="mt-2 space-y-2">
              <p className="text-xs text-slate-400">
                {t.blog.replyingToLabel} {authorName(comment)}
              </p>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={2}
                placeholder={t.blog.addCommentPlaceholder}
                className={cn(inputClass, 'mt-0')}
              />
              <div className="flex gap-2">
                <Button size="sm" disabled={saving || !replyText.trim()} onClick={submitReply}>
                  {t.blog.submitCommentBtn}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setReplying(false)}>
                  {t.blog.cancelReplyBtn}
                </Button>
              </div>
            </div>
          )}

          {comment.replies.length > 0 && (
            <CommentThread
              postId={postId}
              comments={comment.replies}
              currentUserId={currentUserId}
              onChanged={onChanged}
              depth={Math.min(depth + 1, MAX_INDENT_DEPTH)}
            />
          )}
        </div>
      </div>
    </li>
  )
}
