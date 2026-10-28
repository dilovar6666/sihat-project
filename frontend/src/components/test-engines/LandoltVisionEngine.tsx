import React, { useState, useEffect, useCallback } from 'react'
import { Eye, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, ArrowUpLeft, ArrowUpRight, ArrowDownLeft, ArrowDownRight, Award, CheckCircle, RotateCcw, Play } from 'lucide-react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import type { Language } from '../../i18n'

interface LandoltVisionEngineProps {
  lang: Language
  onComplete: (result: { summary: string; metrics: Record<string, unknown> }) => void
}

const ORIENTATIONS = [
  { id: 'up', angle: 270, label: 'Вверх / Боло' },
  { id: 'up-right', angle: 315, label: 'Вверх-вправо' },
  { id: 'right', angle: 0, label: 'Вправо / Рост' },
  { id: 'down-right', angle: 45, label: 'Вниз-вправо' },
  { id: 'down', angle: 90, label: 'Вниз / Поён' },
  { id: 'down-left', angle: 135, label: 'Вниз-влево' },
  { id: 'left', angle: 180, label: 'Влево / Чап' },
  { id: 'up-left', angle: 225, label: 'Вверх-влево' },
]

const ACUITY_LEVELS = [
  { acuity: 0.2, ringSizePx: 120, strokePx: 24, gapPx: 24 },
  { acuity: 0.3, ringSizePx: 96, strokePx: 19, gapPx: 19 },
  { acuity: 0.4, ringSizePx: 80, strokePx: 16, gapPx: 16 },
  { acuity: 0.5, ringSizePx: 66, strokePx: 13, gapPx: 13 },
  { acuity: 0.6, ringSizePx: 56, strokePx: 11, gapPx: 11 },
  { acuity: 0.7, ringSizePx: 48, strokePx: 9.6, gapPx: 9.6 },
  { acuity: 0.8, ringSizePx: 40, strokePx: 8, gapPx: 8 },
  { acuity: 0.9, ringSizePx: 33, strokePx: 6.6, gapPx: 6.6 },
  { acuity: 1.0, ringSizePx: 28, strokePx: 5.6, gapPx: 5.6 },
  { acuity: 1.25, ringSizePx: 20, strokePx: 4, gapPx: 4 },
]

