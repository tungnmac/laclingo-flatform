import { and, count, eq, gt, inArray, isNotNull, max, ne, sql } from 'drizzle-orm'
import type { z } from 'zod'
import type { Locale } from '@/i18n/locales'
import type { SessionUser } from '../auth/types'
import { db } from '../db/client'
import { chapters, lessonProgress, lessons, orgCompletions, orgCurriculum, orgMembers, organizations, trades, tradingAccounts, users, type OrganizationRow } from '../db/schema'
import { HttpError, isUniqueViolation } from '../http'
import { D } from '../trading/decimal'
import { randomBytes } from 'node:crypto'
import { canManage, checkMemberChange, curriculumProgress, inviteCodeFrom, type CurriculumProgress, type OrgRole } from './rules'
import type { addMemberSchema, curriculumSchema, orgCreateSchema, orgPatchSchema } from './validation'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const DAY = 86_400_000
const newInviteCode = () => inviteCodeFrom(randomBytes(10))

// ── Dùng chung ──

/** Chương trình = các mã bài còn tồn tại (bài bị xoá / đổi translation_key không làm kẹt tiến độ ở dưới 100%) */
async function curriculumOf(orgId: string): Promise<string[]> {
  const rows = await db
    .selectDistinct({ k: orgCurriculum.lessonKey })
    .from(orgCurriculum)
    .innerJoin(lessons, eq(lessons.translationKey, orgCurriculum.lessonKey))
    .where(eq(orgCurriculum.orgId, orgId))
  return rows.map((r) => r.k)
}

/** Ghi lần hoàn thành đầu tiên (không ghi đè) cho các thành viên vừa đạt 100% */
async function recordCompletions(orgId: string, progress: Map<string, CurriculumProgress>): Promise<void> {
  const done = [...progress.entries()].filter(([, p]) => p.completed_at !== null)
  if (done.length === 0) return
  await db
    .insert(orgCompletions)
    .values(done.map(([userId, p]) => ({ orgId, userId, completedAt: new Date(p.completed_at!), lessons: p.total, avgScore: p.avg_score })))
    .onConflictDoNothing()
}

/** Thành viên tính ghế: mọi người trừ owner */
const seatsUsed = (ex: Pick<typeof db, 'select'>, orgId: string) =>
  ex.select({ n: count() }).from(orgMembers).where(and(eq(orgMembers.orgId, orgId), ne(orgMembers.role, 'owner')))

/** Tiến độ của nhiều user theo chương trình (gộp vi/en qua translation_key) */
async function progressOf(userIds: string[], curriculum: string[]): Promise<Map<string, CurriculumProgress>> {
  const rows =
    userIds.length && curriculum.length
      ? await db
          .select({ userId: lessonProgress.userId, lessonKey: lessons.translationKey, bestScore: lessonProgress.bestScore, completedAt: lessonProgress.completedAt })
          .from(lessonProgress)
          .innerJoin(lessons, eq(lessons.id, lessonProgress.lessonId))
          .where(and(inArray(lessonProgress.userId, userIds), inArray(lessons.translationKey, curriculum)))
      : []
  const byUser = new Map<string, { lessonKey: string; bestScore: number; completedAt: Date | null }[]>()
  for (const r of rows) {
    const list = byUser.get(r.userId) ?? []
    list.push({ lessonKey: r.lessonKey!, bestScore: r.bestScore, completedAt: r.completedAt })
    byUser.set(r.userId, list)
  }
  return new Map(userIds.map((u) => [u, curriculumProgress(curriculum, byUser.get(u) ?? [])]))
}

async function membership(userId: string, slug: string): Promise<{ org: OrganizationRow; role: OrgRole }> {
  const [row] = await db
    .select({ org: organizations, role: orgMembers.role })
    .from(orgMembers)
    .innerJoin(organizations, eq(organizations.id, orgMembers.orgId))
    .where(and(eq(orgMembers.userId, userId), eq(organizations.slug, slug)))
  if (!row) throw new HttpError(404, 'NOT_FOUND') // không là thành viên → như không tồn tại
  return { org: row.org, role: row.role as OrgRole }
}

