# TradeLab app Android (Capacitor)

App native bọc trading web (`apps/trading/web`): mở thẳng web đã deploy (`server.url`). Không đóng gói file tĩnh vì
web có nhiều route động — cập nhật web là app đổi theo, chỉ build lại app khi đổi phần native (plugin, icon, quyền...).
Hiện chỉ có Android; iOS thêm sau (`npx cap add ios`).

- App ID: `lactrader.app` — applicationId Android (không đổi được sau khi lên Google Play)
- `capacitor.config.ts`: URL web lấy từ `CAP_SERVER_URL` (bắt buộc) lúc `npx cap sync`
- `error-page.html`: trang báo mất kết nối khi mở app không nạp được web — `cap sync` sinh `www/index.html` từ file này (kèm URL web, không commit)
- `assets/`: ảnh gốc icon + màn hình khởi động (`npm run assets` sinh lại cho Android)

Web production chạy gói free của Render: không có request ~15 phút thì ngủ, lần mở app sau chờ ~30–60 giây.

## Cần cài trên máy build

Android Studio (kèm Android SDK, JDK 21). Phát hành: tài khoản Google Play Console.

## Build

```bash
cd apps/trading/mobile
npm install
CAP_SERVER_URL=https://lactrader.onrender.com npx cap sync

cd android
./gradlew assembleDebug    # APK cài thử → app/build/outputs/apk/debug/app-debug.apk
./gradlew bundleRelease    # bản lên Google Play → app/build/outputs/bundle/release/app-release.aab
```

Thử với web chạy trên máy dev (`make trading-dev`, cổng 3001), điện thoại cùng Wi-Fi:
`CAP_SERVER_URL=http://<IP LAN>:3001 npx cap sync` (dùng `http` chỉ để thử, bản phát hành luôn `https`).

## Ký bản phát hành

`android/app/build.gradle` ký bản release bằng upload keystore khai báo trong `android/keystore.properties` (không
commit — có trong `.gitignore`), dùng keystore riêng, không dùng chung với app LacLingo:

```properties
storeFile=/đường/dẫn/tuyệt/đối/lactrader-upload.jks
storePassword=...
keyAlias=upload
keyPassword=...
```

Mất upload keystore là không gửi được bản cập nhật lên Google Play (phải nhờ Google đặt lại khoá) — backup file
`.jks` + mật khẩu ra nơi an toàn (trình quản lý mật khẩu).

## Phát hành bản mới

Tăng `versionName` (dạng `1.2.3`) và `versionCode` trong `android/app/build.gradle`.
