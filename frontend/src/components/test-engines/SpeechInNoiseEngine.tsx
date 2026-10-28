import React, { useState, useRef, useEffect } from 'react'
import { Headphones, Volume2, Award, CheckCircle, RotateCcw, Play } from 'lucide-react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import type { Language } from '../../i18n'

interface SpeechInNoiseEngineProps {
  lang: Language
  onComplete: (result: { summary: string; metrics: Record<string, unknown> }) => void
}

interface SnrTrial {
  targetWord: string
  options: string[]
  snrDb: number
}

const SNR_STEPS = [12, 9, 6, 4, 2, 0, -2, -4, -6, -8]

const SPOKEN_WORDS: Record<string, { ru: string; en: string; tj: string }> = {
  '0': { ru: 'Ноль', en: 'Zero', tj: 'Нол' },
  '1': { ru: 'Один', en: 'One', tj: 'Як' },
  '2': { ru: 'Два', en: 'Two', tj: 'Ду' },
  '3': { ru: 'Три', en: 'Three', tj: 'Се' },
  '4': { ru: 'Четыре', en: 'Four', tj: 'Чор' },
  '5': { ru: 'Пять', en: 'Five', tj: 'Панҷ' },
  '6': { ru: 'Шесть', en: 'Six', tj: 'Шаш' },
  '7': { ru: 'Семь', en: 'Seven', tj: 'Ҳафт' },
  '8': { ru: 'Восемь', en: 'Eight', tj: 'Ҳашт' },
  '9': { ru: 'Девять', en: 'Nine', tj: 'Нӯҳ' },
}

const ALL_DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']

function generateRandomSnrTrials(): SnrTrial[] {
  return SNR_STEPS.map((snrDb) => {
    // Pick target digit
    const target = ALL_DIGITS[Math.floor(Math.random() * ALL_DIGITS.length)]
    // Pick 3 distinct distractors
    const otherDigits = ALL_DIGITS.filter((d) => d !== target)
    for (let i = otherDigits.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[otherDigits[i], otherDigits[j]] = [otherDigits[j], otherDigits[i]]
    }
    const distractors = otherDigits.slice(0, 3)
    const options = [target, ...distractors]
    // Shuffle options
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[options[i], options[j]] = [options[j], options[i]]
    }
    return {
      targetWord: target,
      options,
      snrDb,
    }
  })
}

