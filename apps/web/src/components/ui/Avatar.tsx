import { cn, initials } from '@/lib/utils'

export function Avatar({ name, src, className }: { name: string; src?: string; className?: string }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name} className={cn('rounded-full object-cover', className)} />
  }
  return (
    <span
      aria-hidden
      className={cn('inline-flex items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700', className)}
    >
      {initials(name) || '?'}
    </span>
  )
}
