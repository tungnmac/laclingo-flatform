'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { filterGrid, FilterSelect } from '@/components/FilterSelect'
import { InvestorCard } from '@/components/references/InvestorCard'
import { ResourceCard } from '@/components/references/ResourceCard'
import { useT } from '@/i18n/I18nProvider'
import { api } from '@/lib/api'
import { errorMessage } from '@/lib/error-message'
import { countryName, flagEmoji } from '@/lib/reference-format'
import { nextReferenceParams, REFERENCE_PARAMS } from '@/lib/reference-params'
import type { InvestorListDto, ResourceDto } from '@/server/references/references-service'
import { INVESTOR_SORTS, INVESTOR_STYLES, RESOURCE_LANGUAGES, RESOURCE_TOPICS, RESOURCE_TYPES } from '@/server/references/validation'
import { LEVELS } from '@/server/learn/validation'

const SEARCH_DELAY_MS = 300
type Tab = 'resources' | 'investors'
const PARAMS = REFERENCE_PARAMS

export default function ReferencesPage() {
  return (
    <Suspense>
      <References />
    </Suspense>
  )
}

function References() {
  const { t } = useT()
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const tab: Tab = params.get('tab') === 'investors' ? 'investors' : 'resources'

  /** Đổi tham số trên URL — đọc URL hiện tại lúc gọi (không dùng `params` cũ trong closure của timer tìm kiếm) */
  const update = (patch: Record<string, string>) => {
    const next = nextReferenceParams(new URLSearchParams(window.location.search), patch)
    router.replace(`${pathname}?${next}`, { scroll: false })
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{t('references.title')}</h1>
        <p className="text-sm text-slate-500">{t('references.subtitle')}</p>
      </div>
      <div className="flex gap-2" role="tablist">
        {(['resources', 'investors'] as const).map((x) => (
          <button
            key={x}
            role="tab"
            aria-selected={x === tab}
            onClick={() => update({ tab: x === 'resources' ? '' : x })}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${x === tab ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'}`}
          >
            {t(x === 'resources' ? 'references.tabResources' : 'references.tabInvestors')}
          </button>
        ))}
      </div>
      {tab === 'resources' ? <ResourcesTab params={params} update={update} /> : <InvestorsTab params={params} update={update} />}
    </div>
  )
}

type TabProps = { params: URLSearchParams; update: (patch: Record<string, string>) => void }

/** Ô tìm kiếm có debounce, đồng bộ với tham số q trên URL */
function SearchBox({ params, update, placeholder }: TabProps & { placeholder: string }) {
  const q = params.get('q') ?? ''
  const [query, setQuery] = useState(q)
  // URL đổi từ ngoài (back/forward, đổi tab) → ô nhập theo URL
  useEffect(() => {
    setQuery((cur) => (cur.trim() === q ? cur : q))
  }, [q])
  useEffect(() => {
    if (query.trim() === q) return
    const id = setTimeout(() => update({ q: query.trim() }), SEARCH_DELAY_MS)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])
  return (
    <input
      type="search"
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
      className="block w-full rounded-lg border-0 px-3 py-2 text-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-emerald-600"
    />
  )
}

function Select({ label, value, onChange, options, anyLabel }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][]; anyLabel?: string }) {
  return (
    <FilterSelect label={label} value={value} onChange={onChange}>
      {anyLabel !== undefined && <option value="">{anyLabel}</option>}
      {options.map(([v, l]) => (
        <option key={v} value={v}>
          {l}
        </option>
      ))}
    </FilterSelect>
  )
}

/** Số kết quả: dòng riêng dưới bộ lọc (không chen vào lưới làm lệch các ô) */
function Found({ count }: { count: number }) {
  const { t } = useT()
  return <p className="text-right text-xs text-slate-500">{t('references.found', { count })}</p>
}

/** Tải dữ liệu theo URL; đổi bộ lọc nhanh → bỏ kết quả của request cũ */
function useList<T>(url: string) {
  const { locale } = useT()
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    let alive = true
    setError(null)
    api<T>(url).then(
      (d) => alive && setData(d),
      (e) => alive && setError(e),
    )
    return () => {
      alive = false
    }
  }, [url, locale, retry])
  return { data, error, reload: () => setRetry((r) => r + 1) }
}

function query(params: URLSearchParams, keys: readonly string[]): string {
  const q = new URLSearchParams()
  for (const k of keys) {
    const v = params.get(k)
    if (v) q.set(k, v)
  }
  return q.toString()
}

