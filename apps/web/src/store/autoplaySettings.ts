import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/** Đọc hết danh sách rồi: dừng (once) / lặp thêm tới đủ loopCount vòng (count) / lặp mãi (infinite) */
export type AutoplayLoopMode = 'once' | 'count' | 'infinite'

interface AutoplaySettingsState {
  /** Số lần đọc (lặp) mỗi từ trước khi tự chuyển sang từ tiếp theo */
  repeatCount: number
  /** Số giây nghỉ giữa mỗi lần đọc */
  gapSeconds: number
  /** Shadowing — mỗi lần lặp đọc từ xong thì đọc luôn nghĩa trước khi nghỉ; tắt thì chỉ đọc nghĩa 1 lần ở cuối */
  shadowMode: boolean
  loopMode: AutoplayLoopMode
  /** Tổng số vòng đọc cả danh sách khi loopMode = count */
  loopCount: number
  setRepeatCount: (n: number) => void
  setGapSeconds: (n: number) => void
  setShadowMode: (v: boolean) => void
  setLoopMode: (mode: AutoplayLoopMode) => void
  setLoopCount: (n: number) => void
}

/** Đã đọc xong `passesDone` vòng cả danh sách — có đọc tiếp vòng mới không */
export function shouldLoopAgain(mode: AutoplayLoopMode, loopCount: number, passesDone: number) {
  return mode === 'infinite' || (mode === 'count' && passesDone < loopCount)
}

export const useAutoplaySettings = create<AutoplaySettingsState>()(
  persist(
    (set) => ({
      repeatCount: 3,
      gapSeconds: 2,
      shadowMode: false,
      loopMode: 'once',
      loopCount: 2,
      setRepeatCount: (n) => set({ repeatCount: Math.min(10, Math.max(1, Math.round(n) || 1)) }),
      setGapSeconds: (n) => set({ gapSeconds: Math.min(20, Math.max(1, Math.round(n) || 1)) }),
      setShadowMode: (shadowMode) => set({ shadowMode }),
      setLoopMode: (loopMode) => set({ loopMode }),
      setLoopCount: (n) => set({ loopCount: Math.min(20, Math.max(2, Math.round(n) || 2)) }),
    }),
    { name: 'laclingo-autoplay-settings' },
  ),
)
