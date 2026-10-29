import React, { useState, useEffect, useRef } from 'react'
import { Grid, Play, RotateCcw, CheckCircle, Sparkles } from 'lucide-react'
import { Button } from '../ui/Button'
import { shuffleArray, type InteractiveEngineProps } from './engineTypes'

interface StimSpec {
  shape: string
  rotation?: number
  count?: number
  fill?: string
  size?: number
  solid?: boolean
  color?: string
}

interface PatternOption {
  id: string
  stim?: StimSpec
  shape?: string
  color?: string
}

interface PatternItem {
  id: string
  sequence: StimSpec[]
  options: PatternOption[]
  _localCorrectOption?: string
}

const SHAPES = ['circle', 'square', 'triangle', 'diamond', 'hexagon']
const FILLS = ['#17A884', '#3B82F6', '#8B5CF6', '#F59E0B']

function makeStim(overrides: Partial<StimSpec> = {}): StimSpec {
  return {
    shape: 'circle',
    rotation: 0,
    count: 1,
    fill: '#17A884',
    size: 1.0,
    solid: true,
    ...overrides,
  }
}

function buildFallbackPatternItems(): PatternItem[] {
  const builders: Array<() => { seq: StimSpec[]; correct: StimSpec; wrong: StimSpec[] }> = [
    () => {
      const [a, b, c, d] = shuffleArray(SHAPES).slice(0, 4)
      const fill = FILLS[Math.floor(Math.random() * FILLS.length)]
      return {
        seq: [a, b, c, a, b].map((s) => makeStim({ shape: s, fill })),
        correct: makeStim({ shape: c, fill }),
        wrong: [a, b, d].map((s) => makeStim({ shape: s, fill })),
      }
    },
    () => {
      const step = [45, 90, -45, -90][Math.floor(Math.random() * 4)]
      const start = Math.floor(Math.random() * 8) * 45
      const fill = FILLS[Math.floor(Math.random() * FILLS.length)]
      const rot = (k: number) => (((start + k * step) % 360) + 360) % 360
      return {
        seq: [0, 1, 2, 3, 4].map((k) => makeStim({ shape: 'triangle', rotation: rot(k), fill })),
        correct: makeStim({ shape: 'triangle', rotation: rot(5), fill }),
        wrong: [rot(4), rot(6), (rot(5) + 180) % 360].map((r) =>
          makeStim({ shape: 'triangle', rotation: r, fill })
        ),
      }
    },
    () => {
      const step = Math.random() < 0.5 ? 1 : 2
      const start = 1
      const fill = FILLS[Math.floor(Math.random() * FILLS.length)]
      const ans = start + 5 * step
      return {
        seq: [0, 1, 2, 3, 4].map((k) => makeStim({ count: start + k * step, fill })),
        correct: makeStim({ count: ans, fill }),
        wrong: [Math.max(1, ans - 1), ans + 1, ans + 2].map((n) => makeStim({ count: n, fill })),
      }
    },
    () => {
      const [s1, s2] = shuffleArray(SHAPES).slice(0, 2)
      const [f1, f2] = shuffleArray(FILLS).slice(0, 2)
      const one = makeStim({ shape: s1, fill: f1, size: 1.0, solid: true })
      const two = makeStim({ shape: s1, fill: f2, size: 0.65, solid: false })
      return {
        seq: [one, two, one, two, one],
        correct: two,
        wrong: [
          one,
          makeStim({ shape: s1, fill: f2, size: 1.0, solid: false }),
          makeStim({ shape: s2, fill: f2, size: 0.65, solid: false }),
        ],
      }
    },
  ]

  const order = shuffleArray([...builders, builders[0], builders[1]])
  return order.map((fn, idx) => {
    const { seq, correct, wrong } = fn()
    const rawOpts = shuffleArray([
      { isCorrect: true, stim: correct },
      ...wrong.map((w) => ({ isCorrect: false, stim: w })),
    ])
    let correctId = 'o0'
    const options: PatternOption[] = rawOpts.map((item, i) => {
      const oid = `o${i}`
      if (item.isCorrect) correctId = oid
      return { id: oid, stim: item.stim }
    })
    return {
      id: `i${idx + 1}`,
      sequence: seq,
      options,
      _localCorrectOption: correctId,
    }
  })
}

