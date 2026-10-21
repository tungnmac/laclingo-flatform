import { describe, expect, it } from 'vitest'
import { investorSchema, resourceSchema } from '../../src/server/references/validation'
import { INVESTORS } from './investors'
import { RESOURCES } from './resources'

describe('investors seed', () => {
  it('has ~20 investors with unique slugs from at least 6 countries', () => {
    expect(INVESTORS.length).toBeGreaterThanOrEqual(18)
    expect(new Set(INVESTORS.map((x) => x.slug)).size).toBe(INVESTORS.length)
    expect(new Set(INVESTORS.map((x) => x.country)).size).toBeGreaterThanOrEqual(6)
  })
  it('passes the admin validation', () => {
    for (const x of INVESTORS) {
      const r = investorSchema.safeParse(x)
      expect(r.success, `${x.slug}: ${r.error?.issues.map((i) => `${i.path.join('.')} ${i.message}`).join(', ')}`).toBe(true)
    }
  })
  it('gives net worth only to living investors, always with date + source', () => {
    for (const x of INVESTORS) {
      if (x.death_year !== null) expect(x.net_worth_usd, x.slug).toBeNull()
      if (x.net_worth_usd !== null) {
        expect(x.net_worth_as_of, x.slug).toMatch(/^\d{4}-\d{2}-\d{2}$/)
        expect(x.net_worth_source_url, x.slug).toMatch(/^https:\/\//)
      }
    }
    expect(INVESTORS.some((x) => x.death_year !== null)).toBe(true)
  })
  it('has complete bilingual content', () => {
    for (const x of INVESTORS) {
      for (const s of [x.story_vi, x.story_en, x.role_vi, x.role_en]) expect(s.trim().length, x.slug).toBeGreaterThan(0)
      expect(x.milestones.length, x.slug).toBeGreaterThanOrEqual(3)
      expect(x.lessons_vi.length, x.slug).toBe(x.lessons_en.length)
      expect(x.lessons_vi.length, x.slug).toBeGreaterThanOrEqual(3)
      expect(x.holdings.length, x.slug).toBeGreaterThan(0)
    }
  })
})

describe('resources seed', () => {
  it('has ~25 resources with unique urls and titles, several in Vietnamese', () => {
    expect(RESOURCES.length).toBeGreaterThanOrEqual(22)
    expect(new Set(RESOURCES.map((r) => r.url)).size).toBe(RESOURCES.length)
    expect(new Set(RESOURCES.map((r) => r.title.trim().toLowerCase())).size).toBe(RESOURCES.length)
    expect(RESOURCES.filter((r) => r.language === 'vi').length).toBeGreaterThanOrEqual(5)
    expect(new Set(RESOURCES.map((r) => r.type)).size).toBe(5)
  })
  it('passes the admin validation with descriptions in both languages', () => {
    for (const r of RESOURCES) {
      const p = resourceSchema.safeParse(r)
      expect(p.success, `${r.title}: ${p.error?.issues.map((i) => `${i.path.join('.')} ${i.message}`).join(', ')}`).toBe(true)
      expect(r.description_vi.trim().length, r.title).toBeGreaterThan(0)
      expect(r.description_en.trim().length, r.title).toBeGreaterThan(0)
    }
  })
})
