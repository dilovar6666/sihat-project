import React, { useState, useEffect, useRef } from 'react'
import { Navigation, Play, RotateCcw, CheckCircle, Sparkles } from 'lucide-react'
import { Button } from '../ui/Button'
import { prefersReducedMotion, type InteractiveEngineProps } from './engineTypes'

interface CellCoord {
  r: number
  c: number
}

interface PathTrial {
  id: string
  path: CellCoord[]
}

function generateSingleRoute(size: number, steps: number): CellCoord[] {
  for (let attempt = 0; attempt < 200; attempt++) {
    let r = Math.floor(Math.random() * size)
    let c = Math.floor(Math.random() * size)
    const path: CellCoord[] = [{ r, c }]
    while (path.length < steps) {
      const dirs = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]
      const options = dirs
        .map(([dr, dc]) => ({ r: r + dr, c: c + dc }))
        .filter(
          (pt) =>
            pt.r >= 0 &&
            pt.r < size &&
            pt.c >= 0 &&
            pt.c < size &&
            !path.some((p) => p.r === pt.r && p.c === pt.c)
        )
      if (options.length === 0) break
      const next = options[Math.floor(Math.random() * options.length)]
      r = next.r
      c = next.c
      path.push({ r, c })
    }
    if (path.length === steps) return path
  }
  return Array.from({ length: steps }, (_, i) => ({ r: Math.floor(i / size), c: i % size }))
}

function buildFallbackPathMemory(): { size: number; trials: PathTrial[] } {
  const size = 4
  return {
    size,
    trials: [4, 5, 6].map((steps, i) => ({
      id: `p${i + 1}`,
      path: generateSingleRoute(size, steps),
    })),
  }
}

