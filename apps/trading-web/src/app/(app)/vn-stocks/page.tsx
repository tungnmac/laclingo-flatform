import { redirect } from 'next/navigation'

/** Danh sách cổ phiếu VN đã chuyển vào tab "CK Việt Nam" của trang Thị trường — giữ link cũ */
export default async function VnStocksRedirect({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const p = new URLSearchParams({ tab: 'vn' })
  for (const [k, v] of Object.entries(await searchParams)) if ((k === 'q' || k === 'exchange' || k === 'page') && typeof v === 'string') p.set(k, v)
  redirect(`/markets?${p}`)
}
