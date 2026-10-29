import { describe, expect, it } from 'vitest'
import { activeTrail, ADMIN_GROUP, NAV_ITEMS, navItems } from './app-nav'

describe('app nav', () => {
  it('adds the admin group only for admins', () => {
    expect(navItems('user')).toEqual(NAV_ITEMS)
    expect(navItems('admin')).toEqual([...NAV_ITEMS, ADMIN_GROUP])
  })
  it('marks the top item owning the path, including aliases', () => {
    const all = navItems('admin')
    expect(activeTrail('/markets', all)).toEqual({ top: '/markets', sub: null })
    expect(activeTrail('/vn-stocks/FPT', all)).toEqual({ top: '/markets', sub: null })
    expect(activeTrail('/join/abc', all).top).toBe('/orgs')
    expect(activeTrail('/pro', all)).toEqual({ top: null, sub: null })
  })
  it('picks the most specific child: lessons belong to the roadmap, sub pages to their own item', () => {
    const all = navItems('user')
    expect(activeTrail('/learn', all)).toEqual({ top: '/learn', sub: '/learn' })
    expect(activeTrail('/learn/what-is-a-stock', all)).toEqual({ top: '/learn', sub: '/learn' })
    expect(activeTrail('/learn/references/investors/warren-buffett', all)).toEqual({ top: '/learn', sub: '/learn/references' })
    expect(activeTrail('/learn/plans/123', all)).toEqual({ top: '/learn', sub: '/learn/plans' })
  })
  it('activates the admin group through its children', () => {
    const all = navItems('admin')
    expect(activeTrail('/admin/references', all)).toEqual({ top: ADMIN_GROUP.href, sub: '/admin/references' })
    expect(activeTrail('/admin/learn/lessons/x', all)).toEqual({ top: ADMIN_GROUP.href, sub: '/admin/learn' })
    expect(activeTrail('/admin/references', navItems('user')).top).toBeNull()
  })
  it('does not match a prefix that is only part of a segment', () => {
    expect(activeTrail('/learning', navItems('user')).top).toBeNull()
  })
  it('gives every item and child an icon', () => {
    for (const i of navItems('admin')) for (const x of [i, ...(i.children ?? [])]) expect(x.icon.length, x.href).toBeGreaterThan(0)
  })
})
