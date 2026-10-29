import React, { useState, useEffect } from 'react'
import { FileDown, Trash2, Calendar, ShieldCheck, Eye, X } from 'lucide-react'
import { Card } from './ui/Card'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import type { Language } from '../i18n'
import type { SavedResult } from '../types'
import {
  ResultReportView,
  unwrapMetrics,
  getMetricLabel,
  formatMetricValue,
} from './ResultReportView'

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
  const [selectedRecord, setSelectedRecord] = useState<SavedResult | null>(null)
  useEffect(() => {
    if (!selectedRecord) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedRecord(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedRecord])


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
      viewBtn: 'Отчёт',
      pdfBtn: 'PDF отчёт',
      deleteTitle: 'Удалить запись',
      closeReport: 'Закрыть отчёт',
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
      viewBtn: 'Ҳисобот',
      pdfBtn: 'Ҳисоботи PDF',
      deleteTitle: 'Нест кардани сабт',
      closeReport: 'Пӯшидани ҳисобот',
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
      viewBtn: 'Report',
      pdfBtn: 'PDF Report',
      deleteTitle: 'Delete record',
      closeReport: 'Close Report',
    },
  }[lang]

  if (!token) {
    return (
      <section id="history" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Card className="p-10 text-center max-w-lg mx-auto space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{labels.authTitle}</h2>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{labels.authDesc}</p>
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
          <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">{labels.subtitle}</p>
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

      {/* Modal Dialog for Selected History Result Report */}
      {selectedRecord && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-3 sm:p-6 overflow-y-auto animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedRecord(null)
          }}
        >
          <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white dark:bg-[#0E1715] rounded-3xl shadow-2xl border border-slate-200 dark:border-[#1E302B] overflow-hidden my-auto animate-scaleUp">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-[#1E302B] bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-sm shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-[#17A884] flex items-center justify-center font-bold">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {selectedRecord.test_title || selectedRecord.test_slug}
                    <Badge variant="emerald" className="text-[10px]">
                      {selectedRecord.methodology_version ? `v${selectedRecord.methodology_version}` : 'v2.0'}
                    </Badge>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {new Date(selectedRecord.completed_at).toLocaleString(lang === 'en' ? 'en-US' : 'ru-RU', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDownloadPdf(selectedRecord.id)}
                  className="text-xs gap-1.5 hidden sm:flex"
                >
                  <FileDown className="w-3.5 h-3.5 text-[#17A884]" />
                  <span>{labels.pdfBtn}</span>
                </Button>
                <button
                  type="button"
                  onClick={() => setSelectedRecord(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title={labels.closeReport}
                  aria-label="Закрыть"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
              <ResultReportView
                slug={selectedRecord.test_slug}
                title={selectedRecord.test_title || selectedRecord.test_slug}
                lang={lang}
                result={selectedRecord.result}
                completedAt={selectedRecord.completed_at}
                methodology={{
                  name: selectedRecord.test_title || selectedRecord.test_slug,
                  version: selectedRecord.methodology_version || '2.0',
                }}
                previousResults={results.filter(
                  (r) => r.test_slug === selectedRecord.test_slug && r.id !== selectedRecord.id
                )}
                canSave={false}
                isSaved={true}
                onDownloadPdf={() => onDownloadPdf(selectedRecord.id)}
                compact={false}
              />
            </div>
          </div>
        </div>
      )}

      {results.length === 0 ? (
        <Card className="p-12 text-center border-dashed space-y-4">
          <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">{labels.empty}</p>
          <Button variant="emerald" size="sm" onClick={onOpenCatalog}>
            {labels.startFirst}
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {results.map((r) => {
            const dateStr = new Date(r.completed_at).toLocaleString(
              lang === 'en' ? 'en-US' : 'ru-RU',
              {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }
            )
            const metrics = unwrapMetrics(r.result)
            const topEntries = Object.entries(metrics).slice(0, 3)

            return (
              <Card
                key={r.id}
                className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-emerald-500/40 transition-all"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {r.test_title || r.test_slug}
                    </span>
                    <Badge variant="outline" className="text-[10px] py-0 px-2 font-mono">
                      v{r.methodology_version || '2.0'}
                    </Badge>
                    <span className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                      <Calendar className="w-3 h-3" />
                      {dateStr}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {topEntries.map(([k, v]) => (
                      <span
                        key={k}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20"
                      >
                        <span className="text-zinc-500 dark:text-zinc-400">{getMetricLabel(k, lang)}:</span>
                        <span className="font-mono font-bold">{formatMetricValue(k, v, lang)}</span>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedRecord(r)}
                    className="gap-1.5 text-xs"
                  >
                    <Eye className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{labels.viewBtn}</span>
                  </Button>
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
