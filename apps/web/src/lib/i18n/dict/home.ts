import type { Locale } from '@/store/locale'

// Namespace "home" — landing page công khai (trước đăng nhập). Chỉ vi+en.
export interface HomeDict {
  home: {
    login: string
    greeting: string
    tagline: string
    startReviewBtn: string
    createAccountBtn: string
    featureSrsTitle: string
    featureSrsText: string
    featureAudioTitle: string
    featureAudioText: string
    featureStreakTitle: string
    featureStreakText: string
  }
}

export const homeTranslations: Partial<Record<Locale, HomeDict>> = {
  vi: {
    home: {
      login: 'Đăng nhập',
      greeting: 'Chào mừng sếp đến với',
      tagline: 'Hệ thống học ngôn ngữ thông minh với thuật toán SRS (SM-2) và linh vật Chim Lạc đồng hành.',
      startReviewBtn: 'Bắt đầu phiên ôn tập SRS',
      createAccountBtn: 'Tạo tài khoản',
      featureSrsTitle: 'Lặp lại ngắt quãng',
      featureSrsText: 'Thuật toán SM-2 nhắc bạn ôn đúng lúc sắp quên.',
      featureAudioTitle: 'Phát âm chuẩn',
      featureAudioText: 'Nghe phát âm từng từ ngay trên thẻ ôn tập.',
      featureStreakTitle: 'Chuỗi ngày học',
      featureStreakText: 'Giữ lửa mỗi ngày và leo bảng xếp hạng.',
    },
  },
  en: {
    home: {
      login: 'Log in',
      greeting: 'Welcome to',
      tagline: 'A smart language-learning system powered by the SM-2 (SRS) algorithm, with Chim Lạc by your side.',
      startReviewBtn: 'Start an SRS review session',
      createAccountBtn: 'Create an account',
      featureSrsTitle: 'Spaced repetition',
      featureSrsText: 'The SM-2 algorithm reminds you to review right before you forget.',
      featureAudioTitle: 'Accurate pronunciation',
      featureAudioText: 'Hear each word pronounced right on the review card.',
      featureStreakTitle: 'Daily streak',
      featureStreakText: 'Keep the streak alive and climb the leaderboard.',
    },
  },
}
