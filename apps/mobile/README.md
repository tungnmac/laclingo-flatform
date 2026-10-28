# LacLingo app iOS/Android (Capacitor)

App native bọc web LacLingo: mở thẳng web đã deploy (`server.url`), thêm thông báo đẩy native qua
Firebase Cloud Messaging. Không đóng gói file tĩnh vì web có nhiều route động — cập nhật web là app đổi theo,
chỉ build lại app khi đổi phần native (plugin, icon, quyền...).

- App ID: `laclingo.app` — Android (applicationId) và iOS (bundle ID) dùng chung (không đổi được sau khi lên store)
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

## Ký bản phát hành Android

`android/app/build.gradle` ký bản release bằng upload keystore khai báo trong `android/keystore.properties` (không
commit — có trong `.gitignore`):

```properties
storeFile=/đường/dẫn/tuyệt/đối/laclingo-upload.jks
storePassword=...
keyAlias=upload
keyPassword=...
```

Mất upload keystore là không gửi được bản cập nhật lên Google Play (phải nhờ Google đặt lại khoá) — backup file
`.jks` + mật khẩu ra nơi an toàn (trình quản lý mật khẩu). Build: `cd android && ./gradlew bundleRelease` →
`app/build/outputs/bundle/release/app-release.aab`.

## Ôn tập offline

Service worker của web (`apps/web/public/sw.js`) lưu sẵn trang ôn tập, dữ liệu thẻ nằm trong IndexedDB — mất mạng vẫn
mở app và ôn được, kết quả tự đồng bộ khi có mạng lại.

- **Android:** chạy sẵn (Capacitor chuyển request của service worker qua WebView).
- **iOS:** WKWebView chỉ chạy service worker cho domain khai báo **App-Bound Domains**. `capacitor.config.ts` tự ghi
  domain của `CAP_SERVER_URL` vào `WKAppBoundDomains` trong `Info.plist` và bật `limitsNavigationsToAppBoundDomains`
  mỗi lần `cap sync` với URL `https`. URL `http` (thử trên máy dev) thì bỏ khai báo đó → bản dev không có offline.
  Commit `Info.plist` sau khi sync bản phát hành.

## Thông báo đẩy (Firebase Cloud Messaging)

Thiếu các file dưới đây app vẫn chạy, chỉ không nhận được thông báo đẩy.

