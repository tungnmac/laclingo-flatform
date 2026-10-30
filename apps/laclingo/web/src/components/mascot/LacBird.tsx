import { Fragment, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Chim Lạc — biểu tượng hệ thống, tách từ logo (public/lac-bird.svg). Mặc định cao hơn cỡ chữ một chút để đặt lẫn trong dòng */
export function LacBird({ className }: { className?: string }) {
  return (
    <img
      src="/lac-bird.svg"
      alt=""
      width={130}
      height={46}
      className={cn('inline-block h-[1.25em] w-auto align-[-0.25em]', className)}
    />
  )
}

/** Chuỗi giao diện dùng 🦩 làm chỗ đặt biểu tượng — hiển thị thành chim Lạc thay cho emoji hồng hạc */
export function withLacBird(text: string): ReactNode {
  if (!text.includes('🦩')) return text
  return text.split('🦩').map((part, i) => (
    <Fragment key={i}>
      {i > 0 && <LacBird />}
      {part}
    </Fragment>
  ))
}
