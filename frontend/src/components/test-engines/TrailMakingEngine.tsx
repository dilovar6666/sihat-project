import React, { useState, useRef, useEffect } from 'react'
import { GitCommit, Clock, Award, CheckCircle, RotateCcw, Play } from 'lucide-react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { shuffleArray, type InteractiveEngineProps } from './engineTypes'

interface TrailNode {
  id: string
  x: number
  y: number
}

interface TrailPart {
  id: 'A' | 'B'
  sequence: string[]
  nodes: TrailNode[]
}

const SEQ_A = ['1', '2', '3', '4', '5', '6', '7', '8']
const SEQ_B = ['1', 'A', '2', 'B', '3', 'C', '4', 'D']

function generateNodes(labels: string[]): TrailNode[] {
  const nodes: TrailNode[] = []
  const minDist = 18
  for (const label of labels) {
    let placed = false
    let x = 50
    let y = 50
    for (let attempt = 0; attempt < 250; attempt++) {
      x = Math.round((12 + Math.random() * 76) * 10) / 10
      y = Math.round((14 + Math.random() * 72) * 10) / 10
      const d = attempt < 180 ? minDist : minDist * 0.7
      if (nodes.every((n) => Math.hypot(x - n.x, y - n.y) >= d)) {
        placed = true
        break
      }
    }
    if (!placed) {
      x = Math.round((12 + Math.random() * 76) * 10) / 10
      y = 50
    }
    nodes.push({ id: label, x, y })
  }
  return shuffleArray(nodes)
}

function buildFallbackParts(): TrailPart[] {
  return [
    { id: 'A', sequence: SEQ_A, nodes: generateNodes(SEQ_A) },
    { id: 'B', sequence: SEQ_B, nodes: generateNodes(SEQ_B) },
  ]
}

