import React, { useState } from 'react'
import { Eye, Award, CheckCircle, RotateCcw, Play } from 'lucide-react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import type { Language } from '../../i18n'

interface ContrastSensitivityEngineProps {
  lang: Language
  onComplete: (result: { summary: string; metrics: Record<string, unknown> }) => void
}

const SLOAN_LETTERS = ['C', 'D', 'E', 'F', 'H', 'K', 'N', 'O', 'P', 'R', 'S', 'V', 'Z']

const BASE_CONTRAST_STEPS = [
  { contrastPct: 100, logCS: 0.0 },
  { contrastPct: 56, logCS: 0.25 },
  { contrastPct: 32, logCS: 0.50 },
  { contrastPct: 18, logCS: 0.75 },
  { contrastPct: 10, logCS: 1.00 },
  { contrastPct: 5.6, logCS: 1.25 },
  { contrastPct: 3.2, logCS: 1.50 },
  { contrastPct: 1.8, logCS: 1.75 },
  { contrastPct: 1.0, logCS: 1.95 },
]

function generateRandomContrastSteps() {
  return BASE_CONTRAST_STEPS.map((step) => {
    const letters = [...SLOAN_LETTERS]
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[letters[i], letters[j]] = [letters[j], letters[i]]
    }
    return {
      ...step,
      triplet: letters.slice(0, 3),
    }
  })
}

