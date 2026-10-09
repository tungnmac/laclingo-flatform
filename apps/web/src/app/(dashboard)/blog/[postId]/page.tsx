'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useConfirm } from '@/components/ui/ConfirmDialogProvider'
import { ErrorState, Spinner } from '@/components/ui/States'
import { blogService } from '@/features/blog/blog.service'
import { CommentThread } from '@/features/blog/components/CommentThread'
import { useApi } from '@/hooks/useApi'
import { useTranslation } from '@/hooks/useTranslation'
import { cn, formatDate } from '@/lib/utils'
import { useSession } from '@/store/session'
import type { BlogPostDetail } from '@/types/api'

type CounterAction = 'star' | 'marker' | 'like' | 'dislike'

export default function BlogPostDetailPage({ params }: { params: { postId: string } }) {
  const t = useTranslation()
  const router = useRouter()
  const confirm = useConfirm()
  const user = useSession((s) => s.user)
  const { data, error, loading, reload } = useApi(() => blogService.getDetail(params.postId), [params.postId])
  const [post, setPost] = useState<BlogPostDetail | null>(null)
  useEffect(() => setPost(data), [data])

  const commentsApi = useApi(() => blogService.listComments(params.postId), [params.postId])

  const [pending, setPending] = useState<CounterAction | null>(null)
  const [counterError, setCounterError] = useState<string | null>(null)
  const [newComment, setNewComment] = useState('')
  const [postingComment, setPostingComment] = useState(false)

  const runCounter = async (action: CounterAction, call: () => Promise<Partial<BlogPostDetail>>) => {
    if (pending || !post) return
    setPending(action)
    setCounterError(null)
    try {
      const patch = await call()
      setPost((p) => (p ? { ...p, ...patch } : p))
    } catch (err) {
      setCounterError((err as Error).message)
    } finally {
      setPending(null)
    }
  }

  const toggleStar = () =>
    runCounter('star', async () => {
      const res = await blogService.setStar(post!.id, !post!.starred)
      return { starred: res.on, star_count: res.count }
    })
  const toggleMarker = () =>
    runCounter('marker', async () => {
      const res = await blogService.setMarker(post!.id, !post!.marked)
      return { marked: res.on, marker_count: res.count }
    })
  const toggleLike = () =>
    runCounter('like', async () => {
      const on = !post!.liked
      const res = await blogService.setLike(post!.id, on)
      const patch: Partial<BlogPostDetail> = { liked: res.on, like_count: res.count }
      if (on && post!.disliked) {
        patch.disliked = false
        patch.dislike_count = Math.max(0, post!.dislike_count - 1)
      }
      return patch
    })
  const toggleDislike = () =>
    runCounter('dislike', async () => {
      const on = !post!.disliked
      const res = await blogService.setDislike(post!.id, on)
      const patch: Partial<BlogPostDetail> = { disliked: res.on, dislike_count: res.count }
      if (on && post!.liked) {
        patch.liked = false
        patch.like_count = Math.max(0, post!.like_count - 1)
      }
      return patch
    })

  const onDeletePost = async () => {
    if (!post) return
    if (!(await confirm({ description: t.blog.deletePostConfirm(post.title), danger: true }))) return
    await blogService.delete(post.id)
    router.push('/blog')
  }

  const onSubmitComment = async () => {
    if (!newComment.trim()) return
    setPostingComment(true)
    try {
      await blogService.createComment(params.postId, { content: newComment.trim() })
      setNewComment('')
      commentsApi.reload()
      reload()
    } finally {
      setPostingComment(false)
    }
  }

  if (loading) return <Spinner label={t.blog.loadingPost} />
  if (error) return <ErrorState error={error} onRetry={reload} />
  if (!post) return null

  const isAuthor = user?.id === post.author_id

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Breadcrumbs items={[{ label: t.blog.pageTitle, href: '/blog' }, { label: post.title }]} />

      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{post.title}</h1>
            <p className="mt-1 text-sm text-slate-400">
              {t.blog.byLabel(post.author_full_name || post.author_username)} · {formatDate(post.created_at)}
            </p>
          </div>
          {post.is_hidden && (
            <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-200">
              {t.blog.hiddenBadge}
            </span>
          )}
        </div>

        {post.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {post.tags.map((tg) => (
              <span key={tg} className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                #{tg}
              </span>
            ))}
          </div>
        )}

        {/* Content là HTML đã sanitize ở backend (xem blog_service.go sanitizeBlogContent)
            — ảnh/video YouTube nhúng ngay trong content, [&_iframe] canh tỉ lệ 16:9 gọn. */}
        <div
          className="prose prose-slate mt-4 max-w-none [&_iframe]:aspect-video [&_iframe]:w-full [&_img]:rounded-lg"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={toggleStar}
            disabled={pending !== null}
            aria-pressed={post.starred}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ring-1 ring-inset transition disabled:opacity-50',
              post.starred ? 'bg-amber-50 text-amber-700 ring-amber-200' : 'bg-white text-slate-600 ring-slate-300 hover:bg-slate-50',
            )}
          >
            ⭐ {post.star_count}
          </button>
          <button
            type="button"
            onClick={toggleMarker}
            disabled={pending !== null}
            aria-pressed={post.marked}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ring-1 ring-inset transition disabled:opacity-50',
              post.marked ? 'bg-sky-50 text-sky-700 ring-sky-200' : 'bg-white text-slate-600 ring-slate-300 hover:bg-slate-50',
            )}
          >
            🔖 {post.marker_count}
          </button>
          <button
            type="button"
            onClick={toggleLike}
            disabled={pending !== null}
            aria-pressed={post.liked}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ring-1 ring-inset transition disabled:opacity-50',
              post.liked ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-white text-slate-600 ring-slate-300 hover:bg-slate-50',
            )}
          >
            👍 {post.like_count}
          </button>
          <button
            type="button"
            onClick={toggleDislike}
            disabled={pending !== null}
            aria-pressed={post.disliked}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ring-1 ring-inset transition disabled:opacity-50',
              post.disliked ? 'bg-rose-50 text-rose-700 ring-rose-200' : 'bg-white text-slate-600 ring-slate-300 hover:bg-slate-50',
            )}
          >
            👎 {post.dislike_count}
          </button>
          <span className="text-sm text-slate-400">
            👁 {post.view_count} {t.blog.viewsSuffix}
          </span>
        </div>
        {counterError && <p className="mt-2 text-sm text-rose-600">{counterError}</p>}

        {isAuthor && (
          <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4">
            <ButtonLink href={`/blog/${post.id}/edit`} variant="secondary" size="sm">
              {t.blog.editBtn}
            </ButtonLink>
            <Button variant="danger" size="sm" onClick={onDeletePost}>
              {t.blog.deleteBtn}
            </Button>
          </div>
        )}
      </Card>

      <Card>
        <h2 className="text-base font-semibold text-slate-900">
          {t.blog.commentsTitle} ({post.comment_count})
        </h2>

        <div className="mt-3 space-y-2">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={2}
            placeholder={t.blog.addCommentPlaceholder}
            className="mt-1 block w-full rounded-lg border-0 px-3 py-2.5 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
          />
          <Button size="sm" disabled={postingComment || !newComment.trim()} onClick={onSubmitComment}>
            {t.blog.submitCommentBtn}
          </Button>
        </div>

        <div className="mt-5">
          {commentsApi.loading && <Spinner label={t.blog.loadingComments} />}
          {commentsApi.data && commentsApi.data.length === 0 && <p className="text-sm text-slate-500">{t.blog.emptyComments}</p>}
          {commentsApi.data && commentsApi.data.length > 0 && (
            <CommentThread
              postId={params.postId}
              comments={commentsApi.data}
              currentUserId={user?.id}
              onChanged={() => {
                commentsApi.reload()
                reload()
              }}
            />
          )}
        </div>
      </Card>
    </div>
  )
}
