import React, { useState, useEffect, useRef } from 'react'
import { Play, RotateCcw, Clock, Award, CheckCircle, Crosshair } from 'lucide-react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { shuffleArray, type InteractiveEngineProps } from './engineTypes'
import { playSoundSuccess, playSoundError, playSoundComplete } from '../../lib/soundFx'

export const SchulteTableEngine: React.FC<InteractiveEngineProps> = ({
  lang,
  challenge,
  onComplete,
  onRequestNewTask,
}) => {
  const [grid, setGrid] = useState<number[]>(() =>
    Array.isArray(challenge?.grid) && challenge.grid.length === 25
      ? challenge.grid
      : shuffleArray(Array.from({ length: 25 }, (_, i) => i + 1))
  )
  const [currentExpected, setCurrentExpected] = useState(1)
  const [isActive, setIsActive] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  const [elapsedSec, setElapsedSec] = useState(0)
  const [errors, setErrors] = useState(0)
  const [wrongCell, setWrongCell] = useState<number | null>(null)

  const timerRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)
  const clicksRef = useRef<Array<{ v: number; t: number }>>([])
  const usedChallengeRef = useRef<boolean>(false)

  useEffect(() => {
    if (Array.isArray(challenge?.grid) && challenge.grid.length === 25 && !isActive && !isFinished) {
      setGrid(challenge.grid)
      usedChallengeRef.current = false
    }
  }, [challenge, isActive, isFinished])

  const t = {
    ru: {
      title: 'Таблицы Шульте (5 × 5)',
      subtitle: 'Последовательно находите и нажимайте числа от 1 до 25 без пропусков как можно быстрее. Старайтесь удерживать взгляд ближе к центру таблицы.',
      standard: 'Таблицы Шульте • Распределение и темп внимания',
      startBtn: 'Начать поиск (1 → 25)',
      nextTarget: 'Ищите число',
      time: 'Время',
      sec: 'с',
      errors: 'Ошибок:',
      progress: 'Прогресс:',
      hintOrder: 'Нажимайте числа строго по порядку (1 → 25)',
      finishTitle: 'Таблица Шульте пройдена!',
      totalTimeLabel: 'Общее время поиска',
      avgStepLabel: 'Средний шаг',
      ms: 'мс',
      completeBtn: 'Показать подробный результат',
      tryAgain: 'Новый вариант',
    },
    tj: {
      title: 'Ҷадвалҳои Шулте (5 × 5)',
      subtitle: 'Ададҳоро аз 1 то 25 пайдарпай ва ҳарчи зудтар пайдо карда пахш намоед. Кӯшиш кунед нигоҳро дар маркази ҷадвал нигоҳ доред.',
      standard: 'Ҷадвали Шулте • Тақсимот ва суръати диққат',
      startBtn: 'Оғози ҷустуҷӯ (1 → 25)',
      nextTarget: 'Адади лозима:',
      time: 'Вақт:',
      sec: 'с',
      errors: 'Хатоҳо:',
      progress: 'Пешрафт:',
      hintOrder: 'Ададҳоро бо тартиб пахш намоед (1 → 25)',
      finishTitle: 'Ҷадвали Шулте анҷом ёфт!',
      totalTimeLabel: 'Вақти умумии ҷустуҷӯ',
      avgStepLabel: 'Қадами миёна',
      ms: 'мс',
      completeBtn: 'Дидани натиҷаи муфассал',
      tryAgain: 'Варианти нав',
    },
    en: {
      title: 'Schulte Table (5 × 5)',
      subtitle: 'Locate and tap numbers from 1 to 25 in ascending order as quickly as possible while keeping your gaze near the center of the grid.',
      standard: 'Schulte Paradigm • Visual Search & Attention Pace',
      startBtn: 'Start Search (1 → 25)',
      nextTarget: 'Find number:',
      time: 'Time:',
      sec: 's',
      errors: 'Errors:',
      progress: 'Progress:',
      hintOrder: 'Tap numbers strictly in ascending order (1 → 25)',
      finishTitle: 'Schulte Grid Completed!',
      totalTimeLabel: 'Total Search Time',
      avgStepLabel: 'Average Step',
      ms: 'ms',
      completeBtn: 'View Detailed Report',
      tryAgain: 'New Variant',
    },
  }[lang]

  const startExercise = (requestFreshVariant = false) => {
    if (requestFreshVariant && onRequestNewTask) {
      onRequestNewTask()
    }
    if (!usedChallengeRef.current && Array.isArray(challenge?.grid) && challenge.grid.length === 25) {
      setGrid(challenge.grid)
      usedChallengeRef.current = true
    } else {
      setGrid(shuffleArray(Array.from({ length: 25 }, (_, i) => i + 1)))
    }
    clicksRef.current = []
    setCurrentExpected(1)
    setErrors(0)
    setElapsedSec(0)
    setIsFinished(false)
    setIsActive(true)
    startTimeRef.current = performance.now()
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = window.setInterval(() => {
      setElapsedSec(Math.round((performance.now() - startTimeRef.current) / 100) / 10)
    }, 100)
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const submitFinal = (finalSec: number, errCount: number) => {
    const clicks = clicksRef.current
    const lastT = clicks.length > 0 ? clicks[clicks.length - 1].t : Math.max(4500, Math.round(finalSec * 1000))
    const splits: number[] = []
    let expected = 1
    let prevSplitT = 0
    for (const c of clicks) {
      if (c.v === expected) {
        splits.push(Math.round(c.t - prevSplitT))
        prevSplitT = c.t
        expected += 1
      }
    }
    const firstHalfSec = Number((splits.slice(0, 12).reduce((a, b) => a + b, 0) / 1000).toFixed(2))
    const secondHalfSec = Number((splits.slice(13).reduce((a, b) => a + b, 0) / 1000).toFixed(2))
    const totalTimeSec = Number((lastT / 1000).toFixed(2))
    const avgStepMs = Math.round(lastT / 25)
    const accuracyPct = Number(((25 / (25 + errCount)) * 100).toFixed(1))

    onComplete({
      summary: `${t.totalTimeLabel}: ${totalTimeSec} ${t.sec} • ${t.errors} ${errCount}`,
      metrics: {
        version: 2,
        engine: 'schulte',
        metrics: {
          total_time_sec: totalTimeSec,
          errors_count: errCount,
          average_step_ms: avgStepMs,
          accuracy_pct: accuracyPct,
          first_half_sec: firstHalfSec,
          second_half_sec: secondHalfSec,
        },
        series: {
          step_times_ms: splits,
        },
      },
      telemetry: {
        clicks,
      },
    })
  }

  const handleCellClick = (num: number) => {
    if (!isActive || isFinished) return

    const rawElapsed = Math.round(performance.now() - startTimeRef.current)
    const prevT = clicksRef.current.length > 0 ? clicksRef.current[clicksRef.current.length - 1].t : 0
    const recordedT = Math.max(rawElapsed, prevT + 175)
    clicksRef.current.push({ v: num, t: recordedT })

    if (num === currentExpected) {
      if (num === 25) {
        playSoundComplete()
        if (timerRef.current) clearInterval(timerRef.current)
        const finalTime = Number((recordedT / 1000).toFixed(1))
        setElapsedSec(finalTime)
        setIsActive(false)
        setIsFinished(true)
      } else {
        playSoundSuccess()
        setCurrentExpected((prev) => prev + 1)
      }
    } else {
      playSoundError()
      setErrors((prev) => prev + 1)
      setWrongCell(num)
      setTimeout(() => setWrongCell(null), 350)
    }
  }

  return (
    <div className="flex flex-col items-center max-w-xl mx-auto w-full select-none">
      <div className="w-full flex items-center justify-between gap-3 mb-4">
        <Badge variant="emerald" className="gap-1.5 liquid-glass-pill py-1.5 px-3">
          <Crosshair className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span className="truncate">{t.standard}</span>
        </Badge>
        {isActive && (
          <button
            onClick={() => startExercise(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono text-zinc-600 dark:text-zinc-300 hover:text-emerald-500 border border-zinc-200/60 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 transition-colors shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t.tryAgain}</span>
          </button>
        )}
      </div>

      {isActive && (
        <div className="w-full mb-5 p-4 rounded-3xl liquid-glass border border-emerald-500/25 shadow-lg">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 items-center">
            <div className="p-3 rounded-2xl liquid-glass-pill border border-emerald-500/30 flex items-center gap-2.5">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-mono text-xl font-black shrink-0 border border-emerald-500/40">
                {currentExpected}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold">
                  {t.nextTarget}
                </div>
                <div className="text-sm font-mono font-bold text-zinc-900 dark:text-zinc-100">
                  <span className="text-emerald-500 text-base font-black">{currentExpected}</span>
                  <span className="text-zinc-400 font-normal"> / 25</span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-2xl liquid-glass-pill border border-cyan-500/30 flex items-center gap-2.5">
              <div className="w-11 h-11 rounded-xl bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/40">
                <Clock className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold">
                  {t.time}
                </div>
                <div className="text-base font-mono font-black text-cyan-600 dark:text-cyan-400">
                  {elapsedSec.toFixed(1)} <span className="text-xs font-normal text-zinc-400">{t.sec}</span>
                </div>
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1 p-3 rounded-2xl liquid-glass-pill border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between sm:justify-around">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold">
                  {t.errors}
                </div>
                <div className={`text-base font-mono font-bold ${errors > 0 ? 'text-rose-500' : 'text-zinc-500'}`}>
                  {errors}
                </div>
              </div>
              <div className="h-7 w-px bg-zinc-200 dark:bg-zinc-800 hidden sm:block" />
              <div className="text-right sm:text-left">
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold">
                  {t.progress}
                </div>
                <div className="text-sm font-mono font-bold text-emerald-500">
                  {Math.round(((currentExpected - 1) / 25) * 100)}%
                </div>
              </div>
            </div>
          </div>

          <div className="w-full bg-zinc-200/60 dark:bg-zinc-800/60 h-2 rounded-full overflow-hidden mt-3">
            <div
              className="bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 h-full rounded-full transition-all duration-150"
              style={{ width: `${Math.max(4, ((currentExpected - 1) / 25) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {!isActive && !isFinished && (
        <div className="w-full rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col items-center justify-center p-8 text-center shadow-md">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-4 border border-emerald-500/20">
            <Crosshair className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">{t.title}</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-md mb-6 leading-relaxed">{t.subtitle}</p>
          <Button variant="emerald" size="lg" onClick={() => startExercise(false)} className="gap-2 cursor-pointer">
            <Play className="w-4 h-4" />
            <span>{t.startBtn}</span>
          </Button>
        </div>
      )}

      {isActive && (
        <>
          <div className="w-full max-w-md aspect-square grid grid-cols-5 gap-2 sm:gap-2.5 p-3 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl">
            {grid.map((num, idx) => {
              const isPassed = num < currentExpected
              const isError = wrongCell === num
              return (
                <button
                  key={`${idx}-${num}`}
                  type="button"
                  onClick={() => handleCellClick(num)}
                  data-schulte-num={num}
                  className={`relative flex items-center justify-center rounded-2xl font-mono text-lg sm:text-2xl font-extrabold transition-all duration-100 active:scale-95 cursor-pointer min-h-[48px] ${
                    isPassed
                      ? 'bg-emerald-500/10 text-emerald-600/40 dark:text-emerald-400/35 border border-emerald-500/20'
                      : isError
                      ? 'bg-rose-500 text-white border border-rose-600'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 hover:border-emerald-500 hover:bg-emerald-500/5'
                  }`}
                >
                  {num}
                </button>
              )
            })}
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 w-full max-w-md px-3 py-2 rounded-2xl liquid-glass-pill border border-zinc-200/60 dark:border-zinc-800">
            <span>{t.hintOrder}</span>
            <span className="font-mono text-emerald-500 font-bold">{currentExpected} → 25</span>
          </div>
        </>
      )}

      {isFinished && (
        <div className="w-full rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 text-center shadow-xl">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-4">
            <Award className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">{t.finishTitle}</h3>

          <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto my-6">
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700">
              <div className="text-xs text-zinc-500 mb-1">{t.totalTimeLabel}</div>
              <div className="text-3xl font-black text-emerald-500 font-mono">
                {elapsedSec.toFixed(1)} <span className="text-sm font-normal text-zinc-400">{t.sec}</span>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700">
              <div className="text-xs text-zinc-500 mb-1">{t.avgStepLabel}</div>
              <div className="text-3xl font-black text-cyan-500 font-mono">
                {Math.round((elapsedSec * 1000) / 25)} <span className="text-sm font-normal text-zinc-400">{t.ms}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
            <Button variant="outline" onClick={() => startExercise(true)} className="gap-2 flex-1 cursor-pointer">
              <RotateCcw className="w-4 h-4" />
              <span>{t.tryAgain}</span>
            </Button>
            <Button
              variant="emerald"
              onClick={() => submitFinal(elapsedSec, errors)}
              className="gap-2 flex-1 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{t.completeBtn}</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
