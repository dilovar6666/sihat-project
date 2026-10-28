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

interface TestMarqueeProps {
  tests?: TestItem[]
  lang: Language
  onSelectTest: (test: TestItem) => void
  onStartAttempt: (test: TestItem) => void
  onOpenCatalog: () => void
}

// Fallback baseline test descriptors if tests are still loading from backend
const FALLBACK_TEST_ITEMS: Partial<TestItem>[] = [
  {
    slug: 'attention-concentration',
    min_age: 16,
    type: 'validated_screening',
    category_id: 'Когнитивные навыки',
    localizations: {
      ru: {
        title: 'Концентрация и устойчивость (Таблицы Шульте)',
        description: 'Оценка скорости переключения, истощаемости внимания и темпа сенсомоторных реакций.',
      },
      tj: {
        title: 'Таваҷҷӯҳ ва тамаркуз (Ҷадвалҳои Шулте)',
        description: 'Арзёбии суръати гузариш ва устувории таваҷҷӯҳ дар фазои визуалӣ.',
      },
      en: {
        title: 'Attention Concentration (Schulte Matrices)',
        description: 'Psychomotor processing speed, visual search efficiency, and attention stability.',
      },
    },
  },
  {
    slug: 'attention-switching',
    min_age: 16,
    type: 'validated_screening',
    category_id: 'Когнитивные навыки',
    localizations: {
      ru: {
        title: 'Переключаемость внимания (Trail Making B)',
        description: 'Когнитивная гибкость и исполнительный контроль при чередовании сенсорных стимулов.',
      },
      tj: {
        title: 'Гузариши таваҷҷӯҳ (Trail Making B)',
        description: 'Чандирии маърифатӣ ва назорати иҷроия ҳангоми ивазшавии пайдарпай.',
      },
      en: {
        title: 'Cognitive Flexibility (Trail Making B)',
        description: 'Executive functioning, cognitive set-shifting, and dual-task tracking.',
      },
    },
  },
  {
    slug: 'color-perception',
    min_age: 10,
    type: 'validated_screening',
    category_id: 'Зрение',
    localizations: {
      ru: {
        title: 'Тест на дальтонизм',
        description: 'Клинический скрининг красно-зелёного цветовосприятия и спектра колбочек L, M, S с распознаванием цифр, букв и геометрических фигур.',
      },
      tj: {
        title: 'Санҷиши дальтонизм',
        description: 'Баҳодиҳии клиникии тафриқаи рангҳои сурху сабз ва колбачаҳои биноӣ бо рақамҳо, ҳарфҳо ва шаклҳои геометрӣ.',
      },
      en: {
        title: 'Color Blindness Screening',
        description: 'Standardized polychromatic diagnostic screening with numbers, letters, and geometric shapes.',
      },
    },
  },
  {
    slug: 'color-hue-discrimination',
    min_age: 12,
    type: 'validated_screening',
    category_id: 'Зрение',
    localizations: {
      ru: {
        title: 'Цветоразличение оттенков (Farnsworth D-15)',
        description: 'Спектральная сортировка цветовых оттенков по кругу Манселла.',
      },
      tj: {
        title: 'Фарқкунии тобишҳои ранг (Farnsworth D-15)',
        description: 'Тартибдиҳии спектралии доираҳои ранга дар пайдарпайии ҳамвор.',
      },
      en: {
        title: 'Color Hue Discrimination (Farnsworth D-15)',
        description: 'Spectral hue arrangement across the chromatic circle.',
      },
    },
  },
  {
    slug: 'contrast-sensitivity',
    min_age: 14,
    type: 'validated_screening',
    category_id: 'Зрение',
    localizations: {
      ru: {
        title: 'Контрастная чувствительность (Решётки Пелли-Робсона)',
        description: 'Определение порогов распознавания слабоконтрастных синусоидальных решёток при разном освещении.',
      },
      tj: {
        title: 'Ҳассосияти контрастӣ (Пелли-Робсон)',
        description: 'Муайянкунии ҳадди шинохти объектҳои камранг ва тағйироти аввалини биноӣ.',
      },
      en: {
        title: 'Contrast Sensitivity (Pelli-Robson)',
        description: 'Spatial contrast detection thresholds across subtle luminance gradations.',
      },
    },
  },
  {
    slug: 'reaction-speed',
    min_age: 12,
    type: 'digital_check',
    category_id: 'Сенсомоторика',
    localizations: {
      ru: {
        title: 'Сенсомоторная скорость (Простая реакция)',
        description: 'Миллисекундный хронометраж скрытого времени психомоторного ответа на визуальный стимул.',
      },
      tj: {
        title: 'Суръати аксуламал (Реаксияи фаврӣ)',
        description: 'Ҳисоби миллисониявии вақти посухи сенсомоторӣ ба сигналҳои ногаҳонӣ.',
      },
      en: {
        title: 'Psychomotor Latency (Simple Reaction)',
        description: 'Sub-millisecond latency quantification of central visual-motor reflex arcs.',
      },
    },
  },
  {
    slug: 'visual-memory',
    min_age: 14,
    type: 'validated_screening',
    category_id: 'Когнитивные навыки',
    localizations: {
      ru: {
        title: 'Зрительно-пространственная память',
        description: 'Кратковременное удержание конфигураций и пространственных паттернов (тест Корси).',
      },
      tj: {
        title: 'Хотираи фазоӣ-визуалӣ (Тести Корси)',
        description: 'Санҷиши нигоҳдории кӯтоҳмуддати сохторҳои мураккаб дар хотира.',
      },
      en: {
        title: 'Visuospatial Span (Corsi Blocks)',
        description: 'Working memory capacity for sequential spatial and geometrical visual arrays.',
      },
    },
  },
  {
    slug: 'sound-discrimination',
    min_age: 14,
    type: 'digital_check',
    category_id: 'Слух',
    localizations: {
      ru: {
        title: 'Тональная аудиометрия (Слуховые пороги)',
        description: 'Частотное сканирование от 125 Гц до 8 кГц с контролем уровня звукового давления.',
      },
      tj: {
        title: 'Аудиометрияи басомадӣ (Ҳадди шунавоӣ)',
        description: 'Таҳлили ҳассосияти гӯш ба басомадҳои гуногуни савтӣ аз паст то баланд.',
      },
      en: {
        title: 'Pure Tone Audiometry (Thresholds)',
        description: 'Air conduction threshold curve estimation across clinical octaves 250Hz-8kHz.',
      },
    },
  },
  {
    slug: 'speech-in-noise',
    min_age: 16,
    type: 'validated_screening',
    category_id: 'Слух',
    localizations: {
      ru: {
        title: 'Разборчивость речи в шуме (SNR Screening)',
        description: 'Слуховая селективность и восприятие фонем на фоне смоделированного речевого шума.',
      },
      tj: {
        title: 'Фаҳмиши нутқ дар шароити садо (SNR)',
        description: 'Арзёбии ҷудокунии овозҳо ва нутқ дар муҳити пурмавҷ ва пурсадо.',
      },
      en: {
        title: 'Speech-in-Noise Discrimination (SNR)',
        description: 'Auditory figure-ground discrimination with calibrated babble noise masking.',
      },
    },
  },
  {
    slug: 'anxiety',
    min_age: 18,
    type: 'symptom_questionnaire',
    category_id: 'Самочувствие',
    localizations: {
      ru: {
        title: 'Шкала генерализованной тревоги (GAD-7)',
        description: 'Стандартизированный клинический скрининг тревожности и психоэмоционального напряжения.',
      },
      tj: {
        title: 'Миқёси ташвиш ва изтироб (GAD-7)',
        description: 'Санҷиши равонии расмии сатҳи нигаронӣ ва шиддати асаб дар ҳаёти рӯзмарра.',
      },
      en: {
        title: 'Generalized Anxiety Scale (GAD-7)',
        description: 'Validated psychometric instrument for screening and symptom severity tracking.',
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

  // Filter ready tests or fallback
  const readyTests = useMemo(() => {
    const list = tests && tests.length > 0
      ? tests.filter((t) => t.status !== 'draft')
      : (FALLBACK_TEST_ITEMS as TestItem[])
    return list.length > 0 ? list : (FALLBACK_TEST_ITEMS as TestItem[])
  }, [tests])

  // Duplicate list to achieve continuous infinite marquee loop
  const marqueeItems = useMemo(() => {
    return [...readyTests, ...readyTests]
  }, [readyTests])

  // Pause track ONLY when mouse is directly hovering over an active card
  const isPaused = hoveredKey !== null

  const getLocalizedTitle = (t: Partial<TestItem>) => {
    const loc = t.localizations?.[lang] || t.localizations?.ru || t.localizations?.en
    return loc?.title || t.slug || 'Скрининг SIHAT'
  }

  const getLocalizedDesc = (t: Partial<TestItem>) => {
    const loc = t.localizations?.[lang] || t.localizations?.ru || t.localizations?.en
    return (
      loc?.description ||
      (lang === 'tj'
        ? 'Амалияи интерактивии таҳлили сенсорӣ бо пойгоҳи кушодаи исботшуда.'
        : lang === 'en'
        ? 'Interactive clinical sensory protocol with transparent evidence baseline.'
        : 'Клинический сенсомоторный протокол с валидированной доказательной базой.')
    )
  }

  return (
    <section aria-label="Интерактивная лента скринингов" className="w-full mt-12 sm:mt-16">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-2 px-1">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-emerald-500/10 text-emerald-700 dark:text-[#2EC4A7] border border-emerald-500/20 mb-2">
            <span className="w-2 h-2 rounded-full bg-[#17A884] animate-pulse" />
            <span>
              {lang === 'tj'
                ? 'Феҳристи зиндаи скринингҳо'
                : lang === 'en'
                ? 'Live Protocol Stream'
                : 'Каталог в реальном времени'}
            </span>
            <span className="text-zinc-400 dark:text-zinc-600">•</span>
            <span className="font-mono">{readyTests.length} методик</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>
              {lang === 'tj'
                ? 'Ҳамаи санҷишҳои дастраси платформа'
                : lang === 'en'
                ? 'Available Clinical Screenings'
                : 'Все доступные скрининги платформы'}
            </span>
            <Sparkles className="w-4 h-4 text-[#17A884] hidden sm:inline-block" />
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-2xl">
            {lang === 'tj'
              ? 'Феҳристи интерактивии усулҳои стандартишуда ва тасдиқшудаи арзёбии саломатӣ.'
              : lang === 'en'
              ? 'Interactive registry of standardized and validated clinical screening protocols.'
              : 'Интерактивная витрина валидированных клинических скринингов и сенсорных методик.'}
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenCatalog}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 rounded-2xl liquid-glass-pill text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:text-[#17A884] dark:hover:text-[#2EC4A7] transition-all cursor-pointer shadow-xs"
        >
          <span>{lang === 'tj' ? 'Ҳама дар феҳрист' : lang === 'en' ? 'Browse Full Catalog' : 'Все тесты в каталоге'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Marquee Outer Container with Edge Masks & Generous Vertical Headroom (No clipping) */}
      <div
        className="relative w-full overflow-hidden marquee-edge-mask py-44 -my-32 select-none"
      >
        {/* Animated Infinite Track */}
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
            const isClassA = test.type === 'validated_screening'

            return (
              <div
                key={key}
                onMouseEnter={() => setHoveredKey(key)}
                onMouseLeave={() => setHoveredKey(null)}
                className={`relative flex-shrink-0 ${isHovered ? 'z-50' : 'z-10'}`}
              >
                {/* =================================================================
                    1. COMPACT SLOT (Only title & description, short card)
                    ================================================================= */}
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

                {/* =================================================================
                    2. ELEVATED FULL CARD (Spring expand & collapse over the slot)
                    ================================================================= */}
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
                  {/* Thematic Cover Image */}
                  <div className="relative h-[142px] sm:h-[150px] w-full rounded-2xl overflow-hidden mb-2.5 bg-[#080E0D] shadow-inner flex-shrink-0">
                    <img
                      src={coverUrl}
                      alt={altText}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#080E0D]/90 via-[#080E0D]/25 to-transparent" />

                    {/* Evidence Class Badge (Noble Emerald, no blue) */}
                    <div className="absolute top-2 left-2">
                      <span className="text-[10px] font-bold py-0.5 px-2 rounded-full backdrop-blur-md shadow-md bg-[#0E2C26]/90 text-[#2EC4A7] border border-[#17A884]/40">
                        {isClassA
                          ? (lang === 'tj' ? 'Класси А' : lang === 'en' ? 'Class A Evidence' : 'Класс A')
                          : (lang === 'tj' ? 'Скрининги рақамӣ' : lang === 'en' ? 'Digital Screening' : 'Цифровой скрининг')}
                      </span>
                    </div>

                    {/* Bottom Meta in Image */}
                    <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-[10px] text-white/90">
                      <div className="flex items-center gap-1.5 font-mono">
                        <Clock className="w-3 h-3 text-[#2EC4A7]" />
                        <span>{lang === 'tj' ? '3 дақ' : lang === 'en' ? '3 min' : '3 мин'}</span>
                        <span>•</span>
                        <UserCheck className="w-3 h-3 text-[#2EC4A7]" />
                        <span>{test.min_age || 16}+</span>
                      </div>

                      {credit && (
                        <span className="truncate max-w-[120px] text-white/60 font-mono text-[9px]">
                          © {credit.author}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Full Title & Clinical Description */}
                  <div className="px-0.5 mb-2.5">
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1 leading-snug line-clamp-1">
                      {title}
                    </h3>
                    <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-snug line-clamp-2">
                      {desc}
                    </p>
                  </div>

                  {/* Full Action Buttons */}
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
                      <span>{lang === 'tj' ? 'Паспорт' : lang === 'en' ? 'Passport' : 'Паспорт'}</span>
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
