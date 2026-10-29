import { seedInstruments } from '../../../scripts/seed'
import { seedCompanies } from '../../../scripts/seed-companies'
import { seedLessons } from '../../../scripts/seed-lessons'
import { seedLibrary } from '../../../scripts/seed-library'
import { seedReferences } from '../../../scripts/seed-references'
import type { SEED_NAMES } from './tools'

/** Bộ dữ liệu mẫu — idempotent (chỉ thêm phần còn thiếu / cập nhật danh mục mã, không xoá chỉnh sửa của admin) */
export const SEEDS = {
  instruments: seedInstruments,
  lessons: seedLessons,
  companies: seedCompanies,
  library: seedLibrary,
  references: seedReferences,
} satisfies Record<(typeof SEED_NAMES)[number], () => Promise<string>>

export type SeedName = keyof typeof SEEDS

export const isSeedName = (v: unknown): v is SeedName => typeof v === 'string' && Object.hasOwn(SEEDS, v)
