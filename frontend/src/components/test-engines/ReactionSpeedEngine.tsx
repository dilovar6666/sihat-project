import React, { useState, useRef, useEffect } from 'react'
import { Play, RotateCcw, Zap, Award, CheckCircle } from 'lucide-react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import type { InteractiveEngineProps } from './engineTypes'
import { playSoundSuccess, playSoundError, playSoundComplete } from '../../lib/soundFx'

interface ReactionTrial {
  id: string
  delay_ms: number
}

type State = 'idle' | 'waiting' | 'ready' | 'early' | 'round_result' | 'finished'

function buildFallbackReactionTrials(): ReactionTrial[] {
  return Array.from({ length: 8 }, (_, i) => ({
    id: `r${i + 1}`,
    delay_ms: Math.floor(1400 + Math.random() * 2600),
  }))
}

export const ReactionSpeedEngine: React.FC<InteractiveEngineProps> = ({
  lang,
  challenge,
  onComplete,
  onRequestNewTask,
}) => {
  const [trials, setTrials] = useState<ReactionTrial[]>(() =>
    Array.isArray(challenge?.trials) && challenge.trials.length > 0
      ? (challenge.trials as ReactionTrial[])
      : buildFallbackReactionTrials()
  )
  const [state, setState] = useState<State>('idle')
  const [trialIdx, setTrialIdx] = useState(0)
  const [validTimes, setValidTimes] = useState<number[]>([])
  const [anticipations, setAnticipations] = useState(0)
  const [currentTime, setCurrentTime] = useState<number | null>(null)

  const startTimeRef = useRef<number>(0)
  const timeoutRef = useRef<number | null>(null)
  const recordedRef = useRef<Array<{ id: string; rt_ms: number; early?: boolean }>>([])
  const usedChallengeRef = useRef(false)

  useEffect(() => {
    if (Array.isArray(challenge?.trials) && challenge.trials.length > 0 && state === 'idle') {
      setTrials(challenge.trials as ReactionTrial[])
      usedChallengeRef.current = false
    }
  }, [challenge, state])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const t = {
    ru: {
      title: 'Простая сенсомоторная реакция (8 попыток)',
      subtitle: 'Как только экран станет ЗЕЛЁНЫМ, нажмите на него или клавишу ПРОБЕЛ как можно быстрее. Не нажимайте раньше времени!',
      standard: 'Donders A • Время простой зрительно-моторной реакции',
      startBtn: 'Начать серию из 8 попыток',
      waitTitle: 'Ждите зелёного сигнала...',
      waitSub: 'Не нажимайте раньше времени!',
      clickNow: 'ЖМИТЕ СЕЙЧАС!',
      earlyTitle: 'Фальстарт!',
      earlySub: 'Вы нажали до появления сигнала. Сейчас повторим попытку.',
      tryAgainBtn: 'Повторить попытку',
      nextRound: 'Следующая попытка',
      round: 'Попытка',
      ms: 'мс',
      avgResult: 'Среднее время реакции',
      bestResult: 'Лучшая попытка',
      finishBtn: 'Показать подробный отчёт',
      newVariantBtn: 'Новый вариант',
    },
    tj: {
      title: 'Аксуламали оддии сенсомоторӣ (8 кӯшиш)',
      subtitle: 'Ҳангоми САБЗ шудани экран, фавран ба экран ё тугмаи ПРОБЕЛ пахш намоед. Пеш аз вақт пахш накунед!',
      standard: 'Donders A • Суръати аксуламали оддӣ',
      startBtn: 'Оғози силсилаи 8 кӯшиш',
      waitTitle: 'Мунтазири ранги сабз бошед...',
      waitSub: 'Пеш аз вақт пахш накунед!',
      clickNow: 'ҲОЗИР ПАХШ КУНЕД!',
      earlyTitle: 'Шитобкорӣ (Фалстарт)!',
      earlySub: 'Шумо пеш аз пайдо шудани сигнал пахш кардед.',
      tryAgainBtn: 'Такрори кӯшиш',
      nextRound: 'Кӯшиши навбатӣ',
      round: 'Кӯшиш',
      ms: 'мс',
      avgResult: 'Вақти миёнаи аксуламал',
      bestResult: 'Беҳтарин натиҷа',
      finishBtn: 'Дидани ҳисоботи муфассал',
      newVariantBtn: 'Варианти нав',
    },
    en: {
      title: 'Simple Reaction Speed (8 Trials)',
      subtitle: 'As soon as the box turns GREEN, click/tap or press SPACE as fast as you can. Avoid false starts!',
      standard: 'Donders A • Simple Visuomotor Reaction Time',
      startBtn: 'Start 8-Trial Series',
      waitTitle: 'Wait for green...',
      waitSub: 'Do not click prematurely!',
      clickNow: 'CLICK NOW!',
      earlyTitle: 'False Start!',
      earlySub: 'You responded before the green signal appeared.',
      tryAgainBtn: 'Retry Trial',
      nextRound: 'Next Trial',
      round: 'Trial',
      ms: 'ms',
      avgResult: 'Mean Reaction Time',
      bestResult: 'Best Trial',
      finishBtn: 'View Detailed Report',
      newVariantBtn: 'New Variant',
    },
  }[lang]

  const launchTrial = (idx: number, activeTrials: ReactionTrial[]) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    const tr = activeTrials[idx]
    if (!tr) return
    setState('waiting')
    timeoutRef.current = window.setTimeout(() => {
      startTimeRef.current = performance.now()
      setState('ready')
    }, tr.delay_ms || 1800)
  }

  const handleStartAll = (requestFresh = false) => {
    if (requestFresh && onRequestNewTask) {
      onRequestNewTask()
    }
    let nextTrials = trials
    if (!usedChallengeRef.current && Array.isArray(challenge?.trials) && challenge.trials.length > 0) {
      nextTrials = challenge.trials as ReactionTrial[]
      setTrials(nextTrials)
      usedChallengeRef.current = true
    } else {
      nextTrials = buildFallbackReactionTrials()
      setTrials(nextTrials)
    }

    recordedRef.current = []
    setValidTimes([])
    setAnticipations(0)
    setTrialIdx(0)
    setCurrentTime(null)
    launchTrial(0, nextTrials)
  }

  const handleTrigger = () => {
    const tr = trials[trialIdx]
    if (!tr) return

    if (state === 'waiting') {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      playSoundError()
      setAnticipations((a) => a + 1)
      setState('early')
    } else if (state === 'ready') {
      const rawRt = Math.round(performance.now() - startTimeRef.current)
      const rt = Math.max(115, rawRt)
      setCurrentTime(rt)
      setValidTimes((prev) => [...prev, rt])
      recordedRef.current.push({ id: tr.id, rt_ms: rt })

      if (trialIdx + 1 < trials.length) {
        playSoundSuccess()
        setState('round_result')
      } else {
        playSoundComplete()
        setState('finished')
      }
    }
  }

  const handleNextTrial = () => {
    const nextIdx = trialIdx + 1
    setTrialIdx(nextIdx)
    launchTrial(nextIdx, trials)
  }

  // Spacebar support
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        if (state === 'waiting' || state === 'ready') {
          e.preventDefault()
          handleTrigger()
        } else if (state === 'round_result') {
          e.preventDefault()
          handleNextTrial()
        } else if (state === 'early') {
          e.preventDefault()
          launchTrial(trialIdx, trials)
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  const avg =
    validTimes.length > 0 ? Math.round(validTimes.reduce((a, b) => a + b, 0) / validTimes.length) : 0
  const best = validTimes.length > 0 ? Math.min(...validTimes) : 0
  const slowest = validTimes.length > 0 ? Math.max(...validTimes) : 0

  const handleFinish = () => {
    const sorted = [...validTimes].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    const median =
      sorted.length === 0
        ? 0
        : sorted.length % 2 !== 0
        ? sorted[mid]
        : Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    const mean = avg
    const sd =
      validTimes.length > 1
        ? Math.round(
            Math.sqrt(
              validTimes.reduce((acc, v) => acc + (v - mean) * (v - mean), 0) /
                (validTimes.length - 1)
            )
          )
        : 0

    onComplete({
      summary: `${t.avgResult}: ${avg} ${t.ms}, ${t.bestResult}: ${best} ${t.ms}`,
      metrics: {
        version: 2,
        engine: 'reaction',
        metrics: {
          mean_rt_ms: avg,
          median_rt_ms: median,
          best_rt_ms: best,
          slowest_rt_ms: slowest,
          variability_ms: sd,
          anticipations_count: anticipations,
          lapses_count: validTimes.filter((r) => r > 500).length,
          valid_trials: validTimes.length,
        },
        series: {
          rt_ms: validTimes,
        },
      },
      telemetry: {
        trials: recordedRef.current,
      },
    })
  }

  return (
    <div className="flex flex-col items-center max-w-2xl mx-auto w-full select-none">
      <div className="w-full flex items-center justify-between mb-4">
        <Badge variant="cyan" className="gap-1.5 py-1.5 px-3">
          <Zap className="w-3.5 h-3.5 text-cyan-500" />
          <span className="truncate">{t.standard}</span>
        </Badge>
        <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
          {t.round} {Math.min(trialIdx + 1, trials.length)} / {trials.length}
        </span>
      </div>

      {state === 'idle' && (
        <div className="w-full rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col items-center justify-center p-8 text-center shadow-md">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-4 border border-emerald-500/20">
            <Zap className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">{t.title}</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-md mb-6 leading-relaxed">{t.subtitle}</p>
          <Button variant="emerald" size="lg" onClick={() => handleStartAll(false)} className="gap-2 cursor-pointer">
            <Play className="w-4 h-4" />
            <span>{t.startBtn}</span>
          </Button>
        </div>
      )}

      {state === 'waiting' && (
        <div
          data-reaction-state="waiting"
          onClick={handleTrigger}
          className="w-full h-72 sm:h-80 rounded-3xl bg-amber-500 dark:bg-amber-600 cursor-pointer flex flex-col items-center justify-center p-8 text-center text-white select-none shadow-xl transition-all duration-150"
        >
          <div className="w-4 h-4 rounded-full bg-white animate-ping mb-4" />
          <h2 className="text-2xl sm:text-3xl font-black mb-2">{t.waitTitle}</h2>
          <p className="text-amber-100 text-sm">{t.waitSub}</p>
        </div>
      )}

      {state === 'ready' && (
        <div
          data-reaction-state="ready"
          onClick={handleTrigger}
          className="w-full h-72 sm:h-80 rounded-3xl bg-emerald-500 cursor-pointer flex flex-col items-center justify-center p-8 text-center text-white select-none shadow-2xl transition-all duration-75 ring-8 ring-emerald-400/50"
        >
          <Zap className="w-14 h-14 mb-2" />
          <h2 className="text-3xl sm:text-4xl font-black tracking-wider uppercase">{t.clickNow}</h2>
        </div>
      )}

      {state === 'early' && (
        <div className="w-full h-72 sm:h-80 rounded-3xl bg-rose-500/10 border-2 border-rose-500/50 flex flex-col items-center justify-center p-8 text-center">
          <div className="text-rose-500 font-black text-2xl mb-2">{t.earlyTitle}</div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">{t.earlySub}</p>
          <Button variant="emerald" onClick={() => launchTrial(trialIdx, trials)} className="gap-2 cursor-pointer">
            <RotateCcw className="w-4 h-4" />
            <span>{t.tryAgainBtn}</span>
          </Button>
        </div>
      )}

      {state === 'round_result' && (
        <div
          data-reaction-state="round_result"
          className="w-full h-72 sm:h-80 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col items-center justify-center p-8 text-center shadow-lg"
        >
          <span className="text-xs uppercase tracking-widest text-zinc-500 dark:text-zinc-400 font-semibold mb-1">
            {t.round} {trialIdx + 1} / {trials.length}
          </span>
          <div className="text-5xl font-black text-emerald-500 font-mono mb-5">
            {currentTime} <span className="text-2xl font-normal text-zinc-400">{t.ms}</span>
          </div>
          <Button variant="emerald" size="lg" onClick={handleNextTrial} className="gap-2 cursor-pointer">
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
            {lang === 'ru' ? 'Серия из 8 попыток завершена' : lang === 'tj' ? 'Силсила анҷом ёфт' : '8-Trial Series Completed'}
          </h3>

          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-6">
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700">
              <div className="text-xs text-zinc-500 mb-1">{t.avgResult}</div>
              <div className="text-3xl font-extrabold text-emerald-500 font-mono">
                {avg} <span className="text-sm font-normal text-zinc-400">{t.ms}</span>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700">
              <div className="text-xs text-zinc-500 mb-1">{t.bestResult}</div>
              <div className="text-3xl font-extrabold text-cyan-500 font-mono">
                {best} <span className="text-sm font-normal text-zinc-400">{t.ms}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {validTimes.map((time, idx) => (
              <span
                key={idx}
                className="px-3 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-mono text-zinc-600 dark:text-zinc-300"
              >
                #{idx + 1}: {time} {t.ms}
              </span>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
            <Button variant="outline" onClick={() => handleStartAll(true)} className="gap-2 flex-1 cursor-pointer">
              <RotateCcw className="w-4 h-4" />
              <span>{t.newVariantBtn}</span>
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
