import React from 'react'
import { ShieldCheck, AlertTriangle, CheckCircle, Sliders, ArrowRight } from 'lucide-react'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import type { Language } from '../i18n'
import type { TestItem } from '../types'

interface MethodologyModalProps {
  isOpen: boolean
  onClose: () => void
  test: TestItem | null
  lang: Language
  onStart: (test: TestItem) => void
  token: string
  onOpenAuth: () => void
}

export const MethodologyModal: React.FC<MethodologyModalProps> = ({
  isOpen,
  onClose,
  test,
  lang,
  onStart,
  token,
  onOpenAuth,
}) => {
  if (!test) return null

  const title = test.localizations?.[lang]?.title || test.localizations?.en?.title || test.slug
  const desc = test.localizations?.[lang]?.description || test.localizations?.en?.description || ''
  const methodology = test.methodology

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="emerald">Паспорт методики v{methodology?.version || '1.0'}</Badge>
            <Badge variant="outline" className="text-zinc-500 font-mono text-[11px]">
              {test.slug}
            </Badge>
          </div>
          <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">{title}</h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{desc}</p>
        </div>

        {/* Evidence & Scientific Basis */}
        <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-900 dark:text-zinc-100">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Научная база и стандартизация</span>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {methodology?.source || 'Разработано на основе открытых клинических протоколов скрининга сенсорных систем и рекомендаций международного комитета стандартизации.'}
          </p>
          {methodology?.license_info && (
            <p className="text-[11px] text-zinc-500 font-mono mt-1">Лицензия: {methodology.license_info}</p>
          )}
        </div>

        {/* Environmental & Hardware Requirements */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-900 dark:text-zinc-100">
            <Sliders className="w-4 h-4 text-teal-500" />
            <span>Условия калибровки окружения</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-start gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
              <span>Стабильное внешнее освещение без бликов на экране</span>
            </div>
            <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-start gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
              <span>Фиксированная дистанция просмотра 50–60 см</span>
            </div>
          </div>
        </div>

        {/* Clinical Limitations & Warnings */}
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Ограничения и врачебное уведомление</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            {methodology?.limitations || 'Данный тест не является диагностической медицинской процедурой. Результаты отражают изолированную сенсорно-моторную реакцию в текущих условиях и не подтверждают наличие или отсутствие заболеваний.'}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <Button variant="outline" onClick={onClose}>
            Закрыть
          </Button>
          <Button
            variant="emerald"
            className="gap-2"
            onClick={() => {
              onClose()
              if (!token) {
                onOpenAuth()
              } else {
                onStart(test)
              }
            }}
          >
            <span>{token ? 'Начать скрининг' : 'Войти и начать'}</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Modal>
  )
}
