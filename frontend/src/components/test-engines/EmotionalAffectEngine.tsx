import React, { useState, useRef } from 'react'
import { Smile, Award, CheckCircle, RotateCcw } from 'lucide-react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import type { Language } from '../../i18n'

interface EmotionalAffectEngineProps {
  lang: Language
  onComplete: (result: { summary: string; metrics: Record<string, unknown> }) => void
}

export const EmotionalAffectEngine: React.FC<EmotionalAffectEngineProps> = ({ lang, onComplete }) => {
  const [coords, setCoords] = useState<{ x: number; y: number }>({ x: 25, y: 15 }) // Range -100 to 100
  const [isFinished, setIsFinished] = useState(false)
  const planeRef = useRef<HTMLDivElement | null>(null)

  const t = {
    ru: {
      title: 'Психоэмоциональный баланс',
      subtitle: 'Двухосевая модель аффекта: Валентность (настроение) и Активация (энергия).',
      standard: 'Russell Circumplex Model of Affect',
      instruction: 'Нажмите или переместите точку в плоскости в соответствии с вашим текущим состоянием:',
      valence: 'Валентность:',
      arousal: 'Активация:',
      quadrantQ1: 'Высокая энергия и позитив (Энтузиазм)',
      quadrantQ2: 'Высокое напряжение (Стресс / Тревога)',
      quadrantQ3: 'Низкая энергия и спад (Утомление)',
      quadrantQ4: 'Глубокое спокойствие (Релаксация)',
      finishBtn: 'Зафиксировать состояние',
      finishTitle: 'Эмоциональный статус определен',
      completeAndSave: 'Завершить и сохранить',
      tryAgain: 'Скорректировать',
    },
    tj: {
      title: 'Тавозуни равонӣ-эҳсосӣ',
      subtitle: 'Модели дусамтаи эҳсосот: Мусбат/Манфӣ ва Сатҳи нерӯ.',
      standard: 'Russell Circumplex Model of Affect',
      instruction: 'Нуқтаро ба мавқеи мувофиқи ҳолати кунунии худ гузоред:',
      valence: 'Муносибат (Валентнокӣ):',
      arousal: 'Сатҳи бедорӣ:',
      quadrantQ1: 'Нерӯи баланд ва шодмонӣ (Шавқмандӣ)',
      quadrantQ2: 'Шаддодияти баланд (Стресс / Нигаронӣ)',
      quadrantQ3: 'Нерӯи паст (Хастагӣ / Сардӣ)',
      quadrantQ4: 'Оромии амиқ (Осоиштагӣ)',
      finishBtn: 'Сабти ҳолат',
      finishTitle: 'Ҳолати эҳсосӣ муайян шуд',
      completeAndSave: 'Анҷом ва сабт кардан',
      tryAgain: 'Ислоҳ кардан',
    },
    en: {
      title: 'Affective Equilibrium',
      subtitle: '2D dimensional model of emotion: Valence (pleasantness) and Arousal (activation).',
      standard: 'Russell Circumplex Model of Affect',
      instruction: 'Click or drag the locator on the plane to reflect your present affective state:',
      valence: 'Valence:',
      arousal: 'Arousal:',
      quadrantQ1: 'High Energy & Positive (Enthusiasm / Vitality)',
      quadrantQ2: 'High Activation Negative (Tension / Stress)',
      quadrantQ3: 'Low Activation Negative (Depletion / Fatigue)',
      quadrantQ4: 'Low Activation Positive (Serenity / Calm)',
      finishBtn: 'Record Affective Coordinates',
      finishTitle: 'Affect State Evaluated',
      completeAndSave: 'Complete & Save',
      tryAgain: 'Adjust Coordinates',
    },
  }[lang]

  const handlePlaneClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!planeRef.current) return
    const rect = planeRef.current.getBoundingClientRect()
    const px = e.clientX - rect.left
    const py = e.clientY - rect.top

    // Normalize px (0..rect.width) to -100..+100
    const normX = Math.round(((px / rect.width) * 2 - 1) * 100)
    // Invert Y so up is positive arousal
    const normY = Math.round((1 - (py / rect.height) * 2) * 100)

    setCoords({
      x: Math.max(-100, Math.min(100, normX)),
      y: Math.max(-100, Math.min(100, normY)),
    })
  }

  const getQuadrant = (x: number, y: number) => {
    if (x >= 0 && y >= 0) return t.quadrantQ1
    if (x < 0 && y >= 0) return t.quadrantQ2
    if (x < 0 && y < 0) return t.quadrantQ3
    return t.quadrantQ4
  }

  const currentQuadrant = getQuadrant(coords.x, coords.y)

  const handleFinish = () => {
    onComplete({
      summary: `${currentQuadrant} (Valence: ${coords.x}, Arousal: ${coords.y}).`,
      metrics: {
        valence: coords.x,
        arousal: coords.y,
        quadrant: currentQuadrant,
      },
    })
  }

  return (
    <div className="flex flex-col items-center max-w-xl mx-auto w-full select-none">
      <div className="w-full flex items-center justify-between mb-4">
        <Badge variant="cyan" className="gap-1">
          <Smile className="w-3 h-3" />
          <span>{t.standard}</span>
        </Badge>
        <span className="text-xs font-mono text-zinc-500">
          V: <span className="font-bold text-emerald-500">{coords.x}</span> | A:{' '}
          <span className="font-bold text-cyan-500">{coords.y}</span>
        </span>
      </div>

      {!isFinished ? (
        <div className="w-full flex flex-col items-center">
          <p className="text-xs text-zinc-500 mb-3">{t.instruction}</p>

          {/* 2D Plane Container */}
          <div
            ref={planeRef}
            onClick={handlePlaneClick}
            className="w-full max-w-md aspect-square rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl relative overflow-hidden cursor-crosshair mb-6"
          >
            {/* Quadrant Tinting */}
            <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-amber-500/5 hover:bg-amber-500/10 transition-colors" />
            <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-rose-500/5 hover:bg-rose-500/10 transition-colors" />
            <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-blue-500/5 hover:bg-blue-500/10 transition-colors" />
            <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors" />

            {/* Center crosshairs */}
            <div className="absolute top-0 bottom-0 left-1/2 w-px bg-zinc-200 dark:bg-zinc-800" />
            <div className="absolute left-0 right-0 top-1/2 h-px bg-zinc-200 dark:bg-zinc-800" />

            {/* Axis labels */}
            <span className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] font-mono text-zinc-400 font-bold uppercase">
              + Активация (Энергия)
            </span>
            <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-mono text-zinc-400 font-bold uppercase">
              - Сонливость (Спад)
            </span>
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-zinc-400 font-bold uppercase">
              + Позитив
            </span>
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-zinc-400 font-bold uppercase">
              - Негатив
            </span>

            {/* Interactive Puck */}
            <div
              style={{
                left: `${((coords.x + 100) / 200) * 100}%`,
                top: `${((100 - coords.y) / 200) * 100}%`,
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-900 shadow-xl flex items-center justify-center transition-all duration-150 pointer-events-none"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-white shadow animate-pulse" />
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-6 text-center w-full max-w-md">
            {currentQuadrant}
          </div>

          <Button variant="emerald" size="lg" onClick={() => setIsFinished(true)} className="gap-2 w-full max-w-sm">
            <CheckCircle className="w-5 h-5" />
            <span>{t.finishBtn}</span>
          </Button>
        </div>
      ) : (
        <div className="w-full rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 text-center shadow-xl">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-4">
            <Award className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">{t.finishTitle}</h3>

          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/80 max-w-md mx-auto my-6">
            <div className="text-sm font-bold text-emerald-500 mb-2">{currentQuadrant}</div>
            <div className="text-xs text-zinc-500 font-mono">
              Valence: {coords.x} | Arousal: {coords.y}
            </div>
          </div>

          <div className="flex gap-3 justify-center max-w-sm mx-auto">
            <Button variant="outline" onClick={() => setIsFinished(false)} className="gap-2 flex-1">
              <RotateCcw className="w-4 h-4" />
              <span>{t.tryAgain}</span>
            </Button>
            <Button variant="emerald" onClick={handleFinish} className="gap-2 flex-1">
              <CheckCircle className="w-4 h-4" />
              <span>{t.completeAndSave}</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
