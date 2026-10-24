import React, { useState, useEffect, useRef } from 'react'
import { Navigation, Play, RotateCcw, CheckCircle, AlertCircle, Sparkles } from 'lucide-react'
import { Button } from '../ui/Button'
import type { Language } from '../../i18n'

interface PathMemoryEngineProps {
  lang: Language
  challenge?: Record<string, unknown> | null
  onComplete: (result: { summary: string; metrics: Record<string, unknown> }) => void
}

interface Point {
  row: number
  col: number
}

export const PathMemoryEngine: React.FC<PathMemoryEngineProps> = ({
  lang,
  challenge,
  onComplete,
}) => {
  const [path, setPath] = useState<Point[]>([])
  const [userPath, setUserPath] = useState<Point[]>([])
  const [phase, setPhase] = useState<'idle' | 'demonstrating' | 'input' | 'finished'>('idle')
  const [activeDemoStep, setActiveDemoStep] = useState<number>(-1)
  const [errorIndex, setErrorIndex] = useState<number | null>(null)
  const demoTimerRef = useRef<number | null>(null)

  const t = {
    ru: {
      title: 'Запомни маршрут',
      subtitle: 'Внимательно запомните светящуюся цепочку клеток, а затем воспроизведите её по памяти.',
      startBtn: 'Показать маршрут',
      watchPhase: 'Внимание: запоминайте траекторию маршрута...',
      inputPhase: 'Ваша очередь: нажмите клетки маршрута по порядку!',
      finishSuccess: 'Маршрут успешно воспроизведен!',
      finishError: 'Ошибка в маршруте',
      stepsCount: 'Шагов маршрута:',
      tryAgain: 'Попробовать снова',
      saveBtn: 'Завершить и сохранить',
    },
    tj: {
      title: 'Масирро ба хотир гир',
      subtitle: 'Занҷираи равшани ҳуҷайраҳоро дар хотир гиред ва сипас онро такрор кунед.',
      startBtn: 'Нишон додани масир',
      watchPhase: 'Диққат: траекторияи масирро дар хотир гиред...',
      inputPhase: 'Навбати шумо: ҳуҷайраҳоро бо ҳамон тартиб пахш кунед!',
      finishSuccess: 'Масир бомуваффақият такрор шуд!',
      finishError: 'Хатогӣ дар масир',
      stepsCount: 'Қадамҳои масир:',
      tryAgain: 'Аз нав гузаштан',
      saveBtn: 'Анҷом ва сабт кардан',
    },
    en: {
      title: 'Path Memory',
      subtitle: 'Memorize the glowing path sequence on the grid, then trace it accurately from memory.',
      startBtn: 'Show Path',
      watchPhase: 'Watch carefully: memorize the route...',
      inputPhase: 'Your turn: click the path cells in order!',
      finishSuccess: 'Path successfully reproduced!',
      finishError: 'Path mistake',
      stepsCount: 'Path length:',
      tryAgain: 'Try Again',
      saveBtn: 'Complete and Save',
    },
  }[lang]

  const generateDefaultPath = (): Point[] => {
    return [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 1, col: 1 },
      { row: 2, col: 1 },
      { row: 2, col: 2 },
      { row: 3, col: 2 },
    ]
  }

  const handleStart = () => {
    let p: Point[] = []
    if (challenge && Array.isArray(challenge.path) && challenge.path.length > 0) {
      p = challenge.path as Point[]
    } else {
      p = generateDefaultPath()
    }
    setPath(p)
    setUserPath([])
    setErrorIndex(null)
    setPhase('demonstrating')
    setActiveDemoStep(0)
  }

  // Demonstration animation
  useEffect(() => {
    if (phase === 'demonstrating') {
      if (activeDemoStep < path.length) {
        demoTimerRef.current = window.setTimeout(() => {
          setActiveDemoStep((s) => s + 1)
        }, 650)
      } else {
        // Finished showing, switch to user input
        demoTimerRef.current = window.setTimeout(() => {
          setPhase('input')
          setActiveDemoStep(-1)
        }, 500)
      }
    }
    return () => {
      if (demoTimerRef.current) clearTimeout(demoTimerRef.current)
    }
  }, [phase, activeDemoStep, path])

  const handleCellClick = (r: number, c: number) => {
    if (phase !== 'input') return

    const expected = path[userPath.length]
    if (!expected) return

    if (expected.row === r && expected.col === c) {
      const nextUser = [...userPath, { row: r, col: c }]
      setUserPath(nextUser)

      if (nextUser.length === path.length) {
        setPhase('finished')
      }
    } else {
      // Mistake
      setErrorIndex(userPath.length)
      setPhase('finished')
    }
  }

  const handleSave = () => {
    const correctCount = userPath.length
    const totalCount = path.length
    const accuracy = Math.round((correctCount / Math.max(1, totalCount)) * 100)

    onComplete({
      summary: `${t.finishSuccess} (${correctCount}/${totalCount} шагов, точность ${accuracy}%)`,
      metrics: {
        steps_correct: correctCount,
        total_steps: totalCount,
        accuracy_pct: accuracy,
      },
    })
  }

  return (
    <div className="space-y-6 max-w-xl mx-auto text-center">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100 flex items-center justify-center gap-2">
          <Navigation className="w-6 h-6 text-emerald-500" />
          <span>{t.title}</span>
        </h2>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-md mx-auto">
          {t.subtitle}
        </p>
      </div>

      {phase === 'idle' ? (
        <div className="p-8 rounded-3xl liquid-glass border border-emerald-500/20 text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 text-emerald-500 mx-auto flex items-center justify-center border border-emerald-500/30">
            <Sparkles className="w-8 h-8" />
          </div>
          <Button size="lg" variant="emerald" onClick={handleStart} className="gap-2 px-8 py-3.5 text-base font-bold shadow-lg shadow-emerald-600/30">
            <Play className="w-5 h-5 fill-current" />
            <span>{t.startBtn}</span>
          </Button>
        </div>
      ) : (
        <>
          {/* Status message */}
          <div className="p-3 rounded-2xl liquid-glass border border-emerald-500/20 text-xs font-semibold">
            {phase === 'demonstrating' && (
              <span className="text-emerald-500 animate-pulse">{t.watchPhase}</span>
            )}
            {phase === 'input' && (
              <span className="text-teal-500">{t.inputPhase} ({userPath.length}/{path.length})</span>
            )}
            {phase === 'finished' && (
              errorIndex !== null ? (
                <span className="text-rose-500">{t.finishError} ({userPath.length}/{path.length})</span>
              ) : (
                <span className="text-emerald-500">{t.finishSuccess}</span>
              )
            )}
          </div>

          {/* 4x4 Grid */}
          <div className="grid grid-cols-4 gap-2.5 sm:gap-3 p-4 rounded-3xl liquid-glass border border-emerald-500/20 max-w-sm mx-auto">
            {Array.from({ length: 4 }).map((_, r) =>
              Array.from({ length: 4 }).map((__, c) => {
                // Is this cell active in demo?
                const isDemoActive =
                  phase === 'demonstrating' &&
                  path.slice(0, activeDemoStep + 1).some((p) => p.row === r && p.col === c)

                // Is this cell already clicked by user?
                const userClickIdx = userPath.findIndex((p) => p.row === r && p.col === c)
                const isUserClicked = userClickIdx !== -1

                return (
                  <button
                    key={`${r}-${c}`}
                    onClick={() => handleCellClick(r, c)}
                    disabled={phase !== 'input'}
                    className={`aspect-square rounded-2xl text-xs font-mono font-bold flex items-center justify-center transition-all duration-300 ${
                      isDemoActive
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40 scale-95 border-2 border-emerald-300'
                        : isUserClicked
                        ? 'bg-teal-500/30 border-2 border-teal-400 text-teal-300 scale-95 shadow-md shadow-teal-500/20'
                        : 'bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 hover:border-emerald-500/40 active:scale-95'
                    }`}
                  >
                    {isUserClicked ? userClickIdx + 1 : isDemoActive ? '●' : ''}
                  </button>
                )
              })
            )}
          </div>

          {phase === 'finished' && (
            <div className="p-5 rounded-3xl liquid-glass border border-emerald-500/30 space-y-3 animate-in fade-in duration-300">
              {errorIndex === null ? (
                <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
              ) : (
                <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
              )}
              <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {errorIndex === null ? t.finishSuccess : t.finishError}
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <Button variant="outline" size="sm" onClick={handleStart} className="gap-1.5 liquid-glass-pill">
                  <RotateCcw className="w-4 h-4" />
                  <span>{t.tryAgain}</span>
                </Button>
                <Button variant="emerald" size="sm" onClick={handleSave} className="gap-1.5 font-bold shadow-md shadow-emerald-600/30">
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
