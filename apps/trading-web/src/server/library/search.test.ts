import { describe, expect, it } from 'vitest'
import { bookSearchText, bookFilterSchema, searchWords } from './validation'

describe('book search', () => {
  it('indexes original title, Vietnamese title and author without accents', () => {
    const text = bookSearchText({ title: 'The Intelligent Investor', title_vi: 'Nhà đầu tư thông minh', author: 'Benjamin Graham' })
    expect(text).toBe('the intelligent investor nha dau tu thong minh benjamin graham')
    for (const word of searchWords('Nhà ĐẦU tư  graham')) expect(text).toContain(word)
  })
  it('splits the query into accent-free words, capped at 8', () => {
    expect(searchWords('  Tâm lý học về tiền ')).toEqual(['tam', 'ly', 'hoc', 've', 'tien'])
    expect(searchWords(undefined)).toEqual([])
    expect(searchWords('%_')).toEqual([]) // ký tự LIKE bị loại khi bỏ dấu
    expect(searchWords('a b c d e f g h i j')).toHaveLength(8)
  })
  it('paginates with sane defaults and bounds', () => {
    expect(bookFilterSchema.parse({})).toMatchObject({ page: 1, page_size: 12 })
    expect(bookFilterSchema.parse({ page: '3', page_size: '20' })).toMatchObject({ page: 3, page_size: 20 })
    expect(bookFilterSchema.safeParse({ page: '0' }).success).toBe(false)
    expect(bookFilterSchema.safeParse({ page_size: '51' }).success).toBe(false)
  })
})
