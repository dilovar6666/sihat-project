import React, { useState, useEffect, useRef } from 'react'
import { Play, RotateCcw, Clock, Award, CheckCircle, Crosshair } from 'lucide-react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import type { Language } from '../../i18n'

interface SchulteTableEngineProps {
  lang: Language
  onComplete: (result: { summary: string; metrics: Record<string, unknown> }) => void
}

export const SchulteTableEngine: React.FC<SchulteTableEngineProps> = ({ lang, onComplete }) => {
  const [grid, setGrid] = useState<number[]>([])
  const [currentExpected, setCurrentExpected] = useState(1)
  const [isActive, setIsActive] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  const [elapsedSec, setElapsedSec] = useState(0)
  const [errors, setErrors] = useState(0)
  const [wrongCell, setWrongCell] = useState<number | null>(null)
  const timerRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)

  const t = {
    ru: {
      title: 'Таблицы Шульте',
      subtitle: 'Найдите и последовательно нажмите числа от 1 до 25 как можно быстрее.',
      standard: 'Методика Шульте: Скорость зрительного поиска и концентрация',
      startBtn: 'Начать поиск (1 → 25)',
      nextTarget: 'Ищите число',
      time: 'Время',
      sec: 'сек',
      errors: 'Ошибок:',
      progress: 'Прогресс:',
      hintOrder: 'Нажимайте числа строго по порядку (1 → 25)',
      finishTitle: 'Таблица успешно пройдена!',
      efficiencyTitle: 'Эффективность работы (ЭР)',
      statusSuper: 'Высокая концентрация (< 35 сек)',
      statusNormal: 'Хорошая норма (35–50 сек)',
      statusLow: 'Признаки утомления (> 50 сек)',
      completeBtn: 'Завершить и сохранить',
      tryAgain: 'Пройти снова',
    },
    tj: {
      title: 'Ҷадвалҳои Шулте',
      subtitle: 'Ададҳоро аз 1 то 25 пайдарпай ва ҳарчи зудтар пайдо кунед.',
      standard: 'Методикаи Шулте: Суръати ҷустуҷӯ ва диққат',
      startBtn: 'Оғози ҷустуҷӯ (1 → 25)',
      nextTarget: 'Адади лозима:',
      time: 'Вақт:',
      sec: 'сон',
      errors: 'Хатогиҳо:',
      progress: 'Пешрафт:',
      hintOrder: 'Ададҳоро бо тартиб пахш намоед (1 → 25)',
      finishTitle: 'Ҷадвал бомуваффақият анҷом ёфт!',
      efficiencyTitle: 'Самаранокии корӣ',
      statusSuper: 'Диққати баланд (< 35 сон)',
      statusNormal: 'Меъёри хуб (35–50 сон)',
      statusLow: 'Нишонаҳои хастагӣ (> 50 сон)',
      completeBtn: 'Анҷом ва сабт кардан',
      tryAgain: 'Аз нав гузаштан',
    },
    en: {
      title: 'Schulte Grid',
      subtitle: 'Locate and click numbers in ascending order from 1 to 25 as quickly as possible.',
      standard: 'Schulte Paradigm: Visual search rate and focal attention',
      startBtn: 'Start Search (1 → 25)',
      nextTarget: 'Find number:',
      time: 'Time:',
      sec: 's',
      errors: 'Errors:',
      progress: 'Progress:',
      hintOrder: 'Click numbers in ascending order (1 → 25)',
      finishTitle: 'Schulte Grid Completed!',
      efficiencyTitle: 'Work Efficiency Index (ER)',
      statusSuper: 'High concentration (< 35 s)',
      statusNormal: 'Normal concentration (35–50 s)',
      statusLow: 'Cognitive fatigue indicated (> 50 s)',
      completeBtn: 'Complete and Proceed',
      tryAgain: 'Retry Test',
    },
  }[lang]

  const generateGrid = () => {
    const nums = Array.from({ length: 25 }, (_, i) => i + 1)
    for (let i = nums.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[nums[i], nums[j]] = [nums[j], nums[i]]
    }
    setGrid(nums)
    setCurrentExpected(1)
    setErrors(0)
    setElapsedSec(0)
    setIsFinished(false)
  }

  const handleStart = () => {
    generateGrid()
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

  const handleCellClick = (num: number) => {
    if (!isActive || isFinished) return

    if (num === currentExpected) {
      if (num === 25) {
        if (timerRef.current) clearInterval(timerRef.current)
        const finalTime = Math.round((performance.now() - startTimeRef.current) / 100) / 10
        setElapsedSec(finalTime)
        setIsActive(false)
        setIsFinished(true)
      } else {
        setCurrentExpected((prev) => prev + 1)
      }
    } else {
      setErrors((prev) => prev + 1)
      setWrongCell(num)
      setTimeout(() => setWrongCell(null), 400)
    }
  }

  const handleFinish = () => {
    let category = t.statusNormal
    if (elapsedSec < 35) category = t.statusSuper
    else if (elapsedSec > 50) category = t.statusLow

    onComplete({
      summary: `${t.efficiencyTitle}: ${elapsedSec} ${t.sec} (${category}). ${t.errors} ${errors}.`,
      metrics: {
        completion_time_sec: elapsedSec,
        error_count: errors,
        efficiency_category: category,
        grid_size: '5x5',
      },
    })
  }

  return (
    <div className="flex flex-col items-center max-w-xl mx-auto w-full select-none">
      {/* Top Standard Badge & Quick Controls */}
      <div className="w-full flex items-center justify-between gap-3 mb-4">
        <Badge variant="emerald" className="gap-1.5 liquid-glass-pill py-1.5 px-3">
          <Crosshair className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span className="truncate">{t.standard}</span>
        </Badge>
        {isActive && (
          <button
            onClick={handleStart}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono text-zinc-500 hover:text-emerald-500 border border-zinc-200/60 dark:border-zinc-800 bg-white/40 dark:bg-zinc-900/40 liquid-glass-pill transition-colors shrink-0 shadow-xs"
            title={t.tryAgain}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.tryAgain}</span>
          </button>
        )}
      </div>

      {/* Dedicated HUD Bar: Timer & Target Number separated below (Отдельно снизу) */}
      {isActive && (
        <div className="w-full mb-6 p-4 rounded-3xl liquid-glass border border-emerald-500/25 shadow-xl animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 items-center">
            
            {/* Card 1: Target Number to Find */}
            <div className="p-3 sm:p-3.5 rounded-2xl liquid-glass-pill border border-emerald-500/30 flex items-center gap-2.5">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-mono text-xl sm:text-2xl font-black shrink-0 border border-emerald-500/40 shadow-inner">
                {currentExpected}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold whitespace-nowrap">
                  {t.nextTarget}
                </div>
                <div className="text-sm font-mono font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
                  <span className="text-emerald-500 text-base sm:text-lg font-black">{currentExpected}</span>
                  <span className="text-zinc-400 font-normal">/ 25</span>
                </div>
              </div>
            </div>

            {/* Card 2: Digital Stopwatch / Timer */}
            <div className="p-3 sm:p-3.5 rounded-2xl liquid-glass-pill border border-cyan-500/30 flex items-center gap-2.5">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/40 shadow-inner">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold whitespace-nowrap">
                  {t.time}
                </div>
                <div className="text-base sm:text-lg font-mono font-black text-cyan-600 dark:text-cyan-400 whitespace-nowrap">
                  {elapsedSec.toFixed(1)}{' '}
                  <span className="text-xs font-normal text-zinc-400">{t.sec}</span>
                </div>
              </div>
            </div>

            {/* Card 3: Errors & Progress Percentage */}
            <div className="col-span-2 sm:col-span-1 p-3 sm:p-3.5 rounded-2xl liquid-glass-pill border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between sm:justify-around">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold">
                  {t.errors}
                </div>
                <div className={`text-base font-mono font-bold ${errors > 0 ? 'text-rose-500 animate-pulse' : 'text-zinc-400'}`}>
                  {errors}
                </div>
              </div>
              <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-800 sm:block hidden" />
              <div className="text-right sm:text-left">
                <div className="text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold">
                  {t.progress}
                </div>
                <div className="text-sm font-mono font-bold text-emerald-500">
                  {Math.round(((currentExpected - 1) / 25) * 100)}%
                </div>
              </div>
            </div>

          </div>

          {/* Visual Smooth Progress Bar */}
          <div className="w-full bg-zinc-200/60 dark:bg-zinc-800/60 h-2 rounded-full overflow-hidden mt-3 p-0.5">
            <div
              className="bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 h-full rounded-full transition-all duration-200 shadow-sm shadow-emerald-500/50"
              style={{ width: `${Math.max(4, ((currentExpected - 1) / 25) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Intro Card (before test starts) */}
      {!isActive && !isFinished && (
        <div className="w-full rounded-3xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-100/50 dark:bg-zinc-900/40 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-500 mb-4">
            <Crosshair className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">{t.title}</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-md mb-6">{t.subtitle}</p>
          <Button variant="emerald" size="lg" onClick={handleStart} className="gap-2">
            <Play className="w-4 h-4" />
            <span>{t.startBtn}</span>
          </Button>
        </div>
      )}

      {/* 5x5 Active Grid */}
      {isActive && (
        <>
          <div className="w-full max-w-md aspect-square grid grid-cols-5 gap-2.5 p-3 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 shadow-2xl backdrop-blur-md">
            {grid.map((num) => {
              const isPassed = num < currentExpected
              const isTarget = num === currentExpected
              const isError = wrongCell === num

              return (
                <button
                  key={num}
                  onClick={() => handleCellClick(num)}
                  className={`relative flex items-center justify-center rounded-2xl font-mono text-xl sm:text-2xl font-extrabold transition-all duration-100 active:scale-95 ${
                    isPassed
                      ? 'bg-emerald-500/10 text-emerald-500/40 border border-emerald-500/20'
                      : isError
                      ? 'bg-rose-500 text-white animate-shake'
                      : isTarget
                      ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700 hover:border-emerald-500'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200/60 dark:border-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  {num}
                </button>
              )
            })}
          </div>

          {/* Supportive Order Indicator Below the Grid */}
          <div className="mt-4 flex flex-wrap items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 w-full max-w-md px-3 py-2 rounded-2xl liquid-glass-pill border border-zinc-200/60 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>{t.hintOrder}</span>
            </div>
            <span className="font-mono text-emerald-500 font-bold ml-auto">
              {currentExpected} → 25
            </span>
          </div>
        </>
      )}

      {/* Finished Summary State */}
      {isFinished && (
        <div className="w-full rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 text-center shadow-xl">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-4">
            <Award className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">{t.finishTitle}</h3>

          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto my-6">
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/80">
              <div className="text-xs text-zinc-500 mb-1">{t.time}</div>
              <div className="text-3xl font-extrabold text-emerald-500 font-mono">
                {elapsedSec.toFixed(1)}{' '}
                <span className="text-sm font-normal text-zinc-400">{t.sec}</span>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/80">
              <div className="text-xs text-zinc-500 mb-1">{t.errors}</div>
              <div className="text-3xl font-extrabold text-amber-500 font-mono">{errors}</div>
            </div>
          </div>

          <div className="flex gap-3 justify-center max-w-sm mx-auto">
            <Button variant="outline" onClick={handleStart} className="gap-2 flex-1">
              <RotateCcw className="w-4 h-4" />
              <span>{t.tryAgain}</span>
            </Button>
            <Button variant="emerald" onClick={handleFinish} className="gap-2 flex-1">
              <CheckCircle className="w-4 h-4" />
              <span>{t.completeBtn}</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
