import { registerPlugin, type PluginListenerHandle } from '@capacitor/core'

// Android WebView không có Web Speech API (speechSynthesis / SpeechRecognition) → trong app iOS/Android dùng plugin
// native cài ở apps/mobile (@capacitor-community/text-to-speech, @capacitor-community/speech-recognition), web gọi
// qua registerPlugin như iap.ts. Chỉ khai báo phần đang dùng.

interface TextToSpeechPlugin {
  speak(options: { text: string; lang?: string; rate?: number; category?: string; queueStrategy?: number }): Promise<void>
  stop(): Promise<void>
  isLanguageSupported(options: { lang: string }): Promise<{ supported: boolean }>
}

interface SpeechRecognitionPlugin {
  available(): Promise<{ available: boolean }>
  start(options: { language: string; maxResults?: number; partialResults?: boolean; popup?: boolean }): Promise<{ matches?: string[] }>
  stop(): Promise<void>
  checkPermissions(): Promise<{ speechRecognition: PermissionState }>
  requestPermissions(): Promise<{ speechRecognition: PermissionState }>
  addListener(eventName: 'partialResults', listener: (data: { matches: string[] }) => void): Promise<PluginListenerHandle>
  addListener(eventName: 'listeningState', listener: (data: { status: 'started' | 'stopped' }) => void): Promise<PluginListenerHandle>
  removeAllListeners(): Promise<void>
}

export const NativeTextToSpeech = registerPlugin<TextToSpeechPlugin>('TextToSpeech')
export const NativeSpeechRecognition = registerPlugin<SpeechRecognitionPlugin>('SpeechRecognition')

// QueueStrategy.Flush của plugin — lời mới thay lời đang đọc
export const TTS_QUEUE_FLUSH = 0
// iOS: 'playback' vẫn phát khi gạt công tắc im lặng (mặc định 'ambient' bị tắt tiếng)
export const TTS_CATEGORY = 'playback'

/** Xin quyền micro + nhận diện giọng nói (hỏi người dùng lần đầu). false = bị từ chối */
export async function ensureSpeechPermission(): Promise<boolean> {
  const { speechRecognition } = await NativeSpeechRecognition.checkPermissions()
  if (speechRecognition === 'granted') return true
  const res = await NativeSpeechRecognition.requestPermissions()
  return res.speechRecognition === 'granted'
}
