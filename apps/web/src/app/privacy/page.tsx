'use client'

import Link from 'next/link'
import { useLocale } from '@/store/locale'

// Chính sách quyền riêng tư công khai (App Store / Google Play yêu cầu 1 URL không cần đăng nhập). Nội dung phải khớp
// với dữ liệu app thực sự thu thập — thêm tính năng gửi dữ liệu ra ngoài (AI, thanh toán, analytics...) thì cập nhật ở đây.
const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? ''
const UPDATED_AT = '24/10/2026'

interface Section {
  title: string
  items: string[]
}

const content: Record<'vi' | 'en', { title: string; updated: string; intro: string; sections: Section[]; contact: string; back: string }> = {
  vi: {
    title: 'Chính sách quyền riêng tư',
    updated: `Cập nhật lần cuối: ${UPDATED_AT}`,
    intro: 'LacLingo tôn trọng quyền riêng tư của bạn. Trang này giải thích dữ liệu chúng tôi thu thập, cách sử dụng và quyền của bạn với dữ liệu đó.',
    sections: [
      {
        title: 'Dữ liệu chúng tôi thu thập',
        items: [
          'Thông tin tài khoản: email, tên đăng nhập, họ tên, đường dẫn ảnh đại diện và mật khẩu (chỉ lưu dạng đã mã hoá một chiều).',
          'Dữ liệu học tập: từ vựng, bộ thẻ, lịch ôn tập, kết quả luyện nghe/nói/ngữ pháp, nhật ký, nhiệm vụ, level, điểm, chuỗi ngày học, gems.',
          'Nội dung bạn tạo: bài viết (kèm ảnh tải lên), bình luận, câu gửi đi phân tích, kết quả thử thách với người chơi khác.',
          'Thanh toán: gói đã mua, số tiền, trạng thái đơn. Thông tin thẻ/tài khoản ngân hàng do cổng thanh toán xử lý, LacLingo không lưu.',
          'Thông báo đẩy: nếu bạn bật nhắc học, trình duyệt cấp một địa chỉ nhận thông báo để chúng tôi gửi lời nhắc.',
        ],
      },
      {
        title: 'Cách chúng tôi sử dụng dữ liệu',
        items: [
          'Cung cấp tính năng học: lên lịch ôn tập, chấm điểm, bảng xếp hạng (hiển thị tên đăng nhập, họ tên, level, điểm).',
          'Xử lý thanh toán và cấp gói Pro, gems.',
          'Gửi nhắc học khi bạn bật thông báo.',
          'Chúng tôi không bán dữ liệu cá nhân và không dùng công cụ quảng cáo hay theo dõi của bên thứ ba.',
        ],
      },
      {
        title: 'Bên thứ ba xử lý dữ liệu',
        items: [
          'Cổng thanh toán VNPay và Stripe (trên web), App Store và Google Play (trong ứng dụng iOS/Android): xử lý giao dịch khi bạn mua gói.',
          'Nhà cung cấp AI (Google Gemini hoặc Anthropic Claude): nhận câu bạn gửi đi phân tích để trả kết quả.',
          'Nhận dạng giọng nói khi luyện nói dùng dịch vụ của trình duyệt/hệ điều hành (vd Google, Apple), có thể gửi âm thanh tới nhà cung cấp đó; LacLingo chỉ nhận đoạn văn bản đã nhận dạng, không lưu ghi âm.',
          'Cloudflare R2: lưu ảnh bạn tải lên trong bài viết.',
          'Dịch vụ thông báo đẩy của trình duyệt (Google, Apple, Mozilla...) chuyển lời nhắc học tới thiết bị.',
        ],
      },
      {
        title: 'Lưu trữ và xoá dữ liệu',
        items: [
          'Dữ liệu được giữ trong suốt thời gian tài khoản còn tồn tại.',
          'Bạn có thể xoá tài khoản bất kỳ lúc nào trong mục Hồ sơ → Xoá tài khoản. Tài khoản, dữ liệu học, bài viết, bình luận và ảnh đã tải lên bị xoá ngay lập tức; gói tự gia hạn được huỷ.',
          'Đơn thanh toán được giữ lại ở dạng ẩn danh (không còn gắn với bạn) để đối soát và hoàn tiền. Kết quả các phòng thử thách bạn đã tạo vẫn giữ cho những người chơi khác, không còn tên bạn. Lịch sử giao dịch tại VNPay/Stripe do các bên này lưu giữ theo quy định về thanh toán.',
        ],
      },
      {
        title: 'Quyền của bạn',
        items: [
          'Xem và sửa thông tin tài khoản trong mục Hồ sơ.',
          'Tắt nhắc học bất kỳ lúc nào.',
          'Xoá vĩnh viễn tài khoản và dữ liệu như mô tả ở trên.',
        ],
      },
    ],
    contact: 'Mọi câu hỏi về quyền riêng tư, vui lòng liên hệ:',
    back: '← Về LacLingo',
  },
  en: {
    title: 'Privacy policy',
    updated: `Last updated: ${UPDATED_AT}`,
    intro: 'LacLingo respects your privacy. This page explains what data we collect, how we use it and your rights over it.',
    sections: [
      {
        title: 'Data we collect',
        items: [
          'Account details: email, username, full name, avatar URL and password (stored only as a one-way hash).',
          'Learning data: vocabulary, decks, review schedule, listening/speaking/grammar results, diary, missions, level, points, streak, gems.',
          'Content you create: blog posts (including uploaded images), comments, sentences you submit for analysis, challenge results against other players.',
          'Payments: plans purchased, amounts, order status. Card and bank details are handled by the payment gateway; LacLingo does not store them.',
          'Push notifications: if you turn on study reminders, your browser provides an endpoint we use to deliver them.',
        ],
      },
      {
        title: 'How we use data',
        items: [
          'To run learning features: review scheduling, scoring, leaderboards (showing username, full name, level, points).',
          'To process payments and grant Pro plans and gems.',
          'To send study reminders when you enable them.',
          'We do not sell personal data and use no third-party advertising or tracking tools.',
        ],
      },
      {
        title: 'Third-party processors',
        items: [
          'VNPay and Stripe (on the web), the App Store and Google Play (in the iOS/Android app): process transactions when you buy a plan.',
          'AI providers (Google Gemini or Anthropic Claude): receive sentences you submit for analysis to return results.',
          'Speech recognition during speaking practice uses your browser/operating system service (e.g. Google, Apple), which may send audio to that provider; LacLingo only receives the recognised text and stores no recordings.',
          'Cloudflare R2: stores images you upload in blog posts.',
          "Your browser's push services (Google, Apple, Mozilla...) deliver study reminders to your device.",
        ],
      },
      {
        title: 'Retention and deletion',
        items: [
          'Data is kept for as long as your account exists.',
          'You can delete your account at any time under Profile → Delete account. Your account, learning data, posts, comments and uploaded images are deleted immediately; auto-renewing plans are cancelled.',
          'Payment orders are kept in anonymised form (no longer linked to you) for reconciliation and refunds. Results of challenge rooms you created stay for the other players, without your name. Transaction records held by VNPay/Stripe are retained by them as required by payment regulations.',
        ],
      },
      {
        title: 'Your rights',
        items: [
          'View and edit your account details under Profile.',
          'Turn off study reminders at any time.',
          'Permanently delete your account and data as described above.',
        ],
      },
    ],
    contact: 'For any privacy questions, please contact:',
    back: '← Back to LacLingo',
  },
}

export default function PrivacyPage() {
  const locale = useLocale((s) => s.locale)
  const c = content[locale === 'vi' ? 'vi' : 'en']
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <Link href="/" className="flex items-center gap-2 text-xl font-bold text-indigo-600">
        <img src="/logo.svg" alt="" className="h-8 w-8 rounded-lg" /> LacLingo
      </Link>
      <h1 className="mt-8 text-3xl font-bold text-slate-900">{c.title}</h1>
      <p className="mt-2 text-sm text-slate-500">{c.updated}</p>
      <p className="mt-6 leading-relaxed text-slate-700">{c.intro}</p>
      {c.sections.map((s) => (
        <section key={s.title} className="mt-8">
          <h2 className="text-xl font-semibold text-slate-900">{s.title}</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed text-slate-700">
            {s.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ))}
      {CONTACT_EMAIL && (
        <p className="mt-8 leading-relaxed text-slate-700">
          {c.contact}{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-indigo-600 hover:underline">
            {CONTACT_EMAIL}
          </a>
        </p>
      )}
      <Link href="/" className="mt-10 inline-block text-sm font-medium text-indigo-600 hover:underline">
        {c.back}
      </Link>
    </main>
  )
}
