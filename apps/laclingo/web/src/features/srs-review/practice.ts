// Tiện ích cho bộ bài luyện tập khi ôn từ: tách mảnh câu, xáo trộn, so khớp đáp án.

/** Ký tự dấu câu bỏ khỏi mảnh ghép — học viên chỉ cần ghép đúng thứ tự từ */
const PUNCTUATION = /[.,!?;:"“”‘’()…。，！？；：、（）《》「」—]/g

// Ngôn ngữ giao diện viết bằng chữ Hán / kana / Hangul — nghĩa đã dịch luôn nhận ra qua chữ viết ở trên
const CJK_LOCALES = new Set(['zh', 'ja', 'ko'])

/**
 * Ngôn ngữ của nghĩa câu ví dụ (bài "ghép nghĩa câu"): nội dung đã dịch theo ngôn ngữ giao diện, chưa dịch thì vẫn là
 * tiếng Việt — đoán theo chữ viết để tách mảnh / đọc đúng giọng (kana → ja, Hán → zh, Hangul → ko); câu không có dấu
 * tiếng Việt khi giao diện là ngôn ngữ khác (en, fr... — mọi ngôn ngữ backend cấu hình) → ngôn ngữ giao diện, còn lại vi.
 */
export function meaningLanguage(text: string, uiLocale: string): string {
  if (/[\u3040-\u30ff]/.test(text)) return 'ja'
  if (/[\u4e00-\u9fff]/.test(text)) return uiLocale === 'ja' ? 'ja' : 'zh'
  if (/[\uac00-\ud7af]/.test(text)) return 'ko'
  const base = uiLocale.split('-')[0]
  if (base !== 'vi' && !CJK_LOCALES.has(base) && !/[ăâđêôơưàáạảãầấậẩẫằắặẳẵèéẹẻẽềếệểễìíịỉĩòóọỏõồốộổỗờớợởỡùúụủũừứựửữỳýỵỷỹ]/i.test(text)) return base
  return 'vi'
}

/**
 * Tách câu thành các mảnh để ghép. Tiếng Trung/Nhật không có dấu cách → dùng
 * Intl.Segmenter tách theo từ (fallback từng ký tự nếu trình duyệt chưa hỗ trợ);
 * các ngôn ngữ khác (kể cả nghĩa tiếng Việt) tách theo dấu cách.
 */
export function tokenize(text: string, languageId: string): string[] {
  const clean = text.replace(PUNCTUATION, ' ').trim()
  if (!clean) return []
  if (languageId === 'zh' || languageId === 'ja') {
    const Segmenter = (Intl as unknown as { Segmenter?: typeof Intl.Segmenter }).Segmenter
    if (Segmenter) {
      return Array.from(new Segmenter(languageId, { granularity: 'word' }).segment(clean))
        .filter((s) => s.isWordLike)
        .map((s) => s.segment)
    }
    return Array.from(clean.replace(/\s+/g, ''))
  }
  return clean.split(/\s+/)
}

/** Xáo trộn (Fisher–Yates); cố tránh trả về đúng thứ tự gốc khi có thể */
export function shuffle<T>(items: T[]): T[] {
  const out = [...items]
  for (let attempt = 0; attempt < 5; attempt++) {
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[out[i], out[j]] = [out[j], out[i]]
    }
    if (out.some((v, i) => v !== items[i])) break
  }
  return out
}

/** So khớp 2 dãy mảnh không phân biệt hoa thường — mảnh trùng nhau đổi chỗ vẫn đúng */
export function sameTokens(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((t, i) => t.toLowerCase() === b[i].toLowerCase())
}

/** Bỏ dấu thanh/khoảng trắng/dấu câu, chữ thường — dùng so pinyin & câu trả lời nghe-viết */
function normalizeAnswer(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(PUNCTUATION, '')
    .replace(/\s+/g, '')
    .toLowerCase()
}

/**
 * Đáp án nghe-viết đúng khi khớp từ (bỏ hoa thường/khoảng trắng thừa); với
 * tiếng Trung chấp nhận thêm pinyin không dấu thanh (vd "chi" cho 吃).
 */
export function isDictationCorrect(input: string, term: string, phonetic: string, languageId: string): boolean {
  const typed = input.trim().replace(/\s+/g, ' ').toLowerCase()
  if (!typed) return false
  if (typed === term.trim().replace(/\s+/g, ' ').toLowerCase()) return true
  if (languageId === 'zh' && phonetic) {
    return normalizeAnswer(typed).replace(/v/g, 'u') === normalizeAnswer(phonetic).replace(/v/g, 'u')
  }
  return false
}
