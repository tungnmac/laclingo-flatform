import { z } from 'zod'
import { GRANT_MONTHS } from './plans'

export const grantSchema = z.object({
  email: z.string().trim().toLowerCase().email('INVALID_EMAIL').max(255, 'INVALID_EMAIL'),
  months: z.coerce.number().int().refine((m) => (GRANT_MONTHS as readonly number[]).includes(m), 'INVALID_INPUT'),
  note: z.string().trim().max(500).optional(),
})

export const subscriptionListSchema = z.object({ q: z.string().trim().max(255).optional() })
