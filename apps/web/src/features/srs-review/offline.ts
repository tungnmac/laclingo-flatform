'use client'

import { useEffect } from 'react'
import { ApiError } from '@/lib/api'
import { useSession } from '@/store/session'
import type { DueVocabulary } from '@/types/api'
import { srsService } from './srs.service'

// Ôn tập offline (IndexedDB, theo từng tài khoản):
// - cards: bộ thẻ tải lần gần nhất của mỗi phiên ôn (ngôn ngữ / list) → mất mạng vẫn mở lại được
// - reviewed: lúc ôn gần nhất của từng từ → mở lại bộ thẻ cũ không hiện lại từ đã ôn sau lúc tải
// - outbox: kết quả ôn lúc mất mạng, gửi lần lượt khi có mạng lại (kèm lúc ôn thật + client_review_id — server bỏ
//   qua kết quả đã lưu)

const DB_NAME = 'laclingo-srs-offline'
const CARDS = 'cards'
const REVIEWED = 'reviewed'
const OUTBOX = 'outbox'

interface CachedCards {
  savedAt: number
  cards: DueVocabulary[]
}

export type QueuedReview = { vocabulary_id: string; reviewed_at: string; client_review_id: string } & (
  | { kind: 'review'; quality: number }
  | { kind: 'practice'; mistakes: number }
)

type OutboxRow = QueuedReview & { id?: number; user_id: string }

let dbPromise: Promise<IDBDatabase> | null = null

function openDB(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1)
      req.onupgradeneeded = () => {
        req.result.createObjectStore(CARDS)
        req.result.createObjectStore(REVIEWED)
        req.result.createObjectStore(OUTBOX, { keyPath: 'id', autoIncrement: true })
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    }).catch((err) => {
      dbPromise = null // trình duyệt chặn IndexedDB (ẩn danh...) → lần sau thử lại, nơi gọi tự bỏ qua
      throw err
    })
  }
  return dbPromise
}

/** Chạy 1 thao tác trên 1 store, xong khi transaction commit */
async function run<T>(store: string, mode: IDBTransactionMode, op: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDB()
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(store, mode)
    const req = op(tx.objectStore(store))
    tx.oncomplete = () => resolve(req.result)
    tx.onerror = tx.onabort = () => reject(tx.error)
  })
}

function currentUserId(): string | undefined {
  return useSession.getState().user?.id
}

/** uuid v4 — crypto.randomUUID chỉ có ở https/localhost, app thử trên máy dev chạy http://<IP LAN> */
export function newClientReviewId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  const b = crypto.getRandomValues(new Uint8Array(16))
  b[6] = (b[6] & 0x0f) | 0x40
  b[8] = (b[8] & 0x3f) | 0x80
  const hex = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

/** Lỗi do mất mạng (fetch không tới được server) — chỉ khi đó mới dùng dữ liệu offline */
export function isNetworkError(err: unknown): boolean {
  return err instanceof ApiError && err.status === 0
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

/** Đưa kết quả ôn lúc mất mạng vào hàng đợi. Lỗi (không có IndexedDB) → ném ra để nơi gọi báo lỗi như cũ */
export async function enqueueReview(item: QueuedReview): Promise<void> {
  const userId = currentUserId()
  if (!userId) throw new Error('no session')
  const row: OutboxRow = { ...item, user_id: userId }
  await run(OUTBOX, 'readwrite', (s) => s.add(row))
  await markReviewed(item.vocabulary_id, item.reviewed_at)
}

/** Từ đang chờ đồng bộ của tài khoản hiện tại — server chưa biết nên vẫn trả về là đến hạn */
export async function pendingVocabularyIds(): Promise<Set<string>> {
  const userId = currentUserId()
  const rows = await run<OutboxRow[]>(OUTBOX, 'readonly', (s) => s.getAll()).catch(() => [] as OutboxRow[])
  return new Set(rows.filter((r) => r.user_id === userId).map((r) => r.vocabulary_id))
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
    const sent = { vocabulary_id: row.vocabulary_id, reviewed_at: row.reviewed_at, client_review_id: row.client_review_id }
    // Chạy ngầm: hết lượt ôn của gói không tự mở màn nâng cấp Pro
    const init = { paywall: false } as const
    try {
      if (row.kind === 'practice') await srsService.practice({ ...sent, mistakes: row.mistakes }, init)
      else await srsService.review({ ...sent, quality: row.quality }, init)
    } catch (err) {
      const status = err instanceof ApiError ? err.status : 0
      // Mất mạng / hết phiên / hết lượt ôn của gói / bị giới hạn tần suất → giữ nguyên, dừng, lần sau gửi tiếp
      if (status === 0 || status === 401 || status === 402 || status === 429) return
      // Server lỗi với riêng kết quả này → giữ lại, gửi các kết quả sau (không chặn cả hàng đợi)
      if (status >= 500) continue
      // 4xx khác: server không bao giờ nhận (từ đã bị xoá, ôn quá 30 ngày trước...) → bỏ khỏi hàng đợi
    }
    await run(OUTBOX, 'readwrite', (s) => s.delete(row.id!)).catch(() => {})
  }
}

/** Trang ôn tập dùng được khi offline — khớp OFFLINE_PAGES trong public/sw.js */
export const OFFLINE_REVIEW_PATH = '/review/vocabulary'

/**
 * Chuẩn bị ôn offline khi đang có mạng: nhờ service worker lưu trang ôn tập (kèm JS/CSS) và tải sẵn bộ thẻ đến hạn
 * của trang ôn mặc định (mọi ngôn ngữ) — người dùng chưa mở trang ôn tập lần nào vẫn ôn offline được
 */
function prepareOffline() {
  navigator.serviceWorker?.ready
    .then((reg) => reg.active?.postMessage({ type: 'cache-offline-pages', urls: [OFFLINE_REVIEW_PATH] }))
    .catch(() => {})
  const pendingIds = pendingVocabularyIds()
  srsService
    .getDue(20)
    .then(async (data) => {
      const pending = await pendingIds
      await saveCards(data.filter((c) => !pending.has(c.vocabulary_id)))
    })
    .catch(() => {})
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
