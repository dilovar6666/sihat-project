import React, { useState, useRef, useEffect } from 'react'
import { Hash, Clock, Award, CheckCircle, RotateCcw, Play } from 'lucide-react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import type { Language } from '../../i18n'

interface SymbolDigitEngineProps {
  lang: Language
  onComplete: (result: { summary: string; metrics: Record<string, unknown> }) => void
}

const SYMBOL_KEY = [
  { symbol: '❖', digit: 1 },
  { symbol: '▲', digit: 2 },
  { symbol: '✦', digit: 3 },
  { symbol: '⬡', digit: 4 },
  { symbol: '✱', digit: 5 },
  { symbol: '◈', digit: 6 },
  { symbol: '◒', digit: 7 },
  { symbol: '✖', digit: 8 },
  { symbol: '◼', digit: 9 },
]

export const SymbolDigitEngine: React.FC<SymbolDigitEngineProps> = ({ lang, onComplete }) => {
  const [currentSymbolIdx, setCurrentSymbolIdx] = useState(0)
  const [processedCount, setProcessedCount] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [timeLeft, setTimeLeft] = useState(30)
  const [isActive, setIsActive] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  const timerRef = useRef<number | null>(null)

  const t = {
    ru: {
      title: 'Скорость обработки информации (SDMT)',
      subtitle: 'Используя ключ наверху, как можно быстрее вводите цифру, соответствующую показанному символу.',
      standard: 'Symbol Digit Modalities Test (SDMT)',
      referenceKey: 'Ключ соответствия:',
      timeLeft: 'Осталось времени:',
      sec: 'сек',
      startBtn: 'Начать 30-секундный тест',
      finishTitle: 'Тест скорости обработки завершен',
      processedResult: 'Обработано за 30 секунд',
      itemsPerMin: 'Эквивалентная скорость (в минуту)',
      normOptimal: 'Высокая скорость обработки (≥ 28 символов)',
      normGood: 'Нормативная скорость (20–27 символов)',
      normSub: 'Замедленная обработка (< 20 символов)',
      finishBtn: 'Завершить и сохранить',
      tryAgain: 'Попробовать снова',
    },
    tj: {
      title: 'Суръати коркарди иттилоот (SDMT)',
      subtitle: 'Бо истифода аз калиди болоӣ, рақами мувофиқи аломатро ҳарчи зудтар ворид намоед.',
      standard: 'Symbol Digit Modalities Test (SDMT)',
      referenceKey: 'Калиди мувофиқат:',
      timeLeft: 'Вақти боқимонда:',
      sec: 'сон',
      startBtn: 'Оғози санҷиши 30-сониягӣ',
      finishTitle: 'Санҷиши суръат анҷом ёфт',
      processedResult: 'Дар 30 сония коркард шуд',
      itemsPerMin: 'Суръати баробар (дар як дақиқа)',
      normOptimal: 'Суръати баланд (≥ 28 рамз)',
      normGood: 'Суръати муътадил (20–27 рамз)',
      normSub: 'Суръати паст (< 20 рамз)',
      finishBtn: 'Анҷом ва сабт кардан',
      tryAgain: 'Аз нав гузаштан',
    },
    en: {
      title: 'Information Processing Speed (SDMT)',
      subtitle: 'Using the reference key at top, rapidly match and enter the digit for each symbol shown.',
      standard: 'Symbol Digit Modalities Test Paradigm',
      referenceKey: 'Reference Mapping Key:',
      timeLeft: 'Time remaining:',
      sec: 's',
      startBtn: 'Start 30-Second SDMT',
      finishTitle: 'Processing Evaluation Completed',
      processedResult: 'Processed in 30 Seconds',
      itemsPerMin: 'Normalized Rate (per minute)',
      normOptimal: 'Superior Processing Speed (≥ 28 items)',
      normGood: 'Normal Range (20–27 items)',
      normSub: 'Reduced Processing Rate (< 20 items)',
      finishBtn: 'Complete & Save',
      tryAgain: 'Retry',
    },
  }[lang]

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const pickNextSymbol = () => {
    const nextIdx = Math.floor(Math.random() * SYMBOL_KEY.length)
    setCurrentSymbolIdx(nextIdx)
  }

  const handleStart = () => {
    setProcessedCount(0)
    setCorrectCount(0)
    setTimeLeft(30)
    setIsFinished(false)
    setIsActive(true)
    pickNextSymbol()

    let remaining = 30
    timerRef.current = window.setInterval(() => {
      remaining -= 1
      setTimeLeft(remaining)
      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current)
        setIsActive(false)
        setIsFinished(true)
      }
    }, 1000)
  }

  const handleDigitInput = (num: number) => {
    if (!isActive || isFinished) return
    const expected = SYMBOL_KEY[currentSymbolIdx].digit
    setProcessedCount((prev) => prev + 1)
    if (num === expected) {
      setCorrectCount((prev) => prev + 1)
    }
    pickNextSymbol()
  }

  const handleFinish = () => {
    const ratePerMin = correctCount * 2
    let category = t.normGood
    if (correctCount >= 28) category = t.normOptimal
    else if (correctCount < 20) category = t.normSub

    onComplete({
      summary: `${t.processedResult}: ${correctCount} (${category}). ${ratePerMin} items/min.`,
      metrics: {
        correct_items_30s: correctCount,
        total_processed_30s: processedCount,
        rate_per_minute: ratePerMin,
        status_category: category,
      },
    })
  }

  const currentSymbol = SYMBOL_KEY[currentSymbolIdx]

  return (
    <div className="flex flex-col items-center max-w-xl mx-auto w-full select-none">
      {/* Top Standard Badge & Quick Controls */}
      <div className="w-full flex items-center justify-between gap-3 mb-4">
        <Badge variant="cyan" className="gap-1.5 liquid-glass-pill py-1.5 px-3">
          <Hash className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
          <span className="truncate">{t.standard}</span>
        </Badge>
        {isActive && (
          <button
            onClick={handleStart}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono text-zinc-500 hover:text-cyan-500 border border-zinc-200/60 dark:border-zinc-800 bg-white/40 dark:bg-zinc-900/40 liquid-glass-pill transition-colors shrink-0 shadow-xs"
            title="Перезапустить"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Перезапустить</span>
          </button>
        )}
      </div>

      {/* Dedicated HUD Bar: Score & Timer separated below */}
      {isActive && (
        <div className="w-full mb-6 p-4 rounded-3xl liquid-glass border border-cyan-500/25 shadow-xl animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="grid grid-cols-2 gap-3 items-center">
            
            {/* Score */}
            <div className="p-3 sm:p-3.5 rounded-2xl liquid-glass-pill border border-emerald-500/30 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-mono text-2xl font-black shrink-0 border border-emerald-500/40 shadow-inner">
                {correctCount}
              </div>
              <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold truncate">
                  Угадано
                </div>
                <div className="text-sm font-mono font-bold text-zinc-900 dark:text-zinc-100">
                  <span className="text-emerald-500 text-lg font-black">{correctCount}</span>
                </div>
              </div>
            </div>

            {/* Time Left */}
            <div className="p-3 sm:p-3.5 rounded-2xl liquid-glass-pill border border-cyan-500/30 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/40 shadow-inner">
                <Clock className="w-6 h-6 animate-pulse" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold truncate">
                  Осталось времени
                </div>
                <div className="text-lg sm:text-xl font-mono font-black text-cyan-600 dark:text-cyan-400 truncate">
                  {timeLeft} <span className="text-xs font-normal text-zinc-400">{t.sec}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {!isActive && !isFinished && (
        <div className="w-full rounded-3xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-100/50 dark:bg-zinc-900/40 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-500 mb-4">
            <Hash className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">{t.title}</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-md mb-6">{t.subtitle}</p>
          <Button variant="emerald" size="lg" onClick={handleStart} className="gap-2">
            <Play className="w-4 h-4" />
            <span>{t.startBtn}</span>
          </Button>
        </div>
      )}

      {isActive && (
        <div className="w-full flex flex-col items-center">
          {/* Reference Key Strip */}
          <div className="w-full p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 mb-6">
            <div className="text-[10px] uppercase font-mono text-zinc-400 mb-1 text-center">
              {t.referenceKey}
            </div>
            <div className="grid grid-cols-9 gap-1 text-center">
              {SYMBOL_KEY.map((item) => (
                <div key={item.digit} className="flex flex-col items-center">
                  <span className="text-lg text-emerald-500 font-bold">{item.symbol}</span>
                  <span className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300">
                    {item.digit}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Current Target Symbol Display */}
          <div className="w-full h-44 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-center shadow-xl mb-6">
            <div className="text-7xl font-bold text-emerald-500 font-mono animate-in zoom-in-75 duration-100">
              {currentSymbol.symbol}
            </div>
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-2.5 w-full max-w-xs mb-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                onClick={() => handleDigitInput(num)}
                className="h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-600 text-2xl font-mono font-bold transition-all shadow-sm active:scale-95 text-zinc-900 dark:text-zinc-100"
              >
                {num}
              </button>
            ))}
          </div>
        </div>
      )}

      {isFinished && (
        <div className="w-full rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 text-center shadow-xl">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-4">
            <Award className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">{t.finishTitle}</h3>

          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto my-6">
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/80">
              <div className="text-xs text-zinc-500 mb-1">{t.processedResult}</div>
              <div className="text-3xl font-extrabold text-emerald-500 font-mono">{correctCount}</div>
            </div>
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/80">
              <div className="text-xs text-zinc-500 mb-1">{t.itemsPerMin}</div>
              <div className="text-3xl font-extrabold text-cyan-500 font-mono">
                {correctCount * 2}
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-center max-w-sm mx-auto">
            <Button variant="outline" onClick={handleStart} className="gap-2 flex-1">
              <RotateCcw className="w-4 h-4" />
              <span>{t.tryAgain}</span>
            </Button>
            <Button variant="emerald" onClick={handleFinish} className="gap-2 flex-1">
              <CheckCircle className="w-4 h-4" />
              <span>{t.finishBtn}</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
