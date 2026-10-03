import Link from 'next/link'
import type { Language } from '@/types/api'

const flags: Record<string, string> = { en: '🇬🇧', ja: '🇯🇵', ko: '🇰🇷', zh: '🇨🇳', fr: '🇫🇷', de: '🇩🇪', vi: '🇻🇳' }

export function languageFlag(id: string) {
  return flags[id] ?? '🌐'
}

// Mã BCP-47 cho Web Speech API (SpeechSynthesisUtterance.lang) — khớp cột
// `code` của từng ngôn ngữ trong DB, liệt kê riêng ở đây để AudioButton dùng
// được mà không cần fetch thêm.
const speechLangs: Record<string, string> = { en: 'en-US', ja: 'ja-JP', ko: 'ko-KR', zh: 'zh-CN', fr: 'fr-FR', de: 'de-DE', vi: 'vi-VN' }

export function speechLang(id: string) {
  return speechLangs[id] ?? 'en-US'
}

// Câu mẫu để "Nghe thử" giọng đã chọn ở trang Hồ sơ.
const previewPhrases: Record<string, string> = {
  en: 'Hello, nice to meet you.',
  ja: 'こんにちは、はじめまして。',
  ko: '안녕하세요, 반갑습니다.',
  zh: '你好，很高兴认识你。',
  fr: 'Bonjour, ravi de vous rencontrer.',
  de: 'Hallo, schön dich kennenzulernen.',
  vi: 'Xin chào, rất vui được gặp bạn.',
}

export function previewPhrase(id: string) {
  return previewPhrases[id] ?? 'Hello!'
}

export function LanguageCard({ language }: { language: Language }) {
  return (
    <Link
      href={`/learn/${language.id}`}
      className="group flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-indigo-300 sm:p-5"
    >
      <span className="text-4xl">{languageFlag(language.id)}</span>
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-lg font-semibold text-slate-900 group-hover:text-indigo-600">{language.name}</h3>
        <p className="text-sm text-slate-500">{language.code}</p>
      </div>
      <span aria-hidden className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-indigo-500">
        →
      </span>
    </Link>
  )
}
