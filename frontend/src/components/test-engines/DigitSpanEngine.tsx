import React, { useState } from 'react'
import { Brain, Award, CheckCircle, RotateCcw, Play, Delete } from 'lucide-react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import type { Language } from '../../i18n'

interface DigitSpanEngineProps {
  lang: Language
  onComplete: (result: { summary: string; metrics: Record<string, unknown> }) => void
}

export const DigitSpanEngine: React.FC<DigitSpanEngineProps> = ({ lang, onComplete }) => {
  const [spanLength, setSpanLength] = useState(4)
  const [digits, setDigits] = useState<number[]>([])
  const [currentFlashingDigit, setCurrentFlashingDigit] = useState<number | null>(null)
  const [isFlashing, setIsFlashing] = useState(false)
  const [userInput, setUserInput] = useState('')
  const [maxSpanAchieved, setMaxSpanAchieved] = useState(0)
  const [isFinished, setIsFinished] = useState(false)
  const [isActive, setIsActive] = useState(false)
  const [strikes, setStrikes] = useState(0)

  const t = {
    ru: {
      title: 'Кратковременная память (Digit Span)',
      subtitle: 'Запомните последовательность цифр и введите их в том же порядке.',
      standard: 'WAIS-IV Digit Span Working Memory Standard',
      watchCard: 'Запоминайте появляющиеся цифры...',
      enterCard: 'Введите запомненные цифры:',
      span: 'Длина цепочки:',
      digits: 'цифр',
      startBtn: 'Начать тест памяти',
      submitBtn: 'Проверить ответ',
      finishTitle: 'Тест кратковременной памяти завершен',
      spanResult: 'Объем кратковременной памяти (Digit Span)',
      normOptimal: 'Высокая емкость (Span ≥ 7)',
      normGood: 'Нормальная емкость (Span 5–6)',
      normSub: 'Сниженная емкость (Span ≤ 4)',
      finishBtn: 'Завершить и сохранить',
      tryAgain: 'Попробовать снова',
    },
    tj: {
      title: 'Хотираи кӯтоҳмуддат (Digit Span)',
      subtitle: 'Пайдарпайии рақамҳоро ба хотир гиред ва бо ҳамон тартиб дохил намоед.',
      standard: 'WAIS-IV Digit Span Working Memory Standard',
      watchCard: 'Рақамҳои пайдошавандаро дар хотир гиред...',
      enterCard: 'Рақамҳои дар хотир мондаро дохил кунед:',
      span: 'Дарозии занҷир:',
      digits: 'рақам',
      startBtn: 'Оғози санҷиши хотира',
      submitBtn: 'Санҷидани ҷавоб',
      finishTitle: 'Санҷиши хотираи кӯтоҳмуддат анҷом ёфт',
      spanResult: 'Ҳаҷми хотираи кӯтоҳмуддат (Digit Span)',
      normOptimal: 'Хотираи баланд (Span ≥ 7)',
      normGood: 'Хотираи муътадил (Span 5–6)',
      normSub: 'Хотираи пастшуда (Span ≤ 4)',
      finishBtn: 'Анҷом ва сабт кардан',
      tryAgain: 'Аз нав гузаштан',
    },
    en: {
      title: 'Short-Term Memory (Digit Span)',
      subtitle: 'Memorize the flashed sequence of digits and enter them in order.',
      standard: 'WAIS-IV Working Memory Paradigm',
      watchCard: 'Memorize the sequence of digits...',
      enterCard: 'Enter the recalled sequence:',
      span: 'Sequence span:',
      digits: 'digits',
      startBtn: 'Start Digit Span Test',
      submitBtn: 'Submit Sequence',
      finishTitle: 'Short-Term Evaluation Completed',
      spanResult: 'Working Memory Capacity (Digit Span)',
      normOptimal: 'Superior Span (Span ≥ 7)',
      normGood: 'Normative Span (Span 5–6)',
      normSub: 'Reduced Capacity (Span ≤ 4)',
      finishBtn: 'Complete & Save',
      tryAgain: 'Retry',
    },
  }[lang]

  const flashSequence = (seq: number[]) => {
    setIsFlashing(true)
    setUserInput('')
    let idx = 0

    const interval = setInterval(() => {
      if (idx < seq.length) {
        setCurrentFlashingDigit(seq[idx])
        idx++
      } else {
        clearInterval(interval)
        setCurrentFlashingDigit(null)
        setIsFlashing(false)
      }
    }, 900)
  }

  const runLevel = (length: number) => {
    const seq = Array.from({ length }, () => Math.floor(Math.random() * 10))
    setDigits(seq)
    flashSequence(seq)
  }

  const handleStart = () => {
    setSpanLength(4)
    setMaxSpanAchieved(0)
    setStrikes(0)
    setIsFinished(false)
    setIsActive(true)
    runLevel(4)
  }

  const handleSubmit = () => {
    const expected = digits.join('')
    if (userInput.trim() === expected) {
      // Success!
      const nextSpan = spanLength
      setMaxSpanAchieved(nextSpan)
      const nextLen = spanLength + 1
      setSpanLength(nextLen)
      runLevel(nextLen)
    } else {
      const nextStrikes = strikes + 1
      setStrikes(nextStrikes)
      if (nextStrikes >= 2) {
        setIsActive(false)
        setIsFinished(true)
      } else {
        runLevel(spanLength)
      }
    }
  }

  const handleFinish = () => {
    let category = t.normGood
    if (maxSpanAchieved >= 7) category = t.normOptimal
    else if (maxSpanAchieved <= 4) category = t.normSub

    onComplete({
      summary: `${t.spanResult}: ${maxSpanAchieved} ${t.digits} (${category}).`,
      metrics: {
        max_digit_span: maxSpanAchieved,
        status_category: category,
      },
    })
  }

  return (
    <div className="flex flex-col items-center max-w-xl mx-auto w-full select-none">
      <div className="w-full flex items-center justify-between mb-4">
        <Badge variant="cyan" className="gap-1">
          <Brain className="w-3 h-3" />
          <span>{t.standard}</span>
        </Badge>
        {isActive && (
          <span className="text-xs font-mono text-zinc-500">
            {t.span} <span className="font-bold text-cyan-500">{spanLength}</span> {t.digits}
          </span>
        )}
      </div>

      {!isActive && !isFinished && (
        <div className="w-full rounded-3xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-100/50 dark:bg-zinc-900/40 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-500 mb-4">
            <Brain className="w-8 h-8" />
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
          {/* Visual Display for Flashing Digits */}
          <div className="w-full h-52 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col items-center justify-center p-6 shadow-xl mb-6">
            {isFlashing ? (
              <div className="text-7xl font-mono font-black text-emerald-500 animate-in zoom-in-50 duration-150">
                {currentFlashingDigit ?? '•'}
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <span className="text-xs text-zinc-400 mb-2">{t.enterCard}</span>
                <div className="h-14 px-6 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 flex items-center justify-center text-3xl font-mono font-bold tracking-widest text-zinc-900 dark:text-zinc-100 min-w-44">
                  {userInput || '____'}
                </div>
              </div>
            )}
          </div>

          {/* Numeric Keypad */}
          {!isFlashing && (
            <div className="w-full max-w-xs flex flex-col items-center mb-6">
              <div className="grid grid-cols-3 gap-2.5 w-full mb-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    onClick={() => setUserInput((prev) => prev + num)}
                    className="h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-600 text-xl font-mono font-bold transition-all shadow-sm active:scale-95 text-zinc-900 dark:text-zinc-100"
                  >
                    {num}
                  </button>
                ))}
                <button
                  onClick={() => setUserInput((prev) => prev.slice(0, -1))}
                  className="h-14 rounded-2xl bg-zinc-200/70 dark:bg-zinc-700/70 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center"
                >
                  <Delete className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setUserInput((prev) => prev + '0')}
                  className="h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-600 text-xl font-mono font-bold transition-all shadow-sm active:scale-95 text-zinc-900 dark:text-zinc-100"
                >
                  0
                </button>
                <Button
                  variant="emerald"
                  onClick={handleSubmit}
                  disabled={userInput.length === 0}
                  className="h-14 rounded-2xl font-bold"
                >
                  OK
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

          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/80 max-w-xs mx-auto my-6">
            <div className="text-xs text-zinc-500 mb-1">{t.spanResult}</div>
            <div className="text-4xl font-black text-cyan-500 font-mono">
              {maxSpanAchieved} <span className="text-base font-normal text-zinc-400">{t.digits}</span>
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
