import type { SeedQuestion } from './types'

/**
 * Rải đáp án đúng đều các vị trí (câu thứ i → vị trí i % số đáp án), giữ nguyên thứ tự các đáp án còn lại.
 * Dữ liệu soạn tay hay để đáp án đúng ở vị trí B — không rải thì "luôn chọn B" vẫn qua được quiz.
 */
export function balanceAnswers(questions: SeedQuestion[]): SeedQuestion[] {
  return questions.map((q, i) => {
    const correct = q.options[q.correct_index]
    const others = q.options.filter((_, k) => k !== q.correct_index)
    const target = i % q.options.length
    return { ...q, options: [...others.slice(0, target), correct, ...others.slice(target)], correct_index: target }
  })
}
