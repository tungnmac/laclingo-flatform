import { z } from 'zod'
import { ORG_ROLES } from './rules'

export const orgSlugSchema = z
  .string('INVALID_SLUG')
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'INVALID_SLUG')
  .max(80, 'INVALID_SLUG')

const proUntil = z.union([z.string(), z.number()], 'INVALID_INPUT').pipe(z.coerce.date('INVALID_INPUT')).nullable()

export const orgCreateSchema = z.object({
  name: z.string('TITLE_REQUIRED').trim().min(1, 'TITLE_REQUIRED').max(200, 'TEXT_TOO_LONG'),
  slug: orgSlugSchema,
  seat_limit: z.coerce.number().int().min(1, 'INVALID_SEATS').max(10_000, 'INVALID_SEATS'),
  pro_until: proUntil.default(null),
})
export const orgPatchSchema = z
  .object({
    name: z.string().trim().min(1, 'TITLE_REQUIRED').max(200, 'TEXT_TOO_LONG'),
    seat_limit: z.coerce.number().int().min(1, 'INVALID_SEATS').max(10_000, 'INVALID_SEATS'),
    pro_until: proUntil,
    regenerate_invite: z.literal(true),
  })
  .partial()

export const addMemberSchema = z.object({ email: z.string().trim().toLowerCase().email('INVALID_EMAIL'), role: z.enum(ORG_ROLES, 'INVALID_INPUT') })
export const curriculumSchema = z.object({ chapter_ids: z.array(z.string().uuid('INVALID_INPUT')).max(100) })
export const joinSchema = z.object({ code: z.string().trim().toUpperCase().min(4, 'INVALID_INVITE').max(32, 'INVALID_INVITE') })
export const memberPatchSchema = z.object({ role: z.enum(ORG_ROLES, 'INVALID_INPUT') })
