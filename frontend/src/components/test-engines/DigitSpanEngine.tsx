import React, { useState, useEffect, useRef } from 'react'
import { Brain, Award, CheckCircle, RotateCcw, Play, Delete } from 'lucide-react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { noAdjacentRepeats, prefersReducedMotion, type InteractiveEngineProps } from './engineTypes'

interface DigitTrial {
  id: string
  length: number
  digits: number[]
}

function buildFallbackDigitSpan(): { forward: DigitTrial[]; backward: DigitTrial[] } {
  const pool = [1, 2, 3, 4, 5, 6, 7, 8, 9]
  const buildMode = (prefix: string, minLen: number, maxLen: number): DigitTrial[] => {
    const out: DigitTrial[] = []
    for (let length = minLen; length <= maxLen; length++) {
      for (const n of [1, 2]) {
        out.push({
          id: `${prefix}${length}-${n}`,
          length,
          digits: noAdjacentRepeats(length, pool),
        })
      }
    }
    return out
  }
  return {
    forward: buildMode('f', 3, 9),
    backward: buildMode('b', 2, 8),
  }
}

export const DigitSpanEngine: React.FC<InteractiveEngineProps> = ({
  lang,
  challenge,
  onComplete,
  onRequestNewTask,
}) => {
  const [task, setTask] = useState<{ forward: DigitTrial[]; backward: DigitTrial[] }>(() =>
    Array.isArray(challenge?.forward) && Array.isArray(challenge?.backward)
      ? { forward: challenge.forward as DigitTrial[], backward: challenge.backward as DigitTrial[] }
      : buildFallbackDigitSpan()
  )
  const [mode, setMode] = useState<'forward' | 'backward'>('forward')
  const [trialIndex, setTrialIndex] = useState(0)
  const [currentFlashingDigit, setCurrentFlashingDigit] = useState<number | null>(null)
  const [isFlashing, setIsFlashing] = useState(false)
  const [userInput, setUserInput] = useState<number[]>([])
  const [forwardSpan, setForwardSpan] = useState(0)
  const [backwardSpan, setBackwardSpan] = useState(0)
  const [isBetweenModes, setIsBetweenModes] = useState(false)
  const [isActive, setIsActive] = useState(false)
  const [isFinished, setIsFinished] = useState(false)

  const timersRef = useRef<number[]>([])
  const responsesRef = useRef<Array<{ id: string; answer: number[] }>>([])
  const forwardPassedRef = useRef<Record<number, boolean[]>>({})
  const backwardPassedRef = useRef<Record<number, boolean[]>>({})
  const usedChallengeRef = useRef(false)

  const clearTimers = () => {
    timersRef.current.forEach((id) => window.clearTimeout(id))
    timersRef.current = []
  }

  useEffect(() => {
    if (Array.isArray(challenge?.forward) && Array.isArray(challenge?.backward) && !isActive && !isFinished) {
      setTask({ forward: challenge.forward as DigitTrial[], backward: challenge.backward as DigitTrial[] })
      usedChallengeRef.current = false
    }
  }, [challenge, isActive, isFinished])

  useEffect(() => {
    return () => clearTimers()
  }, [])

  const t = {
    ru: {
      title: 'Память на цифры (Прямой и обратный ряд)',
      subtitle: 'Часть 1 — прямой порядок: введите показанные цифры в том же порядке. Часть 2 — обратный порядок: введите цифры с конца к началу.',
      standard: 'Digit Span • Рабочая и кратковременная память',
      forwardLabel: 'Прямой ряд: в том же порядке',
      backwardLabel: 'Обратный ряд: в обратном порядке (с конца)',
      watchCard: 'Запоминайте появляющиеся цифры...',
      enterForward: 'Введите цифры в ПРЯМОМ порядке:',
      enterBackward: 'Введите цифры в ОБРАТНОМ порядке:',
      span: 'Длина:',
      digits: 'цифр',
      startBtn: 'Начать прямой ряд',
      startBackwardBtn: 'Перейти к обратному ряду',
      forwardDoneTitle: 'Прямой цифровой ряд завершён!',
      forwardDoneDesc: 'Во второй части вводите показанные цифры в ОБРАТНОМ порядке (например, если показано 4 → 7 → 2, введите 274).',
      submitBtn: 'Подтвердить',
      finishTitle: 'Тест памяти на цифры завершён',
      forwardResult: 'Прямой ряд',
      backwardResult: 'Обратный ряд',
      finishBtn: 'Показать подробный отчёт',
      tryAgain: 'Новый вариант',
    },
    tj: {
      title: 'Хотираи рақамҳо (Мустақим ва бозгаштӣ)',
      subtitle: 'Қисми 1 — бо ҳамон тартиб ворид кунед. Қисми 2 — рақамҳоро аз охир ба аввал (бозгаштӣ) ворид намоед.',
      standard: 'Digit Span • Хотираи кӯтоҳмуддат ва корӣ',
      forwardLabel: 'Қатори мустақим: бо ҳамон тартиб',
      backwardLabel: 'Қатори бозгаштӣ: аз охир ба аввал',
      watchCard: 'Рақамҳои пайдошавандаро дар хотир гиред...',
      enterForward: 'Рақамҳоро бо тартиби МУСТАҚИМ дохил кунед:',
      enterBackward: 'Рақамҳоро бо тартиби БОЗГАШТӢ дохил кунед:',
      span: 'Дарозӣ:',
      digits: 'рақам',
      startBtn: 'Оғози қатори мустақим',
      startBackwardBtn: 'Гузаштан ба қатори бозгаштӣ',
      forwardDoneTitle: 'Қатори мустақим анҷом ёфт!',
      forwardDoneDesc: 'Дар қисми дуюм рақамҳои нишондодашударо БАРЪАКС (аз охир ба аввал) ворид намоед.',
      submitBtn: 'Тасдиқ',
      finishTitle: 'Санҷиши хотираи рақамҳо анҷом ёфт',
      forwardResult: 'Қатори мустақим',
      backwardResult: 'Қатори бозгаштӣ',
      finishBtn: 'Дидани ҳисоботи муфассал',
      tryAgain: 'Варианти нав',
    },
    en: {
      title: 'Digit Span (Forward & Backward)',
      subtitle: 'Part 1 — Forward: enter the flashed digits in the same order. Part 2 — Backward: enter the digits in reverse order.',
      standard: 'Digit Span • Short-Term & Working Memory',
      forwardLabel: 'Forward Span: same order',
      backwardLabel: 'Backward Span: reverse order',
      watchCard: 'Memorize the sequence of digits...',
      enterForward: 'Enter digits in FORWARD order:',
      enterBackward: 'Enter digits in REVERSE order:',
      span: 'Length:',
      digits: 'digits',
      startBtn: 'Start Forward Span',
      startBackwardBtn: 'Continue to Backward Span',
      forwardDoneTitle: 'Forward Span Completed!',
      forwardDoneDesc: 'In Part 2, enter the shown digits in REVERSE order (for example, if 4 → 7 → 2 is shown, enter 274).',
      submitBtn: 'Submit',
      finishTitle: 'Digit Span Completed',
      forwardResult: 'Forward Span',
      backwardResult: 'Backward Span',
      finishBtn: 'View Detailed Report',
      tryAgain: 'New Variant',
    },
  }[lang]

  const flashSequence = (seq: number[]) => {
    clearTimers()
    setIsFlashing(true)
    setUserInput([])
    setCurrentFlashingDigit(null)

    const reduced = prefersReducedMotion()
    const showMs = reduced ? 500 : 650
    const stepMs = reduced ? 700 : 880

    seq.forEach((digit, idx) => {
      const t1 = window.setTimeout(() => {
        setCurrentFlashingDigit(digit)
      }, 250 + idx * stepMs)
      const t2 = window.setTimeout(() => {
        setCurrentFlashingDigit(null)
      }, 250 + idx * stepMs + showMs)
      timersRef.current.push(t1, t2)
    })

    const doneId = window.setTimeout(() => {
      setCurrentFlashingDigit(null)
      setIsFlashing(false)
    }, 300 + seq.length * stepMs)
    timersRef.current.push(doneId)
  }

  const handleStart = (requestFresh = false) => {
    if (requestFresh && onRequestNewTask) {
      onRequestNewTask()
    }
    let nextTask = task
    if (!usedChallengeRef.current && Array.isArray(challenge?.forward) && Array.isArray(challenge?.backward)) {
      nextTask = { forward: challenge.forward as DigitTrial[], backward: challenge.backward as DigitTrial[] }
      setTask(nextTask)
      usedChallengeRef.current = true
    } else {
      nextTask = buildFallbackDigitSpan()
      setTask(nextTask)
    }

    responsesRef.current = []
    forwardPassedRef.current = {}
    backwardPassedRef.current = {}
    setForwardSpan(0)
    setBackwardSpan(0)
    setMode('forward')
    setTrialIndex(0)
    setIsBetweenModes(false)
    setIsFinished(false)
    setIsActive(true)
    flashSequence(nextTask.forward[0].digits)
  }

  const handleStartBackward = () => {
    setMode('backward')
    setTrialIndex(0)
    setIsBetweenModes(false)
    setIsActive(true)
    flashSequence(task.backward[0].digits)
  }

  const activeTrials = mode === 'forward' ? task.forward : task.backward
  const currentTrial = activeTrials[trialIndex]

  const handleSubmit = () => {
    if (!isActive || isFlashing || !currentTrial || userInput.length === 0) return

    const expected = mode === 'backward' ? [...currentTrial.digits].reverse() : currentTrial.digits
    const ok =
      userInput.length === expected.length && userInput.every((val, idx) => val === expected[idx])

    responsesRef.current.push({
      id: currentTrial.id,
      answer: userInput,
    })

    const mapRef = mode === 'forward' ? forwardPassedRef.current : backwardPassedRef.current
    const arr = mapRef[currentTrial.length] || []
    arr.push(ok)
    mapRef[currentTrial.length] = arr

    if (ok) {
      if (mode === 'forward') setForwardSpan((prev) => Math.max(prev, currentTrial.length))
      else setBackwardSpan((prev) => Math.max(prev, currentTrial.length))
    }

    const nextIdx = trialIndex + 1
    if (nextIdx >= activeTrials.length) {
      if (mode === 'forward') {
        setIsActive(false)
        setIsBetweenModes(true)
      } else {
        setIsActive(false)
        setIsFinished(true)
      }
      return
    }

    const nextTrial = activeTrials[nextIdx]
    const minLen = mode === 'forward' ? 3 : 2
    const prevLenResults = mapRef[nextTrial.length - 1]
    if (
      nextTrial.length > minLen &&
      (!mapRef[nextTrial.length] || mapRef[nextTrial.length].length === 0) &&
      prevLenResults &&
      prevLenResults.length >= 2 &&
      !prevLenResults.some(Boolean)
    ) {
      if (mode === 'forward') {
        setIsActive(false)
        setIsBetweenModes(true)
      } else {
        setIsActive(false)
        setIsFinished(true)
      }
      return
    }

    setTrialIndex(nextIdx)
    flashSequence(nextTrial.digits)
  }

  // Keyboard support for digits 1-9, Backspace, Enter
  useEffect(() => {
    if (!isActive || isFlashing) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '1' && e.key <= '9') {
        e.preventDefault()
        setUserInput((prev) => (prev.length < 12 ? [...prev, Number(e.key)] : prev))
      } else if (e.key === 'Backspace') {
        e.preventDefault()
        setUserInput((prev) => prev.slice(0, -1))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        handleSubmit()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  const handleFinish = () => {
    const fSeries = Object.entries(forwardPassedRef.current).map(([l, res]) => ({
      length: Number(l),
      passed: res.filter(Boolean).length,
      of: res.length,
    }))
    const bSeries = Object.entries(backwardPassedRef.current).map(([l, res]) => ({
      length: Number(l),
      passed: res.filter(Boolean).length,
      of: res.length,
    }))
    const passed =
      fSeries.reduce((a, b) => a + b.passed, 0) + bSeries.reduce((a, b) => a + b.passed, 0)
    const attempted = responsesRef.current.length
    const accuracyPct = attempted > 0 ? Number(((passed / attempted) * 100).toFixed(1)) : 0

    onComplete({
      summary: `${t.forwardResult}: ${forwardSpan}, ${t.backwardResult}: ${backwardSpan}`,
      metrics: {
        version: 2,
        engine: 'digit_span',
        metrics: {
          forward_span: forwardSpan,
          backward_span: backwardSpan,
          trials_passed: passed,
          trials_attempted: attempted,
          accuracy_pct: accuracyPct,
        },
        series: {
          forward: fSeries,
          backward: bSeries,
        },
      },
      telemetry: {
        responses: responsesRef.current,
      },
    })
  }

  return (
    <div className="flex flex-col items-center max-w-xl mx-auto w-full select-none">
      <div className="w-full flex items-center justify-between gap-2 mb-4">
        <Badge variant="cyan" className="gap-1.5 py-1.5 px-3">
          <Brain className="w-3.5 h-3.5 text-cyan-500" />
          <span className="truncate">{t.standard}</span>
        </Badge>
        {isActive && currentTrial && (
          <span className="text-xs font-mono text-zinc-500">
            {t.span} <strong className="text-cyan-500">{currentTrial.length}</strong> {t.digits} ({currentTrial.id})
          </span>
        )}
      </div>

      {!isActive && !isBetweenModes && !isFinished && (
        <div className="w-full rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col items-center justify-center p-8 text-center shadow-md">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-500 mb-4 border border-cyan-500/20">
            <Brain className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">{t.title}</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-md mb-6 leading-relaxed">{t.subtitle}</p>
          <Button variant="emerald" size="lg" onClick={() => handleStart(false)} className="gap-2 cursor-pointer">
            <Play className="w-4 h-4" />
            <span>{t.startBtn}</span>
          </Button>
        </div>
      )}

      {isBetweenModes && (
        <div className="w-full rounded-3xl border border-emerald-500/30 bg-white dark:bg-zinc-900 flex flex-col items-center justify-center p-8 text-center shadow-lg">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 flex items-center justify-center text-emerald-500 mb-3">
            <CheckCircle className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-1">
            {t.forwardDoneTitle} ({forwardSpan} {t.digits})
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-md mb-6 leading-relaxed">{t.forwardDoneDesc}</p>
          <Button variant="emerald" size="lg" onClick={handleStartBackward} className="gap-2 cursor-pointer">
            <Play className="w-4 h-4" />
            <span>{t.startBackwardBtn}</span>
          </Button>
        </div>
      )}

      {isActive && currentTrial && (
        <div className="w-full flex flex-col items-center">
          <div className="mb-3 px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            {mode === 'forward' ? t.forwardLabel : t.backwardLabel}
          </div>

          <div className="w-full h-48 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col items-center justify-center p-6 shadow-xl mb-6">
            {isFlashing ? (
              <div className="flex flex-col items-center">
                <span className="text-xs text-zinc-400 mb-2">{t.watchCard}</span>
                <div className="text-7xl font-mono font-black text-emerald-500 min-h-[76px] flex items-center justify-center">
                  {currentFlashingDigit !== null ? currentFlashingDigit : '•'}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <span className="text-xs text-zinc-500 dark:text-zinc-400 mb-2 font-semibold">
                  {mode === 'forward' ? t.enterForward : t.enterBackward}
                </span>
                <div
                  data-digit-input-display
                  className="h-14 px-6 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 flex items-center justify-center text-3xl font-mono font-bold tracking-widest text-zinc-900 dark:text-zinc-100 min-w-48"
                >
                  {userInput.length > 0 ? userInput.join(' ') : '—'}
                </div>
              </div>
            )}
          </div>

          {!isFlashing && (
            <div className="w-full max-w-xs flex flex-col items-center mb-4">
              <div className="grid grid-cols-3 gap-2.5 w-full mb-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    type="button"
                    data-digit-key={num}
                    onClick={() => setUserInput((prev) => (prev.length < 12 ? [...prev, num] : prev))}
                    className="h-13 sm:h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-600 text-xl font-mono font-bold transition-all shadow-xs active:scale-95 text-zinc-900 dark:text-zinc-100 cursor-pointer"
                  >
                    {num}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2.5 w-full">
                <button
                  type="button"
                  onClick={() => setUserInput((prev) => prev.slice(0, -1))}
                  className="h-12 rounded-2xl bg-zinc-200/70 dark:bg-zinc-800 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center gap-1.5 text-xs font-bold cursor-pointer"
                >
                  <Delete className="w-4 h-4" />
                  <span>Стереть</span>
                </button>
                <Button
                  variant="emerald"
                  onClick={handleSubmit}
                  disabled={userInput.length === 0}
                  className="h-12 rounded-2xl font-bold cursor-pointer"
                >
                  {t.submitBtn}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {isFinished && (
        <div className="w-full rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 text-center shadow-xl">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-4">
            <Award className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">{t.finishTitle}</h3>

          <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto my-6">
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700">
              <div className="text-xs text-zinc-500 mb-1">{t.forwardResult}</div>
              <div className="text-3xl font-black text-emerald-500 font-mono">{forwardSpan}</div>
            </div>
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700">
              <div className="text-xs text-zinc-500 mb-1">{t.backwardResult}</div>
              <div className="text-3xl font-black text-cyan-500 font-mono">{backwardSpan}</div>
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
