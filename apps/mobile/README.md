# LacLingo app iOS/Android (Capacitor)

App native bọc web LacLingo: mở thẳng web đã deploy (`server.url`), thêm thông báo đẩy native qua
Firebase Cloud Messaging. Không đóng gói file tĩnh vì web có nhiều route động — cập nhật web là app đổi theo,
chỉ build lại app khi đổi phần native (plugin, icon, quyền...).

- App ID: `vn.laclingo.app` (không đổi được sau khi lên store)
- `capacitor.config.ts`: URL web lấy từ `CAP_SERVER_URL` (bắt buộc) lúc `npx cap sync`
- `www/index.html`: trang báo mất kết nối khi mở app không nạp được web
- `assets/`: ảnh gốc icon + màn hình khởi động (`npm run assets` sinh lại cho iOS/Android)

## Cần cài trên máy build

| | iOS | Android |
|---|---|---|
| Công cụ | Xcode (App Store) — iOS dùng Swift Package Manager, không cần CocoaPods | Android Studio (kèm Android SDK, JDK 21) |
| Tài khoản | Apple Developer Program (99 USD/năm) | Google Play Console (25 USD một lần) |

## Chạy thử

```bash
cd apps/mobile
npm install

# Máy dev: web chạy ở :3000, điện thoại cùng Wi-Fi → dùng IP LAN của máy (không dùng localhost)
CAP_SERVER_URL=http://192.168.1.10:3000 npx cap sync
npm run open:android   # hoặc npm run open:ios → bấm Run
```

Web phải gọi được API từ điện thoại: chạy web với `NEXT_PUBLIC_API_URL=http://<IP LAN>:8080/api/v1`.

Bản phát hành: `CAP_SERVER_URL=https://<domain web production> npx cap sync` rồi build bản release.
Chỉ dùng `https` cho bản phát hành (`http` chỉ để thử trên máy dev).

## Thông báo đẩy (Firebase Cloud Messaging)

Thiếu các file dưới đây app vẫn chạy, chỉ không nhận được thông báo đẩy.

1. Tạo project trên [Firebase Console](https://console.firebase.google.com).
2. **Android:** thêm app Android package `vn.laclingo.app` → tải `google-services.json` → đặt vào
   `android/app/google-services.json`.
3. **iOS:**
   - Thêm app iOS bundle `vn.laclingo.app` → tải `GoogleService-Info.plist` → kéo vào Xcode, nhóm `App/App`
     (tích "Copy items if needed", target App).
   - Apple Developer → Keys → tạo APNs Auth Key (.p8) → Firebase Console → Project settings → Cloud Messaging →
     tải key lên (kèm Key ID, Team ID).
   - Xcode → target App → Signing & Capabilities → thêm **Push Notifications** và **Background Modes**
     (tích Remote notifications — `Info.plist` đã khai báo sẵn).
4. **Backend:** Firebase Console → Project settings → Service accounts → Generate new private key → lưu file JSON
   ngoài repo, rồi đặt `FCM_SERVICE_ACCOUNT_FILE=<đường dẫn file>` trong `apps/backend/.env`.

`google-services.json`, `GoogleService-Info.plist` và file service account đều không commit (đã có trong
`.gitignore`); file service account là khoá bí mật — giữ kín.

Trong app: Hồ sơ → Nhắc học → **Bật thông báo**. Bấm thông báo sẽ mở đúng trang (vd `/review`).

## Lưu ý trước khi nộp store

- **Thanh toán:** gói Pro / gems là hàng hoá số — trong app phải dùng Apple In-App Purchase / Google Play Billing,
  không được dẫn sang VNPay/Stripe (bước tiếp theo của lộ trình).
- Apple có thể từ chối app "chỉ bọc trang web" (Guideline 4.2) — thông báo đẩy native là 1 tính năng giúp vượt qua.
- Chính sách quyền riêng tư: `<domain web>/privacy`; xoá tài khoản: Hồ sơ → Xoá tài khoản.
