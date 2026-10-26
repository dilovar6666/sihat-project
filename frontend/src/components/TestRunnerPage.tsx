import React, { useState, useEffect } from 'react'
import {
  ArrowLeft,
  ShieldCheck,
  Info,
  Save,
  Trash2,
  RotateCcw,
  CheckCircle2,
  FileText,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Download,
  LayoutGrid,
  Activity,
  Award,
} from 'lucide-react'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import { Card } from './ui/Card'
import type { Language } from '../i18n'
import type { TestItem } from '../types'
import { apiRequest } from '../api'
import { getTestCover, getTestAlt, getTestPhotoCredit } from '../lib/testImages'

import { SchulteTableEngine } from './test-engines/SchulteTableEngine'
import { TrailMakingEngine } from './test-engines/TrailMakingEngine'
import { CorsiBlocksEngine } from './test-engines/CorsiBlocksEngine'
import { DigitSpanEngine } from './test-engines/DigitSpanEngine'
import { SymbolDigitEngine } from './test-engines/SymbolDigitEngine'
import { ContrastSensitivityEngine } from './test-engines/ContrastSensitivityEngine'
import { VisualPairsEngine } from './test-engines/VisualPairsEngine'
import { PathMemoryEngine } from './test-engines/PathMemoryEngine'
import { PatternMatrixEngine } from './test-engines/PatternMatrixEngine'
import { SpeechInNoiseEngine } from './test-engines/SpeechInNoiseEngine'
import { ReactionSpeedEngine } from './test-engines/ReactionSpeedEngine'
import { GoNoGoEngine } from './test-engines/GoNoGoEngine'
import { PursuitTrackingEngine } from './test-engines/PursuitTrackingEngine'
import { CursorPathEngine } from './test-engines/CursorPathEngine'
import { Gad7Engine } from './test-engines/Gad7Engine'
import { EmotionalAffectEngine } from './test-engines/EmotionalAffectEngine'
import { CircadianClockEngine } from './test-engines/CircadianClockEngine'
import { ColorHueEngine } from './test-engines/ColorHueEngine'
import { LandoltVisionEngine } from './test-engines/LandoltVisionEngine'
import { TonalAudiometryEngine } from './test-engines/TonalAudiometryEngine'

interface TestRunnerPageProps {
  slug: string
  lang: Language
  token: string
  allTests: TestItem[]
  onBackToCatalog: () => void
  onOpenAuth: () => void
  onNotify: (msg: string) => void
}

interface CompletedData {
  summary: string
  metrics: Record<string, unknown>
}

