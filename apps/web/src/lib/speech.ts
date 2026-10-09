import { speechLang } from '@/features/course/components/LanguageCard'

/** Nghĩa trong dữ liệu từ vựng luôn lưu bằng tiếng Việt, bất kể ngôn ngữ đang học. */
export const MEANING_LANGUAGE_ID = 'vi'

/**
 * Phát 1 câu bằng Web Speech API, chọn giọng theo voiceByLang — đúng cách
 * AudioButton đang chọn giọng (xem src/components/audio/AudioButton.tsx) để
 * autoplay dùng cùng giọng người dùng đã cấu hình trong Hồ sơ. Resolve khi
 * đọc xong hoặc lỗi (không throw) để chuỗi gọi tuần tự không bị chặn lại.
 */
export function speakText(
  text: string,
  languageId: string,
  voices: SpeechSynthesisVoice[],
  voiceByLang: Record<string, string>,
): Promise<void> {
  return new Promise((resolve) => {
    if (!text || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve()
      return
    }
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = speechLang(languageId)
    const chosen =
      voices.find((v) => v.voiceURI === voiceByLang[languageId]) ??
      voices.find((v) => v.lang.toLowerCase().startsWith(languageId.toLowerCase()))
    if (chosen) utterance.voice = chosen
    utterance.onend = () => resolve()
    utterance.onerror = () => resolve()
    window.speechSynthesis.speak(utterance)
  })
}
