// Luật tổ chức B2B — HÀM THUẦN, dùng chung client/server: KHÔNG import module Node ở đây (trang client import ORG_ROLES).

export const ORG_ROLES = ['owner', 'instructor', 'student'] as const
export type OrgRole = (typeof ORG_ROLES)[number]

/** Owner / giảng viên xem được tiến độ cả lớp; học viên chỉ xem của mình */
export const canManage = (role: OrgRole) => role === 'owner' || role === 'instructor'

/** Mã mời 10 ký tự, bỏ ký tự dễ nhầm (0/O, 1/I/L); bytes = 10 byte ngẫu nhiên (server truyền vào) */
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
export const inviteCodeFrom = (bytes: Uint8Array) => [...bytes].map((b) => ALPHABET[b % ALPHABET.length]).join('')

export interface ProgressRow {
  lessonKey: string
  bestScore: number
  completedAt: Date | null
}

export interface CurriculumProgress {
  completed: number
  total: number
  pct: number // 0–100, làm tròn xuống
  avg_score: number | null // điểm quiz cao nhất trung bình trên các bài đã làm
  completed_at: string | null // lúc hoàn thành bài cuối cùng (chỉ khi đủ 100%)
}

/** Tiến độ theo chương trình: 1 bài tính xong nếu đã đạt ở BẤT KỲ ngôn ngữ nào (gộp theo translation_key) */
export function curriculumProgress(curriculum: string[], rows: ProgressRow[]): CurriculumProgress {
  const keys = new Set(curriculum)
  const best = new Map<string, { score: number; done: Date | null }>()
  for (const r of rows) {
    if (!keys.has(r.lessonKey)) continue
    const cur = best.get(r.lessonKey)
    const done = r.completedAt && (!cur?.done || r.completedAt < cur.done) ? r.completedAt : (cur?.done ?? null)
    best.set(r.lessonKey, { score: Math.max(cur?.score ?? 0, r.bestScore), done })
  }
  const total = keys.size
  const doneDates = [...best.values()].map((b) => b.done).filter((d): d is Date => d !== null)
  const completed = doneDates.length
  const scores = [...best.values()].map((b) => b.score)
  return {
    completed,
    total,
    pct: total === 0 ? 0 : Math.floor((completed / total) * 100),
    avg_score: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
    completed_at: total > 0 && completed === total ? new Date(Math.max(...doneDates.map((d) => d.getTime()))).toISOString() : null,
  }
}

/** Đổi vai trò / xoá thành viên: chỉ owner; không để tổ chức mất owner cuối cùng */
export function checkMemberChange(
  actor: OrgRole,
  target: { role: OrgRole; isSelf: boolean },
  next: OrgRole | null, // null = xoá khỏi tổ chức
  ownerCount: number,
): 'OK' | 'FORBIDDEN' | 'LAST_OWNER' {
  if (actor !== 'owner') return target.isSelf && next === null && target.role !== 'owner' ? 'OK' : 'FORBIDDEN' // ai cũng tự rời được (trừ owner)
  if (target.role === 'owner' && next !== 'owner' && ownerCount <= 1) return 'LAST_OWNER'
  return 'OK'
}
