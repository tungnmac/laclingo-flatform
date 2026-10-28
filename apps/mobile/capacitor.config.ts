import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { CapacitorConfig } from '@capacitor/cli'

// App nạp thẳng web LacLingo đã deploy (không đóng gói file tĩnh: web có nhiều route động).
// CAP_SERVER_URL đọc lúc `npx cap sync` — đổi URL thì sync lại rồi build lại app.
//   production: CAP_SERVER_URL=https://<domain web> npx cap sync
//   thử trên máy dev: CAP_SERVER_URL=http://<IP LAN>:3000 npx cap sync (điện thoại cùng mạng Wi-Fi)
// Bắt buộc đặt — không mặc định localhost để bản phát hành không lỡ trỏ về máy dev.
const serverUrl = process.env.CAP_SERVER_URL
if (!serverUrl || !/^https?:\/\/[^/]+/.test(serverUrl)) {
  throw new Error('Thiếu CAP_SERVER_URL (vd https://app.example.com) — xem apps/mobile/README.md')
}
// Trang lỗi (www/index.html) đọc URL này để mở lại web khi bấm "Thử lại" — ghi mỗi lần CLI nạp config (cap sync)
writeFileSync(join(__dirname, 'www', 'config.js'), `window.LACLINGO_URL = ${JSON.stringify(serverUrl)}\n`)

const config: CapacitorConfig = {
  appId: 'vn.laclingo.app',
  appName: 'LacLingo',
  // www/index.html chỉ hiện khi không nạp được web (mất mạng lúc mở app)
  webDir: 'www',
  server: {
    url: serverUrl,
    cleartext: serverUrl.startsWith('http://'),
    errorPath: 'index.html',
  },
  backgroundColor: '#f8fafc',
  // SwiftPM: tránh trùng package identity của plugin Firebase (theo hướng dẫn @capacitor-firebase/messaging)
  experimental: {
    ios: {
      spm: {
        packageOptions: {
          '@capacitor-firebase/messaging': { symlink: true },
        },
      },
    },
  },
  plugins: {
    FirebaseMessaging: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    // Mua trong app: chỉ hoàn tất / acknowledge giao dịch sau khi backend đã xác thực + giao hàng
    // @capacitor/app chỉ dùng để đọc phiên bản (kiểm tra cập nhật) — giữ nút Back Android như cũ (WebView lùi trang /
    // thoát app), không để plugin tự bắt nút Back
    App: {
      disableBackButtonHandler: true,
    },
    NativePurchases: {
      autoFinishTransactions: false,
    },
  },
}

export default config
