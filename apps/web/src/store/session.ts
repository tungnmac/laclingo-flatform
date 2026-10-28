import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthResponse, User } from '@/types/api'

/** 1 tài khoản đã đăng nhập trên trình duyệt này (chuyển qua lại không cần nhập lại mật khẩu khi phiên còn hạn) */
export interface SavedAccount {
  token: string
  expiresAt: string
  /** Đổi lấy access token mới khi hết hạn (xem refreshSession ở lib/api) — tài khoản đăng nhập trước khi có thì không có */
  refreshToken?: string
  refreshExpiresAt?: string
  user: User
}

/** Số tài khoản giữ tối đa — thêm tài khoản thứ 6 thì bỏ tài khoản dùng lâu nhất */
export const MAX_ACCOUNTS = 5

const STORAGE_KEY = 'laclingo-session'

interface SessionState {
  // Phiên đang dùng — giữ các trường cũ để mọi nơi trong app (apiFetch, layout...) không phải đổi
  token: string | null
  expiresAt: string | null
  refreshToken: string | null
  refreshExpiresAt: string | null
  user: User | null
  /** Mọi tài khoản đã đăng nhập, mới dùng gần nhất trước */
  accounts: SavedAccount[]
  setSession: (auth: AuthResponse) => void
  setUser: (user: User) => void
  /** Token mới sau khi làm mới phiên (POST /auth/refresh) của tài khoản userId */
  updateTokens: (userId: string, auth: AuthResponse) => void
  /** Đăng xuất tài khoản đang dùng; còn tài khoản khác còn phiên → tự chuyển sang (trả true) */
  logout: () => boolean
  logoutAll: () => void
  /** Đổi tài khoản đang dùng (chỉ khi phiên còn hạn) — nơi gọi tự tải lại trang để xoá dữ liệu của tài khoản cũ */
  activate: (userId: string) => boolean
  /** Bỏ phiên đang dùng nhưng GIỮ trong danh sách (phiên hết hạn — hiện "đăng nhập lại") */
  deactivate: () => void
  /**
   * Server từ chối token (401): chỉ xử lý nếu token đó vẫn là phiên đang dùng (nhiều request lỗi cùng lúc không đăng
   * xuất dây chuyền). Đánh dấu tài khoản hết phiên (giữ trong danh sách), chuyển sang tài khoản khác còn phiên nếu có.
   */
  expireToken: (token: string) => 'switched' | 'expired' | 'ignored'
  removeAccount: (userId: string) => void
}

type TokenState = { token: string | null; expiresAt: string | null; refreshToken?: string | null; refreshExpiresAt?: string | null }

/** Access token còn dùng được (chưa hết hạn) */
export function isAccessValid(state: TokenState) {
  return !!state.token && !!state.expiresAt && new Date(state.expiresAt).getTime() > Date.now()
}

/** Phiên còn hiệu lực: access token còn hạn, hoặc refresh token còn hạn (tự làm mới khi gọi API) */
export function isSessionValid(state: TokenState) {
  if (isAccessValid(state)) return true
  return !!state.refreshToken && !!state.refreshExpiresAt && new Date(state.refreshExpiresAt).getTime() > Date.now()
}

const emptyActive = { token: null, expiresAt: null, refreshToken: null, refreshExpiresAt: null, user: null }

/** Thu hồi refresh token ở server khi đăng xuất / gỡ tài khoản (best-effort). Import động: api.ts → store này. */
function revokeRefresh(...accounts: (SavedAccount | undefined)[]) {
  const tokens = accounts.map((a) => a?.refreshToken).filter((t): t is string => !!t)
  if (tokens.length) void import('@/lib/api').then((m) => tokens.forEach(m.revokeRefreshToken)).catch(() => {})
}

/**
 * Trình duyệt chỉ có 1 kênh nhắc học (push) — đổi/đăng xuất tài khoản thì tắt ở trình duyệt này để nhắc học của người
 * trước không hiện cho người dùng sau (backend tự xoá subscription khi push service báo hết hạn); tài khoản mới bật lại
 * trong Hồ sơ. Import động: push.ts → api.ts → store này.
 */
function forgetPush() {
  void import('@/features/reminder/push').then((m) => m.forgetPushOnThisBrowser()).catch(() => {})
}

