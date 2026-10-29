import React, { useState, useRef, useEffect } from 'react'
import { Volume2, VolumeX, Play, RotateCcw, CheckCircle, Sparkles } from 'lucide-react'
import { Button } from '../ui/Button'
import { shuffleArray, type InteractiveEngineProps } from './engineTypes'
import { usePlatformSettings } from '../../lib/settings'

interface SoundTrial {
  id: string
  freq_a: number
  freq_b: number
  tone_ms?: number
  gap_ms?: number
}

const DELTAS_PCT = [9.0, 6.0, 4.0, 2.8, 1.8, 1.2]

function buildFallbackSoundTrials(): SoundTrial[] {
  const specs: Array<{ delta: number; kind: 'higher' | 'lower' | 'same' }> = []
  for (const d of DELTAS_PCT) {
    specs.push({ delta: d, kind: 'higher' })
    specs.push({ delta: d, kind: 'lower' })
  }
  specs.push({ delta: 0, kind: 'same' }, { delta: 0, kind: 'same' })
  const shuffled = shuffleArray(specs)
  return shuffled.map((sp, i) => {
    const base = 500 + Math.floor(Math.random() * 110) * 10
    let second = base
    if (sp.kind === 'higher') second = Math.round(base * (1 + sp.delta / 100))
    else if (sp.kind === 'lower') second = Math.round(base * (1 - sp.delta / 100))
    return {
      id: `s${i + 1}`,
      freq_a: base,
      freq_b: second,
      tone_ms: 650,
      gap_ms: 450,
    }
  })
}

