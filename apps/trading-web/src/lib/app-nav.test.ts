import { describe, expect, it } from 'vitest'
import { ADMIN_ITEMS, activeHref, navItems, NAV_ITEMS } from './app-nav'

describe('app nav', () => {
  it('shows admin items only to admins', () => {
    expect(navItems('user')).toEqual(NAV_ITEMS)
    expect(navItems('admin')).toEqual([...NAV_ITEMS, ...ADMIN_ITEMS])
  })
  it('marks the item owning the current path, including sub pages and aliases', () => {
    const all = navItems('admin')
    expect(activeHref('/markets', all)).toBe('/markets')
    expect(activeHref('/vn-stocks/FPT', all)).toBe('/markets')
    expect(activeHref('/learn/references/investors/warren-buffett', all)).toBe('/learn')
    expect(activeHref('/join/abc', all)).toBe('/orgs')
    expect(activeHref('/admin/learn/lessons/x', all)).toBe('/admin/learn')
    expect(activeHref('/pro', all)).toBeNull()
  })
  it('does not match a prefix that is only part of a segment', () => {
    expect(activeHref('/learning', navItems('user'))).toBeNull()
  })
  it('gives every item an icon', () => {
    for (const i of navItems('admin')) expect(i.icon.length, i.href).toBeGreaterThan(0)
  })
})
