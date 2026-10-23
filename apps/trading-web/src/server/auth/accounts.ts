// Nhiều tài khoản trên cùng trình duyệt: cookie httpOnly chứa token (JWT đã ký) của các tài khoản đã đăng nhập.
// Token vẫn được kiểm chữ ký + hạn + token_version với DB mỗi lần dùng → đăng xuất ở nơi khác vẫn vô hiệu.
// KHÔNG import db ở file này (dùng chung với code không truy cập DB).

import { readSession, sessionCookieOptions } from './session'

export const ACCOUNTS_COOKIE = 'trading_accounts'
export const MAX_ACCOUNTS = 5

/** Đọc danh sách token từ cookie (JSON mảng chuỗi); hỏng → rỗng */
export function parseAccountTokens(value: string | undefined): string[] {
  if (!value) return []
  try {
    const list: unknown = JSON.parse(value)
    return Array.isArray(list) ? list.filter((t): t is string => typeof t === 'string' && t.length < 2048).slice(0, MAX_ACCOUNTS * 2) : []
  } catch {
    return []
  }
}

export interface AccountToken {
  token: string
  userId: string
  tokenVersion: number
}

/** Giải mã + kiểm chữ ký/hạn từng token (chưa so token_version — việc của route có DB) */
export async function decodeAccountTokens(tokens: string[]): Promise<AccountToken[]> {
  const out: AccountToken[] = []
  for (const token of tokens) {
    const s = await readSession(token)
    if (s) out.push({ token, userId: s.userId, tokenVersion: s.tokenVersion })
  }
  return out
}

/** Thêm token mới lên đầu, bỏ token cũ của cùng tài khoản, giữ tối đa MAX_ACCOUNTS */
export function mergeAccount(list: AccountToken[], added: AccountToken): AccountToken[] {
  return [added, ...list.filter((a) => a.userId !== added.userId)].slice(0, MAX_ACCOUNTS)
}

export const serializeAccounts = (list: AccountToken[]) => JSON.stringify(list.map((a) => a.token))

/** Chỉ gửi kèm request /api/auth/* (route duy nhất đọc cookie này) — không mang 5 token theo mọi request trang/tài nguyên */
export const ACCOUNTS_COOKIE_PATH = '/api/auth'
export const accountsCookieOptions = () => ({ ...sessionCookieOptions(), path: ACCOUNTS_COOKIE_PATH })
