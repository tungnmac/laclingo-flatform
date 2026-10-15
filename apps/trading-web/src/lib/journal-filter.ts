/**
 * Giá trị `account` trên URL hợp lệ với select: current / all / id ví cũ của chính user.
 * id ví đang dùng → current (để server quyết toán trước); id lạ (link của người khác, ví đã xoá…) → current.
 */
export function normalizeAccountFilter(account: string, accounts: { id: string; is_active: boolean }[]): string {
  if (account === 'current' || account === 'all') return account
  const match = accounts.find((a) => a.id === account)
  return match && !match.is_active ? account : 'current'
}
