import React, { useState, useRef, useEffect } from 'react'
import { GitCommit, Clock, Award, CheckCircle, RotateCcw, Play } from 'lucide-react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import type { Language } from '../../i18n'

interface TrailMakingEngineProps {
  lang: Language
  onComplete: (result: { summary: string; metrics: Record<string, unknown> }) => void
}

interface TrailNode {
  id: string
  label: string
  x: number // percentage
  y: number // percentage
}

const NODE_LABELS = [
  { id: '1', label: '1' },
  { id: 'A', label: 'A' },
  { id: '2', label: '2' },
  { id: 'B', label: 'B' },
  { id: '3', label: '3' },
  { id: 'C', label: 'C' },
  { id: '4', label: '4' },
  { id: 'D', label: 'D' },
  { id: '5', label: '5' },
  { id: 'E', label: 'E' },
]

function generateRandomTrailNodes(): TrailNode[] {
  const nodes: TrailNode[] = []
  const minDist = 15 // minimum percent distance between circle centers

  for (const item of NODE_LABELS) {
    let placed = false
    let attempts = 0
    let x = 50
    let y = 50

    while (!placed && attempts < 150) {
      attempts++
      x = Math.floor(12 + Math.random() * 76)
      y = Math.floor(12 + Math.random() * 76)

      const tooClose = nodes.some((n) => {
        const dx = n.x - x
        const dy = n.y - y
        return Math.sqrt(dx * dx + dy * dy) < minDist
      })

      if (!tooClose) {
        placed = true
      }
    }

    nodes.push({ id: item.id, label: item.label, x, y })
  }

  return nodes
}


