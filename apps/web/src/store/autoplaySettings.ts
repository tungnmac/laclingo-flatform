import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AutoplaySettingsState {
  /** Số lần đọc (lặp) mỗi từ trước khi tự chuyển sang từ tiếp theo */
  repeatCount: number
  /** Số giây nghỉ giữa mỗi lần đọc */
  gapSeconds: number
  /** Shadowing — mỗi lần lặp đọc từ xong thì đọc luôn nghĩa trước khi nghỉ */
  shadowMode: boolean
  setRepeatCount: (n: number) => void
  setGapSeconds: (n: number) => void
  setShadowMode: (v: boolean) => void
}

export const useAutoplaySettings = create<AutoplaySettingsState>()(
  persist(
    (set) => ({
      repeatCount: 3,
      gapSeconds: 2,
      shadowMode: false,
      setRepeatCount: (n) => set({ repeatCount: Math.min(10, Math.max(1, Math.round(n) || 1)) }),
      setGapSeconds: (n) => set({ gapSeconds: Math.min(20, Math.max(1, Math.round(n) || 1)) }),
      setShadowMode: (shadowMode) => set({ shadowMode }),
    }),
    { name: 'laclingo-autoplay-settings' },
  ),
)
