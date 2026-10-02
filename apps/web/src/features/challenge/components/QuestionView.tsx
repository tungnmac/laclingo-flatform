'use client'

import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/utils'
import type {
  ChallengeLeaderboardEntry,
  WsAnswerResultPayload,
  WsQuestionEndedPayload,
  WsQuestionPayload,
} from '@/types/api'
import type { GamePhase } from '../hooks/useChallengeSocket'
import { participantName } from '../utils'

const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F']

export function QuestionView({
  phase,
  question,
  timeLeft,
  myAnswer,
  answerResult,
  reveal,
  leaderboard,
  myUserId,
  onSubmit,
}: {
  phase: GamePhase
  question: WsQuestionPayload | null
  timeLeft: number
  myAnswer: number | null
  answerResult: WsAnswerResultPayload | null
  reveal: WsQuestionEndedPayload | null
  leaderboard: ChallengeLeaderboardEntry[]
  myUserId?: string
  onSubmit: (selectedIndex: number) => void
}) {
  if (!question) return null

  const percent = question.time_limit_seconds === 0 ? 0 : Math.round((timeLeft / question.time_limit_seconds) * 100)
  const revealing = phase === 'reveal' && reveal !== null
  const answered = myAnswer !== null

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-2 flex items-center justify-between text-sm text-slate-600">
          <span>
            Câu {question.index + 1}/{question.total}
          </span>
          <span className="font-semibold">{timeLeft}s</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className={cn('h-full rounded-full transition-all duration-300', percent <= 25 ? 'bg-rose-500' : 'bg-indigo-500')}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <Card>
        <p className="text-center text-lg font-semibold text-slate-900 sm:text-xl">{question.question}</p>
      </Card>

      {answerResult && !revealing && (
        <p
          className={cn(
            'rounded-lg px-3 py-2 text-center text-sm font-medium ring-1',
            answerResult.correct ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-rose-50 text-rose-700 ring-rose-200',
          )}
        >
          {answerResult.correct ? `Chính xác! +${answerResult.points_earned} điểm` : 'Chưa đúng — 0 điểm'}
        </p>
      )}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
        {question.options.map((option, i) => {
          const isCorrect = revealing && reveal!.correct_index === i
          const isMyWrong = revealing && myAnswer === i && reveal!.correct_index !== i
          const isSelectedPending = !revealing && myAnswer === i

          return (
            <button
              key={i}
              type="button"
              disabled={answered || revealing}
              onClick={() => onSubmit(i)}
              className={cn(
                'flex items-center gap-3 rounded-xl px-4 py-3 text-left font-medium shadow-sm ring-1 transition disabled:cursor-not-allowed',
                isCorrect && 'bg-emerald-600 text-white ring-emerald-600',
                isMyWrong && 'bg-rose-600 text-white ring-rose-600',
                isSelectedPending && 'bg-indigo-600 text-white ring-indigo-600',
                !isCorrect && !isMyWrong && !isSelectedPending && 'bg-white text-slate-900 ring-slate-200 hover:bg-slate-50 disabled:opacity-60',
              )}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black/10 text-sm font-bold">
                {optionLetters[i] ?? i + 1}
              </span>
              {option}
            </button>
          )
        })}
      </div>

      {answered && !revealing && <p className="text-center text-sm text-slate-500">Đã gửi câu trả lời, chờ người khác...</p>}

      {revealing && leaderboard.length > 0 && (
        <Card>
          <h3 className="mb-3 text-sm font-semibold text-slate-900">Bảng xếp hạng</h3>
          <ol className="space-y-2">
            {leaderboard.slice(0, 5).map((entry) => (
              <li
                key={entry.user_id}
                className={cn('flex items-center justify-between text-sm', entry.user_id === myUserId && 'font-bold text-indigo-600')}
              >
                <span>
                  {entry.rank}. {participantName(entry)}
                </span>
                <span>{entry.score} điểm</span>
              </li>
            ))}
          </ol>
        </Card>
      )}
    </div>
  )
}
