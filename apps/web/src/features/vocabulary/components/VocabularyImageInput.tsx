'use client'

import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { useTranslation } from '@/hooks/useTranslation'
import { resolveMediaUrl } from '@/lib/api'
import { vocabularyService } from '../vocabulary.service'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // khớp giới hạn backend

/**
 * Ô ảnh minh hoạ trong form admin từ vựng: chọn file là upload ngay lên R2,
 * giữ URL tương đối trả về trong input ẩn `name` để form submit kèm theo.
 */
export function VocabularyImageInput({
  name,
  defaultValue,
  onUploadingChange,
}: {
  name: string
  defaultValue?: string
  onUploadingChange?: (uploading: boolean) => void
}) {
  const t = useTranslation()
  const fileRef = useRef<HTMLInputElement>(null)
  const [url, setUrl] = useState(defaultValue ?? '')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mounted = useRef(true)
  // Form đóng/đổi từ khi đang upload: nhả cờ uploading của cha ngay, bỏ kết quả về sau
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      onUploadingChange?.(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setBusy = (busy: boolean) => {
    if (!mounted.current) return
    setUploading(busy)
    onUploadingChange?.(busy)
  }

  const onPick = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // cho phép chọn lại đúng file đó lần sau
    if (!file) return
    if (file.size > MAX_IMAGE_BYTES) {
      setError(t.adminVocabulary.imageTooLarge)
      return
    }
    setBusy(true)
    setError(null)
    try {
      const res = await vocabularyService.uploadImage(file)
      if (mounted.current) setUrl(res.url)
    } catch (err) {
      if (mounted.current) setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-1 flex flex-col gap-2">
      <input type="hidden" name={name} value={url} />
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={onPick} />
      <div className="flex items-center gap-3">
        {url && <img src={resolveMediaUrl(url)} alt="" className="h-16 w-16 rounded-xl object-cover ring-1 ring-slate-200" />}
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
            {uploading ? t.adminVocabulary.uploadingImage : url ? t.adminVocabulary.changeImageBtn : t.adminVocabulary.uploadImageBtn}
          </Button>
          {url && !uploading && (
            <Button type="button" variant="ghost" size="sm" onClick={() => setUrl('')}>
              {t.adminVocabulary.removeImageBtn}
            </Button>
          )}
        </div>
      </div>
      <p className="text-xs font-normal text-slate-400">{t.adminVocabulary.illustrationImageHint}</p>
      {error && <p className="text-xs font-normal text-rose-600">{error}</p>}
    </div>
  )
}
