'use client'

import { useState, type FormEvent, type KeyboardEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { inputClass } from '@/features/auth/components/AuthForm'
import { RichTextEditor } from '@/features/blog/components/RichTextEditor'
import { useTranslation } from '@/hooks/useTranslation'
import type { BlogPostDetail, BlogPostRequest, Language } from '@/types/api'

/** Form tạo/sửa bài viết — dùng chung cho /blog/new và /blog/[postId]/edit.
 * Nội dung dùng rich text editor đầy đủ công cụ (xem RichTextEditor) — ảnh và
 * video YouTube chèn NGAY TRONG content qua toolbar, không có field riêng. */
export function BlogPostForm({
  initial,
  languages,
  onSubmit,
  submitting,
  error,
}: {
  initial?: BlogPostDetail
  languages: Language[]
  onSubmit: (req: BlogPostRequest) => void
  submitting: boolean
  error: string | null
}) {
  const t = useTranslation()
  const [title, setTitle] = useState(initial?.title ?? '')
  const [content, setContent] = useState(initial?.content ?? '')
  const [languageId, setLanguageId] = useState(initial?.language_id ?? '')
  const [tags, setTags] = useState<string[]>(initial?.tags ?? [])
  const [tagInput, setTagInput] = useState('')

  const addTag = () => {
    const value = tagInput.trim()
    if (value && !tags.includes(value)) setTags((ts) => [...ts, value])
    setTagInput('')
  }
  const onTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }
  const removeTag = (value: string) => setTags((ts) => ts.filter((tg) => tg !== value))

  const onFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    onSubmit({ language_id: languageId || undefined, title: title.trim(), content, tags })
  }

  return (
    <form onSubmit={onFormSubmit} className="space-y-4">
      <label className="block text-sm font-medium text-slate-700">
        {t.blog.titleLabel}
        <input value={title} onChange={(e) => setTitle(e.target.value)} required className={inputClass} />
      </label>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">{t.blog.contentLabel}</label>
        <RichTextEditor content={content} onChange={setContent} placeholder={t.blog.contentPlaceholder} />
      </div>

      <label className="block text-sm font-medium text-slate-700">
        {t.blog.languageOptionalLabel}
        <select value={languageId} onChange={(e) => setLanguageId(e.target.value)} className={inputClass}>
          <option value="">—</option>
          {languages.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </label>

      <div>
        <label className="block text-sm font-medium text-slate-700">
          {t.blog.tagsLabel}
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={onTagKeyDown}
            placeholder={t.blog.tagsPlaceholder}
            className={inputClass}
          />
        </label>
        <p className="mt-1 text-xs text-slate-400">{t.blog.tagsHint}</p>
        {tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {tags.map((tg) => (
              <span key={tg} className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                #{tg}
                <button type="button" onClick={() => removeTag(tg)} aria-label={`remove ${tg}`} className="text-indigo-400 hover:text-indigo-700">
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
          {error}
        </p>
      )}

      <Button type="submit" disabled={submitting}>
        {submitting ? t.blog.submittingBtn : initial ? t.blog.submitUpdateBtn : t.blog.submitCreateBtn}
      </Button>
    </form>
  )
}
