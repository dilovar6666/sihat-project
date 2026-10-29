import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  ArrowRight,
  ShieldCheck,
  Lock,
  Activity,
  Globe,
  Compass,
  CheckCircle2,
  RotateCcw,
  Eye,
  Sparkles,
  Grid,
  Zap,
  Shapes,
} from 'lucide-react'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import { Card } from './ui/Card'
import type { Language, Translations } from '../i18n'
import type { TestItem } from '../types'
import { TestMarquee } from './TestMarquee'
import { shuffleArray } from './test-engines/engineTypes'

interface LandingHeroProps {
  t: Translations
  lang: Language
  tests?: TestItem[]
  onOpenCatalog: () => void
  onOpenMethodology: () => void
  onSelectTest?: (test: TestItem) => void
  onStartScreening: (slug: string) => void
}

type DemoMode = 'schulte' | 'pattern' | 'reaction'

interface PatternDemoQuestion {
  seedId: string
  sequence: { shape: 'circle' | 'square' | 'triangle' | 'diamond'; angle: number; count: number }[]
  options: { id: number; shape: 'circle' | 'square' | 'triangle' | 'diamond'; angle: number; count: number; isCorrect: boolean }[]
}

function generatePatternDemoQuestion(): PatternDemoQuestion {
  const allShapes: ('circle' | 'square' | 'triangle' | 'diamond')[] = ['circle', 'square', 'triangle', 'diamond']
  const startIdx = Math.floor(Math.random() * allShapes.length)
  const stepShape = Math.random() > 0.4 ? 1 : 0
  const startAngle = [0, 45, 90][Math.floor(Math.random() * 3)]
  const stepAngle = [45, 90][Math.floor(Math.random() * 2)]
  const startCount = 1 + Math.floor(Math.random() * 2)
  const stepCount = Math.random() > 0.5 ? 1 : 0

  const sequence = [0, 1, 2, 3].map((i) => ({
    shape: allShapes[(startIdx + i * stepShape) % allShapes.length],
    angle: (startAngle + i * stepAngle) % 360,
    count: ((startCount - 1 + i * stepCount) % 4) + 1,
  }))

  const answer = {
    shape: allShapes[(startIdx + 4 * stepShape) % allShapes.length],
    angle: (startAngle + 4 * stepAngle) % 360,
    count: ((startCount - 1 + 4 * stepCount) % 4) + 1,
  }

  const distractors = [
    {
      shape: allShapes[(startIdx + 4 * stepShape + 1) % allShapes.length],
      angle: answer.angle,
      count: answer.count,
      isCorrect: false,
    },
    {
      shape: answer.shape,
      angle: (answer.angle + 90) % 360,
      count: answer.count,
      isCorrect: false,
    },
    {
      shape: allShapes[(startIdx + 4 * stepShape + 2) % allShapes.length],
      angle: (answer.angle + 45) % 360,
      count: (answer.count % 4) + 1,
      isCorrect: false,
    },
  ]

  const options = shuffleArray([{ ...answer, isCorrect: true }, ...distractors]).map((item, idx) => ({
    ...item,
    id: idx,
  }))

  return {
    seedId: Math.random().toString(36).slice(2, 7).toUpperCase(),
    sequence,
    options,
  }
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  t,
  lang,
  tests = [],
  onOpenCatalog,
  onOpenMethodology,
  onSelectTest,
  onStartScreening,
}) => {
  const [demoMode, setDemoMode] = useState<DemoMode>('schulte')
  const [variantSeed, setVariantSeed] = useState<string>(() =>
    Math.random().toString(36).slice(2, 7).toUpperCase()
  )

  // Mode 1: Mini Schulte 3x3 (1..9)
  const [schulteGrid, setSchulteGrid] = useState<number[]>(() =>
    shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9])
  )
  const [schulteNext, setSchulteNext] = useState(1)
  const [schulteErrors, setSchulteErrors] = useState(0)
  const [schulteStartMs, setSchulteStartMs] = useState<number | null>(null)
  const [schulteElapsedSec, setSchulteElapsedSec] = useState<number | null>(null)

  // Mode 2: Pattern sequence
  const [patternQ, setPatternQ] = useState<PatternDemoQuestion>(() => generatePatternDemoQuestion())
  const [patternPicked, setPatternPicked] = useState<number | null>(null)

  // Mode 3: Mini Reaction check
  const [reactionState, setReactionState] = useState<'idle' | 'waiting' | 'ready' | 'done' | 'early'>('idle')
  const [reactionMs, setReactionMs] = useState<number | null>(null)
  const reactionTimerRef = useRef<number | null>(null)
  const reactionShowAtRef = useRef<number>(0)

  const clearReactionTimer = () => {
    if (reactionTimerRef.current) {
      window.clearTimeout(reactionTimerRef.current)
      reactionTimerRef.current = null
    }
  }

  useEffect(() => {
    return () => clearReactionTimer()
  }, [])

  const generateNewDemoVariant = useCallback((nextMode?: DemoMode) => {
    clearReactionTimer()
    const targetMode = nextMode || demoMode
    setVariantSeed(Math.random().toString(36).slice(2, 7).toUpperCase())

    // Reset Schulte
    setSchulteGrid(shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]))
    setSchulteNext(1)
    setSchulteErrors(0)
    setSchulteStartMs(null)
    setSchulteElapsedSec(null)

    // Reset Pattern
    setPatternQ(generatePatternDemoQuestion())
    setPatternPicked(null)

    // Reset Reaction
    setReactionState('idle')
    setReactionMs(null)

    if (nextMode) {
      setDemoMode(targetMode)
    }
  }, [demoMode])

  const handleSchulteCellClick = (num: number) => {
    if (schulteElapsedSec !== null) return
    const now = performance.now()
    const start = schulteStartMs ?? now
    if (schulteStartMs === null) {
      setSchulteStartMs(now)
    }
    if (num === schulteNext) {
      if (num === 9) {
        const sec = Math.max(1.2, Math.round(((now - start) / 1000) * 100) / 100)
        setSchulteElapsedSec(sec)
      } else {
        setSchulteNext(num + 1)
      }
    } else {
      setSchulteErrors((prev) => prev + 1)
    }
  }

  const handleReactionStart = () => {
    clearReactionTimer()
    setReactionMs(null)
    setReactionState('waiting')
    const waitMs = 1100 + Math.floor(Math.random() * 1600)
    reactionTimerRef.current = window.setTimeout(() => {
      reactionShowAtRef.current = performance.now()
      setReactionState('ready')
    }, waitMs)
  }

  const handleReactionTap = () => {
    if (reactionState === 'waiting') {
      clearReactionTimer()
      setReactionState('early')
    } else if (reactionState === 'ready') {
      const rt = Math.max(110, Math.round(performance.now() - reactionShowAtRef.current))
      setReactionMs(rt)
      setReactionState('done')
    }
  }

  const renderShapeGlyph = (
    shape: 'circle' | 'square' | 'triangle' | 'diamond',
    angle: number,
    count: number
  ) => (
    <svg viewBox="0 0 60 60" className="w-11 h-11 text-emerald-600 dark:text-emerald-400">
      <g transform={`rotate(${angle} 30 30)`}>
        {shape === 'circle' && <circle cx="30" cy="30" r="16" fill="none" stroke="currentColor" strokeWidth="3.5" />}
        {shape === 'square' && <rect x="15" y="15" width="30" height="30" rx="4" fill="none" stroke="currentColor" strokeWidth="3.5" />}
        {shape === 'triangle' && <polygon points="30,12 47,44 13,44" fill="none" stroke="currentColor" strokeWidth="3.5" />}
        {shape === 'diamond' && <polygon points="30,11 49,30 30,49 11,30" fill="none" stroke="currentColor" strokeWidth="3.5" />}
        <circle cx="30" cy="14" r="3" fill="currentColor" />
      </g>
      <text x="50" y="54" fontSize="11" fontWeight="bold" fill="currentColor" textAnchor="end">
        ×{count}
      </text>
    </svg>
  )

  const heroBadge =
    lang === 'ru'
      ? 'SIHAT 3.0 • Интерактивный когнитивный и сенсорный скрининг'
      : lang === 'tj'
      ? 'SIHAT 3.0 • Скрининги интерактивии маърифатӣ ва сенсорӣ'
      : 'SIHAT 3.0 • Interactive Cognitive & Sensory Screening'

  const heroTitle =
    lang === 'ru'
      ? 'Где забота о здоровье встречает'
      : lang === 'tj'
      ? 'Дар куҷое, ки ғамхорӣ ба саломатӣ ба'
      : 'Where Health Care Meets'

  const heroHighlight =
    lang === 'ru'
      ? 'научную ясность.'
      : lang === 'tj'
      ? 'равшании илмӣ мерасад.'
      : 'Scientific Clarity.'

  const heroSubtitle =
    lang === 'ru'
      ? '15 интерактивных упражнений для проверки внимания, памяти, зрительного восприятия, слуха и координации. Динамическая генерация заданий, прозрачные паспорта методик и полный контроль над сохранением результатов.'
      : lang === 'tj'
      ? '15 машқи интерактивӣ барои санҷиши таваҷҷуҳ, хотира, дарки визуалӣ, шунавоӣ ва ҳамоҳангӣ. Генератсияи динамикии супоришҳо ва шиносномаҳои кушодаи методӣ.'
      : '15 interactive exercises for attention, memory, visual perception, hearing, and motor coordination. Dynamic server-generated tasks, transparent methodology passports, and full privacy control.'

  const activeFullSlug =
    demoMode === 'schulte'
      ? 'attention-concentration'
      : demoMode === 'pattern'
      ? 'pattern-matrix'
      : 'reaction-speed'

  return (
    <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden">
      {/* Background Image with Scrim */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0">
        <div
          className="absolute inset-0 overflow-hidden"
          style={{
            maskImage: 'linear-gradient(to bottom, transparent 0%, black 8%, black 78%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 8%, black 78%, transparent 100%)',
          }}
        >
          <img
            src="/hero-bg.jpg"
            alt="SIHAT Screening Environment"
            className="w-full h-full object-cover object-[70%_25%] md:object-[68%_30%] transition-opacity duration-700 opacity-30 dark:opacity-75 filter contrast-[1.04] brightness-[0.92]"
          />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_32%,rgba(250,250,250,0.85)_0%,rgba(250,250,250,0.6)_55%,rgba(250,250,250,0.96)_100%)] dark:bg-[radial-gradient(ellipse_at_50%_32%,rgba(7,11,10,0.78)_0%,rgba(7,11,10,0.52)_55%,rgba(7,11,10,0.88)_100%)]" />
        </div>
        <div className="absolute top-1/4 right-1/4 w-[520px] h-[340px] bg-emerald-500/15 dark:bg-emerald-400/20 blur-[130px] rounded-full pointer-events-none mix-blend-screen" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        {/* Status Pill Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 mb-6 shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>{heroBadge}</span>
        </div>

        {/* Main Heading */}
        <h1 className="font-manrope text-4xl sm:text-5xl lg:text-6xl font-extrabold text-zinc-900 dark:text-zinc-50 max-w-4xl mx-auto leading-[1.15] drop-shadow-sm tracking-tight">
          {heroTitle}{' '}
          <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 dark:from-emerald-400 dark:via-teal-300 dark:to-cyan-400 bg-clip-text text-transparent">
            {heroHighlight}
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-zinc-600 dark:text-zinc-300 max-w-2xl mx-auto leading-relaxed">
          {heroSubtitle}
        </p>

        {/* CTAs */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            size="lg"
            variant="emerald"
            onClick={onOpenCatalog}
            className="w-full sm:w-auto gap-2 text-base shadow-lg shadow-emerald-600/25"
          >
            <span>{t.hero?.browseCatalog || 'Открыть каталог скринингов'}</span>
            <ArrowRight className="w-4 h-4" />
          </Button>

          <Button
            size="lg"
            variant="outline"
            onClick={onOpenMethodology}
            className="w-full sm:w-auto gap-2 text-base"
          >
            <Compass className="w-4 h-4 text-emerald-500" />
            <span>
              {lang === 'ru'
                ? 'Изучить паспорта методик'
                : lang === 'tj'
                ? 'Шиносномаҳои методӣ'
                : 'Methodology Passports'}
            </span>
          </Button>
        </div>

        {/* 4 Trust Badges Strip */}
        <div className="mt-14 pt-8 border-t border-zinc-200/80 dark:border-zinc-800/80 grid grid-cols-2 md:grid-cols-4 gap-4 text-left max-w-4xl mx-auto">
          <div className="flex items-center gap-3 p-3 rounded-2xl liquid-glass-pill">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                {lang === 'tj' ? 'Бе ташхис' : lang === 'en' ? 'No Diagnoses' : 'Без диагнозов'}
              </div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {lang === 'tj' ? 'Танҳо ченакҳои дақиқ' : lang === 'en' ? 'Objective Metrics Only' : 'Объективные метрики'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl liquid-glass-pill">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                {lang === 'tj' ? 'Махфияти 100%' : lang === 'en' ? '100% Privacy' : 'Приватность 100%'}
              </div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {lang === 'tj' ? 'Нигоҳдорӣ ё несткунӣ' : lang === 'en' ? 'Save or Wipe' : 'Сохранить или стереть'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl liquid-glass-pill">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                {lang === 'tj' ? '15 машқ' : lang === 'en' ? '15 Exercises' : '15 упражнений'}
              </div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {lang === 'tj' ? 'Шулте, Корси, Габор' : lang === 'en' ? 'Schulte, Corsi, Gabor' : 'Шульте, Корси, Габор'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl liquid-glass-pill">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                {lang === 'tj' ? '3 забон' : lang === 'en' ? '3 Languages' : '3 языка'}
              </div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">Русский, Тоҷикӣ, English</div>
            </div>
          </div>
        </div>

        {/* Dynamic Interactive Demo Card */}
        <div className="mt-14 text-left">
          <Card className="p-6 md:p-8 liquid-glass shadow-2xl overflow-hidden relative rounded-3xl">
            {/* Mode Switcher + Try Another Variant Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-6 mb-6 border-b border-zinc-200/70 dark:border-zinc-800/80">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => generateNewDemoVariant('schulte')}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    demoMode === 'schulte'
                      ? 'bg-[#103D35] text-white shadow-sm'
                      : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300 hover:text-emerald-600'
                  }`}
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span>{lang === 'tj' ? 'Ҷадвали Шулте 3×3' : lang === 'en' ? 'Schulte 3×3' : 'Таблица Шульте 3×3'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => generateNewDemoVariant('pattern')}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    demoMode === 'pattern'
                      ? 'bg-[#103D35] text-white shadow-sm'
                      : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300 hover:text-emerald-600'
                  }`}
                >
                  <Shapes className="w-3.5 h-3.5" />
                  <span>
                    {lang === 'tj' ? 'Пайдарпайии шаклҳо' : lang === 'en' ? 'Pattern Sequence' : 'Продолжи ряд'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => generateNewDemoVariant('reaction')}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    demoMode === 'reaction'
                      ? 'bg-[#103D35] text-white shadow-sm'
                      : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300 hover:text-emerald-600'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>
                    {lang === 'tj' ? 'Суръати вокуниш' : lang === 'en' ? 'Reaction Speed' : 'Скорость реакции'}
                  </span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => generateNewDemoVariant()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>
                  {lang === 'tj'
                    ? 'Варианти дигарро санҷед'
                    : lang === 'en'
                    ? 'Try another variant'
                    : 'Попробовать другой вариант'}
                </span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Column: Interactive Mini-Exercise Stage */}
              <div className="lg:col-span-6 liquid-glass rounded-3xl p-6 flex flex-col items-center justify-center min-h-[320px] relative shadow-inner">
                <div className="w-full flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      {lang === 'tj'
                        ? `Намунаи интерактивӣ #${variantSeed}`
                        : lang === 'en'
                        ? `Interactive Demo #${variantSeed}`
                        : `Демо-вариант #${variantSeed}`}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {demoMode === 'schulte' ? '3×3 (1→9)' : demoMode === 'pattern' ? 'SVG Logic' : 'Latency ms'}
                  </Badge>
                </div>

                {demoMode === 'schulte' && (
                  <div className="w-full flex flex-col items-center">
                    {schulteElapsedSec === null ? (
                      <>
                        <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 mb-3">
                          {lang === 'tj'
                            ? `Рақамҳоро аз 1 то 9 пахш кунед • Ҳадафи ҷорӣ: ${schulteNext}`
                            : lang === 'en'
                            ? `Tap numbers in order 1 → 9 • Current target: ${schulteNext}`
                            : `Нажимайте числа по порядку от 1 до 9 • Ищите: ${schulteNext}`}
                        </div>
                        <div className="grid grid-cols-3 gap-2.5 w-full max-w-[240px]">
                          {schulteGrid.map((num) => {
                            const done = num < schulteNext
                            return (
                              <button
                                key={num}
                                type="button"
                                onClick={() => handleSchulteCellClick(num)}
                                className={`h-16 rounded-2xl font-mono text-xl font-black border transition-all cursor-pointer ${
                                  done
                                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 scale-95'
                                    : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 hover:border-emerald-500 shadow-xs'
                                }`}
                              >
                                {num}
                              </button>
                            )
                          })}
                        </div>
                      </>
                    ) : (
                      <div className="text-center space-y-3 py-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center mx-auto">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div className="text-2xl font-mono font-black text-emerald-600 dark:text-emerald-400">
                          {schulteElapsedSec} {lang === 'en' ? 's' : 'сек'}
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {lang === 'tj'
                            ? `Хатоҳо: ${schulteErrors}. Барои ҷадвали пурраи 5×5 (1–25) машқро кушоед.`
                            : lang === 'en'
                            ? `Errors: ${schulteErrors}. Launch the full 5×5 (1–25) Schulte table for complete metrics.`
                            : `Ошибок: ${schulteErrors}. Запустите полную таблицу 5×5 (1–25) для расчёта индекса внимания.`}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {demoMode === 'pattern' && (
                  <div className="w-full flex flex-col items-center space-y-4">
                    <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 text-center">
                      {lang === 'tj'
                        ? 'Кадом шакл пайдарпайиро давом медиҳад?'
                        : lang === 'en'
                        ? 'Which element completes the visual sequence?'
                        : 'Какой элемент продолжает логическую последовательность?'}
                    </div>
                    <div className="grid grid-cols-5 gap-2 w-full max-w-sm">
                      {patternQ.sequence.map((item, idx) => (
                        <div
                          key={idx}
                          className="h-16 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center"
                        >
                          {renderShapeGlyph(item.shape, item.angle, item.count)}
                        </div>
                      ))}
                      <div className="h-16 rounded-xl border-2 border-dashed border-emerald-500/50 bg-emerald-500/5 flex items-center justify-center font-mono font-black text-lg text-emerald-600 dark:text-emerald-400">
                        ?
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2 w-full max-w-sm pt-1">
                      {patternQ.options.map((opt) => {
                        const isSelected = patternPicked === opt.id
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setPatternPicked(opt.id)}
                            className={`h-16 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                              isSelected
                                ? opt.isCorrect
                                  ? 'border-emerald-500 bg-emerald-500/15'
                                  : 'border-rose-500 bg-rose-500/15'
                                : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 hover:border-emerald-500'
                            }`}
                          >
                            {renderShapeGlyph(opt.shape, opt.angle, opt.count)}
                          </button>
                        )
                      })}
                    </div>

                    {patternPicked !== null && (
                      <div className="text-xs font-bold text-center">
                        {patternQ.options.find((o) => o.id === patternPicked)?.isCorrect ? (
                          <span className="text-emerald-600 dark:text-emerald-400">
                            {lang === 'tj'
                              ? 'Дуруст! Қонуният муайян шуд.'
                              : lang === 'en'
                              ? 'Correct! Pattern rule identified.'
                              : 'Верно! Закономерность определена точно.'}
                          </span>
                        ) : (
                          <span className="text-rose-500">
                            {lang === 'tj'
                              ? 'Нодуруст — варианти дигарро санҷед.'
                              : lang === 'en'
                              ? 'Not quite — try another option or variant.'
                              : 'Неверно — обратите внимание на поворот и число элементов.'}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {demoMode === 'reaction' && (
                  <div className="w-full flex flex-col items-center justify-center">
                    {reactionState === 'idle' && (
                      <button
                        type="button"
                        onClick={handleReactionStart}
                        className="w-full max-w-xs h-44 rounded-3xl bg-zinc-900 text-white flex flex-col items-center justify-center gap-2 border border-zinc-700 hover:border-emerald-500 transition-all cursor-pointer shadow-lg"
                      >
                        <Zap className="w-8 h-8 text-emerald-400" />
                        <span className="font-bold text-sm">
                          {lang === 'tj'
                            ? 'Барои оғоз пахш кунед'
                            : lang === 'en'
                            ? 'Click to Start Reaction Check'
                            : 'Нажмите, чтобы начать замер'}
                        </span>
                      </button>
                    )}

                    {reactionState === 'waiting' && (
                      <button
                        type="button"
                        onClick={handleReactionTap}
                        className="w-full max-w-xs h-44 rounded-3xl bg-amber-500/20 border-2 border-amber-500/50 text-amber-700 dark:text-amber-300 flex flex-col items-center justify-center gap-2 cursor-pointer"
                      >
                        <span className="font-bold text-base">
                          {lang === 'tj'
                            ? 'Ранги сабзро интизор шавед...'
                            : lang === 'en'
                            ? 'Wait for GREEN signal...'
                            : 'Ждите зелёного сигнала...'}
                        </span>
                      </button>
                    )}

                    {reactionState === 'ready' && (
                      <button
                        type="button"
                        onClick={handleReactionTap}
                        className="w-full max-w-xs h-44 rounded-3xl bg-emerald-500 text-white flex flex-col items-center justify-center gap-2 cursor-pointer shadow-xl shadow-emerald-500/30"
                      >
                        <span className="font-black text-xl uppercase tracking-wide">
                          {lang === 'tj' ? 'ҲОЗИР ПАХШ КУНЕД!' : lang === 'en' ? 'CLICK NOW!' : 'ЖМИТЕ СЕЙЧАС!'}
                        </span>
                      </button>
                    )}

                    {reactionState === 'early' && (
                      <div className="text-center space-y-3 py-4">
                        <p className="text-sm font-bold text-rose-500">
                          {lang === 'tj'
                            ? 'Фалстарт! Пеш аз сигнал пахш кардед.'
                            : lang === 'en'
                            ? 'Too early! Wait for the green signal.'
                            : 'Фальстарт! Вы нажали до появления сигнала.'}
                        </p>
                        <Button size="sm" variant="outline" onClick={handleReactionStart}>
                          {lang === 'tj' ? 'Аз нав' : lang === 'en' ? 'Try Again' : 'Повторить'}
                        </Button>
                      </div>
                    )}

                    {reactionState === 'done' && (
                      <div className="text-center space-y-3 py-4">
                        <div className="text-3xl font-mono font-black text-emerald-600 dark:text-emerald-400">
                          {reactionMs} {lang === 'en' ? 'ms' : 'мс'}
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {lang === 'tj'
                            ? 'Вақти вокуниши шумо сабт шуд.'
                            : lang === 'en'
                            ? 'Visuomotor response latency recorded.'
                            : 'Время зрительно-моторного отклика зафиксировано.'}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right Column: Description & Launch Full Exercise */}
              <div className="lg:col-span-6 flex flex-col justify-between h-full space-y-5">
                <div>
                  <Badge variant="emerald" className="mb-3 font-mono">
                    {lang === 'tj'
                      ? 'Генератори динамикии супоришҳо'
                      : lang === 'en'
                      ? 'Dynamic Task Generator'
                      : 'Динамический генератор вариантов'}
                  </Badge>

                  <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                    {demoMode === 'schulte'
                      ? lang === 'tj'
                        ? 'Санҷиши суръати ҷустуҷӯи визуалӣ'
                        : lang === 'en'
                        ? 'Visual Search & Attention Tempo'
                        : 'Концентрация и темп внимания (Таблицы Шульте)'
                      : demoMode === 'pattern'
                      ? lang === 'tj'
                        ? 'Таҳлили пайдарпайиҳои визуалӣ'
                        : lang === 'en'
                        ? 'Inductive Visual Pattern Analysis'
                        : 'Продолжи последовательность (Зрительная логика)'
                      : lang === 'tj'
                      ? 'Хронометражи реаксияи сенсомоторӣ'
                      : lang === 'en'
                      ? 'Visuomotor Reaction Chronometry'
                      : 'Хронометраж зрительно-моторной реакции'}
                  </h3>

                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed">
                    {lang === 'tj'
                      ? 'Ҳангоми ҳар як оғози нав сервер варианти тасодуфии супоришро эҷод мекунад. Дар ин ҷо шумо метавонед версияи кӯтоҳро санҷед ё ба машқи пурра бо графики натиҷаҳо ва содироти PDF гузаред.'
                      : lang === 'en'
                      ? 'Every new attempt generates a fresh randomized task on the server. Try the mini-exercise here or launch the full protocol with detailed charts and PDF report export.'
                      : 'При каждом новом прохождении сервер создаёт уникальный вариант задания: меняются расстановки чисел, последовательности, маршруты и стимулы. Попробуйте мини-версию прямо здесь или перейдите к полному упражнению.'}
                  </p>
                </div>

                <div className="space-y-2.5 bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-600 dark:text-zinc-400">
                      {lang === 'tj' ? 'Генератсияи вариант:' : lang === 'en' ? 'Variant Generation:' : 'Генерация варианта:'}
                    </span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      Seed #{variantSeed}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-600 dark:text-zinc-400">
                      {lang === 'tj' ? 'Ҳисоби натиҷа:' : lang === 'en' ? 'Scoring Engine:' : 'Проверка результата:'}
                    </span>
                    <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                      {lang === 'tj' ? 'Серверӣ + Графикҳои SVG' : lang === 'en' ? 'Server Replay + SVG Charts' : 'Серверная верификация + SVG-графики'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  <Button
                    variant="emerald"
                    className="w-full sm:flex-1 gap-2 shadow-md shadow-emerald-600/25 py-2.5 font-bold"
                    onClick={() => onStartScreening(activeFullSlug)}
                  >
                    <span>
                      {lang === 'tj'
                        ? 'Оғози машқи пурра'
                        : lang === 'en'
                        ? 'Start Full Exercise'
                        : 'Пройти полное упражнение'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => generateNewDemoVariant()}
                    className="w-full sm:w-auto text-xs gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-emerald-500" />
                    <span>
                      {lang === 'tj' ? 'Варианти нав' : lang === 'en' ? 'New Variant' : 'Другой вариант'}
                    </span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={onOpenMethodology}
                    className="w-full sm:w-auto text-xs"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1 text-emerald-500" />
                    <span>{lang === 'tj' ? 'Шиноснома' : lang === 'en' ? 'Passport' : 'Паспорт'}</span>
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          <TestMarquee
            tests={tests}
            lang={lang}
            onOpenCatalog={onOpenCatalog}
            onSelectTest={(test) => {
              if (onSelectTest) {
                onSelectTest(test)
              } else {
                onStartScreening(test.slug)
              }
            }}
            onStartAttempt={(test) => onStartScreening(test.slug)}
          />
        </div>
      </div>
    </section>
  )
}
