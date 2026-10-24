import React from 'react'
import { CheckCircle2, Trash2, Save, ArrowRight, ShieldCheck } from 'lucide-react'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import { Card } from './ui/Card'
import type { Language } from '../i18n'
import type { Attempt, Completion } from '../types'

interface RunnerModalProps {
  isOpen: boolean
  onClose: () => void
  attempt: Attempt | null
  completion: Completion | null
  answer: string
  onSelectAnswer: (val: string) => void
  onSubmitAnswer: () => void
  onConsentChoice: (save: boolean) => void
  lang: Language
  loading: boolean
}

export const RunnerModal: React.FC<RunnerModalProps> = ({
  isOpen,
  onClose,
  attempt,
  completion,
  answer,
  onSelectAnswer,
  onSubmitAnswer,
  onConsentChoice,
  lang,
  loading,
}) => {
  if (!isOpen) return null

  // If completed, show Consent Gate Screen
  if (completion) {
    const summary = completion.result?.summary || 'Тестирование успешно завершено.'
    const metrics = completion.result?.metrics || {}

    return (
      <Modal isOpen={isOpen} onClose={onClose} className="max-w-xl">
        <div className="space-y-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <Badge variant="emerald" className="mb-2">
              Сессия завершена
            </Badge>
            <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">
              Ваш результат подготовлен
            </h2>
            <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
              Результат вычислен во временной сессии. Никакие данные пока не сохранены в постоянную базу данных.
            </p>
          </div>

          {/* Formatted Metrics Card (NO RAW JSON PRE) */}
          <Card className="p-5 text-left bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Итог проверки:</span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{summary}</span>
            </div>

            {Object.entries(metrics).length > 0 ? (
              <div className="grid grid-cols-2 gap-3 pt-1">
                {Object.entries(metrics).map(([key, val]) => (
                  <div key={key} className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">{key}</div>
                    <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 font-mono mt-0.5">{String(val)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-zinc-500 italic">Специфические метрики активности зафиксированы.</div>
            )}
          </Card>

          {/* Consent Warning */}
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 text-left flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
            <p className="text-[11px] leading-relaxed">
              <strong>Выбор приватности:</strong> нажмите «Сохранить», чтобы результат был доступен в личном архиве, или «Не сохранять» — тогда сессия и все ответы будут безвозвратно стёрты с сервера.
            </p>
          </div>

          {/* Dual Consent Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <Button
              variant="emerald"
              size="lg"
              disabled={loading}
              onClick={() => onConsentChoice(true)}
              className="gap-2 text-sm"
            >
              <Save className="w-4 h-4" />
              <span>Сохранить в личный архив</span>
            </Button>
            <Button
              variant="outline"
              size="lg"
              disabled={loading}
              onClick={() => onConsentChoice(false)}
              className="gap-2 text-sm hover:border-red-500/50 hover:text-red-600"
            >
              <Trash2 className="w-4 h-4" />
              <span>Не сохранять (Удалить)</span>
            </Button>
          </div>
        </div>
      </Modal>
    )
  }

  // Active Question Stage
  const q = attempt?.current_question
  const questionText = q?.localizations?.[lang]?.text || q?.localizations?.en?.text || q?.text || 'Продолжите выполнение скрининга'
  const options = q?.options || []

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-xl">
      <div className="space-y-6">
        {/* Stage Header */}
        <div className="flex items-center justify-between">
          <Badge variant="emerald" className="font-mono text-xs">
            Активная сессия проверки
          </Badge>
          <button
            onClick={onClose}
            className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            Прервать
          </button>
        </div>

        {/* Question Text */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-50 leading-snug">
            {questionText}
          </h2>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Выберите наиболее точный вариант ответа:
          </p>
        </div>

        {/* Options List */}
        <div className="space-y-2.5">
          {options.length > 0 ? (
            options.map((opt, idx) => {
              const optId = opt.value || opt.label || String(idx)
              const optText = opt.localizations?.[lang] || opt.localizations?.en || opt.label || opt.value || `Вариант ${idx + 1}`
              const isSelected = answer === optId

              return (
                <button
                  key={optId}
                  onClick={() => onSelectAnswer(optId)}
                  className={`w-full p-4 rounded-xl text-left text-sm font-medium transition-all flex items-center justify-between border ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100 shadow-sm'
                      : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 hover:border-emerald-500/40'
                  }`}
                >
                  <span>{optText}</span>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : 'border-zinc-300 dark:border-zinc-700'
                    }`}
                  >
                    {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </button>
              )
            })
          ) : (
            <input
              type="text"
              value={answer}
              onChange={(e) => onSelectAnswer(e.target.value)}
              placeholder="Введите ваш ответ..."
              className="w-full p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          )}
        </div>

        {/* Next Question CTA */}
        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
          <Button
            variant="emerald"
            size="lg"
            disabled={!answer || loading}
            onClick={onSubmitAnswer}
            className="w-full sm:w-auto gap-2"
          >
            <span>{loading ? 'Обработка...' : 'Далее'}</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Modal>
  )
}
