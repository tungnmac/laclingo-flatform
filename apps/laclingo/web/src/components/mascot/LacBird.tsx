import { Fragment, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Chim Lạc — biểu tượng hệ thống (public/lac-bird.svg). Không truyền className thì đặt lẫn trong dòng chữ, cao hơn cỡ
 * chữ một chút; có className thì kích thước do nơi dùng quyết định (cn không gộp class Tailwind trùng nhau)
 */
export function LacBird({ className }: { className?: string }) {
  return (
    <img
      src="/lac-bird.svg"
      alt=""
      width={189}
      height={100}
      className={cn('w-auto', className ?? 'inline-block h-[1.5em] align-[-0.4em]')}
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
