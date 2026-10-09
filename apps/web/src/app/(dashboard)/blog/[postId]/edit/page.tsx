'use client'

import { useRef, useState } from 'react'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useConfirm } from '@/components/ui/ConfirmDialogProvider'
import { ErrorState, Spinner } from '@/components/ui/States'
import { blogService } from '@/features/blog/blog.service'
import { BlogPostForm } from '@/features/blog/components/BlogPostForm'
import { courseService } from '@/features/course/course.service'
import { useApi } from '@/hooks/useApi'
import { useTranslation } from '@/hooks/useTranslation'
import type { BlogPostRequest } from '@/types/api'

export default function EditBlogPostPage({ params }: { params: { postId: string } }) {
  const t = useTranslation()
  const confirm = useConfirm()
  const { data: languages } = useApi(courseService.list, [])
  const { data: post, error, loading, reload } = useApi(() => blogService.getDetail(params.postId), [params.postId])
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  const onSubmit = async (req: BlogPostRequest) => {
    setSubmitting(true)
    setFormError(null)
    try {
      await blogService.update(params.postId, req)
      reload()
    } catch (err) {
      setFormError((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  const onUpload = async (file: File) => {
    setUploading(true)
    setUploadError(null)
    try {
      await blogService.uploadImage(params.postId, file)
      reload()
    } catch (err) {
      setUploadError((err as Error).message)
    } finally {
      setUploading(false)
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  const onDeleteImage = async (imageId: string) => {
    if (!(await confirm({ description: t.blog.deleteImageConfirm, danger: true }))) return
    await blogService.deleteImage(params.postId, imageId)
    reload()
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

      <Card>
        <h3 className="text-base font-semibold text-slate-900">{t.blog.imagesTitle}</h3>
        <p className="mt-1 text-xs text-slate-500">{t.blog.maxImagesHint}</p>

        {post.images.length > 0 && (
          <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
            {post.images.map((img) => (
              <div key={img.id} className="group relative aspect-square overflow-hidden rounded-lg bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => onDeleteImage(img.id)}
                  className="absolute right-1 top-1 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white opacity-0 transition group-hover:opacity-100"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-3">
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            disabled={uploading || post.images.length >= 6}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) onUpload(file)
            }}
            className="hidden"
            id="blog-image-input"
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={uploading || post.images.length >= 6}
            onClick={() => fileInput.current?.click()}
          >
            {uploading ? t.blog.uploadingImage : t.blog.addImageBtn}
          </Button>
          {uploadError && <p className="mt-2 text-sm text-rose-600">{uploadError}</p>}
        </div>
      </Card>

      <ButtonLink variant="secondary" href={`/blog/${post.id}`}>
        {t.blog.viewPostBtn}
      </ButtonLink>
    </div>
  )
}