export const PathMemoryEngine: React.FC<InteractiveEngineProps> = ({
  lang,
  challenge,
  onComplete,
  onRequestNewTask,
}) => {
  const [task, setTask] = useState<{ size: number; trials: PathTrial[] }>(() =>
    Array.isArray(challenge?.trials) && challenge.trials.length > 0
      ? {
          size: Number(challenge.size) || 4,
          trials: (challenge.trials as Array<{ id: string; path: Array<{ r?: number; c?: number; row?: number; col?: number }> }>).map(
            (tr) => ({
              id: tr.id,
              path: tr.path.map((pt) => ({
                r: typeof pt.r === 'number' ? pt.r : Number(pt.row) || 0,
                c: typeof pt.c === 'number' ? pt.c : Number(pt.col) || 0,
              })),
            })
          ),
        }
      : buildFallbackPathMemory()
  )
  const [trialIdx, setTrialIdx] = useState(0)
  const [userTaps, setUserTaps] = useState<CellCoord[]>([])
  const [phase, setPhase] = useState<'idle' | 'demonstrating' | 'input' | 'finished'>('idle')
  const [activeDemoStep, setActiveDemoStep] = useState<number>(-1)

  const demoTimerRef = useRef<number | null>(null)
  const responsesRef = useRef<Array<{ id: string; taps: CellCoord[] }>>([])
  const usedChallengeRef = useRef(false)

  useEffect(() => {
    if (Array.isArray(challenge?.trials) && challenge.trials.length > 0 && phase === 'idle') {
      setTask({
        size: Number(challenge.size) || 4,
        trials: (challenge.trials as Array<{ id: string; path: Array<{ r?: number; c?: number; row?: number; col?: number }> }>).map(
          (tr) => ({
            id: tr.id,
            path: tr.path.map((pt) => ({
              r: typeof pt.r === 'number' ? pt.r : Number(pt.row) || 0,
              c: typeof pt.c === 'number' ? pt.c : Number(pt.col) || 0,
            })),
          })
        ),
      })
      usedChallengeRef.current = false
    }
  }, [challenge, phase])

  const currentTrial = task.trials[trialIdx]

  const t = {
    ru: {
      title: 'Запомни маршрут (3 маршрута: 4, 5 и 6 шагов)',
      subtitle: 'Внимательно проследите за цепочкой загорающихся клеток на сетке 4×4, а затем нажмите те же клетки строго по порядку.',
      startBtn: 'Показать маршрут №1',
      watchPhase: 'Внимание: запоминайте маршрут...',
      inputPhase: 'Ваша очередь: нажмите клетки маршрута по порядку',
      routeLabel: 'Маршрут',
      of: 'из',
      stepsLabel: 'шагов',
      finishSuccess: 'Все маршруты пройдены!',
      tryAgain: 'Новый вариант',
      saveBtn: 'Показать подробный отчёт',
    },
    tj: {
      title: 'Масирро ба хотир гиред (3 масир: 4, 5 ва 6 қадам)',
      subtitle: 'Занҷираи равшани ҳуҷайраҳоро дар шабакаи 4×4 дар хотир гиред ва сипас онҳоро бо тартиб пахш намоед.',
      startBtn: 'Нишон додани масири №1',
      watchPhase: 'Диққат: траекторияи масирро дар хотир гиред...',
      inputPhase: 'Навбати шумо: ҳуҷайраҳоро бо тартиб пахш кунед',
      routeLabel: 'Масири',
      of: 'аз',
      stepsLabel: 'қадам',
      finishSuccess: 'Ҳамаи масирҳо анҷом ёфтанд!',
      tryAgain: 'Варианти нав',
      saveBtn: 'Дидани ҳисоботи муфассал',
    },
    en: {
      title: 'Path Memory (3 Routes: 4, 5 & 6 Steps)',
      subtitle: 'Watch the connected route illuminate across the 4×4 grid, then tap the cells in the exact same order.',
      startBtn: 'Show Route #1',
      watchPhase: 'Watch carefully: memorize the route...',
      inputPhase: 'Your turn: tap the route cells in order',
      routeLabel: 'Route',
      of: 'of',
      stepsLabel: 'steps',
      finishSuccess: 'All routes completed!',
      tryAgain: 'New Variant',
      saveBtn: 'View Detailed Report',
    },
  }[lang]

  const handleStart = (requestFresh = false) => {
    if (requestFresh && onRequestNewTask) {
      onRequestNewTask()
    }
    if (!usedChallengeRef.current && Array.isArray(challenge?.trials) && challenge.trials.length > 0) {
      setTask({
        size: Number(challenge.size) || 4,
        trials: (challenge.trials as Array<{ id: string; path: Array<{ r?: number; c?: number; row?: number; col?: number }> }>).map(
          (tr) => ({
            id: tr.id,
            path: tr.path.map((pt) => ({
              r: typeof pt.r === 'number' ? pt.r : Number(pt.row) || 0,
              c: typeof pt.c === 'number' ? pt.c : Number(pt.col) || 0,
            })),
          })
        ),
      })
      usedChallengeRef.current = true
    } else {
      setTask(buildFallbackPathMemory())
    }

    responsesRef.current = []
    setTrialIdx(0)
    setUserTaps([])
    setActiveDemoStep(0)
    setPhase('demonstrating')
  }

  useEffect(() => {
    if (phase === 'demonstrating' && currentTrial) {
      const stepMs = prefersReducedMotion() ? 450 : 580
      if (activeDemoStep < currentTrial.path.length) {
        demoTimerRef.current = window.setTimeout(() => {
          setActiveDemoStep((s) => s + 1)
        }, stepMs)
      } else {
        demoTimerRef.current = window.setTimeout(() => {
          setPhase('input')
          setActiveDemoStep(-1)
        }, 380)
      }
    }
    return () => {
      if (demoTimerRef.current) clearTimeout(demoTimerRef.current)
    }
  }, [phase, activeDemoStep, currentTrial])

  const handleCellClick = (r: number, c: number) => {
    if (phase !== 'input' || !currentTrial) return

    const nextTaps = [...userTaps, { r, c }]
    setUserTaps(nextTaps)

    if (nextTaps.length >= currentTrial.path.length) {
      responsesRef.current.push({
        id: currentTrial.id,
        taps: nextTaps,
      })

      if (trialIdx + 1 < task.trials.length) {
        const nextIdx = trialIdx + 1
        setTimeout(() => {
          setTrialIdx(nextIdx)
          setUserTaps([])
          setActiveDemoStep(0)
          setPhase('demonstrating')
        }, 380)
      } else {
        setPhase('finished')
      }
    }
  }

  const computeSummary = () => {
    let routesOk = 0
    let stepsOk = 0
    let stepsTotal = 0
    let longest = 0
    const series: Array<{ length: number; correct_steps: number; full: boolean }> = []

    for (const tr of task.trials) {
      const resp = responsesRef.current.find((r) => r.id === tr.id)
      const taps = resp?.taps || []
      let matches = 0
      for (let i = 0; i < Math.min(taps.length, tr.path.length); i++) {
        if (taps[i].r === tr.path[i].r && taps[i].c === tr.path[i].c) {
          matches += 1
        }
      }
      const full = matches === tr.path.length && taps.length === tr.path.length
      if (full) {
        routesOk += 1
        longest = Math.max(longest, tr.path.length)
      }
      stepsOk += matches
      stepsTotal += tr.path.length
      series.push({ length: tr.path.length, correct_steps: matches, full })
    }
    const accuracyPct = stepsTotal > 0 ? Number(((stepsOk / stepsTotal) * 100).toFixed(1)) : 0
    return {
      routesOk,
      routesTotal: task.trials.length,
      stepsOk,
      stepsTotal,
      longest,
      accuracyPct,
      series,
    }
  }

  const handleSave = () => {
    const s = computeSummary()
    onComplete({
      summary: `${t.finishSuccess} (${s.stepsOk}/${s.stepsTotal} ${t.stepsLabel}, ${s.accuracyPct}%)`,
      metrics: {
        version: 2,
        engine: 'path_memory',
        metrics: {
          routes_correct: s.routesOk,
          routes_total: s.routesTotal,
          steps_correct: s.stepsOk,
          steps_total: s.stepsTotal,
          longest_route: s.longest,
          accuracy_pct: s.accuracyPct,
        },
        series: {
          by_route: s.series,
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
          <Navigation className="w-6 h-6 text-emerald-500" />
          <span>{t.title}</span>
        </h2>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-md mx-auto leading-relaxed">
          {t.subtitle}
        </p>
      </div>

      {phase === 'idle' ? (
        <div className="p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-center space-y-5 shadow-md">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 text-emerald-500 mx-auto flex items-center justify-center border border-emerald-500/30">
            <Sparkles className="w-8 h-8" />
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
      ) : (
        <>
          <div className="flex items-center justify-between p-3.5 rounded-2xl liquid-glass border border-emerald-500/20 text-xs font-semibold">
            {currentTrial && (
              <span className="font-mono text-zinc-500">
                {t.routeLabel} {trialIdx + 1} {t.of} {task.trials.length} ({currentTrial.path.length} {t.stepsLabel})
              </span>
            )}
            {phase === 'demonstrating' && (
              <span className="text-emerald-500 font-bold">{t.watchPhase}</span>
            )}
            {phase === 'input' && currentTrial && (
              <span className="text-cyan-600 dark:text-cyan-400 font-bold">
                {t.inputPhase} ({userTaps.length}/{currentTrial.path.length})
              </span>
            )}
            {phase === 'finished' && (
              <span className="text-emerald-500 font-bold">{t.finishSuccess}</span>
            )}
          </div>

          <div
            data-path-trial={currentTrial?.id}
            className="grid grid-cols-4 gap-2.5 sm:gap-3 p-4 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl max-w-sm mx-auto"
          >
            {Array.from({ length: task.size }).map((_, r) =>
              Array.from({ length: task.size }).map((__, c) => {
                const demoIndex =
                  phase === 'demonstrating' && currentTrial
                    ? currentTrial.path
                        .slice(0, activeDemoStep + 1)
                        .findIndex((p) => p.r === r && p.c === c)
                    : -1
                const isDemoActive = demoIndex !== -1
                const isCurrentHead =
                  phase === 'demonstrating' &&
                  currentTrial &&
                  currentTrial.path[activeDemoStep]?.r === r &&
                  currentTrial.path[activeDemoStep]?.c === c

                const userClickIdx = userTaps.findIndex((p) => p.r === r && p.c === c)
                const isUserClicked = userClickIdx !== -1

                return (
                  <button
                    key={`${r}-${c}`}
                    type="button"
                    data-path-cell={`${r}-${c}`}
                    onClick={() => handleCellClick(r, c)}
                    disabled={phase !== 'input'}
                    className={`aspect-square rounded-2xl text-sm font-mono font-extrabold flex items-center justify-center transition-all duration-200 cursor-pointer ${
                      isCurrentHead
                        ? 'bg-emerald-500 text-white shadow-lg scale-105 border-2 border-white'
                        : isDemoActive
                        ? 'bg-emerald-500/35 text-emerald-700 dark:text-emerald-300 border-2 border-emerald-500'
                        : isUserClicked
                        ? 'bg-cyan-500/25 border-2 border-cyan-500 text-cyan-600 dark:text-cyan-300'
                        : 'bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-emerald-500/50 active:scale-95'
                    }`}
                  >
                    {isUserClicked ? userClickIdx + 1 : isDemoActive ? demoIndex + 1 : ''}
                  </button>
                )
              })
            )}
          </div>

          {phase === 'finished' && (
            <div className="p-6 rounded-3xl border border-emerald-500/30 bg-white dark:bg-zinc-900 space-y-4 shadow-lg">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
              <div className="text-base font-bold text-zinc-900 dark:text-zinc-100">{t.finishSuccess}</div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <Button variant="outline" size="sm" onClick={() => handleStart(true)} className="gap-1.5 cursor-pointer">
                  <RotateCcw className="w-4 h-4" />
                  <span>{t.tryAgain}</span>
                </Button>
                <Button
                  variant="emerald"
                  size="sm"
                  onClick={handleSave}
                  className="gap-1.5 font-bold cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{t.saveBtn}</span>
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
