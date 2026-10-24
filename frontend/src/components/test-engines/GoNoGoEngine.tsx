import React, { useState, useEffect, useRef } from 'react'
import { Crosshair, Play, RotateCcw, CheckCircle } from 'lucide-react'
import { Button } from '../ui/Button'
import type { Language } from '../../i18n'

interface GoNoGoEngineProps {
  lang: Language
  challenge?: Record<string, unknown> | null
  onComplete: (result: { summary: string; metrics: Record<string, unknown> }) => void
}

interface GoNoGoItem {
  id: number
  type: 'go' | 'no-go'
  delay_ms: number
}

const DEFAULT_SEQUENCE: GoNoGoItem[] = [
  { id: 1, type: 'go', delay_ms: 1200 },
  { id: 2, type: 'go', delay_ms: 1000 },
  { id: 3, type: 'no-go', delay_ms: 1400 },
  { id: 4, type: 'go', delay_ms: 1100 },
  { id: 5, type: 'go', delay_ms: 1300 },
  { id: 6, type: 'no-go', delay_ms: 1200 },
  { id: 7, type: 'go', delay_ms: 1000 },
  { id: 8, type: 'go', delay_ms: 1100 },
  { id: 9, type: 'no-go', delay_ms: 1400 },
  { id: 10, type: 'go', delay_ms: 900 },
  { id: 11, type: 'go', delay_ms: 1200 },
  { id: 12, type: 'no-go', delay_ms: 1300 },
]

