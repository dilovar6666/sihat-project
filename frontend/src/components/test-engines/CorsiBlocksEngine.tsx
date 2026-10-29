import React, { useState, useEffect, useRef } from 'react'
import { Brain, Award, CheckCircle, RotateCcw, Play, Sparkles } from 'lucide-react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { noAdjacentRepeats, prefersReducedMotion, type InteractiveEngineProps } from './engineTypes'

interface CorsiBlock {
  id: number
  x: number
  y: number
}

interface CorsiTrial {
  id: string
  length: number
  sequence: number[]
}

function buildFallbackCorsi(): { blocks: CorsiBlock[]; trials: CorsiTrial[] } {
  const blocks: CorsiBlock[] = []
  for (let idx = 0; idx < 9; idx++) {
    const c = idx % 3
    const r = Math.floor(idx / 3)
    blocks.push({
      id: idx,
      x: Math.round((16 + c * 34 + (Math.random() * 10 - 5)) * 10) / 10,
      y: Math.round((16 + r * 34 + (Math.random() * 10 - 5)) * 10) / 10,
    })
  }
  const trials: CorsiTrial[] = []
  const pool = [0, 1, 2, 3, 4, 5, 6, 7, 8]
  for (let length = 3; length <= 9; length++) {
    for (const n of [1, 2]) {
      trials.push({
        id: `${length}-${n}`,
        length,
        sequence: noAdjacentRepeats(length, pool),
      })
    }
  }
  return { blocks, trials }
}

