import { Capacitor } from '@capacitor/core'

/** Đang chạy trong app iOS/Android (Capacitor, apps/laclingo/mobile) — không phải trình duyệt */
export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform()
}

/** 'ios' | 'android' | 'web' */
export function nativePlatform(): string {
  return Capacitor.getPlatform()
}
