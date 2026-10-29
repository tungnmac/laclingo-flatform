import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { AppUpdateNotice } from '@/components/AppUpdateNotice'
import { I18nProvider } from '@/i18n/I18nProvider'
import { getLocale } from '@/i18n/server'
import './globals.css'

export const metadata: Metadata = {
  title: 'TradeLab',
  description: 'Học trading và giao dịch mô phỏng bằng tiền ảo · Learn trading with simulated money',
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale()
  return (
    <html lang={locale}>
      <body>
        <I18nProvider locale={locale}>
          <AppUpdateNotice />
          {children}
        </I18nProvider>
      </body>
    </html>
  )
}
