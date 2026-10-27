'use client'

import { useRef, useState, type ReactNode } from 'react'
import type { SessionUser } from '@/server/auth/types'
import type { Plan } from '@/server/billing/plans'
import { AppHeader } from './AppHeader'
import { AppSidebar } from './AppSidebar'

/** Khung trang: header trên + sidebar menu trái + nội dung. Giữ trạng thái ngăn kéo menu (mobile) dùng chung cho cả hai. */
export function AppShell({ user, plan, children }: { user: SessionUser; plan: Plan; children: ReactNode }) {
  const [drawer, setDrawer] = useState(false)
  const menuButton = useRef<HTMLButtonElement>(null)
  return (
    <>
      <AppHeader user={user} plan={plan} menuOpen={drawer} onMenu={() => setDrawer(true)} menuButtonRef={menuButton} />
      <div className="lg:flex">
        <AppSidebar
          role={user.role}
          drawer={drawer}
          onClose={(returnFocus) => {
            setDrawer(false)
            if (returnFocus) menuButton.current?.focus() // trả focus về nút ☰
          }}
        />
        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">{children}</div>
        </main>
      </div>
    </>
  )
}
