import type { BuiltinLocale } from '@/store/locale'

// Namespace "passwordReset" — quên mật khẩu (trang /forgot-password, /reset-password, link ở trang đăng nhập)
export interface PasswordResetDict {
  passwordReset: {
    forgotLink: string
    forgotTitle: string
    forgotDesc: string
    identifierLabel: string
    sendLink: string
    sent: string
    resetTitle: string
    resetDesc: string
    newPassword: string
    confirmPassword: string
    submit: string
    done: string
    mismatch: string
    tooShort: (n: number) => string
    missingToken: string
    requestNew: string
    backToLogin: string
  }
}

export const passwordResetTranslations: Partial<Record<BuiltinLocale, PasswordResetDict>> = {
  vi: {
    passwordReset: {
      forgotLink: 'Quên mật khẩu?',
      forgotTitle: 'Quên mật khẩu',
      forgotDesc: 'Nhập email hoặc tên đăng nhập — chúng tôi gửi link đặt mật khẩu mới tới email của tài khoản.',
      identifierLabel: 'Email hoặc tên đăng nhập',
      sendLink: 'Gửi link đặt lại',
      sent: 'Nếu tài khoản tồn tại, link đặt lại mật khẩu đã được gửi tới email của bạn (hiệu lực 30 phút). Hãy kiểm tra cả thư mục Spam.',
      resetTitle: 'Đặt mật khẩu mới',
      resetDesc: 'Đặt xong, mọi thiết bị đang đăng nhập sẽ bị đăng xuất — đăng nhập lại bằng mật khẩu mới.',
      newPassword: 'Mật khẩu mới',
      confirmPassword: 'Nhập lại mật khẩu mới',
      submit: 'Đặt mật khẩu mới',
      done: 'Đã đặt mật khẩu mới. Hãy đăng nhập bằng mật khẩu mới.',
      mismatch: 'Mật khẩu nhập lại không khớp',
      tooShort: (n) => `Mật khẩu mới tối thiểu ${n} ký tự`,
      missingToken: 'Link không hợp lệ. Hãy mở đúng link trong email hoặc gửi yêu cầu mới.',
      requestNew: 'Gửi yêu cầu mới',
      backToLogin: 'Quay lại đăng nhập',
    },
  },
  en: {
    passwordReset: {
      forgotLink: 'Forgot password?',
      forgotTitle: 'Forgot password',
      forgotDesc: "Enter your email or username — we'll send a link to set a new password to the account's email.",
      identifierLabel: 'Email or username',
      sendLink: 'Send reset link',
      sent: 'If the account exists, a password reset link has been sent to its email (valid for 30 minutes). Check your Spam folder too.',
      resetTitle: 'Set a new password',
      resetDesc: 'Once set, every signed-in device is signed out — sign in again with the new password.',
      newPassword: 'New password',
      confirmPassword: 'Confirm new password',
      submit: 'Set new password',
      done: 'Your password has been reset. Sign in with the new password.',
      mismatch: 'Passwords do not match',
      tooShort: (n) => `New password must be at least ${n} characters`,
      missingToken: 'This link is invalid. Open the exact link from the email or request a new one.',
      requestNew: 'Request a new link',
      backToLogin: 'Back to sign in',
    },
  },
  zh: {
    passwordReset: {
      forgotLink: '忘记密码？',
      forgotTitle: '忘记密码',
      forgotDesc: '输入邮箱或用户名——我们会把设置新密码的链接发送到账户邮箱。',
      identifierLabel: '邮箱或用户名',
      sendLink: '发送重置链接',
      sent: '如果账户存在，重置密码链接已发送到其邮箱（30 分钟内有效）。也请检查垃圾邮件。',
      resetTitle: '设置新密码',
      resetDesc: '设置后所有已登录设备都会退出——请用新密码重新登录。',
      newPassword: '新密码',
      confirmPassword: '再次输入新密码',
      submit: '设置新密码',
      done: '密码已重置，请用新密码登录。',
      mismatch: '两次输入的密码不一致',
      tooShort: (n) => `新密码至少需要 ${n} 个字符`,
      missingToken: '链接无效。请打开邮件中的原始链接，或重新申请。',
      requestNew: '重新申请',
      backToLogin: '返回登录',
    },
  },
  ja: {
    passwordReset: {
      forgotLink: 'パスワードをお忘れですか？',
      forgotTitle: 'パスワードを忘れた場合',
      forgotDesc: 'メールアドレスまたはユーザー名を入力してください。新しいパスワードを設定するリンクをアカウントのメールに送ります。',
      identifierLabel: 'メールアドレスまたはユーザー名',
      sendLink: 'リセットリンクを送信',
      sent: 'アカウントが存在する場合、パスワード再設定リンクをメールに送信しました（30分間有効）。迷惑メールフォルダもご確認ください。',
      resetTitle: '新しいパスワードを設定',
      resetDesc: '設定すると、ログイン中のすべての端末からログアウトされます。新しいパスワードで再ログインしてください。',
      newPassword: '新しいパスワード',
      confirmPassword: '新しいパスワード（確認）',
      submit: '新しいパスワードを設定',
      done: 'パスワードを再設定しました。新しいパスワードでログインしてください。',
      mismatch: 'パスワードが一致しません',
      tooShort: (n) => `新しいパスワードは${n}文字以上必要です`,
      missingToken: 'リンクが無効です。メール内のリンクを開くか、もう一度リクエストしてください。',
      requestNew: 'もう一度リクエスト',
      backToLogin: 'ログインに戻る',
    },
  },
  ko: {
    passwordReset: {
      forgotLink: '비밀번호를 잊으셨나요?',
      forgotTitle: '비밀번호 찾기',
      forgotDesc: '이메일 또는 아이디를 입력하세요 — 새 비밀번호를 설정할 링크를 계정 이메일로 보내드려요.',
      identifierLabel: '이메일 또는 아이디',
      sendLink: '재설정 링크 보내기',
      sent: '계정이 있다면 비밀번호 재설정 링크를 이메일로 보냈어요(30분 동안 유효). 스팸함도 확인해 주세요.',
      resetTitle: '새 비밀번호 설정',
      resetDesc: '설정하면 로그인된 모든 기기에서 로그아웃돼요 — 새 비밀번호로 다시 로그인하세요.',
      newPassword: '새 비밀번호',
      confirmPassword: '새 비밀번호 확인',
      submit: '새 비밀번호 설정',
      done: '비밀번호를 재설정했어요. 새 비밀번호로 로그인하세요.',
      mismatch: '비밀번호가 일치하지 않아요',
      tooShort: (n) => `새 비밀번호는 최소 ${n}자 이상이어야 해요`,
      missingToken: '유효하지 않은 링크예요. 이메일의 링크를 그대로 열거나 다시 요청하세요.',
      requestNew: '다시 요청하기',
      backToLogin: '로그인으로 돌아가기',
    },
  },
}
