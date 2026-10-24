import React, { useState, useRef, useEffect } from 'react'
import { Play, RotateCcw, Zap, Award, CheckCircle } from 'lucide-react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import type { Language } from '../../i18n'

interface ReactionSpeedEngineProps {
  lang: Language
  onComplete: (result: { summary: string; metrics: Record<string, unknown> }) => void
}

type State = 'idle' | 'waiting' | 'ready' | 'early' | 'round_result' | 'finished'

export const ReactionSpeedEngine: React.FC<ReactionSpeedEngineProps> = ({ lang, onComplete }) => {
  const [state, setState] = useState<State>('idle')
  const [round, setRound] = useState(1)
  const totalRounds = 5
  const [times, setTimes] = useState<number[]>([])
  const [currentTime, setCurrentTime] = useState<number | null>(null)
  const startTimeRef = useRef<number>(0)
  const timeoutRef = useRef<number | null>(null)

  const t = {
    ru: {
      title: 'Простая сенсомоторная реакция',
      subtitle: 'Тест замеряет скорость зрительно-моторного рефлекса в миллисекундах.',
      standard: 'Стандарт: Методика Donders A / Миллисекундный таймер',
      startBtn: 'Начать тест',
      waitTitle: 'Ждите зелёного сигнала...',
      waitSub: 'Не нажимайте раньше времени!',
      clickNow: 'ЖМИТЕ СЕЙЧАС!',
      earlyTitle: 'Фальстарт!',
      earlySub: 'Вы нажали слишком рано. Попытка не засчитана.',
      tryAgain: 'Продолжить',
      nextRound: 'Следующий раунд',
      round: 'Раунд',
      ms: 'мс',
      avgResult: 'Среднее время реакции',
      bestResult: 'Лучший результат',
      statusExcellent: 'Реакция киберспортсмена (< 210 мс)',
      statusGood: 'Отличная норма (210–250 мс)',
      statusAverage: 'Средняя норма (250–320 мс)',
      statusSlow: 'Замедленная реакция (> 320 мс)',
      finishBtn: 'Завершить и посмотреть итоги',
    },
    tj: {
      title: 'Суръати аксуламали сенсомоторӣ',
      subtitle: 'Санҷиши суръати рефлекси биноӣ-ҳаракатӣ бо миллисонияҳо.',
      standard: 'Стандарт: Методикаи Donders A / Таймери миллисониягӣ',
      startBtn: 'Оғози санҷиш',
      waitTitle: 'Мунтазири ранги сабз бошед...',
      waitSub: 'Пеш аз вақт пахш накунед!',
      clickNow: 'ҲОЗИР ПАХШ КУНЕД!',
      earlyTitle: 'Иштибоҳ (Фалстарт)!',
      earlySub: 'Шумо пеш аз вақт пахш кардед. Ин навбат ҳисоб намешавад.',
      tryAgain: 'Идома додан',
      nextRound: 'Даври навбатӣ',
      round: 'Давр',
      ms: 'мс',
      avgResult: 'Миёнаи суръати аксуламал',
      bestResult: 'Беҳтарин натиҷа',
      statusExcellent: 'Суръати олӣ (< 210 мс)',
      statusGood: 'Меъёри хуб (210–250 мс)',
      statusAverage: 'Меъёри миёна (250–320 мс)',
      statusSlow: 'Аксуламали суст (> 320 мс)',
      finishBtn: 'Анҷом ва дидани натиҷаҳо',
    },
    en: {
      title: 'Simple Sensorimotor Reaction Time',
      subtitle: 'Measures visual-motor reflex latency in milliseconds.',
      standard: 'Standard: Donders A visual response paradigm',
      startBtn: 'Start Test',
      waitTitle: 'Wait for green...',
      waitSub: 'Do not click prematurely!',
      clickNow: 'CLICK NOW!',
      earlyTitle: 'False Start!',
      earlySub: 'You clicked too early. This trial is reset.',
      tryAgain: 'Continue',
      nextRound: 'Next Round',
      round: 'Round',
      ms: 'ms',
      avgResult: 'Average reaction time',
      bestResult: 'Fastest reaction',
      statusExcellent: 'Pro reflex (< 210 ms)',
      statusGood: 'Optimal normative (210–250 ms)',
      statusAverage: 'Average normative (250–320 ms)',
      statusSlow: 'Elevated latency (> 320 ms)',
      finishBtn: 'Complete & View Evaluation',
    },
  }[lang]

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const startRound = () => {
    setState('waiting')
    const delay = Math.floor(Math.random() * 2800) + 1600
    timeoutRef.current = window.setTimeout(() => {
      startTimeRef.current = performance.now()
      setState('ready')
    }, delay)
  }

  const handleBoxClick = () => {
    if (state === 'waiting') {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      setState('early')
    } else if (state === 'ready') {
      const elapsed = Math.round(performance.now() - startTimeRef.current)
      setCurrentTime(elapsed)
      const nextTimes = [...times, elapsed]
      setTimes(nextTimes)
      if (round < totalRounds) {
        setState('round_result')
      } else {
        setState('finished')
      }
    }
  }

  const handleNextRound = () => {
    setRound((prev) => prev + 1)
    startRound()
  }

  const handleFinish = () => {
    const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length)
    const best = Math.min(...times)
    let category = t.statusAverage
    if (avg < 210) category = t.statusExcellent
    else if (avg <= 250) category = t.statusGood
    else if (avg > 320) category = t.statusSlow

    onComplete({
      summary: `${t.avgResult}: ${avg} ${t.ms} (${category}). ${t.bestResult}: ${best} ${t.ms}.`,
      metrics: {
        reaction_time_ms: avg,
        best_time_ms: best,
        trials_count: times.length,
        trials_ms: times,
        category,
      },
    })
  }

  const avg = times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0
  const best = times.length > 0 ? Math.min(...times) : 0

  return (
    <div className="flex flex-col items-center max-w-2xl mx-auto w-full">
      {/* Test Header */}
      <div className="w-full flex items-center justify-between mb-4">
        <Badge variant="cyan" className="gap-1">
          <Zap className="w-3 h-3" />
          <span>{t.standard}</span>
        </Badge>
        <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
          {t.round} {Math.min(round, totalRounds)} / {totalRounds}
        </span>
      </div>

      {/* Main Interactive Box */}
      {state === 'idle' && (
        <div className="w-full h-80 rounded-3xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-100/50 dark:bg-zinc-900/40 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-4">
            <Zap className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">{t.title}</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-md mb-6">{t.subtitle}</p>
          <Button variant="emerald" size="lg" onClick={startRound} className="gap-2">
            <Play className="w-4 h-4" />
            <span>{t.startBtn}</span>
          </Button>
        </div>
      )}

      {state === 'waiting' && (
        <div
          onClick={handleBoxClick}
          className="w-full h-80 rounded-3xl bg-amber-500 dark:bg-amber-600 cursor-pointer flex flex-col items-center justify-center p-8 text-center text-white select-none shadow-xl transition-all duration-150 active:scale-[0.99]"
        >
          <div className="w-4 h-4 rounded-full bg-white animate-ping mb-4" />
          <h2 className="text-3xl font-black mb-2">{t.waitTitle}</h2>
          <p className="text-amber-100 text-sm">{t.waitSub}</p>
        </div>
      )}

      {state === 'ready' && (
        <div
          onClick={handleBoxClick}
          className="w-full h-80 rounded-3xl bg-emerald-500 cursor-pointer flex flex-col items-center justify-center p-8 text-center text-white select-none shadow-2xl transition-all duration-75 active:scale-[0.98] ring-8 ring-emerald-400/50"
        >
          <Zap className="w-16 h-16 mb-2 animate-bounce" />
          <h2 className="text-4xl font-black tracking-wider uppercase">{t.clickNow}</h2>
        </div>
      )}

      {state === 'early' && (
        <div className="w-full h-80 rounded-3xl bg-rose-500/10 border-2 border-rose-500/50 flex flex-col items-center justify-center p-8 text-center">
          <div className="text-rose-500 font-black text-2xl mb-2">{t.earlyTitle}</div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">{t.earlySub}</p>
          <Button variant="emerald" onClick={startRound} className="gap-2">
            <RotateCcw className="w-4 h-4" />
            <span>{t.tryAgain}</span>
          </Button>
        </div>
      )}

      {state === 'round_result' && (
        <div className="w-full h-80 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col items-center justify-center p-8 text-center shadow-lg">
          <span className="text-xs uppercase tracking-widest text-zinc-500 dark:text-zinc-400 font-semibold mb-1">
            {t.round} {round}
          </span>
          <div className="text-5xl font-black text-emerald-500 font-mono mb-4">
            {currentTime} <span className="text-2xl font-normal text-zinc-400">{t.ms}</span>
          </div>
          <Button variant="emerald" size="lg" onClick={handleNextRound} className="gap-2">
            <span>{t.nextRound}</span>
          </Button>
        </div>
      )}

      {state === 'finished' && (
        <div className="w-full rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 text-center shadow-xl">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-4">
            <Award className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-6">
            {lang === 'ru' ? 'Серия попыток завершена' : lang === 'tj' ? 'Санҷиш анҷом ёфт' : 'Trials Completed'}
          </h3>

          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-6">
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/80">
              <div className="text-xs text-zinc-500 mb-1">{t.avgResult}</div>
              <div className="text-3xl font-extrabold text-emerald-500 font-mono">
                {avg} <span className="text-sm font-normal text-zinc-400">{t.ms}</span>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/80">
              <div className="text-xs text-zinc-500 mb-1">{t.bestResult}</div>
              <div className="text-3xl font-extrabold text-cyan-500 font-mono">
                {best} <span className="text-sm font-normal text-zinc-400">{t.ms}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {times.map((time, idx) => (
              <span
                key={idx}
                className="px-3 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-mono text-zinc-600 dark:text-zinc-300"
              >
                #{idx + 1}: {time} {t.ms}
              </span>
            ))}
          </div>

          <Button variant="emerald" size="lg" onClick={handleFinish} className="gap-2 w-full max-w-sm mx-auto">
            <CheckCircle className="w-5 h-5" />
            <span>{t.finishBtn}</span>
          </Button>
        </div>
      )}
    </div>
  )
}
