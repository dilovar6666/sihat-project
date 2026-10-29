import React, { useState, useRef, useEffect } from 'react'
import { Headphones, Volume2, VolumeX, Award, CheckCircle, RotateCcw, Play, Delete } from 'lucide-react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { shuffleArray, type InteractiveEngineProps } from './engineTypes'
import { usePlatformSettings } from '../../lib/settings'

interface DigitsNoiseTrial {
  id: string
  noise_level: number
  digits: number[]
}

const DIGIT_WORDS: Record<number, { ru: string; en: string; tj: string }> = {
  1: { ru: 'один', en: 'one', tj: 'один' },
  2: { ru: 'два', en: 'two', tj: 'два' },
  3: { ru: 'три', en: 'three', tj: 'три' },
  4: { ru: 'четыре', en: 'four', tj: 'четыре' },
  5: { ru: 'пять', en: 'five', tj: 'пять' },
  6: { ru: 'шесть', en: 'six', tj: 'шесть' },
  7: { ru: 'семь', en: 'seven', tj: 'семь' },
  8: { ru: 'восемь', en: 'eight', tj: 'восемь' },
  9: { ru: 'девять', en: 'nine', tj: 'девять' },
}

function buildFallbackDigitsNoise(): DigitsNoiseTrial[] {
  const trials: DigitsNoiseTrial[] = []
  let n = 0
  for (const level of [1, 2, 3, 4, 5]) {
    for (let k = 0; k < 2; k++) {
      n += 1
      trials.push({
        id: `d${n}`,
        noise_level: level,
        digits: shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 3),
      })
    }
  }
  return trials
}

