import React, { useState } from 'react'
import { Grid, Play, RotateCcw, CheckCircle, Sparkles } from 'lucide-react'
import { Button } from '../ui/Button'
import type { Language } from '../../i18n'

interface PatternMatrixEngineProps {
  lang: Language
  challenge?: Record<string, unknown> | null
  onComplete: (result: { summary: string; metrics: Record<string, unknown> }) => void
}

interface PatternQuestion {
  id: string
  sequence: Array<{ shape: string; color: string }>
  options: Array<{ id: string; shape: string; color: string }>
  correct_option: string
}

// 30 Diverse Pattern Reasoning Variants
const PATTERN_LIBRARY: PatternQuestion[] = [
  // 1: Shape chain
  {
    id: 'p1',
    sequence: [
      { shape: 'circle', color: '#17A884' },
      { shape: 'square', color: '#17A884' },
      { shape: 'triangle', color: '#17A884' },
    ],
    options: [
      { id: 'opt_1', shape: 'diamond', color: '#17A884' },
      { id: 'opt_2', shape: 'circle', color: '#17A884' },
      { id: 'opt_3', shape: 'square', color: '#17A884' },
      { id: 'opt_4', shape: 'star', color: '#3b82f6' },
    ],
    correct_option: 'opt_1',
  },
  // 2: Color spectrum on diamond
  {
    id: 'p2',
    sequence: [
      { shape: 'diamond', color: '#2EC4A7' },
      { shape: 'diamond', color: '#3b82f6' },
      { shape: 'diamond', color: '#8b5cf6' },
    ],
    options: [
      { id: 'opt_1', shape: 'diamond', color: '#ec4899' },
      { id: 'opt_2', shape: 'circle', color: '#2EC4A7' },
      { id: 'opt_3', shape: 'square', color: '#8b5cf6' },
      { id: 'opt_4', shape: 'diamond', color: '#2EC4A7' },
    ],
    correct_option: 'opt_1',
  },
  // 3: Sides increment (triangle 3 -> square 4 -> pentagon 5 -> hexagon 6)
  {
    id: 'p3',
    sequence: [
      { shape: 'triangle', color: '#f59e0b' },
      { shape: 'square', color: '#10b981' },
      { shape: 'pentagon', color: '#6366f1' },
    ],
    options: [
      { id: 'opt_1', shape: 'hexagon', color: '#ec4899' },
      { id: 'opt_2', shape: 'circle', color: '#f59e0b' },
      { id: 'opt_3', shape: 'triangle', color: '#10b981' },
      { id: 'opt_4', shape: 'square', color: '#6366f1' },
    ],
    correct_option: 'opt_1',
  },
  // 4: Alternating shapes (square -> circle -> square -> circle)
  {
    id: 'p4',
    sequence: [
      { shape: 'square', color: '#3b82f6' },
      { shape: 'circle', color: '#3b82f6' },
      { shape: 'square', color: '#3b82f6' },
    ],
    options: [
      { id: 'opt_1', shape: 'circle', color: '#3b82f6' },
      { id: 'opt_2', shape: 'square', color: '#3b82f6' },
      { id: 'opt_3', shape: 'triangle', color: '#3b82f6' },
      { id: 'opt_4', shape: 'diamond', color: '#10b981' },
    ],
    correct_option: 'opt_1',
  },
  // 5: Alternating colors (green -> orange -> green -> orange)
  {
    id: 'p5',
    sequence: [
      { shape: 'triangle', color: '#10b981' },
      { shape: 'triangle', color: '#f97316' },
      { shape: 'triangle', color: '#10b981' },
    ],
    options: [
      { id: 'opt_1', shape: 'triangle', color: '#f97316' },
      { id: 'opt_2', shape: 'triangle', color: '#10b981' },
      { id: 'opt_3', shape: 'square', color: '#f97316' },
      { id: 'opt_4', shape: 'circle', color: '#6366f1' },
    ],
    correct_option: 'opt_1',
  },
  // 6: Two shapes dual cycle
  {
    id: 'p6',
    sequence: [
      { shape: 'circle', color: '#8b5cf6' },
      { shape: 'diamond', color: '#ec4899' },
      { shape: 'circle', color: '#8b5cf6' },
    ],
    options: [
      { id: 'opt_1', shape: 'diamond', color: '#ec4899' },
      { id: 'opt_2', shape: 'circle', color: '#8b5cf6' },
      { id: 'opt_3', shape: 'diamond', color: '#8b5cf6' },
      { id: 'opt_4', shape: 'square', color: '#ec4899' },
    ],
    correct_option: 'opt_1',
  },
  // 7: Sides decrement (hexagon 6 -> pentagon 5 -> square 4 -> triangle 3)
  {
    id: 'p7',
    sequence: [
      { shape: 'hexagon', color: '#6366f1' },
      { shape: 'pentagon', color: '#8b5cf6' },
      { shape: 'square', color: '#a855f7' },
    ],
    options: [
      { id: 'opt_1', shape: 'triangle', color: '#c084fc' },
      { id: 'opt_2', shape: 'hexagon', color: '#6366f1' },
      { id: 'opt_3', shape: 'circle', color: '#a855f7' },
      { id: 'opt_4', shape: 'square', color: '#8b5cf6' },
    ],
    correct_option: 'opt_1',
  },
  // 8: Double shape step (circle, circle -> square, square -> diamond, ?)
  {
    id: 'p8',
    sequence: [
      { shape: 'circle', color: '#06b6d4' },
      { shape: 'circle', color: '#06b6d4' },
      { shape: 'square', color: '#06b6d4' },
      { shape: 'square', color: '#06b6d4' },
      { shape: 'diamond', color: '#06b6d4' },
    ],
    options: [
      { id: 'opt_1', shape: 'diamond', color: '#06b6d4' },
      { id: 'opt_2', shape: 'circle', color: '#06b6d4' },
      { id: 'opt_3', shape: 'square', color: '#06b6d4' },
      { id: 'opt_4', shape: 'triangle', color: '#f59e0b' },
    ],
    correct_option: 'opt_1',
  },
  // 9: Three-color cyclical progression
  {
    id: 'p9',
    sequence: [
      { shape: 'square', color: '#ef4444' },
      { shape: 'square', color: '#10b981' },
      { shape: 'square', color: '#3b82f6' },
      { shape: 'square', color: '#ef4444' },
    ],
    options: [
      { id: 'opt_1', shape: 'square', color: '#10b981' },
      { id: 'opt_2', shape: 'square', color: '#3b82f6' },
      { id: 'opt_3', shape: 'circle', color: '#10b981' },
      { id: 'opt_4', shape: 'square', color: '#ef4444' },
    ],
    correct_option: 'opt_1',
  },
  // 10: Symmetry inversion
  {
    id: 'p10',
    sequence: [
      { shape: 'triangle', color: '#f59e0b' },
      { shape: 'diamond', color: '#3b82f6' },
      { shape: 'triangle', color: '#f59e0b' },
    ],
    options: [
      { id: 'opt_1', shape: 'diamond', color: '#3b82f6' },
      { id: 'opt_2', shape: 'triangle', color: '#f59e0b' },
      { id: 'opt_3', shape: 'circle', color: '#3b82f6' },
      { id: 'opt_4', shape: 'square', color: '#f59e0b' },
    ],
    correct_option: 'opt_1',
  },
  // 11: Color gradient warm-to-cool
  {
    id: 'p11',
    sequence: [
      { shape: 'circle', color: '#dc2626' },
      { shape: 'circle', color: '#ea580c' },
      { shape: 'circle', color: '#ca8a04' },
    ],
    options: [
      { id: 'opt_1', shape: 'circle', color: '#16a34a' },
      { id: 'opt_2', shape: 'circle', color: '#dc2626' },
      { id: 'opt_3', shape: 'square', color: '#16a34a' },
      { id: 'opt_4', shape: 'circle', color: '#ea580c' },
    ],
    correct_option: 'opt_1',
  },
  // 12: Shape sequence 4-element period
  {
    id: 'p12',
    sequence: [
      { shape: 'diamond', color: '#14b8a6' },
      { shape: 'triangle', color: '#14b8a6' },
      { shape: 'square', color: '#14b8a6' },
      { shape: 'diamond', color: '#14b8a6' },
    ],
    options: [
      { id: 'opt_1', shape: 'triangle', color: '#14b8a6' },
      { id: 'opt_2', shape: 'square', color: '#14b8a6' },
      { id: 'opt_3', shape: 'circle', color: '#14b8a6' },
      { id: 'opt_4', shape: 'hexagon', color: '#3b82f6' },
    ],
    correct_option: 'opt_1',
  },
  // 13: Inverted color alternate
  {
    id: 'p13',
    sequence: [
      { shape: 'pentagon', color: '#ec4899' },
      { shape: 'pentagon', color: '#3b82f6' },
      { shape: 'pentagon', color: '#ec4899' },
    ],
    options: [
      { id: 'opt_1', shape: 'pentagon', color: '#3b82f6' },
      { id: 'opt_2', shape: 'pentagon', color: '#ec4899' },
      { id: 'opt_3', shape: 'circle', color: '#3b82f6' },
      { id: 'opt_4', shape: 'hexagon', color: '#ec4899' },
    ],
    correct_option: 'opt_1',
  },
  // 14: Dual shape and color progression
  {
    id: 'p14',
    sequence: [
      { shape: 'circle', color: '#10b981' },
      { shape: 'square', color: '#06b6d4' },
      { shape: 'triangle', color: '#6366f1' },
    ],
    options: [
      { id: 'opt_1', shape: 'diamond', color: '#a855f7' },
      { id: 'opt_2', shape: 'circle', color: '#a855f7' },
      { id: 'opt_3', shape: 'diamond', color: '#10b981' },
      { id: 'opt_4', shape: 'square', color: '#6366f1' },
    ],
    correct_option: 'opt_1',
  },
  // 15: Mirror sandwich (A B C B A)
  {
    id: 'p15',
    sequence: [
      { shape: 'square', color: '#f59e0b' },
      { shape: 'circle', color: '#3b82f6' },
      { shape: 'diamond', color: '#10b981' },
      { shape: 'circle', color: '#3b82f6' },
    ],
    options: [
      { id: 'opt_1', shape: 'square', color: '#f59e0b' },
      { id: 'opt_2', shape: 'circle', color: '#3b82f6' },
      { id: 'opt_3', shape: 'diamond', color: '#10b981' },
      { id: 'opt_4', shape: 'triangle', color: '#f59e0b' },
    ],
    correct_option: 'opt_1',
  },
]

