import type { Locale } from './locales'
import { en } from './messages/en'
import { vi, type Messages } from './messages/vi'

export const messages: Record<Locale, Messages> = { vi, en }

export type TranslateParams = Record<string, string | number>

function lookup(dict: unknown, key: string): string | undefined {
  const value = key
    .split('.')
    .reduce<unknown>((node, k) => (node && typeof node === 'object' ? (node as Record<string, unknown>)[k] : undefined), dict)
  return typeof value === 'string' ? value : undefined
}

export function hasKey(key: string): boolean {
  return lookup(messages.vi, key) !== undefined
}

/** Tra key dạng "a.b.c"; thiếu ở locale → en → vi → trả lại key. Chèn {param}. */
export function translate(locale: Locale, key: string, params?: TranslateParams): string {
  const template = lookup(messages[locale], key) ?? lookup(messages.en, key) ?? lookup(messages.vi, key) ?? key
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (match, name: string) => (name in params ? String(params[name]) : match))
}
