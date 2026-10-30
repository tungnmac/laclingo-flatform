import { Capacitor, registerPlugin } from '@capacitor/core'

// Màn chờ khởi động của app Android (giới thiệu app + vòng tải — mobile/android/.../LaunchOverlay.java), phủ lên WebView
// tới khi web vẽ xong
const LaunchOverlay = registerPlugin<{ hide: () => Promise<void> }>('LaunchOverlay')

/** Ẩn màn chờ khởi động khi web đã sẵn sàng. App bản cũ / iOS chưa có plugin → bỏ qua */
export function hideNativeSplash() {
  if (!Capacitor.isNativePlatform()) return
  LaunchOverlay.hide().catch(() => {})
}
