'use client'

import { useEffect } from 'react'
import { courseService } from '@/features/course/course.service'
import { deckService } from '@/features/deck/deck.service'
import { vocabularyService } from '@/features/vocabulary/vocabulary.service'
import { ApiError, isNetworkError, networkError } from '@/lib/api'
import { CARDS, OUTBOX, REVIEWED, currentUserId, markLearnedInCache, openDB, run } from '@/lib/offlineDb'
import type { DueVocabulary, VocabularyCard } from '@/types/api'
import { srsService } from './srs.service'

export { isNetworkError }

// Ôn tập / học từ offline (IndexedDB — lib/offlineDb.ts, theo từng tài khoản):
// - cards: bộ thẻ tải lần gần nhất của mỗi phiên ôn (ngôn ngữ / list) → mất mạng vẫn mở lại được
// - reviewed: lúc ôn gần nhất của từng từ → mở lại bộ thẻ cũ không hiện lại từ đã ôn sau lúc tải
// - outbox: thao tác lúc mất mạng, gửi lần lượt khi có mạng lại — kết quả ôn (kèm lúc ôn thật + client_review_id,
//   server bỏ qua kết quả đã lưu), thêm từ vào ôn tập / vào list (server tự bỏ qua nếu đã có)

interface CachedCards {
  savedAt: number
  cards: DueVocabulary[]
}

export type QueuedReview = { vocabulary_id: string; reviewed_at: string; client_review_id: string } & (
  | { kind: 'review'; quality: number }
  | { kind: 'practice'; mistakes: number }
)

/** Thêm từ vào ôn tập (chỉ hàng đợi SRS / vào 1 list) lúc mất mạng */
type QueuedLearn = { kind: 'learn'; vocabulary_id: string } | { kind: 'deck-add'; vocabulary_id: string; deck_id: string }

type OutboxRow = (QueuedReview | QueuedLearn) & { id?: number; user_id: string }

/** uuid v4 — crypto.randomUUID chỉ có ở https/localhost, app thử trên máy dev chạy http://<IP LAN> */
export function newClientReviewId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  const b = crypto.getRandomValues(new Uint8Array(16))
  b[6] = (b[6] & 0x0f) | 0x40
  b[8] = (b[8] & 0x3f) | 0x80
  const hex = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

function cardsKey(userId: string, language?: string, deck?: string) {
  return `${userId}|${language ?? ''}|${deck ?? ''}`
}

export async function saveCards(cards: DueVocabulary[], language?: string, deck?: string): Promise<void> {
  const userId = currentUserId()
  if (!userId) return
  const value: CachedCards = { savedAt: Date.now(), cards }
  await run(CARDS, 'readwrite', (s) => s.put(value, cardsKey(userId, language, deck))).catch(() => {})
}

/**
 * Bộ thẻ đã tải lần trước, bỏ các từ đã ôn sau lúc tải (kể cả đang chờ đồng bộ); chưa từng tải → null. Ôn 1 ngôn ngữ
 * mà chưa tải riêng → lấy từ bộ thẻ mặc định (mọi ngôn ngữ — dashboard tải sẵn, xem prepareOffline)
 */
export async function loadCards(language?: string, deck?: string): Promise<DueVocabulary[] | null> {
  const userId = currentUserId()
  if (!userId) return null
  try {
    let cached = await run<CachedCards | undefined>(CARDS, 'readonly', (s) => s.get(cardsKey(userId, language, deck)))
    if (!cached && language && !deck) {
      const all = await run<CachedCards | undefined>(CARDS, 'readonly', (s) => s.get(cardsKey(userId)))
      if (all) cached = { ...all, cards: all.cards.filter((c) => c.language_id === language) }
    }
    if (!cached) return null
    const { savedAt, cards } = cached
    const reviewedAt = await reviewedTimes(userId, cards)
    return cards.filter((_, i) => (reviewedAt[i] ?? 0) < savedAt)
  } catch {
    return null
  }
}

