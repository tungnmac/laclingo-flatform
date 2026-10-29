import { registerPlugin, type PermissionState, type PluginListenerHandle } from '@capacitor/core'

// Android WebView không có Web Speech API (speechSynthesis / SpeechRecognition) → trong app iOS/Android dùng plugin
// native cài ở apps/laclingo/mobile (@capacitor-community/text-to-speech, @capgo/capacitor-speech-recognition — bản có Swift
// Package Manager cho iOS), web gọi qua registerPlugin như iap.ts. Chỉ khai báo phần đang dùng.

interface TextToSpeechPlugin {
  speak(options: { text: string; lang?: string; rate?: number; queueStrategy?: number }): Promise<void>
  stop(): Promise<void>
  isLanguageSupported(options: { lang: string }): Promise<{ supported: boolean }>
}

export type ListeningReason = 'userStart' | 'userStop' | 'forceStop' | 'results' | 'silence' | 'error' | 'unknown'

interface SpeechRecognitionPlugin {
  available(): Promise<{ available: boolean }>
  start(options: {
    language: string
    maxResults?: number
    partialResults?: boolean
    popup?: boolean
  }): Promise<{ matches?: string[] }>
  stop(): Promise<void>
  checkPermissions(): Promise<{ speechRecognition: PermissionState }>
  requestPermissions(): Promise<{ speechRecognition: PermissionState }>
  addListener(eventName: 'partialResults', listener: (data: { matches?: string[] }) => void): Promise<PluginListenerHandle>
  addListener(
    eventName: 'listeningState',
    listener: (data: { state?: string; status?: 'started' | 'stopped'; reason?: ListeningReason }) => void,
  ): Promise<PluginListenerHandle>
  addListener(eventName: 'error', listener: (data: { code: string; message: string }) => void): Promise<PluginListenerHandle>
  removeAllListeners(): Promise<void>
}

export const NativeTextToSpeech = registerPlugin<TextToSpeechPlugin>('TextToSpeech')
export const NativeSpeechRecognition = registerPlugin<SpeechRecognitionPlugin>('SpeechRecognition')

// QueueStrategy của plugin: Flush — lời mới thay lời đang đọc; Add — xếp hàng sau lời đang đọc
export const TTS_QUEUE_FLUSH = 0
export const TTS_QUEUE_ADD = 1

/** Xin quyền micro + nhận diện giọng nói (hỏi người dùng lần đầu). false = bị từ chối */
export async function ensureSpeechPermission(): Promise<boolean> {
  const { speechRecognition } = await NativeSpeechRecognition.checkPermissions()
  if (speechRecognition === 'granted') return true
  const res = await NativeSpeechRecognition.requestPermissions()
  return res.speechRecognition === 'granted'
}

/**
 * Lỗi nhận diện native → mã lỗi micError (dict speaking) dùng chung với Web Speech; null = không phải lỗi (chưa nói gì /
 * không khớp — người dùng thử lại). code: sự kiện 'error' của plugin (NO_MATCH, NETWORK, MICROPHONE_PERMISSION_DENIED…);
 * lời từ chối của start() chỉ có message.
 */
export function nativeSpeechError(code: string, message: string): string | null {
  // "stopped before final results" (iOS: bấm Dừng ngay sau khi bắt đầu), "already running" (phiên cũ đang dừng dở)
  if (code === 'NO_MATCH' || code === 'SPEECH_TIMEOUT' || /no match|no speech|speech timeout|cancel|stopped before|already running/i.test(message))
    return null
  if (code.includes('PERMISSION') || /denied|missing .*permission|insufficient permissions/i.test(message)) return 'app-not-allowed'
  if (code.startsWith('NETWORK') || code.startsWith('SERVER')) return 'network'
  if (code === 'AUDIO' || code.startsWith('AUDIO_')) return 'audio-capture'
  return message || code || 'start-failed'
}
