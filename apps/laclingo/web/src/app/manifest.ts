import type { MetadataRoute } from 'next'

// Web App Manifest — cài LacLingo lên màn hình chính (PWA) và làm nền cho bản app store (Capacitor)
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'LacLingo - Học Ngôn Ngữ Cùng Linh Vật Chim Lạc',
    short_name: 'LacLingo',
    description: 'Nền tảng học từ vựng ứng dụng thuật toán lặp lại ngắt quãng SRS tối ưu cho người Việt.',
    lang: 'vi',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#f8fafc',
    theme_color: '#b07d12',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
