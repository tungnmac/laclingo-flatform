/** User trả về cho client — không có password_hash. File riêng để client import type không kéo theo code server. */
export interface SessionUser {
  id: string
  email: string
  display_name: string
  role: string
}
