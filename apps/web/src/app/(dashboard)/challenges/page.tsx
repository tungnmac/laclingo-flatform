'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { challengeService } from '@/features/challenge/challenge.service'

const inputClass =
  'mt-1 block w-full rounded-lg border-0 px-3 py-2.5 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600'

export default function ChallengesPage() {
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)

  const onCreate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    setCreating(true)
    setCreateError(null)
    try {
      const difficulty = Number(form.get('difficulty'))
      const room = await challengeService.createRoom({
        question_count: Number(form.get('question_count')),
        time_per_question_seconds: Number(form.get('time_per_question_seconds')),
        difficulty: difficulty || undefined,
        is_practice: form.get('is_practice') === 'on',
      })
      router.push(`/challenges/${room.id}`)
    } catch (err) {
      setCreateError((err as Error).message)
      setCreating(false)
    }
  }

  const onJoin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const code = String(form.get('code') ?? '').trim().toUpperCase()
    setJoining(true)
    setJoinError(null)
    try {
      const participant = await challengeService.joinRoom(code)
      router.push(`/challenges/${participant.room_id}`)
    } catch (err) {
      setJoinError((err as Error).message)
      setJoining(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Thách đấu" description="Tạo phòng thử thách kiểu game show hoặc tham gia bằng mã." />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Card>
          <h2 className="mb-1 text-lg font-semibold text-slate-900">🎮 Tạo phòng mới</h2>
          <p className="mb-4 text-sm text-slate-500">Mời bạn bè cùng thi đấu — bạn sẽ là chủ phòng.</p>
          <form onSubmit={onCreate} className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              Số câu hỏi
              <input name="question_count" type="number" min={1} max={50} defaultValue={10} required className={inputClass} />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Thời gian mỗi câu (giây)
              <input
                name="time_per_question_seconds"
                type="number"
                min={5}
                max={120}
                defaultValue={20}
                required
                className={inputClass}
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Độ khó
              <select name="difficulty" defaultValue="" className={inputClass}>
                <option value="">Bất kỳ</option>
                <option value="1">1 — Dễ</option>
                <option value="2">2</option>
                <option value="3">3 — Trung bình</option>
                <option value="4">4</option>
                <option value="5">5 — Khó</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input name="is_practice" type="checkbox" className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" />
              Chế độ luyện tập (không xếp hạng)
            </label>
            {createError && (
              <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
                {createError}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={creating}>
              {creating ? 'Đang tạo...' : 'Tạo phòng'}
            </Button>
          </form>
        </Card>

        <Card>
          <h2 className="mb-1 text-lg font-semibold text-slate-900">🔑 Tham gia bằng mã</h2>
          <p className="mb-4 text-sm text-slate-500">Nhập mã phòng mà chủ phòng vừa chia sẻ.</p>
          <form onSubmit={onJoin} className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              Mã phòng
              <input
                name="code"
                type="text"
                required
                maxLength={8}
                autoCapitalize="characters"
                placeholder="AB3K9Z"
                className={`${inputClass} text-center text-lg font-bold uppercase tracking-widest`}
              />
            </label>
            {joinError && (
              <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
                {joinError}
              </p>
            )}
            <Button type="submit" variant="secondary" className="w-full" disabled={joining}>
              {joining ? 'Đang tham gia...' : 'Tham gia'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
