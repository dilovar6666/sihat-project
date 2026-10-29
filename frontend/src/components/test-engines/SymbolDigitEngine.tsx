import React, { useState, useRef, useEffect } from 'react'
import { Hash, Clock, Award, CheckCircle, RotateCcw, Play } from 'lucide-react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { noAdjacentRepeats, shuffleArray, type InteractiveEngineProps } from './engineTypes'

const SYMBOLS = ['circle', 'square', 'triangle', 'diamond', 'cross', 'star', 'hexagon', 'bars', 'ring']

interface SymbolKeyPair {
  symbol: string
  digit: number
}

function buildFallbackSymbolDigit(): {
  key: SymbolKeyPair[]
  prompts: string[]
  time_limit_sec: number
} {
  const digits = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9])
  const key = SYMBOLS.map((symbol, idx) => ({ symbol, digit: digits[idx] }))
  const prompts = noAdjacentRepeats(140, SYMBOLS)
  return { key, prompts, time_limit_sec: 90 }
}

const renderSymbolGlyph = (symbol: string, sizeClass = 'w-6 h-6') => {
  switch (symbol) {
    case 'circle':
      return (
        <svg viewBox="0 0 24 24" className={sizeClass} fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="8" />
        </svg>
      )
    case 'square':
      return (
        <svg viewBox="0 0 24 24" className={sizeClass} fill="none" stroke="currentColor" strokeWidth="2.5">
          <rect x="4.5" y="4.5" width="15" height="15" rx="2" />
        </svg>
      )
    case 'triangle':
      return (
        <svg viewBox="0 0 24 24" className={sizeClass} fill="none" stroke="currentColor" strokeWidth="2.5">
          <polygon points="12,4 21,19.5 3,19.5" strokeLinejoin="round" />
        </svg>
      )
    case 'diamond':
      return (
        <svg viewBox="0 0 24 24" className={sizeClass} fill="none" stroke="currentColor" strokeWidth="2.5">
          <polygon points="12,3 21,12 12,21 3,12" strokeLinejoin="round" />
        </svg>
      )
    case 'cross':
      return (
        <svg viewBox="0 0 24 24" className={sizeClass} fill="none" stroke="currentColor" strokeWidth="2.8">
          <path d="M12 4v16M4 12h16" strokeLinecap="round" />
        </svg>
      )
    case 'star':
      return (
        <svg viewBox="0 0 24 24" className={sizeClass} fill="none" stroke="currentColor" strokeWidth="2.2">
          <polygon
            points="12,3 14.8,8.8 21,9.7 16.5,14.1 17.6,20.3 12,17.3 6.4,20.3 7.5,14.1 3,9.7 9.2,8.8"
            strokeLinejoin="round"
          />
        </svg>
      )
    case 'hexagon':
      return (
        <svg viewBox="0 0 24 24" className={sizeClass} fill="none" stroke="currentColor" strokeWidth="2.4">
          <polygon points="12,3 20,7.5 20,16.5 12,21 4,16.5 4,7.5" strokeLinejoin="round" />
        </svg>
      )
    case 'bars':
      return (
        <svg viewBox="0 0 24 24" className={sizeClass} fill="none" stroke="currentColor" strokeWidth="2.6">
          <path d="M5 8h14M5 12h14M5 16h14" strokeLinecap="round" />
        </svg>
      )
    case 'ring':
    default:
      return (
        <svg viewBox="0 0 24 24" className={sizeClass} fill="none" stroke="currentColor" strokeWidth="2.3">
          <circle cx="12" cy="12" r="8.5" />
          <circle cx="12" cy="12" r="3.2" fill="currentColor" />
        </svg>
      )
  }
}

