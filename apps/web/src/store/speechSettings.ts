import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SpeechSettingsState {
  /** Tốc độ đọc — 1 = bình thường, <1 chậm hơn, >1 nhanh hơn (Web Speech
   * utterance.rate / HTMLMediaElement.playbackRate đều dùng cùng thang 0.1-10,
   * ta giới hạn 0.5-2 cho hợp lý khi nghe). */
  speechRate: number
  setSpeechRate: (rate: number) => void
}

export const useSpeechSettings = create<SpeechSettingsState>()(
  persist(
    (set) => ({
      speechRate: 1,
      setSpeechRate: (rate) => set({ speechRate: Math.min(2, Math.max(0.5, rate)) }),
    }),
    { name: 'laclingo-speech-settings' },
  ),
)
