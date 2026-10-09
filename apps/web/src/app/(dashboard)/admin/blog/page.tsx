'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Pagination } from '@/components/admin/Pagination'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useConfirm } from '@/components/ui/ConfirmDialogProvider'
import { EmptyState, ErrorState, Spinner } from '@/components/ui/States'
import { blogService } from '@/features/blog/blog.service'
import { useApi } from '@/hooks/useApi'
import { useTranslation } from '@/hooks/useTranslation'
import { formatDate } from '@/lib/utils'
import type { BlogCommentNode } from '@/types/api'

const PAGE_SIZE = 20

export default function AdminBlogPage() {
  const t = useTranslation()
  const confirm = useConfirm()
  const [hiddenOnly, setHiddenOnly] = useState(false)
  const [page, setPage] = useState(1)
  const { data, error, loading, reload } = useApi(() => blogService.listAdmin({ hiddenOnly, page, pageSize: PAGE_SIZE }), [hiddenOnly, page])
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null)

  const onHide = async (id: string) => {
    await blogService.hidePost(id)
    reload()
  }
  const onUnhide = async (id: string) => {
    await blogService.unhidePost(id)
    reload()
  }
  const onDelete = async (id: string, title: string) => {
    if (!(await confirm({ description: t.adminBlog.deletePostConfirm(title), danger: true }))) return
    await blogService.adminDeletePost(id)
    reload()
  }

  return (
    <>
      <PageHeader title={t.adminBlog.pageTitle} description={t.adminBlog.pageDesc} />

      <label className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          checked={hiddenOnly}
          onChange={(e) => {
            setHiddenOnly(e.target.checked)
            setPage(1)
          }}
          className="h-4 w-4 rounded border-slate-300"
        />
        {t.adminBlog.hiddenOnlyLabel}
      </label>

      {loading && <Spinner />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && data.items.length === 0 && <EmptyState icon="📝" title={t.adminBlog.emptyPosts} />}

      {data && data.items.length > 0 && (
        <Card className="p-0 sm:p-0">
          <ul className="divide-y divide-slate-100">
            {data.items.map((p) => (
              <li key={p.id} className="px-4 py-3 sm:px-6">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-medium text-slate-800">{p.title}</p>
                      {p.is_hidden && (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-200">
                          {t.adminBlog.hiddenBadge}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {t.adminBlog.authorColumn}: {p.author_full_name || p.author_username} · {formatDate(p.created_at)} ·{' '}
                      {t.adminBlog.viewsColumn}: {p.view_count} · {t.adminBlog.commentsColumn}: {p.comment_count}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <ButtonLink href={`/blog/${p.id}`} variant="secondary" size="sm">
                      {t.adminBlog.viewPostBtn}
                    </ButtonLink>
                    {p.is_hidden ? (
                      <Button variant="secondary" size="sm" onClick={() => onUnhide(p.id)}>
                        {t.adminBlog.unhideBtn}
                      </Button>
                    ) : (
                      <Button variant="secondary" size="sm" onClick={() => onHide(p.id)}>
                        {t.adminBlog.hideBtn}
                      </Button>
                    )}
                    <Button variant="danger" size="sm" onClick={() => onDelete(p.id, p.title)}>
                      {t.adminBlog.deleteBtn}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedPostId((cur) => (cur === p.id ? null : p.id))}
                    >
                      {t.adminBlog.commentsColumn} {expandedPostId === p.id ? '▲' : '▼'}
                    </Button>
                  </div>
                </div>

                {expandedPostId === p.id && <AdminCommentList postId={p.id} />}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {data && <Pagination page={page} pageSize={PAGE_SIZE} total={data.total} onPageChange={setPage} />}
    </>
  )
}

/** Danh sách bình luận phẳng (không cần lồng đẹp cho mục đích kiểm duyệt) kèm nút Ẩn/Hiện/Xoá. */
function AdminCommentList({ postId }: { postId: string }) {
  const t = useTranslation()
  const confirm = useConfirm()
  const { data, loading, reload } = useApi(() => blogService.listComments(postId), [postId])

  const flatten = (nodes: BlogCommentNode[], depth = 0): Array<{ node: BlogCommentNode; depth: number }> =>
    nodes.flatMap((n) => [{ node: n, depth }, ...flatten(n.replies, depth + 1)])

  const onHide = async (id: string) => {
    await blogService.hideComment(id)
    reload()
  }
  const onUnhide = async (id: string) => {
    await blogService.unhideComment(id)
    reload()
  }
  const onDelete = async (id: string) => {
    if (!(await confirm({ description: t.adminBlog.deleteCommentConfirm, danger: true }))) return
    await blogService.adminDeleteComment(id)
    reload()
  }

  if (loading) return <Spinner />
  const flat = data ? flatten(data) : []
  if (flat.length === 0) return <p className="mt-3 text-xs text-slate-400">—</p>

  return (
    <ul className="mt-3 space-y-2 border-t border-slate-100 pt-3">
      {flat.map(({ node, depth }) => (
        <li key={node.id} className="flex items-start justify-between gap-2 text-xs" style={{ marginLeft: depth * 16 }}>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-slate-700">
              {node.author_full_name || node.author_username}
              {node.is_hidden && <span className="ml-1.5 text-amber-600">({t.adminBlog.hiddenBadge})</span>}
            </p>
            <p className="text-slate-500">{node.content}</p>
          </div>
          <div className="flex shrink-0 gap-1.5">
            {node.is_hidden ? (
              <button type="button" onClick={() => onUnhide(node.id)} className="text-slate-500 hover:text-indigo-600">
                {t.adminBlog.unhideBtn}
              </button>
            ) : (
              <button type="button" onClick={() => onHide(node.id)} className="text-slate-500 hover:text-indigo-600">
                {t.adminBlog.hideBtn}
              </button>
            )}
            <button type="button" onClick={() => onDelete(node.id)} className="text-slate-500 hover:text-rose-600">
              {t.adminBlog.deleteBtn}
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}
