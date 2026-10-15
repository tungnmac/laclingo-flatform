import { describe, expect, it } from 'vitest'
import { resolveLocale } from './locales'

describe('resolveLocale', () => {
  it('prefers a valid cookie', () => expect(resolveLocale('en', 'vi-VN')).toBe('en'))
  it('ignores an unknown cookie and uses Accept-Language', () => expect(resolveLocale('fr', 'en-US,en;q=0.9')).toBe('en'))
  it('picks the first supported language by order', () => expect(resolveLocale(null, 'fr-FR,vi;q=0.8,en;q=0.5')).toBe('vi'))
  it('defaults to vi', () => expect(resolveLocale(undefined, 'ja-JP')).toBe('vi'))
})
