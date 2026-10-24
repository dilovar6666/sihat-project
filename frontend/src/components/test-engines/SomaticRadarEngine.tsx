import React, { useState } from 'react'
import { Activity, Award, CheckCircle, RotateCcw } from 'lucide-react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import type { Language } from '../../i18n'

interface SomaticRadarEngineProps {
  lang: Language
  onComplete: (result: { summary: string; metrics: Record<string, unknown> }) => void
}

interface AxisDef {
  key: string
  label: { ru: string; tj: string; en: string }
  val: number
}

export const SomaticRadarEngine: React.FC<SomaticRadarEngineProps> = ({ lang, onComplete }) => {
  const [axes, setAxes] = useState<AxisDef[]>([
    { key: 'muscles', label: { ru: 'Мышечный тонус шеи/спины', tj: 'Шаддодияти мушакҳои гардан/пушт', en: 'Neck/Back Muscle Comfort' }, val: 70 },
    { key: 'vision', label: { ru: 'Зрительный комфорт (без рези)', tj: 'Бароҳатии чашм (бе сӯзиш)', en: 'Visual Ocular Comfort' }, val: 65 },
    { key: 'energy', label: { ru: 'Общий соматический тонус', tj: 'Нерӯи умумии ҷисмонӣ', en: 'Somatic Vitality & Energy' }, val: 80 },
    { key: 'sleep', label: { ru: 'Восстановление после сна', tj: 'Барқароршавӣ пас аз хоб', en: 'Restorative Sleep Quality' }, val: 75 },
    { key: 'breathing', label: { ru: 'Глубина и ритм дыхания', tj: 'Фарохӣ ва ритми нафаскашӣ', en: 'Respiratory Rhythm & Depth' }, val: 85 },
  ])
  const [isFinished, setIsFinished] = useState(false)

  const t = {
    ru: {
      title: 'Соматический тонус и баланс энергии',
      subtitle: 'Многоосевой радар телесного комфорта и физиологического напряжения.',
      standard: 'Somatic Wellbeing Radar & Physical Homeostasis',
      instruction: 'Отрегулируйте 5 ползунков в соответствии с вашим текущим состоянием:',
      finishBtn: 'Зафиксировать соматический статус',
      homeostasisScore: 'Индекс соматического баланса',
      normOptimal: 'Высокий уровень тонуса и комфорта (≥ 80%)',
      normGood: 'Умеренное напряжение (60–79%)',
      normSub: 'Признаки соматического утомления (< 60%)',
      completeAndSave: 'Завершить и сохранить',
      tryAgain: 'Сбросить шкалы',
    },
    tj: {
      title: 'Тонуси ҷисмонӣ ва тавозуни нерӯ',
      subtitle: 'Радари бисёрсамтаи бароҳатии бадан ва оромӣ.',
      standard: 'Somatic Wellbeing Radar & Physical Homeostasis',
      instruction: '5 танзимгарро вобаста ба ҳолати кунунии худ мувофиқ кунед:',
      finishBtn: 'Сабти ҳолати ҷисмонӣ',
      homeostasisScore: 'Шохиси тавозуни ҷисмонӣ',
      normOptimal: 'Сатҳи баланди нерӯ ва бароҳатӣ (≥ 80%)',
      normGood: 'Хастагии мӯътадил (60–79%)',
      normSub: 'Нишонаҳои хастагии ҷисмонӣ (< 60%)',
      completeAndSave: 'Анҷом ва сабт кардан',
      tryAgain: 'Аз нав гузоштан',
    },
    en: {
      title: 'Somatic Equilibrium & Energy Radar',
      subtitle: 'Multi-axial sensory assessment of physical tension and restorative tone.',
      standard: 'Somatic Wellbeing Radar Protocol',
      instruction: 'Calibrate the 5 somatic axes to reflect your current physical sensation:',
      finishBtn: 'Record Somatic Status',
      homeostasisScore: 'Somatic Homeostasis Index',
      normOptimal: 'Optimal Somatic Vitality (≥ 80%)',
      normGood: 'Moderate Tension / Normal Range (60–79%)',
      normSub: 'Somatic Fatigue Indicated (< 60%)',
      completeAndSave: 'Complete & Save',
      tryAgain: 'Reset Sliders',
    },
  }[lang]

  const handleSliderChange = (idx: number, newVal: number) => {
    const next = [...axes]
    next[idx].val = newVal
    setAxes(next)
  }

  // Calculate radar polygon points
  const size = 260
  const center = size / 2
  const maxRadius = center - 25

  const points = axes.map((axis, i) => {
    const angle = (Math.PI * 2 / axes.length) * i - Math.PI / 2
    const r = (axis.val / 100) * maxRadius
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    }
  })

  const polygonPath = points.map((p) => `${p.x},${p.y}`).join(' ')

  const avgScore = Math.round(axes.reduce((sum, a) => sum + a.val, 0) / axes.length)

  const handleFinish = () => {
    let category = t.normGood
    if (avgScore >= 80) category = t.normOptimal
    else if (avgScore < 60) category = t.normSub

    const metricsData: Record<string, number> = {}
    axes.forEach((a) => {
      metricsData[a.key] = a.val
    })

    onComplete({
      summary: `${t.homeostasisScore}: ${avgScore}% (${category}).`,
      metrics: {
        somatic_index_pct: avgScore,
        axes: metricsData,
        status_category: category,
      },
    })
  }

  return (
    <div className="flex flex-col items-center max-w-xl mx-auto w-full select-none">
      <div className="w-full flex items-center justify-between mb-4">
        <Badge variant="cyan" className="gap-1">
          <Activity className="w-3 h-3" />
          <span>{t.standard}</span>
        </Badge>
        <span className="text-xs font-mono text-zinc-500">
          Index: <span className="font-bold text-emerald-500">{avgScore}%</span>
        </span>
      </div>

      {!isFinished ? (
        <div className="w-full flex flex-col items-center">
          {/* Dynamic SVG Radar */}
          <div className="w-full max-w-sm aspect-square rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl flex items-center justify-center p-4 mb-6">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
              {/* Background rings */}
              {[0.25, 0.5, 0.75, 1.0].map((level) => (
                <polygon
                  key={level}
                  points={axes
                    .map((_, i) => {
                      const angle = (Math.PI * 2 / axes.length) * i - Math.PI / 2
                      const r = level * maxRadius
                      return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`
                    })
                    .join(' ')}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-zinc-200 dark:text-zinc-800"
                />
              ))}

              {/* Axis rays */}
              {axes.map((_, i) => {
                const angle = (Math.PI * 2 / axes.length) * i - Math.PI / 2
                return (
                  <line
                    key={i}
                    x1={center}
                    y1={center}
                    x2={center + maxRadius * Math.cos(angle)}
                    y2={center + maxRadius * Math.sin(angle)}
                    stroke="currentColor"
                    strokeWidth="1"
                    className="text-zinc-200 dark:text-zinc-800"
                  />
                )
              })}

              {/* Polygon fill */}
              <polygon
                points={polygonPath}
                fill="rgba(16, 185, 129, 0.25)"
                stroke="#10b981"
                strokeWidth="2.5"
                className="transition-all duration-200"
              />

              {/* Data points */}
              {points.map((p, i) => (
                <circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r="4.5"
                  fill="#10b981"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
              ))}
            </svg>
          </div>

          <p className="text-xs text-zinc-500 mb-4">{t.instruction}</p>

          {/* Sliders */}
          <div className="w-full space-y-4 mb-8">
            {axes.map((axis, idx) => (
              <div key={axis.key} className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/80">
                <div className="flex justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  <span>{axis.label[lang] || axis.label.ru}</span>
                  <span className="font-mono text-emerald-500 font-bold">{axis.val}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={axis.val}
                  onChange={(e) => handleSliderChange(idx, parseInt(e.target.value, 10))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>
            ))}
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
          <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">{t.title}</h3>

          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/80 max-w-xs mx-auto my-6">
            <div className="text-xs text-zinc-500 mb-1">{t.homeostasisScore}</div>
            <div className="text-4xl font-black text-emerald-500 font-mono">
              {avgScore}%
            </div>
            <div className="text-xs text-zinc-400 mt-1">
              {avgScore >= 80 ? t.normOptimal : avgScore >= 60 ? t.normGood : t.normSub}
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
