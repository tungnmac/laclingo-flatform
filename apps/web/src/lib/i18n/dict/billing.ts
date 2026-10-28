import type { Locale } from '@/store/locale'
import type { BillingFeature, CatalogItemId, GemReward, GemTransaction, PaymentOrder, RewardSettings, SubscriptionPlan } from '@/types/api'

// Namespace "billing" — LacLingo Pro: bảng giá, màn nâng cấp, gói trong hồ sơ, admin cấp Pro. Chỉ vi+en.
export interface BillingDict {
  billing: {
    pricingTitle: string
    pricingSubtitle: string
    freeName: string
    proName: string
    compareTitle: string
    compareRows: { label: string; free: string; pro: string }[]
    plans: Record<SubscriptionPlan, string>
    perPlan: Record<SubscriptionPlan, string>
    yearlySave: (percent: number) => string
    popular: string
    payVNPay: string
    payStripe: string
    redirecting: string
    noProvider: string
    recurringNote: string
    manageSubscription: string
    autoRenewOn: (date: string) => string
    autoRenewOff: (date: string) => string
    haveLifetime: string
    // Mua trong app iOS/Android (App Store / Google Play)
    buyInApp: string
    processing: string
    storeUnavailable: string
    storeError: string
    storePending: string
    purchased: string
    restore: string
    restored: (n: number) => string
    manageInStore: (store: string) => string
    manageOnPhone: string
    manageOnWeb: string
    storeRecurringNote: (store: string) => string
    terms: string
    privacy: string
    items: Record<CatalogItemId, string>
    walletTitle: string
    walletSubtitle: string
    gemsBalance: string
    freezesHave: (n: number, max: number) => string
    buyFreeze: (cost: number) => string
    freezeBought: string
    gemPacksTitle: string
    gemsHint: string
    historyTitle: string
    paymentsTitle: string
    noHistory: string
    reasons: Record<GemTransaction['reason'], string>
    rewardsTitle: string
    rewardsEmpty: string
    claim: string
    claimAll: (total: number) => string
    claimedToast: (gems: number) => string
    rewardSources: Record<GemReward['source'], string>
    howToEarnTitle: string
    howToEarn: (s: RewardSettings) => string[]
    orderStatus: Record<PaymentOrder['status'], string>
    resultTitle: string
    resultChecking: string
    resultPaidPlan: string
    resultPaidGems: (n: number) => string
    resultFailed: string
    resultCancelled: string
    resultPending: string
    resultInvalid: string
    toWallet: string
    toPricing: string
    yourPlan: string
    freePlan: string
    proUntil: (date: string) => string
    proLifetime: string
    staffNote: string
    usageTitle: string
    features: Record<BillingFeature, string>
    usageValue: (used: number, limit: number) => string
    streakFreezes: (n: number) => string
    streakFreezeHint: string
    upgradeCta: string
    paywallTitle: string
    paywallBody: (feature: BillingFeature, limit: number) => string
    viewPlans: string
    later: string
    analyzeUpgradeHint: string
    admin: {
      proBtn: string
      dialogTitle: (name: string) => string
      current: string
      noPlan: string
      plan: string
      note: string
      notePlaceholder: string
      grantBtn: string
      revokeBtn: string
      revokeConfirm: (name: string) => string
      close: string
      expires: (date: string) => string
      lifetime: string
    }
  }
}

const viFeatures: Record<BillingFeature, string> = { srs_review: 'Ôn từ vựng', speaking: 'Luyện nói', sentence_analysis: 'Phân tích câu bằng AI' }
const enFeatures: Record<BillingFeature, string> = { srs_review: 'Vocabulary reviews', speaking: 'Speaking practice', sentence_analysis: 'AI sentence checks' }
// Cụm dùng giữa câu (giữ nguyên chữ "AI")
const viFeaturePhrase: Record<BillingFeature, string> = { srs_review: 'ôn từ vựng', speaking: 'luyện nói', sentence_analysis: 'phân tích câu bằng AI' }
const enFeaturePhrase: Record<BillingFeature, string> = { srs_review: 'vocabulary reviews', speaking: 'speaking attempts', sentence_analysis: 'AI sentence checks' }

