import { ApiError, apiFetch, type ApiInit } from '@/lib/api'
import { apiErrorText } from '@/lib/apiErrorText'
import { useLocale } from '@/store/locale'
import { useSession } from '@/store/session'

// IndexedDB cho chế độ offline (theo từng tài khoản) — dùng chung cho ôn tập (features/srs-review/offline.ts) và các
// API chỉ đọc cần xem được khi mất mạng (cachedGet):
// - cards / reviewed / outbox: xem features/srs-review/offline.ts
// - responses: kết quả GET gần nhất của các API dùng cachedGet

const DB_NAME = 'laclingo-srs-offline'
export const CARDS = 'cards'
export const REVIEWED = 'reviewed'
export const OUTBOX = 'outbox'
const RESPONSES = 'responses'

let dbPromise: Promise<IDBDatabase> | null = null

export function openDB(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 2)
      req.onupgradeneeded = (e) => {
        // v1: cards, reviewed, outbox — v2: responses
        if (e.oldVersion < 1) {
          req.result.createObjectStore(CARDS)
          req.result.createObjectStore(REVIEWED)
          req.result.createObjectStore(OUTBOX, { keyPath: 'id', autoIncrement: true })
        }
        if (e.oldVersion < 2) req.result.createObjectStore(RESPONSES)
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
export async function run<T>(store: string, mode: IDBTransactionMode, op: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDB()
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(store, mode)
    const req = op(tx.objectStore(store))
    tx.oncomplete = () => resolve(req.result)
    tx.onerror = tx.onabort = () => reject(tx.error)
  })
}

export function currentUserId(): string | undefined {
  return useSession.getState().user?.id
}

/** Lỗi do mất mạng (fetch không tới được server) — chỉ khi đó mới dùng dữ liệu offline */
export function isNetworkError(err: unknown): boolean {
  return err instanceof ApiError && err.status === 0
}

/** Lỗi "mất kết nối" như apiFetch báo khi không tới được server (cùng câu chữ theo ngôn ngữ đang chọn) */
export function networkError(): ApiError {
  return new ApiError(apiErrorText(0, undefined, useLocale.getState().locale), 0)
}

/**
 * GET dùng được khi offline: tải được thì lưu lại kết quả (theo tài khoản + path), mất mạng thì trả kết quả đã lưu
 * gần nhất; chưa từng lưu → ném lỗi mạng như apiFetch. Chỉ dùng cho API chỉ đọc mà màn hình offline cần.
 */
export async function cachedGet<T>(path: string, init?: ApiInit): Promise<T> {
  const userId = currentUserId()
  const key = `${userId}|${path}`
  try {
    const data = await apiFetch<T>(path, init)
    if (userId) void run(RESPONSES, 'readwrite', (s) => s.put(data, key)).catch(() => {})
    return data
  } catch (err) {
    if (!userId || !isNetworkError(err)) throw err
    const cached = await run<T | undefined>(RESPONSES, 'readonly', (s) => s.get(key)).catch(() => undefined)
    if (cached === undefined) throw err
    return cached
  }
}

/**
 * Sửa kết quả đã lưu sau khi từ vào ôn tập / vào 1 list (lúc online hoặc khi hàng đợi offline gửi xong) — lần offline
 * sau các trang học từ không hiện lại kết quả cũ: danh sách từ theo chủ đề đánh dấu in_review (+ list), danh sách
 * list kèm contains_vocabulary của từ đó thì bỏ (tải lại khi có mạng)
 */
export async function markLearnedInCache(vocabularyId: string, deckId?: string): Promise<void> {
  const userId = currentUserId()
  if (!userId) return
  const db = await openDB().catch(() => null)
  if (!db) return
  const wordsPrefix = `${userId}|/vocab/words?`
  const deckListKey = `${userId}|/decks?vocabulary_id=${encodeURIComponent(vocabularyId)}`
  await new Promise<void>((resolve) => {
    const tx = db.transaction(RESPONSES, 'readwrite')
    const store = tx.objectStore(RESPONSES)
    store.delete(deckListKey)
    const req = store.openCursor(IDBKeyRange.bound(wordsPrefix, `${wordsPrefix}\uffff`))
    req.onsuccess = () => {
      const cursor = req.result
      if (!cursor) return
      const words = cursor.value as { vocabulary_id: string; in_review: boolean; deck_ids: string[] }[]
      if (words.some((w) => w.vocabulary_id === vocabularyId)) {
        cursor.update(
          words.map((w) =>
            w.vocabulary_id !== vocabularyId
              ? w
              : { ...w, in_review: true, deck_ids: deckId ? [...new Set([...w.deck_ids, deckId])] : w.deck_ids },
          ),
        )
      }
      cursor.continue()
    }
    tx.oncomplete = tx.onerror = tx.onabort = () => resolve()
  })
}
