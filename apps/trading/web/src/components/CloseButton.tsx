'use client'

/** Nút ✕ đóng khung / form — có nhãn cho trình đọc màn hình */
export function CloseButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="-m-1 rounded-lg p-1 text-lg leading-none text-slate-400 hover:bg-slate-100 hover:text-slate-700"
    >
      ✕
    </button>
  )
}
