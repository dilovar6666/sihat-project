import React, { useState, useEffect, useRef } from 'react'
import { Eye, Award, CheckCircle, RotateCcw, Play } from 'lucide-react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import type { InteractiveEngineProps } from './engineTypes'

const CONTRAST_LEVELS = [60.0, 40.0, 28.0, 20.0, 14.0, 10.0, 7.0, 5.0, 3.5, 2.5]

interface ContrastTrial {
  id: string
  contrast_pct: number
  tilt: 'left' | 'right'
  phase: number
}

function buildFallbackContrast(): ContrastTrial[] {
  const trials: ContrastTrial[] = []
  for (const level of CONTRAST_LEVELS) {
    for (const n of [1, 2]) {
      trials.push({
        id: `${level}-${n}`,
        contrast_pct: level,
        tilt: Math.random() < 0.5 ? 'left' : 'right',
        phase: Math.round(Math.random() * 628) / 100,
      })
    }
  }
  return trials
}

export const ContrastSensitivityEngine: React.FC<InteractiveEngineProps> = ({
  lang,
  challenge,
  onComplete,
  onRequestNewTask,
}) => {
  const [trials, setTrials] = useState<ContrastTrial[]>(() =>
    Array.isArray(challenge?.trials) && challenge.trials.length > 0
      ? (challenge.trials as ContrastTrial[])
      : buildFallbackContrast()
  )
  const [trialIdx, setTrialIdx] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const [isFinished, setIsFinished] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const responsesRef = useRef<Array<{ id: string; answer: string }>>([])
  const perLevelRef = useRef<Record<number, boolean[]>>({})
  const usedChallengeRef = useRef(false)

  useEffect(() => {
    if (Array.isArray(challenge?.trials) && challenge.trials.length > 0 && !isActive && !isFinished) {
      setTrials(challenge.trials as ContrastTrial[])
      usedChallengeRef.current = false
    }
  }, [challenge, isActive, isFinished])

  const currentTrial = trials[trialIdx]

  // Draw Gabor-like tilted sinusoidal grating on canvas
  useEffect(() => {
    if (!isActive || !currentTrial) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const size = canvas.width
    const imgData = ctx.createImageData(size, size)
    const data = imgData.data
    const angle = currentTrial.tilt === 'left' ? -Math.PI / 5 : Math.PI / 5
    const cosA = Math.cos(angle)
    const sinA = Math.sin(angle)
    const freq = 0.14
    const phase = currentTrial.phase || 0
    const amp = (currentTrial.contrast_pct / 100) * 112
    const half = size / 2
    const sigma = size * 0.28

    for (let y = 0; y < size; y++) {
      const dy = y - half
      for (let x = 0; x < size; x++) {
        const dx = x - half
        const r2 = dx * dx + dy * dy
        const envelope = Math.exp(-r2 / (2 * sigma * sigma))
        const u = dx * cosA + dy * sinA
        const wave = Math.sin(u * freq + phase)
        const lum = Math.max(0, Math.min(255, Math.round(128 + amp * envelope * wave)))
        const idx = (y * size + x) * 4
        data[idx] = lum
        data[idx + 1] = lum
        data[idx + 2] = lum
        data[idx + 3] = 255
      }
    }
    ctx.putImageData(imgData, 0, 0)
  }, [isActive, currentTrial, trialIdx])

  const t = {
    ru: {
      title: 'Различение контраста (Решётки Габора)',
      subtitle: 'Определите направление наклона полос на сером круге (влево ↖ или вправо ↗) при постепенном снижении контраста от 60% до 2.5%.',
      standard: 'Contrast Grating Discrimination • Порог контрастности',
      step: 'Проба',
      contrast: 'Контраст',
      question: 'Куда наклонены полосы на диске?',
      tiltLeft: '↖ Влево',
      cantSee: 'Не различимо',
      tiltRight: 'Вправо ↗',
      startBtn: 'Начать проверку контраста',
      finishTitle: 'Проверка контраста завершена',
      thresholdLabel: 'Минимальный различимый контраст',
      finishBtn: 'Показать подробный отчёт',
      tryAgain: 'Новый вариант',
    },
    tj: {
      title: 'Фарқкунии контраст (Панҷараи Габор)',
      subtitle: 'Самти тамоюли хатҳоро дар доираи хокистарӣ (ба чап ↖ ё ба рост ↗) ҳангоми паст шудани контраст аз 60% то 2.5% муайян намоед.',
      standard: 'Contrast Grating Discrimination • Ҳассосияти контрастӣ',
      step: 'Кӯшиш',
      contrast: 'Контраст',
      question: 'Хатҳо ба кадом тараф моил ҳастанд?',
      tiltLeft: '↖ Ба чап',
      cantSee: 'Номаълум',
      tiltRight: 'Ба рост ↗',
      startBtn: 'Оғози санҷиши контраст',
      finishTitle: 'Санҷиши контраст анҷом ёфт',
      thresholdLabel: 'Ҳадди ақали контрасти фарқшаванда',
      finishBtn: 'Дидани ҳисоботи муфассал',
      tryAgain: 'Варианти нав',
    },
    en: {
      title: 'Contrast Discrimination (Gabor Gratings)',
      subtitle: 'Identify the tilt direction of the grating stripes (Left ↖ or Right ↗) as contrast decreases from 60% down to 2.5%.',
      standard: 'Contrast Grating Discrimination • Contrast Threshold',
      step: 'Trial',
      contrast: 'Contrast',
      question: 'Which way are the stripes tilted?',
      tiltLeft: '↖ Tilted Left',
      cantSee: 'Cannot Resolve',
      tiltRight: 'Tilted Right ↗',
      startBtn: 'Start Contrast Screening',
      finishTitle: 'Contrast Screening Completed',
      thresholdLabel: 'Minimum Reliable Contrast',
      finishBtn: 'View Detailed Report',
      tryAgain: 'New Variant',
    },
  }[lang]

  const handleStart = (requestFresh = false) => {
    if (requestFresh && onRequestNewTask) {
      onRequestNewTask()
    }
    let nextTrials = trials
    if (!usedChallengeRef.current && Array.isArray(challenge?.trials) && challenge.trials.length > 0) {
      nextTrials = challenge.trials as ContrastTrial[]
      setTrials(nextTrials)
      usedChallengeRef.current = true
    } else {
      nextTrials = buildFallbackContrast()
      setTrials(nextTrials)
    }

    responsesRef.current = []
    perLevelRef.current = {}
    setTrialIdx(0)
    setIsFinished(false)
    setIsActive(true)
  }

  const handleAnswer = (answer: 'left' | 'right' | 'unsure') => {
    if (!isActive || isFinished || !currentTrial) return

    const ok = answer === currentTrial.tilt
    responsesRef.current.push({ id: currentTrial.id, answer })

    const arr = perLevelRef.current[currentTrial.contrast_pct] || []
    arr.push(ok)
    perLevelRef.current[currentTrial.contrast_pct] = arr

    const nextIdx = trialIdx + 1
    if (nextIdx >= trials.length) {
      setIsActive(false)
      setIsFinished(true)
      return
    }

    const nextTrial = trials[nextIdx]
    const levelIdx = CONTRAST_LEVELS.indexOf(nextTrial.contrast_pct)
    if (levelIdx > 0) {
      const prevLevel = CONTRAST_LEVELS[levelIdx - 1]
      const prevRes = perLevelRef.current[prevLevel] || []
      if (
        (!perLevelRef.current[nextTrial.contrast_pct] ||
          perLevelRef.current[nextTrial.contrast_pct].length === 0) &&
        prevRes.length === 2 &&
        !prevRes.some(Boolean)
      ) {
        setIsActive(false)
        setIsFinished(true)
        return
      }
    }

    setTrialIdx(nextIdx)
  }

  const computeSummaryStats = () => {
    const perLevel = perLevelRef.current
    const reliable = Object.entries(perLevel)
      .filter(([, res]) => res.length === 2 && res.every(Boolean))
      .map(([lvl]) => Number(lvl))
    const threshold = reliable.length > 0 ? Math.min(...reliable) : null
    const series = Object.entries(perLevel).map(([lvl, res]) => ({
      contrast_pct: Number(lvl),
      correct: res.filter(Boolean).length,
      of: res.length,
    }))
    const attempted = responsesRef.current.length
    const correct = series.reduce((a, b) => a + b.correct, 0)
    const accuracyPct = attempted > 0 ? Number(((correct / attempted) * 100).toFixed(1)) : 0
    return { threshold, reliableCount: reliable.length, correct, attempted, accuracyPct, series }
  }

  const handleFinish = () => {
    const stats = computeSummaryStats()
    onComplete({
      summary: `${t.thresholdLabel}: ${stats.threshold !== null ? `${stats.threshold}%` : '—'} (${stats.correct}/${stats.attempted})`,
      metrics: {
        version: 2,
        engine: 'contrast',
        metrics: {
          threshold_contrast_pct: stats.threshold,
          levels_passed: stats.reliableCount,
          trials_correct: stats.correct,
          trials_attempted: stats.attempted,
          accuracy_pct: stats.accuracyPct,
        },
        series: {
          by_level: stats.series,
        },
      },
      telemetry: {
        responses: responsesRef.current,
      },
    })
  }

  const summaryStats = isFinished ? computeSummaryStats() : null

  return (
    <div className="flex flex-col items-center max-w-xl mx-auto w-full select-none">
      <div className="w-full flex items-center justify-between gap-2 mb-4">
        <Badge variant="cyan" className="gap-1.5 py-1.5 px-3">
          <Eye className="w-3.5 h-3.5 text-cyan-500" />
          <span className="truncate">{t.standard}</span>
        </Badge>
        {isActive && currentTrial && (
          <span className="text-xs font-mono text-zinc-500">
            {t.step} {trialIdx + 1}/{trials.length} • {t.contrast}:{' '}
            <strong className="text-emerald-500">{currentTrial.contrast_pct}%</strong>
          </span>
        )}
      </div>

      {!isActive && !isFinished && (
        <div className="w-full rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col items-center justify-center p-8 text-center shadow-md">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-500 mb-4 border border-cyan-500/20">
            <Eye className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">{t.title}</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-md mb-6 leading-relaxed">{t.subtitle}</p>
          <Button variant="emerald" size="lg" onClick={() => handleStart(false)} className="gap-2 cursor-pointer">
            <Play className="w-4 h-4" />
            <span>{t.startBtn}</span>
          </Button>
        </div>
      )}

      {isActive && currentTrial && (
        <div className="w-full flex flex-col items-center">
          <div
            data-contrast-tilt={currentTrial.tilt}
            data-contrast-pct={currentTrial.contrast_pct}
            className="w-full h-64 rounded-3xl bg-[#808080] flex items-center justify-center shadow-inner mb-6 border border-zinc-300 dark:border-zinc-700"
          >
            <canvas
              ref={canvasRef}
              width={220}
              height={220}
              className="w-48 h-48 rounded-full shadow-md"
            />
          </div>

          <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 mb-3">{t.question}</p>

          <div className="grid grid-cols-3 gap-3 w-full max-w-md">
            <Button
              variant="outline"
              onClick={() => handleAnswer('left')}
              data-contrast-answer="left"
              className="py-3.5 text-xs sm:text-sm font-bold cursor-pointer"
            >
              {t.tiltLeft}
            </Button>
            <Button
              variant="outline"
              onClick={() => handleAnswer('unsure')}
              data-contrast-answer="unsure"
              className="py-3.5 text-xs sm:text-sm font-semibold text-zinc-500 cursor-pointer"
            >
              {t.cantSee}
            </Button>
            <Button
              variant="outline"
              onClick={() => handleAnswer('right')}
              data-contrast-answer="right"
              className="py-3.5 text-xs sm:text-sm font-bold cursor-pointer"
            >
              {t.tiltRight}
            </Button>
          </div>
        </div>
      )}

      {isFinished && summaryStats && (
        <div className="w-full rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 text-center shadow-xl">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-4">
            <Award className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">{t.finishTitle}</h3>

          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700 max-w-xs mx-auto my-6">
            <div className="text-xs text-zinc-500 mb-1">{t.thresholdLabel}</div>
            <div className="text-4xl font-black text-emerald-500 font-mono">
              {summaryStats.threshold !== null ? `${summaryStats.threshold}%` : '—'}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
            <Button variant="outline" onClick={() => handleStart(true)} className="gap-2 flex-1 cursor-pointer">
              <RotateCcw className="w-4 h-4" />
              <span>{t.tryAgain}</span>
            </Button>
            <Button variant="emerald" onClick={handleFinish} className="gap-2 flex-1 cursor-pointer">
              <CheckCircle className="w-4 h-4" />
              <span>{t.finishBtn}</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
