import { redirect } from 'next/navigation'

/** Danh sách cổ phiếu VN đã chuyển vào tab "CK Việt Nam" của trang Thị trường — giữ link cũ */
export default async function VnStocksRedirect({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams
  // trang cũ mặc định "tất cả sàn"; ?exchange=HOSE → nhóm HOSE (tab mới mặc định VN30)
  const p = new URLSearchParams({ tab: 'vn', group: typeof sp.exchange === 'string' ? sp.exchange : 'all' })
  for (const k of ['q', 'page']) if (typeof sp[k] === 'string') p.set(k, sp[k])
  redirect(`/markets?${p}`)
}
