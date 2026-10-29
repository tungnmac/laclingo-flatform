export type NavItem = { href: string; labelKey: string; icon: string; also?: string[]; children?: NavItem[] }

const LEARN_CHILDREN: NavItem[] = [
  { href: '/learn', labelKey: 'learnNav.roadmap', icon: '🧭' }, // gồm cả bài học /learn/<slug>
  { href: '/learn/books', labelKey: 'learnNav.books', icon: '📚' },
  { href: '/learn/plans', labelKey: 'learnNav.plans', icon: '🎯' },
  { href: '/learn/glossary', labelKey: 'learnNav.glossary', icon: '📖' },
  { href: '/learn/references', labelKey: 'learnNav.references', icon: '🔗' },
]

export const NAV_ITEMS: NavItem[] = [
  { href: '/markets', labelKey: 'nav.markets', icon: '📊', also: ['/vn-stocks'] }, // chi tiết cổ phiếu VN thuộc tab CK Việt Nam
  { href: '/portfolio', labelKey: 'nav.portfolio', icon: '💼' },
  { href: '/journal', labelKey: 'nav.journal', icon: '📝' },
  { href: '/companies', labelKey: 'nav.companies', icon: '🏢' },
  { href: '/learn', labelKey: 'nav.learn', icon: '🎓', children: LEARN_CHILDREN },
  { href: '/practice', labelKey: 'nav.practice', icon: '🕹️' },
  { href: '/contests', labelKey: 'nav.contests', icon: '🏆' },
  { href: '/orgs', labelKey: 'nav.orgs', icon: '👥', also: ['/join'] },
]

/** Nhóm Quản trị (chỉ admin) — mục cha mở trang quản trị đầu tiên */
export const ADMIN_GROUP: NavItem = {
  href: '/admin/learn',
  labelKey: 'nav.adminGroup',
  icon: '🛠️',
  children: [
    { href: '/admin/learn', labelKey: 'nav.admin', icon: '🎓' },
    { href: '/admin/companies', labelKey: 'nav.adminCompanies', icon: '🏭' },
    { href: '/admin/library', labelKey: 'nav.adminLibrary', icon: '📚' },
    { href: '/admin/references', labelKey: 'nav.adminReferences', icon: '🔗' },
    { href: '/admin/vn-data', labelKey: 'nav.adminVnData', icon: '🇻🇳' },
    { href: '/admin/subscriptions', labelKey: 'nav.adminSubscriptions', icon: '⭐' },
    { href: '/admin/contests', labelKey: 'nav.adminContests', icon: '🥇' },
    { href: '/admin/orgs', labelKey: 'nav.adminOrgs', icon: '🏫' },
  ],
}

export const navItems = (role: string): NavItem[] => (role === 'admin' ? [...NAV_ITEMS, ADMIN_GROUP] : NAV_ITEMS)

/** Độ dài đường dẫn khớp dài nhất (trùng hoặc trang con theo từng đoạn "/"); 0 = không khớp */
function score(pathname: string, item: NavItem): number {
  const own = [item.href, ...(item.also ?? [])].filter((h) => pathname === h || pathname.startsWith(`${h}/`)).map((h) => h.length)
  const kids = (item.children ?? []).map((c) => score(pathname, c))
  return Math.max(0, ...own, ...kids)
}

/** Khớp cụ thể nhất trong danh sách (vd /learn/books thắng /learn) */
function best(pathname: string, items: NavItem[]): NavItem | null {
  let hit: NavItem | null = null
  let top = 0
  for (const i of items) {
    const s = score(pathname, i)
    if (s > top) [hit, top] = [i, s]
  }
  return hit
}

/** Mục cấp 1 và mục con đang mở ứng với đường dẫn hiện tại */
export function activeTrail(pathname: string, items: NavItem[]): { top: string | null; sub: string | null } {
  const top = best(pathname, items)
  const sub = top?.children ? best(pathname, top.children) : null
  return { top: top?.href ?? null, sub: sub?.href ?? null }
}
