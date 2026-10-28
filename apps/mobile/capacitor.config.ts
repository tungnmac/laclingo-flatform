import { existsSync, readFileSync, writeFileSync } from 'node:fs'
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

// iOS chỉ chạy service worker (ôn tập offline — web/public/sw.js) cho domain khai báo App-Bound Domains. Chỉ bản
// https: WKWebView cần https cho service worker, và khi Info.plist có WKAppBoundDomains thì Capacitor chỉ chạy trên
// domain đó (bản thử http://<IP LAN> sẽ không nạp được) → bản http bỏ khai báo. Ghi lại mỗi lần cap sync theo URL.
const appBound = serverUrl.startsWith('https://')
const infoPlist = join(__dirname, 'ios', 'App', 'App', 'Info.plist')
// Chưa có project iOS (máy chỉ build Android, đang `cap add ios`) → bỏ qua
if (existsSync(infoPlist)) {
  const plist = readFileSync(infoPlist, 'utf8')
  const withoutAppBound = plist.replace(/\s*<key>WKAppBoundDomains<\/key>\s*<array>[\s\S]*?<\/array>/, '')
  let nextPlist = withoutAppBound
  if (appBound) {
    const entry = `\t<key>WKAppBoundDomains</key>\n\t<array>\n\t\t<string>${new URL(serverUrl).hostname}</string>\n\t</array>\n`
    nextPlist = withoutAppBound.replace(/(\r?\n)<\/dict>(\s*<\/plist>\s*)$/, `$1${entry}</dict>$2`)
    // Không ghi được domain mà vẫn bật limitsNavigationsToAppBoundDomains → app iOS không nạp được web: dừng sync
    if (nextPlist === withoutAppBound) throw new Error(`Không ghi được WKAppBoundDomains vào ${infoPlist} — kiểm tra file`)
  }
  if (nextPlist !== plist) writeFileSync(infoPlist, nextPlist)
}

const config: CapacitorConfig = {
  appId: 'laclingo.app',
  appName: 'LacLingo',
  // www/index.html chỉ hiện khi không nạp được web (mất mạng lúc mở app)
  webDir: 'www',
  server: {
    url: serverUrl,
    cleartext: serverUrl.startsWith('http://'),
    errorPath: 'index.html',
  },
  backgroundColor: '#f8fafc',
  ios: {
    // Bắt buộc bật khi Info.plist có WKAppBoundDomains (xem trên) — không thì plugin native không chạy
    limitsNavigationsToAppBoundDomains: appBound,
  },
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