export const TrailMakingEngine: React.FC<TrailMakingEngineProps> = ({ lang, onComplete }) => {
  const [trailNodes, setTrailNodes] = useState<TrailNode[]>(() => generateRandomTrailNodes())
  const [currentStep, setCurrentStep] = useState(0)
  const [connectedNodes, setConnectedNodes] = useState<TrailNode[]>([])
  const [elapsedSec, setElapsedSec] = useState(0)
  const [errors, setErrors] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  const timerRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)

  const t = {
    ru: {
      title: 'Переключаемость внимания',
      subtitle: 'Последовательно соединяйте кружки, чередуя цифры и буквы: 1 → A → 2 → B → 3 → C...',
      standard: 'Trail Making Test (TMT-B) / Cognitive Switching',
      nextTarget: 'Следующая цель:',
      time: 'Время:',
      sec: 'сек',
      startBtn: 'Начать тест соединений',
      finishTitle: 'Тест переключаемости пройден',
      switchingTime: 'Время переключения (TMT-B)',
      normOptimal: 'Высокая когнитивная гибкость (< 22 сек)',
      normGood: 'Нормативная гибкость (22–35 сек)',
      normSub: 'Замедленное переключение (> 35 сек)',
      finishBtn: 'Завершить и сохранить',
      tryAgain: 'Попробовать снова',
    },
    tj: {
      title: 'Ивазшавии диққат',
      subtitle: 'Доираҳоро бо навбат пайваст кунед, рақамҳо ва ҳарфҳоро иваз намуда: 1 → A → 2 → B → 3 → C...',
      standard: 'Trail Making Test (TMT-B) / Cognitive Switching',
      nextTarget: 'Нишони навбатӣ:',
      time: 'Вақт:',
      sec: 'сон',
      startBtn: 'Оғози санҷиш',
      finishTitle: 'Санҷиши ивазшавии диққат анҷом ёфт',
      switchingTime: 'Вақти ивазшавӣ (TMT-B)',
      normOptimal: 'Чаниши баланди фикрӣ (< 22 сон)',
      normGood: 'Меъёри муътадил (22–35 сон)',
      normSub: 'Ивазшавии суст (> 35 сон)',
      finishBtn: 'Анҷом ва сабт кардан',
      tryAgain: 'Аз нав гузаштан',
    },
    en: {
      title: 'Cognitive Switching',
      subtitle: 'Connect the circles alternating between numbers and letters: 1 → A → 2 → B → 3 → C...',
      standard: 'Trail Making Test Part B Protocol',
      nextTarget: 'Next target:',
      time: 'Time:',
      sec: 's',
      startBtn: 'Start Trail Test',
      finishTitle: 'Trail Connection Completed',
      switchingTime: 'Switching Completion Latency (TMT-B)',
      normOptimal: 'Superior Cognitive Flexibility (< 22 s)',
      normGood: 'Normal Range (22–35 s)',
      normSub: 'Elevated Switching Latency (> 35 s)',
      finishBtn: 'Complete & Save',
      tryAgain: 'Retry',
    },
  }[lang]

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const handleStart = () => {
    setTrailNodes(generateRandomTrailNodes())
    setCurrentStep(0)
    setConnectedNodes([])
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

  const handleNodeClick = (node: TrailNode) => {
    if (!isActive || isFinished) return
    const expected = trailNodes[currentStep]

    if (node.id === expected.id) {
      const nextConnected = [...connectedNodes, node]
      setConnectedNodes(nextConnected)
      if (currentStep + 1 < trailNodes.length) {
        setCurrentStep((prev) => prev + 1)
      } else {
        if (timerRef.current) clearInterval(timerRef.current)
        const finalTime = Math.round((performance.now() - startTimeRef.current) / 100) / 10
        setElapsedSec(finalTime)
        setIsActive(false)
        setIsFinished(true)
      }
    } else {
      setErrors((prev) => prev + 1)
    }
  }

  const handleFinish = () => {
    let category = t.normGood
    if (elapsedSec < 22) category = t.normOptimal
    else if (elapsedSec > 35) category = t.normSub

    onComplete({
      summary: `${t.switchingTime}: ${elapsedSec} ${t.sec} (${category}). Errors: ${errors}.`,
      metrics: {
        completion_time_sec: elapsedSec,
        errors_count: errors,
        status_category: category,
      },
    })
  }

  const nextExpected = trailNodes[currentStep]

  return (
    <div className="flex flex-col items-center max-w-xl mx-auto w-full select-none">
      {/* Top Standard Badge & Quick Controls */}
      <div className="w-full flex items-center justify-between gap-3 mb-4">
        <Badge variant="cyan" className="gap-1.5 liquid-glass-pill py-1.5 px-3">
          <GitCommit className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
          <span className="truncate">{t.standard}</span>
        </Badge>
        {isActive && (
          <button
            onClick={handleStart}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono text-zinc-500 hover:text-cyan-500 border border-zinc-200/60 dark:border-zinc-800 bg-white/40 dark:bg-zinc-900/40 liquid-glass-pill transition-colors shrink-0 shadow-xs"
            title={t.tryAgain}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.tryAgain}</span>
          </button>
        )}
      </div>

      {/* Dedicated HUD Bar: Timer & Next Target separated below */}
      {isActive && (
        <div className="w-full mb-6 p-4 rounded-3xl liquid-glass border border-cyan-500/25 shadow-xl animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="grid grid-cols-2 gap-3 items-center">
            
            {/* Target Node */}
            <div className="p-3 sm:p-3.5 rounded-2xl liquid-glass-pill border border-emerald-500/30 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-mono text-2xl font-black shrink-0 border border-emerald-500/40 shadow-inner">
                {nextExpected.label}
              </div>
              <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold truncate">
                  {t.nextTarget}
                </div>
                <div className="text-sm font-mono font-bold text-zinc-900 dark:text-zinc-100">
                  <span className="text-emerald-500 text-lg font-black">{nextExpected.label}</span>
                </div>
              </div>
            </div>

            {/* Timer */}
            <div className="p-3 sm:p-3.5 rounded-2xl liquid-glass-pill border border-cyan-500/30 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/40 shadow-inner">
                <Clock className="w-6 h-6 animate-pulse" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold truncate">
                  {t.time}
                </div>
                <div className="text-lg sm:text-xl font-mono font-black text-cyan-600 dark:text-cyan-400 truncate">
                  {elapsedSec.toFixed(1)}{' '}
                  <span className="text-xs font-normal text-zinc-400">{t.sec}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {!isActive && !isFinished && (
        <div className="w-full rounded-3xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-100/50 dark:bg-zinc-900/40 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-500 mb-4">
            <GitCommit className="w-8 h-8" />
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
        <div className="w-full relative h-96 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden mb-6">
          {/* Connecting SVG lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            {connectedNodes.map((node, idx) => {
              if (idx === 0) return null
              const prev = connectedNodes[idx - 1]
              return (
                <line
                  key={idx}
                  x1={`${prev.x}%`}
                  y1={`${prev.y}%`}
                  x2={`${node.x}%`}
                  y2={`${node.y}%`}
                  stroke="#10b981"
                  strokeWidth="3"
                  strokeDasharray="4 2"
                  className="animate-in fade-in duration-300"
                />
              )
            })}
          </svg>

          {/* Target Nodes */}
          {trailNodes.map((node) => {
            const isConnected = connectedNodes.some((n) => n.id === node.id)
            const isNext = nextExpected.id === node.id

            return (
              <button
                key={node.id}
                onClick={() => handleNodeClick(node)}
                style={{ left: `${node.x}%`, top: `${node.y}%` }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-full font-mono text-base font-extrabold flex items-center justify-center transition-all duration-150 z-10 active:scale-90 ${
                  isConnected
                    ? 'bg-emerald-500 text-white shadow-md'
                    : isNext
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-2 border-emerald-500 ring-4 ring-emerald-500/20'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 hover:border-zinc-400'
                }`}
              >
                {node.label}
              </button>
            )
          })}
        </div>
      )}

      {isFinished && (
        <div className="w-full rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 text-center shadow-xl">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-4">
            <Award className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">{t.finishTitle}</h3>

          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/80 max-w-xs mx-auto my-6">
            <div className="text-xs text-zinc-500 mb-1">{t.switchingTime}</div>
            <div className="text-4xl font-black text-emerald-500 font-mono">
              {elapsedSec.toFixed(1)}{' '}
              <span className="text-sm font-normal text-zinc-400">{t.sec}</span>
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