export const LandoltVisionEngine: React.FC<LandoltVisionEngineProps> = ({ lang, onComplete }) => {
  const [levelIdx, setLevelIdx] = useState(0)
  const [currentAngle, setCurrentAngle] = useState(0)
  const [currentOrientationId, setCurrentOrientationId] = useState('right')
  const [scoreAcuity, setScoreAcuity] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const [isFinished, setIsFinished] = useState(false)

  const t = {
    ru: {
      title: 'Острота зрения',
      subtitle: 'Стандартизированный оптотип ISO 8596. Определите, в какую сторону направлен разрыв в кольце.',
      standard: 'ISO 8596 / Оптотипы Ландольта C',
      distanceWarning: 'Сядьте на расстоянии 50–70 см от экрана при нормальном освещении.',
      startBtn: 'Начать проверку зрения (10 уровней)',
      level: 'Уровень',
      acuity: 'Острота',
      question: 'Куда направлен разрыв кольца?',
      finishTitle: 'Проверка завершена',
      acuityResult: 'Итоговая острота (Visus)',
      correctAnswers: 'Верных ответов',
      finishBtn: 'Завершить и сохранить',
      tryAgain: 'Повторить проверку (10 новых случайных направлений)',
      statusOpt: '100% норма (Visus ≥ 1.0)',
      statusSub: 'Умеренное снижение (Visus 0.6–0.8)',
      statusLow: 'Рекомендуется визит к офтальмологу (Visus ≤ 0.4)',
    },
    tj: {
      title: 'Тезиши биноӣ',
      subtitle: 'Оптотипи стандартии ISO 8596. Самти шикофии ҳалқаро муайян кунед.',
      standard: 'ISO 8596 / Оптотипҳои Ландолт C',
      distanceWarning: 'Дар масофаи 50–70 см аз экран шинед ва равшании муътадилро интихоб кунед.',
      startBtn: 'Оғози санҷиши биноӣ',
      level: 'Сатҳ',
      acuity: 'Тезиш',
      question: 'Шикофии ҳалқа ба кадом самт аст?',
      finishTitle: 'Санҷиш анҷом ёфт',
      acuityResult: 'Тезиши ниҳоӣ (Visus)',
      correctAnswers: 'Ҷавобҳои дуруст',
      finishBtn: 'Анҷом ва сабт кардан',
      tryAgain: 'Аз нав гузаштан',
      statusOpt: '100% меъёр (Visus ≥ 1.0)',
      statusSub: 'Камшавии мӯътадил (Visus 0.6–0.8)',
      statusLow: 'Машварати офталмолог тавсия мешавад (Visus ≤ 0.4)',
    },
    en: {
      title: 'Visual Acuity',
      subtitle: 'ISO 8596 standardized optotype. Indicate which direction the ring gap faces.',
      standard: 'ISO 8596 Optotype Standard',
      distanceWarning: 'Sit 50–70 cm from the monitor under comfortable illumination.',
      startBtn: 'Start Visual Screening',
      level: 'Level',
      acuity: 'Acuity',
      question: 'Which direction is the gap facing?',
      finishTitle: 'Screening Completed',
      acuityResult: 'Visual Acuity (Visus)',
      correctAnswers: 'Correct answers',
      finishBtn: 'Complete & Save',
      tryAgain: 'Retry',
      statusOpt: 'Normal Acuity (Visus ≥ 1.0)',
      statusSub: 'Mild reduction (Visus 0.6–0.8)',
      statusLow: 'Consultation recommended (Visus ≤ 0.4)',
    },
  }[lang]

  const pickRandomOrientation = useCallback(() => {
    let pick = ORIENTATIONS[Math.floor(Math.random() * ORIENTATIONS.length)]
    if (pick.id === currentOrientationId && ORIENTATIONS.length > 1) {
      const remaining = ORIENTATIONS.filter((o) => o.id !== currentOrientationId)
      pick = remaining[Math.floor(Math.random() * remaining.length)]
    }
    setCurrentAngle(pick.angle)
    setCurrentOrientationId(pick.id)
  }, [currentOrientationId])

  const handleStart = () => {
    setLevelIdx(0)
    setCorrectCount(0)
    setScoreAcuity(0)
    setIsFinished(false)
    setIsActive(true)
    const pick = ORIENTATIONS[Math.floor(Math.random() * ORIENTATIONS.length)]
    setCurrentAngle(pick.angle)
    setCurrentOrientationId(pick.id)
  }

  const handleDirectionChoice = useCallback((id: string) => {
    const isCorrect = id === currentOrientationId
    const currentAcuity = ACUITY_LEVELS[levelIdx].acuity

    let nextCorrect = correctCount
    let nextAcuity = scoreAcuity
    if (isCorrect) {
      nextCorrect += 1
      nextAcuity = Math.max(scoreAcuity, currentAcuity)
      setCorrectCount(nextCorrect)
      setScoreAcuity(nextAcuity)
    }

    if (levelIdx + 1 < ACUITY_LEVELS.length) {
      setLevelIdx((prev) => prev + 1)
      pickRandomOrientation()
    } else {
      setIsActive(false)
      setIsFinished(true)
    }
  }, [correctCount, currentOrientationId, levelIdx, pickRandomOrientation, scoreAcuity])

  // Support keyboard arrow keys during active test
  useEffect(() => {
    if (!isActive) return

    const handleKeyDown = (e: KeyboardEvent) => {
      let choiceId: string | null = null
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') choiceId = 'up'
      else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') choiceId = 'down'
      else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') choiceId = 'left'
      else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') choiceId = 'right'

      if (choiceId) {
        e.preventDefault()
        handleDirectionChoice(choiceId)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isActive, handleDirectionChoice])

  const handleFinish = () => {
    let category = t.statusOpt
    if (scoreAcuity < 0.6) category = t.statusLow
    else if (scoreAcuity < 1.0) category = t.statusSub

    onComplete({
      summary: `${t.acuityResult}: ${scoreAcuity.toFixed(2)} (${category}). ${t.correctAnswers}: ${correctCount} / ${ACUITY_LEVELS.length}.`,
      metrics: {
        visual_acuity_decimal: scoreAcuity,
        correct_count: correctCount,
        total_trials: ACUITY_LEVELS.length,
        status_category: category,
      },
    })
  }

  const currentLevel = ACUITY_LEVELS[levelIdx]

  return (
    <div className="flex flex-col items-center max-w-xl mx-auto w-full select-none">
      <div className="w-full flex items-center justify-between mb-4">
        <Badge variant="cyan" className="gap-1">
          <Eye className="w-3 h-3" />
          <span>{t.standard}</span>
        </Badge>
        {isActive && (
          <span className="text-xs font-mono text-zinc-500">
            {t.level} {levelIdx + 1} / {ACUITY_LEVELS.length} (Visus: {currentLevel.acuity})
          </span>
        )}
      </div>

      {!isActive && !isFinished && (
        <div className="w-full rounded-3xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-100/50 dark:bg-zinc-900/40 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-4">
            <Eye className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">{t.title}</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-md mb-2">{t.subtitle}</p>
          <p className="text-xs text-amber-600 dark:text-amber-400 mb-6 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
            {t.distanceWarning}
          </p>
          <Button variant="emerald" size="lg" onClick={handleStart} className="gap-2">
            <Play className="w-4 h-4" />
            <span>{t.startBtn}</span>
          </Button>
        </div>
      )}

      {isActive && (
        <div className="w-full flex flex-col items-center">
          {/* Landolt C Canvas / SVG Container */}
          <div className="w-full h-64 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center justify-center shadow-lg mb-6">
            <svg
              width={currentLevel.ringSizePx}
              height={currentLevel.ringSizePx}
              viewBox="0 0 100 100"
              className="overflow-visible select-none"
            >
              {/* Rotate around exact circle center (50, 50) */}
              <g
                transform={`rotate(${currentAngle}, 50, 50)`}
                style={{
                  transformOrigin: '50px 50px',
                  transition: 'transform 0.15s ease-out',
                }}
              >
                {/* Landolt C ring: center (50, 50), radius 40, strokeWidth 20 */}
                {/* Stroke perimeter 251.33 px. Gap is 42 px. */}
                {/* strokeDashoffset="-21" centers the gap at angle 0.00 deg (exact RIGHT / 3 o'clock). */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="20"
                  strokeDasharray="209.33 42"
                  strokeDashoffset="-21"
                  strokeLinecap="butt"
                  className="text-zinc-900 dark:text-zinc-100"
                />
              </g>
            </svg>
          </div>

          <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-4">{t.question}</p>

          {/* 8-Directional Compass Control Pad */}
          <div className="grid grid-cols-3 gap-2 w-52 mb-6">
            <button
              onClick={() => handleDirectionChoice('up-left')}
              className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-600 transition-colors flex items-center justify-center text-zinc-700 dark:text-zinc-300 active:scale-95"
              title="Вверх-влево"
            >
              <ArrowUpLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleDirectionChoice('up')}
              className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-600 transition-colors flex items-center justify-center text-zinc-700 dark:text-zinc-300 active:scale-95"
              title="Вверх"
            >
              <ArrowUp className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleDirectionChoice('up-right')}
              className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-600 transition-colors flex items-center justify-center text-zinc-700 dark:text-zinc-300 active:scale-95"
              title="Вверх-вправо"
            >
              <ArrowUpRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleDirectionChoice('left')}
              className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-600 transition-colors flex items-center justify-center text-zinc-700 dark:text-zinc-300 active:scale-95"
              title="Влево"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center justify-center text-zinc-400 font-mono text-xs font-bold">
              C
            </div>
            <button
              onClick={() => handleDirectionChoice('right')}
              className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-600 transition-colors flex items-center justify-center text-zinc-700 dark:text-zinc-300 active:scale-95"
              title="Вправо"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleDirectionChoice('down-left')}
              className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-600 transition-colors flex items-center justify-center text-zinc-700 dark:text-zinc-300 active:scale-95"
              title="Вниз-влево"
            >
              <ArrowDownLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleDirectionChoice('down')}
              className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-600 transition-colors flex items-center justify-center text-zinc-700 dark:text-zinc-300 active:scale-95"
              title="Вниз"
            >
              <ArrowDown className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleDirectionChoice('down-right')}
              className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-600 transition-colors flex items-center justify-center text-zinc-700 dark:text-zinc-300 active:scale-95"
              title="Вниз-вправо"
            >
              <ArrowDownRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {isFinished && (
        <div className="w-full rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 text-center shadow-xl">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-4">
            <Award className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">{t.finishTitle}</h3>

          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto my-6">
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/80">
              <div className="text-xs text-zinc-500 mb-1">{t.acuityResult}</div>
              <div className="text-3xl font-extrabold text-emerald-500 font-mono">
                {scoreAcuity.toFixed(2)}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/80">
              <div className="text-xs text-zinc-500 mb-1">{t.correctAnswers}</div>
              <div className="text-3xl font-extrabold text-cyan-500 font-mono">
                {correctCount} / {ACUITY_LEVELS.length}
              </div>
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
