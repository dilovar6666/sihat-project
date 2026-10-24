import React, { useState, useRef, useEffect } from 'react'
import { Headphones, Volume2, Award, CheckCircle, RotateCcw, Play } from 'lucide-react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import type { Language } from '../../i18n'

interface TonalAudiometryEngineProps {
  lang: Language
  onComplete: (result: { summary: string; metrics: Record<string, unknown> }) => void
}

const FREQUENCIES = [250, 500, 1000, 2000, 4000, 8000]

export const TonalAudiometryEngine: React.FC<TonalAudiometryEngineProps> = ({ lang, onComplete }) => {
  const [freqIdx, setFreqIdx] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volumeLevel, setVolumeLevel] = useState(0.05) // starting quiet
  const [audiogram, setAudiogram] = useState<Record<number, number>>({})
  const [isActive, setIsActive] = useState(false)
  const [isFinished, setIsFinished] = useState(false)

  const audioCtxRef = useRef<AudioContext | null>(null)
  const oscRef = useRef<OscillatorNode | null>(null)
  const gainRef = useRef<GainNode | null>(null)
  const sweepIntervalRef = useRef<number | null>(null)

  const t = {
    ru: {
      title: 'Тональная аудиометрия (250–8000 Гц)',
      subtitle: 'Компьютерная оценка слухового порога с использованием Web Audio API.',
      standard: 'ISO 8253-1 / Pure Tone Audiometry',
      headphoneAlert: 'Наденьте наушники и выставьте комфортную общую громкость устройства (50%).',
      startBtn: 'Начать аудиометрию',
      playingFreq: 'Частота сигнала:',
      listening: 'Тон плавно нарастает...',
      hearBtn: 'Я слышу тон!',
      hz: 'Гц',
      db: 'дБ HL',
      finishTitle: 'Аудиограмма построена',
      avgThreshold: 'Средний слуховой порог (PTA)',
      normOptimal: 'Нормальный слух (≤ 15 дБ HL)',
      normSlight: 'Легкое снижение (16–25 дБ HL)',
      normModerate: 'Рекомендуется очная аудиометрия (> 25 дБ HL)',
      finishAndSave: 'Завершить и сохранить',
      tryAgain: 'Повторить тест',
    },
    tj: {
      title: 'Аудиометрияи тоналӣ (250–8000 Гц)',
      subtitle: 'Баҳодиҳии компютерии ҳадди шунавоӣ бо истифода аз Web Audio API.',
      standard: 'ISO 8253-1 / Pure Tone Audiometry',
      headphoneAlert: 'Гӯшмонак (наушник) пӯшед ва баландии дастгоҳро дар 50% монед.',
      startBtn: 'Оғози аудиометрия',
      playingFreq: 'Басомади овоз:',
      listening: 'Овоз оҳиста-оҳиста баланд мешавад...',
      hearBtn: 'Ман овозро шунидам!',
      hz: 'Гц',
      db: 'дБ HL',
      finishTitle: 'Аудиограмма омода шуд',
      avgThreshold: 'Ҳадди миёнаи шунавоӣ (PTA)',
      normOptimal: 'Шунавоии комил (≤ 15 дБ HL)',
      normSlight: 'Пастшавии ночиз (16–25 дБ HL)',
      normModerate: 'Машварати табиби лор тавсия мешавад (> 25 дБ HL)',
      finishAndSave: 'Анҷом ва сабт кардан',
      tryAgain: 'Аз нав гузаштан',
    },
    en: {
      title: 'Pure Tone Audiometry (250–8000 Hz)',
      subtitle: 'Pure-tone hearing threshold evaluation using browser Web Audio API.',
      standard: 'ISO 8253-1 Audiometry Standard',
      headphoneAlert: 'Please wear stereo headphones and set system volume to ~50%.',
      startBtn: 'Begin Audiometry Test',
      playingFreq: 'Current Frequency:',
      listening: 'Tone volume is gradually ascending...',
      hearBtn: 'I hear the tone!',
      hz: 'Hz',
      db: 'dB HL',
      finishTitle: 'Audiogram Complete',
      avgThreshold: 'Pure Tone Average (PTA)',
      normOptimal: 'Optimal Hearing (≤ 15 dB HL)',
      normSlight: 'Slight hearing shift (16–25 dB HL)',
      normModerate: 'In-clinic audiogram recommended (> 25 dB HL)',
      finishAndSave: 'Complete & Save',
      tryAgain: 'Retry',
    },
  }[lang]

  const stopCurrentTone = () => {
    if (sweepIntervalRef.current) clearInterval(sweepIntervalRef.current)
    if (oscRef.current) {
      try {
        oscRef.current.stop()
        oscRef.current.disconnect()
      } catch {
        // already stopped
      }
      oscRef.current = null
    }
    setIsPlaying(false)
  }

  const playFrequency = (freq: number) => {
    stopCurrentTone()
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContextClass()
    }
    if (audioCtxRef.current.state === 'suspended') {
      void audioCtxRef.current.resume()
    }

    const ctx = audioCtxRef.current
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, ctx.currentTime)

    // Initial low gain
    let currentVol = 0.005
    gain.gain.setValueAtTime(currentVol, ctx.currentTime)
    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start()
    oscRef.current = osc
    gainRef.current = gain
    setIsPlaying(true)
    setVolumeLevel(currentVol)

    // Gradual volume ramp
    sweepIntervalRef.current = window.setInterval(() => {
      currentVol = Math.min(0.85, currentVol * 1.15)
      setVolumeLevel(currentVol)
      if (gainRef.current && audioCtxRef.current) {
        gainRef.current.gain.setValueAtTime(currentVol, audioCtxRef.current.currentTime)
      }
    }, 450)
  }

  useEffect(() => {
    return () => {
      stopCurrentTone()
      if (audioCtxRef.current) {
        void audioCtxRef.current.close()
      }
    }
  }, [])

  const handleStart = () => {
    setFreqIdx(0)
    setAudiogram({})
    setIsFinished(false)
    setIsActive(true)
    playFrequency(FREQUENCIES[0])
  }

  const handleHearTone = () => {
    const currentFreq = FREQUENCIES[freqIdx]
    // Convert current gain 0.005..0.85 to simulated dB HL (10dB to 55dB)
    const dbHl = Math.round(10 + (volumeLevel / 0.85) * 45)
    const nextMap = { ...audiogram, [currentFreq]: dbHl }
    setAudiogram(nextMap)
    stopCurrentTone()

    if (freqIdx + 1 < FREQUENCIES.length) {
      const nextIdx = freqIdx + 1
      setFreqIdx(nextIdx)
      setTimeout(() => {
        playFrequency(FREQUENCIES[nextIdx])
      }, 700)
    } else {
      setIsActive(false)
      setIsFinished(true)
    }
  }

  const handleFinish = () => {
    // Pure Tone Average of 500, 1000, 2000 Hz
    const ptaValues = [audiogram[500] || 20, audiogram[1000] || 15, audiogram[2000] || 15]
    const pta = Math.round(ptaValues.reduce((a, b) => a + b, 0) / ptaValues.length)

    let category = t.normOptimal
    if (pta > 25) category = t.normModerate
    else if (pta > 15) category = t.normSlight

    onComplete({
      summary: `${t.avgThreshold}: ${pta} ${t.db} (${category}).`,
      metrics: {
        pta_db: pta,
        frequencies: audiogram,
        status_category: category,
      },
    })
  }

  const currentFreq = FREQUENCIES[freqIdx]

  return (
    <div className="flex flex-col items-center max-w-xl mx-auto w-full select-none">
      <div className="w-full flex items-center justify-between mb-4">
        <Badge variant="cyan" className="gap-1">
          <Headphones className="w-3 h-3" />
          <span>{t.standard}</span>
        </Badge>
        {isActive && (
          <span className="text-xs font-mono text-zinc-500">
            {freqIdx + 1} / {FREQUENCIES.length} ({currentFreq} {t.hz})
          </span>
        )}
      </div>

      {!isActive && !isFinished && (
        <div className="w-full rounded-3xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-100/50 dark:bg-zinc-900/40 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-500 mb-4">
            <Headphones className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">{t.title}</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-md mb-2">{t.subtitle}</p>
          <p className="text-xs text-amber-600 dark:text-amber-400 mb-6 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
            {t.headphoneAlert}
          </p>
          <Button variant="emerald" size="lg" onClick={handleStart} className="gap-2">
            <Play className="w-4 h-4" />
            <span>{t.startBtn}</span>
          </Button>
        </div>
      )}

      {isActive && (
        <div className="w-full flex flex-col items-center">
          <div className="w-full h-56 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col items-center justify-center p-6 shadow-xl mb-6 relative overflow-hidden">
            {/* Visualizer wave pulses */}
            <div className="flex items-center gap-2 mb-4 h-12">
              {[0.4, 0.8, 1.2, 0.7, 1.5, 0.9, 0.5].map((scale, i) => (
                <div
                  key={i}
                  className={`w-1.5 rounded-full bg-cyan-500 ${isPlaying ? 'animate-pulse' : 'opacity-30'}`}
                  style={{
                    height: `${Math.min(48, Math.max(8, volumeLevel * 100 * scale))}px`,
                    animationDelay: `${i * 120}ms`,
                  }}
                />
              ))}
            </div>

            <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100 font-mono mb-1">
              {currentFreq} <span className="text-base font-normal text-zinc-400">{t.hz}</span>
            </div>
            <p className="text-xs text-zinc-500">{t.listening}</p>
          </div>

          <Button
            variant="emerald"
            size="lg"
            onClick={handleHearTone}
            className="w-full max-w-sm gap-2 h-16 text-lg font-bold shadow-xl"
          >
            <Volume2 className="w-6 h-6 animate-pulse" />
            <span>{t.hearBtn}</span>
          </Button>
        </div>
      )}

      {isFinished && (
        <div className="w-full rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 text-center shadow-xl">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-4">
            <Award className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">{t.finishTitle}</h3>

          {/* SVG Audiogram Curve */}
          <div className="w-full h-44 my-4 p-2 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between">
            <div className="text-[10px] text-zinc-400 text-left px-2 font-mono">
              Audiogram (dB HL Thresholds)
            </div>
            <div className="flex justify-between items-end h-28 px-4 border-b border-zinc-200 dark:border-zinc-700">
              {FREQUENCIES.map((freq) => {
                const db = audiogram[freq] || 20
                const heightPct = Math.min(100, Math.max(15, (db / 60) * 100))
                return (
                  <div key={freq} className="flex flex-col items-center gap-1">
                    <span className="text-[10px] font-mono text-cyan-500 font-bold">{db}dB</span>
                    <div
                      className="w-4 bg-cyan-500/80 rounded-t-sm transition-all"
                      style={{ height: `${heightPct}%` }}
                    />
                    <span className="text-[10px] text-zinc-400 font-mono mt-1">{freq}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex gap-3 justify-center max-w-sm mx-auto mt-6">
            <Button variant="outline" onClick={handleStart} className="gap-2 flex-1">
              <RotateCcw className="w-4 h-4" />
              <span>{t.tryAgain}</span>
            </Button>
            <Button variant="emerald" onClick={handleFinish} className="gap-2 flex-1">
              <CheckCircle className="w-4 h-4" />
              <span>{t.finishAndSave}</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