export const SoundComparisonEngine: React.FC<InteractiveEngineProps> = ({
  lang,
  challenge,
  onComplete,
  onRequestNewTask,
}) => {
  const [trials, setTrials] = useState<SoundTrial[]>(() =>
    Array.isArray(challenge?.trials) && challenge.trials.length > 0
      ? (challenge.trials as Array<{ id?: string; trial?: number; freq_a: number; freq_b: number; tone_ms?: number; gap_ms?: number }>).map(
          (tr, idx) => ({
            id: tr.id || `s${tr.trial || idx + 1}`,
            freq_a: tr.freq_a,
            freq_b: tr.freq_b,
            tone_ms: tr.tone_ms || 650,
            gap_ms: tr.gap_ms || 450,
          })
        )
      : buildFallbackSoundTrials()
  )
  const [currentIdx, setCurrentIdx] = useState(0)
  const [platformSettings, updatePlatformSetting] = usePlatformSettings()
  const [isPlaying, setIsPlaying] = useState(false)
  const [isActive, setIsActive] = useState(false)
  const [isFinished, setIsFinished] = useState(false)

  const audioCtxRef = useRef<AudioContext | null>(null)
  const answersRef = useRef<Array<{ id: string; answer: 'higher' | 'lower' | 'same' }>>([])
  const usedChallengeRef = useRef(false)

  useEffect(() => {
    if (Array.isArray(challenge?.trials) && challenge.trials.length > 0 && !isActive && !isFinished) {
      setTrials(
        (challenge.trials as Array<{ id?: string; trial?: number; freq_a: number; freq_b: number; tone_ms?: number; gap_ms?: number }>).map(
          (tr, idx) => ({
            id: tr.id || `s${tr.trial || idx + 1}`,
            freq_a: tr.freq_a,
            freq_b: tr.freq_b,
            tone_ms: tr.tone_ms || 650,
            gap_ms: tr.gap_ms || 450,
          })
        )
      )
      usedChallengeRef.current = false
    }
  }, [challenge, isActive, isFinished])

  const currentTrial = trials[currentIdx]

  const t = {
    ru: {
      title: 'Сравнение звуков (Различение высоты тона)',
      subtitle: 'Прослушайте пару чистых тонов и определите, стал ли второй тон выше, ниже или остался таким же по высоте.',
      startBtn: 'Начать проверку слуха',
      playTones: 'Воспроизвести пару тонов',
      playing: 'Звучит пара тонов...',
      question: 'Второй тон по сравнению с первым:',
      higher: 'Выше ↑',
      same: 'Такой же =',
      lower: 'Ниже ↓',
      volumeNotice: 'Рекомендуется использовать наушники на комфортной громкости (40–60%).',
      trialOf: 'Проба',
      of: 'из',
      tryAgain: 'Новый вариант',
      saveBtn: 'Показать подробный отчёт',
      finishTitle: 'Сравнение звуков завершено!',
    },
    tj: {
      title: 'Муқоисаи овозҳо (Фарқкунии баландии садо)',
      subtitle: 'Ду садои кӯтоҳро гӯш кунед ва муайян намоед, ки садои дуюм баландтар, пасттар ё якхела буд.',
      startBtn: 'Оғози санҷиши шунавоӣ',
      playTones: 'Пахши ҷуфти овозҳо',
      playing: 'Дар ҳоли пахш...',
      question: 'Овози дуюм нисбат ба аввал:',
      higher: 'Баландтар ↑',
      same: 'Якхела =',
      lower: 'Пасттар ↓',
      volumeNotice: 'Гӯшмонакҳоро дар сатҳи бехатари овоз истифода баред.',
      trialOf: 'Кӯшиши',
      of: 'аз',
      tryAgain: 'Варианти нав',
      saveBtn: 'Дидани ҳисоботи муфассал',
      finishTitle: 'Санҷиши муқоисаи овозҳо анҷом ёфт!',
    },
    en: {
      title: 'Sound Pitch Comparison',
      subtitle: 'Listen to two pure tones and judge whether the second tone is higher, lower, or identical in pitch.',
      startBtn: 'Start Pitch Comparison',
      playTones: 'Play Tone Pair',
      playing: 'Playing tone pair...',
      question: 'Compared to the first tone, the second tone was:',
      higher: 'Higher ↑',
      same: 'Same =',
      lower: 'Lower ↓',
      volumeNotice: 'Headphones at a comfortable volume (40–60%) are recommended.',
      trialOf: 'Trial',
      of: 'of',
      tryAgain: 'New Variant',
      saveBtn: 'View Detailed Report',
      finishTitle: 'Sound Pitch Comparison Completed!',
    },
  }[lang]

  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioCtx =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      audioCtxRef.current = new AudioCtx()
    }
    if (audioCtxRef.current.state === 'suspended') {
      void audioCtxRef.current.resume()
    }
    return audioCtxRef.current
  }

  const playTone = (freq: number, startTime: number, durationSec: number) => {
    if (!platformSettings.soundEnabled) return
    try {
      const ctx = getAudioContext()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, startTime)
      gain.gain.setValueAtTime(0.001, startTime)
      gain.gain.exponentialRampToValueAtTime(0.15, startTime + 0.04)
      gain.gain.setValueAtTime(0.15, startTime + durationSec - 0.04)
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + durationSec)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(startTime)
      osc.stop(startTime + durationSec)
    } catch {
      // Audio context unavailable in headless env
    }
  }

  const playTrialTones = (trial?: SoundTrial) => {
    const tr = trial || currentTrial
    if (!tr || isPlaying) return
    setIsPlaying(true)
    const toneSec = (tr.tone_ms || 650) / 1000
    const gapSec = (tr.gap_ms || 450) / 1000
    try {
      const ctx = getAudioContext()
      const now = ctx.currentTime
      playTone(tr.freq_a, now + 0.08, toneSec)
      playTone(tr.freq_b, now + 0.08 + toneSec + gapSec, toneSec)
    } catch {
      // ignore audio error in headless browser
    }
    setTimeout(() => {
      setIsPlaying(false)
    }, Math.round((toneSec * 2 + gapSec + 0.15) * 1000))
  }

  const handleStart = (requestFresh = false) => {
    if (requestFresh && onRequestNewTask) {
      onRequestNewTask()
    }
    let nextTrials = trials
    if (!usedChallengeRef.current && Array.isArray(challenge?.trials) && challenge.trials.length > 0) {
      nextTrials = (challenge.trials as Array<{ id?: string; trial?: number; freq_a: number; freq_b: number; tone_ms?: number; gap_ms?: number }>).map(
        (tr, idx) => ({
          id: tr.id || `s${tr.trial || idx + 1}`,
          freq_a: tr.freq_a,
          freq_b: tr.freq_b,
          tone_ms: tr.tone_ms || 650,
          gap_ms: tr.gap_ms || 450,
        })
      )
      setTrials(nextTrials)
      usedChallengeRef.current = true
    } else {
      nextTrials = buildFallbackSoundTrials()
      setTrials(nextTrials)
    }

    answersRef.current = []
    setCurrentIdx(0)
    setIsFinished(false)
    setIsActive(true)
    setTimeout(() => playTrialTones(nextTrials[0]), 200)
  }

  const handleSelectChoice = (choice: 'higher' | 'lower' | 'same') => {
    if (!isActive || isFinished || !currentTrial) return
    answersRef.current.push({ id: currentTrial.id, answer: choice })

    if (currentIdx + 1 < trials.length) {
      const nextIdx = currentIdx + 1
      setCurrentIdx(nextIdx)
      setTimeout(() => playTrialTones(trials[nextIdx]), 250)
    } else {
      setIsFinished(true)
    }
  }

  const handleSave = () => {
    let correct = 0
    let sameOk = 0
    let sameTotal = 0
    for (const tr of trials) {
      const truth: 'higher' | 'lower' | 'same' =
        tr.freq_b > tr.freq_a ? 'higher' : tr.freq_b < tr.freq_a ? 'lower' : 'same'
      const given = answersRef.current.find((a) => a.id === tr.id)?.answer
      if (truth === 'same') {
        sameTotal += 1
        if (given === 'same') sameOk += 1
      }
      if (given === truth) correct += 1
    }
    const total = trials.length
    const accuracyPct = Number(((correct / Math.max(1, total)) * 100).toFixed(1))

    onComplete({
      summary: `${t.finishTitle} (${correct}/${total}, ${accuracyPct}%)`,
      metrics: {
        version: 2,
        engine: 'sound_compare',
        metrics: {
          correct_count: correct,
          total_trials: total,
          accuracy_pct: accuracyPct,
          smallest_reliable_delta_pct: null,
          same_pairs_correct: sameOk,
          same_pairs_total: sameTotal,
        },
        series: {
          by_delta: [],
        },
      },
      telemetry: {
        answers: answersRef.current,
      },
    })
  }

  return (
    <div className="space-y-6 max-w-xl mx-auto text-center select-none">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100 flex items-center justify-center gap-2">
          <Volume2 className="w-6 h-6 text-emerald-500" />
          <span>{t.title}</span>
        </h2>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-md mx-auto leading-relaxed">
          {t.subtitle}
        </p>

      </div>

      {!platformSettings.soundEnabled && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs flex items-center justify-between gap-3 text-left max-w-md mx-auto w-full">
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

      {!isActive ? (
        <div className="p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-center space-y-5 shadow-md">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 text-emerald-500 mx-auto flex items-center justify-center border border-emerald-500/30">
            <Sparkles className="w-8 h-8" />
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">{t.volumeNotice}</p>
          <Button
            size="lg"
            variant="emerald"
            onClick={() => handleStart(false)}
            className="gap-2 px-8 py-3.5 text-base font-bold cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>{t.startBtn}</span>
          </Button>
        </div>
      ) : !isFinished && currentTrial ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-500 px-2">
            <span>
              {t.trialOf} {currentIdx + 1} {t.of} {trials.length}
            </span>
            <span className="text-emerald-500 font-bold">
              {Math.round(((currentIdx + 1) / trials.length) * 100)}%
            </span>
          </div>

          <div
            data-sound-trial={currentTrial.id}
            data-freq-a={currentTrial.freq_a}
            data-freq-b={currentTrial.freq_b}
            className="p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-4 text-center shadow-lg"
          >
            <button
              type="button"
              onClick={() => playTrialTones(currentTrial)}
              disabled={isPlaying}
              className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center transition-all duration-200 shadow-xl cursor-pointer ${
                isPlaying
                  ? 'bg-emerald-500 text-white scale-105 shadow-emerald-500/40'
                  : 'bg-emerald-500/15 text-emerald-500 border-2 border-emerald-500/50 hover:bg-emerald-500 hover:text-white active:scale-95'
              }`}
            >
              <Volume2 className="w-10 h-10" />
            </button>
            <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
              {isPlaying ? t.playing : t.playTones}
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-xs font-medium text-zinc-500">{t.question}</div>
            <div className="grid grid-cols-3 gap-3">
              <Button
                variant="outline"
                data-sound-choice="higher"
                onClick={() => handleSelectChoice('higher')}
                className="py-3 text-xs sm:text-sm font-bold cursor-pointer"
              >
                {t.higher}
              </Button>
              <Button
                variant="outline"
                data-sound-choice="same"
                onClick={() => handleSelectChoice('same')}
                className="py-3 text-xs sm:text-sm font-bold cursor-pointer"
              >
                {t.same}
              </Button>
              <Button
                variant="outline"
                data-sound-choice="lower"
                onClick={() => handleSelectChoice('lower')}
                className="py-3 text-xs sm:text-sm font-bold cursor-pointer"
              >
                {t.lower}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-3xl border border-emerald-500/30 bg-white dark:bg-zinc-900 space-y-4 shadow-lg">
          <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
          <div className="text-base font-bold text-zinc-900 dark:text-zinc-100">{t.finishTitle}</div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button variant="outline" size="sm" onClick={() => handleStart(true)} className="gap-1.5 cursor-pointer">
              <RotateCcw className="w-4 h-4" />
              <span>{t.tryAgain}</span>
            </Button>
            <Button variant="emerald" size="sm" onClick={handleSave} className="gap-1.5 font-bold cursor-pointer">
              <CheckCircle className="w-4 h-4" />
              <span>{t.saveBtn}</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