export const CorsiBlocksEngine: React.FC<InteractiveEngineProps> = ({
  lang,
  challenge,
  onComplete,
  onRequestNewTask,
}) => {
  const [task, setTask] = useState<{ blocks: CorsiBlock[]; trials: CorsiTrial[] }>(() =>
    Array.isArray(challenge?.blocks) && Array.isArray(challenge?.trials)
      ? { blocks: challenge.blocks as CorsiBlock[], trials: challenge.trials as CorsiTrial[] }
      : buildFallbackCorsi()
  )
  const [trialIndex, setTrialIndex] = useState(0)
  const [userSequence, setUserSequence] = useState<number[]>([])
  const [activeHighlightBlock, setActiveHighlightBlock] = useState<number | null>(null)
  const [isShowingSequence, setIsShowingSequence] = useState(false)
  const [maxSpanAchieved, setMaxSpanAchieved] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const [isFinished, setIsFinished] = useState(false)

  const timersRef = useRef<number[]>([])
  const responsesRef = useRef<Array<{ id: string; taps: number[] }>>([])
  const byLengthPassedRef = useRef<Record<number, boolean[]>>({})
  const usedChallengeRef = useRef(false)

  const clearTimers = () => {
    timersRef.current.forEach((id) => window.clearTimeout(id))
    timersRef.current = []
  }

  useEffect(() => {
    if (Array.isArray(challenge?.blocks) && Array.isArray(challenge?.trials) && !isActive && !isFinished) {
      setTask({ blocks: challenge.blocks as CorsiBlock[], trials: challenge.trials as CorsiTrial[] })
      usedChallengeRef.current = false
    }
  }, [challenge, isActive, isFinished])

  useEffect(() => {
    return () => clearTimers()
  }, [])

  const t = {
    ru: {
      title: 'Блоки Корси (Пространственная память)',
      subtitle: 'Запомните порядок загорающихся блоков на поле и повторите его нажатием. На каждой длине даётся по 2 попытки.',
      standard: 'Corsi Block-Tapping • Зрительно-пространственная память',
      instructionWatch: 'Внимание: запоминайте последовательность вспышек...',
      instructionClick: 'Ваш черёд: нажмите блоки в том же порядке',
      spanLevel: 'Длина цепочки:',
      blocks: 'блоков',
      trialLabel: 'Попытка:',
      startBtn: 'Начать упражнение',
      finishTitle: 'Блоки Корси завершены',
      spanResult: 'Максимальный объём (Span)',
      finishBtn: 'Показать подробный отчёт',
      tryAgain: 'Новый вариант',
    },
    tj: {
      title: 'Блокҳои Корси (Хотираи фазоӣ)',
      subtitle: 'Тартиби фурӯзон шудани блокҳоро дар хотир гиред ва бо пахш кардан такрор намоед.',
      standard: 'Corsi Block-Tapping • Хотираи фазоии корӣ',
      instructionWatch: 'Диққат: пайдарпайиро дар хотир гиред...',
      instructionClick: 'Навбати шумо: блокҳоро бо ҳамон тартиб пахш кунед',
      spanLevel: 'Дарозии занҷир:',
      blocks: 'блок',
      trialLabel: 'Кӯшиш:',
      startBtn: 'Оғози машқ',
      finishTitle: 'Блокҳои Корси анҷом ёфт',
      spanResult: 'Ҳаҷми ниҳоии хотираи фазоӣ (Span)',
      finishBtn: 'Дидани ҳисоботи муфассал',
      tryAgain: 'Варианти нав',
    },
    en: {
      title: 'Corsi Blocks (Spatial Memory)',
      subtitle: 'Watch the blocks light up in sequence and tap them in the exact same order. Two trials are given at each sequence length.',
      standard: 'Corsi Block-Tapping • Visuospatial Working Memory',
      instructionWatch: 'Watch carefully: memorize the block sequence...',
      instructionClick: 'Your turn: tap the blocks in the exact order',
      spanLevel: 'Sequence length:',
      blocks: 'blocks',
      trialLabel: 'Trial:',
      startBtn: 'Start Exercise',
      finishTitle: 'Corsi Blocks Completed',
      spanResult: 'Maximum Spatial Span',
      finishBtn: 'View Detailed Report',
      tryAgain: 'New Variant',
    },
  }[lang]

  const playTrial = (trial: CorsiTrial) => {
    clearTimers()
    setIsShowingSequence(true)
    setUserSequence([])
    setActiveHighlightBlock(null)

    const reduced = prefersReducedMotion()
    const flashMs = reduced ? 450 : 550
    const stepMs = reduced ? 650 : 800

    trial.sequence.forEach((blockId, idx) => {
      const t1 = window.setTimeout(() => {
        setActiveHighlightBlock(blockId)
      }, 300 + idx * stepMs)
      const t2 = window.setTimeout(() => {
        setActiveHighlightBlock(null)
      }, 300 + idx * stepMs + flashMs)
      timersRef.current.push(t1, t2)
    })

    const doneTimer = window.setTimeout(() => {
      setActiveHighlightBlock(null)
      setIsShowingSequence(false)
    }, 350 + trial.sequence.length * stepMs)
    timersRef.current.push(doneTimer)
  }

  const handleStart = (requestFresh = false) => {
    if (requestFresh && onRequestNewTask) {
      onRequestNewTask()
    }
    let nextTask = task
    if (!usedChallengeRef.current && Array.isArray(challenge?.blocks) && Array.isArray(challenge?.trials)) {
      nextTask = { blocks: challenge.blocks as CorsiBlock[], trials: challenge.trials as CorsiTrial[] }
      setTask(nextTask)
      usedChallengeRef.current = true
    } else {
      nextTask = buildFallbackCorsi()
      setTask(nextTask)
    }

    responsesRef.current = []
    byLengthPassedRef.current = {}
    setTrialIndex(0)
    setMaxSpanAchieved(0)
    setIsFinished(false)
    setIsActive(true)
    playTrial(nextTask.trials[0])
  }

  const currentTrial = task.trials[trialIndex]

  const advanceOrFinish = (nextIdx: number, activeTask: { blocks: CorsiBlock[]; trials: CorsiTrial[] }) => {
    if (nextIdx >= activeTask.trials.length) {
      setIsActive(false)
      setIsFinished(true)
      return
    }
    const nextTrial = activeTask.trials[nextIdx]
    const prevLengthResults = byLengthPassedRef.current[nextTrial.length - 1]
    if (
      nextTrial.length > 3 &&
      (! byLengthPassedRef.current[nextTrial.length] || byLengthPassedRef.current[nextTrial.length].length === 0) &&
      prevLengthResults &&
      prevLengthResults.length >= 2 &&
      !prevLengthResults.some(Boolean)
    ) {
      setIsActive(false)
      setIsFinished(true)
      return
    }
    setTrialIndex(nextIdx)
    const tId = window.setTimeout(() => playTrial(nextTrial), 550)
    timersRef.current.push(tId)
  }

  const handleBlockClick = (blockId: number) => {
    if (isShowingSequence || isFinished || !isActive || !currentTrial) return

    const nextUserSeq = [...userSequence, blockId]
    setUserSequence(nextUserSeq)
    setActiveHighlightBlock(blockId)
    const flashId = window.setTimeout(() => setActiveHighlightBlock(null), 200)
    timersRef.current.push(flashId)

    const clickedStep = nextUserSeq.length - 1
    const isStepCorrect = blockId === currentTrial.sequence[clickedStep]

    if (!isStepCorrect || nextUserSeq.length === currentTrial.sequence.length) {
      const fullOk =
        nextUserSeq.length === currentTrial.sequence.length &&
        nextUserSeq.every((val, i) => val === currentTrial.sequence[i])

      responsesRef.current.push({
        id: currentTrial.id,
        taps: nextUserSeq,
      })

      const arr = byLengthPassedRef.current[currentTrial.length] || []
      arr.push(fullOk)
      byLengthPassedRef.current[currentTrial.length] = arr

      if (fullOk) {
        setMaxSpanAchieved((prev) => Math.max(prev, currentTrial.length))
      }

      advanceOrFinish(trialIndex + 1, task)
    }
  }

  const handleFinish = () => {
    const responses = responsesRef.current
    const attempted = responses.length
    const byLen = byLengthPassedRef.current
    const series = Object.entries(byLen).map(([lenStr, arr]) => ({
      length: Number(lenStr),
      passed: arr.filter(Boolean).length,
      of: arr.length,
    }))
    const passed = series.reduce((acc, s) => acc + s.passed, 0)
    const accuracyPct = attempted > 0 ? Number(((passed / attempted) * 100).toFixed(1)) : 0

    onComplete({
      summary: `${t.spanResult}: ${maxSpanAchieved} ${t.blocks} (${passed}/${attempted})`,
      metrics: {
        version: 2,
        engine: 'corsi',
        metrics: {
          max_span: maxSpanAchieved,
          trials_passed: passed,
          trials_attempted: attempted,
          accuracy_pct: accuracyPct,
        },
        series: {
          by_length: series,
        },
      },
      telemetry: {
        responses,
      },
    })
  }

  return (
    <div className="flex flex-col items-center max-w-xl mx-auto w-full select-none">
      <div className="w-full flex items-center justify-between gap-2 mb-4">
        <Badge variant="cyan" className="gap-1.5 py-1.5 px-3">
          <Brain className="w-3.5 h-3.5 text-cyan-500" />
          <span className="truncate">{t.standard}</span>
        </Badge>
        {isActive && currentTrial && (
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-zinc-500">
              {t.spanLevel} <strong className="text-cyan-500">{currentTrial.length}</strong>
            </span>
            <span className="text-zinc-500">
              {t.trialLabel} <strong className="text-emerald-500">{currentTrial.id}</strong>
            </span>
          </div>
        )}
      </div>

      {!isActive && !isFinished && (
        <div className="w-full rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col items-center justify-center p-8 text-center shadow-md">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-500 mb-4 border border-cyan-500/20">
            <Sparkles className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">{t.title}</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-md mb-6 leading-relaxed">{t.subtitle}</p>
          <Button variant="emerald" size="lg" onClick={() => handleStart(false)} className="gap-2 cursor-pointer">
            <Play className="w-4 h-4" />
            <span>{t.startBtn}</span>
          </Button>
        </div>
      )}

      {isActive && currentTrial && (
        <div className="w-full flex flex-col items-center">
          <div className="mb-4 text-xs font-semibold px-4 py-2 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700">
            {isShowingSequence ? t.instructionWatch : `${t.instructionClick} (${userSequence.length}/${currentTrial.length})`}
          </div>

          <div className="w-full max-w-md aspect-square relative rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl mb-6 overflow-hidden">
            {task.blocks.map((block) => {
              const isLit = activeHighlightBlock === block.id
              return (
                <button
                  key={block.id}
                  type="button"
                  data-corsi-block={block.id}
                  disabled={isShowingSequence}
                  onClick={() => handleBlockClick(block.id)}
                  style={{ left: `${block.x}%`, top: `${block.y}%` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl transition-all duration-150 cursor-pointer ${
                    isLit
                      ? 'bg-emerald-400 ring-8 ring-emerald-400/35 shadow-xl scale-105 z-10 border-2 border-white'
                      : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border-2 border-zinc-300 dark:border-zinc-700 active:scale-95'
                  }`}
                />
              )
            })}
          </div>
        </div>
      )}

      {isFinished && (
        <div className="w-full rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 text-center shadow-xl">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-4">
            <Award className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">{t.finishTitle}</h3>

          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700 max-w-xs mx-auto my-6">
            <div className="text-xs text-zinc-500 mb-1">{t.spanResult}</div>
            <div className="text-4xl font-black text-cyan-500 font-mono">
              {maxSpanAchieved} <span className="text-base font-normal text-zinc-400">{t.blocks}</span>
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