/** Lúc ôn gần nhất của từng thẻ — 1 transaction cho cả bộ */
async function reviewedTimes(userId: string, cards: DueVocabulary[]): Promise<(number | undefined)[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(REVIEWED, 'readonly')
    const store = tx.objectStore(REVIEWED)
    const reqs = cards.map((c) => store.get(`${userId}|${c.vocabulary_id}`) as IDBRequest<number | undefined>)
    tx.oncomplete = () => resolve(reqs.map((r) => r.result))
    tx.onerror = tx.onabort = () => reject(tx.error)
  })
}

/** Ghi lại lúc ôn 1 từ (đã lưu lên server hoặc đang chờ đồng bộ) */
export async function markReviewed(vocabularyId: string, at: string): Promise<void> {
  const userId = currentUserId()
  if (!userId) return
  await run(REVIEWED, 'readwrite', (s) => s.put(Date.parse(at), `${userId}|${vocabularyId}`)).catch(() => {})
}

/** Thêm 1 thao tác vào hàng đợi. Lỗi (không có IndexedDB) → ném ra để nơi gọi báo lỗi như cũ */
async function enqueue(item: QueuedReview | QueuedLearn): Promise<void> {
  const userId = currentUserId()
  if (!userId) throw new Error('no session')
  const row: OutboxRow = { ...item, user_id: userId }
  await run(OUTBOX, 'readwrite', (s) => s.add(row))
}

/** Đưa kết quả ôn lúc mất mạng vào hàng đợi */
export async function enqueueReview(item: QueuedReview): Promise<void> {
  await enqueue(item)
  await markReviewed(item.vocabulary_id, item.reviewed_at)
}

async function pendingRows(): Promise<OutboxRow[]> {
  const userId = currentUserId()
  const rows = await run<OutboxRow[]>(OUTBOX, 'readonly', (s) => s.getAll()).catch(() => [] as OutboxRow[])
  return rows.filter((r) => r.user_id === userId)
}

/** Từ có kết quả ôn đang chờ đồng bộ — server chưa biết nên vẫn trả về là đến hạn */
export async function pendingVocabularyIds(): Promise<Set<string>> {
  const rows = await pendingRows()
  return new Set(rows.filter((r) => r.kind === 'review' || r.kind === 'practice').map((r) => r.vocabulary_id))
}

/**
 * Gọi API khi có mạng; mất mạng (hoặc gọi lỗi mạng) → xếp vào hàng đợi, coi như xong. Không lưu được trên máy
 * (trình duyệt chặn IndexedDB) → báo lỗi mất kết nối như apiFetch
 */
async function runOrQueue(call: () => Promise<unknown>, item: QueuedLearn): Promise<void> {
  const queue = () => enqueue(item).catch(() => Promise.reject(networkError()))
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return queue()
  try {
    await call()
  } catch (err) {
    if (!isNetworkError(err)) throw err
    return queue()
  }
  void markLearnedInCache(item.vocabulary_id, item.kind === 'deck-add' ? item.deck_id : undefined)
}

/** "Chỉ đưa vào hàng đợi ôn tập" — dùng được khi offline */
export function learnWord(vocabularyId: string): Promise<void> {
  return runOrQueue(() => srsService.learn(vocabularyId), { kind: 'learn', vocabulary_id: vocabularyId })
}

/** Thêm từ vào 1 list (kéo theo vào hàng đợi ôn tập) — dùng được khi offline */
export function addWordToDeck(deckId: string, vocabularyId: string, opts?: { notify?: false }): Promise<void> {
  return runOrQueue(() => deckService.addWord(deckId, vocabularyId, opts), {
    kind: 'deck-add',
    deck_id: deckId,
    vocabulary_id: vocabularyId,
  })
}

/** Áp các thao tác "thêm vào ôn tập / vào list" đang chờ đồng bộ lên danh sách từ (dữ liệu server chưa có) */
export async function withPendingLearns(words: VocabularyCard[]): Promise<VocabularyCard[]> {
  const rows = (await pendingRows()).filter((r): r is OutboxRow & QueuedLearn => r.kind === 'learn' || r.kind === 'deck-add')
  if (rows.length === 0) return words
  return words.map((w) => {
    const mine = rows.filter((r) => r.vocabulary_id === w.vocabulary_id)
    if (mine.length === 0) return w
    const deckIds = mine.flatMap((r) => (r.kind === 'deck-add' ? [r.deck_id] : []))
    return { ...w, in_review: true, deck_ids: [...new Set([...w.deck_ids, ...deckIds])] }
  })
}

