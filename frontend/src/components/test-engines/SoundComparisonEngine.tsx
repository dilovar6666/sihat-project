import React, { useState, useRef } from 'react'
import { Volume2, Play, RotateCcw, CheckCircle, Sparkles } from 'lucide-react'
import { Button } from '../ui/Button'
import type { Language } from '../../i18n'

interface SoundComparisonEngineProps {
  lang: Language
  challenge?: Record<string, unknown> | null
  onComplete: (result: { summary: string; metrics: Record<string, unknown> }) => void
}

interface ToneTrial {
  trial: number
  freq_a: number
  freq_b: number
  diff: 'higher' | 'lower' | 'same'
}

const DEFAULT_TRIALS: ToneTrial[] = [
  { trial: 1, freq_a: 1000, freq_b: 1040, diff: 'higher' },
  { trial: 2, freq_a: 800, freq_b: 760, diff: 'lower' },
  { trial: 3, freq_a: 1200, freq_b: 1200, diff: 'same' },
  { trial: 4, freq_a: 1500, freq_b: 1550, diff: 'higher' },
  { trial: 5, freq_a: 600, freq_b: 560, diff: 'lower' },
]

export const SoundComparisonEngine: React.FC<SoundComparisonEngineProps> = ({
  lang,
  challenge,
  onComplete,
}) => {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({})
  const [isPlaying, setIsPlaying] = useState(false)
  const [isActive, setIsActive] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  const audioCtxRef = useRef<AudioContext | null>(null)

  const trials: ToneTrial[] =
    challenge && Array.isArray(challenge.trials) && challenge.trials.length > 0
      ? (challenge.trials as ToneTrial[])
      : DEFAULT_TRIALS

  const currentTrial = trials[currentIdx]

  const t = {
    ru: {
      title: 'Сравнение звуков',
      subtitle: 'Прослушайте два коротких звуковых сигнала и определите, как изменилась высота второго звука.',
      startBtn: 'Начать тест слуха',
      playTones: 'Воспроизвести пару звуков',
      playing: 'Воспроизведение...',
      question: 'Второй звук относительно первого был:',
      higher: 'Выше по тону ↑',
      same: 'Одинаковый =',
      lower: 'Ниже по тону ↓',
      volumeNotice: 'Рекомендуется комфортная громкость в наушниках (без превышения безопасного уровня).',
      trialOf: 'Попытка',
      of: 'из',
      tryAgain: 'Пройти снова',
      saveBtn: 'Завершить и сохранить',
      finishTitle: 'Тест различения звуков завершен!',
    },
    tj: {
      title: 'Муқоисаи овозҳо',
      subtitle: 'Ду садои кӯтоҳро гӯш кунед ва муайян намоед, ки баландии садои дуюм чӣ гуна тағйир ёфт.',
      startBtn: 'Оғози санҷиши шунавоӣ',
      playTones: 'Пахши ҷуфти овозҳо',
      playing: 'Дар ҳоли пахш...',
      question: 'Овози дуюм нисбат ба аввал чӣ гуна буд:',
      higher: 'Баландтар ↑',
      same: 'Якхела =',
      lower: 'Пасттар ↓',
      volumeNotice: 'Гӯшмонакҳоро дар сатҳи бехатари овоз истифода баред.',
      trialOf: 'Кӯшиши',
      of: 'аз',
      tryAgain: 'Аз нав гузаштан',
      saveBtn: 'Анҷом ва сабт кардан',
      finishTitle: 'Санҷиши муқоисаи овозҳо анҷом ёфт!',
    },
    en: {
      title: 'Sound Comparison',
      subtitle: 'Listen to two short acoustic tones and determine whether the second tone was higher, lower, or identical.',
      startBtn: 'Start Tone Comparison',
      playTones: 'Play Tone Pair',
      playing: 'Playing tones...',
      question: 'The second tone compared to the first was:',
      higher: 'Higher Pitch ↑',
      same: 'Same Pitch =',
      lower: 'Lower Pitch ↓',
      volumeNotice: 'Please maintain a comfortable, safe listening volume in headphones.',
      trialOf: 'Trial',
      of: 'of',
      tryAgain: 'Try Again',
      saveBtn: 'Complete and Save',
      finishTitle: 'Sound comparison completed!',
    },
  }[lang]

  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      audioCtxRef.current = new AudioCtx()
    }
    if (audioCtxRef.current.state === 'suspended') {
      void audioCtxRef.current.resume()
    }
    return audioCtxRef.current
  }

  const playTone = (freq: number, startTime: number, duration: number) => {
    const ctx = getAudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, startTime)

    // Smooth envelope to prevent clicks
    gain.gain.setValueAtTime(0.001, startTime)
    gain.gain.exponentialRampToValueAtTime(0.15, startTime + 0.05)
    gain.gain.setValueAtTime(0.15, startTime + duration - 0.05)
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(startTime)
    osc.stop(startTime + duration)
  }

  const playTrialTones = () => {
    if (!currentTrial || isPlaying) return
    setIsPlaying(true)
    const ctx = getAudioContext()
    const now = ctx.currentTime

    // Tone 1: 400ms
    playTone(currentTrial.freq_a, now + 0.1, 0.4)
    // Tone 2: 400ms after 250ms silence
    playTone(currentTrial.freq_b, now + 0.75, 0.4)

    setTimeout(() => {
      setIsPlaying(false)
    }, 1300)
  }

  const handleStart = () => {
    setCurrentIdx(0)
    setUserAnswers({})
    setIsFinished(false)
    setIsActive(true)
  }

  const handleSelectChoice = (choice: 'higher' | 'lower' | 'same') => {
    const nextAnswers = { ...userAnswers, [currentTrial.trial]: choice }
    setUserAnswers(nextAnswers)

    if (currentIdx + 1 < trials.length) {
      setCurrentIdx((i) => i + 1)
    } else {
      setIsFinished(true)
    }
  }

  const handleSave = () => {
    let correct = 0
    trials.forEach((tItem) => {
      if (userAnswers[tItem.trial] === tItem.diff) {
        correct += 1
      }
    })
    const total = trials.length
    const accuracy = Math.round((correct / Math.max(1, total)) * 100)

    onComplete({
      summary: `${t.finishTitle} (${correct}/${total} верно, точность ${accuracy}%)`,
      metrics: {
        correct_trials: correct,
        total_trials: total,
        accuracy_pct: accuracy,
      },
    })
  }

  return (
    <div className="space-y-6 max-w-xl mx-auto text-center">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100 flex items-center justify-center gap-2">
          <Volume2 className="w-6 h-6 text-emerald-500" />
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
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">{t.volumeNotice}</p>
          <Button size="lg" variant="emerald" onClick={handleStart} className="gap-2 px-8 py-3.5 text-base font-bold shadow-lg shadow-emerald-600/30">
            <Play className="w-5 h-5 fill-current" />
            <span>{t.startBtn}</span>
          </Button>
        </div>
      ) : !isFinished && currentTrial ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-500 px-2">
            <span>{t.trialOf} {currentIdx + 1} {t.of} {trials.length}</span>
            <span className="text-emerald-500 font-bold">Прогресс: {Math.round(((currentIdx + 1) / trials.length) * 100)}%</span>
          </div>

          {/* Sound play button */}
          <div className="p-8 rounded-3xl liquid-glass border border-emerald-500/20 space-y-4 text-center">
            <button
              onClick={playTrialTones}
              disabled={isPlaying}
              className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center transition-all duration-300 shadow-xl ${
                isPlaying
                  ? 'bg-emerald-500 text-white scale-110 shadow-emerald-500/50 animate-pulse'
                  : 'bg-emerald-500/20 text-emerald-500 border-2 border-emerald-500/50 hover:bg-emerald-500 hover:text-white hover:scale-105 active:scale-95'
              }`}
            >
              <Volume2 className="w-10 h-10" />
            </button>
            <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
              {isPlaying ? t.playing : t.playTones}
            </div>
          </div>

          {/* Answer options */}
          <div className="space-y-3">
            <div className="text-xs font-medium text-zinc-500">{t.question}</div>
            <div className="grid grid-cols-3 gap-3">
              <Button
                variant="outline"
                onClick={() => handleSelectChoice('higher')}
                className="py-3 text-xs sm:text-sm font-bold border-zinc-200 dark:border-zinc-800 hover:border-emerald-500 hover:text-emerald-500 liquid-glass-pill"
              >
                {t.higher}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSelectChoice('same')}
                className="py-3 text-xs sm:text-sm font-bold border-zinc-200 dark:border-zinc-800 hover:border-emerald-500 hover:text-emerald-500 liquid-glass-pill"
              >
                {t.same}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSelectChoice('lower')}
                className="py-3 text-xs sm:text-sm font-bold border-zinc-200 dark:border-zinc-800 hover:border-emerald-500 hover:text-emerald-500 liquid-glass-pill"
              >
                {t.lower}
              </Button>
            </div>
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