export const billingTranslations: Partial<Record<Locale, BillingDict>> = {
  vi: {
    billing: {
      pricingTitle: '⭐ LacLingo Pro',
      pricingSubtitle: 'Học không giới hạn: ôn từ, luyện nói thoải mái, thêm lượt phân tích câu bằng AI và giữ chuỗi ngày học với Streak Freeze.',
      freeName: 'Free',
      proName: 'Pro',
      compareTitle: 'So sánh gói',
      compareRows: [
        { label: 'Ngữ pháp 12 thì, từ vựng, bài nghe', free: '✓', pro: '✓' },
        { label: 'Ôn từ vựng (SRS) mỗi ngày', free: '15 lượt', pro: 'Không giới hạn' },
        { label: 'Luyện nói (chấm phát âm) mỗi ngày', free: '10 lượt', pro: 'Không giới hạn' },
        { label: 'Phân tích câu bằng AI mỗi ngày', free: '5 lượt', pro: '30 lượt' },
        { label: 'Streak Freeze (giữ chuỗi khi nghỉ 1 ngày)', free: 'Mua bằng gems', pro: 'Tặng 2/tháng + mua bằng gems' },
      ],
      plans: { MONTHLY: 'Theo tháng', YEARLY: 'Theo năm', LIFETIME: 'Trọn đời' },
      perPlan: { MONTHLY: '/tháng', YEARLY: '/năm', LIFETIME: 'trả 1 lần' },
      yearlySave: (p) => `Tiết kiệm ${p}%`,
      popular: 'Phổ biến nhất',
      payVNPay: 'VNPay (ATM / QR ngân hàng)',
      payStripe: 'Thẻ quốc tế (Visa / Master)',
      redirecting: 'Đang chuyển sang trang thanh toán…',
      noProvider: 'Thanh toán online chưa được bật — vui lòng liên hệ quản trị viên để nâng cấp.',
      recurringNote: 'Thẻ quốc tế: gói tháng/năm tự gia hạn mỗi kỳ, huỷ bất cứ lúc nào. VNPay: trả trước 1 kỳ, cộng nối vào hạn Pro còn lại.',
      manageSubscription: 'Quản lý gói tự gia hạn',
      autoRenewOn: (d) => `Tự gia hạn ngày ${d}`,
      autoRenewOff: (d) => `Đã tắt tự gia hạn — Pro đến ${d}`,
      haveLifetime: 'Bạn đã có LacLingo Pro trọn đời 🎉',
      buyInApp: 'Mua',
      processing: 'Đang xử lý…',
      storeUnavailable: 'Chưa hỗ trợ mua trong ứng dụng.',
      storeError: 'Không hoàn tất được giao dịch, vui lòng thử lại.',
      storePending: 'Giao dịch đang chờ thanh toán — gói sẽ được kích hoạt khi thanh toán hoàn tất.',
      purchased: 'Thanh toán thành công 🎉',
      restore: 'Khôi phục giao dịch',
      restored: (n) => (n > 0 ? `Đã khôi phục ${n} giao dịch` : 'Không có giao dịch nào cần khôi phục'),
      manageInStore: (store) => `Quản lý trong ${store}`,
      manageOnPhone: 'Gói mua qua App Store / Google Play — quản lý trong cài đặt tài khoản store trên điện thoại.',
      manageOnWeb: 'Gói mua qua website — quản lý gói trên trang web LacLingo.',
      storeRecurringNote: (store) =>
        `Gói tháng/năm tự gia hạn mỗi kỳ qua ${store} với giá hiển thị ở trên, trừ khi bạn tắt tự gia hạn ít nhất 24 giờ trước khi hết kỳ. Quản lý và huỷ trong cài đặt tài khoản ${store}.`,
      terms: 'Điều khoản sử dụng',
      privacy: 'Chính sách quyền riêng tư',
      items: { MONTHLY: 'Pro 1 tháng', YEARLY: 'Pro 1 năm', LIFETIME: 'Pro trọn đời', GEMS_100: '100 gems', GEMS_550: '550 gems', GEMS_1200: '1.200 gems' },
      walletTitle: '💎 Ví',
      walletSubtitle: 'Gems dùng để mua Streak Freeze giữ chuỗi ngày học. Nhận gems khi hoàn thành nhiệm vụ hoặc nạp thêm.',
      gemsBalance: 'Số dư',
      freezesHave: (n, max) => `🧊 ${n}/${max} Streak Freeze`,
      buyFreeze: (cost) => `Mua 1 Streak Freeze · ${cost} gems`,
      freezeBought: 'Đã mua 1 Streak Freeze 🧊',
      gemPacksTitle: 'Nạp gems',
      gemsHint: 'Gói lớn được thêm gems thưởng.',
      historyTitle: 'Lịch sử gems',
      paymentsTitle: 'Lịch sử thanh toán',
      noHistory: 'Chưa có giao dịch nào.',
      reasons: {
        PURCHASE: 'Nạp gems',
        MISSION_REWARD: 'Thưởng nhiệm vụ',
        CHALLENGE_WIN: 'Thắng thử thách',
        LEVEL_UP: 'Thưởng lên level',
        BUY_STREAK_FREEZE: 'Mua Streak Freeze',
        ADMIN: 'Quản trị viên',
      },
      rewardsTitle: '🎁 Quà chờ nhận',
      rewardsEmpty: 'Chưa có quà nào — làm nhiệm vụ, thắng thử thách, lên level để nhận gems.',
      claim: 'Nhận',
      claimAll: (n) => `Nhận tất cả · +${n} gems`,
      claimedToast: (n) => `Đã nhận +${n} gems 💎`,
      rewardSources: { MISSION: '🎯 Nhiệm vụ', CHALLENGE_WIN: '🏆 Thắng thử thách', LEVEL_UP: '⭐ Lên level' },
      howToEarnTitle: 'Cách kiếm gems',
      howToEarn: (s) =>
        [
          '🎯 Hoàn thành nhiệm vụ có thưởng gems',
          s.challenge_win_gems > 0 ? `🏆 Thắng thử thách: +${s.challenge_win_gems} gems mỗi trận` : '',
          s.level_up_gems_per_level > 0 ? `⭐ Lên level N: +N × ${s.level_up_gems_per_level} gems (vd lên level 5 = ${5 * s.level_up_gems_per_level} gems)` : '',
        ].filter(Boolean),
      orderStatus: { PENDING: 'Đang xử lý', PAID: 'Thành công', FAILED: 'Thất bại', CANCELLED: 'Đã huỷ' },
      resultTitle: 'Kết quả thanh toán',
      resultChecking: 'Đang xác nhận thanh toán…',
      resultPaidPlan: '⭐ LacLingo Pro đã được kích hoạt! Cảm ơn bạn.',
      resultPaidGems: (n) => `💎 Đã nạp ${n} gems vào ví.`,
      resultFailed: 'Thanh toán không thành công — bạn chưa bị trừ tiền hoặc tiền sẽ được ngân hàng hoàn lại.',
      resultCancelled: 'Bạn đã huỷ thanh toán.',
      resultPending: 'Thanh toán đang được xử lý — kết quả sẽ cập nhật trong ít phút, bạn có thể xem lại ở Ví.',
      resultInvalid: 'Không xác định được đơn thanh toán.',
      toWallet: 'Về Ví',
      toPricing: 'Xem gói Pro',
      yourPlan: 'Gói của bạn',
      freePlan: 'Free',
      proUntil: (d) => `Pro đến ${d}`,
      proLifetime: 'Pro trọn đời',
      staffNote: 'Tài khoản quản trị được dùng đầy đủ tính năng Pro.',
      usageTitle: 'Lượt dùng hôm nay',
      features: viFeatures,
      usageValue: (used, limit) => (limit > 0 ? `${used}/${limit}` : `${used} · không giới hạn`),
      streakFreezes: (n) => `🧊 ${n} Streak Freeze`,
      streakFreezeHint: 'Tự dùng khi bạn nghỉ học để giữ chuỗi ngày. Pro được nạp 2 cái mỗi tháng.',
      upgradeCta: '⭐ Nâng cấp Pro',
      paywallTitle: '⭐ Nâng cấp LacLingo Pro',
      paywallBody: (f, limit) =>
        `Gói Free có ${limit} lượt ${viFeaturePhrase[f]} mỗi ngày và bạn đã dùng hết hôm nay. ` +
        (f === 'sentence_analysis' ? 'Nâng cấp Pro để có 30 lượt mỗi ngày.' : 'Nâng cấp Pro để học tiếp không giới hạn.'),
      viewPlans: 'Xem gói Pro',
      later: 'Để sau',
      analyzeUpgradeHint: 'Nâng cấp Pro để có 30 lượt/ngày',
      admin: {
        proBtn: '⭐ Pro',
        dialogTitle: (n) => `Gói Pro của ${n}`,
        current: 'Gói hiện tại',
        noPlan: 'Free (chưa có gói)',
        plan: 'Cấp gói',
        note: 'Ghi chú',
        notePlaceholder: 'Vd: tặng học viên lớp IELTS',
        grantBtn: 'Cấp gói',
        revokeBtn: 'Thu hồi Pro',
        revokeConfirm: (n) => `Thu hồi gói Pro của ${n}? Học viên sẽ về gói Free ngay.`,
        close: 'Đóng',
        expires: (d) => `hết hạn ${d}`,
        lifetime: 'trọn đời',
      },
    },
  },
  en: {
    billing: {
      pricingTitle: '⭐ LacLingo Pro',
      pricingSubtitle: 'Unlimited learning: review and practice speaking as much as you like, more AI sentence checks, and keep your streak with Streak Freeze.',
      freeName: 'Free',
      proName: 'Pro',
      compareTitle: 'Compare plans',
      compareRows: [
        { label: '12 tenses grammar, vocabulary, listening', free: '✓', pro: '✓' },
        { label: 'Vocabulary reviews (SRS) per day', free: '15', pro: 'Unlimited' },
        { label: 'Speaking practice per day', free: '10', pro: 'Unlimited' },
        { label: 'AI sentence checks per day', free: '5', pro: '30' },
        { label: 'Streak Freeze (keep your streak after a missed day)', free: 'Buy with gems', pro: '2 free/month + buy with gems' },
      ],
      plans: { MONTHLY: 'Monthly', YEARLY: 'Yearly', LIFETIME: 'Lifetime' },
      perPlan: { MONTHLY: '/month', YEARLY: '/year', LIFETIME: 'one-time' },
      yearlySave: (p) => `Save ${p}%`,
      popular: 'Most popular',
      payVNPay: 'VNPay (Vietnamese bank / QR)',
      payStripe: 'International card (Visa / Master)',
      redirecting: 'Redirecting to the payment page…',
      noProvider: 'Online payment is not enabled yet — please contact an administrator to upgrade.',
      recurringNote: 'Card: monthly/yearly plans renew automatically, cancel anytime. VNPay: prepay one period, added on top of your remaining Pro time.',
      manageSubscription: 'Manage auto-renewal',
      autoRenewOn: (d) => `Renews on ${d}`,
      autoRenewOff: (d) => `Auto-renewal off — Pro until ${d}`,
      haveLifetime: 'You already have Lifetime LacLingo Pro 🎉',
      buyInApp: 'Buy',
      processing: 'Processing…',
      storeUnavailable: 'In-app purchases are not available yet.',
      storeError: "Couldn't complete the purchase, please try again.",
      storePending: 'Payment is pending — your purchase will be activated once the payment completes.',
      purchased: 'Payment successful 🎉',
      restore: 'Restore purchases',
      restored: (n) => (n > 0 ? `Restored ${n} purchase${n > 1 ? 's' : ''}` : 'No purchases to restore'),
      manageInStore: (store) => `Manage in ${store}`,
      manageOnPhone: 'Bought through the App Store / Google Play — manage it in your store account settings on your phone.',
      manageOnWeb: 'Bought on the website — manage it on the LacLingo website.',
      storeRecurringNote: (store) =>
        `Monthly/yearly plans renew automatically through ${store} at the price shown above unless auto-renew is turned off at least 24 hours before the end of the period. Manage or cancel in your ${store} account settings.`,
      terms: 'Terms of Use',
      privacy: 'Privacy Policy',
      items: { MONTHLY: 'Pro 1 month', YEARLY: 'Pro 1 year', LIFETIME: 'Lifetime Pro', GEMS_100: '100 gems', GEMS_550: '550 gems', GEMS_1200: '1,200 gems' },
      walletTitle: '💎 Wallet',
      walletSubtitle: 'Use gems to buy Streak Freezes that keep your streak. Earn gems from missions or top up.',
      gemsBalance: 'Balance',
      freezesHave: (n, max) => `🧊 ${n}/${max} Streak Freezes`,
      buyFreeze: (cost) => `Buy 1 Streak Freeze · ${cost} gems`,
      freezeBought: 'Bought 1 Streak Freeze 🧊',
      gemPacksTitle: 'Top up gems',
      gemsHint: 'Bigger packs include bonus gems.',
      historyTitle: 'Gem history',
      paymentsTitle: 'Payment history',
      noHistory: 'No transactions yet.',
      reasons: {
        PURCHASE: 'Top-up',
        MISSION_REWARD: 'Mission reward',
        CHALLENGE_WIN: 'Challenge win',
        LEVEL_UP: 'Level-up reward',
        BUY_STREAK_FREEZE: 'Streak Freeze',
        ADMIN: 'Administrator',
      },
      rewardsTitle: '🎁 Rewards to collect',
      rewardsEmpty: 'No rewards yet — complete missions, win challenges and level up to earn gems.',
      claim: 'Collect',
      claimAll: (n) => `Collect all · +${n} gems`,
      claimedToast: (n) => `Collected +${n} gems 💎`,
      rewardSources: { MISSION: '🎯 Mission', CHALLENGE_WIN: '🏆 Challenge win', LEVEL_UP: '⭐ Level up' },
      howToEarnTitle: 'How to earn gems',
      howToEarn: (s) =>
        [
          '🎯 Complete missions that reward gems',
          s.challenge_win_gems > 0 ? `🏆 Win a challenge: +${s.challenge_win_gems} gems per match` : '',
          s.level_up_gems_per_level > 0 ? `⭐ Reach level N: +N × ${s.level_up_gems_per_level} gems (e.g. level 5 = ${5 * s.level_up_gems_per_level} gems)` : '',
        ].filter(Boolean),
      orderStatus: { PENDING: 'Processing', PAID: 'Paid', FAILED: 'Failed', CANCELLED: 'Cancelled' },
      resultTitle: 'Payment result',
      resultChecking: 'Confirming your payment…',
      resultPaidPlan: '⭐ LacLingo Pro is now active! Thank you.',
      resultPaidGems: (n) => `💎 ${n} gems were added to your wallet.`,
      resultFailed: 'The payment did not go through — you were not charged, or your bank will refund it.',
      resultCancelled: 'You cancelled the payment.',
      resultPending: 'Your payment is still processing — the result will update in a few minutes; check your Wallet later.',
      resultInvalid: 'The payment order could not be identified.',
      toWallet: 'Go to Wallet',
      toPricing: 'See Pro plans',
      yourPlan: 'Your plan',
      freePlan: 'Free',
      proUntil: (d) => `Pro until ${d}`,
      proLifetime: 'Lifetime Pro',
      staffNote: 'Admin accounts get every Pro feature.',
      usageTitle: "Today's usage",
      features: enFeatures,
      usageValue: (used, limit) => (limit > 0 ? `${used}/${limit}` : `${used} · unlimited`),
      streakFreezes: (n) => `🧊 ${n} Streak Freeze${n === 1 ? '' : 's'}`,
      streakFreezeHint: 'Used automatically when you miss a day so your streak continues. Pro gets 2 every month.',
      upgradeCta: '⭐ Upgrade to Pro',
      paywallTitle: '⭐ Upgrade to LacLingo Pro',
      paywallBody: (f, limit) =>
        `The Free plan includes ${limit} ${enFeaturePhrase[f]} per day and you have used them all today. ` +
        (f === 'sentence_analysis' ? 'Upgrade to Pro for 30 a day.' : 'Upgrade to Pro to keep going without limits.'),
      viewPlans: 'See Pro plans',
      later: 'Not now',
      analyzeUpgradeHint: 'Upgrade to Pro for 30 checks a day',
      admin: {
        proBtn: '⭐ Pro',
        dialogTitle: (n) => `Pro plan of ${n}`,
        current: 'Current plan',
        noPlan: 'Free (no plan)',
        plan: 'Grant plan',
        note: 'Note',
        notePlaceholder: 'e.g. gift for the IELTS class',
        grantBtn: 'Grant',
        revokeBtn: 'Revoke Pro',
        revokeConfirm: (n) => `Revoke the Pro plan of ${n}? They go back to Free immediately.`,
        close: 'Close',
        expires: (d) => `expires ${d}`,
        lifetime: 'lifetime',
      },
    },
  },
}
