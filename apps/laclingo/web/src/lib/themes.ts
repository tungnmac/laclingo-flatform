// Tông màu chủ đạo (theme) — người dùng chọn ở trang Cài đặt, lưu theo tài khoản (users.theme, backend UserThemes phải
// khớp danh sách id). Toàn giao diện dùng lớp indigo-* làm màu chủ đạo; tailwind.config.js trỏ thang indigo vào biến
// --brand-* nên đổi biến là đổi cả hệ thống. Giá trị mặc định (lac-gold) nằm sẵn trong globals.css.

export type ThemeId = 'lac-gold' | 'patina' | 'indigo' | 'cinnabar' | 'green' | 'cyan'

const SHADES = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'] as const
type Palette = Record<(typeof SHADES)[number], string>

export const DEFAULT_THEME: ThemeId = 'lac-gold'
export const THEME_STORAGE_KEY = 'laclingo-theme'

// 600 là màu nút (chữ trắng) và màu thanh trình duyệt
export const THEMES: { id: ThemeId; palette: Palette }[] = [
  {
    id: 'lac-gold', // vàng đồng chim Lạc — 500/600 đúng sắc trên thân chim
    palette: { 50: '#fcf8ed', 100: '#f8eed2', 200: '#f0dca3', 300: '#e9c35a', 400: '#d9ac3a', 500: '#c4952a', 600: '#b07d12', 700: '#8f6914', 800: '#6a4f13', 900: '#4e3a14', 950: '#2c2009' },
  },
  {
    id: 'patina', // xanh đồng — màu gỉ trống đồng (nền logo)
    palette: { 50: '#effaf9', 100: '#d2f0ee', 200: '#a7e0dc', 300: '#6fc8c3', 400: '#3fa9a5', 500: '#24898a', 600: '#1a6e70', 700: '#155a5c', 800: '#134a4c', 900: '#123e40', 950: '#0b2b2c' },
  },
  {
    id: 'indigo', // chàm — màu cũ của LacLingo (thang indigo của Tailwind)
    palette: { 50: '#eef2ff', 100: '#e0e7ff', 200: '#c7d2fe', 300: '#a5b4fc', 400: '#818cf8', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca', 800: '#3730a3', 900: '#312e81', 950: '#1e1b4b' },
  },
  {
    id: 'cinnabar', // đỏ son sơn mài
    palette: { 50: '#fdf3f2', 100: '#fbe4e2', 200: '#f7ccc8', 300: '#efa7a0', 400: '#e3766b', 500: '#d24e40', 600: '#b8362a', 700: '#9b2c22', 800: '#802820', 900: '#6b2620', 950: '#3a100c' },
  },
  {
    id: 'green', // xanh lá — dịch 1 bậc so với thang green của Tailwind để chữ trắng trên nút đủ tương phản
    palette: { 50: '#f0fdf4', 100: '#dcfce7', 200: '#bbf7d0', 300: '#86efac', 400: '#4ade80', 500: '#16a34a', 600: '#15803d', 700: '#166534', 800: '#14532d', 900: '#0f3f22', 950: '#052e16' },
  },
  {
    id: 'cyan', // xanh cyan — dịch 1 bậc như green
    palette: { 50: '#ecfeff', 100: '#cffafe', 200: '#a5f3fc', 300: '#67e8f9', 400: '#22d3ee', 500: '#0891b2', 600: '#0e7490', 700: '#155e75', 800: '#164e63', 900: '#123f50', 950: '#083344' },
  },
]

export function isThemeId(v: unknown): v is ThemeId {
  return THEMES.some((t) => t.id === v)
}

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(' ')

/** Biến CSS của 1 theme: { '--brand-50': '252 248 237', ... } */
function themeVars(id: ThemeId): Record<string, string> {
  const { palette } = THEMES.find((t) => t.id === id) ?? THEMES[0]
  return Object.fromEntries(SHADES.map((s) => [`--brand-${s}`, rgb(palette[s])]))
}

/** Áp theme lên trang (biến CSS + màu thanh trình duyệt) và nhớ trên máy cho lần mở sau (trước khi đăng nhập/nạp user) */
export function applyTheme(id: ThemeId) {
  const root = document.documentElement
  for (const [k, v] of Object.entries(themeVars(id))) root.style.setProperty(k, v)
  root.dataset.theme = id
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', (THEMES.find((t) => t.id === id) ?? THEMES[0]).palette[600])
  try {
    localStorage.setItem(THEME_STORAGE_KEY, id)
  } catch {
    // chế độ riêng tư / chặn lưu trữ — chỉ mất phần nhớ trên máy
  }
}

/** Script chạy trong <head> trước khi vẽ trang: áp theme đã nhớ trên máy, tránh nháy màu mặc định khi tải lại */
export const themeBootScript = `(function(){try{var v=${JSON.stringify(Object.fromEntries(THEMES.map((t) => [t.id, themeVars(t.id)])))};var id=localStorage.getItem('${THEME_STORAGE_KEY}');var m=v[id];if(!m)return;var s=document.documentElement.style;for(var k in m)s.setProperty(k,m[k]);document.documentElement.dataset.theme=id}catch(e){}})()`
