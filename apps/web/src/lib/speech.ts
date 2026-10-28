import { speechLang } from '@/features/course/components/LanguageCard'
import { isNativeApp } from '@/lib/native'
import { NativeTextToSpeech, TTS_CATEGORY, TTS_QUEUE_FLUSH } from '@/lib/nativeSpeech'

/** Sự kiện window phát ra khi không đọc được — SpeechErrorToaster (dashboard layout) hiện thông báo kèm mã lỗi */
export const SPEECH_ERROR_EVENT = 'laclingo:speech-error'

// Lỗi do chính app huỷ (cancel() khi chuyển từ/bấm dừng) — không phải sự cố
const IGNORED_ERRORS = new Set(['interrupted', 'canceled'])
// Chrome: speak() ngay sau cancel() đôi khi bị nuốt mất, phát ra im lặng
const SPEAK_DELAY_MS = 50
// Bộ đọc không bắt đầu (và cũng không đang phát) sau khoảng này = coi như treo
const START_TIMEOUT_MS = 4000
// Đã bắt đầu mà không bao giờ kết thúc (lỗi Chrome với giọng mạng dừng ở ~15s):
// hết hạn thì bỏ qua câu đó để chuỗi đọc tự động không kẹt mãi
const MIN_END_TIMEOUT_MS = 10_000
const END_TIMEOUT_MS_PER_CHAR = 150

// Giữ tham chiếu utterance đang đọc — Chrome có lỗi dọn rác (GC) utterance giữa
// chừng, khiến onend/onerror không bao giờ được gọi.
const active = new Set<SpeechSynthesisUtterance>()

// Mỗi lần dừng/ngắt lời tăng thế hệ — lệnh đọc đang chờ (trong SPEAK_DELAY_MS)
// của thế hệ cũ sẽ không phát nữa, kể cả khi cancel() chạy lúc hàng đợi còn trống.
let generation = 0

function supported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

/** Đọc được không: trình duyệt có speechSynthesis, hoặc đang trong app iOS/Android (bộ đọc native) */
export function canSpeak() {
  return supported() || (typeof window !== 'undefined' && isNativeApp())
}

function reportSpeechError(code: string) {
  window.dispatchEvent(new CustomEvent<string>(SPEECH_ERROR_EVENT, { detail: code }))
}

/** Dừng mọi lời đang đọc và huỷ các lệnh đọc đang chờ phát */
export function stopSpeech() {
  generation++
  if (isNativeApp()) void NativeTextToSpeech.stop().catch(() => {})
  else if (supported()) window.speechSynthesis.cancel()
}

/**
 * Trong app iOS/Android: đọc bằng bộ đọc của hệ điều hành (Android WebView không có speechSynthesis). Giọng chọn ở
 * Hồ sơ là giọng của trình duyệt nên không áp dụng — dùng giọng mặc định của máy cho ngôn ngữ đó.
 */
async function speakNative(text: string, languageId: string, options: { rate?: number; interrupt?: boolean }) {
  // Ngắt lời: queueStrategy Flush đã thay lời đang đọc — không gọi stop() (lệnh stop tới sau có thể tắt luôn lời mới)
  if (options.interrupt) generation++
  const myGeneration = generation
  const lang = speechLang(languageId)
  try {
    await NativeTextToSpeech.speak({ text, lang, rate: options.rate ?? 1, category: TTS_CATEGORY, queueStrategy: TTS_QUEUE_FLUSH })
  } catch {
    if (generation !== myGeneration) return // bị dừng / ngắt lời — không phải lỗi
    const { supported: hasLang } = await NativeTextToSpeech.isLanguageSupported({ lang }).catch(() => ({ supported: true }))
    reportSpeechError(hasLang ? 'native-error' : 'language-unavailable')
  }
}

/**
 * Phát 1 câu bằng Web Speech API, chọn giọng theo voiceByLang (giọng người dùng
 * chọn ở Hồ sơ) rồi tới giọng đầu tiên khớp ngôn ngữ. interrupt = dừng lời đang
 * đọc trước (bấm nút nghe); bỏ trống khi đọc nối tiếp trong 1 chuỗi.
 * Đọc lỗi/treo với giọng đã chọn thì thử lại 1 lần bằng giọng mặc định của trình
 * duyệt, vẫn lỗi thì báo SPEECH_ERROR_EVENT. Resolve khi đọc xong, bị dừng hoặc
 * lỗi (không throw) để chuỗi gọi tuần tự không bị chặn lại.
 */
export function speakText(
  text: string,
  languageId: string,
  voices: SpeechSynthesisVoice[],
  voiceByLang: Record<string, string>,
  options: { rate?: number; interrupt?: boolean } = {},
): Promise<void> {
  if (text && isNativeApp()) return speakNative(text, languageId, options)
  return new Promise((resolve) => {
    if (!text || !supported()) {
      resolve()
      return
    }
    const synth = window.speechSynthesis
    if (options.interrupt) stopSpeech()
    if (synth.paused) synth.resume() // bị tạm dừng thì mọi lệnh đọc sau đều im lặng
    const myGeneration = generation
    const stale = () => generation !== myGeneration

    const preferred =
      voices.find((v) => v.voiceURI === voiceByLang[languageId]) ??
      voices.find((v) => v.lang.toLowerCase().startsWith(languageId.toLowerCase()))

    const attempt = (voice: SpeechSynthesisVoice | undefined, isRetry: boolean) => {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = speechLang(languageId)
      if (voice) utterance.voice = voice
      if (options.rate) utterance.rate = options.rate

      let started = false
      let settled = false
      let endGuard: number | undefined
      const settle = () => {
        settled = true
        window.clearTimeout(startGuard)
        window.clearTimeout(endGuard)
        active.delete(utterance)
      }
      // Thử lại bằng giọng mặc định chỉ khi có ích: đang ép 1 giọng cụ thể và
      // lỗi không phải do trình duyệt chặn (not-allowed thì thử lại cũng vậy)
      const canRetry = (code: string) => !isRetry && voice !== undefined && code !== 'not-allowed'
      const giveUp = (code: string) => {
        if (canRetry(code)) return attempt(undefined, true)
        reportSpeechError(code)
        resolve()
      }
      const markStarted = () => {
        started = true
        const maxMs = Math.max(MIN_END_TIMEOUT_MS, (text.length * END_TIMEOUT_MS_PER_CHAR) / (options.rate || 1))
        endGuard = window.setTimeout(() => {
          if (settled) return
          settle()
          resolve()
        }, maxMs)
      }

      utterance.onstart = () => {
        if (!started) markStarted()
      }
      utterance.onend = () => {
        if (settled) return
        settle()
        resolve()
      }
      utterance.onerror = (e) => {
        if (settled) return
        settle()
        if (IGNORED_ERRORS.has(e.error) || stale()) return resolve()
        giveUp(e.error)
      }
      const startGuard = window.setTimeout(() => {
        if (settled || started) return
        if (stale()) {
          settle()
          return resolve()
        }
        // Đang phát mà engine không báo onstart (1 số trình duyệt) — không phải treo
        if (synth.speaking && !synth.pending) return markStarted()
        settle()
        synth.cancel() // engine treo: gỡ lời đọc kẹt trong hàng đợi để nó không phát muộn bất ngờ
        giveUp('no-start')
      }, SPEAK_DELAY_MS + START_TIMEOUT_MS)

      active.add(utterance)
      window.setTimeout(() => {
        if (settled) return
        if (stale()) {
          settle()
          return resolve()
        }
        synth.speak(utterance)
      }, SPEAK_DELAY_MS)
    }

    attempt(preferred, false)
  })
}
