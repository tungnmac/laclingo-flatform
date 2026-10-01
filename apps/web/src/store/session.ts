import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthResponse, User } from '@/types/api'

interface SessionState {
  token: string | null
  expiresAt: string | null
  user: User | null
  setSession: (auth: AuthResponse) => void
  setUser: (user: User) => void
  logout: () => void
}

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      token: null,
      expiresAt: null,
      user: null,
      setSession: (auth) => set({ token: auth.access_token, expiresAt: auth.expires_at, user: auth.user }),
      setUser: (user) => set({ user }),
      logout: () => set({ token: null, expiresAt: null, user: null }),
    }),
    { name: 'laclingo-session' },
  ),
)

/** Phiên còn hiệu lực: có token và chưa hết hạn */
export function isSessionValid(state: Pick<SessionState, 'token' | 'expiresAt'>) {
  return !!state.token && !!state.expiresAt && new Date(state.expiresAt).getTime() > Date.now()
}