/** Pro qua tổ chức: hạn Pro muộn nhất trong các tổ chức user đang là thành viên (null = không có) */
export async function orgProUntil(userId: string, now = new Date()): Promise<Date | null> {
  const [r] = await db
    .select({ until: max(organizations.proUntil) })
    .from(orgMembers)
    .innerJoin(organizations, eq(organizations.id, orgMembers.orgId))
    .where(and(eq(orgMembers.userId, userId), isNotNull(organizations.proUntil), gt(organizations.proUntil, now)))
  return r?.until ? new Date(r.until) : null
}

// ── Người dùng ──

export interface MyOrgDto {
  slug: string
  name: string
  role: OrgRole
  pro_until: string | null
  progress: CurriculumProgress
}

export async function listMyOrgs(userId: string): Promise<MyOrgDto[]> {
  const rows = await db
    .select({ org: organizations, role: orgMembers.role })
    .from(orgMembers)
    .innerJoin(organizations, eq(organizations.id, orgMembers.orgId))
    .where(eq(orgMembers.userId, userId))
  return Promise.all(
    rows.map(async ({ org, role }) => {
      const progress = await progressOf([userId], await curriculumOf(org.id))
      await recordCompletions(org.id, progress)
      return { slug: org.slug, name: org.name, role: role as OrgRole, pro_until: org.proUntil?.toISOString() ?? null, progress: progress.get(userId)! }
    }),
  )
}

export async function inviteInfo(userId: string, code: string): Promise<{ name: string; slug: string; member: boolean }> {
  const [org] = await db.select().from(organizations).where(eq(organizations.inviteCode, code.trim().toUpperCase()))
  if (!org) throw new HttpError(404, 'INVALID_INVITE')
  const [m] = await db.select({ r: orgMembers.role }).from(orgMembers).where(and(eq(orgMembers.orgId, org.id), eq(orgMembers.userId, userId)))
  return { name: org.name, slug: org.slug, member: Boolean(m) }
}

/** Tham gia bằng mã mời (vai trò học viên); khoá dòng tổ chức để không vượt số ghế khi nhiều người cùng tham gia */
export async function joinByCode(userId: string, code: string): Promise<{ slug: string }> {
  return db.transaction(async (tx) => {
    const [org] = await tx.select().from(organizations).where(eq(organizations.inviteCode, code)).for('update')
    if (!org) throw new HttpError(404, 'INVALID_INVITE')
    const [already] = await tx.select({ r: orgMembers.role }).from(orgMembers).where(and(eq(orgMembers.orgId, org.id), eq(orgMembers.userId, userId)))
    if (already) throw new HttpError(409, 'ALREADY_MEMBER')
    const [{ n }] = await seatsUsed(tx, org.id)
    if (n >= org.seatLimit) throw new HttpError(409, 'ORG_FULL')
    try {
      await tx.insert(orgMembers).values({ orgId: org.id, userId, role: 'student' })
    } catch (err) {
      if (isUniqueViolation(err)) throw new HttpError(409, 'ALREADY_MEMBER')
      throw err
    }
    return { slug: org.slug }
  })
}

export interface MemberRowDto {
  user_id: string
  display_name: string
  email: string
  role: OrgRole
  joined_at: string
  progress: CurriculumProgress
  trades_30d: number // lệnh ví ảo TradeLab 30 ngày gần nhất
  net_pnl_30d: string
  last_active: string | null
}

export interface OrgDashboardDto {
  viewer_id: string
  slug: string
  name: string
  role: OrgRole
  pro_until: string | null
  seat_limit: number
  seats_used: number // thành viên trừ owner
  invite_code: string | null // chỉ owner/giảng viên
  curriculum_size: number
  me: CurriculumProgress
  members: MemberRowDto[] // rỗng với học viên
}