const renderSingleShapeSvg = (
  shape: string,
  fill: string,
  solid: boolean,
  rotation: number,
  scale: number
) => {
  const fillVal = solid ? fill : 'none'
  const strokeVal = fill
  const strokeWidth = solid ? 2 : 5
  return (
    <g transform={`translate(50 50) rotate(${rotation}) scale(${scale}) translate(-50 -50)`}>
      {shape === 'circle' && (
        <circle cx="50" cy="50" r="30" fill={fillVal} stroke={strokeVal} strokeWidth={strokeWidth} />
      )}
      {shape === 'square' && (
        <rect
          x="22"
          y="22"
          width="56"
          height="56"
          rx="8"
          fill={fillVal}
          stroke={strokeVal}
          strokeWidth={strokeWidth}
        />
      )}
      {shape === 'triangle' && (
        <polygon
          points="50,16 84,78 16,78"
          fill={fillVal}
          stroke={strokeVal}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
      )}
      {shape === 'diamond' && (
        <polygon
          points="50,14 86,50 50,86 14,50"
          fill={fillVal}
          stroke={strokeVal}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
      )}
      {(shape === 'hexagon' || shape === 'pentagon') && (
        <polygon
          points="50,14 82,32 82,68 50,86 18,68 18,32"
          fill={fillVal}
          stroke={strokeVal}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
      )}
    </g>
  )
}

