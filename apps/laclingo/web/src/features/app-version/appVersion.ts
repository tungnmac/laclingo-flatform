import { registerPlugin } from '@capacitor/core'
import { apiFetch } from '@/lib/api'
import { isNativeApp, nativePlatform } from '@/lib/native'
import type { AppPlatform, AppVersionInfo, AppVersionRequest } from '@/types/api'

// Phiên bản vỏ native (Capacitor) đang cài — web nạp từ server nên luôn mới, chỉ vỏ native mới có thể cũ.
// Plugin @capacitor/app cài ở apps/laclingo/mobile; app build trước khi có plugin thì không kiểm tra được (bỏ qua).

interface AppPlugin {
  getInfo(): Promise<{ version: string; build: string }>
}

const CapacitorApp = registerPlugin<AppPlugin>('App')

export const appVersionService = {
  get: (platform: AppPlatform) => apiFetch<AppVersionInfo>(`/app/version?platform=${platform}`),
  // Admin (module app_versions)
  list: () => apiFetch<AppVersionInfo[]>('/admin/app-versions'),
  update: (platform: AppPlatform, body: AppVersionRequest) =>
    apiFetch<AppVersionInfo>(`/admin/app-versions/${platform}`, { method: 'PUT', body: JSON.stringify(body), notify: false }),
}

/** Phần số ở đầu phiên bản ("1.2.3 (45)", "1.2.3-beta" → "1.2.3"); không có (vd bản debug "dev") → null */
function numericVersion(v: string): string | null {
  return /^\d+(\.\d+)*/.exec(v.trim())?.[0] ?? null
}

/** So sánh "1.2.10" với "1.10" theo từng phần số (thiếu phần = 0) — khớp compareVersions ở backend */
export function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map((n) => parseInt(n, 10) || 0)
  const pb = b.split('.').map((n) => parseInt(n, 10) || 0)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0)
    if (d !== 0) return d < 0 ? -1 : 1
  }
  return 0
}

export type UpdateStatus = { kind: 'ok' } | { kind: 'force' | 'soft'; info: AppVersionInfo }

/** App iOS/Android: so phiên bản đang cài với cấu hình server. Web / lỗi / không đọc được phiên bản → 'ok'. */
export async function checkAppVersion(): Promise<UpdateStatus> {
  if (!isNativeApp()) return { kind: 'ok' }
  const platform = nativePlatform()
  if (platform !== 'ios' && platform !== 'android') return { kind: 'ok' }
  try {
    const [{ version: raw }, info] = await Promise.all([CapacitorApp.getInfo(), appVersionService.get(platform)])
    const version = numericVersion(raw)
    if (!version) return { kind: 'ok' } // không đọc được phiên bản — không chặn
    if (compareVersions(version, info.min_version) < 0) return { kind: 'force', info }
    if (compareVersions(version, info.latest_version) < 0) return { kind: 'soft', info }
  } catch {
    // mất mạng / app cũ chưa có plugin App — không chặn người dùng
  }
  return { kind: 'ok' }
}
