import { describe, expect, it } from 'vitest'
import { appVersionFromUserAgent, compareVersions, updateNeed } from './app-version'

describe('app version', () => {
  it('reads the version the app appends to the WebView user agent', () => {
    expect(appVersionFromUserAgent('Mozilla/5.0 (Linux; Android 15) Chrome/141.0 Mobile Safari/537.36 TradeLabApp/1.2.3')).toBe('1.2.3')
    expect(appVersionFromUserAgent('Mozilla/5.0 (Macintosh) Chrome/141.0 Safari/537.36')).toBeNull()
  })

  it('compares numerically, not as text', () => {
    expect(compareVersions('1.10.0', '1.9.9')).toBeGreaterThan(0)
    expect(compareVersions('1.0.0', '1.0.0')).toBe(0)
    expect(compareVersions('0.9.0', '1.0.0')).toBeLessThan(0)
  })

  it('requires an update below the minimum and suggests one below the latest', () => {
    const s = { latest_version: '1.3.0', min_version: '1.1.0' }
    expect(updateNeed('1.0.5', s)).toBe('required')
    expect(updateNeed('1.2.0', s)).toBe('optional')
    expect(updateNeed('1.3.0', s)).toBe('none')
    expect(updateNeed(null, s)).toBe('none') // trình duyệt thường
    expect(updateNeed('1.0.0', { latest_version: null, min_version: null })).toBe('none')
  })
})
