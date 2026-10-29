import React, { useState, useEffect, useRef } from 'react'
import {
  Eye,
  RotateCcw,
  Play,
  CheckCircle,
  Clock,
  Sparkles,
  Check,
  Heart,
  Star,
  Sun,
  Moon,
  Zap,
  Shield,
  Leaf,
  Cloud,
  Flame,
  Anchor,
  Bell,
  Key,
  Flag,
  Music,
  Droplet,
  Gem,
  Crown,
  Rocket,
  Compass,
  Trophy,
  Palette,
  Camera,
  Gift,
  Coffee,
  Fish,
  Bird,
  Cat,
  Dog,
  Bug,
  Flower2,
  Rainbow,
  Globe,
  Mountain,
  Trees,
  Apple,
  Feather,
  Smile,
  Umbrella,
} from 'lucide-react'
import { Button } from '../ui/Button'
import { shuffleArray, type InteractiveEngineProps } from './engineTypes'

interface PairCard {
  id: number
  symbol: string
}

interface SymbolDefinition {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  label: { ru: string; tj: string; en: string }
  gradient: string
  border: string
  badgeBg: string
}

export const SYMBOL_CONFIG: Record<string, SymbolDefinition> = {
  heart: {
    icon: Heart,
    label: { ru: 'Сердце', tj: 'Дил', en: 'Heart' },
    gradient: 'bg-gradient-to-tr from-rose-500 to-red-600',
    border: 'border-rose-400 dark:border-rose-600',
    badgeBg: 'bg-rose-50/90 dark:bg-rose-950/40',
  },
  star: {
    icon: Star,
    label: { ru: 'Звезда', tj: 'Ситора', en: 'Star' },
    gradient: 'bg-gradient-to-tr from-amber-400 to-yellow-500',
    border: 'border-amber-400 dark:border-amber-500',
    badgeBg: 'bg-amber-50/90 dark:bg-amber-950/40',
  },
  sun: {
    icon: Sun,
    label: { ru: 'Солнце', tj: 'Офтоб', en: 'Sun' },
    gradient: 'bg-gradient-to-tr from-orange-400 to-amber-500',
    border: 'border-orange-400 dark:border-orange-500',
    badgeBg: 'bg-orange-50/90 dark:bg-orange-950/40',
  },
  moon: {
    icon: Moon,
    label: { ru: 'Луна', tj: 'Моҳ', en: 'Moon' },
    gradient: 'bg-gradient-to-tr from-indigo-500 to-violet-600',
    border: 'border-indigo-400 dark:border-indigo-600',
    badgeBg: 'bg-indigo-50/90 dark:bg-indigo-950/40',
  },
  zap: {
    icon: Zap,
    label: { ru: 'Молния', tj: 'Барқ', en: 'Lightning' },
    gradient: 'bg-gradient-to-tr from-yellow-400 to-amber-500',
    border: 'border-yellow-400 dark:border-yellow-500',
    badgeBg: 'bg-yellow-50/90 dark:bg-yellow-950/40',
  },
  shield: {
    icon: Shield,
    label: { ru: 'Щит', tj: 'Сипар', en: 'Shield' },
    gradient: 'bg-gradient-to-tr from-blue-500 to-indigo-600',
    border: 'border-blue-400 dark:border-blue-600',
    badgeBg: 'bg-blue-50/90 dark:bg-blue-950/40',
  },
  leaf: {
    icon: Leaf,
    label: { ru: 'Лист', tj: 'Барг', en: 'Leaf' },
    gradient: 'bg-gradient-to-tr from-emerald-500 to-green-600',
    border: 'border-emerald-400 dark:border-emerald-600',
    badgeBg: 'bg-emerald-50/90 dark:bg-emerald-950/40',
  },
  cloud: {
    icon: Cloud,
    label: { ru: 'Облако', tj: 'Абр', en: 'Cloud' },
    gradient: 'bg-gradient-to-tr from-sky-400 to-cyan-600',
    border: 'border-sky-400 dark:border-sky-600',
    badgeBg: 'bg-sky-50/90 dark:bg-sky-950/40',
  },
  flame: {
    icon: Flame,
    label: { ru: 'Огонь', tj: 'Оташ', en: 'Flame' },
    gradient: 'bg-gradient-to-tr from-orange-500 to-red-600',
    border: 'border-orange-400 dark:border-orange-600',
    badgeBg: 'bg-orange-50/90 dark:bg-orange-950/40',
  },
  anchor: {
    icon: Anchor,
    label: { ru: 'Якорь', tj: 'Лангар', en: 'Anchor' },
    gradient: 'bg-gradient-to-tr from-teal-500 to-cyan-700',
    border: 'border-teal-400 dark:border-teal-600',
    badgeBg: 'bg-teal-50/90 dark:bg-teal-950/40',
  },
  bell: {
    icon: Bell,
    label: { ru: 'Колокол', tj: 'Занг', en: 'Bell' },
    gradient: 'bg-gradient-to-tr from-amber-400 to-yellow-600',
    border: 'border-amber-400 dark:border-amber-600',
    badgeBg: 'bg-amber-50/90 dark:bg-amber-950/40',
  },
  key: {
    icon: Key,
    label: { ru: 'Ключ', tj: 'Калид', en: 'Key' },
    gradient: 'bg-gradient-to-tr from-yellow-500 to-amber-600',
    border: 'border-yellow-400 dark:border-yellow-600',
    badgeBg: 'bg-yellow-50/90 dark:bg-yellow-950/40',
  },
  flag: {
    icon: Flag,
    label: { ru: 'Флаг', tj: 'Парчам', en: 'Flag' },
    gradient: 'bg-gradient-to-tr from-purple-500 to-indigo-600',
    border: 'border-purple-400 dark:border-purple-600',
    badgeBg: 'bg-purple-50/90 dark:bg-purple-950/40',
  },
  music: {
    icon: Music,
    label: { ru: 'Нота', tj: 'Мусиқӣ', en: 'Music' },
    gradient: 'bg-gradient-to-tr from-fuchsia-500 to-pink-600',
    border: 'border-fuchsia-400 dark:border-fuchsia-600',
    badgeBg: 'bg-fuchsia-50/90 dark:bg-fuchsia-950/40',
  },
  droplet: {
    icon: Droplet,
    label: { ru: 'Капля', tj: 'Қатра', en: 'Droplet' },
    gradient: 'bg-gradient-to-tr from-blue-400 to-cyan-500',
    border: 'border-blue-400 dark:border-blue-500',
    badgeBg: 'bg-blue-50/90 dark:bg-blue-950/40',
  },
  gem: {
    icon: Gem,
    label: { ru: 'Кристалл', tj: 'Булӯр', en: 'Gem' },
    gradient: 'bg-gradient-to-tr from-teal-400 to-cyan-500',
    border: 'border-teal-400 dark:border-teal-500',
    badgeBg: 'bg-teal-50/90 dark:bg-teal-950/40',
  },
  crown: {
    icon: Crown,
    label: { ru: 'Корона', tj: 'Тоҷ', en: 'Crown' },
    gradient: 'bg-gradient-to-tr from-amber-400 to-yellow-500',
    border: 'border-amber-400 dark:border-amber-500',
    badgeBg: 'bg-amber-50/90 dark:bg-amber-950/40',
  },
  rocket: {
    icon: Rocket,
    label: { ru: 'Ракета', tj: 'Мушак', en: 'Rocket' },
    gradient: 'bg-gradient-to-tr from-red-500 to-orange-500',
    border: 'border-red-400 dark:border-red-500',
    badgeBg: 'bg-red-50/90 dark:bg-red-950/40',
  },
  compass: {
    icon: Compass,
    label: { ru: 'Компас', tj: 'Қутбнамо', en: 'Compass' },
    gradient: 'bg-gradient-to-tr from-teal-500 to-emerald-600',
    border: 'border-teal-400 dark:border-teal-600',
    badgeBg: 'bg-teal-50/90 dark:bg-teal-950/40',
  },
  trophy: {
    icon: Trophy,
    label: { ru: 'Кубок', tj: 'Ҷом', en: 'Trophy' },
    gradient: 'bg-gradient-to-tr from-yellow-400 to-amber-500',
    border: 'border-yellow-400 dark:border-yellow-500',
    badgeBg: 'bg-yellow-50/90 dark:bg-yellow-950/40',
  },
  palette: {
    icon: Palette,
    label: { ru: 'Палитра', tj: 'Палитра', en: 'Palette' },
    gradient: 'bg-gradient-to-tr from-violet-500 to-purple-600',
    border: 'border-violet-400 dark:border-violet-600',
    badgeBg: 'bg-violet-50/90 dark:bg-violet-950/40',
  },
  camera: {
    icon: Camera,
    label: { ru: 'Камера', tj: 'Камера', en: 'Camera' },
    gradient: 'bg-gradient-to-tr from-indigo-500 to-blue-600',
    border: 'border-indigo-400 dark:border-indigo-600',
    badgeBg: 'bg-indigo-50/90 dark:bg-indigo-950/40',
  },
  gift: {
    icon: Gift,
    label: { ru: 'Подарок', tj: 'Тӯҳфа', en: 'Gift' },
    gradient: 'bg-gradient-to-tr from-pink-500 to-rose-600',
    border: 'border-pink-400 dark:border-pink-600',
    badgeBg: 'bg-pink-50/90 dark:bg-pink-950/40',
  },
  coffee: {
    icon: Coffee,
    label: { ru: 'Кофе', tj: 'Қаҳва', en: 'Coffee' },
    gradient: 'bg-gradient-to-tr from-amber-700 to-orange-900',
    border: 'border-amber-600 dark:border-amber-700',
    badgeBg: 'bg-amber-50/90 dark:bg-amber-950/40',
  },
  fish: {
    icon: Fish,
    label: { ru: 'Рыба', tj: 'Моҳӣ', en: 'Fish' },
    gradient: 'bg-gradient-to-tr from-cyan-400 to-teal-500',
    border: 'border-cyan-400 dark:border-cyan-500',
    badgeBg: 'bg-cyan-50/90 dark:bg-cyan-950/40',
  },
  bird: {
    icon: Bird,
    label: { ru: 'Птица', tj: 'Парранда', en: 'Bird' },
    gradient: 'bg-gradient-to-tr from-sky-400 to-blue-500',
    border: 'border-sky-400 dark:border-sky-500',
    badgeBg: 'bg-sky-50/90 dark:bg-sky-950/40',
  },
  cat: {
    icon: Cat,
    label: { ru: 'Кот', tj: 'Гурба', en: 'Cat' },
    gradient: 'bg-gradient-to-tr from-orange-400 to-amber-600',
    border: 'border-orange-400 dark:border-orange-600',
    badgeBg: 'bg-orange-50/90 dark:bg-orange-950/40',
  },
  dog: {
    icon: Dog,
    label: { ru: 'Собака', tj: 'Саг', en: 'Dog' },
    gradient: 'bg-gradient-to-tr from-amber-500 to-orange-700',
    border: 'border-amber-500 dark:border-amber-700',
    badgeBg: 'bg-amber-50/90 dark:bg-amber-950/40',
  },
  bug: {
    icon: Bug,
    label: { ru: 'Жук', tj: 'Гамбӯсак', en: 'Bug' },
    gradient: 'bg-gradient-to-tr from-lime-500 to-emerald-600',
    border: 'border-lime-400 dark:border-lime-600',
    badgeBg: 'bg-lime-50/90 dark:bg-lime-950/40',
  },
  flower: {
    icon: Flower2,
    label: { ru: 'Цветок', tj: 'Гул', en: 'Flower' },
    gradient: 'bg-gradient-to-tr from-pink-400 to-rose-500',
    border: 'border-pink-400 dark:border-pink-500',
    badgeBg: 'bg-pink-50/90 dark:bg-pink-950/40',
  },
  rainbow: {
    icon: Rainbow,
    label: { ru: 'Радуга', tj: 'Тирукамон', en: 'Rainbow' },
    gradient: 'bg-gradient-to-tr from-indigo-500 via-pink-500 to-amber-500',
    border: 'border-purple-400 dark:border-purple-500',
    badgeBg: 'bg-purple-50/90 dark:bg-purple-950/40',
  },
  sparkles: {
    icon: Sparkles,
    label: { ru: 'Сияние', tj: 'Дурахш', en: 'Sparkles' },
    gradient: 'bg-gradient-to-tr from-yellow-400 via-amber-400 to-orange-400',
    border: 'border-yellow-400 dark:border-yellow-500',
    badgeBg: 'bg-yellow-50/90 dark:bg-yellow-950/40',
  },
  globe: {
    icon: Globe,
    label: { ru: 'Планета', tj: 'Сайёра', en: 'Globe' },
    gradient: 'bg-gradient-to-tr from-blue-400 to-emerald-500',
    border: 'border-blue-400 dark:border-blue-500',
    badgeBg: 'bg-blue-50/90 dark:bg-blue-950/40',
  },
  mountain: {
    icon: Mountain,
    label: { ru: 'Горы', tj: 'Кӯҳҳо', en: 'Mountain' },
    gradient: 'bg-gradient-to-tr from-slate-500 to-indigo-600',
    border: 'border-slate-400 dark:border-slate-600',
    badgeBg: 'bg-slate-50/90 dark:bg-slate-900/40',
  },
  trees: {
    icon: Trees,
    label: { ru: 'Лес', tj: 'Ҷангал', en: 'Forest' },
    gradient: 'bg-gradient-to-tr from-emerald-600 to-green-700',
    border: 'border-emerald-500 dark:border-emerald-600',
    badgeBg: 'bg-emerald-50/90 dark:bg-emerald-950/40',
  },
  apple: {
    icon: Apple,
    label: { ru: 'Яблоко', tj: 'Себ', en: 'Apple' },
    gradient: 'bg-gradient-to-tr from-rose-500 to-red-600',
    border: 'border-rose-400 dark:border-rose-600',
    badgeBg: 'bg-rose-50/90 dark:bg-rose-950/40',
  },
  feather: {
    icon: Feather,
    label: { ru: 'Перо', tj: 'Пар', en: 'Feather' },
    gradient: 'bg-gradient-to-tr from-purple-400 to-indigo-500',
    border: 'border-purple-300 dark:border-purple-500',
    badgeBg: 'bg-purple-50/90 dark:bg-purple-950/40',
  },
  smile: {
    icon: Smile,
    label: { ru: 'Улыбка', tj: 'Табассум', en: 'Smile' },
    gradient: 'bg-gradient-to-tr from-yellow-400 to-amber-500',
    border: 'border-yellow-400 dark:border-yellow-500',
    badgeBg: 'bg-yellow-50/90 dark:bg-yellow-950/40',
  },
  umbrella: {
    icon: Umbrella,
    label: { ru: 'Зонт', tj: 'Чатр', en: 'Umbrella' },
    gradient: 'bg-gradient-to-tr from-violet-500 to-indigo-600',
    border: 'border-violet-400 dark:border-violet-600',
    badgeBg: 'bg-violet-50/90 dark:bg-violet-950/40',
  },
}

