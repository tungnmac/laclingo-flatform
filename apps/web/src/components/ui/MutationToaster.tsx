'use client'

import { useEffect } from 'react'
import { useToast, useToastSeq } from '@/components/ui/ToastProvider'
import { useTranslation } from '@/hooks/useTranslation'
import { MUTATION_EVENT, type MutationNotice } from '@/lib/mutationNotice'

/** Hiện toast cho mọi thao tác tạo mới / cập nhật / xoá (thành công hoặc thất bại) — xem apiFetch */
export function MutationToaster() {
  const toast = useToast()
  const t = useTranslation()
  const seq = useToastSeq()

  useEffect(() => {
    const onMutation = (e: Event) => {
      const n = (e as CustomEvent<MutationNotice>).detail
      // apiFetch phát sự kiện TRƯỚC khi trả kết quả cho nơi gọi → chờ 1 nhịp: nếu màn hình đã tự
      // hiện toast riêng (vd "Đã chuyển từ sang list X" / lỗi cụ thể) thì bỏ thông báo chung, tránh trùng
      const before = seq.current
      setTimeout(() => {
        if (seq.current !== before) return
        if (n.ok) toast(t.common.mutationSuccess[n.kind])
        else toast(t.common.mutationFailed[n.kind](n.error ?? ''), 'error')
      }, 0)
    }
    window.addEventListener(MUTATION_EVENT, onMutation)
    return () => window.removeEventListener(MUTATION_EVENT, onMutation)
  }, [toast, t, seq])

  return null
}
