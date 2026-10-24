import React, { useState, useRef } from 'react'
import { Headphones, Volume2, Award, CheckCircle, RotateCcw, Play } from 'lucide-react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import type { Language } from '../../i18n'

interface SpeechInNoiseEngineProps {
  lang: Language
  onComplete: (result: { summary: string; metrics: Record<string, unknown> }) => void
}

const SNR_TRIALS = [
  { targetWord: '7', options: ['7', '3', '9', '5'], snrDb: 6 },
  { targetWord: '4', options: ['1', '4', '8', '6'], snrDb: 3 },
  { targetWord: '9', options: ['2', '9', '5', '7'], snrDb: 0 },
  { targetWord: '2', options: ['2', '3', '8', '0'], snrDb: -3 },
  { targetWord: '8', options: ['8', '6', '1', '4'], snrDb: -6 },
]

export const SpeechInNoiseEngine: React.FC<SpeechInNoiseEngineProps> = ({ lang, onComplete }) => {
  const [trialIdx, setTrialIdx] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [lowestPassingSnr, setLowestPassingSnr] = useState(6)
  const [isActive, setIsActive] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)

  const audioCtxRef = useRef<AudioContext | null>(null)

  const t = {
    ru: {
      title: 'Разборчивость речи в шуме (SNR)',
      subtitle: 'Определите цифру, произносимую на фоне искусственного акустического шума при снижающемся SNR.',
      standard: 'Signal-to-Noise Ratio (SNR) Speech Test',
      instruction: 'Прослушайте аудиофрагмент и выберите услышанную цифру:',
      listenAgain: 'Повторить звук',
      startBtn: 'Начать тест разборчивости',
      trial: 'Проба',
      snr: 'Отношение сигнал/шум:',
      db: 'дБ SNR',
      finishTitle: 'Тест завершен',
      srtResult: 'Порог разборчивости речи (SRT)',
      normOptimal: 'Отличная разборчивость (SRT ≤ -3 дБ)',
      normGood: 'Нормальная разборчивость (SRT 0 дБ)',
      normSub: 'Затрудненная разборчивость в шуме (SRT ≥ +3 дБ)',
      finishBtn: 'Завершить и сохранить',
      tryAgain: 'Повторить',
    },
    tj: {
      title: 'Фаҳмоии нутқ дар садои бегона (SNR)',
      subtitle: 'Рақамеро, ки дар заминаи садои бегона гуфта мешавад, муайян кунед.',
      standard: 'Signal-to-Noise Ratio (SNR) Speech Test',
      instruction: 'Овозро гӯш кунед ва рақами шунидаатонро интихоб намоед:',
      listenAgain: 'Такрори садо',
      startBtn: 'Оғози санҷиш',
      trial: 'Навбат',
      snr: 'Нисбати сигнал/садо:',
      db: 'дБ SNR',
      finishTitle: 'Санҷиш анҷом ёфт',
      srtResult: 'Ҳадди фаҳмоии нутқ (SRT)',
      normOptimal: 'Фаҳмоии аъло (SRT ≤ -3 дБ)',
      normGood: 'Фаҳмоии муътадил (SRT 0 дБ)',
      normSub: 'Мушкилӣ дар муҳити серсадо (SRT ≥ +3 дБ)',
      finishBtn: 'Анҷом ва сабт кардан',
      tryAgain: 'Аз нав гузаштан',
    },
    en: {
      title: 'Speech-in-Noise Discrimination (SNR)',
      subtitle: 'Identify speech tokens presented against speech babble background noise at decreasing SNR.',
      standard: 'Speech Reception Threshold (SRT) in Noise',
      instruction: 'Listen to the audio burst and select the number you heard:',
      listenAgain: 'Replay Audio',
      startBtn: 'Start Speech Test',
      trial: 'Trial',
      snr: 'Signal-to-Noise Ratio:',
      db: 'dB SNR',
      finishTitle: 'Evaluation Completed',
      srtResult: 'Speech Reception Threshold (SRT)',
      normOptimal: 'Superior Intelligibility (SRT ≤ -3 dB)',
      normGood: 'Normal Hearing Range (SRT 0 dB)',
      normSub: 'Reduced in-noise intelligibility (SRT ≥ +3 dB)',
      finishBtn: 'Complete & Save',
      tryAgain: 'Retry',
    },
  }[lang]

  const playTrialAudio = (word: string, snrDb: number) => {
    setIsPlayingAudio(true)
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContextClass()
    }
    const ctx = audioCtxRef.current
    if (ctx.state === 'suspended') void ctx.resume()

    // 1. Generate White/Pink Noise Buffer for 1.8 seconds
    const bufferSize = ctx.sampleRate * 1.8
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const output = noiseBuffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.15
    }

    const whiteNoise = ctx.createBufferSource()
    whiteNoise.buffer = noiseBuffer
    const noiseGain = ctx.createGain()
    noiseGain.gain.setValueAtTime(0.12, ctx.currentTime)
    whiteNoise.connect(noiseGain)
    noiseGain.connect(ctx.destination)
    whiteNoise.start()

    // 2. Play Target Phoneme/Speech Tone Chord at calibrated relative volume (SNR)
    const toneOsc = ctx.createOscillator()
    const toneGain = ctx.createGain()
    // Signal volume relative to noise: snrDb 6 -> 0.25, 0 -> 0.12, -6 -> 0.04
    const signalVol = Math.max(0.03, 0.12 * Math.pow(10, snrDb / 20))
    toneGain.gain.setValueAtTime(0, ctx.currentTime)
    toneGain.gain.linearRampToValueAtTime(signalVol, ctx.currentTime + 0.3)
    toneGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.2)

    // Base frequency uniquely linked to the digit
    const digitNum = parseInt(word, 10) || 5
    toneOsc.frequency.setValueAtTime(320 + digitNum * 80, ctx.currentTime)
    toneOsc.type = 'triangle'

    toneOsc.connect(toneGain)
    toneGain.connect(ctx.destination)
    toneOsc.start(ctx.currentTime + 0.3)
    toneOsc.stop(ctx.currentTime + 1.2)

    // Also speak the digit using browser speech synthesis with slightly ducked volume
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(word)
      utterance.rate = 1.0
      utterance.volume = Math.min(1.0, signalVol * 4)
      utterance.lang = 'en-US'
      setTimeout(() => {
        window.speechSynthesis.speak(utterance)
      }, 350)
    }

    setTimeout(() => {
      setIsPlayingAudio(false)
    }, 1800)
  }

  const handleStart = () => {
    setTrialIdx(0)
    setCorrectCount(0)
    setLowestPassingSnr(6)
    setIsFinished(false)
    setIsActive(true)
    playTrialAudio(SNR_TRIALS[0].targetWord, SNR_TRIALS[0].snrDb)
  }

  const handleSelectChoice = (choice: string) => {
    const current = SNR_TRIALS[trialIdx]
    const isCorrect = choice === current.targetWord

    let nextCorrect = correctCount
    let nextLowest = lowestPassingSnr
    if (isCorrect) {
      nextCorrect++
      nextLowest = Math.min(nextLowest, current.snrDb)
      setCorrectCount(nextCorrect)
      setLowestPassingSnr(nextLowest)
    }

    if (trialIdx + 1 < SNR_TRIALS.length) {
      const nextIdx = trialIdx + 1
      setTrialIdx(nextIdx)
      setTimeout(() => {
        playTrialAudio(SNR_TRIALS[nextIdx].targetWord, SNR_TRIALS[nextIdx].snrDb)
      }, 600)
    } else {
      setIsActive(false)
      setIsFinished(true)
    }
  }

  const handleFinish = () => {
    let category = t.normGood
    if (lowestPassingSnr <= -3) category = t.normOptimal
    else if (lowestPassingSnr >= 3) category = t.normSub

    onComplete({
      summary: `${t.srtResult}: ${lowestPassingSnr} ${t.db} (${category}). ${correctCount}/${SNR_TRIALS.length} correct.`,
      metrics: {
        srt_snr_db: lowestPassingSnr,
        correct_count: correctCount,
        total_trials: SNR_TRIALS.length,
        status_category: category,
      },
    })
  }

  const current = SNR_TRIALS[trialIdx]

  return (
    <div className="flex flex-col items-center max-w-xl mx-auto w-full select-none">
      <div className="w-full flex items-center justify-between mb-4">
        <Badge variant="cyan" className="gap-1">
          <Headphones className="w-3 h-3" />
          <span>{t.standard}</span>
        </Badge>
        {isActive && (
          <span className="text-xs font-mono text-zinc-500">
            {t.trial} {trialIdx + 1} / {SNR_TRIALS.length} ({current.snrDb} {t.db})
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
          <Button variant="emerald" size="lg" onClick={handleStart} className="gap-2">
            <Play className="w-4 h-4" />
            <span>{t.startBtn}</span>
          </Button>
        </div>
      )}

      {isActive && (
        <div className="w-full flex flex-col items-center">
          <div className="w-full h-44 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col items-center justify-center p-6 shadow-xl mb-6">
            <div className={`p-4 rounded-full bg-cyan-500/10 text-cyan-500 mb-3 ${isPlayingAudio ? 'animate-bounce' : ''}`}>
              <Volume2 className="w-8 h-8" />
            </div>
            <div className="text-xs text-zinc-500 font-mono mb-2">
              {t.snr} <span className="font-bold text-zinc-800 dark:text-zinc-200">{current.snrDb} {t.db}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={isPlayingAudio}
              onClick={() => playTrialAudio(current.targetWord, current.snrDb)}
              className="text-xs gap-1"
            >
              <span>{t.listenAgain}</span>
            </Button>
          </div>

          <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-4">{t.instruction}</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-md mb-6">
            {current.options.map((opt) => (
              <button
                key={opt}
                onClick={() => handleSelectChoice(opt)}
                className="h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-600 text-2xl font-mono font-bold transition-all shadow-sm active:scale-95 text-zinc-900 dark:text-zinc-100"
              >
                {opt}
              </button>
            ))}
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
            <div className="text-xs text-zinc-500 mb-1">{t.srtResult}</div>
            <div className="text-4xl font-black text-emerald-500 font-mono">
              {lowestPassingSnr} <span className="text-base font-normal text-zinc-400">{t.db}</span>
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
