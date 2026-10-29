'use client'

import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { Card } from '@/components/ui/Card'
import { Mascot } from '@/components/mascot/Mascot'
import { ErrorState, Spinner } from '@/components/ui/States'
import { courseService } from '@/features/course/course.service'
import { LevelBadge } from '@/features/grammar/components/LevelBadge'
import { ListeningQuestionCard } from '@/features/listening/components/ListeningQuestionCard'
import { ScriptPlayer } from '@/features/listening/components/ScriptPlayer'
import { listeningService } from '@/features/listening/listening.service'
import { useApi } from '@/hooks/useApi'
import { useTranslation } from '@/hooks/useTranslation'

export default function ListeningPassagePage({ params }: { params: { languageId: string; passageId: string } }) {
  const { data: passage, error, loading, reload } = useApi(() => listeningService.getPassage(params.passageId), [params.passageId])
  const { data: language } = useApi(() => courseService.getById(params.languageId), [params.languageId])
  const t = useTranslation()

  if (loading) return <Spinner />
  if (error) return <ErrorState error={error} onRetry={reload} />
  if (!passage) return null

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: t.nav.listening, href: '/listening' },
          passage.topic
            ? { label: passage.topic, href: `/listening/${params.languageId}/topic?name=${encodeURIComponent(passage.topic)}` }
            : { label: language?.name ?? params.languageId, href: `/listening/${params.languageId}` },
          { label: passage.title },
        ]}
      />

      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-slate-900">{passage.title}</h1>
        <LevelBadge level={passage.level} />
      </div>

      <Card className="flex flex-col items-center gap-4 text-center">
        <ScriptPlayer script={passage.script} languageId={params.languageId} audioUrl={passage.audio_url} />
      </Card>

      {passage.questions.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">{t.listening.questionsTitle}</h2>
          {passage.questions.map((question, index) => (
            <ListeningQuestionCard key={question.id} question={question} index={index} />
          ))}
        </section>
      )}

      <Mascot message={t.listening.mascotListen} />
    </div>
  )
}