export const SpeechInNoiseEngine: React.FC<SpeechInNoiseEngineProps> = ({ lang, onComplete }) => {
  const [trials, setTrials] = useState<SnrTrial[]>(() => generateRandomSnrTrials())
  const [trialIdx, setTrialIdx] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [lowestPassingSnr, setLowestPassingSnr] = useState(12)
  const [isActive, setIsActive] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)

  const audioCtxRef = useRef<AudioContext | null>(null)
  const noiseSourceRef = useRef<AudioBufferSourceNode | null>(null)
  const noiseGainRef = useRef<GainNode | null>(null)
  const stopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const safetyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const t = {
    ru: {
      title: 'Разборчивость речи в шуме',
      subtitle: 'Определите цифру, произносимую на фоне искусственного акустического шума при ступенчато снижающемся SNR.',
      standard: 'Signal-to-Noise Ratio (SNR) Speech Test',
      instruction: 'Прослушайте аудиофрагмент и выберите услышанную цифру:',
      listenAgain: 'Повторить звук',
      startBtn: 'Начать тест разборчивости (10 проб)',
      trial: 'Проба',
      snr: 'Отношение сигнал/шум:',
      db: 'дБ SNR',
      finishTitle: 'Тест разборчивости речи завершен',
      srtResult: 'Порог разборчивости речи (SRT)',
      normOptimal: 'Отличная разборчивость (SRT ≤ -2 дБ)',
      normGood: 'Нормальная разборчивость (SRT 0–4 дБ)',
      normSub: 'Затрудненная разборчивость в шуме (SRT ≥ +6 дБ)',
      finishBtn: 'Завершить и сохранить',
      tryAgain: 'Пройти снова (10 новых случайных проб)',
    },
    tj: {
      title: 'Фаҳмоии нутқ дар садои бегона',
      subtitle: 'Рақамеро, ки дар заминаи садои бегона гуфта мешавад, бо коҳиши зина ба зинаи SNR муайян кунед.',
      standard: 'Signal-to-Noise Ratio (SNR) Speech Test',
      instruction: 'Овозро гӯш кунед ва рақами шунидаатонро интихоб намоед:',
      listenAgain: 'Такрори садо',
      startBtn: 'Оғози санҷиш (10 навбат)',
      trial: 'Навбат',
      snr: 'Нисбати сигнал/садо:',
      db: 'дБ SNR',
      finishTitle: 'Санҷиши фаҳмоии нутқ анҷом ёфт',
      srtResult: 'Ҳадди фаҳмоии нутқ (SRT)',
      normOptimal: 'Фаҳмоии аъло (SRT ≤ -2 дБ)',
      normGood: 'Фаҳмоии муътадил (SRT 0–4 дБ)',
      normSub: 'Мушкилӣ дар муҳити серсадо (SRT ≥ +6 дБ)',
      finishBtn: 'Анҷом ва сабт кардан',
      tryAgain: 'Аз нав гузаштан (10 навбати нави тасодуфӣ)',
    },
    en: {
      title: 'Speech-in-Noise Discrimination',
      subtitle: 'Identify speech tokens presented against speech-shaped background noise at decreasing SNR levels.',
      standard: 'Speech Reception Threshold (SRT) in Noise',
      instruction: 'Listen to the audio burst and select the number you heard:',
      listenAgain: 'Replay Audio',
      startBtn: 'Start Speech Test (10 Trials)',
      trial: 'Trial',
      snr: 'Signal-to-Noise Ratio:',
      db: 'dB SNR',
      finishTitle: 'Speech-in-Noise Evaluation Completed',
      srtResult: 'Speech Reception Threshold (SRT)',
      normOptimal: 'Superior Intelligibility (SRT ≤ -2 dB)',
      normGood: 'Normal Hearing Range (SRT 0–4 dB)',
      normSub: 'Reduced in-noise intelligibility (SRT ≥ +6 dB)',
      finishBtn: 'Complete & Save',
      tryAgain: 'Retry (10 New Random Trials)',
    },
  }[lang]

  const stopActiveAudioImmediately = () => {
    if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current)
    if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current)
    try {
      if (noiseSourceRef.current) {
        noiseSourceRef.current.stop()
        noiseSourceRef.current.disconnect()
        noiseSourceRef.current = null
      }
    } catch {
      // ignore
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    setIsPlayingAudio(false)
  }

  useEffect(() => {
    return () => {
      stopActiveAudioImmediately()
    }
  }, [])

  const playTrialAudio = (word: string, snrDb: number) => {
    stopActiveAudioImmediately()
    setIsPlayingAudio(true)

    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContextClass()
    }
    const ctx = audioCtxRef.current
    if (ctx.state === 'suspended') void ctx.resume()

    const bufferSize = ctx.sampleRate * 3
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const output = noiseBuffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.16
    }

    const noiseSource = ctx.createBufferSource()
    noiseSource.buffer = noiseBuffer
    noiseSource.loop = true

    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 1000
    filter.Q.value = 0.7

    const noiseGain = ctx.createGain()
    noiseGain.gain.setValueAtTime(0.001, ctx.currentTime)
    noiseGain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.1)

    noiseSource.connect(filter)
    filter.connect(noiseGain)
    noiseGain.connect(ctx.destination)

    noiseSource.start()
    noiseSourceRef.current = noiseSource
    noiseGainRef.current = noiseGain

    let audioStopped = false
    const fadeOutNoise = (tailMs = 450) => {
      if (audioStopped) return
      audioStopped = true

      stopTimeoutRef.current = setTimeout(() => {
        try {
          if (noiseGainRef.current && audioCtxRef.current) {
            const now = audioCtxRef.current.currentTime
            noiseGainRef.current.gain.setValueAtTime(noiseGainRef.current.gain.value, now)
            noiseGainRef.current.gain.linearRampToValueAtTime(0.001, now + 0.25)
          }
        } catch {
          // ignore
        }
        setTimeout(() => {
          try {
            noiseSourceRef.current?.stop()
            noiseSourceRef.current?.disconnect()
          } catch {
            // ignore
          }
          noiseSourceRef.current = null
          noiseGainRef.current = null
          setIsPlayingAudio(false)
        }, 280)
      }, tailMs)
    }

    safetyTimeoutRef.current = setTimeout(() => {
      fadeOutNoise(100)
    }, 4000)

    const spokenItem = SPOKEN_WORDS[word]
    const spokenText = lang === 'en' ? spokenItem?.en || word : spokenItem?.ru || word

    const speechVolume = Math.min(1.0, Math.max(0.18, 0.55 * Math.pow(10, snrDb / 22)))

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(spokenText)
      utterance.rate = 0.95
      utterance.volume = speechVolume
      utterance.lang = lang === 'en' ? 'en-US' : 'ru-RU'

      utterance.onend = () => {
        if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current)
        fadeOutNoise(450)
      }

      utterance.onerror = () => {
        if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current)
        fadeOutNoise(200)
      }

      setTimeout(() => {
        try {
          window.speechSynthesis.speak(utterance)
        } catch {
          fadeOutNoise(1200)
        }
      }, 180)
    } else {
      fadeOutNoise(1800)
    }
  }

  const handleStart = () => {
    const newTrials = generateRandomSnrTrials()
    setTrials(newTrials)
    setTrialIdx(0)
    setCorrectCount(0)
    setLowestPassingSnr(12)
    setIsFinished(false)
    setIsActive(true)

    setTimeout(() => {
      playTrialAudio(newTrials[0].targetWord, newTrials[0].snrDb)
    }, 400)
  }

  const handleChoice = (word: string) => {
    if (isPlayingAudio) return
    const current = trials[trialIdx]
    const isCorrect = word === current.targetWord

    let nextCorrect = correctCount
    let nextLowest = lowestPassingSnr

    if (isCorrect) {
      nextCorrect += 1
      nextLowest = Math.min(lowestPassingSnr, current.snrDb)
      setCorrectCount(nextCorrect)
      setLowestPassingSnr(nextLowest)
    }

    if (trialIdx + 1 < trials.length) {
      const nextIdx = trialIdx + 1
      setTrialIdx(nextIdx)
      setTimeout(() => {
        playTrialAudio(trials[nextIdx].targetWord, trials[nextIdx].snrDb)
      }, 400)
    } else {
      stopActiveAudioImmediately()
      setIsActive(false)
      setIsFinished(true)
    }
  }

  const handleFinish = () => {
    let category = t.normGood
    if (lowestPassingSnr <= -2) category = t.normOptimal
    else if (lowestPassingSnr >= 6) category = t.normSub

    onComplete({
      summary: `${t.srtResult}: ${lowestPassingSnr} дБ (${category}). Верно: ${correctCount} из ${trials.length}.`,
      metrics: {
        srt_threshold_db: lowestPassingSnr,
        correct_count: correctCount,
        total_trials: trials.length,
        status_category: category,
      },
    })
  }

  const currentTrial = trials[trialIdx]

  return (
    <div className="flex flex-col items-center max-w-xl mx-auto w-full select-none">
      <div className="w-full flex items-center justify-between mb-4">
        <Badge variant="cyan" className="gap-1">
          <Headphones className="w-3 h-3" />
          <span>{t.standard}</span>
        </Badge>
        {isActive && (
          <span className="text-xs font-mono text-zinc-500">
            {t.trial} {trialIdx + 1} / {trials.length}
          </span>
        )}
      </div>

      {!isActive && !isFinished && (
        <div className="w-full rounded-3xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-100/50 dark:bg-zinc-900/40 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-500 mb-4">
            <Volume2 className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">{t.title}</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-md mb-6">{t.subtitle}</p>
          <Button onClick={handleStart} variant="emerald" size="lg" className="gap-2 px-8 py-3.5 text-base font-bold shadow-lg shadow-emerald-600/30">
            <Play className="w-4 h-4 fill-current" />
            <span>{t.startBtn}</span>
          </Button>
        </div>
      )}

      {isActive && !isFinished && currentTrial && (
        <div className="w-full rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 p-6 sm:p-8 flex flex-col items-center text-center shadow-lg backdrop-blur-md">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-xs text-zinc-500 font-mono">{t.snr}</span>
            <Badge variant="outline" className="font-mono text-xs">
              {currentTrial.snrDb > 0 ? `+${currentTrial.snrDb}` : currentTrial.snrDb} {t.db}
            </Badge>
          </div>

          <div className="my-6">
            <button
              onClick={() => playTrialAudio(currentTrial.targetWord, currentTrial.snrDb)}
              disabled={isPlayingAudio}
              className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                isPlayingAudio
                  ? 'bg-cyan-500/20 text-cyan-500 animate-pulse border-2 border-cyan-500/50 scale-105'
                  : 'bg-cyan-500/10 text-cyan-500 hover:bg-cyan-500/20 border border-cyan-500/30 hover:scale-105 active:scale-95 cursor-pointer shadow-md'
              }`}
            >
              <Volume2 className="w-10 h-10" />
            </button>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-3 font-mono">
              {isPlayingAudio ? 'Воспроизведение...' : t.listenAgain}
            </div>
          </div>

          <div className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-4">{t.instruction}</div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-sm">
            {currentTrial.options.map((opt) => (
              <Button
                key={opt}
                variant="outline"
                size="lg"
                disabled={isPlayingAudio}
                onClick={() => handleChoice(opt)}
                className="h-12 font-mono font-bold text-base hover:border-emerald-500 hover:text-emerald-500 hover:bg-emerald-500/10 transition-all rounded-2xl cursor-pointer"
              >
                {opt}
              </Button>
            ))}
          </div>
        </div>
      )}

      {isFinished && (
        <div className="w-full rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 p-8 flex flex-col items-center text-center shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-4">
            <Award className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-1">{t.finishTitle}</h3>
          <p className="text-sm text-zinc-500 font-mono mb-6">
            Правильно: {correctCount} из {trials.length}
          </p>

          <div className="w-full p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800/50 mb-6 flex items-center justify-between">
            <span className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">{t.srtResult}:</span>
            <span className="text-xl font-mono font-bold text-emerald-500">
              {lowestPassingSnr > 0 ? `+${lowestPassingSnr}` : lowestPassingSnr} {t.db}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Button onClick={handleStart} variant="outline" className="flex-1 gap-2 rounded-xl">
              <RotateCcw className="w-4 h-4" />
              <span>{t.tryAgain}</span>
            </Button>
            <Button onClick={handleFinish} variant="emerald" className="flex-1 gap-2 rounded-xl font-bold shadow-md shadow-emerald-600/30">
              <CheckCircle className="w-4 h-4" />
              <span>{t.finishBtn}</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