let syncing: Promise<void> | null = null

/** Gửi hàng đợi của tài khoản hiện tại theo thứ tự đã ôn. Không bao giờ ném lỗi; nhiều nơi gọi cùng lúc dùng chung 1 lần */
export function syncOutbox(): Promise<void> {
  if (!syncing) syncing = doSync().finally(() => (syncing = null))
  return syncing
}

async function doSync(): Promise<void> {
  const userId = currentUserId()
  if (!userId) return
  const rows = await run<OutboxRow[]>(OUTBOX, 'readonly', (s) => s.getAll()).catch(() => [] as OutboxRow[])
  for (const row of rows.filter((r) => r.user_id === userId)) {
    // Chạy ngầm: hết lượt ôn của gói không tự mở màn nâng cấp Pro, không hiện thông báo chung
    const init = { paywall: false, notify: false } as const
    try {
      if (row.kind === 'learn' || row.kind === 'deck-add') {
        if (row.kind === 'learn') await srsService.learn(row.vocabulary_id, init)
        else await deckService.addWord(row.deck_id, row.vocabulary_id, init)
        await markLearnedInCache(row.vocabulary_id, row.kind === 'deck-add' ? row.deck_id : undefined)
      } else {
        const sent = { vocabulary_id: row.vocabulary_id, reviewed_at: row.reviewed_at, client_review_id: row.client_review_id }
        if (row.kind === 'practice') await srsService.practice({ ...sent, mistakes: row.mistakes }, init)
        else await srsService.review({ ...sent, quality: row.quality }, init)
      }
    } catch (err) {
      const status = err instanceof ApiError ? err.status : 0
      // Mất mạng / hết phiên / hết lượt ôn của gói / bị giới hạn tần suất → giữ nguyên, dừng, lần sau gửi tiếp
      if (status === 0 || status === 401 || status === 402 || status === 429) return
      // Server lỗi với riêng kết quả này → giữ lại, gửi các kết quả sau (không chặn cả hàng đợi)
      if (status >= 500) continue
      // 4xx khác: server không bao giờ nhận (từ / list đã bị xoá, ôn quá 30 ngày trước...) → bỏ khỏi hàng đợi
    }
    await run(OUTBOX, 'readwrite', (s) => s.delete(row.id!)).catch(() => {})
  }
}

/** Trang ôn tập (có thông báo offline riêng — components/layout/OfflineBanner.tsx) */
export const OFFLINE_REVIEW_PATH = '/review/vocabulary'

// Trang nhờ service worker lưu sẵn (public/sw.js lưu mọi trang đã mở; đây là các trang người dùng có thể chưa mở lần
// nào): thanh điều hướng + học / ôn tập. Thêm trang khoá học của từng ngôn ngữ và chi tiết từng list khi tải sẵn
const OFFLINE_PAGES = [
  '/learn',
  '/review',
  OFFLINE_REVIEW_PATH,
  '/review/new',
  '/review/new/subtopics',
  '/review/new/topic',
  '/review/lists',
  '/review/favorites',
  '/review/srs-words',
  '/challenges',
  '/leaderboard',
  '/profile',
  '/settings',
  '/missions',
  '/daily',
  '/listening',
  '/speaking',
  '/blog',
  '/wallet',
  '/pricing',
]

function cachePages(urls: string[]) {
  navigator.serviceWorker?.ready
    .then((reg) => reg.active?.postMessage({ type: 'cache-offline-pages', urls }))
    .catch(() => {})
}

// Lưu trang + tải sẵn toàn bộ dữ liệu học / ôn offline (chủ đề, từ, list) tối đa 1 lần mỗi 12 giờ — bộ thẻ đến hạn
// mặc định thì mỗi lần vào app (1 request). Trang mở khi có mạng vẫn luôn được service worker lưu bản mới (sw.js)
const PREFETCH_EVERY_MS = 12 * 3600_000
const prefetchKey = (userId: string) => `laclingo-offline-prefetch:${userId}`
// Tải sẵn tối đa bấy nhiêu list (mỗi list: chi tiết + bộ thẻ + trang) — nhiều list hơn thì list còn lại cần mạng
const MAX_PREFETCH_DECKS = 30

