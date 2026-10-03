import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface VoiceSettingsState {
  /** languageId ('en', 'zh', ...) -> SpeechSynthesisVoice.voiceURI đã chọn */
  voiceByLang: Record<string, string>
  setVoice: (languageId: string, voiceURI: string) => void
}

/** Giọng đọc Web Speech phụ thuộc máy/trình duyệt — chỉ lưu local, không đồng bộ backend. */
export const useVoiceSettings = create<VoiceSettingsState>()(
  persist(
    (set) => ({
      voiceByLang: {},
      setVoice: (languageId, voiceURI) =>
        set((s) => ({ voiceByLang: { ...s.voiceByLang, [languageId]: voiceURI } })),
    }),
    { name: 'laclingo-voice-settings' },
  ),
)
