/** 99000 → "99.000 đ" (vi) · "99,000 ₫" (en) */
export const formatVnd = (n: number, locale: string) => (locale === 'vi' ? `${n.toLocaleString('vi-VN')} đ` : `${n.toLocaleString('en-US')} ₫`)
