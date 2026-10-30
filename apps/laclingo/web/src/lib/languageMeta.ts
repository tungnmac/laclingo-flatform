import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Language } from '@/types/api'

// Thông tin hiển thị của ngôn ngữ học (cờ, mã đọc phát âm, câu nghe thử, thang trình độ) — nguồn chuẩn là backend
// (service/language_meta.go, trả trong /languages*): course.service và LocaleSync nạp vào đây mỗi lần tải danh sách ngôn
// ngữ, lưu local để offline vẫn dùng được. Các bảng dưới chỉ là dự phòng khi chưa tải được API lần nào.

const FALLBACK_FLAGS: Record<string, string> = {
  en: '🇬🇧', ja: '🇯🇵', ko: '🇰🇷', zh: '🇨🇳', fr: '🇫🇷', de: '🇩🇪', vi: '🇻🇳', es: '🇪🇸', it: '🇮🇹', pt: '🇧🇷', ru: '🇷🇺',
  th: '🇹🇭', id: '🇮🇩', ms: '🇲🇾', hi: '🇮🇳', ar: '🇸🇦', tr: '🇹🇷', nl: '🇳🇱', pl: '🇵🇱', sv: '🇸🇪', km: '🇰🇭',
}

// Mã BCP-47 cho Web Speech API — khớp cột `code` của ngôn ngữ trong DB
const FALLBACK_SPEECH_LANGS: Record<string, string> = {
  en: 'en-US', ja: 'ja-JP', ko: 'ko-KR', zh: 'zh-CN', fr: 'fr-FR', de: 'de-DE', vi: 'vi-VN', es: 'es-ES', it: 'it-IT', pt: 'pt-BR',
  ru: 'ru-RU', th: 'th-TH', id: 'id-ID', ms: 'ms-MY', hi: 'hi-IN', ar: 'ar-SA', tr: 'tr-TR', nl: 'nl-NL', pl: 'pl-PL', sv: 'sv-SE',
  km: 'km-KH',
}

// Câu mẫu để "Nghe thử" giọng đã chọn ở trang Hồ sơ
const FALLBACK_PREVIEW_PHRASES: Record<string, string> = {
  en: 'Hello, nice to meet you.',
  ja: 'こんにちは、はじめまして。',
  ko: '안녕하세요, 반갑습니다.',
  zh: '你好，很高兴认识你。',
  fr: 'Bonjour, ravi de vous rencontrer.',
  de: 'Hallo, schön dich kennenzulernen.',
  vi: 'Xin chào, rất vui được gặp bạn.',
}

type LanguageMeta = { flag?: string; code?: string; preview?: string; levelScale?: string[] }

interface LanguageMetaState {
  byId: Record<string, LanguageMeta>
  register: (languages: Language[]) => void
}

const useLanguageMeta = create<LanguageMetaState>()(
  persist(
    (set) => ({
      byId: {},
      register: (languages) =>
        set((s) => {
          const byId = { ...s.byId }
          for (const l of languages) {
            byId[l.id] = {
              flag: l.flag || undefined,
              code: l.code || undefined,
              preview: l.preview_phrase || undefined,
              levelScale: l.level_scale?.length ? l.level_scale : undefined,
            }
          }
          return { byId }
        }),
    }),
    { name: 'laclingo-language-meta' },
  ),
)

/** Ghi nhớ thông tin ngôn ngữ từ response API rồi trả nguyên response (dùng trong .then của service) */
export function registerLanguages<T extends Language | Language[]>(data: T): T {
  useLanguageMeta.getState().register(Array.isArray(data) ? data : [data])
  return data
}

function meta(id: string): LanguageMeta | undefined {
  return useLanguageMeta.getState().byId[id]
}

export function languageFlag(id: string) {
  return meta(id)?.flag ?? FALLBACK_FLAGS[id] ?? '🌐'
}

/** Mã BCP-47 đọc phát âm / nhận dạng giọng nói của ngôn ngữ học */
export function speechLang(id: string) {
  return meta(id)?.code ?? FALLBACK_SPEECH_LANGS[id] ?? 'en-US'
}

export function previewPhrase(id: string) {
  return meta(id)?.preview ?? FALLBACK_PREVIEW_PHRASES[id] ?? 'Hello!'
}

/** Thang trình độ backend đã trả cho ngôn ngữ (undefined = chưa tải) */
export function knownLevelScale(id: string): string[] | undefined {
  return meta(id)?.levelScale
}
