import { z } from 'zod'
import { COMPANY_MARKETS } from './types'

export const SYMBOL_RE = /^[A-Z0-9]+(-[A-Z0-9]+)?$/
export const COMPANY_LIMITS = { symbol: 20, summary: 2000, section: 20000 }

export const marketSchema = z.enum(COMPANY_MARKETS, 'INVALID_MARKET')
export const symbolSchema = z
  .string()
  .trim()
  .toUpperCase()
  .max(COMPANY_LIMITS.symbol, 'INVALID_SYMBOL')
  .regex(SYMBOL_RE, 'INVALID_SYMBOL')

export const companyCreateSchema = z.object({ market: marketSchema, symbol: symbolSchema })
export const companyPatchSchema = z.object({ active: z.boolean('INVALID_INPUT') })

const section = z.string('INVALID_INPUT').trim().max(COMPANY_LIMITS.section, 'TEXT_TOO_LONG')
export const analysisSchema = z.object({
  summary: z.string('INVALID_INPUT').trim().max(COMPANY_LIMITS.summary, 'TEXT_TOO_LONG'),
  business_md: section,
  strategy_md: section,
  strengths_md: section,
  risks_md: section,
  published: z.boolean('INVALID_INPUT'),
})
export type AnalysisInput = z.infer<typeof analysisSchema>
