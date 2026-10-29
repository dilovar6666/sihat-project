import React, { useState, useEffect, useRef } from 'react'
import { Crosshair, Play, RotateCcw, CheckCircle } from 'lucide-react'
import { Button } from '../ui/Button'
import { shuffleArray, type InteractiveEngineProps } from './engineTypes'

interface GoNoGoTrial {
  id: number
  kind: 'go' | 'nogo'
  isi_ms: number
  show_ms: number
}

function buildFallbackGoNoGo(): GoNoGoTrial[] {
  const rest = shuffleArray([
    ...Array.from({ length: 27 }, () => 'go' as const),
    ...Array.from({ length: 10 }, () => 'nogo' as const),
  ])
  const kinds: Array<'go' | 'nogo'> = ['go', 'go', 'go', ...rest]
  return kinds.map((kind, i) => ({
    id: i + 1,
    kind,
    isi_ms: Math.floor(700 + Math.random() * 600),
    show_ms: 800,
  }))
}

export const GoNoGoEngine: React.FC<InteractiveEngineProps> = ({
  lang,
  challenge,
  onComplete,
  onRequestNewTask,
}) => {
  const [trials, setTrials] = useState<GoNoGoTrial[]>(() =>
    Array.isArray(challenge?.trials) && challenge.trials.length > 0
      ? (challenge.trials as GoNoGoTrial[])
      : buildFallbackGoNoGo()
  )
  const [currentIdx, setCurrentIdx] = useState(0)
  const [stimulusVisible, setStimulusVisible] = useState(false)
  const [currentKind, setCurrentKind] = useState<'go' | 'nogo' | null>(null)
  const [goHits, setGoHits] = useState(0)
  const [omissions, setOmissions] = useState(0)
  const [commissions, setCommissions] = useState(0)
  const [rejections, setRejections] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const [isFinished, setIsFinished] = useState(false)

  const stimulusStartRef = useRef<number>(0)
  const showTimerRef = useRef<number | null>(null)
  const isiTimerRef = useRef<number | null>(null)
  const respondedRef = useRef<boolean>(false)
  const responsesRef = useRef<Array<{ id: number; pressed: boolean; rt_ms?: number }>>([])
  const rtsRef = useRef<number[]>([])
  const usedChallengeRef = useRef(false)

  const clearTimers = () => {
    if (showTimerRef.current) clearTimeout(showTimerRef.current)
    if (isiTimerRef.current) clearTimeout(isiTimerRef.current)
    showTimerRef.current = null
    isiTimerRef.current = null
  }

  useEffect(() => {
    if (Array.isArray(challenge?.trials) && challenge.trials.length > 0 && !isActive && !isFinished) {
      setTrials(challenge.trials as GoNoGoTrial[])
      usedChallengeRef.current = false
    }
  }, [challenge, isActive, isFinished])

  useEffect(() => {
    return () => clearTimers()
  }, [])

  const t = {
    ru: {
      title: 'Go / No-Go (Тормозной контроль, 40 сигналов)',
      subtitle: 'Быстро нажимайте ПРОБЕЛ или экран при появлении ЗЕЛЁНОГО круга (Go) и воздерживайтесь от нажатия на КРАСНОМ квадрате (No-Go).',
      startBtn: 'Начать серию Go / No-Go',
      ruleGo: 'ЗЕЛЁНЫЙ КРУГ — Жмите ПРОБЕЛ / Экран',
      ruleNoGo: 'КРАСНЫЙ КВАДРАТ — НЕ НАЖИМАЙТЕ!',
      waitPrompt: 'Ожидание сигнала...',
      finishTitle: 'Серия Go / No-Go завершена!',
      tryAgain: 'Новый вариант',
      saveBtn: 'Показать подробный отчёт',
    },
    tj: {
      title: 'Go / No-Go (Назорати боздорӣ, 40 сигнал)',
      subtitle: 'Ҳангоми пайдо шудани доираи САБЗ (Go) зуд пахш кунед ва дар мураббаъи СУРХ (No-Go) худдорӣ намоед.',
      startBtn: 'Оғози силсилаи Go / No-Go',
      ruleGo: 'ДОИРАИ САБЗ — Фавран пахш кунед',
      ruleNoGo: 'МУРАББАЪИ СУРХ — ПАХШ НАКУНЕД!',
      waitPrompt: 'Интизории сигнал...',
      finishTitle: 'Санҷиши Go / No-Go анҷом ёфт!',
      tryAgain: 'Варианти нав',
      saveBtn: 'Дидани ҳисоботи муфассал',
    },
    en: {
      title: 'Go / No-Go (Inhibitory Control, 40 Signals)',
      subtitle: 'Rapidly tap or press SPACE on GREEN circles (Go) and withhold your response on RED squares (No-Go).',
      startBtn: 'Start Go / No-Go Series',
      ruleGo: 'GREEN CIRCLE — Press SPACE / Tap Screen',
      ruleNoGo: 'RED SQUARE — DO NOT PRESS!',
      waitPrompt: 'Waiting for signal...',
      finishTitle: 'Go / No-Go Series Completed!',
      tryAgain: 'New Variant',
      saveBtn: 'View Detailed Report',
    },
  }[lang]

  const runTrialAt = (idx: number, activeTrials: GoNoGoTrial[]) => {
    clearTimers()
    if (idx >= activeTrials.length) {
      setStimulusVisible(false)
      setIsActive(false)
      setIsFinished(true)
      return
    }

    const tr = activeTrials[idx]
    setCurrentIdx(idx)
    setStimulusVisible(false)
    setCurrentKind(null)
    respondedRef.current = false

    isiTimerRef.current = window.setTimeout(() => {
      setCurrentKind(tr.kind)
      setStimulusVisible(true)
      stimulusStartRef.current = performance.now()

      showTimerRef.current = window.setTimeout(() => {
        if (!respondedRef.current) {
          respondedRef.current = true
          responsesRef.current.push({ id: tr.id, pressed: false })
          if (tr.kind === 'go') {
            setOmissions((o) => o + 1)
          } else {
            setRejections((r) => r + 1)
          }
          setStimulusVisible(false)
          runTrialAt(idx + 1, activeTrials)
        }
      }, tr.show_ms || 800)
    }, tr.isi_ms || 800)
  }

  const handleStart = (requestFresh = false) => {
    if (requestFresh && onRequestNewTask) {
      onRequestNewTask()
    }
    let nextTrials = trials
    if (!usedChallengeRef.current && Array.isArray(challenge?.trials) && challenge.trials.length > 0) {
      nextTrials = challenge.trials as GoNoGoTrial[]
      setTrials(nextTrials)
      usedChallengeRef.current = true
    } else {
      nextTrials = buildFallbackGoNoGo()
      setTrials(nextTrials)
    }

    responsesRef.current = []
    rtsRef.current = []
    setGoHits(0)
    setOmissions(0)
    setCommissions(0)
    setRejections(0)
    setIsFinished(false)
    setIsActive(true)
    runTrialAt(0, nextTrials)
  }

  const handlePress = () => {
    if (!isActive || isFinished || !stimulusVisible || respondedRef.current) return
    const tr = trials[currentIdx]
    if (!tr) return

    respondedRef.current = true
    clearTimers()
    const rt = Math.max(90, Math.round(performance.now() - stimulusStartRef.current))
    responsesRef.current.push({ id: tr.id, pressed: true, rt_ms: rt })

    if (tr.kind === 'go') {
      setGoHits((h) => h + 1)
      rtsRef.current.push(rt)
    } else {
      setCommissions((c) => c + 1)
    }

    setStimulusVisible(false)
    runTrialAt(currentIdx + 1, trials)
  }

  useEffect(() => {
    if (!isActive || isFinished) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        handlePress()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  const handleSave = () => {
    const rts = rtsRef.current
    const meanRt = rts.length > 0 ? Math.round(rts.reduce((a, b) => a + b, 0) / rts.length) : null
    const sdRt =
      rts.length > 1 && meanRt !== null
        ? Math.round(
            Math.sqrt(rts.reduce((acc, v) => acc + (v - meanRt) * (v - meanRt), 0) / (rts.length - 1))
          )
        : null
    const total = trials.length
    const inhibitionPct = Number(((rejections / Math.max(1, commissions + rejections)) * 100).toFixed(1))
    const accuracyPct = Number((((goHits + rejections) / Math.max(1, total)) * 100).toFixed(1))

    onComplete({
      summary: `${t.finishTitle} (Точность: ${accuracyPct}%, Торможение No-Go: ${inhibitionPct}%)`,
      metrics: {
        version: 2,
        engine: 'go_no_go',
        metrics: {
          go_hits: goHits,
          omissions_count: omissions,
          commission_errors: commissions,
          correct_rejections: rejections,
          mean_rt_ms: meanRt,
          variability_ms: sdRt,
          inhibition_pct: inhibitionPct,
          accuracy_pct: accuracyPct,
        },
        series: {
          rt_ms: rts,
          errors_by_quarter: [0, 0, 0, 0],
        },
      },
      telemetry: {
        responses: responsesRef.current,
      },
    })
  }

  return (
    <div className="space-y-6 max-w-xl mx-auto text-center select-none">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100 flex items-center justify-center gap-2">
          <Crosshair className="w-6 h-6 text-emerald-500" />
          <span>{t.title}</span>
        </h2>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-md mx-auto leading-relaxed">
          {t.subtitle}
        </p>
      </div>

      {!isActive && !isFinished ? (
        <div className="p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-center space-y-6 shadow-md">
          <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto text-left text-xs font-semibold">
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
              <span className="font-bold block mb-1">🟢 GO (Круг):</span>
              <span>{t.ruleGo}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400">
              <span className="font-bold block mb-1">🟥 NO-GO (Квадрат):</span>
              <span>{t.ruleNoGo}</span>
            </div>
          </div>
          <Button
            size="lg"
            variant="emerald"
            onClick={() => handleStart(false)}
            className="gap-2 px-8 py-3.5 text-base font-bold cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>{t.startBtn}</span>
          </Button>
        </div>
      ) : isActive && !isFinished ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-500 px-2">
            <span>
              Сигнал: {currentIdx + 1} / {trials.length}
            </span>
            <div className="flex items-center gap-3">
              <span className="text-emerald-500">Go: {goHits}</span>
              <span className="text-rose-500">Ложных No-Go: {commissions}</span>
            </div>
          </div>

          <div
            data-gng-kind={stimulusVisible ? currentKind : 'blank'}
            onClick={handlePress}
            className="h-64 sm:h-72 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col items-center justify-center cursor-pointer active:scale-[0.99] transition-transform relative overflow-hidden shadow-xl"
          >
            {stimulusVisible && currentKind === 'go' && (
              <div className="w-32 h-32 rounded-full bg-emerald-500 text-white flex items-center justify-center font-black text-2xl shadow-2xl shadow-emerald-500/50">
                GO!
              </div>
            )}

            {stimulusVisible && currentKind === 'nogo' && (
              <div className="w-32 h-32 rounded-3xl bg-rose-500 text-white flex items-center justify-center font-black text-4xl shadow-2xl shadow-rose-500/50">
                ✕
              </div>
            )}

            {!stimulusVisible && (
              <div className="text-xs font-mono text-zinc-400">{t.waitPrompt}</div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-3xl border border-emerald-500/30 bg-white dark:bg-zinc-900 space-y-4 shadow-lg">
          <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
          <div className="text-base font-bold text-zinc-900 dark:text-zinc-100">{t.finishTitle}</div>
          <div className="grid grid-cols-3 gap-2 max-w-sm mx-auto text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800">
              <span className="text-zinc-400 block text-[10px]">Верных Go:</span>
              <strong className="text-emerald-500 text-sm">{goHits}</strong>
            </div>
            <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800">
              <span className="text-zinc-400 block text-[10px]">Ложных No-Go:</span>
              <strong className="text-rose-500 text-sm">{commissions}</strong>
            </div>
            <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800">
              <span className="text-zinc-400 block text-[10px]">Пропусков:</span>
              <strong className="text-amber-500 text-sm">{omissions}</strong>
            </div>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button variant="outline" size="sm" onClick={() => handleStart(true)} className="gap-1.5 cursor-pointer">
              <RotateCcw className="w-4 h-4" />
              <span>{t.tryAgain}</span>
            </Button>
            <Button variant="emerald" size="sm" onClick={handleSave} className="gap-1.5 font-bold cursor-pointer">
              <CheckCircle className="w-4 h-4" />
              <span>{t.saveBtn}</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
