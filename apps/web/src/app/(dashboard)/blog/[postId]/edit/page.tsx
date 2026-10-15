'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { PageHeader } from '@/components/layout/PageHeader'
import { ButtonLink } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ErrorState, Spinner } from '@/components/ui/States'
import { blogService } from '@/features/blog/blog.service'
import { BlogPostForm } from '@/features/blog/components/BlogPostForm'
import { courseService } from '@/features/course/course.service'
import { useApi } from '@/hooks/useApi'
import { useTranslation } from '@/hooks/useTranslation'
import type { BlogPostRequest } from '@/types/api'

export default function EditBlogPostPage({ params }: { params: { postId: string } }) {
  const t = useTranslation()
  const router = useRouter()
  const { data: languages } = useApi(courseService.list, [])
  const { data: post, error, loading, reload } = useApi(() => blogService.getDetail(params.postId), [params.postId])
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const onSubmit = async (req: BlogPostRequest) => {
    setSubmitting(true)
    setFormError(null)
    try {
      await blogService.update(params.postId, req)
      router.push(`/blog/${params.postId}`)
    } catch (err) {
      setFormError((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Spinner label={t.blog.loadingPost} />
  if (error) return <ErrorState error={error} onRetry={reload} />
  if (!post) return null

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Breadcrumbs items={[{ label: t.blog.pageTitle, href: '/blog' }, { label: post.title, href: `/blog/${post.id}` }, { label: t.blog.editPostTitle }]} />
      <PageHeader title={t.blog.editPostTitle} />

      <Card>
        <BlogPostForm initial={post} languages={languages ?? []} onSubmit={onSubmit} submitting={submitting} error={formError} />
      </Card>

      <ButtonLink variant="secondary" href={`/blog/${post.id}`}>
        {t.blog.viewPostBtn}
      </ButtonLink>
    </div>
  )
}
