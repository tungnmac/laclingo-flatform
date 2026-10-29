import { useConfirm } from '@/components/ui/ConfirmDialogProvider'
import { useToast } from '@/components/ui/ToastProvider'
import { useTranslation } from '@/hooks/useTranslation'
import { inlineError } from '@/lib/api'
import { moderationService } from './moderation.service'

/** Chặn / bỏ chặn 1 người dùng (có xác nhận khi chặn) — trả true nếu đã thực hiện */
export function useBlockUser() {
  const m = useTranslation().moderation
  const confirm = useConfirm()
  const toast = useToast()

  const block = async (userId: string, name: string) => {
    if (!(await confirm({ title: m.block(name), description: m.blockConfirm(name), confirmLabel: m.block(name), danger: true })))
      return false
    try {
      await moderationService.block(userId)
      toast(m.blocked(name))
      return true
    } catch (err) {
      toast(inlineError(err), 'error')
      return false
    }
  }
  const unblock = async (userId: string, name: string) => {
    try {
      await moderationService.unblock(userId)
      toast(m.unblocked(name))
      return true
    } catch (err) {
      toast(inlineError(err), 'error')
      return false
    }
  }
  return { block, unblock }
}