export const SymbolDigitEngine: React.FC<InteractiveEngineProps> = ({
  lang,
  challenge,
  onComplete,
  onRequestNewTask,
}) => {
  const [task, setTask] = useState(() =>
    Array.isArray(challenge?.key) && Array.isArray(challenge?.prompts)
      ? {
          key: challenge.key as SymbolKeyPair[],
          prompts: challenge.prompts as string[],
          time_limit_sec: Number(challenge.time_limit_sec) || 90,
        }
      : buildFallbackSymbolDigit()
  )
  const [promptIdx, setPromptIdx] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [errorsCount, setErrorsCount] = useState(0)
  const [timeLeft, setTimeLeft] = useState(task.time_limit_sec)
  const [isActive, setIsActive] = useState(false)
  const [isFinished, setIsFinished] = useState(false)

  const timerRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)
  const responsesRef = useRef<Array<{ i: number; d: number; t: number }>>([])
  const usedChallengeRef = useRef(false)

  useEffect(() => {
    if (Array.isArray(challenge?.key) && Array.isArray(challenge?.prompts) && !isActive && !isFinished) {
      const limit = Number(challenge.time_limit_sec) || 90
      setTask({
        key: challenge.key as SymbolKeyPair[],
        prompts: challenge.prompts as string[],
        time_limit_sec: limit,
      })
      setTimeLeft(limit)
      usedChallengeRef.current = false
    }
  }, [challenge, isActive, isFinished])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const t = {
    ru: {
      title: 'Сопоставление символов и чисел',
      subtitle: 'По таблице-ключу наверху как можно быстрее выбирайте цифру (1–9), соответствующую текущему символу.',
      standard: 'Symbol-Digit Substitution • Скорость перекодирования',
      referenceKey: 'Ключ соответствия (меняется в каждой попытке):',
      correctLabel: 'Верно',
      timeLeft: 'Осталось',
      sec: 'с',
      startBtn: 'Начать 90-секундный тест',
      finishEarlyBtn: 'Завершить и перейти к отчёту',
      finishTitle: 'Сопоставление символов завершено',
      processedResult: 'Верных ответов',
      itemsPerMin: 'Темп (знаков/мин)',
      finishBtn: 'Показать подробный отчёт',
      tryAgain: 'Новый вариант',
    },
    tj: {
      title: 'Мувофиқати рамзҳо ва рақамҳо',
      subtitle: 'Бо истифода аз ҷадвали болоӣ, рақами мувофиқи рамзи нишондодашударо (1–9) ҳарчи зудтар интихоб намоед.',
      standard: 'Symbol-Digit Substitution • Суръати коркарди иттилоот',
      referenceKey: 'Калиди мувофиқат (дар ҳар кӯшиш иваз мешавад):',
      correctLabel: 'Дуруст',
      timeLeft: 'Боқимонда',
      sec: 'с',
      startBtn: 'Оғози санҷиши 90-сониягӣ',
      finishEarlyBtn: 'Анҷом ва дидани ҳисобот',
      finishTitle: 'Мувофиқати рамзҳо анҷом ёфт',
      processedResult: 'Ҷавобҳои дуруст',
      itemsPerMin: 'Суръат (дар 1 дақ)',
      finishBtn: 'Дидани ҳисоботи муфассал',
      tryAgain: 'Варианти нав',
    },
    en: {
      title: 'Symbol-Digit Substitution',
      subtitle: 'Using the legend at the top, rapidly select the digit (1–9) that matches each symbol shown.',
      standard: 'Symbol-Digit Substitution • Processing Speed',
      referenceKey: 'Reference Key (randomized every attempt):',
      correctLabel: 'Correct',
      timeLeft: 'Remaining',
      sec: 's',
      startBtn: 'Start 90-Second Test',
      finishEarlyBtn: 'Finish & View Report',
      finishTitle: 'Symbol-Digit Substitution Completed',
      processedResult: 'Correct Matches',
      itemsPerMin: 'Rate (per min)',
      finishBtn: 'View Detailed Report',
      tryAgain: 'New Variant',
    },
  }[lang]

  const handleStart = (requestFresh = false) => {
    if (requestFresh && onRequestNewTask) {
      onRequestNewTask()
    }
    let nextTask = task
    if (!usedChallengeRef.current && Array.isArray(challenge?.key) && Array.isArray(challenge?.prompts)) {
      nextTask = {
        key: challenge.key as SymbolKeyPair[],
        prompts: challenge.prompts as string[],
        time_limit_sec: Number(challenge.time_limit_sec) || 90,
      }
      setTask(nextTask)
      usedChallengeRef.current = true
    } else {
      nextTask = buildFallbackSymbolDigit()
      setTask(nextTask)
    }

    responsesRef.current = []
    setPromptIdx(0)
    setCorrectCount(0)
    setErrorsCount(0)
    setTimeLeft(nextTask.time_limit_sec)
    setIsFinished(false)
    setIsActive(true)
    startTimeRef.current = performance.now()

    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = window.setInterval(() => {
      const elapsedSec = Math.floor((performance.now() - startTimeRef.current) / 1000)
      const rem = Math.max(0, nextTask.time_limit_sec - elapsedSec)
      setTimeLeft(rem)
      if (rem <= 0) {
        if (timerRef.current) clearInterval(timerRef.current)
        setIsActive(false)
        setIsFinished(true)
      }
    }, 250)
  }

  const handleDigitInput = (digit: number) => {
    if (!isActive || isFinished) return
    const currentSymbol = task.prompts[promptIdx]
    if (!currentSymbol) return

    const mapping = new Map(task.key.map((k) => [k.symbol, k.digit]))
    const expectedDigit = mapping.get(currentSymbol)

    const rawElapsed = Math.min(task.time_limit_sec * 1000, Math.round(performance.now() - startTimeRef.current))
    const prevT = responsesRef.current.length > 0 ? responsesRef.current[responsesRef.current.length - 1].t : 0
    const recordedT = Math.min(task.time_limit_sec * 1000, Math.max(rawElapsed, prevT + 50))

    responsesRef.current.push({
      i: promptIdx,
      d: digit,
      t: recordedT,
    })

    if (digit === expectedDigit) {
      setCorrectCount((c) => c + 1)
    } else {
      setErrorsCount((e) => e + 1)
    }

    if (promptIdx + 1 >= task.prompts.length) {
      if (timerRef.current) clearInterval(timerRef.current)
      setIsActive(false)
      setIsFinished(true)
    } else {
      setPromptIdx((i) => i + 1)
    }
  }

  // Keyboard support for 1-9
  useEffect(() => {
    if (!isActive || isFinished) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '1' && e.key <= '9') {
        e.preventDefault()
        handleDigitInput(Number(e.key))
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  const handleFinish = () => {
    const responses = responsesRef.current
    const attempted = responses.length
    const bins = [0, 0, 0, 0, 0, 0]
    const mapping = new Map(task.key.map((k) => [k.symbol, k.digit]))
    for (const r of responses) {
      if (r.d === mapping.get(task.prompts[r.i])) {
        bins[Math.min(5, Math.floor(r.t / 15000))] += 1
      }
    }
    const accuracyPct = attempted > 0 ? Number(((correctCount / attempted) * 100).toFixed(1)) : 0
    const speedPerMin = Number(((correctCount * 60) / task.time_limit_sec).toFixed(1))

    onComplete({
      summary: `${t.processedResult}: ${correctCount} (${accuracyPct}%), ${speedPerMin} / мин`,
      metrics: {
        version: 2,
        engine: 'symbol_digit',
        metrics: {
          correct_count: correctCount,
          errors_count: errorsCount,
          items_attempted: attempted,
          accuracy_pct: accuracyPct,
          speed_per_minute: speedPerMin,
        },
        series: {
          correct_per_15s: bins,
        },
      },
      telemetry: {
        responses,
      },
    })
  }

  const currentSymbol = task.prompts[promptIdx] || task.prompts[0]

  return (
    <div className="flex flex-col items-center max-w-xl mx-auto w-full select-none">
      <div className="w-full flex items-center justify-between gap-3 mb-4">
        <Badge variant="cyan" className="gap-1.5 py-1.5 px-3">
          <Hash className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
          <span className="truncate">{t.standard}</span>
        </Badge>
        {isActive && (
          <button
            onClick={() => handleStart(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono text-zinc-600 dark:text-zinc-300 hover:text-cyan-500 border border-zinc-200/60 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 transition-colors shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t.tryAgain}</span>
          </button>
        )}
      </div>

      {isActive && (
        <div className="w-full mb-5 p-4 rounded-3xl liquid-glass border border-cyan-500/25 shadow-lg">
          <div className="grid grid-cols-2 gap-3 items-center">
            <div className="p-3 rounded-2xl liquid-glass-pill border border-emerald-500/30 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-mono text-xl font-black shrink-0 border border-emerald-500/40">
                {correctCount}
              </div>
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold truncate">
                  {t.correctLabel}
                </div>
                <div className="text-sm font-mono font-bold text-zinc-900 dark:text-zinc-100">
                  <span className="text-emerald-500 text-base font-black">{correctCount}</span>
                  <span className="text-zinc-400 text-xs"> / {promptIdx}</span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-2xl liquid-glass-pill border border-cyan-500/30 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/40">
                <Clock className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold truncate">
                  {t.timeLeft}
                </div>
                <div className="text-base font-mono font-black text-cyan-600 dark:text-cyan-400 truncate">
                  {timeLeft} <span className="text-xs font-normal text-zinc-400">{t.sec}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!isActive && !isFinished && (
        <div className="w-full rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col items-center justify-center p-8 text-center shadow-md">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-500 mb-4 border border-cyan-500/20">
            <Hash className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">{t.title}</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-md mb-6 leading-relaxed">{t.subtitle}</p>
          <Button variant="emerald" size="lg" onClick={() => handleStart(false)} className="gap-2 cursor-pointer">
            <Play className="w-4 h-4" />
            <span>{t.startBtn}</span>
          </Button>
        </div>
      )}

      {isActive && (
        <div className="w-full flex flex-col items-center">
          <div className="w-full p-3.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 mb-5">
            <div className="text-[10px] uppercase font-mono text-zinc-500 dark:text-zinc-400 mb-2 text-center">
              {t.referenceKey}
            </div>
            <div className="grid grid-cols-9 gap-1.5 text-center">
              {task.key.map((item) => (
                <div
                  key={item.symbol}
                  data-sdmt-key-symbol={item.symbol}
                  data-sdmt-key-digit={item.digit}
                  className="flex flex-col items-center p-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-700"
                >
                  <span className="text-emerald-500 mb-1">
                    {renderSymbolGlyph(item.symbol, 'w-5 h-5 sm:w-6 sm:h-6')}
                  </span>
                  <span className="text-xs sm:text-sm font-mono font-extrabold text-zinc-900 dark:text-zinc-100">
                    {item.digit}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div
            data-sdmt-current-symbol={currentSymbol}
            className="w-full h-36 sm:h-40 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col items-center justify-center shadow-xl mb-5"
          >
            <div className="text-emerald-500">{renderSymbolGlyph(currentSymbol, 'w-16 h-16 sm:w-20 sm:h-20')}</div>
            <div className="mt-2 text-[11px] font-mono text-zinc-400">#{promptIdx + 1}</div>
          </div>

          <div className="grid grid-cols-3 gap-2.5 w-full max-w-xs mb-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                type="button"
                data-sdmt-digit={num}
                onClick={() => handleDigitInput(num)}
                className="h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-600 text-2xl font-mono font-bold transition-all shadow-xs active:scale-95 text-zinc-900 dark:text-zinc-100 cursor-pointer"
              >
                {num}
              </button>
            ))}
          </div>

          {promptIdx >= 8 && (
            <button
              type="button"
              onClick={() => {
                if (timerRef.current) clearInterval(timerRef.current)
                setIsActive(false)
                setIsFinished(true)
              }}
              className="text-xs font-semibold text-zinc-500 hover:text-emerald-500 underline cursor-pointer mt-1"
            >
              {t.finishEarlyBtn}
            </button>
          )}
        </div>
      )}

      {isFinished && (
        <div className="w-full rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 text-center shadow-xl">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-4">
            <Award className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">{t.finishTitle}</h3>

          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto my-6">
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700">
              <div className="text-xs text-zinc-500 mb-1">{t.processedResult}</div>
              <div className="text-3xl font-extrabold text-emerald-500 font-mono">{correctCount}</div>
            </div>
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700">
              <div className="text-xs text-zinc-500 mb-1">{t.itemsPerMin}</div>
              <div className="text-3xl font-extrabold text-cyan-500 font-mono">
                {((correctCount * 60) / task.time_limit_sec).toFixed(1)}
              </div>
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
