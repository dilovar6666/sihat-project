import React, { useState, useEffect, useRef } from 'react'
import {
  Eye,
  RotateCcw,
  Play,
  CheckCircle,
  Clock,
  Sparkles,
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
} from 'lucide-react'
import { Button } from '../ui/Button'
import { shuffleArray, type InteractiveEngineProps } from './engineTypes'

interface PairCard {
  id: number
  symbol: string
}

const ICONS = [
  'heart',
  'star',
  'sun',
  'moon',
  'zap',
  'shield',
  'leaf',
  'cloud',
  'flame',
  'anchor',
  'bell',
  'key',
  'flag',
  'music',
  'droplet',
  'gem',
]

function buildFallbackDeck(): PairCard[] {
  const chosen = shuffleArray(ICONS).slice(0, 6)
  const symbols = shuffleArray([...chosen, ...chosen])
  return symbols.map((symbol, i) => ({ id: i, symbol }))
}

function renderCardIcon(symbol: string) {
  const cls = 'w-7 h-7 sm:w-8 sm:h-8'
  switch (symbol) {
    case 'heart':
      return <Heart className={cls} />
    case 'star':
      return <Star className={cls} />
    case 'sun':
      return <Sun className={cls} />
    case 'moon':
      return <Moon className={cls} />
    case 'zap':
      return <Zap className={cls} />
    case 'shield':
      return <Shield className={cls} />
    case 'leaf':
      return <Leaf className={cls} />
    case 'cloud':
      return <Cloud className={cls} />
    case 'flame':
      return <Flame className={cls} />
    case 'anchor':
      return <Anchor className={cls} />
    case 'bell':
      return <Bell className={cls} />
    case 'key':
      return <Key className={cls} />
    case 'flag':
      return <Flag className={cls} />
    case 'music':
      return <Music className={cls} />
    case 'droplet':
      return <Droplet className={cls} />
    case 'gem':
      return <Gem className={cls} />
    default:
      return <span>{symbol}</span>
  }
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
      subtitle: 'Открывайте карточки попарно, запоминайте расположение значков и найдите все 6 пар за минимальное число ходов.',
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
      subtitle: 'Кортҳоро ҷуфт-ҷуфт кушоед, ҷойгиршавии аломатҳоро дар хотир гиред ва ҳамаи 6 ҷуфтро бо камтарин гашт пайдо намоед.',
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
      subtitle: 'Flip cards in pairs, remember icon positions, and match all 6 pairs in the fewest moves possible.',
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
  }[lang]

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
    <div className="space-y-6 max-w-2xl mx-auto text-center select-none">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100 flex items-center justify-center gap-2">
          <Eye className="w-6 h-6 text-emerald-500" />
          <span>{t.title}</span>
        </h2>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-lg mx-auto leading-relaxed">
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
      ) : (
        <>
          <div className="flex items-center justify-between p-3.5 rounded-2xl liquid-glass border border-emerald-500/20 text-xs font-mono">
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
              <span>{t.pairsFound}</span>
              <span className="text-sm">
                {matchedIds.length / 2} {t.of} 6
              </span>
            </div>
            <div className="flex items-center gap-4 text-zinc-600 dark:text-zinc-400">
              <span>
                {t.moves} <strong className="text-zinc-900 dark:text-zinc-100">{moves}</strong>
              </span>
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {elapsedSec.toFixed(1)} {t.sec}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3 sm:gap-4 p-4 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl">
            {cards.map((card) => {
              const isFlipped = flippedIds.includes(card.id)
              const isMatched = matchedIds.includes(card.id)
              const isOpen = isFlipped || isMatched

              return (
                <button
                  key={card.id}
                  type="button"
                  data-pair-card-id={card.id}
                  data-pair-symbol={card.symbol}
                  onClick={() => handleCardClick(card)}
                  disabled={isOpen}
                  className={`aspect-square rounded-2xl text-2xl sm:text-3xl font-black flex items-center justify-center transition-all duration-200 cursor-pointer ${
                    isOpen
                      ? isMatched
                        ? 'bg-emerald-500/15 border-2 border-emerald-500 text-emerald-500 scale-95'
                        : 'bg-cyan-500/15 border-2 border-cyan-500 text-cyan-500 scale-100'
                      : 'bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-emerald-500/50 text-zinc-400 active:scale-95'
                  }`}
                >
                  {isOpen ? renderCardIcon(card.symbol) : '?'}
                </button>
              )
            })}
          </div>

          {isFinished && (
            <div className="p-6 rounded-3xl border border-emerald-500/40 bg-emerald-500/10 text-center space-y-4">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
              <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{t.finishTitle}</div>
              <div className="flex items-center justify-center gap-4 text-xs font-mono text-zinc-500">
                <span>
                  {t.moves} {moves}
                </span>
                <span>•</span>
                <span>
                  {elapsedSec.toFixed(1)} {t.sec}
                </span>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <Button variant="outline" size="sm" onClick={() => handleStart(true)} className="gap-1.5 cursor-pointer">
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