/** Đưa tài khoản lên đầu danh sách (dùng gần nhất), giữ tối đa MAX_ACCOUNTS */
function promote(accounts: SavedAccount[], acc: SavedAccount): SavedAccount[] {
  return [acc, ...accounts.filter((a) => a.user.id !== acc.user.id)].slice(0, MAX_ACCOUNTS)
}

function activeOf(acc: SavedAccount) {
  return {
    token: acc.token,
    expiresAt: acc.expiresAt,
    refreshToken: acc.refreshToken ?? null,
    refreshExpiresAt: acc.refreshExpiresAt ?? null,
    user: acc.user,
  }
}

function accountFrom(auth: AuthResponse): SavedAccount {
  return {
    token: auth.access_token,
    expiresAt: auth.expires_at,
    refreshToken: auth.refresh_token,
    refreshExpiresAt: auth.refresh_expires_at,
    user: auth.user,
  }
}

export const useSession = create<SessionState>()(
  persist(
    (set, get) => ({
      ...emptyActive,
      accounts: [],
      setSession: (auth) => {
        const acc = accountFrom(auth)
        if (get().user && get().user!.id !== acc.user.id) forgetPush()
        set({ ...activeOf(acc), accounts: promote(get().accounts, acc) })
      },
      setUser: (user) => set((s) => ({ user, accounts: s.accounts.map((a) => (a.user.id === user.id ? { ...a, user } : a)) })),
      updateTokens: (userId, auth) =>
        set((s) => {
          const acc = { ...accountFrom(auth), user: s.accounts.find((a) => a.user.id === userId)?.user ?? auth.user }
          const accounts = s.accounts.map((a) => (a.user.id === userId ? acc : a))
          return s.user?.id === userId ? { ...activeOf(acc), accounts } : { accounts }
        }),
      logout: () => {
        forgetPush()
        revokeRefresh(get().accounts.find((a) => a.user.id === get().user?.id))
        const rest = get().accounts.filter((a) => a.user.id !== get().user?.id)
        const next = rest.find((a) => isSessionValid(a))
        set(next ? { ...activeOf(next), accounts: promote(rest, next) } : { ...emptyActive, accounts: rest })
        return !!next
      },
      logoutAll: () => {
        forgetPush()
        revokeRefresh(...get().accounts)
        set({ ...emptyActive, accounts: [] })
      },
      activate: (userId) => {
        const acc = get().accounts.find((a) => a.user.id === userId)
        if (!acc || !isSessionValid(acc)) return false
        if (get().user?.id !== userId) forgetPush()
        set({ ...activeOf(acc), accounts: promote(get().accounts, acc) })
        return true
      },
      deactivate: () => set(emptyActive),
      expireToken: (token) => {
        if (get().token !== token) return 'ignored'
        const expired = new Date(0).toISOString()
        // Hết phiên hẳn (làm mới cũng thất bại): bỏ cả refresh token — tài khoản hiện "đăng nhập lại"
        const accounts = get().accounts.map((a) =>
          a.token === token ? { ...a, expiresAt: expired, refreshToken: undefined, refreshExpiresAt: undefined } : a,
        )
        const next = accounts.find((a) => isSessionValid(a))
        if (next) {
          forgetPush()
          set({ ...activeOf(next), accounts: promote(accounts, next) })
          return 'switched'
        }
        set({ ...emptyActive, accounts })
        return 'expired'
      },
      removeAccount: (userId) => {
        if (get().user?.id === userId) return void get().logout()
        revokeRefresh(get().accounts.find((a) => a.user.id === userId))
        set((s) => ({ accounts: s.accounts.filter((a) => a.user.id !== userId) }))
      },
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      // v0 chỉ có 1 phiên → đưa vào danh sách tài khoản
      migrate: (persisted, version) => {
        const s = persisted as Partial<SessionState>
        if (version < 1 && s?.token && s.expiresAt && s.user) {
          return { ...s, accounts: [{ token: s.token, expiresAt: s.expiresAt, user: s.user }] } as SessionState
        }
        return { ...s, accounts: s?.accounts ?? [] } as SessionState
      },
    },
  ),
)

// Nhiều tab: tab khác đổi danh sách/tài khoản → nạp lại từ localStorage (tab cũ không ghi đè danh sách mới);
// tài khoản đang dùng bị đổi → tải lại tab để không hiện dữ liệu của tài khoản trước
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== STORAGE_KEY) return
    const before = useSession.getState().user?.id
    void Promise.resolve(useSession.persist.rehydrate()).then(() => {
      if (useSession.getState().user?.id !== before) window.location.reload()
    })
  })
}
