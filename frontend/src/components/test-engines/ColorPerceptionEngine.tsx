import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import {
  Eye,
  RotateCcw,
  SunMedium,
  Sparkles,
  Circle,
  Square,
  Triangle,
  Star,
  Diamond,
  Plus,
  Heart,
  EyeOff,
} from 'lucide-react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { Card } from '../ui/Card'
import type { InteractiveEngineProps } from './engineTypes'

interface ServerPlate {
  id: string
  type: string
  value: string
  weight?: string
  bg_palette: string[]
  fg_palette: string[]
  options: string[]
  seed?: number
}

// Fallback baseline plates if challenge is missing
const DEFAULT_FALLBACK_PLATES: ServerPlate[] = [
  {
    id: 'base-12',
    type: 'number',
    value: '12',
    weight: 'baseline',
    bg_palette: ['#4b8e61', '#5ea574', '#74be8d', '#427f54', '#85cea1', '#539967'],
    fg_palette: ['#ea583a', '#dd4828', '#f36e4f', '#c93b1e', '#f88366', '#d64426'],
    options: ['12', '72', '21', 'none'],
    seed: 12345,
  },
  {
    id: 'protan-5',
    type: 'number',
    value: '5',
    weight: 'protan',
    bg_palette: ['#cc9b76', '#ba8863', '#ddae89', '#a67551', '#eec09c', '#b3805b'],
    fg_palette: ['#329471', '#23815e', '#45a582', '#186f4d', '#57b794', '#2b8d6a'],
    options: ['5', '2', '6', 'none'],
    seed: 67890,
  },
  {
    id: 'deutan-8',
    type: 'number',
    value: '8',
    weight: 'deutan',
    bg_palette: ['#c7946f', '#b3815c', '#d9a782', '#9f6e4a', '#e9b994'],
    fg_palette: ['#429b79', '#318765', '#55af8c', '#247554', '#69c3a0'],
    options: ['8', '3', '9', 'none'],
    seed: 13579,
  },
  {
    id: 'tritan-7',
    type: 'number',
    value: '7',
    weight: 'tritan',
    bg_palette: ['#a88e58', '#947a44', '#bd9f67', '#816834', '#cfb27a'],
    fg_palette: ['#347bb8', '#256aa6', '#458ec9', '#175791', '#58a0dc'],
    options: ['7', '1', '4', 'none'],
    seed: 24680,
  },
  {
    id: 'base-circle',
    type: 'circle',
    value: 'circle',
    weight: 'baseline',
    bg_palette: ['#3e734c', '#4f8d63', '#62a578', '#33613f', '#78b88d'],
    fg_palette: ['#ea5a39', '#dc4725', '#f47352', '#bf3315', '#f68668'],
    options: ['circle', 'square', 'triangle', 'none'],
    seed: 98765,
  },
  {
    id: 'protan-star',
    type: 'star',
    value: 'star',
    weight: 'protan',
    bg_palette: ['#528569', '#417257', '#669a7c', '#345e45', '#7ab191'],
    fg_palette: ['#df5a3d', '#cd4629', '#ee6f52', '#b73518', '#f48368'],
    options: ['star', 'circle', 'triangle', 'none'],
    seed: 45678,
  },
  {
    id: 'deutan-square',
    type: 'square',
    value: 'square',
    weight: 'deutan',
    bg_palette: ['#cc9771', '#b8835d', '#deab84', '#a3704b', '#eebf99'],
    fg_palette: ['#369773', '#268360', '#49a884', '#19714e', '#5bb996'],
    options: ['square', 'diamond', 'circle', 'none'],
    seed: 23456,
  },
  {
    id: 'tritan-cross',
    type: 'cross',
    value: 'cross',
    weight: 'tritan',
    bg_palette: ['#b5965b', '#a08147', '#c9a96c', '#8c6e37', '#dac080'],
    fg_palette: ['#3a7bb5', '#2a69a3', '#4c8fc7', '#1c5790', '#5ea2dc'],
    options: ['cross', 'heart', 'star', 'none'],
    seed: 78901,
  },
]

