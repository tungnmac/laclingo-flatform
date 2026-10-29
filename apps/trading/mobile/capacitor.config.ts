import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { CapacitorConfig } from '@capacitor/cli'

// App nạp thẳng trading web đã deploy (không đóng gói file tĩnh: web có nhiều route động).
// CAP_SERVER_URL đọc lúc `npx cap sync` — đổi URL thì sync lại rồi build lại app.
//   production: CAP_SERVER_URL=https://lactrader.onrender.com npx cap sync
//   thử trên máy dev: CAP_SERVER_URL=http://<IP LAN>:3001 npx cap sync (điện thoại cùng mạng Wi-Fi)
// Bắt buộc đặt — không mặc định localhost để bản phát hành không lỡ trỏ về máy dev.
const serverUrl = process.env.CAP_SERVER_URL
if (!serverUrl || !/^https?:\/\/[^/]+/.test(serverUrl)) {
  throw new Error('Thiếu CAP_SERVER_URL (vd https://lactrader.onrender.com) — xem apps/trading/mobile/README.md')
}
// Trang lỗi (www/index.html — server.errorPath) sinh từ error-page.html mỗi lần CLI nạp config (cap sync), kèm URL web
// để mở lại web ("Thử lại", tự mở lại khi có mạng). File sinh ra không commit (.gitignore)
const errorTemplate = readFileSync(join(__dirname, 'error-page.html'), 'utf8')
const errorHtml = errorTemplate.replace('window.TRADELAB_URL = "";', `window.TRADELAB_URL = ${JSON.stringify(serverUrl)};`)
if (errorHtml === errorTemplate) throw new Error('error-page.html thiếu dòng window.TRADELAB_URL = "";')
mkdirSync(join(__dirname, 'www'), { recursive: true })
writeFileSync(join(__dirname, 'www', 'index.html'), errorHtml)

const config: CapacitorConfig = {
  appId: 'lactrader.app',
  appName: 'TradeLab',
  // www/index.html (sinh từ error-page.html) chỉ hiện khi không nạp được web (mất mạng lúc mở app)
  webDir: 'www',
  server: {
    url: serverUrl,
    cleartext: serverUrl.startsWith('http://'),
    errorPath: 'index.html',
  },
  backgroundColor: '#f8fafc',
  plugins: {
    // @capacitor/app chỉ để đọc phiên bản app (kiểm tra cập nhật sau này). Nút Back do MainActivity xử lý (lùi trang
    // trong WebView, trang đầu → đưa app xuống nền) — tắt bộ xử lý của plugin (không có listener JS thì ở trang đầu nó
    // bỏ qua nút Back)
    App: {
      disableBackButtonHandler: true,
    },
  },
}

export default config
