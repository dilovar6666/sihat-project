import React, { useState, useEffect, useCallback } from 'react'
import {
  ArrowLeft,
  ShieldCheck,
  Info,
  FileText,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from 'lucide-react'
import { Badge } from './ui/Badge'
import { Card } from './ui/Card'
import type { Language } from '../i18n'
import type { TestItem, SavedResult } from '../types'
import { apiRequest } from '../api'
import { getPlatformSettings } from '../lib/settings'

import { SchulteTableEngine } from './test-engines/SchulteTableEngine'
import { TrailMakingEngine } from './test-engines/TrailMakingEngine'
import { CorsiBlocksEngine } from './test-engines/CorsiBlocksEngine'
import { DigitSpanEngine } from './test-engines/DigitSpanEngine'
import { SymbolDigitEngine } from './test-engines/SymbolDigitEngine'
import { ContrastSensitivityEngine } from './test-engines/ContrastSensitivityEngine'
import { ColorPerceptionEngine } from './test-engines/ColorPerceptionEngine'
import { VisualPairsEngine } from './test-engines/VisualPairsEngine'
import { PathMemoryEngine } from './test-engines/PathMemoryEngine'
import { PatternMatrixEngine } from './test-engines/PatternMatrixEngine'
import { SoundComparisonEngine } from './test-engines/SoundComparisonEngine'
import { SpeechInNoiseEngine } from './test-engines/SpeechInNoiseEngine'
import { ReactionSpeedEngine } from './test-engines/ReactionSpeedEngine'
import { GoNoGoEngine } from './test-engines/GoNoGoEngine'
import { PursuitTrackingEngine } from './test-engines/PursuitTrackingEngine'
import { CursorPathEngine } from './test-engines/CursorPathEngine'
import type { EngineCompletionPayload } from './test-engines/engineTypes'
import { ResultReportView } from './ResultReportView'

interface TestRunnerPageProps {
  slug: string
  lang: Language
  token: string
  allTests: TestItem[]
  onBackToCatalog: () => void
  onOpenAuth: () => void
  onNotify: (msg: string, type?: 'success' | 'info' | 'warning' | 'error') => void
}

interface StoredAttemptSession {
  mode: 'user' | 'guest'
  attemptId?: string
  guestToken?: string
  challenge: Record<string, any>
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
  const [completedResult, setCompletedResult] = useState<Record<string, unknown> | null>(null)
  const [completedAt, setCompletedAt] = useState<string | undefined>(undefined)
  const [previousResults, setPreviousResults] = useState<SavedResult[]>([])
  const [savedResultId, setSavedResultId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [showPassportDetails, setShowPassportDetails] = useState(false)
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)

  const [attemptChallenge, setAttemptChallenge] = useState<Record<string, any> | null>(null)
  const [activeAttemptId, setActiveAttemptId] = useState<string | null>(null)
  const [activeGuestToken, setActiveGuestToken] = useState<string | null>(null)
  const [isLoadingChallenge, setIsLoadingChallenge] = useState(false)
  const [testRunKey, setTestRunKey] = useState(1)

  const sessionKey = `sihat_active_attempt_${slug}`

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

  const t = {
    ru: {
      backToCatalog: 'Назад в каталог',
      evidenceClassA: 'Доказательная методика',
      evidenceDigital: 'Цифровое упражнение',
      passportTitle: 'Паспорт методики и условия калибровки',
      hidePassport: 'Скрыть паспорт',
      showPassport: 'Паспорт методики',
      newVariantBtn: 'Новый вариант задания',
      disclaimer:
        'Внимание: Данный скрининг носит исключительно образовательный и ознакомительный характер и не является клиническим медицинским диагнозом.',
      saveSuccess: 'Результат сохранён в ваш личный архив.',
      discardNotice: 'Результат удалён без сохранения.',
      loginToSaveNotice: 'Войдите в аккаунт, чтобы сохранить результат в личный кабинет.',
      standardName: 'Стандарт методики:',
      sourceName: 'Научный первоисточник:',
      limitations: 'Ограничения оборудования:',
    },
    tj: {
      backToCatalog: 'Баргаштан ба феҳрист',
      evidenceClassA: 'Методикаи исботшуда',
      evidenceDigital: 'Машқи рақамӣ',
      passportTitle: 'Шиносномаи методӣ ва шароити калибровка',
      hidePassport: 'Пинҳон кардани шиноснома',
      showPassport: 'Шиносномаи методӣ',
      newVariantBtn: 'Варианти нави супориш',
      disclaimer:
        'Огоҳӣ: Ин санҷиш танҳо хусусияти омӯзишӣ ва маълумотӣ дошта, ташхиси клиникии тиббӣ намебошад.',
      saveSuccess: 'Натиҷа дар бойгонии шахсии шумо сабт шуд.',
      discardNotice: 'Натиҷа бе сабт нест карда шуд.',
      loginToSaveNotice: 'Барои сабти натиҷаҳо ба ҳисоби худ ворид шавед.',
      standardName: 'Стандарти методологӣ:',
      sourceName: 'Сарчашмаи илмӣ:',
      limitations: 'Маҳдудиятҳои таҷҳизот:',
    },
    en: {
      backToCatalog: 'Back to Catalog',
      evidenceClassA: 'Validated Methodology',
      evidenceDigital: 'Digital Exercise',
      passportTitle: 'Methodology Passport & Calibration Conditions',
      hidePassport: 'Hide Passport',
      showPassport: 'Methodology Passport',
      newVariantBtn: 'New Task Variant',
      disclaimer:
        'Notice: This screening is strictly educational for self-observation and does not constitute a clinical medical diagnosis.',
      saveSuccess: 'Result saved to your private archive.',
      discardNotice: 'Result discarded without retention.',
      loginToSaveNotice: 'Please sign in to save your screening to your profile.',
      standardName: 'Methodology Standard:',
      sourceName: 'Scientific Source:',
      limitations: 'Hardware Limitations:',
    },
  }[lang]

  const startOrResumeAttempt = useCallback(
    async (forceNew: boolean) => {
      setIsLoadingChallenge(true)
      try {
        if (!forceNew) {
          const rawStored = sessionStorage.getItem(sessionKey)
          if (rawStored) {
            try {
              const parsed = JSON.parse(rawStored) as StoredAttemptSession
              if (parsed.mode === 'user' && parsed.attemptId && token) {
                const resumed = await apiRequest<{
                  attempt_id: string
                  status: string
                  challenge?: Record<string, any>
                }>(`/attempts/${parsed.attemptId}/resume`, { method: 'GET' })
                if (resumed?.status === 'in_progress' && resumed.challenge) {
                  setActiveAttemptId(resumed.attempt_id)
                  setActiveGuestToken(null)
                  setAttemptChallenge(resumed.challenge)
                  setIsLoadingChallenge(false)
                  return
                }
              } else if (parsed.mode === 'guest' && parsed.guestToken && parsed.challenge && !token) {
                setActiveAttemptId(null)
                setActiveGuestToken(parsed.guestToken)
                setAttemptChallenge(parsed.challenge)
                setIsLoadingChallenge(false)
                return
              }
            } catch {
              sessionStorage.removeItem(sessionKey)
            }
          }
        } else {
          sessionStorage.removeItem(sessionKey)
        }

        if (token) {
          const started = await apiRequest<{
            attempt_id: string
            challenge?: Record<string, any>
          }>('/attempts/start', {
            method: 'POST',
            body: JSON.stringify({ test_slug: slug }),
          })
          if (started?.attempt_id && started.challenge) {
            setActiveAttemptId(started.attempt_id)
            setActiveGuestToken(null)
            setAttemptChallenge(started.challenge)
            sessionStorage.setItem(
              sessionKey,
              JSON.stringify({
                mode: 'user',
                attemptId: started.attempt_id,
                challenge: started.challenge,
              } satisfies StoredAttemptSession)
            )
            setIsLoadingChallenge(false)
            return
          }
        } else {
          const guestStarted = await apiRequest<{
            token: string
            challenge?: Record<string, any>
          }>('/guest-attempts/start', {
            method: 'POST',
            body: JSON.stringify({ test_slug: slug }),
          })
          if (guestStarted?.token && guestStarted.challenge) {
            setActiveAttemptId(null)
            setActiveGuestToken(guestStarted.token)
            setAttemptChallenge(guestStarted.challenge)
            sessionStorage.setItem(
              sessionKey,
              JSON.stringify({
                mode: 'guest',
                guestToken: guestStarted.token,
                challenge: guestStarted.challenge,
              } satisfies StoredAttemptSession)
            )
            setIsLoadingChallenge(false)
            return
          }
        }
      } catch {
        // Offline or fallback to client-side randomized challenge
      }
      setIsLoadingChallenge(false)
    },
    [slug, token, sessionKey]
  )

  useEffect(() => {
    setCompletedResult(null)
    setSavedResultId(null)
    setSavedSuccess(false)
    startOrResumeAttempt(false)
  }, [slug, startOrResumeAttempt])

  const loadPreviousCompatibleResults = useCallback(async () => {
    if (!token) return
    try {
      const history = await apiRequest<SavedResult[]>('/results/history', { method: 'GET' })
      if (Array.isArray(history)) {
        setPreviousResults(history.filter((r) => r.test_slug === slug))
      }
    } catch {
      // Ignore history fetch errors
    }
  }, [token, slug])

  const handleTestComplete = async (payload: EngineCompletionPayload) => {
    sessionStorage.removeItem(sessionKey)
    const nowIso = new Date().toISOString()
    setCompletedAt(nowIso)
    setSavedSuccess(false)
    setSavedResultId(null)

    const pMetrics = (payload.metrics as any) || {}
    const innerMetrics = pMetrics.metrics && typeof pMetrics.metrics === 'object' ? pMetrics.metrics : pMetrics
    const innerSeries = pMetrics.series || (pMetrics.metrics && pMetrics.metrics.series) || {}

    let resolvedResult: Record<string, unknown> = {
      version: 2,
      engine: slug,
      metrics: innerMetrics,
      series: innerSeries,
      summary: payload.summary,
    }

    try {
      if (token && activeAttemptId && payload.telemetry) {
        const res = await apiRequest<{
          attempt_id: string
          result: Record<string, unknown>
        }>(`/attempts/${activeAttemptId}/complete`, {
          method: 'POST',
          body: JSON.stringify({
            answers: { summary: payload.summary },
            telemetry: payload.telemetry,
          }),
        })
        if (res?.result) {
          resolvedResult = res.result
        }
      } else if (activeGuestToken && payload.telemetry) {
        const res = await apiRequest<{
          test_slug: string
          result: Record<string, unknown>
        }>('/guest-attempts/complete', {
          method: 'POST',
          body: JSON.stringify({
            token: activeGuestToken,
            telemetry: payload.telemetry,
          }),
        })
        if (res?.result) {
          resolvedResult = res.result
        }
      }
    } catch {
      // Fallback to client metrics if server validation fails due to network loss
    }

    setCompletedResult(resolvedResult)
    await loadPreviousCompatibleResults()

    // Autosave check: if user turned off privacyShield ("Сохранение только с явного согласия"),
    // results are saved automatically upon completion without requiring manual confirmation.
    const platformSettings = getPlatformSettings()
    if (token && !platformSettings.privacyShield) {
      setIsSaving(true)
      try {
        let newSavedId: string | undefined
        if (activeAttemptId) {
          try {
            const saved = await apiRequest<{ saved_result_id?: string }>(`/attempts/${activeAttemptId}/save`, {
              method: 'POST',
              body: JSON.stringify({ consent_confirmed: true }),
            })
            if (saved?.saved_result_id) {
              newSavedId = saved.saved_result_id
            }
          } catch {
            // Fallback to direct save below
          }
        }
        if (!newSavedId) {
          const res = await apiRequest<{ id?: string }>('/results/save-direct', {
            method: 'POST',
            body: JSON.stringify({
              test_slug: slug,
              result: resolvedResult,
              answers: {},
              lang,
            }),
          })
          newSavedId = res?.id
        }
        if (newSavedId) {
          setSavedResultId(newSavedId)
          setSavedSuccess(true)
          onNotify(
            lang === 'tj'
              ? 'Натиҷа ба таври худкор сабт шуд (танзимоти худкор фаъол аст)'
              : lang === 'en'
              ? 'Result auto-saved to archive per your platform settings'
              : 'Результат автоматически сохранён в архив (автосохранение)',
            'success'
          )
          await loadPreviousCompatibleResults()
        }
      } catch (err) {
        console.error('Auto-save error:', err)
      } finally {
        setIsSaving(false)
      }
    }
  }

  const handleSaveResult = async () => {
    if (!token) {
      onOpenAuth()
      onNotify(t.loginToSaveNotice, 'info')
      return
    }
    if (!completedResult) return

    setIsSaving(true)
    try {
      if (activeAttemptId) {
        try {
          const saved = await apiRequest<{ saved_result_id?: string }>(`/attempts/${activeAttemptId}/save`, {
            method: 'POST',
            body: JSON.stringify({ consent_confirmed: true }),
          })
          if (saved?.saved_result_id) {
            setSavedResultId(saved.saved_result_id)
            setSavedSuccess(true)
            onNotify(t.saveSuccess, 'success')
            await loadPreviousCompatibleResults()
            return
          }
        } catch {
          // Fallback to direct save below
        }
      }

      const res = await apiRequest<{ id?: string }>('/results/save-direct', {
        method: 'POST',
        body: JSON.stringify({
          test_slug: slug,
          result: completedResult,
          answers: {},
          lang,
        }),
      })
      if (res?.id) {
        setSavedResultId(res.id)
      }
      setSavedSuccess(true)
      onNotify(t.saveSuccess, 'success')
      await loadPreviousCompatibleResults()
    } catch (err: unknown) {
      onNotify(err instanceof Error ? err.message : 'Ошибка при сохранении результата', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDiscard = async () => {
    if (token && activeAttemptId) {
      try {
        await apiRequest(`/attempts/${activeAttemptId}/do-not-save`, { method: 'POST' })
      } catch {
        // Ignore
      }
    }
    sessionStorage.removeItem(sessionKey)
    setCompletedResult(null)
    setSavedSuccess(false)
    onNotify(t.discardNotice, 'info')
    onBackToCatalog()
  }

  const handleRetake = async () => {
    setCompletedResult(null)
    setSavedSuccess(false)
    setSavedResultId(null)
    await startOrResumeAttempt(true)
    setTestRunKey((prev) => prev + 1)
  }

  const handleDownloadPdf = async () => {
    if (!savedResultId) {
      if (!token) {
        onOpenAuth()
        onNotify(t.loginToSaveNotice, 'info')
        return
      }
      setIsSaving(true)
      try {
        let newSavedId: string | undefined
        if (activeAttemptId) {
          try {
            const saved = await apiRequest<{ saved_result_id?: string }>(
              `/attempts/${activeAttemptId}/save`,
              {
                method: 'POST',
                body: JSON.stringify({ consent_confirmed: true }),
              }
            )
            newSavedId = saved?.saved_result_id
          } catch {
            // Fallback
          }
        }
        if (!newSavedId) {
          const res = await apiRequest<{ id?: string }>('/results/save-direct', {
            method: 'POST',
            body: JSON.stringify({
              test_slug: slug,
              result: completedResult,
              answers: {},
              lang,
            }),
          })
          newSavedId = res?.id
        }
        if (newSavedId) {
          setSavedResultId(newSavedId)
          setSavedSuccess(true)
          await downloadFile(newSavedId)
        }
      } catch {
        onNotify('Не удалось сохранить результат перед экспортом PDF', 'error')
      } finally {
        setIsSaving(false)
      }
    } else {
      await downloadFile(savedResultId)
    }
  }

  const downloadFile = async (resId: string) => {
    setIsDownloadingPdf(true)
    try {
      const blob = await apiRequest<Blob>(`/results/${resId}/pdf`, {
        method: 'POST',
        body: JSON.stringify({
          include_result: true,
          include_methodology: getPlatformSettings().pdfIncludeMethodology,
          include_limitations: getPlatformSettings().pdfIncludeMethodology,
          include_answers: false,
          include_warnings: true,
          lang,
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

  const handleRequestNewVariant = async () => {
    await startOrResumeAttempt(true)
    setTestRunKey((prev) => prev + 1)
  }

  const renderEngine = () => {
    const commonProps = {
      key: `${slug}-run-${testRunKey}-${attemptChallenge?.seed || 'local'}`,
      lang,
      challenge: attemptChallenge,
      onComplete: handleTestComplete,
      onRequestNewTask: handleRequestNewVariant,
    }

    switch (slug) {
      case 'attention-concentration':
        return <SchulteTableEngine {...commonProps} />
      case 'attention-switching':
        return <TrailMakingEngine {...commonProps} />
      case 'visual-memory':
        return <CorsiBlocksEngine {...commonProps} />
      case 'short-term-memory':
        return <DigitSpanEngine {...commonProps} />
      case 'information-processing-speed':
        return <SymbolDigitEngine {...commonProps} />
      case 'contrast-sensitivity':
        return <ContrastSensitivityEngine {...commonProps} />
      case 'color-perception':
        return <ColorPerceptionEngine {...commonProps} />
      case 'visual-pairs':
        return <VisualPairsEngine {...commonProps} />
      case 'path-memory':
        return <PathMemoryEngine {...commonProps} />
      case 'pattern-matrix':
        return <PatternMatrixEngine {...commonProps} />
      case 'sound-discrimination':
        return <SoundComparisonEngine {...commonProps} />
      case 'speech-in-noise':
        return <SpeechInNoiseEngine {...commonProps} />
      case 'reaction-speed':
        return <ReactionSpeedEngine {...commonProps} />
      case 'go-no-go':
        return <GoNoGoEngine {...commonProps} />
      case 'mouse-eye-coordination':
        return <PursuitTrackingEngine {...commonProps} />
      case 'cursor-path':
        return <CursorPathEngine {...commonProps} />
      default:
        return (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
            <p className="text-sm text-slate-500">
              {lang === 'tj'
                ? 'Ин методика дар феҳристи фаъол дастрас нест.'
                : lang === 'en'
                ? 'This exercise is not available in the active catalog.'
                : 'Данная методика скрыта из активного каталога.'}
            </p>
            <button
              type="button"
              onClick={onBackToCatalog}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#103D35] text-white text-xs font-bold cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t.backToCatalog}</span>
            </button>
          </div>
        )
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 animate-in fade-in duration-300">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <button
          onClick={onBackToCatalog}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-[#17A884] transition-colors group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>{t.backToCatalog}</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {!completedResult && (
            <button
              type="button"
              onClick={handleRequestNewVariant}
              disabled={isLoadingChallenge}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-[#17A884]/50 transition-all cursor-pointer shadow-xs"
            >
              <RotateCcw className={`w-3.5 h-3.5 text-[#17A884] ${isLoadingChallenge ? 'animate-spin' : ''}`} />
              <span>{t.newVariantBtn}</span>
            </button>
          )}
          <Badge variant="outline" className="border-[#17A884]/40 text-[#17A884] bg-[#17A884]/5">
            <ShieldCheck className="w-3.5 h-3.5 mr-1 text-[#17A884]" />
            <span>{passport?.evidence_status === 'validated' ? t.evidenceClassA : t.evidenceDigital}</span>
          </Badge>
          <button
            onClick={() => setShowPassportDetails((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-[#17A884]/50 transition-all cursor-pointer shadow-xs"
          >
            <FileText className="w-3.5 h-3.5 text-[#17A884]" />
            <span>{showPassportDetails ? t.hidePassport : t.showPassport}</span>
            {showPassportDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Test Title & Description */}
      {!completedResult && (
        <div className="mb-6">
          <h1 className="text-2xl sm:text-4xl font-extrabold text-[#103D35] dark:text-slate-50 tracking-tight mb-2">
            {title}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">{description}</p>
        </div>
      )}

      {/* Collapsible Methodology Passport Drawer */}
      {showPassportDetails && (
        <Card className="p-6 mb-6 border-[#17A884]/30 bg-[#DDF5EB]/30 dark:bg-slate-900 shadow-md animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-[#17A884] shrink-0 mt-0.5" />
            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 w-full">
              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{t.passportTitle}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
                  <span className="font-semibold text-slate-900 dark:text-slate-100 block mb-1">
                    {t.standardName}
                  </span>
                  <span>
                    {passport?.name || title} (v{passport?.version || '2.0'})
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
                  <span className="font-semibold text-slate-900 dark:text-slate-100 block mb-1">
                    {t.sourceName}
                  </span>
                  <span>{passport?.source || 'Открытые стандарты когнитивной психофизиологии'}</span>
                </div>
              </div>
              <p className="text-slate-500 italic">
                {t.limitations} {passport?.limitations || t.disclaimer}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Main Interactive Test Stage or Redesigned Results View */}
      <div className="mb-10">
        {!completedResult ? (
          renderEngine()
        ) : (
          <ResultReportView
            slug={slug}
            title={title}
            lang={lang}
            result={completedResult}
            completedAt={completedAt}
            methodology={passport}
            previousResults={previousResults}
            canSave={true}
            isSaved={savedSuccess}
            isSaving={isSaving}
            isDownloadingPdf={isDownloadingPdf}
            onSave={handleSaveResult}
            onDiscard={handleDiscard}
            onRetake={handleRetake}
            onDownloadPdf={handleDownloadPdf}
            onBackToCatalog={onBackToCatalog}
          />
        )}
      </div>
    </div>
  )
}