/**
 * Chuẩn bị dùng offline khi đang có mạng: nhờ service worker lưu các trang (kèm JS/CSS) và tải sẵn dữ liệu — người
 * dùng chưa mở các trang đó lần nào vẫn học / ôn offline được
 */
function prepareOffline() {
  void saveDueCards(20)

  const userId = currentUserId()
  if (!userId) return
  let last = 0
  try {
    last = Number(localStorage.getItem(prefetchKey(userId))) || 0
  } catch {}
  if (Date.now() - last < PREFETCH_EVERY_MS) return
  cachePages(OFFLINE_PAGES) // giao diện không phụ thuộc API — lưu kể cả khi server API đang lỗi
  prefetchAll().then(
    () => {
      try {
        localStorage.setItem(prefetchKey(userId), String(Date.now()))
      } catch {}
    },
    () => {}, // mất mạng giữa chừng → lần vào app sau tải lại
  )
}

/** Tải + lưu bộ thẻ đến hạn (bỏ từ đang chờ đồng bộ — như useSRSReviewSession) */
async function saveDueCards(limit: number, language?: string, deck?: string) {
  const pendingIds = pendingVocabularyIds()
  const data = await srsService.getDue(limit, language, deck, { offlineCache: false }).catch(() => null)
  if (!data) return
  const pending = await pendingIds
  await saveCards(
    data.filter((c) => !pending.has(c.vocabulary_id)),
    language,
    deck,
  )
}

/**
 * Chạy 1 bước tải sẵn: lỗi riêng của bước đó (404, 429, 5xx...) thì bỏ qua bước, mất mạng thì dừng cả lượt (không ghi
 * mốc 12 giờ — lần vào app sau tải lại)
 */
async function step<T>(load: () => Promise<T>): Promise<T | null> {
  try {
    return await load()
  } catch (err) {
    if (isNetworkError(err)) throw err
    return null
  }
}

/** Mọi dữ liệu các trang offline cần — chạy lần lượt (không dồn request) */
async function prefetchAll() {
  const decks = ((await step(() => deckService.list())) ?? []).slice(0, MAX_PREFETCH_DECKS)
  const languages = (await step(() => courseService.mine())) ?? []
  // Giao diện: trang khoá học từng ngôn ngữ + chi tiết từng list (service worker tải lần lượt)
  cachePages([
    ...languages.map((l) => `/learn/${encodeURIComponent(l.id)}`),
    ...decks.map((d) => `/review/lists/${encodeURIComponent(d.id)}`),
  ])

  // Ôn tập theo list: chi tiết + bộ thẻ "Học lại list" của từng list
  for (const deck of decks) {
    await step(() => deckService.get(deck.id))
    if (deck.word_count > 0) await saveDueCards(100, undefined, deck.id)
  }

  // Hub ôn tập (số từ đến hạn + bộ thẻ "Ôn ngay") + học từ vựng: không chọn ngôn ngữ (mặc định) và từng ngôn ngữ
  for (const language of [undefined, ...languages.map((l) => l.id)]) {
    await step(() => srsService.getDue(100, language))
    if (language) {
      await saveDueCards(20, language)
      await step(() => courseService.getById(language))
    }
    await prefetchTopics((await step(() => vocabularyService.listTopics(language))) ?? [], language)
  }
}

async function prefetchTopics(topics: { name: string; has_children: boolean }[], language: string | undefined, depth = 0) {
  for (const topic of topics) {
    if (topic.has_children && depth < 3) {
      const children = (await step(() => vocabularyService.listChildTopics(topic.name, language))) ?? []
      await prefetchTopics(children, language, depth + 1)
    } else {
      await step(() => vocabularyService.listWords(topic.name, language))
    }
  }
}

/** Mount 1 lần trong dashboard: chuẩn bị ôn offline, gửi hàng đợi khi vào app, khi có mạng lại và khi quay lại tab/app */
export function useOfflineReviewSync() {
  useEffect(() => {
    const sync = () => void syncOutbox()
    const onVisible = () => document.visibilityState === 'visible' && sync()
    prepareOffline()
    sync()
    window.addEventListener('online', sync)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.removeEventListener('online', sync)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])
}
