import { useSession } from '@/store/session'

// IndexedDB cho chế độ offline (theo từng tài khoản) — dùng chung cho ôn tập (features/srs-review/offline.ts) và
// apiFetch (lib/api.ts):
// - cards / reviewed / outbox: xem features/srs-review/offline.ts
// - responses: kết quả GET gần nhất của từng API — mất mạng thì apiFetch trả bản này (giao diện vẫn có dữ liệu cũ)

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

const responseKey = (userId: string, path: string) => `${userId}|${path}`
/** Mọi key của 1 tài khoản trong store responses / cards (key bắt đầu bằng `${userId}|`) */
const userRange = (userId: string) => IDBKeyRange.bound(`${userId}|`, `${userId}|\uffff`)

/** Bản lưu kèm thời điểm (dọn bản cũ nhất trước). Bản lưu cũ (trước khi có thời điểm) là dữ liệu trần */
interface CachedResponse {
  cachedAt: number
  data: unknown
}
const isWrapped = (v: unknown): v is CachedResponse => !!v && typeof v === 'object' && 'cachedAt' in v && 'data' in v
const unwrap = (v: unknown) => (isWrapped(v) ? v.data : v)

// Giữ tối đa MAX_RESPONSES bản mỗi tài khoản (mỗi path 1 bản — trang có phân trang / tìm kiếm sinh nhiều path)
const MAX_RESPONSES = 500
const TRIM_EVERY_MS = 5 * 60_000
let lastTrim = 0

/** Kết quả GET đã lưu của tài khoản đang dùng (undefined = chưa có / không đọc được) */
export async function getCachedResponse<T>(path: string): Promise<T | undefined> {
  const userId = currentUserId()
  if (!userId) return undefined
  const value = await run<unknown>(RESPONSES, 'readonly', (s) => s.get(responseKey(userId, path))).catch(() => undefined)
  return unwrap(value) as T | undefined
}

/**
 * Lưu kết quả GET mới nhất cho userId — tài khoản gửi request (lấy TRƯỚC khi gửi: đổi tài khoản giữa chừng không lưu
 * nhầm sang tài khoản khác). Lỗi thì bỏ qua — chỉ mất dữ liệu offline
 */
export async function putCachedResponse(userId: string, path: string, data: unknown): Promise<void> {
  const value: CachedResponse = { cachedAt: Date.now(), data }
  await run(RESPONSES, 'readwrite', (s) => s.put(value, responseKey(userId, path))).catch(() => {})
  if (Date.now() - lastTrim > TRIM_EVERY_MS) {
    lastTrim = Date.now()
    void trimResponses(userId).catch(() => {})
  }
}

/** Vượt MAX_RESPONSES bản → bỏ các bản lưu lâu nhất của tài khoản đó */
async function trimResponses(userId: string): Promise<void> {
  const count = await run<number>(RESPONSES, 'readonly', (s) => s.count(userRange(userId)))
  if (count <= MAX_RESPONSES) return
  const db = await openDB()
  const entries: { key: IDBValidKey; cachedAt: number }[] = []
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(RESPONSES, 'readonly')
    const req = tx.objectStore(RESPONSES).openCursor(userRange(userId))
    req.onsuccess = () => {
      const cursor = req.result
      if (!cursor) return
      entries.push({ key: cursor.key, cachedAt: isWrapped(cursor.value) ? cursor.value.cachedAt : 0 })
      cursor.continue()
    }
    tx.oncomplete = () => resolve()
    tx.onerror = tx.onabort = () => reject(tx.error)
  })
  entries.sort((a, b) => a.cachedAt - b.cachedAt)
  const drop = entries.slice(0, entries.length - MAX_RESPONSES)
  await new Promise<void>((resolve) => {
    const tx = db.transaction(RESPONSES, 'readwrite')
    const store = tx.objectStore(RESPONSES)
    for (const e of drop) store.delete(e.key)
    tx.oncomplete = tx.onerror = tx.onabort = () => resolve()
  })
}

/**
 * Đăng xuất / gỡ tài khoản: xoá dữ liệu đã lưu để dùng offline của tài khoản đó (kết quả API, bộ thẻ) — máy dùng chung
 * không để lại dữ liệu cá nhân. Giữ hàng đợi chưa gửi (outbox): đăng nhập lại thì tự đồng bộ tiếp
 */
export async function clearOfflineData(userIds: string[]): Promise<void> {
  const db = await openDB().catch(() => null)
  if (!db || userIds.length === 0) return
  await new Promise<void>((resolve) => {
    const tx = db.transaction([RESPONSES, CARDS], 'readwrite')
    for (const id of userIds) {
      tx.objectStore(RESPONSES).delete(userRange(id))
      tx.objectStore(CARDS).delete(userRange(id))
    }
    tx.oncomplete = tx.onerror = tx.onabort = () => resolve()
  })
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
  const wordsPrefix = responseKey(userId, '/vocab/words?')
  const deckListKey = responseKey(userId, `/decks?vocabulary_id=${encodeURIComponent(vocabularyId)}`)
  await new Promise<void>((resolve) => {
    const tx = db.transaction(RESPONSES, 'readwrite')
    const store = tx.objectStore(RESPONSES)
    store.delete(deckListKey)
    const req = store.openCursor(IDBKeyRange.bound(wordsPrefix, `${wordsPrefix}\uffff`))
    req.onsuccess = () => {
      const cursor = req.result
      if (!cursor) return
      const words = unwrap(cursor.value) as { vocabulary_id: string; in_review: boolean; deck_ids: string[] }[]
      if (Array.isArray(words) && words.some((w) => w.vocabulary_id === vocabularyId)) {
        const patched = words.map((w) =>
          w.vocabulary_id !== vocabularyId
            ? w
            : { ...w, in_review: true, deck_ids: deckId ? [...new Set([...w.deck_ids, deckId])] : w.deck_ids },
        )
        cursor.update(isWrapped(cursor.value) ? { ...cursor.value, data: patched } : patched)
      }
      cursor.continue()
    }
    tx.oncomplete = tx.onerror = tx.onabort = () => resolve()
  })
}