export const GoNoGoEngine: React.FC<GoNoGoEngineProps> = ({
  lang,
  challenge,
  onComplete,
}) => {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [stimulusVisible, setStimulusVisible] = useState(false)
  const [currentStimulusType, setCurrentStimulusType] = useState<'go' | 'no-go' | null>(null)
  const [correctGoHits, setCorrectGoHits] = useState(0)
  const [omissions, setOmissions] = useState(0)
  const [falseAlarms, setFalseAlarms] = useState(0)
  const [latencies, setLatencies] = useState<number[]>([])
  const [hasRespondedCurrent, setHasRespondedCurrent] = useState(false)
  const [isActive, setIsActive] = useState(false)
  const [isFinished, setIsFinished] = useState(false)

  const stimulusStartTimeRef = useRef<number>(0)
  const trialTimerRef = useRef<number | null>(null)
  const blankTimerRef = useRef<number | null>(null)

  const sequence: GoNoGoItem[] =
    challenge && Array.isArray(challenge.sequence) && challenge.sequence.length > 0
      ? (challenge.sequence as GoNoGoItem[])
      : DEFAULT_SEQUENCE

  const t = {
    ru: {
      title: 'Реакция Go / No-Go',
      subtitle: 'Быстро нажимайте на ЗЕЛЕНЫЙ круг (Go) и удерживайтесь от нажатия при появлении КРАСНОГО креста (No-Go).',
      startBtn: 'Начать тест реакции',
      ruleGo: 'ЗЕЛЕНЫЙ КРУГ — Жмите ПРОБЕЛ / Экран',
      ruleNoGo: 'КРАСНЫЙ КРЕСТ — НЕ НАЖИМАЙТЕ!',
      actionPrompt: 'ЖМИ!',
      waitPrompt: 'ОЖИДАНИЕ СТИМУЛА...',
      hits: 'Верных нажатий (Go):',
      falseAlarms: 'Ложных тревог (No-Go):',
      omissions: 'Пропусков:',
      finishTitle: 'Тест Go/No-Go успешно завершен!',
      tryAgain: 'Пройти снова',
      saveBtn: 'Завершить и сохранить',
    },
    tj: {
      title: 'Аксуламали Go / No-Go',
      subtitle: 'Ба доираи САБЗ зуд пахш кунед (Go) ва ҳангоми пайдо шудани салиби СУРХ (No-Go) худдорӣ намоед.',
      startBtn: 'Оғози санҷиши аксуламал',
      ruleGo: 'ДОИРАИ САБЗ — Фавран пахш кунед',
      ruleNoGo: 'САЛИБИ СУРХ — ПАХШ НАКУНЕД!',
      actionPrompt: 'ПАХШ КУНЕД!',
      waitPrompt: 'ИНТИЗОРИИ СТИМУЛ...',
      hits: 'Пахшҳои дуруст (Go):',
      falseAlarms: 'Хатои пахш (No-Go):',
      omissions: 'Аз даст додашуда:',
      finishTitle: 'Санҷиши Go/No-Go анҷом ёфт!',
      tryAgain: 'Аз нав гузаштан',
      saveBtn: 'Анҷом ва сабт кардан',
    },
    en: {
      title: 'Go / No-Go Response',
      subtitle: 'Rapidly tap or press SPACE on GREEN circles (Go) and withhold response on RED crosses (No-Go).',
      startBtn: 'Start Go/No-Go Test',
      ruleGo: 'GREEN CIRCLE — Press SPACE / Tap Screen',
      ruleNoGo: 'RED CROSS — DO NOT PRESS!',
      actionPrompt: 'TAP NOW!',
      waitPrompt: 'WAITING FOR STIMULUS...',
      hits: 'Correct Go Hits:',
      falseAlarms: 'False Alarms (No-Go):',
      omissions: 'Omissions:',
      finishTitle: 'Go/No-Go test completed!',
      tryAgain: 'Try Again',
      saveBtn: 'Complete and Save',
    },
  }[lang]

  const handleStart = () => {
    setCurrentIdx(0)
    setCorrectGoHits(0)
    setOmissions(0)
    setFalseAlarms(0)
    setLatencies([])
    setIsFinished(false)
    setIsActive(true)
    startNextTrial(0)
  }

  const startNextTrial = (idx: number) => {
    if (idx >= sequence.length) {
      setIsFinished(true)
      setStimulusVisible(false)
      return
    }

    setStimulusVisible(false)
    setHasRespondedCurrent(false)
    setCurrentStimulusType(null)

    const trial = sequence[idx]

    // Blank foreperiod delay
    blankTimerRef.current = window.setTimeout(() => {
      setCurrentStimulusType(trial.type)
      setStimulusVisible(true)
      stimulusStartTimeRef.current = performance.now()

      // Stimulus presentation window: 800ms
      trialTimerRef.current = window.setTimeout(() => {
        // Window expired
        setStimulusVisible(false)
        if (trial.type === 'go') {
          // If user didn't respond to Go, it's an omission
          setOmissions((o) => o + 1)
        }
        // Advance
        setCurrentIdx(idx + 1)
        startNextTrial(idx + 1)
      }, 750)
    }, trial.delay_ms)
  }

  const handleResponse = () => {
    if (!isActive || isFinished || !stimulusVisible || hasRespondedCurrent) return
    setHasRespondedCurrent(true)
    const rt = performance.now() - stimulusStartTimeRef.current

    if (currentStimulusType === 'go') {
      setCorrectGoHits((h) => h + 1)
      setLatencies((l) => [...l, rt])
    } else if (currentStimulusType === 'no-go') {
      setFalseAlarms((f) => f + 1)
    }

    // Hide immediately upon tap
    setStimulusVisible(false)
    if (trialTimerRef.current) clearTimeout(trialTimerRef.current)

    // Advance
    const nextIdx = currentIdx + 1
    setCurrentIdx(nextIdx)
    startNextTrial(nextIdx)
  }

  // Keyboard space listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        handleResponse()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      if (trialTimerRef.current) clearTimeout(trialTimerRef.current)
      if (blankTimerRef.current) clearTimeout(blankTimerRef.current)
    }
  }, [isActive, isFinished, stimulusVisible, hasRespondedCurrent, currentStimulusType])

  const handleSave = () => {
    const meanRt =
      latencies.length > 0
        ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
        : 300
    const inhibitoryControl = Math.max(0, 100 - falseAlarms * 20)

    onComplete({
      summary: `${t.finishTitle} (Торможение: ${inhibitoryControl}%, Среднее RT: ${meanRt} мс)`,
      metrics: {
        correct_go_hits: correctGoHits,
        omission_errors: omissions,
        false_alarm_nogo: falseAlarms,
        mean_reaction_time_ms: meanRt,
        inhibitory_control_pct: inhibitoryControl,
      },
    })
  }

  return (
    <div className="space-y-6 max-w-xl mx-auto text-center select-none">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100 flex items-center justify-center gap-2">
          <Crosshair className="w-6 h-6 text-emerald-500" />
          <span>{t.title}</span>
        </h2>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-md mx-auto">
          {t.subtitle}
        </p>
      </div>

      {!isActive ? (
        <div className="p-8 rounded-3xl liquid-glass border border-emerald-500/20 text-center space-y-6">
          <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto text-left text-xs font-semibold">
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
              <span className="font-bold block mb-1">🟢 GO:</span>
              <span>{t.ruleGo}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400">
              <span className="font-bold block mb-1">❌ NO-GO:</span>
              <span>{t.ruleNoGo}</span>
            </div>
          </div>
          <Button size="lg" variant="emerald" onClick={handleStart} className="gap-2 px-8 py-3.5 text-base font-bold shadow-lg shadow-emerald-600/30">
            <Play className="w-5 h-5 fill-current" />
            <span>{t.startBtn}</span>
          </Button>
        </div>
      ) : !isFinished ? (
        <div className="space-y-6">
          {/* HUD Progress */}
          <div className="flex items-center justify-between text-xs font-mono text-zinc-500 px-2">
            <span>Стимул: {currentIdx + 1} / {sequence.length}</span>
            <div className="flex items-center gap-3">
              <span className="text-emerald-500">Go: {correctGoHits}</span>
              <span className="text-rose-500">Ошибок: {falseAlarms}</span>
            </div>
          </div>

          {/* Stimulus Presentation Area */}
          <div
            onClick={handleResponse}
            className="h-64 sm:h-72 rounded-3xl liquid-glass border border-emerald-500/20 flex flex-col items-center justify-center cursor-pointer active:scale-[0.99] transition-transform relative overflow-hidden"
          >
            {stimulusVisible && currentStimulusType === 'go' && (
              <div className="w-32 h-32 rounded-full bg-emerald-500 text-white flex items-center justify-center font-black text-2xl shadow-2xl shadow-emerald-500/60 animate-in zoom-in-75 duration-100">
                GO!
              </div>
            )}

            {stimulusVisible && currentStimulusType === 'no-go' && (
              <div className="w-32 h-32 rounded-3xl bg-rose-500 text-white flex items-center justify-center font-black text-4xl shadow-2xl shadow-rose-500/60 animate-in zoom-in-75 duration-100">
                ✕
              </div>
            )}

            {!stimulusVisible && (
              <div className="text-xs font-mono text-zinc-400 animate-pulse">
                {t.waitPrompt}
              </div>
            )}
          </div>

          <div className="text-[11px] text-zinc-400">
            Нажимайте <strong className="text-emerald-500">ПРОБЕЛ</strong> или касайтесь экрана в момент появления зеленого сигнала
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-3xl liquid-glass border border-emerald-500/30 space-y-4 animate-in fade-in duration-300">
          <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
          <div className="text-base font-bold text-zinc-900 dark:text-zinc-100">{t.finishTitle}</div>
          <div className="grid grid-cols-3 gap-2 max-w-sm mx-auto text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800">
              <span className="text-zinc-400 block text-[10px]">Верных Go:</span>
              <strong className="text-emerald-500 text-sm">{correctGoHits}</strong>
            </div>
            <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800">
              <span className="text-zinc-400 block text-[10px]">Ложных No-Go:</span>
              <strong className="text-rose-500 text-sm">{falseAlarms}</strong>
            </div>
            <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800">
              <span className="text-zinc-400 block text-[10px]">Пропусков:</span>
              <strong className="text-amber-500 text-sm">{omissions}</strong>
            </div>
          </div>
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