const DEFAULT_SYMBOL_STYLE: SymbolDefinition = {
  icon: Sparkles,
  label: { ru: 'Символ', tj: 'Рамз', en: 'Symbol' },
  gradient: 'bg-gradient-to-tr from-emerald-500 to-teal-600',
  border: 'border-emerald-400 dark:border-emerald-600',
  badgeBg: 'bg-emerald-50/90 dark:bg-emerald-950/40',
}

const ALL_ICON_KEYS = Object.keys(SYMBOL_CONFIG)

function buildFallbackDeck(): PairCard[] {
  const chosen = shuffleArray(ALL_ICON_KEYS).slice(0, 6)
  const symbols = shuffleArray([...chosen, ...chosen])
  return symbols.map((symbol, i) => ({ id: i, symbol }))
}

export const VisualPairsEngine: React.FC<InteractiveEngineProps> = ({
  lang,
  challenge,
  onComplete,
  onRequestNewTask,
}) => {
  const [cards, setCards] = useState<PairCard[]>(() =>
    Array.isArray(challenge?.cards) && challenge.cards.length === 12
      ? (challenge.cards as Array<{ id?: number; card_id?: number; symbol: string }>).map((c, idx) => ({
          id: typeof c.id === 'number' ? c.id : typeof c.card_id === 'number' ? c.card_id : idx,
          symbol: c.symbol,
        }))
      : buildFallbackDeck()
  )
  const [flippedIds, setFlippedIds] = useState<number[]>([])
  const [matchedIds, setMatchedIds] = useState<number[]>([])
  const [moves, setMoves] = useState(0)
  const [mismatches, setMismatches] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  const [elapsedSec, setElapsedSec] = useState(0)

  const timerRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)
  const flipsRef = useRef<Array<{ card: number; t: number }>>([])
  const outcomesRef = useRef<boolean[]>([])
  const usedChallengeRef = useRef(false)

  useEffect(() => {
    if (Array.isArray(challenge?.cards) && challenge.cards.length === 12 && !isActive && !isFinished) {
      setCards(
        (challenge.cards as Array<{ id?: number; card_id?: number; symbol: string }>).map((c, idx) => ({
          id: typeof c.id === 'number' ? c.id : typeof c.card_id === 'number' ? c.card_id : idx,
          symbol: c.symbol,
        }))
      )
      usedChallengeRef.current = false
    }
  }, [challenge, isActive, isFinished])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const t = {
    ru: {
      title: 'Визуальные пары (Ассоциативная память)',
      subtitle:
        'Открывайте карточки попарно, запоминайте цветные образы и найдите все 6 пар за минимальное число ходов.',
      startBtn: 'Начать поиск пар',
      moves: 'Ходов:',
      pairsFound: 'Найдено пар:',
      of: 'из',
      time: 'Время:',
      sec: 'с',
      finishTitle: 'Все 6 пар успешно найдены!',
      tryAgain: 'Новый вариант',
      saveBtn: 'Показать подробный отчёт',
    },
    tj: {
      title: 'Ҷуфтҳои биноӣ (Хотираи ассотсиативӣ)',
      subtitle:
        'Кортҳоро ҷуфт-ҷуфт кушоед, тасвирҳои рангаро дар хотир гиред ва ҳамаи 6 ҷуфтро бо камтарин гашт пайдо намоед.',
      startBtn: 'Оғози ҷустуҷӯи ҷуфтҳо',
      moves: 'Гаштҳо:',
      pairsFound: 'Ҷуфтҳои ёфтшуда:',
      of: 'аз',
      time: 'Вақт:',
      sec: 'с',
      finishTitle: 'Ҳамаи 6 ҷуфт бомуваффақият ёфт шуданд!',
      tryAgain: 'Варианти нав',
      saveBtn: 'Дидани ҳисоботи муфассал',
    },
    en: {
      title: 'Visual Pairs (Associative Memory)',
      subtitle:
        'Flip cards in pairs, remember colorful visual concepts, and match all 6 pairs in the fewest moves possible.',
      startBtn: 'Start Matching',
      moves: 'Moves:',
      pairsFound: 'Pairs Found:',
      of: 'of',
      time: 'Time:',
      sec: 's',
      finishTitle: 'All 6 pairs discovered!',
      tryAgain: 'New Variant',
      saveBtn: 'View Detailed Report',
    },
  }[lang] || {
    title: 'Визуальные пары (Ассоциативная память)',
    subtitle: 'Открывайте карточки попарно и найдите все 6 пар за минимальное число ходов.',
    startBtn: 'Начать поиск пар',
    moves: 'Ходов:',
    pairsFound: 'Найдено пар:',
    of: 'из',
    time: 'Время:',
    sec: 'с',
    finishTitle: 'Все 6 пар успешно найдены!',
    tryAgain: 'Новый вариант',
    saveBtn: 'Показать подробный отчёт',
  }

  const handleStart = (requestFresh = false) => {
    if (requestFresh && onRequestNewTask) {
      onRequestNewTask()
    }
    if (!usedChallengeRef.current && Array.isArray(challenge?.cards) && challenge.cards.length === 12) {
      setCards(
        (challenge.cards as Array<{ id?: number; card_id?: number; symbol: string }>).map((c, idx) => ({
          id: typeof c.id === 'number' ? c.id : typeof c.card_id === 'number' ? c.card_id : idx,
          symbol: c.symbol,
        }))
      )
      usedChallengeRef.current = true
    } else {
      setCards(buildFallbackDeck())
    }

    flipsRef.current = []
    outcomesRef.current = []
    setFlippedIds([])
    setMatchedIds([])
    setMoves(0)
    setMismatches(0)
    setElapsedSec(0)
    setIsFinished(false)
    setIsActive(true)
    startTimeRef.current = performance.now()
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = window.setInterval(() => {
      setElapsedSec(Math.round((performance.now() - startTimeRef.current) / 100) / 10)
    }, 100)
  }

  const handleCardClick = (card: PairCard) => {
    if (!isActive || isFinished) return
    if (flippedIds.includes(card.id) || matchedIds.includes(card.id)) return
    if (flippedIds.length >= 2) return

    const rawElapsed = Math.round(performance.now() - startTimeRef.current)
    const prevT = flipsRef.current.length > 0 ? flipsRef.current[flipsRef.current.length - 1].t : 0
    const recordedT = Math.max(rawElapsed, prevT + 80)
    flipsRef.current.push({ card: card.id, t: recordedT })

    const nextFlipped = [...flippedIds, card.id]
    setFlippedIds(nextFlipped)

    if (nextFlipped.length === 2) {
      setMoves((m) => m + 1)
      const firstCard = cards.find((c) => c.id === nextFlipped[0])
      const secondCard = card

      if (firstCard && firstCard.symbol === secondCard.symbol) {
        const nextMatched = [...matchedIds, firstCard.id, secondCard.id]
        outcomesRef.current.push(true)
        setMatchedIds(nextMatched)
        setFlippedIds([])
        if (nextMatched.length === 12) {
          if (timerRef.current) clearInterval(timerRef.current)
          setElapsedSec(Number((recordedT / 1000).toFixed(1)))
          setIsFinished(true)
        }
      } else {
        outcomesRef.current.push(false)
        setMismatches((mm) => mm + 1)
        setTimeout(() => {
          setFlippedIds([])
        }, 700)
      }
    }
  }

  const handleCompleteAndSave = () => {
    const efficiencyPct = Number(((6 / Math.max(6, moves)) * 100).toFixed(1))
    onComplete({
      summary: `${t.finishTitle} (${moves} ходов, ${elapsedSec} ${t.sec})`,
      metrics: {
        version: 2,
        engine: 'visual_pairs',
        metrics: {
          moves_count: moves,
          mismatches_count: mismatches,
          time_sec: elapsedSec,
          efficiency_pct: efficiencyPct,
        },
        series: {
          move_outcomes: outcomesRef.current,
        },
      },
      telemetry: {
        flips: flipsRef.current,
      },
    })
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto text-center select-none animate-fadeIn">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center justify-center gap-2">
          <Eye className="w-6 h-6 text-emerald-500" />
          <span>{t.title}</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-lg mx-auto leading-relaxed">
          {t.subtitle}
        </p>
      </div>

      {!isActive ? (
        <div className="p-8 sm:p-10 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md text-center space-y-6 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/25">
            <Sparkles className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              {lang === 'tj' ? 'Омодаед барои санҷиш?' : lang === 'en' ? 'Ready to begin?' : 'Готовы к упражнению?'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              {lang === 'tj'
                ? 'Дар ҳар гашт 2 кортро боз кунед ва ҷуфтҳои якхеларо пайдо намоед.'
                : lang === 'en'
                ? 'Flip 2 cards per turn to uncover and match identical colorful pairs.'
                : 'Запоминайте красочные карточки и открывайте их попарно за наименьшее число попыток.'}
            </p>
          </div>
          <Button
            size="lg"
            variant="emerald"
            onClick={() => handleStart(false)}
            className="gap-2 px-8 py-3.5 text-base font-bold cursor-pointer shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>{t.startBtn}</span>
          </Button>
        </div>
      ) : (
        <>
          {/* Top Status Bar */}
          <div className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 shadow-md text-xs font-mono">
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
              <span>{t.pairsFound}</span>
              <span className="text-sm px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                {matchedIds.length / 2} {t.of} 6
              </span>
            </div>
            <div className="flex items-center gap-4 text-slate-600 dark:text-slate-300">
              <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md">
                {t.moves} <strong className="text-slate-900 dark:text-white">{moves}</strong>
              </span>
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md">
                <Clock className="w-3.5 h-3.5 text-emerald-500" />
                <span>
                  {elapsedSec.toFixed(1)} {t.sec}
                </span>
              </div>
            </div>
          </div>

          {/* Cards Grid with True 3D Flip */}
          <div className="grid grid-cols-4 gap-2.5 sm:gap-3.5 p-3.5 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-2xl">
            {cards.map((card) => {
              const isFlipped = flippedIds.includes(card.id)
              const isMatched = matchedIds.includes(card.id)
              const isOpen = isFlipped || isMatched
              const style = SYMBOL_CONFIG[card.symbol] || DEFAULT_SYMBOL_STYLE
              const IconComp = style.icon

              return (
                <div
                  key={card.id}
                  data-pair-card-id={card.id}
                  data-pair-symbol={card.symbol}
                  onClick={() => handleCardClick(card)}
                  className={`relative aspect-square [perspective:1000px] select-none ${
                    isOpen ? 'cursor-default' : 'cursor-pointer'
                  }`}
                >
                  <div
                    className={`w-full h-full duration-500 [transform-style:preserve-3d] transition-all ease-out ${
                      isOpen
                        ? '[transform:rotateY(180deg)]'
                        : 'hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-500/15'
                    }`}
                  >
                    {/* CARD BACK (Closed state) */}
                    <div
                      className={`absolute inset-0 [backface-visibility:hidden] rounded-2xl flex flex-col items-center justify-center p-2.5 border transition-all duration-300 shadow-md ${
                        'bg-gradient-to-br from-slate-800 via-slate-850 to-slate-900 dark:from-zinc-850 dark:via-zinc-900 dark:to-zinc-950 border-slate-700/80 dark:border-zinc-700/80 hover:border-emerald-500/60'
                      }`}
                    >
                      <div className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-slate-700/40 dark:bg-zinc-800 flex items-center justify-center border border-slate-600/40 dark:border-zinc-700 shadow-inner">
                        <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400/80 dark:text-zinc-400" />
                        <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/10" />
                      </div>
                      <div className="flex items-center gap-1 mt-1.5 opacity-50">
                        <div className="w-1 h-1 rounded-full bg-slate-400" />
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <div className="w-1 h-1 rounded-full bg-slate-400" />
                      </div>
                    </div>

                    {/* CARD FACE (Open / Matched state) */}
                    <div
                      className={`absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-2xl flex flex-col items-center justify-center p-2 sm:p-2.5 border-2 transition-all duration-300 ${
                        isMatched
                          ? 'bg-gradient-to-br from-emerald-500/20 via-teal-500/15 to-emerald-600/25 border-emerald-500 shadow-emerald-500/20 ring-2 ring-emerald-500/30'
                          : `${style.badgeBg} ${style.border} shadow-lg`
                      }`}
                    >
                      {/* Matched check badge */}
                      {isMatched && (
                        <div className="absolute top-1 sm:top-1.5 right-1 sm:right-1.5 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                          <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[3]" />
                        </div>
                      )}

                      {/* Icon badge with rich vibrant gradient */}
                      <div
                        className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shadow-md transition-transform duration-200 ${
                          isMatched ? 'scale-105 ring-2 ring-emerald-400/40' : 'scale-100'
                        } ${style.gradient} text-white`}
                      >
                        <IconComp className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
                      </div>

                      {/* Semantic name for associative memory verbalization */}
                      <span
                        className={`mt-1 sm:mt-1.5 text-[9px] sm:text-[11px] font-bold tracking-tight text-center truncate max-w-full px-1 ${
                          isMatched
                            ? 'text-emerald-700 dark:text-emerald-300'
                            : 'text-slate-800 dark:text-slate-100'
                        }`}
                      >
                        {style.label[lang as 'ru' | 'tj' | 'en'] || style.label.ru}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Finished Success Card */}
          {isFinished && (
            <div className="p-6 rounded-3xl border border-emerald-500/40 bg-emerald-500/10 dark:bg-emerald-950/30 text-center space-y-4 shadow-xl animate-fadeIn">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
              <div className="text-lg font-bold text-slate-900 dark:text-white">{t.finishTitle}</div>
              <div className="flex items-center justify-center gap-4 text-xs font-mono text-slate-500 dark:text-slate-400">
                <span>
                  {t.moves} <strong className="text-slate-900 dark:text-white">{moves}</strong>
                </span>
                <span>•</span>
                <span>
                  {elapsedSec.toFixed(1)} {t.sec}
                </span>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStart(true)}
                  className="gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>{t.tryAgain}</span>
                </Button>
                <Button
                  variant="emerald"
                  size="sm"
                  onClick={handleCompleteAndSave}
                  className="gap-1.5 font-bold cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{t.saveBtn}</span>
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
