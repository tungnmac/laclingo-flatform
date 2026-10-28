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

/** Kết quả GET đã lưu của tài khoản đang dùng (undefined = chưa có / không đọc được) */
export async function getCachedResponse<T>(path: string): Promise<T | undefined> {
  const userId = currentUserId()
  if (!userId) return undefined
  return run<T | undefined>(RESPONSES, 'readonly', (s) => s.get(responseKey(userId, path))).catch(() => undefined)
}

/** Lưu kết quả GET mới nhất (lỗi thì bỏ qua — chỉ mất dữ liệu offline) */
export async function putCachedResponse(path: string, data: unknown): Promise<void> {
  const userId = currentUserId()
  if (!userId) return
  await run(RESPONSES, 'readwrite', (s) => s.put(data, responseKey(userId, path))).catch(() => {})
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