export async function getOrgDashboard(user: SessionUser, slug: string): Promise<OrgDashboardDto> {
  const { org, role } = await membership(user.id, slug)
  const curriculum = await curriculumOf(org.id)
  const manager = canManage(role)
  const memberRows = await db
    .select({ m: orgMembers, name: users.displayName, email: users.email })
    .from(orgMembers)
    .innerJoin(users, eq(users.id, orgMembers.userId))
    .where(eq(orgMembers.orgId, org.id))
  const ids = manager ? memberRows.map((r) => r.m.userId) : [user.id]
  const progress = await progressOf(ids, curriculum)
  await recordCompletions(org.id, progress)
  let members: MemberRowDto[] = []
  if (manager && ids.length) {
    const since = new Date(Date.now() - 30 * DAY)
    const [tradeAgg, lastTrade, lastLesson] = await Promise.all([
      db
        .select({ userId: tradingAccounts.userId, n: count(), net: sql<string>`coalesce(sum(${trades.realizedPnl} - ${trades.fee}), 0)` })
        .from(trades)
        .innerJoin(tradingAccounts, eq(tradingAccounts.id, trades.accountId))
        .where(and(inArray(tradingAccounts.userId, ids), gt(trades.executedAt, since)))
        .groupBy(tradingAccounts.userId),
      db
        .select({ userId: tradingAccounts.userId, at: max(trades.executedAt) })
        .from(trades)
        .innerJoin(tradingAccounts, eq(tradingAccounts.id, trades.accountId))
        .where(inArray(tradingAccounts.userId, ids))
        .groupBy(tradingAccounts.userId),
      db.select({ userId: lessonProgress.userId, at: max(lessonProgress.updatedAt) }).from(lessonProgress).where(inArray(lessonProgress.userId, ids)).groupBy(lessonProgress.userId),
    ])
    const agg = new Map(tradeAgg.map((r) => [r.userId, r]))
    const tradeAt = new Map(lastTrade.map((r) => [r.userId, r.at]))
    const lessonAt = new Map(lastLesson.map((r) => [r.userId, r.at]))
    const latest = (u: string) => {
      const ts = [tradeAt.get(u), lessonAt.get(u)].filter(Boolean).map((d) => new Date(d!).getTime())
      return ts.length ? new Date(Math.max(...ts)).toISOString() : null
    }
    const order: Record<OrgRole, number> = { owner: 0, instructor: 1, student: 2 }
    members = memberRows
      .map(({ m, name, email }) => ({
        user_id: m.userId,
        display_name: name,
        email,
        role: m.role as OrgRole,
        joined_at: m.joinedAt.toISOString(),
        progress: progress.get(m.userId)!,
        trades_30d: agg.get(m.userId)?.n ?? 0,
        net_pnl_30d: D(agg.get(m.userId)?.net ?? '0').toDecimalPlaces(2).toString(),
        last_active: latest(m.userId),
      }))
      .sort((a, b) => order[a.role] - order[b.role] || b.progress.pct - a.progress.pct || a.display_name.localeCompare(b.display_name))
  }
  return {
    viewer_id: user.id,
    slug: org.slug,
    name: org.name,
    role,
    pro_until: org.proUntil?.toISOString() ?? null,
    seat_limit: org.seatLimit,
    seats_used: memberRows.filter((r) => r.m.role !== 'owner').length,
    invite_code: manager ? org.inviteCode : null,
    curriculum_size: curriculum.length,
    me: progress.get(user.id) ?? curriculumProgress(curriculum, []),
    members,
  }
}

/** Đổi vai trò (chỉ owner) */
export async function changeMemberRole(actor: SessionUser, slug: string, targetId: string, next: OrgRole): Promise<void> {
  await changeMember(actor, slug, targetId, next)
}

/** Xoá thành viên (owner) hoặc tự rời tổ chức */
export async function removeMember(actor: SessionUser, slug: string, targetId: string): Promise<void> {
  await changeMember(actor, slug, targetId, null)
}

async function changeMember(actor: SessionUser, slug: string, targetId: string, next: OrgRole | null) {
  if (!UUID.test(targetId)) throw new HttpError(404, 'NOT_FOUND')
  const { org } = await membership(actor.id, slug)
  await db.transaction(async (tx) => {
    await tx.select({ id: organizations.id }).from(organizations).where(eq(organizations.id, org.id)).for('update') // tuần tự hoá thay đổi vai trò
    // đọc lại vai trò của người thao tác SAU khi khoá (có thể vừa bị owner khác hạ quyền)
    const [me] = await tx.select({ role: orgMembers.role }).from(orgMembers).where(and(eq(orgMembers.orgId, org.id), eq(orgMembers.userId, actor.id)))
    if (!me) throw new HttpError(404, 'NOT_FOUND')
    const role = me.role as OrgRole
    const [target] = await tx.select().from(orgMembers).where(and(eq(orgMembers.orgId, org.id), eq(orgMembers.userId, targetId)))
    if (!target) throw new HttpError(404, 'NOT_FOUND')
    // owner → học viên/giảng viên chiếm thêm 1 ghế
    if (target.role === 'owner' && next !== null && next !== 'owner') {
      const [{ n }] = await seatsUsed(tx, org.id)
      if (n >= org.seatLimit) throw new HttpError(409, 'ORG_FULL')
    }
    const [{ owners }] = await tx.select({ owners: count() }).from(orgMembers).where(and(eq(orgMembers.orgId, org.id), eq(orgMembers.role, 'owner')))
    const verdict = checkMemberChange(role, { role: target.role as OrgRole, isSelf: targetId === actor.id }, next, owners)
    if (verdict === 'FORBIDDEN') throw new HttpError(403, 'FORBIDDEN')
    if (verdict === 'LAST_OWNER') throw new HttpError(409, 'LAST_OWNER')
    if (next === null) await tx.delete(orgMembers).where(and(eq(orgMembers.orgId, org.id), eq(orgMembers.userId, targetId)))
    else await tx.update(orgMembers).set({ role: next }).where(and(eq(orgMembers.orgId, org.id), eq(orgMembers.userId, targetId)))
  })
}

