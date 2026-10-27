export type NavItem = { href: string; labelKey: string; icon: string; also?: string[] }

export const NAV_ITEMS: NavItem[] = [
  { href: '/markets', labelKey: 'nav.markets', icon: '📊', also: ['/vn-stocks'] }, // chi tiết cổ phiếu VN thuộc tab CK Việt Nam
  { href: '/portfolio', labelKey: 'nav.portfolio', icon: '💼' },
  { href: '/journal', labelKey: 'nav.journal', icon: '📝' },
  { href: '/companies', labelKey: 'nav.companies', icon: '🏢' },
  { href: '/learn', labelKey: 'nav.learn', icon: '🎓' },
  { href: '/practice', labelKey: 'nav.practice', icon: '🕹️' },
  { href: '/contests', labelKey: 'nav.contests', icon: '🏆' },
  { href: '/orgs', labelKey: 'nav.orgs', icon: '👥', also: ['/join'] },
]
export const ADMIN_ITEMS: NavItem[] = [
  { href: '/admin/learn', labelKey: 'nav.admin', icon: '🛠️' },
  { href: '/admin/companies', labelKey: 'nav.adminCompanies', icon: '🏭' },
  { href: '/admin/library', labelKey: 'nav.adminLibrary', icon: '📚' },
  { href: '/admin/references', labelKey: 'nav.adminReferences', icon: '🔗' },
  { href: '/admin/vn-data', labelKey: 'nav.adminVnData', icon: '🇻🇳' },
  { href: '/admin/subscriptions', labelKey: 'nav.adminSubscriptions', icon: '⭐' },
  { href: '/admin/contests', labelKey: 'nav.adminContests', icon: '🥇' },
  { href: '/admin/orgs', labelKey: 'nav.adminOrgs', icon: '🏫' },
]

export const navItems = (role: string): NavItem[] => (role === 'admin' ? [...NAV_ITEMS, ...ADMIN_ITEMS] : NAV_ITEMS)

/** Mục đang mở: đường dẫn trùng hoặc là trang con (theo từng đoạn "/") của href / bí danh */
export function activeHref(pathname: string, items: NavItem[]): string | null {
  const hit = items.find((i) => [i.href, ...(i.also ?? [])].some((h) => pathname === h || pathname.startsWith(`${h}/`)))
  return hit?.href ?? null
}
