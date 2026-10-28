import React, { useState, useEffect, useRef } from 'react'
import { Eye, RotateCcw, Play, CheckCircle, Clock, Sparkles } from 'lucide-react'
import { Button } from '../ui/Button'
import type { Language } from '../../i18n'

interface VisualPairsEngineProps {
  lang: Language
  challenge?: Record<string, unknown> | null
  onComplete: (result: { summary: string; metrics: Record<string, unknown> }) => void
}

interface CardItem {
  id: number
  pairId: number
  symbol: string
  label: string
}

const ALL_SYMBOL_POOL = [
  '★', '●', '▲', '◆', '✦', '⬢', '♥', '✿', 
  '♠', '♣', '♦', '⚡', '🌙', '☀', '☁', '☂', 
  '☕', '⚓', '⚛', '☯', '☮', '♫', '🎯', '🚀'
]

export const VisualPairsEngine: React.FC<VisualPairsEngineProps> = ({
  lang,
  challenge,
  onComplete,
}) => {
  const [cards, setCards] = useState<CardItem[]>([])
  const [flippedIndices, setFlippedIndices] = useState<number[]>([])
  const [matchedPairIds, setMatchedPairIds] = useState<number[]>([])
  const [moves, setMoves] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  const [elapsedSec, setElapsedSec] = useState(0)
  const timerRef = useRef<number | null>(null)

  const t = {
    ru: {
      title: 'Визуальные пары',
      subtitle: 'Открывайте карточки парами и находите одинаковые символы за наименьшее число ходов.',
      startBtn: 'Начать поиск пар',
      moves: 'Ходов:',
      pairsFound: 'Найдено пар:',
      of: 'из',
      time: 'Время:',
      sec: 'сек',
      finishTitle: 'Все пары успешно найдены!',
      tryAgain: 'Сыграть снова',
      saveBtn: 'Завершить и сохранить',
      efficiency: 'Эффективность поиска:',
    },
    tj: {
      title: 'Ҷуфтҳои биноӣ',
      subtitle: 'Кортҳоро ҷуфт-ҷуфт кушоед ва рамзҳои якхеларо бо камтарин ҳаракат пайдо кунед.',
      startBtn: 'Оғози ҷустуҷӯи ҷуфтҳо',
      moves: 'Ҳаракатҳо:',
      pairsFound: 'Ҷуфтҳои ёфтшуда:',
      of: 'аз',
      time: 'Вақт:',
      sec: 'сон',
      finishTitle: 'Ҳамаи ҷуфтҳо бомуваффақият ёфт шуданд!',
      tryAgain: 'Аз нав гузаштан',
      saveBtn: 'Анҷом ва сабт кардан',
      efficiency: 'Самаранокии ҷустуҷӯ:',
    },
    en: {
      title: 'Visual Pairs',
      subtitle: 'Flip cards in pairs to discover matching symbols with the fewest possible moves.',
      startBtn: 'Start Matching',
      moves: 'Moves:',
      pairsFound: 'Pairs Found:',
      of: 'of',
      time: 'Time:',
      sec: 's',
      finishTitle: 'All pairs discovered!',
      tryAgain: 'Play Again',
      saveBtn: 'Complete and Save',
      efficiency: 'Search Efficiency:',
    },
  }[lang]

  const initDeck = () => {
    let deck: CardItem[] = []
    if (challenge && Array.isArray(challenge.cards)) {
      deck = (challenge.cards as Array<{ card_id: number; pair_id: number; symbol: string }>).map((c) => ({
        id: c.card_id,
        pairId: c.pair_id,
        symbol: c.symbol,
        label: c.symbol,
      }))
    } else {
      const pool = [...ALL_SYMBOL_POOL]
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[pool[i], pool[j]] = [pool[j], pool[i]]
      }
      const selected = pool.slice(0, 6)
      selected.forEach((sym, pairId) => {
        deck.push({ id: pairId * 2, pairId, symbol: sym, label: sym })
        deck.push({ id: pairId * 2 + 1, pairId, symbol: sym, label: sym })
      })
      for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[deck[i], deck[j]] = [deck[j], deck[i]]
      }
    }

    setCards(deck)
    setFlippedIndices([])
    setMatchedPairIds([])
    setMoves(0)
    setElapsedSec(0)
    setIsFinished(false)
  }

  const handleStart = () => {
    initDeck()
    setIsActive(true)
  }

  useEffect(() => {
    if (isActive && !isFinished) {
      timerRef.current = window.setInterval(() => {
        setElapsedSec((prev) => prev + 1)
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isActive, isFinished])

  const handleCardClick = (idx: number) => {
    if (!isActive || isFinished) return
    if (flippedIndices.includes(idx)) return
    if (matchedPairIds.includes(cards[idx].pairId)) return
    if (flippedIndices.length >= 2) return

    const nextFlipped = [...flippedIndices, idx]
    setFlippedIndices(nextFlipped)

    if (nextFlipped.length === 2) {
      setMoves((m) => m + 1)
      const firstCard = cards[nextFlipped[0]]
      const secondCard = cards[nextFlipped[1]]

      if (firstCard.pairId === secondCard.pairId) {
        // Match!
        const nextMatched = [...matchedPairIds, firstCard.pairId]
        setMatchedPairIds(nextMatched)
        setFlippedIndices([])

        if (nextMatched.length === 6) {
          setIsFinished(true)
        }
      } else {
        // No match: turn back after delay
        setTimeout(() => {
          setFlippedIndices([])
        }, 900)
      }
    }
  }

  const handleCompleteAndSave = () => {
    onComplete({
      summary: `${t.finishTitle} (${moves} ходов, ${elapsedSec} с)`,
      metrics: {
        pairs_found: matchedPairIds.length,
        total_moves: moves,
        duration_sec: elapsedSec,
        efficiency_ratio: Number((matchedPairIds.length / Math.max(1, moves)).toFixed(2)),
      },
    })
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto text-center">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100 flex items-center justify-center gap-2">
          <Eye className="w-6 h-6 text-emerald-500" />
          <span>{t.title}</span>
        </h2>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-lg mx-auto">
          {t.subtitle}
        </p>
      </div>

      {!isActive ? (
        <div className="p-8 rounded-3xl liquid-glass border border-emerald-500/20 text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 text-emerald-500 mx-auto flex items-center justify-center border border-emerald-500/30">
            <Sparkles className="w-8 h-8" />
          </div>
          <Button size="lg" variant="emerald" onClick={handleStart} className="gap-2 px-8 py-3.5 text-base font-bold shadow-lg shadow-emerald-600/30">
            <Play className="w-5 h-5 fill-current" />
            <span>{t.startBtn}</span>
          </Button>
        </div>
      ) : (
        <>
          {/* Top HUD */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl liquid-glass border border-emerald-500/20 text-xs font-mono">
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
              <span>{t.pairsFound}</span>
              <span className="text-sm">{matchedPairIds.length} {t.of} 6</span>
            </div>
            <div className="flex items-center gap-4 text-zinc-600 dark:text-zinc-400">
              <span>{t.moves} <strong className="text-zinc-900 dark:text-zinc-100">{moves}</strong></span>
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{elapsedSec} {t.sec}</span>
              </div>
            </div>
          </div>

          {/* 3x4 Grid */}
          <div className="grid grid-cols-4 gap-3 sm:gap-4 p-4 rounded-3xl liquid-glass border border-emerald-500/20">
            {cards.map((card, idx) => {
              const isFlipped = flippedIndices.includes(idx)
              const isMatched = matchedPairIds.includes(card.pairId)
              const isOpen = isFlipped || isMatched

              return (
                <button
                  key={card.id}
                  onClick={() => handleCardClick(idx)}
                  disabled={isOpen}
                  className={`aspect-square rounded-2xl text-2xl sm:text-3xl font-black flex items-center justify-center transition-all duration-300 transform ${
                    isOpen
                      ? isMatched
                        ? 'bg-emerald-500/20 border-2 border-emerald-500 text-emerald-500 scale-95 shadow-md shadow-emerald-500/20'
                        : 'bg-teal-500/20 border-2 border-teal-400 text-teal-400 scale-100 rotate-y-180'
                      : 'bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 hover:border-emerald-500/50 hover:scale-105 active:scale-95'
                  }`}
                >
                  {isOpen ? card.symbol : '?'}
                </button>
              )
            })}
          </div>

          {isFinished && (
            <div className="p-6 rounded-3xl liquid-glass border border-emerald-500/40 bg-emerald-500/10 text-center space-y-4 animate-in fade-in duration-300">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
              <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{t.finishTitle}</div>
              <div className="flex items-center justify-center gap-4 text-xs font-mono text-zinc-500">
                <span>{moves} ходов</span>
                <span>•</span>
                <span>{elapsedSec} сек</span>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <Button variant="outline" size="sm" onClick={handleStart} className="gap-1.5 liquid-glass-pill">
                  <RotateCcw className="w-4 h-4" />
                  <span>{t.tryAgain}</span>
                </Button>
                <Button variant="emerald" size="sm" onClick={handleCompleteAndSave} className="gap-1.5 font-bold shadow-md shadow-emerald-600/30">
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
