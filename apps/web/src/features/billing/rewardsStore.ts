import { create } from 'zustand'
import { billingService } from './billing.service'

/** Số quà gems chờ nhận — badge "Ví gems" trên menu; tải khi vào app và sau mỗi lần nhận quà */
interface RewardsState {
  count: number
  refresh: () => Promise<void>
  set: (count: number) => void
}

export const useRewardsCount = create<RewardsState>()((set) => ({
  count: 0,
  refresh: async () => {
    try {
      set({ count: (await billingService.rewards()).count })
    } catch {
      // badge không quan trọng — lỗi mạng thì giữ số cũ
    }
  },
  set: (count) => set({ count }),
}))