const renderStimulus = (raw: StimSpec) => {
  const shape = raw.shape || 'circle'
  const fill = raw.fill || raw.color || '#17A884'
  const rotation = raw.rotation || 0
  const count = raw.count || 1
  const size = raw.size || 1.0
  const solid = raw.solid !== false

  if (count > 1) {
    const cols = count <= 4 ? 2 : count <= 9 ? 3 : 4
    const rows = Math.ceil(count / cols)
    const dotRadius = count <= 4 ? 11 : count <= 9 ? 8 : 6.5
    const dots: Array<{ cx: number; cy: number }> = []
    for (let i = 0; i < count; i++) {
      const r = Math.floor(i / cols)
      const c = i % cols
      const cx = 50 + (c - (cols - 1) / 2) * (70 / Math.max(1, cols))
      const cy = 50 + (r - (rows - 1) / 2) * (70 / Math.max(1, rows))
      dots.push({ cx, cy })
    }
    return (
      <svg viewBox="0 0 100 100" className="w-12 h-12 sm:w-14 sm:h-14">
        {dots.map((d, i) => (
          <circle key={i} cx={d.cx} cy={d.cy} r={dotRadius} fill={fill} />
        ))}
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 100 100" className="w-12 h-12 sm:w-14 sm:h-14">
      {renderSingleShapeSvg(shape, fill, solid, rotation, size)}
    </svg>
  )
}

export const PatternMatrixEngine: React.FC<InteractiveEngineProps> = ({
  lang,
  challenge,
  onComplete,
  onRequestNewTask,
}) => {
  const [items, setItems] = useState<PatternItem[]>(() =>
    Array.isArray(challenge?.items) && challenge.items.length > 0
      ? (challenge.items as PatternItem[])
      : buildFallbackPatternItems()
  )
  const [currentIdx, setCurrentIdx] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const [isFinished, setIsFinished] = useState(false)

  const itemStartTimeRef = useRef<number>(0)
  const answersRef = useRef<Array<{ id: string; option: string; t: number }>>([])
  const usedChallengeRef = useRef(false)

  useEffect(() => {
    if (Array.isArray(challenge?.items) && challenge.items.length > 0 && !isActive && !isFinished) {
      setItems(challenge.items as PatternItem[])
      usedChallengeRef.current = false
    }
  }, [challenge, isActive, isFinished])

  const currentItem = items[currentIdx]

  const t = {
    ru: {
      title: 'Продолжи последовательность (Визуальная логика)',
      subtitle: 'Определите закономерность в ряду из 5 фигур (форма, поворот, количество элементов или чередование) и выберите 6-й элемент.',
      startBtn: 'Начать серию из 6 задач',
      questionNum: 'Задача',
      of: 'из',
      selectMissing: 'Выберите фигуру на место знака вопроса:',
      finishTitle: 'Серия задач завершена!',
      tryAgain: 'Новый вариант',
      saveBtn: 'Показать подробный отчёт',
    },
    tj: {
      title: 'Пайдарпайиро давом диҳед (Мантиқи биноӣ)',
      subtitle: 'Қонунияти қатори 5 шаклро муайян намоед ва унсури 6-умро интихоб кунед.',
      startBtn: 'Оғози силсилаи 6 масъала',
      questionNum: 'Масъалаи',
      of: 'аз',
      selectMissing: 'Шакли мувофиқро ба ҷои аломати савол интихоб намоед:',
      finishTitle: 'Силсилаи масъалаҳо анҷом ёфт!',
      tryAgain: 'Варианти нав',
      saveBtn: 'Дидани ҳисоботи муфассал',
    },
    en: {
      title: 'Continue the Sequence (Visual Reasoning)',
      subtitle: 'Identify the rule governing the 5-step geometric sequence (shape cycle, rotation, item count, or alternation) and select the 6th figure.',
      startBtn: 'Start 6-Item Sequence Test',
      questionNum: 'Item',
      of: 'of',
      selectMissing: 'Choose the option that completes the sequence:',
      finishTitle: 'Pattern Sequence Completed!',
      tryAgain: 'New Variant',
      saveBtn: 'View Detailed Report',
    },
  }[lang]

  const handleStart = (requestFresh = false) => {
    if (requestFresh && onRequestNewTask) {
      onRequestNewTask()
    }
    if (!usedChallengeRef.current && Array.isArray(challenge?.items) && challenge.items.length > 0) {
      setItems(challenge.items as PatternItem[])
      usedChallengeRef.current = true
    } else {
      setItems(buildFallbackPatternItems())
    }
    answersRef.current = []
    setCurrentIdx(0)
    setIsFinished(false)
    setIsActive(true)
    itemStartTimeRef.current = performance.now()
  }

  const handleSelectOption = (optionId: string) => {
    if (!isActive || isFinished || !currentItem) return
    const elapsedMs = Math.max(120, Math.round(performance.now() - itemStartTimeRef.current))
    answersRef.current.push({
      id: currentItem.id,
      option: optionId,
      t: elapsedMs,
    })

    if (currentIdx + 1 < items.length) {
      setCurrentIdx((i) => i + 1)
      itemStartTimeRef.current = performance.now()
    } else {
      setIsFinished(true)
    }
  }

  const handleSave = () => {
    const answers = answersRef.current
    const total = items.length
    let localCorrect = 0
    for (const it of items) {
      const given = answers.find((a) => a.id === it.id)?.option
      if (it._localCorrectOption && given === it._localCorrectOption) {
        localCorrect += 1
      }
    }
    const timesSec = answers.map((a) => Number((a.t / 1000).toFixed(1)))
    const meanSec =
      timesSec.length > 0 ? Number((timesSec.reduce((a, b) => a + b, 0) / timesSec.length).toFixed(1)) : 0

    onComplete({
      summary: `${t.finishTitle} (${answers.length}/${total})`,
      metrics: {
        version: 2,
        engine: 'pattern',
        metrics: {
          correct_count: localCorrect,
          total_items: total,
          errors_count: total - localCorrect,
          accuracy_pct: Number(((localCorrect / Math.max(1, total)) * 100).toFixed(1)),
          mean_item_sec: meanSec,
        },
        series: {
          by_rule: [],
          item_times_sec: timesSec,
        },
      },
      telemetry: {
        answers,
      },
    })
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto text-center select-none">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100 flex items-center justify-center gap-2">
          <Grid className="w-6 h-6 text-emerald-500" />
          <span>{t.title}</span>
        </h2>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-md mx-auto leading-relaxed">
          {t.subtitle}
        </p>
      </div>

      {!isActive ? (
        <div className="p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-center space-y-5 shadow-md">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 text-emerald-500 mx-auto flex items-center justify-center border border-emerald-500/30">
            <Sparkles className="w-8 h-8" />
          </div>
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
      ) : !isFinished && currentItem ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-500 px-2">
            <span>
              {t.questionNum} {currentIdx + 1} {t.of} {items.length}
            </span>
            <span className="text-emerald-500 font-bold">
              {Math.round(((currentIdx + 1) / items.length) * 100)}%
            </span>
          </div>

          <div
            data-pattern-item={currentItem.id}
            className="p-5 sm:p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-lg flex flex-wrap items-center justify-center gap-2.5 sm:gap-3"
          >
            {currentItem.sequence.map((stim, idx) => (
              <div
                key={idx}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shadow-xs"
              >
                {renderStimulus(stim)}
              </div>
            ))}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 border-dashed border-emerald-500 bg-emerald-500/10 flex items-center justify-center text-2xl font-black text-emerald-500">
              ?
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">{t.selectMissing}</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {currentItem.options.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  data-pattern-option={opt.id}
                  onClick={() => handleSelectOption(opt.id)}
                  className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500 hover:bg-emerald-500/5 transition-all flex flex-col items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                >
                  {renderStimulus(opt.stim || { shape: opt.shape || 'circle', fill: opt.color || '#17A884' })}
                  <span className="text-[10px] font-mono text-zinc-400 uppercase">{opt.id}</span>
                </button>
              ))}
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
