import type { Metadata, Viewport } from 'next'
import { LocaleSync } from '@/components/layout/LocaleSync'
import { ThemeSync } from '@/components/layout/ThemeSync'
import { NativeAppBridge } from '@/components/pwa/NativeAppBridge'
import { AppUpdateGate } from '@/features/app-version/AppUpdateGate'
import { ServiceWorkerRegister } from '@/components/pwa/ServiceWorkerRegister'
import { themeBootScript } from '@/lib/themes'
import './globals.css'

export const metadata: Metadata = {
  title: 'LacLingo - Học Ngôn Ngữ Cùng Linh Vật Chim Lạc',
  description: 'Nền tảng học từ vựng ứng dụng thuật toán lặp lại ngắt quãng SRS tối ưu cho người Việt.',
  applicationName: 'LacLingo',
  appleWebApp: { capable: true, title: 'LacLingo', statusBarStyle: 'default' },
  icons: { apple: '/apple-touch-icon.png' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#b07d12',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        {/* Áp tông màu đã chọn trước khi vẽ trang (style trên <html> khác bản server → suppressHydrationWarning) */}
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
        <ServiceWorkerRegister />
        <NativeAppBridge />
        <LocaleSync />
        <ThemeSync />
        <AppUpdateGate />
      </body>
    </html>
  )
}
