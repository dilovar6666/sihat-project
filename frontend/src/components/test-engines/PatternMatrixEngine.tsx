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

const DEFAULT_QUESTIONS: PatternQuestion[] = [
  {
    id: 'q1',
    sequence: [
      { shape: 'circle', color: '#17A884' },
      { shape: 'square', color: '#17A884' },
      { shape: 'triangle', color: '#17A884' },
    ],
    options: [
      { id: 'opt_a', shape: 'diamond', color: '#17A884' },
      { id: 'opt_b', shape: 'circle', color: '#17A884' },
      { id: 'opt_c', shape: 'square', color: '#17A884' },
      { id: 'opt_d', shape: 'star', color: '#3b82f6' },
    ],
    correct_option: 'opt_a',
  },
  {
    id: 'q2',
    sequence: [
      { shape: 'diamond', color: '#2EC4A7' },
      { shape: 'diamond', color: '#3b82f6' },
      { shape: 'diamond', color: '#8b5cf6' },
    ],
    options: [
      { id: 'opt_a', shape: 'diamond', color: '#ec4899' },
      { id: 'opt_b', shape: 'circle', color: '#2EC4A7' },
      { id: 'opt_c', shape: 'square', color: '#8b5cf6' },
      { id: 'opt_d', shape: 'diamond', color: '#2EC4A7' },
    ],
    correct_option: 'opt_a',
  },
  {
    id: 'q3',
    sequence: [
      { shape: 'triangle', color: '#f59e0b' },
      { shape: 'square', color: '#10b981' },
      { shape: 'pentagon', color: '#6366f1' },
    ],
    options: [
      { id: 'opt_a', shape: 'hexagon', color: '#ec4899' },
      { id: 'opt_b', shape: 'circle', color: '#f59e0b' },
      { id: 'opt_c', shape: 'triangle', color: '#10b981' },
      { id: 'opt_d', shape: 'square', color: '#6366f1' },
    ],
    correct_option: 'opt_a',
  },
]

export const PatternMatrixEngine: React.FC<PatternMatrixEngineProps> = ({
  lang,
  challenge,
  onComplete,
}) => {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({})
  const [isActive, setIsActive] = useState(false)
  const [isFinished, setIsFinished] = useState(false)

  const questions: PatternQuestion[] =
    challenge && Array.isArray(challenge.questions) && challenge.questions.length > 0
      ? (challenge.questions as PatternQuestion[])
      : DEFAULT_QUESTIONS

  const currentQ = questions[currentIdx]

  const t = {
    ru: {
      title: 'Продолжи последовательность',
      subtitle: 'Определите скрытое правило изменения геометрических фигур и выберите недостающий элемент.',
      startBtn: 'Начать тест логики',
      questionOf: 'Задание',
      of: 'из',
      instruction: 'Какая фигура должна логически продолжить ряд?',
      tryAgain: 'Пройти снова',
      saveBtn: 'Завершить и сохранить',
      finishTitle: 'Тест закономерностей завершен!',
    },
    tj: {
      title: 'Пайдарпайиро идома деҳ',
      subtitle: 'Қоидаи тағйирёбии шаклҳоро муайян кунед ва унсури намерасидаро интихоб намоед.',
      startBtn: 'Оғози санҷиши мантиқ',
      questionOf: 'Супориш',
      of: 'аз',
      instruction: 'Кадом шакл бояд ин қаторро давом диҳад?',
      tryAgain: 'Аз нав гузаштан',
      saveBtn: 'Анҷом ва сабт кардан',
      finishTitle: 'Санҷиши қонуниятҳо анҷом ёфт!',
    },
    en: {
      title: 'Pattern Matrix Completion',
      subtitle: 'Determine the geometric rule of change and select the missing element.',
      startBtn: 'Start Pattern Test',
      questionOf: 'Question',
      of: 'of',
      instruction: 'Which element logically completes the pattern?',
      tryAgain: 'Try Again',
      saveBtn: 'Complete and Save',
      finishTitle: 'Pattern test completed!',
    },
  }[lang]

  const handleStart = () => {
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
                className="p-4 rounded-2xl liquid-glass border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/60 flex flex-col items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-md group"
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