export interface CertificateDto {
  org_name: string
  display_name: string
  completed_at: string
  lessons: number
  avg_score: number | null
}

/** Chứng nhận hoàn thành: chỉ khi học xong 100% chương trình (chương trình rỗng → không cấp) */
export async function getCertificate(user: SessionUser, slug: string): Promise<CertificateDto> {
  const { org } = await membership(user.id, slug)
  await recordCompletions(org.id, await progressOf([user.id], await curriculumOf(org.id)))
  const [c] = await db.select().from(orgCompletions).where(and(eq(orgCompletions.orgId, org.id), eq(orgCompletions.userId, user.id)))
  if (!c) throw new HttpError(409, 'CURRICULUM_NOT_COMPLETED')
  return { org_name: org.name, display_name: user.display_name, completed_at: c.completedAt.toISOString(), lessons: c.lessons, avg_score: c.avgScore }
}

// ── Admin nền tảng ──

export interface AdminOrgDto {
  id: string
  name: string
  slug: string
  invite_code: string
  seat_limit: number
  seats_used: number
  pro_until: string | null
  curriculum_size: number
  owners: string[] // email
}

export async function listOrgsAdmin(): Promise<AdminOrgDto[]> {
  const orgs = await db.select().from(organizations).orderBy(organizations.name)
  if (orgs.length === 0) return []
  const ids = orgs.map((o) => o.id)
  const [members, curr] = await Promise.all([
    db.select({ orgId: orgMembers.orgId, role: orgMembers.role, email: users.email }).from(orgMembers).innerJoin(users, eq(users.id, orgMembers.userId)).where(inArray(orgMembers.orgId, ids)),
    db.select({ orgId: orgCurriculum.orgId, n: count() }).from(orgCurriculum).where(inArray(orgCurriculum.orgId, ids)).groupBy(orgCurriculum.orgId),
  ])
  return orgs.map((o) => ({
    id: o.id,
    name: o.name,
    slug: o.slug,
    invite_code: o.inviteCode,
    seat_limit: o.seatLimit,
    seats_used: members.filter((m) => m.orgId === o.id && m.role !== 'owner').length,
    pro_until: o.proUntil?.toISOString() ?? null,
    curriculum_size: curr.find((c) => c.orgId === o.id)?.n ?? 0,
    owners: members.filter((m) => m.orgId === o.id && m.role === 'owner').map((m) => m.email),
  }))
}

export async function createOrg(input: z.infer<typeof orgCreateSchema>): Promise<{ id: string }> {
  try {
    const [row] = await db
      .insert(organizations)
      .values({ name: input.name, slug: input.slug, seatLimit: input.seat_limit, proUntil: input.pro_until, inviteCode: newInviteCode() })
      .returning({ id: organizations.id })
    return row
  } catch (err) {
    if (isUniqueViolation(err)) throw new HttpError(409, 'SLUG_TAKEN')
    throw err
  }
}

export async function updateOrg(id: string, input: z.infer<typeof orgPatchSchema>): Promise<void> {
  if (!UUID.test(id)) throw new HttpError(404, 'NOT_FOUND')
  const rows = await db
    .update(organizations)
    .set({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.seat_limit !== undefined && { seatLimit: input.seat_limit }),
      ...(input.pro_until !== undefined && { proUntil: input.pro_until }),
      ...(input.regenerate_invite && { inviteCode: newInviteCode() }),
    })
    .where(eq(organizations.id, id))
    .returning({ id: organizations.id })
  if (rows.length === 0) throw new HttpError(404, 'NOT_FOUND')
}

