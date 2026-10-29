import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface LayoutState {
  /** Sidebar desktop thu gọn — chỉ còn icon (rê chuột xem tên mục) */
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleSidebar: () => void
}

export const useLayout = create<LayoutState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
    }),
    { name: 'laclingo-layout' },
  ),
)
