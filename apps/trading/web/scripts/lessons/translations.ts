import type { SeedChapter } from './types'

/**
 * Mã bản dịch cho bộ seed: bài thứ i của chương thứ j ở vi ↔ en là bản dịch của nhau, mã = slug tiếng Anh.
 * Trả Map slug → mã cho từng ngôn ngữ. Cấu trúc hai bộ lệch nhau → ném lỗi (seed sai, không ghép bừa).
 */
export function translationKeys(vi: SeedChapter[], en: SeedChapter[]): { vi: Map<string, string>; en: Map<string, string> } {
  if (vi.length !== en.length) throw new Error(`vi has ${vi.length} chapters, en has ${en.length}`)
  const keys = { vi: new Map<string, string>(), en: new Map<string, string>() }
  vi.forEach((c, j) => {
    if (c.lessons.length !== en[j].lessons.length) throw new Error(`chapter ${c.slug}: lesson count differs from ${en[j].slug}`)
    c.lessons.forEach((l, i) => {
      const key = en[j].lessons[i].slug
      keys.vi.set(l.slug, key)
      keys.en.set(key, key)
    })
  })
  return keys
}
