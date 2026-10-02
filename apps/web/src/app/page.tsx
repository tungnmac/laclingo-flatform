import Link from 'next/link'
import { ButtonLink } from '@/components/ui/Button'

const features = [
  { icon: '🧠', title: 'Lặp lại ngắt quãng', text: 'Thuật toán SM-2 nhắc bạn ôn đúng lúc sắp quên.' },
  { icon: '🔊', title: 'Phát âm chuẩn', text: 'Nghe phát âm từng từ ngay trên thẻ ôn tập.' },
  { icon: '🔥', title: 'Chuỗi ngày học', text: 'Giữ lửa mỗi ngày và leo bảng xếp hạng.' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-slate-50 to-slate-50">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <span className="flex items-center gap-2 text-xl font-bold text-indigo-600 sm:text-2xl">
          <img src="/logo.svg" alt="" className="h-8 w-8 rounded-lg" /> LacLingo
        </span>
        <Link href="/login" className="text-sm font-semibold text-slate-700 hover:text-indigo-600">
          Đăng nhập
        </Link>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col items-center px-4 pb-16 pt-10 text-center sm:px-6 sm:pt-20">
        <img src="/logo.svg" alt="Chim Lạc — linh vật LacLingo" className="mb-6 h-24 w-24 rounded-3xl shadow-lg sm:h-28 sm:w-28" />
        <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
          Chào mừng sếp đến với <span className="text-indigo-600">LacLingo</span>
        </h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-slate-600 sm:mt-6 sm:text-lg sm:leading-8">
          Hệ thống học ngôn ngữ thông minh với thuật toán SRS (SM-2) và linh vật Chim Lạc đồng hành.
        </p>
        <div className="mt-8 flex w-full flex-col gap-3 sm:mt-10 sm:w-auto sm:flex-row">
          <ButtonLink href="/review" size="lg">
            Bắt đầu phiên ôn tập SRS
          </ButtonLink>
          <ButtonLink href="/register" variant="secondary" size="lg">
            Tạo tài khoản
          </ButtonLink>
        </div>

        <section className="mt-16 grid w-full grid-cols-1 gap-4 text-left sm:mt-24 sm:grid-cols-3 sm:gap-6">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
              <div className="text-3xl">{f.icon}</div>
              <h2 className="mt-3 font-semibold text-slate-900">{f.title}</h2>
              <p className="mt-1 text-sm text-slate-600">{f.text}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  )
}
