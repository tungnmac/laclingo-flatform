import { Capacitor, registerPlugin } from '@capacitor/core'

// Màn khởi động của app native (@capacitor/splash-screen, cài ở apps/laclingo/mobile) — giữ logo tới khi web vẽ xong
const SplashScreen = registerPlugin<{ hide: (opts?: { fadeOutDuration?: number }) => Promise<void> }>('SplashScreen')

/** Ẩn màn khởi động khi web đã sẵn sàng. App bản cũ chưa có plugin → bỏ qua */
export function hideNativeSplash() {
  if (!Capacitor.isNativePlatform()) return
  SplashScreen.hide().catch(() => {})
}
