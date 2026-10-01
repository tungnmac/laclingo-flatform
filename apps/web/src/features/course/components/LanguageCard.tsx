import Link from 'next/link'
import type { Language } from '@/types/api'

const flags: Record<string, string> = { en: '🇬🇧', ja: '🇯🇵', ko: '🇰🇷', zh: '🇨🇳', fr: '🇫🇷', de: '🇩🇪', vi: '🇻🇳' }

export function languageFlag(id: string) {
  return flags[id] ?? '🌐'
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
