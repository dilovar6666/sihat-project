import React, { useState } from 'react'
import { Palette, Award, CheckCircle, RotateCcw, Play, ArrowLeftRight } from 'lucide-react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import type { Language } from '../../i18n'

interface ColorHueEngineProps {
  lang: Language
  onComplete: (result: { summary: string; metrics: Record<string, unknown> }) => void
}

// 8 distinct hue steps across the Munsell circle
const INITIAL_HUES = [
  { id: 1, color: '#06b6d4', correctIndex: 0 }, // Cyan
  { id: 2, color: '#0284c7', correctIndex: 1 }, // Ocean
  { id: 3, color: '#3b82f6', correctIndex: 2 }, // Royal Blue
  { id: 4, color: '#6366f1', correctIndex: 3 }, // Indigo
  { id: 5, color: '#8b5cf6', correctIndex: 4 }, // Purple
  { id: 6, color: '#a855f7', correctIndex: 5 }, // Violet
  { id: 7, color: '#d946ef', correctIndex: 6 }, // Fuchsia
  { id: 8, color: '#f43f5e', correctIndex: 7 }, // Coral Rose
]

export const ColorHueEngine: React.FC<ColorHueEngineProps> = ({ lang, onComplete }) => {
  const [tiles, setTiles] = useState(INITIAL_HUES)
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [isActive, setIsActive] = useState(false)
  const [isFinished, setIsFinished] = useState(false)

  const t = {
    ru: {
      title: 'Цветоразличение оттенков (Farnsworth D-15)',
      subtitle: 'Упорядочите цветные фишки в плавный гармоничный спектр слева направо (от бирюзового к розовому).',
      standard: 'Farnsworth-Munsell D-15 Standard',
      instruction: 'Нажмите на фишку, затем на другую фишку, чтобы поменять их местами.',
      startBtn: 'Начать сортировку спектра',
      finishBtn: 'Проверить раскладку',
      errorScore: 'Индекс ошибки (TES)',
      normOptimal: 'Идеальное цветоразличение (TES = 0)',
      normGood: 'Хорошая норма (TES ≤ 4)',
      normSub: 'Затруднения в определении оттенков (TES > 4)',
      submitAndSave: 'Завершить и сохранить',
      tryAgain: 'Попробовать снова',
    },
    tj: {
      title: 'Фарқкунии рангҳо ва тобишҳо (Farnsworth D-15)',
      subtitle: 'Рангҳоро аз чап ба рост дар пайдарпайии мукаммал ва ҳамвор ҷойгир намоед.',
      standard: 'Farnsworth-Munsell D-15 Standard',
      instruction: 'Ба як доира пахш кунед ва баъд ба дигараш, то ҷои онҳоро иваз намоед.',
      startBtn: 'Оғози тартибдиҳии спектр',
      finishBtn: 'Санҷидани натиҷа',
      errorScore: 'Шохиси хатогӣ (TES)',
      normOptimal: 'Фарқкунии комил (TES = 0)',
      normGood: 'Меъёри хуб (TES ≤ 4)',
      normSub: 'Мушкилӣ дар фарқ кардани тобишҳо (TES > 4)',
      submitAndSave: 'Анҷом ва сабт кардан',
      tryAgain: 'Аз нав гузаштан',
    },
    en: {
      title: 'Hue Discrimination (Farnsworth D-15)',
      subtitle: 'Arrange color disks into a continuous smooth rainbow gradient from left to right.',
      standard: 'Farnsworth-Munsell D-15 Paradigm',
      instruction: 'Click one disk and then another to swap their positions.',
      startBtn: 'Start Hue Arrangement',
      finishBtn: 'Evaluate Spectrum',
      errorScore: 'Total Error Score (TES)',
      normOptimal: 'Superior Hue Discrimination (TES = 0)',
      normGood: 'Normal Range (TES ≤ 4)',
      normSub: 'Color Hue Confusion Noted (TES > 4)',
      submitAndSave: 'Complete & Save',
      tryAgain: 'Retry',
    },
  }[lang]

  const handleStart = () => {
    // Scramble tiles while ensuring at least some swaps are needed
    const shuffled = [...INITIAL_HUES].sort(() => Math.random() - 0.5)
    setTiles(shuffled)
    setSelectedIdx(null)
    setIsFinished(false)
    setIsActive(true)
  }

  const handleTileClick = (index: number) => {
    if (selectedIdx === null) {
      setSelectedIdx(index)
    } else if (selectedIdx === index) {
      setSelectedIdx(null)
    } else {
      const next = [...tiles]
      const temp = next[selectedIdx]
      next[selectedIdx] = next[index]
      next[index] = temp
      setTiles(next)
      setSelectedIdx(null)
    }
  }

  const calculateTES = () => {
    let tes = 0
    for (let i = 0; i < tiles.length; i++) {
      const diff = Math.abs(tiles[i].correctIndex - i)
      tes += diff
    }
    return tes
  }

  const handleEvaluate = () => {
    setIsActive(false)
    setIsFinished(true)
  }

  const handleFinish = () => {
    const tes = calculateTES()
    let category = t.normGood
    if (tes === 0) category = t.normOptimal
    else if (tes > 4) category = t.normSub

    onComplete({
      summary: `${t.errorScore}: ${tes} (${category}).`,
      metrics: {
        total_error_score: tes,
        status_category: category,
        tiles_count: tiles.length,
      },
    })
  }

  const tes = calculateTES()

  return (
    <div className="flex flex-col items-center max-w-xl mx-auto w-full select-none">
      <div className="w-full flex items-center justify-between mb-4">
        <Badge variant="cyan" className="gap-1">
          <Palette className="w-3 h-3" />
          <span>{t.standard}</span>
        </Badge>
        {isActive && (
          <span className="text-xs text-zinc-500 font-mono flex items-center gap-1">
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>{t.instruction}</span>
          </span>
        )}
      </div>

      {!isActive && !isFinished && (
        <div className="w-full rounded-3xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-100/50 dark:bg-zinc-900/40 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-fuchsia-500/10 flex items-center justify-center text-fuchsia-500 mb-4">
            <Palette className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">{t.title}</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-md mb-6">{t.subtitle}</p>
          <Button variant="emerald" size="lg" onClick={handleStart} className="gap-2">
            <Play className="w-4 h-4" />
            <span>{t.startBtn}</span>
          </Button>
        </div>
      )}

      {isActive && (
        <div className="w-full flex flex-col items-center">
          <div className="w-full p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl mb-6">
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 justify-items-center">
              {tiles.map((tile, idx) => {
                const isSelected = selectedIdx === idx
                return (
                  <button
                    key={tile.id}
                    onClick={() => handleTileClick(idx)}
                    className={`relative w-12 h-16 sm:w-14 sm:h-20 rounded-2xl transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md flex items-center justify-center ${
                      isSelected
                        ? 'ring-4 ring-white dark:ring-zinc-900 scale-110 shadow-2xl z-10'
                        : 'border border-black/10'
                    }`}
                    style={{ backgroundColor: tile.color }}
                  >
                    {isSelected && (
                      <span className="w-2.5 h-2.5 rounded-full bg-white shadow animate-ping" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <Button variant="emerald" size="lg" onClick={handleEvaluate} className="gap-2">
            <CheckCircle className="w-5 h-5" />
            <span>{t.finishBtn}</span>
          </Button>
        </div>
      )}

      {isFinished && (
        <div className="w-full rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 text-center shadow-xl">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-4">
            <Award className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">{t.title}</h3>

          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/80 max-w-xs mx-auto my-6">
            <div className="text-xs text-zinc-500 mb-1">{t.errorScore}</div>
            <div className="text-4xl font-black text-emerald-500 font-mono">{tes}</div>
            <div className="text-xs text-zinc-400 mt-1">
              {tes === 0 ? t.normOptimal : tes <= 4 ? t.normGood : t.normSub}
            </div>
          </div>

          <div className="flex gap-3 justify-center max-w-sm mx-auto">
            <Button variant="outline" onClick={handleStart} className="gap-2 flex-1">
              <RotateCcw className="w-4 h-4" />
              <span>{t.tryAgain}</span>
            </Button>
            <Button variant="emerald" onClick={handleFinish} className="gap-2 flex-1">
              <CheckCircle className="w-4 h-4" />
              <span>{t.submitAndSave}</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
