import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'LacLingo - Học Ngôn Ngữ Cùng Linh Vật Chim Lạc',
  description: 'Nền tảng học từ vựng ứng dụng thuật toán lặp lại ngắt quãng SRS tối ưu cho người Việt.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  )
}