export const TrailMakingEngine: React.FC<InteractiveEngineProps> = ({
  lang,
  challenge,
  onComplete,
  onRequestNewTask,
}) => {
  const [parts, setParts] = useState<TrailPart[]>(() =>
    Array.isArray(challenge?.parts) && challenge.parts.length === 2
      ? (challenge.parts as TrailPart[])
      : buildFallbackParts()
  )
  const [partIdx, setPartIdx] = useState<0 | 1>(0)
  const [currentStep, setCurrentStep] = useState(0)
  const [connectedNodes, setConnectedNodes] = useState<TrailNode[]>([])
  const [elapsedSec, setElapsedSec] = useState(0)
  const [errorsA, setErrorsA] = useState(0)
  const [errorsB, setErrorsB] = useState(0)
  const [wrongNodeId, setWrongNodeId] = useState<string | null>(null)
  const [isActive, setIsActive] = useState(false)
  const [isBetweenParts, setIsBetweenParts] = useState(false)
  const [isFinished, setIsFinished] = useState(false)

  const timerRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)
  const clicksARef = useRef<Array<{ id: string; t: number }>>([])
  const clicksBRef = useRef<Array<{ id: string; t: number }>>([])
  const partASecRef = useRef<number>(0)
  const partBSecRef = useRef<number>(0)
  const usedChallengeRef = useRef<boolean>(false)

  useEffect(() => {
    if (Array.isArray(challenge?.parts) && challenge.parts.length === 2 && !isActive && !isFinished) {
      setParts(challenge.parts as TrailPart[])
      usedChallengeRef.current = false
    }
  }, [challenge, isActive, isFinished])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const t = {
    ru: {
      title: 'Переключение внимания (Части A и B)',
      subtitle: 'Часть A: соедините числа по порядку (1 → 8). Часть B: чередуйте числа и буквы (1 → A → 2 → B → 3 → C → 4 → D).',
      standard: 'Trail Making Paradigm • Когнитивная гибкость (A / B)',
      partALabel: 'Часть A: Числа 1 → 8',
      partBLabel: 'Часть B: Чередование 1 → A → 2 → B...',
      nextTarget: 'Следующий узел:',
      time: 'Время:',
      sec: 'с',
      startBtn: 'Начать Часть A (1 → 8)',
      startPartBBtn: 'Перейти к Части B (1 → A → 2 → B)',
      partADoneTitle: 'Часть A пройдена!',
      partADoneDesc: 'Теперь чередуйте числа и буквы в порядке: 1 → A → 2 → B → 3 → C → 4 → D.',
      finishTitle: 'Обе части успешно пройдены!',
      switchingCost: 'Цена переключения (B − A)',
      finishBtn: 'Показать подробный отчёт',
      tryAgain: 'Новый вариант',
    },
    tj: {
      title: 'Ивазшавии диққат (Қисмҳои A ва B)',
      subtitle: 'Қисми A: рақамҳоро пайдарпай пайваст кунед (1 → 8). Қисми B: рақам ва ҳарфҳоро иваз намоед (1 → A → 2 → B → 3 → C → 4 → D).',
      standard: 'Trail Making Paradigm • Чандирии маърифатӣ (A / B)',
      partALabel: 'Қисми A: Рақамҳо 1 → 8',
      partBLabel: 'Қисми B: Ивазкунӣ 1 → A → 2 → B...',
      nextTarget: 'Нишони навбатӣ:',
      time: 'Вақт:',
      sec: 'с',
      startBtn: 'Оғози Қисми A (1 → 8)',
      startPartBBtn: 'Гузаштан ба Қисми B (1 → A → 2 → B)',
      partADoneTitle: 'Қисми A анҷом ёфт!',
      partADoneDesc: 'Акнун рақамҳо ва ҳарфҳоро бо тартиби 1 → A → 2 → B → 3 → C → 4 → D пайваст кунед.',
      finishTitle: 'Ҳар ду қисм бомуваффақият анҷом ёфтанд!',
      switchingCost: 'Арзиши ивазшавӣ (B − A)',
      finishBtn: 'Дидани ҳисоботи муфассал',
      tryAgain: 'Варианти нав',
    },
    en: {
      title: 'Attention Switching (Parts A & B)',
      subtitle: 'Part A: connect numbers in order (1 → 8). Part B: alternate numbers and letters (1 → A → 2 → B → 3 → C → 4 → D).',
      standard: 'Trail Making Paradigm • Task-Set Switching (A / B)',
      partALabel: 'Part A: Numbers 1 → 8',
      partBLabel: 'Part B: Alternating 1 → A → 2 → B...',
      nextTarget: 'Next node:',
      time: 'Time:',
      sec: 's',
      startBtn: 'Start Part A (1 → 8)',
      startPartBBtn: 'Continue to Part B (1 → A → 2 → B)',
      partADoneTitle: 'Part A Completed!',
      partADoneDesc: 'Now alternate between numbers and letters in order: 1 → A → 2 → B → 3 → C → 4 → D.',
      finishTitle: 'Both Trail Parts Completed!',
      switchingCost: 'Switching Cost (B − A)',
      finishBtn: 'View Detailed Report',
      tryAgain: 'New Variant',
    },
  }[lang]

  const startPartTimer = () => {
    startTimeRef.current = performance.now()
    setElapsedSec(0)
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = window.setInterval(() => {
      setElapsedSec(Math.round((performance.now() - startTimeRef.current) / 100) / 10)
    }, 100)
  }

  const handleStart = (requestFresh = false) => {
    if (requestFresh && onRequestNewTask) {
      onRequestNewTask()
    }
    if (!usedChallengeRef.current && Array.isArray(challenge?.parts) && challenge.parts.length === 2) {
      setParts(challenge.parts as TrailPart[])
      usedChallengeRef.current = true
    } else {
      setParts(buildFallbackParts())
    }
    clicksARef.current = []
    clicksBRef.current = []
    partASecRef.current = 0
    partBSecRef.current = 0
    setPartIdx(0)
    setCurrentStep(0)
    setConnectedNodes([])
    setErrorsA(0)
    setErrorsB(0)
    setIsBetweenParts(false)
    setIsFinished(false)
    setIsActive(true)
    startPartTimer()
  }

  const handleStartPartB = () => {
    setPartIdx(1)
    setCurrentStep(0)
    setConnectedNodes([])
    setIsBetweenParts(false)
    setIsActive(true)
    startPartTimer()
  }

  const currentPart = parts[partIdx] || parts[0]
  const expectedId = currentPart.sequence[currentStep]

  const handleNodeClick = (node: TrailNode) => {
    if (!isActive || isFinished || isBetweenParts) return

    const activeClicks = partIdx === 0 ? clicksARef.current : clicksBRef.current
    const rawElapsed = Math.round(performance.now() - startTimeRef.current)
    const prevT = activeClicks.length > 0 ? activeClicks[activeClicks.length - 1].t : 0
    const recordedT = Math.max(rawElapsed, prevT + 220)
    activeClicks.push({ id: node.id, t: recordedT })

    if (node.id === expectedId) {
      const nextConnected = [...connectedNodes, node]
      setConnectedNodes(nextConnected)
      if (currentStep + 1 < currentPart.sequence.length) {
        setCurrentStep((prev) => prev + 1)
      } else {
        if (timerRef.current) clearInterval(timerRef.current)
        const partSec = Number((recordedT / 1000).toFixed(2))
        setElapsedSec(partSec)
        if (partIdx === 0) {
          partASecRef.current = partSec
          setIsActive(false)
          setIsBetweenParts(true)
        } else {
          partBSecRef.current = partSec
          setIsActive(false)
          setIsFinished(true)
        }
      }
    } else {
      if (partIdx === 0) setErrorsA((e) => e + 1)
      else setErrorsB((e) => e + 1)
      setWrongNodeId(node.id)
      setTimeout(() => setWrongNodeId(null), 350)
    }
  }

  const handleFinish = () => {
    const aSec = partASecRef.current
    const bSec = partBSecRef.current
    const costSec = Number((bSec - aSec).toFixed(2))
    const totalErrors = errorsA + errorsB
    const accuracyPct = Number(((16 / (16 + totalErrors)) * 100).toFixed(1))

    const replaySplits = (clicks: Array<{ id: string; t: number }>, seq: string[]) => {
      const splits: number[] = []
      let idx = 0
      let lastT = 0
      for (const c of clicks) {
        if (c.id === seq[idx]) {
          splits.push(Math.round(c.t - lastT))
          lastT = c.t
          idx += 1
        }
      }
      return splits
    }

    onComplete({
      summary: `A: ${aSec} ${t.sec}, B: ${bSec} ${t.sec} (${t.switchingCost}: ${costSec} ${t.sec})`,
      metrics: {
        version: 2,
        engine: 'trail',
        metrics: {
          part_a_sec: aSec,
          part_b_sec: bSec,
          switching_cost_sec: costSec,
          errors_a: errorsA,
          errors_b: errorsB,
          errors_count: totalErrors,
          accuracy_pct: accuracyPct,
        },
        series: {
          step_times_a_ms: replaySplits(clicksARef.current, SEQ_A),
          step_times_b_ms: replaySplits(clicksBRef.current, SEQ_B),
        },
      },
      telemetry: {
        parts: {
          A: { clicks: clicksARef.current },
          B: { clicks: clicksBRef.current },
        },
      },
    })
  }

  return (
    <div className="flex flex-col items-center max-w-xl mx-auto w-full select-none">
      <div className="w-full flex items-center justify-between gap-3 mb-4">
        <Badge variant="cyan" className="gap-1.5 liquid-glass-pill py-1.5 px-3">
          <GitCommit className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
          <span className="truncate">{t.standard}</span>
        </Badge>
        {isActive && (
          <button
            onClick={() => handleStart(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono text-zinc-600 dark:text-zinc-300 hover:text-cyan-500 border border-zinc-200/60 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 transition-colors shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t.tryAgain}</span>
          </button>
        )}
      </div>

      {isActive && (
        <div className="w-full mb-5 p-4 rounded-3xl liquid-glass border border-cyan-500/25 shadow-lg">
          <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-2.5 uppercase tracking-wider">
            {partIdx === 0 ? t.partALabel : t.partBLabel}
          </div>
          <div className="grid grid-cols-2 gap-3 items-center">
            <div className="p-3 rounded-2xl liquid-glass-pill border border-emerald-500/30 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-mono text-xl font-black shrink-0 border border-emerald-500/40">
                {expectedId}
              </div>
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold truncate">
                  {t.nextTarget}
                </div>
                <div className="text-sm font-mono font-bold text-zinc-900 dark:text-zinc-100">
                  <span className="text-emerald-500 text-base font-black">{expectedId}</span>
                  <span className="text-zinc-400 text-xs"> ({currentStep + 1}/{currentPart.sequence.length})</span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-2xl liquid-glass-pill border border-cyan-500/30 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/40">
                <Clock className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold truncate">
                  {t.time}
                </div>
                <div className="text-base font-mono font-black text-cyan-600 dark:text-cyan-400 truncate">
                  {elapsedSec.toFixed(1)} <span className="text-xs font-normal text-zinc-400">{t.sec}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!isActive && !isBetweenParts && !isFinished && (
        <div className="w-full rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col items-center justify-center p-8 text-center shadow-md">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-500 mb-4 border border-cyan-500/20">
            <GitCommit className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">{t.title}</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-md mb-6 leading-relaxed">{t.subtitle}</p>
          <Button variant="emerald" size="lg" onClick={() => handleStart(false)} className="gap-2 cursor-pointer">
            <Play className="w-4 h-4" />
            <span>{t.startBtn}</span>
          </Button>
        </div>
      )}

      {isBetweenParts && (
        <div className="w-full rounded-3xl border border-emerald-500/30 bg-white dark:bg-zinc-900 flex flex-col items-center justify-center p-8 text-center shadow-lg">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 flex items-center justify-center text-emerald-500 mb-3">
            <CheckCircle className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-1">
            {t.partADoneTitle} ({partASecRef.current.toFixed(1)} {t.sec})
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-md mb-6">{t.partADoneDesc}</p>
          <Button variant="emerald" size="lg" onClick={handleStartPartB} className="gap-2 cursor-pointer">
            <Play className="w-4 h-4" />
            <span>{t.startPartBBtn}</span>
          </Button>
        </div>
      )}

      {isActive && (
        <div className="w-full relative h-80 sm:h-96 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl overflow-hidden mb-4">
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
                  strokeDasharray="5 3"
                />
              )
            })}
          </svg>

          {currentPart.nodes.map((node) => {
            const isConnected = connectedNodes.some((n) => n.id === node.id)
            const isWrong = wrongNodeId === node.id

            return (
              <button
                key={`${currentPart.id}-${node.id}`}
                type="button"
                data-trail-node={node.id}
                onClick={() => handleNodeClick(node)}
                style={{ left: `${node.x}%`, top: `${node.y}%` }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 w-11 h-11 sm:w-12 sm:h-12 rounded-full font-mono text-base font-extrabold flex items-center justify-center transition-all duration-150 z-10 active:scale-90 cursor-pointer ${
                  isConnected
                    ? 'bg-emerald-500 text-white shadow-md border-2 border-emerald-600'
                    : isWrong
                    ? 'bg-rose-500 text-white border-2 border-rose-600'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-2 border-zinc-300 dark:border-zinc-700 hover:border-emerald-500'
                }`}
              >
                {node.id}
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
          <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">{t.finishTitle}</h3>

          <div className="grid grid-cols-3 gap-3 max-w-md mx-auto my-6">
            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700">
              <div className="text-[11px] text-zinc-500 mb-1">Часть A</div>
              <div className="text-2xl font-black text-emerald-500 font-mono">
                {partASecRef.current.toFixed(1)} {t.sec}
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700">
              <div className="text-[11px] text-zinc-500 mb-1">Часть B</div>
              <div className="text-2xl font-black text-cyan-500 font-mono">
                {partBSecRef.current.toFixed(1)} {t.sec}
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700">
              <div className="text-[11px] text-zinc-500 mb-1">B − A</div>
              <div className="text-2xl font-black text-indigo-500 font-mono">
                {(partBSecRef.current - partASecRef.current).toFixed(1)} {t.sec}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
            <Button variant="outline" onClick={() => handleStart(true)} className="gap-2 flex-1 cursor-pointer">
              <RotateCcw className="w-4 h-4" />
              <span>{t.tryAgain}</span>
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
