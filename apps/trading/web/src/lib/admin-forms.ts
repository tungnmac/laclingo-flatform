// Hàm thuần cho các form admin (client) — test được không cần DOM.

/** Chỉ các trường khác với giá trị đã tải — PATCH không ghi đè thay đổi từ nơi khác (vd nút Công bố trên cây) */
export function changedFields<T extends object>(loaded: T, current: T): Partial<T> {
  const out: Partial<T> = {}
  for (const key of Object.keys(current) as (keyof T)[]) {
    if (current[key] !== loaded[key]) out[key] = current[key]
  }
  return out
}

/** Chèn `snippet` tại vị trí con trỏ (vượt quá độ dài → chèn cuối) */
export function insertAt(text: string, at: number, snippet: string): string {
  const i = Math.min(Math.max(at, 0), text.length)
  return text.slice(0, i) + snippet + text.slice(i)
}

interface QuestionLike {
  prompt: string
  options: string[]
  correct_index: number
  explanation: string | null
}

const norm = (q: QuestionLike) => JSON.stringify([q.prompt, q.options, q.correct_index, q.explanation || null])

/** Danh sách câu hỏi đang soạn có khác bản đã lưu không ('' và null coi như nhau) */
export function questionsChanged(saved: QuestionLike[], current: QuestionLike[]): boolean {
  return saved.length !== current.length || saved.some((q, i) => norm(q) !== norm(current[i]))
}
