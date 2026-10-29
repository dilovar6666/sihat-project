import React, { useState, useMemo } from 'react'
import {
  Clock,
  UserCheck,
  FileText,
  ChevronRight,
  Sparkles,
  ArrowRight,
} from 'lucide-react'
import { Button } from './ui/Button'
import type { Language } from '../i18n'
import type { TestItem } from '../types'
import { getTestCover, getTestAlt, getTestPhotoCredit } from '../lib/testImages'
import { APPROVED_15_SLUGS } from './test-engines/engineTypes'

interface TestMarqueeProps {
  tests?: TestItem[]
  lang: Language
  onSelectTest: (test: TestItem) => void
  onStartAttempt: (test: TestItem) => void
  onOpenCatalog: () => void
}

const APPROVED_SET = new Set<string>(APPROVED_15_SLUGS)

const FALLBACK_TEST_ITEMS: Partial<TestItem>[] = [
  {
    slug: 'attention-concentration',
    min_age: 10,
    type: 'validated_screening',
    category_id: 'memory-attention',
    localizations: {
      ru: {
        title: 'Таблицы Шульте',
        description: 'Последовательный поиск чисел от 1 до 25 в случайной сетке 5×5 для оценки темпа и устойчивости внимания.',
      },
      tj: {
        title: 'Ҷадвалҳои Шулте',
        description: 'Ҷустуҷӯи пайдарпайи ададҳо аз 1 то 25 дар шабакаи тасодуфии 5×5 барои санҷиши тамаркуз.',
      },
      en: {
        title: 'Schulte Tables',
        description: 'Sequential visual search of numbers 1 to 25 in a randomized 5×5 grid to assess attention stability.',
      },
    },
  },
  {
    slug: 'attention-switching',
    min_age: 12,
    type: 'validated_screening',
    category_id: 'memory-attention',
    localizations: {
      ru: {
        title: 'Переключение внимания (Trail Making)',
        description: 'Поочерёдное соединение чисел и букв (1→А→2→Б) для оценки когнитивной гибкости.',
      },
      tj: {
        title: 'Гузариши диққат (Trail Making)',
        description: 'Пайваст кардани навбатии ададҳо ва ҳарфҳо барои арзёбии чандирии маърифатӣ.',
      },
      en: {
        title: 'Attention Switching (Trail Making)',
        description: 'Alternating number-letter connection (1→A→2→B) to evaluate cognitive flexibility.',
      },
    },
  },
  {
    slug: 'visual-memory',
    min_age: 10,
    type: 'validated_screening',
    category_id: 'memory-attention',
    localizations: {
      ru: {
        title: 'Блоки Корси',
        description: 'Запоминание и воспроизведение пространственных последовательностей вспыхивающих блоков.',
      },
      tj: {
        title: 'Блокҳои Корси',
        description: 'Ба хотир гирифтан ва такрор кардани пайдарпайии фазоии блокҳои равшаншаванда.',
      },
      en: {
        title: 'Corsi Block-Tapping',
        description: 'Memorizing and reproducing spatial sequences of flashing blocks.',
      },
    },
  },
  {
    slug: 'short-term-memory',
    min_age: 10,
    type: 'validated_screening',
    category_id: 'memory-attention',
    localizations: {
      ru: {
        title: 'Память на цифры (Digit Span)',
        description: 'Воспроизведение числовых рядов в прямом и обратном порядке для оценки рабочей памяти.',
      },
      tj: {
        title: 'Хотира ба рақамҳо',
        description: 'Такрор кардани қаторҳои ададӣ ба тартиби рост ва чаппа.',
      },
      en: {
        title: 'Digit Span Memory',
        description: 'Recalling number sequences in forward and backward order to measure working memory.',
      },
    },
  },
  {
    slug: 'information-processing-speed',
    min_age: 12,
    type: 'validated_screening',
    category_id: 'memory-attention',
    localizations: {
      ru: {
        title: 'Сопоставление символов и чисел',
        description: 'Быстрый перевод геометрических символов в цифры по динамическому ключу за 60 секунд.',
      },
      tj: {
        title: 'Мувофиқати рамзҳо ва ададҳо',
        description: 'Табдили босуръати рамзҳои геометрӣ ба рақамҳо аз рӯи калиди динамикӣ.',
      },
      en: {
        title: 'Symbol-Digit Substitution',
        description: 'Rapid translation of geometric symbols into digits using a dynamic key in 60 seconds.',
      },
    },
  },
  {
    slug: 'contrast-sensitivity',
    min_age: 12,
    type: 'validated_screening',
    category_id: 'vision',
    localizations: {
      ru: {
        title: 'Различение контраста (Решётки Габора)',
        description: 'Определение ориентации синусоидальных решёток при снижении контраста от 60% до 2.5%.',
      },
      tj: {
        title: 'Фарқкунии контраст',
        description: 'Муайян кардани самти панҷараҳои синусоидалӣ ҳангоми паст шудани контраст.',
      },
      en: {
        title: 'Contrast Discrimination (Gabor)',
        description: 'Identifying grating tilt angles as contrast decreases from 60% down to 2.5%.',
      },
    },
  },
  {
    slug: 'visual-pairs',
    min_age: 10,
    type: 'digital_check',
    category_id: 'vision',
    localizations: {
      ru: {
        title: 'Визуальные пары',
        description: 'Поиск парных векторных пиктограмм с запоминанием их расположения на сетке 4×4.',
      },
      tj: {
        title: 'Ҷуфтҳои визуалӣ',
        description: 'Ҷустуҷӯи кортҳои ҷуфт бо ба хотир гирифтани ҷойгиршавии онҳо дар шабакаи 4×4.',
      },
      en: {
        title: 'Visual Pairs Match',
        description: 'Finding matching vector icon pairs by remembering their spatial positions on a 4×4 grid.',
      },
    },
  },
  {
    slug: 'pattern-matrix',
    min_age: 12,
    type: 'digital_check',
    category_id: 'vision',
    localizations: {
      ru: {
        title: 'Продолжи последовательность',
        description: 'Анализ закономерностей изменения формы, поворота и количества элементов в визуальном ряду.',
      },
      tj: {
        title: 'Идома додани пайдарпайӣ',
        description: 'Таҳлили қонуниятҳои тағйирёбии шакл, гардиш ва миқдори унсурҳо.',
      },
      en: {
        title: 'Pattern Sequence Completion',
        description: 'Analyzing rules of shape, rotation, and element count progression in a visual series.',
      },
    },
  },
  {
    slug: 'sound-discrimination',
    min_age: 10,
    type: 'digital_check',
    category_id: 'hearing',
    localizations: {
      ru: {
        title: 'Сравнение звуков по высоте',
        description: 'Определение более высокого тона в паре синтезированных аудиосигналов с уменьшением разницы Гц.',
      },
      tj: {
        title: 'Муқоисаи садоҳо',
        description: 'Муайян кардани садои баландтар дар ҷуфти сигналҳои аудиоӣ.',
      },
      en: {
        title: 'Pitch Discrimination',
        description: 'Identifying the higher-pitched tone in synthesized audio pairs across decreasing Hz steps.',
      },
    },
  },
  {
    slug: 'reaction-speed',
    min_age: 10,
    type: 'digital_check',
    category_id: 'reaction-coordination',
    localizations: {
      ru: {
        title: 'Простая зрительно-моторная реакция',
        description: 'Серия из 8 замеров времени отклика в миллисекундах на появление светового сигнала.',
      },
      tj: {
        title: 'Вокуниши оддии визуалӣ-моторӣ',
        description: 'Силсилаи 8 ченкунии вақти вокуниш бо миллисонияҳо ба пайдоиши сигнал.',
      },
      en: {
        title: 'Simple Visuomotor Reaction',
        description: '8-trial millisecond latency measurement in response to a visual stimulus.',
      },
    },
  },
]