export const ContrastSensitivityEngine: React.FC<ContrastSensitivityEngineProps> = ({ lang, onComplete }) => {
  const [contrastSteps, setContrastSteps] = useState(() => generateRandomContrastSteps())
  const [stepIdx, setStepIdx] = useState(0)
  const [userInputs, setUserInputs] = useState(['', '', ''])
  const [highestLogCS, setHighestLogCS] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  const [errorStreak, setErrorStreak] = useState(0)

  const t = {
    ru: {
      title: 'Контрастная чувствительность',
      subtitle: 'Определите буквы в тройках при ступенчатом снижении контрастности до 1%.',
      standard: 'Pelli-Robson Contrast Sensitivity Standard',
      instruction: 'Введите 3 буквы, которые вы видите на карточке (английские буквы):',
      submitStep: 'Подтвердить тройку',
      cantSee: 'Буквы не различимы',
      step: 'Ступень',
      contrast: 'Контрастность',
      finishTitle: 'Тест контрастной чувствительности завершен',
      logCSResult: 'Порог чувствительности (logCS)',
      normOptimal: 'Высокая чувствительность (logCS ≥ 1.75)',
      normGood: 'Нормальная чувствительность (logCS 1.50–1.70)',
      normSub: 'Сниженная контрастность (logCS < 1.50)',
      finishBtn: 'Завершить и сохранить',
      tryAgain: 'Пройти снова',
    },
    tj: {
      title: 'Ҳассосияти контрастӣ',
      subtitle: 'Ҳарфҳоро ҳангоми паст шудани контраст то 1% муайян кунед.',
      standard: 'Pelli-Robson Contrast Sensitivity Standard',
      instruction: '3 ҳарферо, ки мебинед, дохил намоед (ҳарфҳои лотинӣ):',
      submitStep: 'Тасдиқи ҳарфҳо',
      cantSee: 'Ҳарфҳо дида намешаванд',
      step: 'Зина',
      contrast: 'Контраст',
      finishTitle: 'Санҷиши контраст анҷом ёфт',
      logCSResult: 'Ҳадди ҳассосият (logCS)',
      normOptimal: 'Ҳассосияти баланд (logCS ≥ 1.75)',
      normGood: 'Ҳассосияти муътадил (logCS 1.50–1.70)',
      normSub: 'Ҳассосияти пастшуда (logCS < 1.50)',
      finishBtn: 'Анҷом ва сабт кардан',
      tryAgain: 'Аз нав гузаштан',
    },
    en: {
      title: 'Contrast Sensitivity',
      subtitle: 'Identify letter triplets with step-wise decreasing contrast down to 1%.',
      standard: 'Pelli-Robson Clinical Contrast Standard',
      instruction: 'Enter the 3 letters you see on the card (Latin uppercase):',
      submitStep: 'Submit Triplet',
      cantSee: 'Letters cannot be resolved',
      step: 'Step',
      contrast: 'Contrast',
      finishTitle: 'Contrast Evaluation Completed',
      logCSResult: 'Contrast Threshold (logCS)',
      normOptimal: 'High Contrast Sensitivity (logCS ≥ 1.75)',
      normGood: 'Normal Sensitivity (logCS 1.50–1.70)',
      normSub: 'Reduced Contrast (logCS < 1.50)',
      finishBtn: 'Complete & Save',
      tryAgain: 'Retry',
    },
  }[lang]

  const handleStart = () => {
    setContrastSteps(generateRandomContrastSteps())
    setStepIdx(0)
    setHighestLogCS(0)
    setUserInputs(['', '', ''])
    setErrorStreak(0)
    setIsFinished(false)
    setIsActive(true)
  }

  const handleNextStep = (skip: boolean) => {
    const current = contrastSteps[stepIdx]
    let correct = 0

    if (!skip) {
      for (let i = 0; i < 3; i++) {
        if (userInputs[i].trim().toUpperCase() === current.triplet[i]) {
          correct++
        }
      }
    }

    if (correct >= 2) {
      setHighestLogCS(current.logCS)
      setErrorStreak(0)
    } else {
      const nextErrors = errorStreak + 1
      setErrorStreak(nextErrors)
      if (nextErrors >= 2 || skip) {
        setIsActive(false)
        setIsFinished(true)
        return
      }
    }

    setUserInputs(['', '', ''])
    if (stepIdx + 1 < contrastSteps.length) {
      setStepIdx((prev) => prev + 1)
    } else {
      setIsActive(false)
      setIsFinished(true)
    }
  }

  const handleFinish = () => {
    let category = t.normGood
    if (highestLogCS >= 1.75) category = t.normOptimal
    else if (highestLogCS < 1.50) category = t.normSub

    onComplete({
      summary: `${t.logCSResult}: ${highestLogCS.toFixed(2)} (${category}).`,
      metrics: {
        logCS: highestLogCS,
        status_category: category,
        steps_evaluated: stepIdx + 1,
      },
    })
  }

  const currentStep = contrastSteps[stepIdx]
  // Calculate CSS opacity / color to simulate Pelli-Robson contrast degradation on neutral gray
  const opacityVal = Math.max(0.04, currentStep.contrastPct / 100)

  return (
    <div className="flex flex-col items-center max-w-xl mx-auto w-full select-none">
      <div className="w-full flex items-center justify-between mb-4">
        <Badge variant="cyan" className="gap-1">
          <Eye className="w-3 h-3" />
          <span>{t.standard}</span>
        </Badge>
        {isActive && (
          <span className="text-xs font-mono text-zinc-500">
            {t.step} {stepIdx + 1} / {contrastSteps.length} (Contrast: {currentStep.contrastPct}%)
          </span>
        )}
      </div>

      {!isActive && !isFinished && (
        <div className="w-full rounded-3xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-100/50 dark:bg-zinc-900/40 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-500 mb-4">
            <Eye className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">{t.title}</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-md mb-6">{t.subtitle}</p>
          <Button variant="emerald" size="lg" onClick={handleStart} className="gap-2">
            <Play className="w-4 h-4" />
            <span>{t.title}</span>
          </Button>
        </div>
      )}

      {isActive && (
        <div className="w-full flex flex-col items-center">
          {/* Card simulating Pelli-Robson chart background (flat uniform light grey #e2e8f0) */}
          <div className="w-full h-56 rounded-3xl bg-[#e2e8f0] flex items-center justify-center shadow-inner mb-6 relative overflow-hidden">
            <div
              className="font-mono text-7xl sm:text-8xl font-black tracking-widest text-[#0f172a] select-none"
              style={{ opacity: opacityVal }}
            >
              {currentStep.triplet.join(' ')}
            </div>
          </div>

          <p className="text-xs text-zinc-500 mb-3">{t.instruction}</p>

          <div className="flex items-center gap-3 mb-6">
            {[0, 1, 2].map((idx) => (
              <input
                key={idx}
                type="text"
                maxLength={1}
                value={userInputs[idx]}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase()
                  const next = [...userInputs]
                  next[idx] = val
                  setUserInputs(next)
                  if (val && idx < 2) {
                    const nextInput = document.getElementById(`triplet-input-${idx + 1}`)
                    nextInput?.focus()
                  }
                }}
                id={`triplet-input-${idx}`}
                className="w-14 h-16 text-center text-2xl font-bold uppercase rounded-2xl border-2 border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:border-emerald-500 focus:outline-none"
              />
            ))}
          </div>

          <div className="flex gap-3 w-full max-w-xs">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleNextStep(true)}
              className="flex-1 text-xs"
            >
              {t.cantSee}
            </Button>
            <Button
              variant="emerald"
              size="sm"
              onClick={() => handleNextStep(false)}
              className="flex-1 text-xs"
            >
              {t.submitStep}
            </Button>
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
            <div className="text-xs text-zinc-500 mb-1">{t.logCSResult}</div>
            <div className="text-4xl font-black text-emerald-500 font-mono">
              {highestLogCS.toFixed(2)}{' '}
              <span className="text-sm font-normal text-zinc-400">logCS</span>
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