1. Tạo project trên [Firebase Console](https://console.firebase.google.com).
2. **Android:** thêm app Android package `laclingo.app` → tải `google-services.json` → đặt vào
   `android/app/google-services.json`.
3. **iOS:**
   - Thêm app iOS bundle `laclingo.app` → tải `GoogleService-Info.plist` → kéo vào Xcode, nhóm `App/App`
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

## Mua trong app (Apple In-App Purchase, Google Play Billing)

Trong app chỉ bán qua store (plugin `@capgo/native-purchases`); VNPay/Stripe chỉ có trên web. Backend tự xác thực
giao dịch (Apple: chữ ký JWS của StoreKit 2; Google: Play Developer API), giao hàng 1 lần / giao dịch, rồi theo dõi
gia hạn / huỷ / hoàn tiền qua thông báo của store. Store nào chưa cấu hình ở backend thì app hiện "Chưa hỗ trợ mua
trong ứng dụng".

**Mã sản phẩm — khai báo giống hệt ở cả 2 store** (đổi giá trên store, không cần sửa code):

| Món | Mã sản phẩm | App Store | Google Play |
|---|---|---|---|
| Pro 1 tháng | `laclingo.pro.monthly` | Auto-Renewable Subscription (chung 1 subscription group với gói năm) | Subscription, base plan `monthly` (tự gia hạn) |
| Pro 1 năm | `laclingo.pro.yearly` | Auto-Renewable Subscription (cùng group) | Subscription, base plan `yearly` (tự gia hạn) |
| Pro trọn đời | `laclingo.pro.lifetime` | Non-Consumable | One-time product |
| 100 / 550 / 1200 gems | `laclingo.gems.100` / `.550` / `.1200` | Consumable | One-time product |

**Apple (App Store Connect):**
1. Agreements, Tax, and Banking → ký Paid Apps Agreement (chưa ký thì không bán được).
2. Tạo các sản phẩm ở bảng trên (kèm giá, tên hiển thị, ảnh chụp màn hình cho người duyệt).
3. App Information → App Store Server Notifications → **Version 2**, URL Production và Sandbox:
   `<API public>/billing/iap/apple/notifications`
4. Backend: `APPLE_BUNDLE_ID=laclingo.app`.
5. Xcode → Signing & Capabilities → thêm **In-App Purchase**. Thử bằng tài khoản Sandbox (Users and Access → Sandbox).

**Google (Play Console):**
1. Monetize → tạo các sản phẩm ở bảng trên (subscription nhớ đúng base plan `monthly` / `yearly`).
2. Google Cloud: bật **Google Play Android Developer API**, tạo service account + khoá JSON; Play Console → Users and
   permissions → mời email service account (quyền xem dữ liệu tài chính, quản lý đơn hàng và subscription).
3. Real-time developer notifications: tạo Pub/Sub topic (cấp quyền publish cho
   `google-play-developer-notifications@system.gserviceaccount.com`), subscription kiểu **Push** tới
   `<API public>/billing/iap/google/notifications?token=<chuỗi ngẫu nhiên dài>`; Play Console → Monetization setup →
   nhập topic.
4. Backend: `GOOGLE_PLAY_PACKAGE_NAME=laclingo.app`, `GOOGLE_PLAY_SERVICE_ACCOUNT_FILE=<file JSON, ngoài repo>`,
   `GOOGLE_PLAY_RTDN_TOKEN=<chuỗi ngẫu nhiên ở bước 3>`.
5. Thử bằng License testing (tài khoản test mua không mất tiền) trên bản phát hành Internal testing.

Gói mua qua store được quản lý / huỷ trong cài đặt tài khoản store (nút "Quản lý trong App Store / Google Play" ở
trang Bảng giá). Trang Bảng giá trong app có nút **Khôi phục giao dịch** (App Store bắt buộc).

## Phiên bản app (bắt buộc / nhắc cập nhật)

Web nạp từ server nên luôn mới — chỉ vỏ native (plugin, quyền, icon...) mới cần cập nhật qua store. Mỗi lần mở app,
app so phiên bản đang cài (`@capacitor/app` → `getInfo().version`) với cấu hình ở trang admin **Phiên bản app**
(`/admin/app-versions`, module `app_versions`):

- thấp hơn **phiên bản tối thiểu** → màn hình chặn, chỉ có nút cập nhật (mở link store)
- thấp hơn **phiên bản mới nhất** → hộp thoại nhắc cập nhật, "Để sau" nhắc lại sau 1 ngày

Bản app build trước khi có plugin `@capacitor/app` không đọc được phiên bản nên không bao giờ bị chặn — bản phát hành
đầu tiên lên store đã có plugin này. Phiên bản không phải số (vd bản debug `dev`) cũng không bị chặn.

Khi phát hành bản native mới:
1. Tăng phiên bản: iOS — Xcode → target App → General → **Version** (MARKETING_VERSION); Android —
   `android/app/build.gradle` → `versionName` (và tăng `versionCode`). Dùng dạng `1.2.3`, giống nhau ở 2 nền tảng.
2. Sau khi store duyệt xong, vào `/admin/app-versions` đặt **phiên bản mới nhất** = bản vừa phát hành (+ link store,
   lời nhắn). Chỉ nâng **phiên bản tối thiểu** khi bản cũ không còn chạy được (vd đổi plugin native mà web mới cần).

## Lưu ý trước khi nộp store

- Apple có thể từ chối app "chỉ bọc trang web" (Guideline 4.2) — thông báo đẩy native là 1 tính năng giúp vượt qua.
- Chính sách quyền riêng tư: `<domain web>/privacy`; xoá tài khoản: Hồ sơ → Xoá tài khoản.
