import React, { useMemo } from 'react'
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
        title: 'Symbol Digit Modalities',
        description: 'Timed geometric symbol to digit matching under a dynamic cipher key.',
      },
    },
  },
  {
    slug: 'color-perception',
    min_age: 10,
    type: 'validated_screening',
    category_id: 'vision',
    localizations: {
      ru: {
        title: 'Тест на дальтонизм (Рабкин & Ишихара)',
        description: 'Скрининг трихроматического цветовосприятия по полихроматическим таблицам.',
      },
      tj: {
        title: 'Санҷиши дальтонизм',
        description: 'Скрининги идроки рангҳо бо ҷадвалҳои полихроматикии Рабкин ва Ишихара.',
      },
      en: {
        title: 'Color Perception Screening',
        description: 'Trichromatic color vision evaluation using pseudo-isochromatic plates.',
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
        title: 'Различение контраста (Габор)',
        description: 'Определение ориентации синусоидальных полос при прогрессивно убывающем контрасте.',
      },
      tj: {
        title: 'Дарккунии контраст',
        description: 'Муайян намудани самти хатҳои Габор ҳангоми кам шудани контраст.',
      },
      en: {
        title: 'Contrast Sensitivity',
        description: 'Detection of sinusoidal Gabor grating orientations under fading contrast.',
      },
    },
  },
  {
    slug: 'visual-acuity-near',
    min_age: 10,
    type: 'validated_screening',
    category_id: 'vision',
    localizations: {
      ru: {
        title: 'Острота зрения вблизи (Кольца Ландольта)',
        description: 'Определение положения разрыва в кольцах Ландольта при калиброванном масштабе.',
      },
      tj: {
        title: 'Тезии биниши наздик',
        description: 'Муайян кардани шикофии ҳалқаҳои Ландольт дар масофаи корӣ.',
      },
      en: {
        title: 'Near Visual Acuity',
        description: 'Landolt C gap discrimination at standardized digital viewing distances.',
      },
    },
  },
  {
    slug: 'hearing-tone-detection',
    min_age: 12,
    type: 'validated_screening',
    category_id: 'hearing',
    localizations: {
      ru: {
        title: 'Тональная аудиометрия',
        description: 'Определение минимального порога слышимости чистых тонов от 250 до 8000 Гц.',
      },
      tj: {
        title: 'Аудиометрияи оҳангӣ',
        description: 'Муайян кардани сатҳи пасттарини шунавоӣ барои басомадҳои 250 то 8000 Гц.',
      },
      en: {
        title: 'Pure Tone Audiometry',
        description: 'Auditory threshold detection across frequencies 250 to 8000 Hz.',
      },
    },
  },
  {
    slug: 'speech-in-noise',
    min_age: 12,
    type: 'validated_screening',
    category_id: 'hearing',
    localizations: {
      ru: {
        title: 'Разборчивость речи в шуме',
        description: 'Распознавание речевых числительных на фоне модулированного маскирующего шума.',
      },
      tj: {
        title: 'Фаҳмидани нутқ дар садои баланд',
        description: 'Шинохтани рақамҳои гуфташуда дар зери садои омехтаи муҳити атроф.',
      },
      en: {
        title: 'Speech-in-Noise Recognition',
        description: 'Digi-word discrimination against calibrated background auditory noise.',
      },
    },
  },
  {
    slug: 'high-frequency-hearing',
    min_age: 14,
    type: 'validated_screening',
    category_id: 'hearing',
    localizations: {
      ru: {
        title: 'Высокочастотный слух',
        description: 'Проверка верхнего частотного диапазона восприятия звука от 8 до 16 кГц.',
      },
      tj: {
        title: 'Шунавоии басомадҳои баланд',
        description: 'Санҷиши доираи болоии шунавоӣ аз 8 то 16 кГц.',
      },
      en: {
        title: 'High-Frequency Hearing',
        description: 'Extended high-frequency screening from 8 kHz to 16 kHz.',
      },
    },
  },
  {
    slug: 'simple-reaction-time',
    min_age: 10,
    type: 'validated_screening',
    category_id: 'reaction-coordination',
    localizations: {
      ru: {
        title: 'Простая зрительно-моторная реакция',
        description: 'Измерение минимального времени отклика на внезапное появление визуального стимула.',
      },
      tj: {
        title: 'Вокуниши оддии биноӣ-ҳаракатӣ',
        description: 'Санҷиши суръати аксуламал ба пайдоиши стимул бо миллисонияҳо.',
      },
      en: {
        title: 'Simple Reaction Time',
        description: 'Millisecond-precision response latency measurement to visual stimuli.',
      },
    },
  },
  {
    slug: 'choice-reaction-time',
    min_age: 12,
    type: 'validated_screening',
    category_id: 'reaction-coordination',
    localizations: {
      ru: {
        title: 'Реакция выбора (Go / No-Go)',
        description: 'Тест на тормозный контроль: мгновенное нажатие на зелёный и удержание при красном сигнале.',
      },
      tj: {
        title: 'Вокуниши интихобӣ (Go / No-Go)',
        description: 'Санҷиши боздории равонӣ: амал ҳангоми ранги сабз ва худдорӣ ҳангоми ранги сурх.',
      },
      en: {
        title: 'Choice Reaction (Go / No-Go)',
        description: 'Inhibitory impulse control: respond to target signals while suppressing non-targets.',
      },
    },
  },
  {
    slug: 'cursor-path',
    min_age: 10,
    type: 'validated_screening',
    category_id: 'reaction-coordination',
    localizations: {
      ru: {
        title: 'Точный маршрут курсора',
        description: 'Проведение курсора по извилистому коридору без касания границ по закону Аккермана.',
      },
      tj: {
        title: 'Масири дақиқи курсор',
        description: 'Гузаронидани курсор аз долони каҷу килеб бе расидан ба деворҳо.',
      },
      en: {
        title: 'Steering Through a Corridor',
        description: 'Motor steering law kinematic tracking through bounded winding curves.',
      },
    },
  },
  {
    slug: 'mouse-eye-coordination',
    min_age: 10,
    type: 'validated_screening',
    category_id: 'reaction-coordination',
    localizations: {
      ru: {
        title: 'Слежение за движущейся целью',
        description: 'Плавное непрерывное удержание курсора на траектории непредсказуемой цели.',
      },
      tj: {
        title: 'Пайгирии ҳадафи ҳаракаткунанда',
        description: 'Нигоҳ доштани муш дар болои ҳадафи ҳаракаткунанда бе фосила.',
      },
      en: {
        title: 'Pursuit Tracking Rotor',
        description: 'Continuous smooth pursuit motor tracking of dynamic orbital targets.',
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
  const readyTests = useMemo(() => {
    const filtered =
      tests && tests.length > 0
        ? tests.filter((t) => t.status !== 'draft' && APPROVED_SET.has(t.slug))
        : []
    return filtered.length > 0 ? filtered : (FALLBACK_TEST_ITEMS as TestItem[])
  }, [tests])

  // Duplicate items twice to ensure a seamless infinite -50% translateX loop
  const marqueeItems = useMemo(() => {
    return [...readyTests, ...readyTests]
  }, [readyTests])

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
    <section
      aria-label="Интерактивная лента скринингов"
      className="w-full mt-8 sm:mt-12"
    >
      {/* Header with counter and catalog link */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-4 px-1 max-w-7xl mx-auto">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
            <span className="w-2 h-2 rounded-full bg-[#17A884] animate-pulse" />
            <span>
              {lang === 'tj'
                ? 'Феҳристи зиндаи машқҳо'
                : lang === 'en'
                ? 'Interactive Exercise Stream'
                : 'Каталог упражнений'}
            </span>
            <span className="text-zinc-600">•</span>
            <span className="font-mono text-emerald-300">
              {readyTests.length} {lang === 'tj' ? 'методика' : lang === 'en' ? 'methods' : 'методик'}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <span>
              {lang === 'tj'
                ? 'Ҳамаи машқҳои дастраси платформа'
                : lang === 'en'
                ? 'Available Interactive Exercises'
                : 'Интерактивные методики платформы'}
            </span>
            <Sparkles className="w-5 h-5 text-[#17A884] hidden sm:inline-block" />
          </h2>

          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl">
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
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#0B1513] border border-slate-800 text-xs font-bold text-slate-200 hover:text-[#17A884] hover:border-emerald-500/40 hover:bg-[#0E1A17] transition-all cursor-pointer shadow-md group"
        >
          <span>
            {lang === 'tj'
              ? 'Ҳама дар феҳрист'
              : lang === 'en'
              ? 'Browse Full Catalog'
              : 'Все упражнения в каталоге'}
          </span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* INFINITE MARQUEE WITH EXPANDABLE CARDS (NO CLIPPING, NO CUT OFF!) */}
      <div className="relative w-full overflow-hidden marquee-edge-mask py-8 sm:py-10 marquee-container group select-none">
        <div className="flex items-stretch gap-5 w-max will-change-transform animate-marquee-scroll">
          {marqueeItems.map((test, index) => {
            const key = `${test.slug}-${index}`
            const title = getLocalizedTitle(test)
            const desc = getLocalizedDesc(test)
            const coverUrl = getTestCover(test.slug || '')
            const altText = getTestAlt(test.slug || '', lang)
            const credit = getTestPhotoCredit(test.slug || '')
            const isValidated = test.type === 'validated_screening'

            return (
              <div
                key={key}
                className="w-[280px] sm:w-[305px] h-[375px] shrink-0 bg-[#0B1513] border border-slate-800/90 rounded-3xl p-4 flex flex-col justify-between transition-all duration-300 ease-out hover:scale-[1.04] sm:hover:scale-[1.06] hover:-translate-y-2 hover:border-[#17A884] hover:shadow-2xl hover:shadow-emerald-500/25 group-hover:opacity-75 hover:!opacity-100 cursor-pointer group/card relative z-10 hover:z-30"
                onClick={() => onStartAttempt(test as TestItem)}
              >
                {/* 1. Cover Image with Badges */}
                <div className="relative h-[160px] w-full rounded-2xl overflow-hidden mb-3 bg-[#080E0D] shadow-inner shrink-0">
                  <img
                    src={coverUrl}
                    alt={altText}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#080E0D]/90 via-[#080E0D]/30 to-transparent" />

                  {/* Top Pill */}
                  <div className="absolute top-2.5 left-2.5">
                    <span className="text-[10px] font-bold py-1 px-2.5 rounded-full backdrop-blur-md shadow-md bg-[#0E2C26]/90 text-[#2EC4A7] border border-[#17A884]/40">
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

                  {/* Bottom Image Stats */}
                  <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[11px] text-white/95 font-medium">
                    <div className="flex items-center gap-2 font-mono">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#2EC4A7]" />
                        <span>{lang === 'tj' ? '2–3 дақ' : lang === 'en' ? '2–3 min' : '2–3 мин'}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <UserCheck className="w-3 h-3 text-[#2EC4A7]" />
                        <span>{test.min_age || 12}+</span>
                      </span>
                    </div>

                    {credit && (
                      <span className="truncate max-w-[110px] text-white/60 font-mono text-[9px]">
                        © {credit.author}
                      </span>
                    )}
                  </div>
                </div>

                {/* 2. Text Content */}
                <div className="flex-1 flex flex-col justify-start px-0.5 mb-3">
                  <h3 className="text-sm sm:text-base font-bold text-white mb-1.5 leading-snug line-clamp-1 group-hover/card:text-emerald-300 transition-colors">
                    {title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                    {desc}
                  </p>
                </div>

                {/* 3. Action Buttons (Always 100% visible, fully rendered, never clipped) */}
                <div className="pt-2.5 border-t border-slate-800/80 flex items-center gap-2.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelectTest(test as TestItem)
                    }}
                    className="flex-1 text-xs h-9 rounded-xl font-bold cursor-pointer border-slate-800 bg-[#070D0B] hover:border-[#17A884] text-slate-300 hover:text-white"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#17A884]" />
                    <span>{lang === 'tj' ? 'Шиноснома' : lang === 'en' ? 'Passport' : 'Паспорт'}</span>
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onStartAttempt(test as TestItem)
                    }}
                    className="flex-1 bg-gradient-to-r from-[#103D35] to-[#17A884] hover:from-[#13493f] hover:to-[#1ab891] text-white text-xs h-9 rounded-xl font-bold cursor-pointer shadow-md gap-1"
                  >
                    <span>{lang === 'tj' ? 'Оғоз' : lang === 'en' ? 'Start' : 'Начать'}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
