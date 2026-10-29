/** Trả file CSV tải về (tên file chỉ gồm ký tự an toàn) */
export function csvResponse(csv: string, filename: string): Response {
  const safe = filename.replace(/[^A-Za-z0-9._-]/g, '_')
  return new Response(csv, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="${safe}"`,
      'cache-control': 'no-store',
    },
  })
}
