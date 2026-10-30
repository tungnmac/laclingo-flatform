'use client'

import { useApi } from '@/hooks/useApi'
import { courseService } from '../course.service'
import { languageFlag } from './LanguageCard'

// Lúc chưa tải xong / tải lỗi vẫn chọn được 2 ngôn ngữ có sẵn từ đầu
const FALLBACK = [
  { id: 'en', name: 'English' },
  { id: 'zh', name: '中文 (Tiếng Trung)' },
]

/** Các <option> ngôn ngữ cho ô chọn ở trang quản trị — lấy từ kho (GET /languages: ngôn ngữ đã có nội dung, gồm cả
 * ngôn ngữ dựng từ "Học ngôn ngữ mới" như tiếng Nhật, tiếng Hàn) thay vì viết cứng en/zh */
export function LanguageOptions() {
  const { data } = useApi(courseService.list, [])
  return (
    <>
      {(data?.length ? data : FALLBACK).map((l) => (
        <option key={l.id} value={l.id}>
          {languageFlag(l.id)} {l.name}
        </option>
      ))}
    </>
  )
}