export const SpeechInNoiseEngine: React.FC<InteractiveEngineProps> = ({
  lang,
  challenge,
  onComplete,
  onRequestNewTask,
}) => {
  const [trials, setTrials] = useState<DigitsNoiseTrial[]>(() =>
    Array.isArray(challenge?.trials) && challenge.trials.length > 0
      ? (challenge.trials as DigitsNoiseTrial[])
      : buildFallbackDigitsNoise()
  )
  const [trialIdx, setTrialIdx] = useState(0)
  const [platformSettings, updatePlatformSetting] = usePlatformSettings()
  const [enteredDigits, setEnteredDigits] = useState<number[]>([])
  const [isActive, setIsActive] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)

  const audioCtxRef = useRef<AudioContext | null>(null)
  const noiseSourceRef = useRef<AudioBufferSourceNode | null>(null)
  const stopTimerRef = useRef<number | null>(null)
  const answersRef = useRef<Array<{ id: string; answer: number[] }>>([])
  const usedChallengeRef = useRef(false)

  useEffect(() => {
    if (Array.isArray(challenge?.trials) && challenge.trials.length > 0 && !isActive && !isFinished) {
      setTrials(challenge.trials as DigitsNoiseTrial[])
      usedChallengeRef.current = false
    }
  }, [challenge, isActive, isFinished])

  const stopAudio = () => {
    if (stopTimerRef.current) window.clearTimeout(stopTimerRef.current)
    try {
      noiseSourceRef.current?.stop()
      noiseSourceRef.current?.disconnect()
    } catch {
      // ignore
    }
    noiseSourceRef.current = null
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    setIsPlayingAudio(false)
  }

  useEffect(() => {
    return () => stopAudio()
  }, [])

  const currentTrial = trials[trialIdx]

  const t = {
    ru: {
      title: 'Распознавание речи среди шума (Тройки цифр)',
      subtitle: 'Прослушайте 3 цифры на фоне маскирующего шума (уровень шума возрастает от 1 до 5) и введите услышанную тройку.',
      standard: 'Digits-in-Noise (DIN) • Помехоустойчивость слуха',
      instruction: 'Введите 3 услышанные цифры (1–9):',
      listenAgain: 'Прослушать тройку ещё раз',
      startBtn: 'Начать проверку (10 троек)',
      trial: 'Проба',
      noiseLevel: 'Уровень шума:',
      submitTriplet: 'Подтвердить тройку',
      finishTitle: 'Распознавание речи в шуме завершено',
      digitsCorrectLabel: 'Распознано цифр',
      tripletsLabel: 'Полных троек',
      finishBtn: 'Показать подробный отчёт',
      tryAgain: 'Новый вариант',
    },
    tj: {
      title: 'Шинохти нутқ дар садои бегона (Сегонаи рақамҳо)',
      subtitle: '3 рақамро дар заминаи садои бегона гӯш кунед (сатҳи садо аз 1 то 5 меафзояд) ва онҳоро ворид намоед.',
      standard: 'Digits-in-Noise (DIN) • Фаҳмоии нутқ дар садо',
      instruction: '3 рақами шунидаатонро ворид кунед (1–9):',
      listenAgain: 'Такрори садо',
      startBtn: 'Оғози санҷиш (10 сегона)',
      trial: 'Кӯшиш',
      noiseLevel: 'Сатҳи садо:',
      submitTriplet: 'Тасдиқи сегона',
      finishTitle: 'Санҷиши фаҳмоии нутқ анҷом ёфт',
      digitsCorrectLabel: 'Рақамҳои дуруст',
      tripletsLabel: 'Сегонаҳои пурра',
      finishBtn: 'Дидани ҳисоботи муфассал',
      tryAgain: 'Варианти нав',
    },
    en: {
      title: 'Speech-in-Noise (Digit Triplets)',
      subtitle: 'Listen to 3 digits spoken over background masking noise (noise level rises from 1 to 5) and enter the triplet.',
      standard: 'Digits-in-Noise (DIN) • Speech Intelligibility in Noise',
      instruction: 'Enter the 3 digits you heard (1–9):',
      listenAgain: 'Replay Triplet Audio',
      startBtn: 'Start Screening (10 Triplets)',
      trial: 'Trial',
      noiseLevel: 'Noise Level:',
      submitTriplet: 'Submit Triplet',
      finishTitle: 'Speech-in-Noise Completed',
      digitsCorrectLabel: 'Digits Correct',
      tripletsLabel: 'Exact Triplets',
      finishBtn: 'View Detailed Report',
      tryAgain: 'New Variant',
    },
  }[lang]

  const playTripletAudio = (trial?: DigitsNoiseTrial) => {
    const tr = trial || currentTrial
    if (!tr) return
    stopAudio()
    if (!platformSettings.soundEnabled) return
    setIsPlayingAudio(true)

    try {
      const AudioCtx =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx()
      }
      const ctx = audioCtxRef.current
      if (ctx.state === 'suspended') void ctx.resume()

      const durationSec = 2.6
      const bufferSize = Math.floor(ctx.sampleRate * durationSec)
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = noiseBuffer.getChannelData(0)
      const noiseAmp = 0.04 + tr.noise_level * 0.045
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * noiseAmp
      }

      const noiseSource = ctx.createBufferSource()
      noiseSource.buffer = noiseBuffer

      const filter = ctx.createBiquadFilter()
      filter.type = 'bandpass'
      filter.frequency.value = 950
      filter.Q.value = 0.75

      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0.01, ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0.28, ctx.currentTime + 0.1)
      gain.gain.setValueAtTime(0.28, ctx.currentTime + durationSec - 0.2)
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + durationSec)

      noiseSource.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)
      noiseSource.start()
      noiseSourceRef.current = noiseSource

      if ('speechSynthesis' in window) {
        const text = tr.digits
          .map((d) => (lang === 'en' ? DIGIT_WORDS[d]?.en : DIGIT_WORDS[d]?.ru) || String(d))
          .join(', ')
        const utt = new SpeechSynthesisUtterance(text)
        utt.lang = lang === 'en' ? 'en-US' : 'ru-RU'
        utt.rate = 0.9
        utt.volume = Math.max(0.2, 1.0 - (tr.noise_level - 1) * 0.16)
        window.speechSynthesis.speak(utt)
      }
    } catch {
      // ignore audio error in headless browser
    }

    stopTimerRef.current = window.setTimeout(() => {
      stopAudio()
    }, 2650)
  }

  const handleStart = (requestFresh = false) => {
    if (requestFresh && onRequestNewTask) {
      onRequestNewTask()
    }
    let nextTrials = trials
    if (!usedChallengeRef.current && Array.isArray(challenge?.trials) && challenge.trials.length > 0) {
      nextTrials = challenge.trials as DigitsNoiseTrial[]
      setTrials(nextTrials)
      usedChallengeRef.current = true
    } else {
      nextTrials = buildFallbackDigitsNoise()
      setTrials(nextTrials)
    }

    answersRef.current = []
    setTrialIdx(0)
    setEnteredDigits([])
    setIsFinished(false)
    setIsActive(true)
    setTimeout(() => playTripletAudio(nextTrials[0]), 250)
  }

  const submitCurrentTriplet = (digitsToSubmit?: number[]) => {
    const given = digitsToSubmit || enteredDigits
    if (!isActive || isFinished || !currentTrial || given.length !== 3) return
    stopAudio()

    answersRef.current.push({
      id: currentTrial.id,
      answer: given,
    })

    if (trialIdx + 1 < trials.length) {
      const nextIdx = trialIdx + 1
      setTrialIdx(nextIdx)
      setEnteredDigits([])
      setTimeout(() => playTripletAudio(trials[nextIdx]), 250)
    } else {
      setIsActive(false)
      setIsFinished(true)
    }
  }

  const handleDigitClick = (num: number) => {
    if (!isActive || isFinished) return
    setEnteredDigits((prev) => (prev.length < 3 ? [...prev, num] : prev))
  }

  // Keyboard support
  useEffect(() => {
    if (!isActive || isFinished) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '1' && e.key <= '9') {
        e.preventDefault()
        setEnteredDigits((prev) => (prev.length < 3 ? [...prev, Number(e.key)] : prev))
      } else if (e.key === 'Backspace') {
        e.preventDefault()
        setEnteredDigits((prev) => prev.slice(0, -1))
      } else if (e.key === 'Enter' && enteredDigits.length === 3) {
        e.preventDefault()
        submitCurrentTriplet(enteredDigits)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  const computeSummary = () => {
    let digitsOk = 0
    let exact = 0
    const perLevel: Record<number, [number, number]> = {}

    for (const tr of trials) {
      const given = answersRef.current.find((a) => a.id === tr.id)?.answer || []
      let matches = 0
      for (let i = 0; i < 3; i++) {
        if (given[i] === tr.digits[i]) matches += 1
      }
      digitsOk += matches
      if (matches === 3 && given.length === 3) exact += 1
      const bucket = perLevel[tr.noise_level] || [0, 0]
      bucket[0] += matches
      bucket[1] += 3
      perLevel[tr.noise_level] = bucket
    }
    const totalDigits = trials.length * 3
    const accuracyPct = Number(((digitsOk / Math.max(1, totalDigits)) * 100).toFixed(1))
    const byNoise = Object.entries(perLevel).map(([lvl, [c, ofCount]]) => ({
      noise_level: Number(lvl),
      correct: c,
      of: ofCount,
    }))
    return { digitsOk, totalDigits, exact, totalTriplets: trials.length, accuracyPct, byNoise }
  }

  const handleFinish = () => {
    const s = computeSummary()
    onComplete({
      summary: `${t.digitsCorrectLabel}: ${s.digitsOk}/${s.totalDigits} (${s.accuracyPct}%)`,
      metrics: {
        version: 2,
        engine: 'digits_noise',
        metrics: {
          digits_correct: s.digitsOk,
          digits_total: s.totalDigits,
          triplets_exact: s.exact,
          triplets_total: s.totalTriplets,
          accuracy_pct: s.accuracyPct,
        },
        series: {
          by_noise: s.byNoise,
        },
      },
      telemetry: {
        answers: answersRef.current,
      },
    })
  }

  const summaryStats = isFinished ? computeSummary() : null

  return (
    <div className="flex flex-col items-center max-w-xl mx-auto w-full select-none">
      <div className="w-full flex items-center justify-between gap-2 mb-4">
        <Badge variant="cyan" className="gap-1.5 py-1.5 px-3">
          <Headphones className="w-3.5 h-3.5 text-cyan-500" />
          <span className="truncate">{t.standard}</span>
        </Badge>
        {isActive && currentTrial && (
          <span className="text-xs font-mono text-zinc-500">
            {t.trial} {trialIdx + 1}/{trials.length} • {t.noiseLevel}{' '}
            <strong className="text-emerald-500">{currentTrial.noise_level}/5</strong>
          </span>
        )}
      </div>

      {!platformSettings.soundEnabled && (
        <div className="w-full mb-4 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs flex items-center justify-between gap-3 text-left">
          <div className="flex items-center gap-2.5">
            <VolumeX className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              {lang === 'tj'
                ? 'Садо дар танзимоти платформа хомӯш карда шудааст'
                : lang === 'en'
                ? 'Audio is disabled in platform settings'
                : 'Звуковое сопровождение отключено в настройках профиля'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => updatePlatformSetting('soundEnabled', true)}
            className="px-3 py-1 text-[11px] font-bold bg-amber-500 text-slate-950 rounded-lg hover:bg-amber-400 transition-colors shrink-0 cursor-pointer"
          >
            {lang === 'tj' ? 'Фаъол кардан' : lang === 'en' ? 'Enable' : 'Включить'}
          </button>
        </div>
      )}
      {!isActive && !isFinished && (
        <div className="w-full rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col items-center justify-center p-8 text-center shadow-md">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-500 mb-4 border border-cyan-500/20">
            <Headphones className="w-8 h-8" />
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
        <div
          data-din-trial={currentTrial.id}
          data-din-digits={currentTrial.digits.join(',')}
          className="w-full flex flex-col items-center"
        >
          <div className="w-full p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col items-center justify-center shadow-lg mb-5">
            <button
              type="button"
              onClick={() => playTripletAudio(currentTrial)}
              className={`w-18 h-18 rounded-full flex items-center justify-center mb-3 transition-all cursor-pointer ${
                isPlayingAudio
                  ? 'bg-emerald-500 text-white ring-8 ring-emerald-500/25'
                  : 'bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500 hover:text-white border border-emerald-500/40'
              }`}
            >
              <Volume2 className="w-8 h-8" />
            </button>
            <button
              type="button"
              onClick={() => playTripletAudio(currentTrial)}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer mb-4"
            >
              {t.listenAgain}
            </button>

            <div className="text-xs text-zinc-500 mb-2">{t.instruction}</div>
            <div className="flex items-center gap-3">
              {[0, 1, 2].map((pos) => (
                <div
                  key={pos}
                  className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border-2 border-zinc-300 dark:border-zinc-700 flex items-center justify-center text-2xl font-mono font-black text-zinc-900 dark:text-zinc-100"
                >
                  {enteredDigits[pos] ?? '•'}
                </div>
              ))}
            </div>
          </div>

          <div className="w-full max-w-xs">
            <div className="grid grid-cols-3 gap-2.5 mb-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  data-din-key={num}
                  onClick={() => handleDigitClick(num)}
                  className="h-13 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-500 hover:text-white text-xl font-mono font-bold text-zinc-900 dark:text-zinc-100 transition-all active:scale-95 cursor-pointer"
                >
                  {num}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setEnteredDigits((prev) => prev.slice(0, -1))}
                className="h-12 rounded-2xl bg-zinc-200/70 dark:bg-zinc-800 hover:bg-rose-500 hover:text-white flex items-center justify-center gap-1.5 text-xs font-bold cursor-pointer"
              >
                <Delete className="w-4 h-4" />
                <span>Стереть</span>
              </button>
              <Button
                variant="emerald"
                disabled={enteredDigits.length !== 3}
                onClick={() => submitCurrentTriplet(enteredDigits)}
                className="h-12 rounded-2xl font-bold text-xs cursor-pointer"
              >
                {t.submitTriplet}
              </Button>
            </div>
          </div>
        </div>
      )}

      {isFinished && summaryStats && (
        <div className="w-full rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 text-center shadow-xl">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-4">
            <Award className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">{t.finishTitle}</h3>

          <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto my-6">
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700">
              <div className="text-xs text-zinc-500 mb-1">{t.digitsCorrectLabel}</div>
              <div className="text-3xl font-black text-emerald-500 font-mono">
                {summaryStats.digitsOk}/{summaryStats.totalDigits}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700">
              <div className="text-xs text-zinc-500 mb-1">{t.tripletsLabel}</div>
              <div className="text-3xl font-black text-cyan-500 font-mono">
                {summaryStats.exact}/{summaryStats.totalTriplets}
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
