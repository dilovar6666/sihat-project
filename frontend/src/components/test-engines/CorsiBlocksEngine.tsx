import React, { useState, useEffect, useRef } from 'react'
import { Brain, Award, CheckCircle, RotateCcw, Play, Sparkles } from 'lucide-react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import type { Language } from '../../i18n'

interface CorsiBlocksEngineProps {
  lang: Language
  onComplete: (result: { summary: string; metrics: Record<string, unknown> }) => void
}

export const CorsiBlocksEngine: React.FC<CorsiBlocksEngineProps> = ({ lang, onComplete }) => {
  const [sequenceLength, setSequenceLength] = useState(3)
  const [sequence, setSequence] = useState<number[]>([])
  const [userSequence, setUserSequence] = useState<number[]>([])
  const [activeHighlightBlock, setActiveHighlightBlock] = useState<number | null>(null)
  const [isShowingSequence, setIsShowingSequence] = useState(false)
  const [maxSpanAchieved, setMaxSpanAchieved] = useState(0)
  const [strikes, setStrikes] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  const timeoutRef = useRef<number | null>(null)

  const t = {
    ru: {
      title: 'Пространственная память (Блоки Корси)',
      subtitle: 'Запомните и повторите последовательность загорающихся кубиков.',
      standard: 'Corsi Block-Tapping Test (CBTT)',
      instructionWatch: 'Внимание: запоминайте последовательность вспышек...',
      instructionClick: 'Ваш черёд: повторите порядок нажатием на блоки!',
      spanLevel: 'Длина цепочки:',
      blocks: 'блоков',
      strikes: 'Ошибок:',
      startBtn: 'Начать тест памяти',
      finishTitle: 'Тест пространственной памяти завершен',
      spanResult: 'Максимальный объем пространственной памяти (Span)',
      normOptimal: 'Высокий объем (Span ≥ 6)',
      normGood: 'Нормальный объем (Span 5)',
      normSub: 'Сниженный объем (Span ≤ 4)',
      finishBtn: 'Завершить и сохранить',
      tryAgain: 'Попробовать снова',
    },
    tj: {
      title: 'Хотираи фазоӣ (Блокҳои Корси)',
      subtitle: 'Пайдарпайии фурӯзон шудани блокҳоро ба хотир гиред ва такрор намоед.',
      standard: 'Corsi Block-Tapping Test (CBTT)',
      instructionWatch: 'Диққат: пайдарпайиро дар хотир гиред...',
      instructionClick: 'Навбати шумо: блокҳоро бо ҳамон тартиб пахш кунед!',
      spanLevel: 'Дарозии занҷир:',
      blocks: 'блок',
      strikes: 'Хатогиҳо:',
      startBtn: 'Оғози санҷиши хотира',
      finishTitle: 'Санҷиши хотираи фазоӣ анҷом ёфт',
      spanResult: 'Ҳаҷми ниҳоии хотираи фазоӣ (Span)',
      normOptimal: 'Хотираи фазоии баланд (Span ≥ 6)',
      normGood: 'Хотираи муътадил (Span 5)',
      normSub: 'Хотираи пастшуда (Span ≤ 4)',
      finishBtn: 'Анҷом ва сабт кардан',
      tryAgain: 'Аз нав гузаштан',
    },
    en: {
      title: 'Spatial Working Memory (Corsi Blocks)',
      subtitle: 'Observe and replicate the sequence of illuminated spatial blocks.',
      standard: 'Corsi Block-Tapping Paradigm',
      instructionWatch: 'Observe carefully: memorize the spatial sequence...',
      instructionClick: 'Your turn: click the blocks in the exact sequential order!',
      spanLevel: 'Sequence length:',
      blocks: 'blocks',
      strikes: 'Strikes:',
      startBtn: 'Start Memory Screening',
      finishTitle: 'Spatial Evaluation Completed',
      spanResult: 'Maximum Spatial Span Score',
      normOptimal: 'Superior Spatial Span (Span ≥ 6)',
      normGood: 'Normative Span (Span 5)',
      normSub: 'Reduced Span (Span ≤ 4)',
      finishBtn: 'Complete & Save',
      tryAgain: 'Retry',
    },
  }[lang]

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const playSequence = (seq: number[]) => {
    setIsShowingSequence(true)
    setUserSequence([])

    let step = 0
    const interval = setInterval(() => {
      if (step < seq.length) {
        setActiveHighlightBlock(seq[step])
        setTimeout(() => {
          setActiveHighlightBlock(null)
        }, 550)
        step++
      } else {
        clearInterval(interval)
        setIsShowingSequence(false)
      }
    }, 850)
  }

  const startLevel = (len: number) => {
    const newSeq: number[] = []
    for (let i = 0; i < len; i++) {
      let nextBlock: number
      do {
        nextBlock = Math.floor(Math.random() * 9)
      } while (newSeq.length > 0 && newSeq[newSeq.length - 1] === nextBlock)
      newSeq.push(nextBlock)
    }
    setSequence(newSeq)
    playSequence(newSeq)
  }

  const handleStart = () => {
    setSequenceLength(3)
    setMaxSpanAchieved(0)
    setStrikes(0)
    setIsFinished(false)
    setIsActive(true)
    startLevel(3)
  }

  const handleBlockClick = (blockIdx: number) => {
    if (isShowingSequence || isFinished || !isActive) return

    const nextUserSeq = [...userSequence, blockIdx]
    setUserSequence(nextUserSeq)

    // Flash block briefly on user touch
    setActiveHighlightBlock(blockIdx)
    setTimeout(() => setActiveHighlightBlock(null), 250)

    const expectedBlock = sequence[userSequence.length]
    if (blockIdx !== expectedBlock) {
      // Mistake!
      const nextStrikes = strikes + 1
      setStrikes(nextStrikes)
      if (nextStrikes >= 2) {
        setIsActive(false)
        setIsFinished(true)
      } else {
        // Retry current level
        setTimeout(() => startLevel(sequenceLength), 800)
      }
      return
    }

    // If completed full sequence correctly
    if (nextUserSeq.length === sequence.length) {
      const nextSpan = sequenceLength
      setMaxSpanAchieved(nextSpan)
      const nextLen = sequenceLength + 1
      setSequenceLength(nextLen)
      setTimeout(() => startLevel(nextLen), 1000)
    }
  }

  const handleFinish = () => {
    let category = t.normGood
    if (maxSpanAchieved >= 6) category = t.normOptimal
    else if (maxSpanAchieved <= 4) category = t.normSub

    onComplete({
      summary: `${t.spanResult}: ${maxSpanAchieved} ${t.blocks} (${category}).`,
      metrics: {
        max_spatial_span: maxSpanAchieved,
        strikes_count: strikes,
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
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-zinc-500">
              {t.spanLevel} <span className="font-bold text-cyan-500">{sequenceLength}</span>
            </span>
            <span className="text-zinc-500">
              {t.strikes} <span className="font-bold text-rose-500">{strikes}/2</span>
            </span>
          </div>
        )}
      </div>

      {!isActive && !isFinished && (
        <div className="w-full rounded-3xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-100/50 dark:bg-zinc-900/40 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-500 mb-4">
            <Sparkles className="w-8 h-8" />
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
          <div className="mb-4 text-xs font-medium px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
            {isShowingSequence ? t.instructionWatch : t.instructionClick}
          </div>

          {/* 3x3 Spatial Grid */}
          <div className="w-full max-w-sm aspect-square grid grid-cols-3 gap-3 p-4 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl mb-6">
            {Array.from({ length: 9 }).map((_, idx) => {
              const isLit = activeHighlightBlock === idx
              return (
                <button
                  key={idx}
                  onClick={() => handleBlockClick(idx)}
                  className={`rounded-2xl transition-all duration-150 transform active:scale-90 ${
                    isLit
                      ? 'bg-cyan-400 ring-8 ring-cyan-400/40 shadow-2xl scale-105 z-10'
                      : 'bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200/60 dark:border-zinc-700/60'
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

          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/80 max-w-xs mx-auto my-6">
            <div className="text-xs text-zinc-500 mb-1">{t.spanResult}</div>
            <div className="text-4xl font-black text-cyan-500 font-mono">
              {maxSpanAchieved} <span className="text-base font-normal text-zinc-400">{t.blocks}</span>
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