export async function deleteOrg(id: string): Promise<void> {
  if (!UUID.test(id)) throw new HttpError(404, 'NOT_FOUND')
  const rows = await db.delete(organizations).where(eq(organizations.id, id)).returning({ id: organizations.id })
  if (rows.length === 0) throw new HttpError(404, 'NOT_FOUND')
}

/** Admin thêm thành viên theo email (thường là owner đầu tiên); đã là thành viên → đổi vai trò */
export async function addMemberAdmin(orgId: string, input: z.infer<typeof addMemberSchema>): Promise<void> {
  if (!UUID.test(orgId)) throw new HttpError(404, 'NOT_FOUND')
  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.email, input.email))
  if (!user) throw new HttpError(404, 'USER_NOT_FOUND')
  await db.transaction(async (tx) => {
    const [org] = await tx.select({ id: organizations.id }).from(organizations).where(eq(organizations.id, orgId)).for('update')
    if (!org) throw new HttpError(404, 'NOT_FOUND')
    const [cur] = await tx.select({ role: orgMembers.role }).from(orgMembers).where(and(eq(orgMembers.orgId, orgId), eq(orgMembers.userId, user.id)))
    if (cur?.role === 'owner' && input.role !== 'owner') {
      const [{ owners }] = await tx.select({ owners: count() }).from(orgMembers).where(and(eq(orgMembers.orgId, orgId), eq(orgMembers.role, 'owner')))
      if (owners <= 1) throw new HttpError(409, 'LAST_OWNER')
    }
    // admin được phép vượt số ghế (VD thêm giảng viên ngoài hợp đồng) — chủ động, có kiểm soát
    await tx
      .insert(orgMembers)
      .values({ orgId, userId: user.id, role: input.role })
      .onConflictDoUpdate({ target: [orgMembers.orgId, orgMembers.userId], set: { role: input.role } })
  })
}

export interface CurriculumChapterDto {
  id: string
  title: string
  level: string
  lessons: number
  selected: boolean
}

/** Danh sách chương (theo ngôn ngữ giao diện admin) + chương nào đang thuộc chương trình của tổ chức */
export async function getCurriculumAdmin(orgId: string, locale: Locale): Promise<CurriculumChapterDto[]> {
  if (!UUID.test(orgId)) throw new HttpError(404, 'NOT_FOUND')
  const [chs, ls, selected] = await Promise.all([
    db.select().from(chapters).where(and(eq(chapters.locale, locale), eq(chapters.published, true))).orderBy(chapters.position),
    db
      .select({ chapterId: lessons.chapterId, key: lessons.translationKey })
      .from(lessons)
      .where(and(eq(lessons.locale, locale), eq(lessons.published, true), isNotNull(lessons.translationKey))),
    curriculumOf(orgId),
  ])
  const sel = new Set(selected)
  return chs.map((c) => {
    const keys = ls.filter((l) => l.chapterId === c.id).map((l) => l.key!)
    return { id: c.id, title: c.title, level: c.level, lessons: keys.length, selected: keys.length > 0 && keys.every((k) => sel.has(k)) }
  })
}

/** Đặt chương trình = mọi bài (đã công bố, có translation_key) của các chương đã chọn */
export async function setCurriculum(orgId: string, input: z.infer<typeof curriculumSchema>): Promise<{ lessons: number }> {
  if (!UUID.test(orgId)) throw new HttpError(404, 'NOT_FOUND')
  const [org] = await db.select({ id: organizations.id }).from(organizations).where(eq(organizations.id, orgId))
  if (!org) throw new HttpError(404, 'NOT_FOUND')
  const keys = input.chapter_ids.length
    ? (
        await db
          .select({ key: lessons.translationKey })
          .from(lessons)
          .innerJoin(chapters, eq(chapters.id, lessons.chapterId))
          .where(and(inArray(lessons.chapterId, input.chapter_ids), eq(lessons.published, true), eq(chapters.published, true), isNotNull(lessons.translationKey)))
      ).map((r) => r.key!)
    : []
  const unique = [...new Set(keys)]
  await db.transaction(async (tx) => {
    await tx.delete(orgCurriculum).where(eq(orgCurriculum.orgId, orgId))
    if (unique.length) await tx.insert(orgCurriculum).values(unique.map((lessonKey) => ({ orgId, lessonKey })))
  })
  return { lessons: unique.length }
}
