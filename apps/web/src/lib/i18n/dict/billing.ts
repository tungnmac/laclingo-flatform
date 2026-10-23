import type { Locale } from '@/store/locale'
import type { BillingFeature, SubscriptionPlan } from '@/types/api'

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
    checkoutSoon: string
    contactAdmin: string
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
        { label: 'Streak Freeze (giữ chuỗi khi nghỉ 1 ngày)', free: '—', pro: '2 mỗi tháng' },
      ],
      plans: { MONTHLY: 'Theo tháng', YEARLY: 'Theo năm', LIFETIME: 'Trọn đời' },
      perPlan: { MONTHLY: '/tháng', YEARLY: '/năm', LIFETIME: 'trả 1 lần' },
      yearlySave: (p) => `Tiết kiệm ${p}%`,
      popular: 'Phổ biến nhất',
      checkoutSoon: 'Thanh toán online sắp ra mắt',
      contactAdmin: 'Hiện tại vui lòng liên hệ quản trị viên để được nâng cấp Pro.',
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
        { label: 'Streak Freeze (keep your streak after a missed day)', free: '—', pro: '2 per month' },
      ],
      plans: { MONTHLY: 'Monthly', YEARLY: 'Yearly', LIFETIME: 'Lifetime' },
      perPlan: { MONTHLY: '/month', YEARLY: '/year', LIFETIME: 'one-time' },
      yearlySave: (p) => `Save ${p}%`,
      popular: 'Most popular',
      checkoutSoon: 'Online payment coming soon',
      contactAdmin: 'For now, please contact an administrator to upgrade to Pro.',
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
