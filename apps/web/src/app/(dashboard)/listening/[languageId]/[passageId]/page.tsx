'use client'

import Link from 'next/link'
import { useState } from 'react'
import { AudioButton } from '@/components/audio/AudioButton'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Mascot } from '@/components/mascot/Mascot'
import { ErrorState, Spinner } from '@/components/ui/States'
import { LevelBadge } from '@/features/grammar/components/LevelBadge'
import { ListeningQuestionCard } from '@/features/listening/components/ListeningQuestionCard'
import { listeningService } from '@/features/listening/listening.service'
import { useApi } from '@/hooks/useApi'

export default function ListeningPassagePage({ params }: { params: { languageId: string; passageId: string } }) {
  const { data: passage, error, loading, reload } = useApi(() => listeningService.getPassage(params.passageId), [params.passageId])
  const [showTranscript, setShowTranscript] = useState(false)

  if (loading) return <Spinner />
  if (error) return <ErrorState error={error} onRetry={reload} />
  if (!passage) return null

  return (
    <div className="space-y-6">
      <Link
        href={`/listening/${params.languageId}`}
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-indigo-600"
      >
        ← Danh sách bài luyện nghe
      </Link>

      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-slate-900">{passage.title}</h1>
        <LevelBadge level={passage.level} />
      </div>

      <Card className="flex flex-col items-center gap-4 text-center">
        <AudioButton text={passage.script} languageId={params.languageId} className="h-16 w-16 text-3xl" />
        <p className="text-sm text-slate-500">Nhấn để nghe đoạn audio. Có thể nghe lại nhiều lần trước khi trả lời.</p>
        <Button variant="ghost" size="sm" onClick={() => setShowTranscript((v) => !v)}>
          {showTranscript ? 'Ẩn văn bản' : 'Hiện văn bản (nếu cần)'}
        </Button>
        {showTranscript && <p className="rounded-xl bg-slate-50 p-3 text-left text-sm leading-relaxed text-slate-700">{passage.script}</p>}
      </Card>

      {passage.questions.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">❓ Câu hỏi</h2>
          {passage.questions.map((question, index) => (
            <ListeningQuestionCard key={question.id} question={question} index={index} />
          ))}
        </section>
      )}

      <Mascot message="Nghe kỹ trước khi trả lời nha! 🦩" />
    </div>
  )
}
