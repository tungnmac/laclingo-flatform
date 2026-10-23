import { z } from 'zod'

// chỉ nhận chuỗi/số (z.coerce.date đổi null → 1970, true → epoch+1ms)
const date = z.union([z.string(), z.number()], 'INVALID_INPUT').pipe(z.coerce.date('INVALID_INPUT'))

const fields = {
  slug: z
    .string('INVALID_INPUT')
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'INVALID_SLUG')
    .max(80, 'INVALID_SLUG'),
  title_vi: z.string('TITLE_REQUIRED').trim().min(1, 'TITLE_REQUIRED').max(200, 'TEXT_TOO_LONG'),
  title_en: z.string('TITLE_REQUIRED').trim().min(1, 'TITLE_REQUIRED').max(200, 'TEXT_TOO_LONG'),
  description_vi: z.string().trim().max(4000, 'TEXT_TOO_LONG'),
  description_en: z.string().trim().max(4000, 'TEXT_TOO_LONG'),
  starts_at: date,
  ends_at: date,
  published: z.boolean(),
}

const periodOk = (c: { starts_at?: Date; ends_at?: Date }) => !c.starts_at || !c.ends_at || c.ends_at > c.starts_at

// default chỉ cho lúc TẠO — patch dùng fields không default (zod 4 giữ default trong .partial() → ghi đè mô tả / bỏ công bố)
export const contestSchema = z
  .object({ ...fields, description_vi: fields.description_vi.default(''), description_en: fields.description_en.default(''), published: fields.published.default(false) })
  .refine(periodOk, { message: 'INVALID_PERIOD', path: ['ends_at'] })
export const contestPatchSchema = z.object(fields).partial().refine(periodOk, { message: 'INVALID_PERIOD', path: ['ends_at'] })
