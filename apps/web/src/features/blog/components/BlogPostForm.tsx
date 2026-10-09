'use client'

import { useState, type FormEvent, type KeyboardEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { inputClass } from '@/features/auth/components/AuthForm'
import { useTranslation } from '@/hooks/useTranslation'
import { cn, extractYoutubeId } from '@/lib/utils'
import type { BlogPostDetail, BlogPostRequest, Language } from '@/types/api'

/** Form tạo/sửa bài viết — dùng chung cho /blog/new và /blog/[postId]/edit.
 * Ảnh đính kèm KHÔNG nằm trong form này (cần postId đã tồn tại), xem trang edit. */
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
  const [youtubeUrls, setYoutubeUrls] = useState<string[]>(initial?.youtube_urls ?? [])
  const [youtubeInput, setYoutubeInput] = useState('')
  const [youtubeError, setYoutubeError] = useState<string | null>(null)

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

  const addYoutube = () => {
    const value = youtubeInput.trim()
    if (!value) return
    if (!extractYoutubeId(value)) {
      setYoutubeError(t.blog.youtubeHint)
      return
    }
    setYoutubeError(null)
    setYoutubeUrls((us) => [...us, value])
    setYoutubeInput('')
  }
  const removeYoutube = (value: string) => setYoutubeUrls((us) => us.filter((u) => u !== value))

  const onFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    onSubmit({ language_id: languageId || undefined, title: title.trim(), content: content.trim(), tags, youtube_urls: youtubeUrls })
  }

  return (
    <form onSubmit={onFormSubmit} className="space-y-4">
      <label className="block text-sm font-medium text-slate-700">
        {t.blog.titleLabel}
        <input value={title} onChange={(e) => setTitle(e.target.value)} required className={inputClass} />
      </label>

      <label className="block text-sm font-medium text-slate-700">
        {t.blog.contentLabel}
        <textarea value={content} onChange={(e) => setContent(e.target.value)} required rows={8} className={inputClass} />
      </label>

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

      <div>
        <label className="block text-sm font-medium text-slate-700">{t.blog.youtubeLabel}</label>
        <div className="mt-1 flex gap-2">
          <input
            value={youtubeInput}
            onChange={(e) => setYoutubeInput(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className={cn(inputClass, 'mt-0')}
          />
          <Button type="button" variant="secondary" onClick={addYoutube}>
            {t.blog.youtubeAddBtn}
          </Button>
        </div>
        <p className="mt-1 text-xs text-slate-400">{t.blog.youtubeHint}</p>
        {youtubeError && <p className="mt-1 text-xs text-rose-600">{youtubeError}</p>}
        {youtubeUrls.length > 0 && (
          <ul className="mt-2 space-y-1">
            {youtubeUrls.map((u) => (
              <li key={u} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-1.5 text-xs text-slate-600">
                <span className="truncate">{u}</span>
                <button type="button" onClick={() => removeYoutube(u)} className="shrink-0 text-slate-400 hover:text-rose-600">
                  ×
                </button>
              </li>
            ))}
          </ul>
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
