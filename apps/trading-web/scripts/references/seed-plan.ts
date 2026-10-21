export type SeedAction = 'insert' | 'update' | 'skip'

/** Bản ghi chưa có → thêm; có nhưng chưa ai sửa (updated_at = created_at) → cập nhật theo seed; admin đã sửa → bỏ qua */
export function seedAction(existing: { createdAt: Date; updatedAt: Date } | undefined): SeedAction {
  if (!existing) return 'insert'
  return existing.updatedAt.getTime() > existing.createdAt.getTime() ? 'skip' : 'update'
}
