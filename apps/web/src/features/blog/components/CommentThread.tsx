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

function authorName(c: Pick<BlogCommentNode, 'author_full_name' | 'author_username'>) {
  return c.author_full_name || c.author_username
}

// Mention "@username " ở đầu content (do FE tự chèn khi trả lời 1 reply,
// xem CommentItem.onClickReply) — tách ra để tô màu riêng, phần còn lại hiện bình thường.
const MENTION_PATTERN = /^(@\S+)(\s)/

function CommentBody({ content }: { content: string }) {
  const match = content.match(MENTION_PATTERN)
  if (!match) return <>{content}</>
  return (
    <>
      <span className="font-medium text-indigo-600">{match[1]}</span>
      {content.slice(match[0].length)}
    </>
  )
}

/** Bình luận trải phẳng tối đa 2 cấp: root + reply (xem backend
 * BlogService.CreateComment) — trả lời 1 reply khác chỉ tag @ người đó rồi
 * gắn flat vào cùng root, không lồng tiếp thêm cấp. */
export function CommentThread({
  postId,
  comments,
  currentUserId,
  onChanged,
}: {
  postId: string
  comments: BlogCommentNode[]
  currentUserId?: string
  onChanged: () => void
}) {
  if (comments.length === 0) return null
  return (
    <ul className="space-y-5">
      {comments.map((root) => (
        <li key={root.id}>
          <CommentItem postId={postId} comment={root} currentUserId={currentUserId} onChanged={onChanged} />
          {root.replies.length > 0 && (
            <ul className="mt-3 space-y-4 border-l border-slate-100 pl-4">
              {root.replies.map((reply) => (
                <li key={reply.id}>
                  <CommentItem postId={postId} comment={reply} currentUserId={currentUserId} onChanged={onChanged} />
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  )
}

function CommentItem({
  postId,
  comment,
  currentUserId,
  onChanged,
}: {
  postId: string
  comment: BlogCommentNode
  currentUserId?: string
  onChanged: () => void
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

  // Mở ô reply lần đầu thì mồi sẵn "@username " — trả lời root hay 1 reply
  // khác đều tag @ người đó (backend tự trải phẳng về đúng root khi lưu).
  const onClickReply = () => {
    setReplying((v) => {
      const next = !v
      if (next && !replyText) setReplyText(`@${comment.author_username} `)
      return next
    })
  }

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
            <textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={2} className={cn(inputClass, 'mt-0')} />
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
          <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-slate-700">
            <CommentBody content={comment.content} />
          </p>
        )}

        {!editing && (
          <div className="mt-1 flex gap-3 text-xs font-medium text-slate-500">
            <button type="button" onClick={onClickReply} className="hover:text-indigo-600">
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
      </div>
    </div>
  )
}
