import { describe, expect, it } from 'vitest'
import {
  checkInvestor,
  investorFilterSchema,
  investorPatchSchema,
  investorSchema,
  investorSearchText,
  resourceFilterSchema,
  resourcePatchSchema,
  resourceSchema,
  resourceSearchText,
} from './validation'

const resource = {
  title: 'Financial Markets',
  provider: 'Yale / Coursera',
  url: 'https://www.coursera.org/learn/financial-markets-global',
  type: 'course',
  language: 'en',
  is_free: true,
  level: 'basic',
  topic: 'investing',
}

const investor = {
  slug: 'warren-buffett',
  name: 'Warren Buffett',
  country: 'US',
  birth_year: 1930,
  death_year: null,
  style: 'value',
  net_worth_usd: 140_000_000_000,
  net_worth_as_of: '2026-10-01',
  net_worth_source_url: 'https://www.forbes.com/profile/warren-buffett/',
  holdings: [{ name: 'Apple', kind: 'stock', percent: 22.5, note_vi: null, note_en: null }],
  milestones: [{ year: 1965, text_vi: 'Tiếp quản Berkshire', text_en: 'Takes over Berkshire' }],
  lessons_vi: ['Kiên nhẫn'],
  lessons_en: ['Be patient'],
}

const issue = (r: { success: boolean; error?: { issues: { message: string }[] } }) => r.error?.issues[0]?.message

describe('resourceSchema', () => {
  it('accepts a valid resource and applies defaults', () => {
    const r = resourceSchema.parse(resource)
    expect(r).toMatchObject({ description_vi: '', description_en: '', published: false, position: 0 })
  })
  it('requires https urls', () => {
    expect(issue(resourceSchema.safeParse({ ...resource, url: 'http://x.com' }))).toBe('INVALID_URL')
    expect(issue(resourceSchema.safeParse({ ...resource, url: '' }))).toBe('INVALID_URL')
  })
  it('rejects unknown type/language and long descriptions', () => {
    expect(resourceSchema.safeParse({ ...resource, type: 'tiktok' }).success).toBe(false)
    expect(resourceSchema.safeParse({ ...resource, language: 'fr' }).success).toBe(false)
    expect(issue(resourceSchema.safeParse({ ...resource, description_vi: 'a'.repeat(2001) }))).toBe('TEXT_TOO_LONG')
  })
  it('patch has no defaults', () => {
    expect(resourcePatchSchema.parse({ title: 'X' })).toEqual({ title: 'X' })
  })
  it('filter parses query strings', () => {
    expect(resourceFilterSchema.parse({ free: 'true', type: 'youtube' })).toEqual({ free: true, type: 'youtube' })
    expect(resourceFilterSchema.parse({ free: 'false' })).toEqual({ free: false })
    expect(resourceFilterSchema.safeParse({ level: 'pro' }).success).toBe(false)
  })
})

describe('investorSchema', () => {
  it('accepts a valid investor and uppercases nothing silently', () => {
    expect(investorSchema.parse(investor)).toMatchObject({ slug: 'warren-buffett', story_vi: '', published: false })
  })
  it('validates slug and country', () => {
    expect(issue(investorSchema.safeParse({ ...investor, slug: 'Warren Buffett' }))).toBe('INVALID_SLUG')
    expect(issue(investorSchema.safeParse({ ...investor, country: 'us' }))).toBe('INVALID_COUNTRY')
    expect(issue(investorSchema.safeParse({ ...investor, country: 'USA' }))).toBe('INVALID_COUNTRY')
  })
  it('requires as-of date and source when net worth is set', () => {
    expect(issue(investorSchema.safeParse({ ...investor, net_worth_as_of: null }))).toBe('NET_WORTH_SOURCE_REQUIRED')
    expect(issue(investorSchema.safeParse({ ...investor, net_worth_source_url: null }))).toBe('NET_WORTH_SOURCE_REQUIRED')
    expect(investorSchema.safeParse({ ...investor, net_worth_usd: null, net_worth_as_of: null, net_worth_source_url: null }).success).toBe(true)
  })
  it('rejects future as-of dates, negative worth and http sources', () => {
    expect(issue(investorSchema.safeParse({ ...investor, net_worth_as_of: '2999-01-01' }))).toBe('INVALID_DATE')
    expect(issue(investorSchema.safeParse({ ...investor, net_worth_as_of: '2026-13-01' }))).toBe('INVALID_DATE')
    expect(investorSchema.safeParse({ ...investor, net_worth_usd: -1 }).success).toBe(false)
    expect(issue(investorSchema.safeParse({ ...investor, net_worth_source_url: 'http://forbes.com' }))).toBe('INVALID_URL')
  })
  it('checks years', () => {
    expect(issue(investorSchema.safeParse({ ...investor, death_year: 1920 }))).toBe('INVALID_YEARS')
    expect(investorSchema.safeParse({ ...investor, birth_year: 1700 }).success).toBe(false)
    expect(investorSchema.safeParse({ ...investor, death_year: 3000 }).success).toBe(false)
  })
  it('bounds holdings and lists', () => {
    expect(investorSchema.safeParse({ ...investor, holdings: [{ ...investor.holdings[0], percent: 101 }] }).success).toBe(false)
    expect(investorSchema.safeParse({ ...investor, holdings: Array(31).fill(investor.holdings[0]) }).success).toBe(false)
    expect(investorSchema.safeParse({ ...investor, lessons_vi: Array(9).fill('x') }).success).toBe(false)
    expect(investorSchema.safeParse({ ...investor, milestones: Array(41).fill(investor.milestones[0]) }).success).toBe(false)
  })
  it('sorts milestones by year', () => {
    const r = investorSchema.parse({ ...investor, milestones: [{ year: 2000, text_vi: 'b', text_en: 'b' }, { year: 1950, text_vi: 'a', text_en: 'a' }] })
    expect(r.milestones.map((m) => m.year)).toEqual([1950, 2000])
  })
  it('patch has no defaults', () => {
    expect(investorPatchSchema.parse({ name: 'X' })).toEqual({ name: 'X' })
  })
  it('checkInvestor validates a merged row (for PATCH)', () => {
    expect(checkInvestor({ birth_year: 1930, death_year: null, net_worth_usd: 1, net_worth_as_of: null, net_worth_source_url: null })).toBe('NET_WORTH_SOURCE_REQUIRED')
    expect(checkInvestor({ birth_year: 1930, death_year: 1920, net_worth_usd: null, net_worth_as_of: null, net_worth_source_url: null })).toBe('INVALID_YEARS')
    expect(checkInvestor({ birth_year: null, death_year: 1976, net_worth_usd: null, net_worth_as_of: null, net_worth_source_url: null })).toBeNull()
  })
  it('filter parses query strings', () => {
    expect(investorFilterSchema.parse({ country: 'VN', status: 'alive', sort: 'net_worth' })).toEqual({ country: 'VN', status: 'alive', sort: 'net_worth' })
    expect(investorFilterSchema.safeParse({ sort: 'age' }).success).toBe(false)
  })
})

describe('search text', () => {
  it('folds accents', () => {
    expect(investorSearchText({ name: 'Phạm Nhật Vượng' })).toBe('pham nhat vuong')
    expect(resourceSearchText({ title: 'Đầu tư', provider: 'SSI' })).toBe('dau tu ssi')
  })
})
