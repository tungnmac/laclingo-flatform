'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { blogService } from '@/features/blog/blog.service'
import { BlogPostForm } from '@/features/blog/components/BlogPostForm'
import { courseService } from '@/features/course/course.service'
import { useApi } from '@/hooks/useApi'
import { useTranslation } from '@/hooks/useTranslation'
import type { BlogPostRequest } from '@/types/api'

export default function NewBlogPostPage() {
  const t = useTranslation()
  const router = useRouter()
  const { data: languages } = useApi(courseService.list, [])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (req: BlogPostRequest) => {
    setSubmitting(true)
    setError(null)
    try {
      const post = await blogService.create(req)
      router.push(`/blog/${post.id}/edit`)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Breadcrumbs items={[{ label: t.blog.pageTitle, href: '/blog' }, { label: t.blog.newPostTitle }]} />
      <PageHeader title={t.blog.newPostTitle} />
      <Card>
        <BlogPostForm languages={languages ?? []} onSubmit={onSubmit} submitting={submitting} error={error} />
      </Card>
    </div>
  )
}
