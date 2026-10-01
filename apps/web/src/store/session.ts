import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types/api'

interface SessionState {
  user: User | null
  setUser: (user: User) => void
  logout: () => void
}

// TODO: thay bằng token thật khi backend có API đăng nhập
export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      logout: () => set({ user: null }),
    }),
    { name: 'laclingo-session' },
  ),
)
