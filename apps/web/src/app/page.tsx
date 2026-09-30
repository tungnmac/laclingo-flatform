export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 text-center">
      <div className="text-6xl mb-4">🦩</div>
      <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl">
        Chào mừng sếp đến với <span className="text-indigo-600">LacLingo</span>
      </h1>
      <p className="mt-6 text-lg leading-8 text-slate-600 max-w-xl">
        Hệ thống học ngôn ngữ thông minh với thuật toán SRS (SM-2) và linh vật Chim Lạc đồng hành.
      </p>
      <div className="mt-10 flex items-center justify-center gap-x-6">
        <a
          href="/review"
          className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          Bắt đầu phiên ôn tập SRS
        </a>
      </div>
    </main>
  )
}