export const TestMarquee: React.FC<TestMarqueeProps> = ({
  tests = [],
  lang,
  onSelectTest,
  onStartAttempt,
  onOpenCatalog,
}) => {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null)

  const readyTests = useMemo(() => {
    const filtered =
      tests && tests.length > 0
        ? tests.filter((t) => t.status !== 'draft' && APPROVED_SET.has(t.slug))
        : []
    return filtered.length > 0 ? filtered : (FALLBACK_TEST_ITEMS as TestItem[])
  }, [tests])

  const marqueeItems = useMemo(() => {
    return [...readyTests, ...readyTests]
  }, [readyTests])

  const isPaused = hoveredKey !== null

  const getLocalizedTitle = (t: Partial<TestItem>) => {
    const loc =
      t.localizations?.[lang] ||
      (lang === 'tj' ? t.localizations?.tg : undefined) ||
      t.localizations?.ru ||
      t.localizations?.en
    return loc?.title || t.slug || 'SIHAT'
  }

  const getLocalizedDesc = (t: Partial<TestItem>) => {
    const loc =
      t.localizations?.[lang] ||
      (lang === 'tj' ? t.localizations?.tg : undefined) ||
      t.localizations?.ru ||
      t.localizations?.en
    return (
      loc?.description ||
      (lang === 'tj'
        ? 'Амалияи интерактивии таҳлили сенсорӣ бо пойгоҳи кушодаи исботшуда.'
        : lang === 'en'
        ? 'Interactive sensory protocol with transparent evidence baseline.'
        : 'Интерактивное когнитивное и сенсомоторное упражнение с открытым паспортом методики.')
    )
  }

  return (
    <section aria-label="Интерактивная лента скринингов" className="w-full mt-12 sm:mt-16">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-2 px-1">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-emerald-500/10 text-emerald-700 dark:text-[#2EC4A7] border border-emerald-500/20 mb-2">
            <span className="w-2 h-2 rounded-full bg-[#17A884] animate-pulse" />
            <span>
              {lang === 'tj'
                ? 'Феҳристи зиндаи машқҳо'
                : lang === 'en'
                ? 'Interactive Exercise Stream'
                : 'Каталог упражнений'}
            </span>
            <span className="text-zinc-400 dark:text-zinc-600">•</span>
            <span className="font-mono">{readyTests.length} методик</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>
              {lang === 'tj'
                ? 'Ҳамаи машқҳои дастраси платформа'
                : lang === 'en'
                ? 'Available Interactive Exercises'
                : 'Интерактивные методики платформы'}
            </span>
            <Sparkles className="w-4 h-4 text-[#17A884] hidden sm:inline-block" />
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-2xl">
            {lang === 'tj'
              ? 'Феҳристи интерактивии усулҳои стандартишуда барои санҷиши диққат, хотира, биноӣ, шунавоӣ ва вокуниш.'
              : lang === 'en'
              ? 'Interactive registry of exercises for attention, memory, visual perception, hearing, and motor coordination.'
              : 'Витрина интерактивных упражнений для самопроверки внимания, памяти, зрения, слуха и координации.'}
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenCatalog}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 rounded-2xl liquid-glass-pill text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:text-[#17A884] dark:hover:text-[#2EC4A7] transition-all cursor-pointer shadow-xs"
        >
          <span>
            {lang === 'tj' ? 'Ҳама дар феҳрист' : lang === 'en' ? 'Browse Full Catalog' : 'Все упражнения в каталоге'}
          </span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="relative w-full overflow-hidden marquee-edge-mask py-44 -my-32 select-none">
        <div
          className={`flex items-center gap-3.5 w-max will-change-transform ${
            isPaused ? 'marquee-paused' : 'animate-marquee-scroll'
          }`}
        >
          {marqueeItems.map((test, index) => {
            const key = `${test.slug}-${index}`
            const isHovered = hoveredKey === key
            const title = getLocalizedTitle(test)
            const desc = getLocalizedDesc(test)
            const coverUrl = getTestCover(test.slug || '')
            const altText = getTestAlt(test.slug || '', lang)
            const credit = getTestPhotoCredit(test.slug || '')
            const isValidated = test.type === 'validated_screening'

            return (
              <div
                key={key}
                onMouseEnter={() => setHoveredKey(key)}
                onMouseLeave={() => setHoveredKey(null)}
                className={`relative flex-shrink-0 ${isHovered ? 'z-50' : 'z-10'}`}
              >
                <div
                  className={`w-[205px] sm:w-[220px] h-[78px] px-3.5 py-2.5 rounded-2xl border border-zinc-200/90 dark:border-[#1E302B] bg-white/95 dark:bg-[#0E1715] shadow-xs flex flex-col justify-center cursor-pointer transition-all duration-200 ${
                    isHovered
                      ? 'border-[#17A884] scale-95 opacity-30'
                      : 'hover:border-[#17A884]/70 scale-100 opacity-100'
                  }`}
                >
                  <h3 className="text-xs sm:text-[13px] font-bold text-zinc-900 dark:text-zinc-100 line-clamp-1 leading-snug">
                    {title}
                  </h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-1 leading-tight">
                    {desc}
                  </p>
                </div>

                <div
                  className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[310px] sm:w-[335px] p-3.5 sm:p-4 rounded-3xl bg-white dark:bg-[#0E1715] border-2 border-[#17A884] dark:border-[#17A884] z-50 origin-center select-auto flex flex-col justify-between ${
                    isHovered
                      ? 'opacity-100 scale-100 pointer-events-auto visible'
                      : 'opacity-0 scale-75 pointer-events-none invisible'
                  }`}
                  style={{
                    boxShadow: isHovered
                      ? '0 25px 60px -10px rgba(0, 0, 0, 0.75), 0 0 32px 2px rgba(23, 168, 132, 0.35)'
                      : 'none',
                    transition: isHovered
                      ? 'transform 320ms cubic-bezier(0.16, 1, 0.3, 1), opacity 240ms ease-out, box-shadow 320ms ease-out'
                      : 'transform 220ms cubic-bezier(0.4, 0, 0.2, 1), opacity 180ms ease-in, box-shadow 180ms ease-in',
                    willChange: 'transform, opacity',
                  }}
                >
                  <div className="relative h-[142px] sm:h-[150px] w-full rounded-2xl overflow-hidden mb-2.5 bg-[#080E0D] shadow-inner flex-shrink-0">
                    <img src={coverUrl} alt={altText} loading="lazy" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#080E0D]/90 via-[#080E0D]/25 to-transparent" />

                    <div className="absolute top-2 left-2">
                      <span className="text-[10px] font-bold py-0.5 px-2 rounded-full backdrop-blur-md shadow-md bg-[#0E2C26]/90 text-[#2EC4A7] border border-[#17A884]/40">
                        {isValidated
                          ? lang === 'tj'
                            ? 'Методикаи исботшуда'
                            : lang === 'en'
                            ? 'Validated Method'
                            : 'Доказательная методика'
                          : lang === 'tj'
                          ? 'Машқи рақамӣ'
                          : lang === 'en'
                          ? 'Digital Exercise'
                          : 'Цифровое упражнение'}
                      </span>
                    </div>

                    <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-[10px] text-white/90">
                      <div className="flex items-center gap-1.5 font-mono">
                        <Clock className="w-3 h-3 text-[#2EC4A7]" />
                        <span>{lang === 'tj' ? '2–3 дақ' : lang === 'en' ? '2–3 min' : '2–3 мин'}</span>
                        <span>•</span>
                        <UserCheck className="w-3 h-3 text-[#2EC4A7]" />
                        <span>{test.min_age || 12}+</span>
                      </div>

                      {credit && (
                        <span className="truncate max-w-[120px] text-white/60 font-mono text-[9px]">
                          © {credit.author}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="px-0.5 mb-2.5">
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1 leading-snug line-clamp-1">
                      {title}
                    </h3>
                    <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-snug line-clamp-2">{desc}</p>
                  </div>

                  <div className="pt-2 border-t border-zinc-100 dark:border-[#1E302B] flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectTest(test as TestItem)
                      }}
                      className="flex-1 text-xs h-8 rounded-xl font-bold cursor-pointer border-zinc-200 dark:border-[#223832] dark:bg-[#15221F] hover:border-[#17A884] text-zinc-800 dark:text-zinc-200"
                    >
                      <FileText className="w-3.5 h-3.5 text-[#17A884]" />
                      <span>{lang === 'tj' ? 'Шиноснома' : lang === 'en' ? 'Passport' : 'Паспорт'}</span>
                    </Button>

                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onStartAttempt(test as TestItem)
                      }}
                      className="flex-1 bg-gradient-to-r from-[#103D35] to-[#17A884] hover:from-[#13493f] hover:to-[#1ab891] text-white text-xs h-8 rounded-xl font-bold cursor-pointer shadow-md"
                    >
                      <span>{lang === 'tj' ? 'Оғоз' : lang === 'en' ? 'Start' : 'Начать'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