export const PseudoisochromaticCanvas: React.FC<{
  plate: ServerPlate
  size?: number
}> = ({ plate, size = 300 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const maskDim = 260
    const off = document.createElement('canvas')
    off.width = maskDim
    off.height = maskDim
    const offCtx = off.getContext('2d')
    if (!offCtx) return

    offCtx.fillStyle = '#ffffff'
    offCtx.fillRect(0, 0, maskDim, maskDim)
    offCtx.fillStyle = '#000000'

    const cx = maskDim / 2
    const cy = maskDim / 2

    const type = plate.type || 'number'
    const val = plate.value

    if (type === 'number' || (!['circle', 'triangle', 'square', 'star', 'diamond', 'cross', 'heart', 'letter'].includes(type) && /^[0-9]+$/.test(val))) {
      offCtx.font = val.length > 1 ? '900 120px "Arial", sans-serif' : '900 145px "Arial", sans-serif'
      offCtx.textAlign = 'center'
      offCtx.textBaseline = 'middle'
      offCtx.fillText(val, cx, cy + 4)
    } else if (type === 'letter' || (val.length === 1 && /^[A-Z]$/i.test(val))) {
      offCtx.font = '900 140px "Arial", sans-serif'
      offCtx.textAlign = 'center'
      offCtx.textBaseline = 'middle'
      offCtx.fillText(val.toUpperCase(), cx, cy + 4)
    } else if (type === 'triangle' || val === 'triangle') {
      const triR = 66
      offCtx.beginPath()
      offCtx.moveTo(cx, cy - triR)
      offCtx.lineTo(cx + triR * 1.15, cy + triR * 0.75)
      offCtx.lineTo(cx - triR * 1.15, cy + triR * 0.75)
      offCtx.closePath()
      offCtx.fill()
    } else if (type === 'circle' || val === 'circle') {
      offCtx.beginPath()
      offCtx.arc(cx, cy, 58, 0, Math.PI * 2)
      offCtx.fill()
    } else if (type === 'square' || val === 'square') {
      const sqHalf = 48
      offCtx.fillRect(cx - sqHalf, cy - sqHalf, sqHalf * 2, sqHalf * 2)
    } else if (type === 'star' || val === 'star') {
      const spikes = 5
      const outerR = 64
      const innerR = 28
      let rot = (Math.PI / 2) * 3
      const step = Math.PI / spikes
      offCtx.beginPath()
      offCtx.moveTo(cx, cy - outerR)
      for (let i = 0; i < spikes; i++) {
        const x1 = cx + Math.cos(rot) * outerR
        const y1 = cy + Math.sin(rot) * outerR
        offCtx.lineTo(x1, y1)
        rot += step
        const x2 = cx + Math.cos(rot) * innerR
        const y2 = cy + Math.sin(rot) * innerR
        offCtx.lineTo(x2, y2)
        rot += step
      }
      offCtx.lineTo(cx, cy - outerR)
      offCtx.closePath()
      offCtx.fill()
    } else if (type === 'diamond' || val === 'diamond') {
      const dW = 54
      const dH = 70
      offCtx.beginPath()
      offCtx.moveTo(cx, cy - dH)
      offCtx.lineTo(cx + dW, cy)
      offCtx.lineTo(cx, cy + dH)
      offCtx.lineTo(cx - dW, cy)
      offCtx.closePath()
      offCtx.fill()
    } else if (type === 'cross' || val === 'cross') {
      const cW = 20
      const cL = 60
      offCtx.fillRect(cx - cW, cy - cL, cW * 2, cL * 2)
      offCtx.fillRect(cx - cL, cy - cW, cL * 2, cW * 2)
    } else if (type === 'heart' || val === 'heart') {
      const hS = 52
      offCtx.beginPath()
      offCtx.moveTo(cx, cy + hS * 0.6)
      offCtx.bezierCurveTo(cx - hS * 1.1, cy + hS * 0.1, cx - hS * 1.1, cy - hS * 0.8, cx, cy - hS * 0.3)
      offCtx.bezierCurveTo(cx + hS * 1.1, cy - hS * 0.8, cx + hS * 1.1, cy + hS * 0.1, cx, cy + hS * 0.6)
      offCtx.closePath()
      offCtx.fill()
    } else {
      offCtx.font = '900 120px "Arial", sans-serif'
      offCtx.textAlign = 'center'
      offCtx.textBaseline = 'middle'
      offCtx.fillText(val, cx, cy + 4)
    }

    const imgData = offCtx.getImageData(0, 0, maskDim, maskDim).data

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = size * dpr
    canvas.height = size * dpr
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, size, size)

    const cTarget = size / 2
    const targetR = size * 0.44

    // Dark plate backdrop
    ctx.fillStyle = '#0f172a'
    ctx.beginPath()
    ctx.arc(cTarget, cTarget, targetR + 6, 0, Math.PI * 2)
    ctx.fill()

    let seed = (plate.seed || 1234567) ^ 0x5bf03635
    const prng = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296
      return seed / 4294967296
    }

    const step = size * 0.043
    for (let y = -targetR; y <= targetR; y += step) {
      const rowOffset = Math.floor(y / step) % 2 === 0 ? 0 : step / 2
      for (let x = -targetR; x <= targetR; x += step) {
        const rx = x + rowOffset
        if (rx * rx + y * y <= targetR * targetR) {
          const jx = rx + (prng() - 0.5) * (step * 0.38)
          const jy = y + (prng() - 0.5) * (step * 0.38)
          const dotX = cTarget + jx
          const dotY = cTarget + jy

          const offX = Math.min(maskDim - 1, Math.max(0, Math.round(cx + (jx * cx) / targetR)))
          const offY = Math.min(maskDim - 1, Math.max(0, Math.round(cy + (jy * cy) / targetR)))
          const pIdx = (offY * maskDim + offX) * 4
          const isFg = imgData[pIdx] < 120

          const palette = isFg ? plate.fg_palette : plate.bg_palette
          const color = palette[Math.floor(prng() * palette.length)] || (isFg ? '#ea583a' : '#4b8e61')
          const radius = size * 0.016 + prng() * (size * 0.014)

          ctx.fillStyle = color
          ctx.beginPath()
          ctx.arc(dotX, dotY, radius, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }
  }, [plate, size])

  useEffect(() => {
    draw()
  }, [draw])

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size }}
      className="rounded-full shadow-2xl border-4 border-slate-700/60 dark:border-slate-800 transition-transform duration-300 hover:scale-[1.01]"
      aria-label={`Таблица цветоразличения #${plate.id}`}
    />
  )
}

