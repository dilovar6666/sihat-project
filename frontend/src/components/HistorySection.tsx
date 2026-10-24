import React from 'react'
import { FileDown, Trash2, Calendar, ShieldCheck } from 'lucide-react'
import { Card } from './ui/Card'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import type { Language } from '../i18n'
import type { SavedResult } from '../types'

interface HistorySectionProps {
  results: SavedResult[]
  onDownloadPdf: (resultId: string) => void
  onDeleteResult: (resultId: string) => void
  onClearAll: () => void
  onOpenCatalog: () => void
  token: string
  onOpenAuth: () => void
  lang?: Language
}

export const HistorySection: React.FC<HistorySectionProps> = ({
  results,
  onDownloadPdf,
  onDeleteResult,
  onClearAll,
  onOpenCatalog,
  token,
  onOpenAuth,
  lang = 'ru',
}) => {
  const labels = {
    ru: {
      authTitle: 'Личный закрытый архив',
      authDesc: 'История сохранённых результатов доступна только авторизованным владельцам записей.',
      authBtn: 'Войти в аккаунт',
      badge: 'Приватное хранилище',
      title: 'Личный архив результатов',
      subtitle: 'Только те записи, сохранение которых вы подтвердили явно.',
      clearAll: 'Очистить всю историю',
      empty: 'В вашем архиве пока нет сохранённых результатов.',
      startFirst: 'Пройти первый скрининг ↗',
      pdfBtn: 'PDF отчёт',
      deleteTitle: 'Удалить запись',
      sessionDone: 'Сессия завершена',
    },
    tj: {
      authTitle: 'Бойгонии пӯшидаи шахсӣ',
      authDesc: 'Таърихи натиҷаҳои маҳфуз танҳо барои корбарони воридшуда дастрас аст.',
      authBtn: 'Воридшавӣ ба ҳисоб',
      badge: 'Махзани махфӣ',
      title: 'Бойгонии шахсии натиҷаҳо',
      subtitle: 'Танҳо он сабтҳое, ки шумо нигоҳдории онҳоро тасдиқ кардаед.',
      clearAll: 'Тоза кардани тамоми таърих',
      empty: 'Дар бойгонии шумо то ҳол ягон натиҷаи захирашуда нест.',
      startFirst: 'Гузаштани аввалин скрининг ↗',
      pdfBtn: 'Ҳисоботи PDF',
      deleteTitle: 'Нест кардани сабт',
      sessionDone: 'Сессия анҷом ёфт',
    },
    en: {
      authTitle: 'Private Personal Archive',
      authDesc: 'History of saved records is accessible only to authenticated account owners.',
      authBtn: 'Sign In to Account',
      badge: 'Private Vault',
      title: 'Personal Result Archive',
      subtitle: 'Only records that you explicitly chose to store after screening.',
      clearAll: 'Clear entire history',
      empty: 'There are no saved results in your archive yet.',
      startFirst: 'Start your first screening ↗',
      pdfBtn: 'PDF Report',
      deleteTitle: 'Delete record',
      sessionDone: 'Session completed',
    },
  }[lang] || {
    authTitle: 'Private Personal Archive',
    authDesc: 'History of saved records is accessible only to authenticated account owners.',
    authBtn: 'Sign In to Account',
    badge: 'Private Vault',
    title: 'Personal Result Archive',
    subtitle: 'Only records that you explicitly chose to store after screening.',
    clearAll: 'Clear entire history',
    empty: 'There are no saved results in your archive yet.',
    startFirst: 'Start your first screening ↗',
    pdfBtn: 'PDF Report',
    deleteTitle: 'Delete record',
    sessionDone: 'Session completed',
  }

  if (!token) {
    return (
      <section id="history" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Card className="p-10 text-center max-w-lg mx-auto space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{labels.authTitle}</h2>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {labels.authDesc}
          </p>
          <Button variant="emerald" onClick={onOpenAuth} className="mt-2">
            {labels.authBtn}
          </Button>
        </Card>
      </section>
    )
  }

  return (
    <section id="history" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
        <div>
          <Badge variant="emerald" className="mb-2">
            {labels.badge}
          </Badge>
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            {labels.title} ({results.length})
          </h2>
          <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
            {labels.subtitle}
          </p>
        </div>

        {results.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearAll}
            className="text-red-600 dark:text-red-400 hover:border-red-500/40 gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{labels.clearAll}</span>
          </Button>
        )}
      </div>

      {results.length === 0 ? (
        <Card className="p-12 text-center border-dashed space-y-4">
          <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
            {labels.empty}
          </p>
          <Button variant="emerald" size="sm" onClick={onOpenCatalog}>
            {labels.startFirst}
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {results.map((r) => {
            const dateStr = new Date(r.completed_at).toLocaleString()
            const summary = (r.result?.summary as string) || (r.result?.message as string) || labels.sessionDone

            return (
              <Card
                key={r.id}
                className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-emerald-500/40 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {r.test_title || r.test_slug}
                    </span>
                    <Badge variant="outline" className="text-[10px] py-0 px-2 font-mono">
                      v{r.methodology_version || '1.0'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {dateStr}
                    </span>
                    <span>•</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                      {summary}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDownloadPdf(r.id)}
                    className="gap-1.5 text-xs"
                  >
                    <FileDown className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{labels.pdfBtn}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDeleteResult(r.id)}
                    className="text-zinc-400 hover:text-red-500"
                    title={labels.deleteTitle}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </section>
  )
}