function Status({ error, loading, empty, reload }: { error: unknown; loading: boolean; empty: boolean; reload: () => void }) {
  const { t } = useT()
  if (error !== null)
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
        <span>{errorMessage(error, t)}</span>
        <button onClick={reload} className="font-semibold underline">
          {t('common.retry')}
        </button>
      </div>
    )
  if (loading) return <p className="py-10 text-center text-slate-400">{t('common.loading')}</p>
  if (empty) return <p className="py-10 text-center text-slate-400">{t('references.empty')}</p>
  return null
}

function ResourcesTab({ params, update }: TabProps) {
  const { t } = useT()
  const { data, error, reload } = useList<ResourceDto[]>(`/api/references/resources?${query(params, PARAMS.resources)}`)
  const sel = (key: string, label: string, options: [string, string][]) => (
    <Select label={label} value={params.get(key) ?? ''} onChange={(v) => update({ [key]: v })} options={options} anyLabel={t('references.any')} />
  )
  return (
    <div className="space-y-4">
      <SearchBox params={params} update={update} placeholder={t('references.search')} />
      <div className={filterGrid(5)}>
        {sel('type', t('references.type'), RESOURCE_TYPES.map((x) => [x, t(`references.type_${x}`)]))}
        {sel('language', t('references.language'), RESOURCE_LANGUAGES.map((x) => [x, t(`references.lang_${x}`)]))}
        {sel('free', t('references.cost'), [
          ['true', t('references.free')],
          ['false', t('references.paid')],
        ])}
        {sel('level', t('references.level'), LEVELS.map((x) => [x, t(`levels.${x}`)]))}
        {sel('topic', t('references.topic'), RESOURCE_TOPICS.map((x) => [x, t(`references.topic_${x}`)]))}
      </div>
      {data && <Found count={data.length} />}
      <Status error={error} loading={!data && error === null} empty={!!data && data.length === 0} reload={reload} />
      <div className="grid gap-3 md:grid-cols-2">
        {data?.map((r) => (
          <ResourceCard key={r.id} r={r} />
        ))}
      </div>
    </div>
  )
}

function InvestorsTab({ params, update }: TabProps) {
  const { t, locale } = useT()
  const { data, error, reload } = useList<InvestorListDto>(`/api/references/investors?${query(params, PARAMS.investors)}`)
  const country = params.get('country') ?? ''
  // Quốc gia đang lọc nhưng không còn ai đã công bố → vẫn giữ trong ô chọn để bỏ lọc được
  const countries = data ? (country && !data.countries.some((c) => c.code === country) ? [...data.countries, { code: country, count: 0 }] : data.countries) : []
  return (
    <div className="space-y-4">
      <SearchBox params={params} update={update} placeholder={t('references.searchInvestors')} />
      <div className={filterGrid(4)}>
        <Select
          label={t('references.country')}
          value={country}
          onChange={(v) => update({ country: v })}
          anyLabel={t('references.any')}
          options={countries.map((c) => [c.code, `${flagEmoji(c.code)} ${countryName(c.code, locale)} (${c.count})`])}
        />
        <Select
          label={t('references.style')}
          value={params.get('style') ?? ''}
          onChange={(v) => update({ style: v })}
          anyLabel={t('references.any')}
          options={INVESTOR_STYLES.map((x) => [x, t(`references.style_${x}`)])}
        />
        <Select
          label={t('references.status')}
          value={params.get('status') ?? ''}
          onChange={(v) => update({ status: v })}
          anyLabel={t('references.any')}
          options={[
            ['alive', t('references.alive')],
            ['deceased', t('references.deceased')],
          ]}
        />
        <Select
          label={t('references.sort')}
          value={params.get('sort') ?? ''}
          onChange={(v) => update({ sort: v })}
          options={[['', t('references.sort_default')], ...INVESTOR_SORTS.map((x): [string, string] => [x, t(`references.sort_${x}`)])]}
        />
      </div>
      {data && <Found count={data.items.length} />}
      <Status error={error} loading={!data && error === null} empty={!!data && data.items.length === 0} reload={reload} />
      <div className="grid gap-3 md:grid-cols-2">
        {data?.items.map((x) => (
          <InvestorCard key={x.slug} x={x} />
        ))}
      </div>
      <p className="text-xs text-slate-400">
        {t('references.sourcesNote')} {t('references.disclaimer')}
      </p>
    </div>
  )
}
