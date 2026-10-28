'use client'

import { OnboardingWizard } from '@/features/onboarding/components/OnboardingWizard'

/** Thiết lập lần đầu đăng nhập — dashboard layout tự chuyển tới đây khi user.onboarded_at còn trống */
export default function OnboardingPage() {
  return <OnboardingWizard />
}
