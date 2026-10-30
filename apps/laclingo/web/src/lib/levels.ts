// Thang trình độ theo ngôn ngữ — bản sao của service/level_scale.go ở backend (nguồn chuẩn; API trả level_scale trong
// /languages*, dùng bản này khi chưa có dữ liệu ngôn ngữ, vd trang admin). Mã lưu nguyên văn: ja → N5..N1 (JLPT),
// zh → HSK1..HSK6, ko → TOPIK1..TOPIK6, còn lại → CEFR A1..C2. Xếp từ thấp lên cao.

export const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

const LEVEL_SCALES: Record<string, string[]> = {
  ja: ['N5', 'N4', 'N3', 'N2', 'N1'],
  zh: ['HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6'],
  ko: ['TOPIK1', 'TOPIK2', 'TOPIK3', 'TOPIK4', 'TOPIK5', 'TOPIK6'],
}

/** Các mã trình độ của ngôn ngữ (thấp → cao); có level_scale từ API thì dùng luôn */
export function levelScale(languageId: string, fromApi?: string[]): string[] {
  if (fromApi && fromApi.length > 0) return fromApi
  return LEVEL_SCALES[languageId.split('-')[0].toLowerCase()] ?? CEFR_LEVELS
}

/** Thứ bậc chung 1..6 của 1 mã bất kỳ thang (0 = mã lạ) — tô màu huy hiệu trình độ */
export function levelRank(level: string): number {
  for (const scale of [CEFR_LEVELS, ...Object.values(LEVEL_SCALES)]) {
    const i = scale.indexOf(level)
    if (i >= 0) return i + 1
  }
  return 0
}

/** Mã cho ô chọn trình độ: thang của ngôn ngữ + mã đang lưu nếu nằm ngoài thang (dữ liệu cũ) — sửa bản ghi không bị
 * trình duyệt lặng lẽ đổi sang mã đầu tiên */
export function levelOptions(languageId: string, current?: string | null): string[] {
  const scale = levelScale(languageId)
  return current && !scale.includes(current) ? [...scale, current] : scale
}