export const TestRunnerPage: React.FC<TestRunnerPageProps> = ({
  slug,
  lang,
  token,
  allTests,
  onBackToCatalog,
  onOpenAuth,
  onNotify,
}) => {
  const [completedData, setCompletedData] = useState<CompletedData | null>(null)
  const [savedResultId, setSavedResultId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [showPassportDetails, setShowPassportDetails] = useState(false)
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)
  const [attemptChallenge, setAttemptChallenge] = useState<any>(null)

  // Find test by slug
  const testDef = allTests.find((t) => t.slug === slug)

  const loc =
    testDef?.localizations?.[lang] ||
    (lang === 'tj' ? testDef?.localizations?.tg : undefined) ||
    testDef?.localizations?.ru ||
    testDef?.localizations?.en

  const title = loc?.title || slug
  const description =
    loc?.description ||
    (lang === 'tj'
      ? 'Амалияи интерактивии таҳлили сенсорӣ бо пойгоҳи кушодаи исботшуда.'
      : lang === 'en'
      ? 'Interactive screening with transparent evidence methodology.'
      : 'Интерактивный скрининг с прозрачной доказательной методологией.')

  const passport = testDef?.methodology

  // Try fetching challenge from backend on load
  useEffect(() => {
    let isMounted = true
    apiRequest<{ challenge?: any }>(`/attempts/start`, {
      method: 'POST',
      body: JSON.stringify({ test_slug: slug }),
    })
      .then((res) => {
        if (isMounted && res?.challenge) {
          setAttemptChallenge(res.challenge)
        }
      })
      .catch(() => {
        // Fallback to client-side engine generation
      })
    return () => {
      isMounted = false
    }
  }, [slug])

  const t = {
    ru: {
      backToCatalog: 'Назад в каталог',
      evidenceClassA: 'Доказано: Класс A (ISO)',
      evidenceDigital: 'Цифровой скрининг',
      passportTitle: 'Паспорт методики и условия калибровки',
      hidePassport: 'Скрыть паспорт',
      showPassport: 'Показать паспорт методики',
      disclaimer: 'Внимание: Данный скрининг носит исключительно образовательный и ознакомительный характер и не является клиническим медицинским диагнозом.',
      saveToArchive: 'Сохранить в личный архив',
      saving: 'Сохранение...',
      saveSuccess: 'Успешно сохранено в ваш архив!',
      discardZeroRetention: 'Не сохранять (Zero-retention)',
      discardNotice: 'Результаты стерты из оперативной памяти без сохранения.',
      retakeTest: 'Пройти повторно',
      downloadPdf: 'Экспорт отчёта PDF',
      loginToSaveNotice: 'Войдите в аккаунт, чтобы сохранить результат в личный кабинет.',
      resultsReady: 'Скрининг завершён. Итоговые показатели:',
      scoreOverview: 'Сводка скрининга',
      detailedMetrics: 'Ключевые биометрические маркеры',
      methodologyContext: 'Научный контекст и ограничения',
      standardName: 'Стандарт методики:',
      sourceName: 'Научный первоисточник:',
      limitations: 'Ограничения оборудования:',
      metricLabels: {
        completion_time_sec: 'Время выполнения',
        errors_count: 'Количество ошибок',
        work_efficiency: 'Индекс эффективности (ЭР)',
        fatigue_index: 'Индекс врабатываемости (ВР)',
        total_time_sec: 'Общее время',
        accuracy_pct: 'Точность выполнения',
        max_span: 'Максимальный объём памяти',
        correct_sequences: 'Правильных воспроизведений',
        processed_count: 'Обработано стимулов',
        processing_speed_cpm: 'Скорость обработки (симв/мин)',
        contrast_threshold_pct: 'Порог распознавания контраста',
        mean_reaction_time_ms: 'Среднее время реакции',
        fastest_reaction_time_ms: 'Лучшее время реакции',
        premature_clicks: 'Фальстарты / Опережения',
        inhibitory_control_pct: 'Индекс торможения (Inhibition)',
        false_alarm_nogo: 'Ошибки торможения (No-Go)',
        time_on_target_pct: 'Время удержания цели (TOT)',
        deviation_rmse_px: 'Среднее отклонение (RMSE)',
        boundary_violations: 'Выходов за границы траектории',
        gad7_score: 'Суммарный балл тревожности GAD-7',
        severity_band: 'Уровень выраженности',
        pitch_discrimination_threshold_hz: 'Порог различения частоты',
      } as Record<string, string>,
    },
    tj: {
      backToCatalog: 'Баргаштан ба феҳрист',
      evidenceClassA: 'Исботшуда: Синфи А (ISO)',
      evidenceDigital: 'Скрининги рақамӣ',
      passportTitle: 'Шиносномаи методӣ ва шароити калибровка',
      hidePassport: 'Пинҳон кардани шиноснома',
      showPassport: 'Нишон додани шиносномаи методӣ',
      disclaimer: 'Огоҳӣ: Ин санҷиш танҳо хусусияти омӯзишӣ ва маълумотӣ дошта, ташхиси клиникии тиббӣ намебошад.',
      saveToArchive: 'Сабт дар бойгонии шахсӣ',
      saving: 'Дар ҳоли сабт...',
      saveSuccess: 'Бомуваффақият дар профили шумо сабт шуд!',
      discardZeroRetention: 'Нест кардан (Zero-retention)',
      discardNotice: 'Натиҷаҳо бе сабт комилан пок карда шуданд.',
      retakeTest: 'Аз нав гузаштан',
      downloadPdf: 'Боргирии ҳисоботи PDF',
      loginToSaveNotice: 'Барои сабти натиҷаҳо ба ҳисоби худ ворид шавед.',
      resultsReady: 'Санҷиш анҷом ёфт. Нишондиҳандаҳои шумо:',
      scoreOverview: 'Хулосаи санҷиш',
      detailedMetrics: 'Нишондиҳандаҳои калидии биометрӣ',
      methodologyContext: 'Заминаи илмӣ ва маҳдудиятҳо',
      standardName: 'Стандарти методологӣ:',
      sourceName: 'Сарчашмаи илмӣ:',
      limitations: 'Маҳдудиятҳои таҷҳизот:',
      metricLabels: {
        completion_time_sec: 'Вақти иҷро',
        errors_count: 'Шумораи хатоҳо',
        work_efficiency: 'Нишондиҳандаи самаранокӣ',
        fatigue_index: 'Нишондиҳандаи хастагӣ',
        total_time_sec: 'Вақти умумӣ',
        accuracy_pct: 'Дақиқияти иҷро',
        max_span: 'Ҳаҷми ниҳоии хотира',
        correct_sequences: 'Пайдарпайиҳои дуруст',
        processed_count: 'Шумораи коркардшуда',
        processing_speed_cpm: 'Суръати коркард (аломат/дақ)',
        contrast_threshold_pct: 'Ҳадди эҳсоси контраст',
        mean_reaction_time_ms: 'Вақти миёнаи вокуниш',
        fastest_reaction_time_ms: 'Беҳтарин вақти вокуниш',
        premature_clicks: 'Вокунишҳои бармаҳал',
        inhibitory_control_pct: 'Нишондиҳандаи боздорӣ',
        false_alarm_nogo: 'Хатогиҳои боздорӣ (No-Go)',
        time_on_target_pct: 'Вақти нигоҳдорӣ дар ҳадаф',
        deviation_rmse_px: 'Инҳирофи миёна (RMSE)',
        boundary_violations: 'Берунравиҳо аз роҳрав',
        gad7_score: 'Холи умумии GAD-7',
        severity_band: 'Сатҳи шиддат',
        pitch_discrimination_threshold_hz: 'Ҳадди фарқкунии садо',
      } as Record<string, string>,
    },
    en: {
      backToCatalog: 'Back to Catalog',
      evidenceClassA: 'Validated: Class A (ISO)',
      evidenceDigital: 'Digital Screening',
      passportTitle: 'Methodology Passport & Calibration Conditions',
      hidePassport: 'Hide Passport',
      showPassport: 'View Methodology Passport',
      disclaimer: 'Notice: This screening is strictly educational for self-observation and does not constitute a clinical medical diagnosis.',
      saveToArchive: 'Save to Private Vault',
      saving: 'Saving...',
      saveSuccess: 'Successfully saved to your private record!',
      discardZeroRetention: 'Discard (Zero-retention)',
      discardNotice: 'Results completely discarded from active memory without retention.',
      retakeTest: 'Retake Screening',
      downloadPdf: 'Export PDF Report',
      loginToSaveNotice: 'Please log in to save your screening to your private dashboard.',
      resultsReady: 'Screening completed. Recorded metrics:',
      scoreOverview: 'Screening Overview',
      detailedMetrics: 'Key Biometric Markers',
      methodologyContext: 'Scientific Context & Limitations',
      standardName: 'Methodology Standard:',
      sourceName: 'Scientific Source:',
      limitations: 'Hardware Limitations:',
      metricLabels: {
        completion_time_sec: 'Completion Time',
        errors_count: 'Errors Count',
        work_efficiency: 'Work Efficiency Index',
        fatigue_index: 'Warm-up / Fatigue Index',
        total_time_sec: 'Total Time',
        accuracy_pct: 'Task Accuracy',
        max_span: 'Max Memory Span',
        correct_sequences: 'Correct Sequences',
        processed_count: 'Processed Items',
        processing_speed_cpm: 'Processing Speed (items/min)',
        contrast_threshold_pct: 'Contrast Threshold',
        mean_reaction_time_ms: 'Mean Reaction Time',
        fastest_reaction_time_ms: 'Fastest Reaction Time',
        premature_clicks: 'Anticipation / Premature clicks',
        inhibitory_control_pct: 'Inhibitory Control Index',
        false_alarm_nogo: 'Inhibition Errors (No-Go)',
        time_on_target_pct: 'Time on Target (TOT)',
        deviation_rmse_px: 'Mean Deviation (RMSE)',
        boundary_violations: 'Corridor Boundary Breaches',
        gad7_score: 'Total GAD-7 Score',
        severity_band: 'Severity Classification',
        pitch_discrimination_threshold_hz: 'Pitch Difference Threshold',
      } as Record<string, string>,
    },
  }[lang]

  const handleTestComplete = (data: CompletedData) => {
    setCompletedData(data)
    setSavedSuccess(false)
  }

  const handleDirectSave = async () => {
    if (!token) {
      onOpenAuth()
      onNotify(t.loginToSaveNotice)
      return
    }

    if (!completedData) return
    setIsSaving(true)
    try {
      const res = await apiRequest<{ id?: string }>('/results/save-direct', {
        method: 'POST',
        body: JSON.stringify({
          test_slug: slug,
          result: completedData.metrics,
          answers: { summary: completedData.summary },
        }),
      })
      if (res?.id) {
        setSavedResultId(res.id)
      }
      setSavedSuccess(true)
      onNotify(t.saveSuccess)
    } catch (err: unknown) {
      onNotify(err instanceof Error ? err.message : 'Ошибка при сохранении результата')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDiscard = () => {
    setCompletedData(null)
    setSavedSuccess(false)
    onNotify(t.discardNotice)
    onBackToCatalog()
  }

  const handleDownloadPdf = async () => {
    if (!savedResultId) {
      // Save first
      if (!token) {
        onOpenAuth()
        onNotify(t.loginToSaveNotice)
        return
      }
      setIsSaving(true)
      try {
        const res = await apiRequest<{ id?: string }>('/results/save-direct', {
          method: 'POST',
          body: JSON.stringify({
            test_slug: slug,
            result: completedData?.metrics,
            answers: { summary: completedData?.summary },
          }),
        })
        if (res?.id) {
          setSavedResultId(res.id)
          setSavedSuccess(true)
          downloadFile(res.id)
        }
      } catch {
        onNotify('Не удалось сохранить перед экспортом')
      } finally {
        setIsSaving(false)
      }
    } else {
      downloadFile(savedResultId)
    }
  }

  const downloadFile = async (resId: string) => {
    setIsDownloadingPdf(true)
    try {
      const blob = await apiRequest<Blob>(`/results/${resId}/pdf`, {
        method: 'POST',
        body: JSON.stringify({
          include_result: true,
          include_methodology: true,
          include_limitations: true,
          include_answers: false,
          include_warnings: true,
        }),
      })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `sihat_screening_${slug}_${new Date().toISOString().slice(0, 10)}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch {
      window.print()
    } finally {
      setIsDownloadingPdf(false)
    }
  }

  // Render the appropriate engine component matching the test methodology
  const renderEngine = () => {
    switch (slug) {
      case 'attention-concentration':
        return <SchulteTableEngine lang={lang} onComplete={handleTestComplete} />
      case 'attention-switching':
        return <TrailMakingEngine lang={lang} onComplete={handleTestComplete} />
      case 'visual-memory':
        return <CorsiBlocksEngine lang={lang} onComplete={handleTestComplete} />
      case 'short-term-memory':
        return <DigitSpanEngine lang={lang} onComplete={handleTestComplete} />
      case 'information-processing-speed':
        return <SymbolDigitEngine lang={lang} onComplete={handleTestComplete} />
      case 'contrast-sensitivity':
        return <ContrastSensitivityEngine lang={lang} onComplete={handleTestComplete} />
      case 'color-hue-discrimination':
      case 'color-perception':
        return <ColorHueEngine lang={lang} onComplete={handleTestComplete} />
      case 'visual-perception':
        return <LandoltVisionEngine lang={lang} onComplete={handleTestComplete} />
      case 'sound-discrimination':
        return <TonalAudiometryEngine lang={lang} onComplete={handleTestComplete} />
      case 'speech-in-noise':
        return <SpeechInNoiseEngine lang={lang} onComplete={handleTestComplete} />
      case 'reaction-speed':
        return <ReactionSpeedEngine lang={lang} onComplete={handleTestComplete} />
      case 'mouse-eye-coordination':
        return <PursuitTrackingEngine lang={lang} onComplete={handleTestComplete} />
      case 'anxiety':
        return <Gad7Engine lang={lang} challenge={attemptChallenge} onComplete={handleTestComplete} />
      case 'mood':
        return <EmotionalAffectEngine lang={lang} onComplete={handleTestComplete} />
      case 'sleep-quality':
        return <CircadianClockEngine lang={lang} onComplete={handleTestComplete} />
      case 'visual-pairs':
        return <VisualPairsEngine lang={lang} challenge={attemptChallenge} onComplete={handleTestComplete} />
      case 'path-memory':
        return <PathMemoryEngine lang={lang} challenge={attemptChallenge} onComplete={handleTestComplete} />
      case 'pattern-matrix':
        return <PatternMatrixEngine lang={lang} challenge={attemptChallenge} onComplete={handleTestComplete} />
      case 'go-no-go':
        return <GoNoGoEngine lang={lang} challenge={attemptChallenge} onComplete={handleTestComplete} />
      case 'cursor-path':
        return <CursorPathEngine lang={lang} challenge={attemptChallenge} onComplete={handleTestComplete} />
      default:
        return (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            <p className="text-sm text-slate-500">Методика находится на калибровке доказательного ядра.</p>
          </div>
        )
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-in fade-in duration-300">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <button
          onClick={onBackToCatalog}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-[#17A884] transition-colors group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>{t.backToCatalog}</span>
        </button>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-[#17A884]/40 text-[#17A884] bg-[#17A884]/5">
            <ShieldCheck className="w-3.5 h-3.5 mr-1 text-[#17A884]" />
            <span>
              {passport?.evidence_status === 'validated' ? t.evidenceClassA : t.evidenceDigital}
            </span>
          </Badge>
          <button
            onClick={() => setShowPassportDetails((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-[#17A884]/50 transition-all cursor-pointer shadow-xs"
          >
            <FileText className="w-3.5 h-3.5 text-[#17A884]" />
            <span>{showPassportDetails ? t.hidePassport : t.showPassport}</span>
            {showPassportDetails ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Test Title & Description */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#103D35] dark:text-slate-50 tracking-tight mb-2">
          {title}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
          {description}
        </p>
      </div>

      {/* Collapsible Methodology Passport Drawer */}
      {showPassportDetails && (
        <Card className="p-6 mb-8 border-[#17A884]/30 bg-[#DDF5EB]/30 dark:bg-slate-900 shadow-md animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-[#17A884] shrink-0 mt-0.5" />
            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 w-full">
              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                {t.passportTitle}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
                  <span className="font-semibold text-slate-900 dark:text-slate-100 block mb-1">
                    {t.standardName}
                  </span>
                  <span>{passport?.name || title} (v{passport?.version || '1.0.0'})</span>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
                  <span className="font-semibold text-slate-900 dark:text-slate-100 block mb-1">
                    {t.sourceName}
                  </span>
                  <span>{passport?.source || 'Открытые стандарты доказательной когнитивной психофизиологии'}</span>
                </div>
              </div>
              <p className="text-slate-500 italic">
                {t.limitations} {passport?.limitations || t.disclaimer}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Main Interactive Test Stage */}
      <div className="mb-10">
        {!completedData ? (
          renderEngine()
        ) : (
          /* Redesigned Premium Results Stage */
          <div className="max-w-3xl mx-auto space-y-6 animate-in zoom-in-95 duration-200">
            {/* Header Hero Card with Thematic Cover Overlay */}
            <div className="relative rounded-3xl p-8 text-white shadow-2xl overflow-hidden bg-slate-900 border border-slate-200/50 dark:border-slate-800">
              <img
                src={getTestCover(slug)}
                alt={getTestAlt(slug, lang)}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#103D35]/95 via-[#103D35]/85 to-[#17A884]/70" />
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-xs font-semibold mb-3 border border-white/20">
                    <CheckCircle2 className="w-4 h-4 text-[#2EC4A7]" />
                    <span>{t.resultsReady}</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{title}</h2>
                  <p className="text-sm text-white/80 mt-1 max-w-md">{completedData.summary}</p>
                  {getTestPhotoCredit(slug) && (
                    <div className="text-[10px] text-white/50 font-mono mt-2">
                      Фото: {getTestPhotoCredit(slug)?.author}
                    </div>
                  )}
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 sm:border-l border-white/20 pt-4 sm:pt-0 sm:pl-6">
                  <span className="text-xs uppercase tracking-wider text-white/70 font-semibold">{t.scoreOverview}</span>
                  <span className="text-3xl font-mono font-black text-[#DDF5EB]">
                    {String(Object.values(completedData.metrics)[0] || '100%')}
                  </span>
                </div>
              </div>
            </div>

            {/* Key Biometric Metrics Grid */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-6 border-b border-slate-100 dark:border-slate-800 pb-3">
                <Activity className="w-5 h-5 text-[#17A884]" />
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{t.detailedMetrics}</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(completedData.metrics).map(([key, val]) => {
                  if (typeof val === 'object' && val !== null) return null
                  const label = t.metricLabels[key] || key.replace(/_/g, ' ')
                  return (
                    <div
                      key={key}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between transition-all hover:border-[#17A884]/40"
                    >
                      <div className="pr-3">
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 capitalize block mb-0.5">
                          {label}
                        </span>
                        <span className="text-lg font-mono font-bold text-[#103D35] dark:text-[#2EC4A7]">
                          {String(val)}
                        </span>
                      </div>
                      <div className="w-8 h-8 rounded-xl bg-[#17A884]/10 dark:bg-[#17A884]/20 flex items-center justify-center text-[#17A884]">
                        <Award className="w-4 h-4" />
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Mandatory Non-Diagnosis Disclaimer */}
              <div className="mt-6 flex items-start gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{t.disclaimer}</span>
              </div>
            </div>

            {/* Action Buttons Toolbar */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-200/80 dark:border-slate-800 space-y-4">
              <Button
                size="lg"
                disabled={isSaving || savedSuccess}
                onClick={handleDirectSave}
                className="w-full bg-[#103D35] hover:bg-[#17A884] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all"
              >
                {savedSuccess ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-[#2EC4A7]" />
                    <span>{t.saveSuccess}</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>{isSaving ? t.saving : t.saveToArchive}</span>
                  </>
                )}
              </Button>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Button
                  variant="outline"
                  onClick={handleDownloadPdf}
                  disabled={isDownloadingPdf}
                  className="rounded-xl border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Download className="w-4 h-4 text-[#17A884]" />
                  <span>{t.downloadPdf}</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    setCompletedData(null)
                    setSavedSuccess(false)
                  }}
                  className="rounded-xl border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <RotateCcw className="w-4 h-4 text-[#17A884]" />
                  <span>{t.retakeTest}</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={handleDiscard}
                  className="rounded-xl border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{t.discardZeroRetention}</span>
                </Button>
              </div>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={onBackToCatalog}
                  className="text-xs font-semibold text-slate-500 hover:text-[#17A884] transition-colors inline-flex items-center gap-1 cursor-pointer"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>{t.backToCatalog}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