export const ColorPerceptionEngine: React.FC<InteractiveEngineProps> = ({
  lang,
  challenge,
  onComplete,
  onRequestNewTask,
}) => {
  const plates: ServerPlate[] = useMemo(() => {
    const fromServer = challenge?.plates
    if (Array.isArray(fromServer) && fromServer.length > 0) {
      return fromServer
    }
    return DEFAULT_FALLBACK_PLATES
  }, [challenge])

  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [startTime] = useState<number>(() => Date.now())

  const currentPlate = plates[currentIndex] || plates[0]
  const totalPlates = plates.length
  const progressPct = Math.round(((currentIndex + 1) / totalPlates) * 100)

  const t = {
    ru: {
      title: 'Скрининг дальтонизма',
      subtitle: 'Диагностика по полихроматическим таблицам Рабкина и Ишихары',
      plate: 'Пластина',
      of: 'из',
      question: 'Какой символ или число вы видите внутри круга?',
      noneOption: 'Ничего не вижу',
      tipDisplay: 'Для честного скрининга отключите ночной режим (Night Shift / f.lux / тёплый фильтр) и настройте комфортную яркость экрана.',
      restart: 'Начать заново',
      shapeLabels: {
        circle: 'Круг',
        square: 'Квадрат',
        triangle: 'Треугольник',
        star: 'Звезда',
        diamond: 'Ромб',
        cross: 'Крест',
        heart: 'Сердце',
      } as Record<string, string>,
    },
    tj: {
      title: 'Санҷиши дальтонизм',
      subtitle: 'Ташхис бо ҷадвалҳои полихроматии Рабкин ва Ишиҳара',
      plate: 'Лавҳаи',
      of: 'аз',
      question: 'Дар дохили доира кадом рақам ё шаклро мебинед?',
      noneOption: 'Ҳеҷ чиз намебинам',
      tipDisplay: 'Барои санҷиши дуруст ҳолати шабонаро (Night Shift / филтри кабуд) хомӯш кунед ва равшании экранро бароҳат созед.',
      restart: 'Аз нав оғоз кардан',
      shapeLabels: {
        circle: 'Доира',
        square: 'Мураббаъ',
        triangle: 'Секунҷа',
        star: 'Ситора',
        diamond: 'Ромб',
        cross: 'Салиб',
        heart: 'Дил',
      } as Record<string, string>,
    },
    en: {
      title: 'Color Blindness Screening',
      subtitle: 'Pseudoisochromatic plate screening (Rabkin and Ishihara plates)',
      plate: 'Plate',
      of: 'of',
      question: 'What number or shape do you perceive inside the circle?',
      noneOption: 'Nothing visible',
      tipDisplay: 'For accurate results, turn off Night Shift / f.lux / blue light filters and ensure normal screen brightness.',
      restart: 'Start over',
      shapeLabels: {
        circle: 'Circle',
        square: 'Square',
        triangle: 'Triangle',
        star: 'Star',
        diamond: 'Diamond',
        cross: 'Cross',
        heart: 'Heart',
      } as Record<string, string>,
    },
  }[lang] || {
    title: 'Скрининг дальтонизма',
    subtitle: 'Диагностика по полихроматическим таблицам Рабкина и Ишихары',
    plate: 'Пластина',
    of: 'из',
    question: 'Какой символ или число вы видите внутри круга?',
    noneOption: 'Ничего не вижу',
    tipDisplay: 'Для честного скрининга отключите ночной режим и настройте комфортную яркость экрана.',
    restart: 'Начать заново',
    shapeLabels: {} as Record<string, string>,
  }

  // Visual choices (filter out 'none' to keep exactly 3 top choices)
  const visualOptions = useMemo(() => {
    return (currentPlate.options || []).filter((opt) => opt !== 'none')
  }, [currentPlate])

  const renderShapeIcon = (opt: string) => {
    const s = opt.toLowerCase()
    const iconClass =
      'w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform duration-200'
    switch (s) {
      case 'circle':
        return <Circle className={iconClass} />
      case 'square':
        return <Square className={iconClass} />
      case 'triangle':
        return <Triangle className={iconClass} />
      case 'star':
        return <Star className={iconClass} />
      case 'diamond':
        return <Diamond className={iconClass} />
      case 'cross':
        return <Plus className={iconClass} />
      case 'heart':
        return <Heart className={iconClass} />
      default:
        return null
    }
  }

  const getOptionLabel = useCallback(
    (opt: string) => {
      if (opt === 'none') return t.noneOption
      if (t.shapeLabels[opt]) return t.shapeLabels[opt]
      return opt
    },
    [t]
  )

  const handleSelectOption = useCallback(
    (chosen: string) => {
      const updatedAnswers = {
        ...answers,
        [currentPlate.id]: chosen,
      }
      setAnswers(updatedAnswers)

      if (currentIndex + 1 < totalPlates) {
        setCurrentIndex((prev) => prev + 1)
      } else {
        // Completed all plates! Submit to server replay
        const durationSec = Math.max(1, Math.round((Date.now() - startTime) / 1000))
        let correctLocal = 0
        plates.forEach((p) => {
          if (updatedAnswers[p.id] === p.value) {
            correctLocal += 1
          }
        })
        const accuracyPct = Math.round((correctLocal / totalPlates) * 100)

        const summaryText =
          lang === 'tj'
            ? `Аз ${totalPlates} лавҳаи ташхис ${correctLocal} адад дуруст муайян шуд (дақиқият: ${accuracyPct}%).`
            : lang === 'en'
            ? `Identified ${correctLocal} of ${totalPlates} pseudoisochromatic plates correctly (${accuracyPct}% accuracy).`
            : `Верно распознано ${correctLocal} из ${totalPlates} полихроматических таблиц (точность: ${accuracyPct}%).`

        onComplete({
          summary: summaryText,
          metrics: {
            correct_count: correctLocal,
            total_plates: totalPlates,
            accuracy_pct: accuracyPct,
            duration_sec: durationSec,
          },
          telemetry: {
            answers: updatedAnswers,
            time_sec: durationSec,
          },
        })
      }
    },
    [answers, currentIndex, currentPlate.id, lang, onComplete, plates, startTime, totalPlates]
  )

  // Keyboard shortcut listener (1..3 for choices, 0 or Space for "none")
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key
      if (key >= '1' && key <= '3') {
        const idx = parseInt(key, 10) - 1
        if (visualOptions[idx]) {
          handleSelectOption(visualOptions[idx])
        }
      } else if (key === '0' || key === ' ') {
        e.preventDefault()
        handleSelectOption('none')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleSelectOption, visualOptions])

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
      {/* Header bar */}
      <Card className="p-6 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {t.title}
                <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                  <Sparkles className="w-3 h-3 mr-1 inline" />
                  ISO 8596
                </Badge>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Badge variant="secondary" className="px-3 py-1 font-mono text-xs">
              {t.plate} {currentIndex + 1} {t.of} {totalPlates}
            </Badge>
            {onRequestNewTask && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRequestNewTask}
                title={t.restart}
                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-4">
          <div
            className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 h-full transition-all duration-300 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Display calibration tip */}
        <div className="flex items-start gap-2.5 mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-200 text-xs">
          <SunMedium className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="leading-relaxed">{t.tipDisplay}</p>
        </div>
      </Card>

      {/* Main Plate Presentation */}
      <Card className="p-8 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-xl flex flex-col items-center">
        <div className="my-2 relative flex items-center justify-center p-3 rounded-full bg-slate-100/50 dark:bg-slate-800/30 border border-slate-200/50 dark:border-slate-700/50 shadow-inner">
          <PseudoisochromaticCanvas plate={currentPlate} size={300} />
        </div>

        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-4 text-center">
          {t.question}
        </p>

        {/* 3 Visual Options on top */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-lg">
          {visualOptions.map((opt, i) => {
            const shapeIcon = renderShapeIcon(opt)
            const label = getOptionLabel(opt)

            return (
              <button
                key={opt}
                type="button"
                onClick={() => handleSelectOption(opt)}
                className="group relative flex flex-col items-center justify-center p-3 rounded-2xl bg-white dark:bg-slate-800/90 border-2 border-slate-200/90 dark:border-slate-700 hover:border-emerald-500/80 dark:hover:border-emerald-500 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 shadow-xs hover:shadow-md hover:shadow-emerald-500/10 active:scale-[0.97] transition-all duration-200 cursor-pointer min-h-[84px] sm:min-h-[94px]"
              >
                {shapeIcon ? (
                  <>
                    <div className="mb-1">{shapeIcon}</div>
                    <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 text-center leading-tight tracking-tight break-words px-1 max-w-full">
                      {label}
                    </span>
                  </>
                ) : (
                  <span className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:scale-105 transition-transform">
                    {opt}
                  </span>
                )}
                <span className="mt-1 text-[10px] font-mono font-medium text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700/60 px-1.5 py-0.5 rounded">
                  [{i + 1}]
                </span>
              </button>
            )
          })}
        </div>

        {/* Dedicated "Ничего не вижу" at the VERY BOTTOM */}
        <button
          type="button"
          onClick={() => handleSelectOption('none')}
          className="w-full max-w-lg mt-3 py-3 px-4 rounded-2xl border border-dashed border-slate-300 hover:border-slate-400 dark:border-slate-700 dark:hover:border-slate-600 bg-slate-50/80 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200 shadow-xs flex items-center justify-between gap-3 active:scale-[0.99] cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <EyeOff className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-xs sm:text-sm font-semibold">{t.noneOption}</span>
          </div>
          <span className="text-[10px] sm:text-[11px] font-mono font-medium text-slate-400 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md shadow-xs">
            [0 / Space]
          </span>
        </button>
      </Card>
    </div>
  )
}