// Pick 10 random questions and shuffle their options order so correct answer position is random
function pick10ShuffledPatternQuestions(): PatternQuestion[] {
  const pool = [...PATTERN_LIBRARY]
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }

  const selected = pool.slice(0, 10).map((q) => {
    const shuffledOptions = [...q.options]
    for (let i = shuffledOptions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]]
    }
    return {
      ...q,
      options: shuffledOptions,
    }
  })

  return selected
}

export const PatternMatrixEngine: React.FC<PatternMatrixEngineProps> = ({
  lang,
  challenge,
  onComplete,
}) => {
  const [questions, setQuestions] = useState<PatternQuestion[]>(() => {
    if (challenge && Array.isArray(challenge.questions) && challenge.questions.length > 0) {
      return challenge.questions as PatternQuestion[]
    }
    return pick10ShuffledPatternQuestions()
  })
  const [currentIdx, setCurrentIdx] = useState(0)
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({})
  const [isActive, setIsActive] = useState(false)
  const [isFinished, setIsFinished] = useState(false)

  const currentQ = questions[currentIdx]

  const t = {
    ru: {
      title: 'Продолжи последовательность',
      subtitle: 'Определите скрытое правило изменения геометрических фигур и выберите правильный недостающий элемент.',
      startBtn: 'Начать тест логики (10 заданий)',
      questionOf: 'Задание',
      of: 'из',
      instruction: 'Какая фигура логически должна продолжить ряд?',
      tryAgain: 'Пройти снова (10 новых заданий)',
      saveBtn: 'Завершить и сохранить',
      finishTitle: 'Тест закономерностей завершен!',
    },
    tj: {
      title: 'Пайдарпайиро идома деҳ',
      subtitle: 'Қоидаи тағйирёбии шаклҳоро муайян кунед ва унсури дурусти намерасидаро интихоб намоед.',
      startBtn: 'Оғози санҷиши мантиқ (10 супориш)',
      questionOf: 'Супориш',
      of: 'аз',
      instruction: 'Кадом шакл бояд ин қаторро мантиқан давом диҳад?',
      tryAgain: 'Аз нав гузаштан (10 супориши нав)',
      saveBtn: 'Анҷом ва сабт кардан',
      finishTitle: 'Санҷиши қонуниятҳо анҷом ёфт!',
    },
    en: {
      title: 'Pattern Matrix Completion',
      subtitle: 'Determine the underlying rule of shape transformation and select the missing element.',
      startBtn: 'Start Pattern Test (10 Tasks)',
      questionOf: 'Task',
      of: 'of',
      instruction: 'Which element logically completes the pattern?',
      tryAgain: 'Retry (10 New Tasks)',
      saveBtn: 'Complete & Save',
      finishTitle: 'Pattern test completed!',
    },
  }[lang]

  const handleStart = () => {
    setQuestions(pick10ShuffledPatternQuestions())
    setCurrentIdx(0)
    setUserAnswers({})
    setIsFinished(false)
    setIsActive(true)
  }

  const renderShape = (shape: string, color: string) => {
    switch (shape) {
      case 'circle':
        return <div className="w-8 h-8 rounded-full border-2" style={{ backgroundColor: color, borderColor: color }} />
      case 'square':
        return <div className="w-8 h-8 rounded-md border-2" style={{ backgroundColor: color, borderColor: color }} />
      case 'triangle':
        return (
          <div
            className="w-0 h-0 border-l-[16px] border-l-transparent border-r-[16px] border-r-transparent border-b-[28px]"
            style={{ borderBottomColor: color }}
          />
        )
      case 'diamond':
        return <div className="w-7 h-7 rotate-45 rounded-sm border-2" style={{ backgroundColor: color, borderColor: color }} />
      case 'hexagon':
      case 'pentagon':
        return <div className="w-8 h-8 rounded-xl border-2 rotate-12" style={{ backgroundColor: color, borderColor: color }} />
      default:
        return <div className="w-8 h-8 rounded-full border-2" style={{ backgroundColor: color, borderColor: color }} />
    }
  }

  const handleSelectOption = (optId: string) => {
    const nextAnswers = { ...userAnswers, [currentQ.id]: optId }
    setUserAnswers(nextAnswers)

    if (currentIdx + 1 < questions.length) {
      setCurrentIdx((i) => i + 1)
    } else {
      setIsFinished(true)
    }
  }

  const handleSave = () => {
    let correct = 0
    questions.forEach((q) => {
      if (userAnswers[q.id] === q.correct_option) {
        correct += 1
      }
    })
    const total = questions.length
    const accuracy = Math.round((correct / Math.max(1, total)) * 100)

    onComplete({
      summary: `${t.finishTitle} (${correct}/${total} верно, ${accuracy}%)`,
      metrics: {
        correct_answers: correct,
        total_questions: total,
        accuracy_pct: accuracy,
      },
    })
  }

  return (
    <div className="space-y-6 max-w-xl mx-auto text-center">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100 flex items-center justify-center gap-2">
          <Grid className="w-6 h-6 text-emerald-500" />
          <span>{t.title}</span>
        </h2>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-md mx-auto">
          {t.subtitle}
        </p>
      </div>

      {!isActive ? (
        <div className="p-8 rounded-3xl liquid-glass border border-emerald-500/20 text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 text-emerald-500 mx-auto flex items-center justify-center border border-emerald-500/30">
            <Sparkles className="w-8 h-8" />
          </div>
          <Button size="lg" variant="emerald" onClick={handleStart} className="gap-2 px-8 py-3.5 text-base font-bold shadow-lg shadow-emerald-600/30">
            <Play className="w-5 h-5 fill-current" />
            <span>{t.startBtn}</span>
          </Button>
        </div>
      ) : !isFinished && currentQ ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-500 px-2">
            <span>{t.questionOf} {currentIdx + 1} {t.of} {questions.length}</span>
            <span className="text-emerald-500 font-bold">Прогресс: {Math.round(((currentIdx + 1) / questions.length) * 100)}%</span>
          </div>

          {/* Sequence Display Box */}
          <div className="p-6 rounded-3xl liquid-glass border border-emerald-500/20 space-y-4">
            <div className="text-xs text-zinc-400 font-medium">{t.instruction}</div>
            <div className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
              {currentQ.sequence.map((item, idx) => (
                <div
                  key={idx}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 flex items-center justify-center shadow-inner"
                >
                  {renderShape(item.shape, item.color)}
                </div>
              ))}
              {/* Question mark target */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-emerald-500/10 border-2 border-dashed border-emerald-500/50 flex items-center justify-center text-emerald-500 font-black text-2xl animate-pulse">
                ?
              </div>
            </div>
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {currentQ.options.map((opt) => (
              <button
                key={opt.id}
                onClick={() => handleSelectOption(opt.id)}
                className="p-4 rounded-2xl liquid-glass border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/60 flex flex-col items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-md group cursor-pointer"
              >
                <div className="w-12 h-12 flex items-center justify-center">
                  {renderShape(opt.shape, opt.color)}
                </div>
                <span className="text-[10px] font-mono text-zinc-400 group-hover:text-emerald-500">Выбрать</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-3xl liquid-glass border border-emerald-500/30 space-y-4 animate-in fade-in duration-300">
          <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
          <div className="text-base font-bold text-zinc-900 dark:text-zinc-100">{t.finishTitle}</div>
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
    </div>
  )
}
