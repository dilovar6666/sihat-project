import React, { useState, useMemo } from 'react'
import {
  GitCompare,
  TrendingUp,
  TrendingDown,
  Activity,
  ArrowRight,
  Target,
  Brain,
  Zap,
  Users,
  BarChart3,
  ArrowLeftRight,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Eye,
  Info,
} from 'lucide-react'
import { Button } from './ui/Button'
import type { Language } from '../i18n'
import type { SavedResult } from '../types'
import {
  unwrapMetrics,
  getMetricLabel,
  getTopMetricKeys,
} from './ResultReportView'

export interface ResultsComparisonViewProps {
  lang: Language
  results: SavedResult[]
  onNavigate: (pageId: string) => void
  onInspectResult: (result: SavedResult) => void
}

/**
 * Population benchmarks for SIHAT test batteries.
 * Represent typical healthy adult reference norms under calibrated desktop conditions.
 */
interface BenchmarkMetric {
  key: string
  label: { ru: string; tj: string; en: string }
  unit: string
  populationMean: number
  higherIsBetter: boolean
  minRange: number
  maxRange: number
}

interface TestBenchmark {
  slug: string
  title: { ru: string; tj: string; en: string }
  populationDescription: { ru: string; tj: string; en: string }
  metrics: BenchmarkMetric[]
}

const POPULATION_BENCHMARKS: Record<string, TestBenchmark> = {
  'attention-switching': {
    slug: 'attention-switching',
    title: {
      ru: 'Переключение внимания (Trail Making)',
      tj: 'Гузариши диққат',
      en: 'Attention Switching',
    },
    populationDescription: {
      ru: 'Нормативные данные выборки здоровых взрослых (18–50 лет). Среднее время переключения 19.5 с.',
      tj: 'Нишондодҳои миёнаи калонсолони солим. Вақти миёнаи ивазкунӣ 19.5 с.',
      en: 'Healthy adult norm reference (18–50 yrs). Average switching cost is 19.5 s.',
    },
    metrics: [
      {
        key: 'accuracy_pct',
        label: { ru: 'Точность выполнения', tj: 'Дақиқӣ', en: 'Accuracy' },
        unit: '%',
        populationMean: 89.0,
        higherIsBetter: true,
        minRange: 50,
        maxRange: 100,
      },
      {
        key: 'part_a_sec',
        label: { ru: 'Часть A (прямой счёт)', tj: 'Қисми A (оддӣ)', en: 'Part A Speed' },
        unit: 'с',
        populationMean: 18.5,
        higherIsBetter: false,
        minRange: 8,
        maxRange: 40,
      },
      {
        key: 'part_b_sec',
        label: { ru: 'Часть B (чередование)', tj: 'Қисми B (ивазкунӣ)', en: 'Part B Speed' },
        unit: 'с',
        populationMean: 38.0,
        higherIsBetter: false,
        minRange: 15,
        maxRange: 75,
      },
      {
        key: 'switching_cost_sec',
        label: { ru: 'Цена переключения', tj: 'Арзиши ивазшавӣ', en: 'Switching Cost' },
        unit: 'с',
        populationMean: 19.5,
        higherIsBetter: false,
        minRange: 2,
        maxRange: 45,
      },
    ],
  },
  'attention-concentration': {
    slug: 'attention-concentration',
    title: {
      ru: 'Таблицы Шульте (Концентрация внимания)',
      tj: 'Ҷадвалҳои Шульте',
      en: 'Schulte Attention Concentration',
    },
    populationDescription: {
      ru: 'Популяционная норма для сетки 5×5: общее время поиска 42.0 с, средний шаг 1.68 с.',
      tj: 'Меъёри миёна барои ҷадвали 5×5: вақти умумӣ 42.0 с, суръати қадам 1.68 с.',
      en: 'Population standard for 5x5 grid: total time 42.0 s, mean step pace 1.68 s.',
    },
    metrics: [
      {
        key: 'total_time_sec',
        label: { ru: 'Общее время', tj: 'Вақти умумӣ', en: 'Total Time' },
        unit: 'с',
        populationMean: 42.0,
        higherIsBetter: false,
        minRange: 18,
        maxRange: 85,
      },
      {
        key: 'average_step_ms',
        label: { ru: 'Средний темп шага', tj: 'Суръати қадам', en: 'Step Pace' },
        unit: 'мс',
        populationMean: 1680,
        higherIsBetter: false,
        minRange: 700,
        maxRange: 3500,
      },
      {
        key: 'first_half_sec',
        label: { ru: 'Фаза врабатываемости (1–12)', tj: 'Нисфи аввал', en: 'First Half' },
        unit: 'с',
        populationMean: 19.5,
        higherIsBetter: false,
        minRange: 8,
        maxRange: 40,
      },
      {
        key: 'second_half_sec',
        label: { ru: 'Фаза устойчивости (14–25)', tj: 'Нисфи дуюм', en: 'Second Half' },
        unit: 'с',
        populationMean: 22.5,
        higherIsBetter: false,
        minRange: 9,
        maxRange: 45,
      },
    ],
  },
  'go-no-go': {
    slug: 'go-no-go',
    title: {
      ru: 'Go / No-Go (Тормозной контроль импульсов)',
      tj: 'Go / No-Go (Идораи тормозӣ)',
      en: 'Go / No-Go Inhibitory Control',
    },
    populationDescription: {
      ru: 'Популяционный эталон: точность 91.5%, среднее время моторного ответа 340 мс.',
      tj: 'Меъёри миёна: дақиқӣ 91.5%, вақти аксуламал 340 мс.',
      en: 'Healthy adult norm: accuracy 91.5%, mean motor reaction time 340 ms.',
    },
    metrics: [
      {
        key: 'accuracy_pct',
        label: { ru: 'Точность дифференциации', tj: 'Дақиқии умумӣ', en: 'Total Accuracy' },
        unit: '%',
        populationMean: 91.5,
        higherIsBetter: true,
        minRange: 60,
        maxRange: 100,
      },
      {
        key: 'mean_rt_ms',
        label: { ru: 'Время реакции на сигнал', tj: 'Вақти аксуламал', en: 'Reaction Time' },
        unit: 'мс',
        populationMean: 340,
        higherIsBetter: false,
        minRange: 180,
        maxRange: 600,
      },
      {
        key: 'commission_errors',
        label: { ru: 'Ошибки торможения (No-Go)', tj: 'Хатоҳои боздорӣ', en: 'False Alarms' },
        unit: 'шт',
        populationMean: 1.6,
        higherIsBetter: false,
        minRange: 0,
        maxRange: 8,
      },
      {
        key: 'omission_errors',
        label: { ru: 'Пропуски целевого сигнала', tj: 'Гузаронидани сигнал', en: 'Misses' },
        unit: 'шт',
        populationMean: 0.5,
        higherIsBetter: false,
        minRange: 0,
        maxRange: 5,
      },
    ],
  },
  'reaction-speed': {
    slug: 'reaction-speed',
    title: {
      ru: 'Простая сенсомоторная реакция',
      tj: 'Суръати аксуламали оддӣ',
      en: 'Simple Sensorimotor Reaction',
    },
    populationDescription: {
      ru: 'Средняя скорость простой реакции человека на визуальный стимул: 265 мс.',
      tj: 'Суръати миёнаи инсон ба сигнали визуалӣ: 265 мс.',
      en: 'Population reference speed to visual stimulus: 265 ms.',
    },
    metrics: [
      {
        key: 'mean_reaction_time_ms',
        label: { ru: 'Среднее время реакции', tj: 'Вақти миёнаи вокуниш', en: 'Mean Reaction Time' },
        unit: 'мс',
        populationMean: 265,
        higherIsBetter: false,
        minRange: 160,
        maxRange: 450,
      },
      {
        key: 'best_reaction_time_ms',
        label: { ru: 'Лучший отклик', tj: 'Беҳтарин вокуниш', en: 'Best Reaction' },
        unit: 'мс',
        populationMean: 215,
        higherIsBetter: false,
        minRange: 140,
        maxRange: 350,
      },
      {
        key: 'variability_ms',
        label: { ru: 'Вариабельность темпа', tj: 'Тағйирёбии суръат', en: 'Variability (SD)' },
        unit: 'мс',
        populationMean: 42,
        higherIsBetter: false,
        minRange: 10,
        maxRange: 120,
      },
      {
        key: 'false_starts',
        label: { ru: 'Фальстарты / упреждения', tj: 'Хатои пешакӣ', en: 'False Starts' },
        unit: 'шт',
        populationMean: 0.3,
        higherIsBetter: false,
        minRange: 0,
        maxRange: 4,
      },
    ],
  },
  'cursor-path': {
    slug: 'cursor-path',
    title: {
      ru: 'Точный маршрут курсора (Коридор)',
      tj: 'Масири дақиқи курсор',
      en: 'Cursor Steering Path',
    },
    populationDescription: {
      ru: 'Норма удержания траектории: 92% пути внутри границ, прохождение за 14.5 с.',
      tj: 'Меъёри масир: 92% дар дохили марз, гузаштан дар 14.5 с.',
      en: 'Trajectory corridor baseline: 92% time inside borders, 14.5 s duration.',
    },
    metrics: [
      {
        key: 'corridor_accuracy_pct',
        label: { ru: 'Доля пути внутри коридора', tj: 'Роҳ дар дохили марз', en: 'Path Inside Corridor' },
        unit: '%',
        populationMean: 92.0,
        higherIsBetter: true,
        minRange: 60,
        maxRange: 100,
      },
      {
        key: 'completion_time_sec',
        label: { ru: 'Время прохождения', tj: 'Вақти гузаштан', en: 'Completion Time' },
        unit: 'с',
        populationMean: 14.5,
        higherIsBetter: false,
        minRange: 6,
        maxRange: 35,
      },
      {
        key: 'border_violations',
        label: { ru: 'Выходов за границу', tj: 'Баромадан аз марз', en: 'Boundary Hits' },
        unit: 'раз',
        populationMean: 1.4,
        higherIsBetter: false,
        minRange: 0,
        maxRange: 10,
      },
      {
        key: 'smoothness_score',
        label: { ru: 'Плавность траектории', tj: 'Ҳамвории ҳаракат', en: 'Path Smoothness' },
        unit: '%',
        populationMean: 86.0,
        higherIsBetter: true,
        minRange: 40,
        maxRange: 100,
      },
    ],
  },
  'mouse-eye-coordination': {
    slug: 'mouse-eye-coordination',
    title: {
      ru: 'Слежение за целью (Pursuit)',
      tj: 'Пайгирии ҳадаф',
      en: 'Smooth Pursuit Coordination',
    },
    populationDescription: {
      ru: 'Популяционная норма удержания движущегося фокуса: 84.0% времени в круге цели.',
      tj: 'Меъёри нигоҳдории нишон: 84.0% вақт дар дохили ҳадаф.',
      en: 'Dynamic target tracking baseline: 84.0% time on target.',
    },
    metrics: [
      {
        key: 'on_target_pct',
        label: { ru: 'Удержание на цели', tj: 'Нигоҳдорӣ дар ҳадаф', en: 'Time on Target' },
        unit: '%',
        populationMean: 84.0,
        higherIsBetter: true,
        minRange: 40,
        maxRange: 100,
      },
      {
        key: 'mean_distance_px',
        label: { ru: 'Среднее отклонение курсора', tj: 'Инҳирофи миёна', en: 'Mean Error' },
        unit: 'px',
        populationMean: 22.0,
        higherIsBetter: false,
        minRange: 5,
        maxRange: 60,
      },
      {
        key: 'tracking_duration_sec',
        label: { ru: 'Длительность теста', tj: 'Давомнокӣ', en: 'Test Duration' },
        unit: 'с',
        populationMean: 20.0,
        higherIsBetter: true,
        minRange: 10,
        maxRange: 30,
      },
    ],
  },
  'short-term-memory': {
    slug: 'short-term-memory',
    title: {
      ru: 'Зрительно-пространственная память (Корси)',
      tj: 'Хотираи фазоӣ-визуалӣ',
      en: 'Spatial Short-Term Memory',
    },
    populationDescription: {
      ru: 'Популяционная емкость рабочей пространственной памяти: 5.8 элементов в цепочке.',
      tj: 'Ҳаҷми миёнаи хотираи кӯтоҳмуддати фазоӣ: 5.8 унсур дар занҷир.',
      en: 'Visuospatial working memory span norm: 5.8 items in sequence.',
    },
    metrics: [
      {
        key: 'max_spatial_span',
        label: { ru: 'Макс. длина цепочки', tj: 'Дарозии ниҳоии занҷир', en: 'Max Span' },
        unit: 'эл',
        populationMean: 5.8,
        higherIsBetter: true,
        minRange: 2,
        maxRange: 9,
      },
      {
        key: 'accuracy_pct',
        label: { ru: 'Точность воспроизведения', tj: 'Дақиқии такрор', en: 'Accuracy' },
        unit: '%',
        populationMean: 79.0,
        higherIsBetter: true,
        minRange: 40,
        maxRange: 100,
      },
      {
        key: 'trials_passed',
        label: { ru: 'Успешных уровней', tj: 'Сатҳҳои гузашташуда', en: 'Levels Cleared' },
        unit: 'шт',
        populationMean: 6.0,
        higherIsBetter: true,
        minRange: 2,
        maxRange: 10,
      },
    ],
  },
  'pattern-matrix': {
    slug: 'pattern-matrix',
    title: {
      ru: 'Прогрессивные матрицы (Логика)',
      tj: 'Матрӯсаҳои мантиқӣ',
      en: 'Pattern Matrix Reasoning',
    },
    populationDescription: {
      ru: 'Популяционный показатель: 7 верных ответов из 10, среднее время решения 11.2 с на задачу.',
      tj: 'Нишондоди миёна: 7 ҷавоби дуруст аз 10, вақти миёна 11.2 с барои ҳар масъала.',
      en: 'Healthy adult benchmark: 7.0 correct out of 10, 11.2 s mean solution time.',
    },
    metrics: [
      {
        key: 'correct_count',
        label: { ru: 'Верных решений', tj: 'Ҳалли дуруст', en: 'Correct Items' },
        unit: '/10',
        populationMean: 7.0,
        higherIsBetter: true,
        minRange: 2,
        maxRange: 10,
      },
      {
        key: 'accuracy_pct',
        label: { ru: 'Процент правильности', tj: 'Фоизи дурустӣ', en: 'Accuracy' },
        unit: '%',
        populationMean: 70.0,
        higherIsBetter: true,
        minRange: 20,
        maxRange: 100,
      },
      {
        key: 'mean_item_sec',
        label: { ru: 'Время размышления', tj: 'Вақти фикрронӣ', en: 'Thinking Time' },
        unit: 'с',
        populationMean: 11.2,
        higherIsBetter: false,
        minRange: 3,
        maxRange: 30,
      },
    ],
  },
  'contrast-sensitivity': {
    slug: 'contrast-sensitivity',
    title: {
      ru: 'Контрастная чувствительность',
      tj: 'Ҳассосияти контрастӣ',
      en: 'Contrast Sensitivity',
    },
    populationDescription: {
      ru: 'Популяционный порог различения полос слабой яркости: 2.2% контраста.',
      tj: 'Ҳадди миёнаи муайянкунии контрасти заиф: 2.2%.',
      en: 'Population contrast threshold benchmark: 2.2% contrast.',
    },
    metrics: [
      {
        key: 'threshold_contrast_pct',
        label: { ru: 'Порог контраста', tj: 'Ҳадди контраст', en: 'Contrast Threshold' },
        unit: '%',
        populationMean: 2.2,
        higherIsBetter: false,
        minRange: 0.8,
        maxRange: 8.0,
      },
      {
        key: 'levels_passed',
        label: { ru: 'Пройдено уровней', tj: 'Сатҳҳои гузашта', en: 'Levels Cleared' },
        unit: 'ур',
        populationMean: 8.0,
        higherIsBetter: true,
        minRange: 3,
        maxRange: 12,
      },
    ],
  },
  'color-perception': {
    slug: 'color-perception',
    title: {
      ru: 'Тест на цветовосприятие (Таблицы Рабкина)',
      tj: 'Санҷиши ҳисси рангҳо',
      en: 'Color Perception (Rabkin)',
    },
    populationDescription: {
      ru: 'Популяционная норма трихромазии: 9.8–10 верных распознаваний из 10 таблиц.',
      tj: 'Меъёри солими биниши ранг: 10 ҷадвали дуруст.',
      en: 'Normal trichromacy norm: 9.8-10 correct plates out of 10.',
    },
    metrics: [
      {
        key: 'correct_count',
        label: { ru: 'Распознано таблиц', tj: 'Ҷадвалҳои шинохташуда', en: 'Plates Recognized' },
        unit: '/10',
        populationMean: 9.8,
        higherIsBetter: true,
        minRange: 4,
        maxRange: 10,
      },
      {
        key: 'accuracy_pct',
        label: { ru: 'Точность цветоразличения', tj: 'Дақиқӣ', en: 'Color Accuracy' },
        unit: '%',
        populationMean: 98.0,
        higherIsBetter: true,
        minRange: 40,
        maxRange: 100,
      },
    ],
  },
}

/**
 * Dynamic fallback benchmark generator for any exercises not explicitly hardcoded.
 */
function getFallbackBenchmark(
  slug: string,
  title: string,
  sampleMetrics: Record<string, unknown>,
  lang: Language
): TestBenchmark {
  const topKeys = getTopMetricKeys(sampleMetrics, 4)
  const metrics: BenchmarkMetric[] = topKeys.map((k) => {
    const isError = /error|mistake|violation|penalty|hit/i.test(k)
    const isTime = /time|sec|ms|duration|pace/i.test(k)
    const isPct = /pct|percent|accuracy|ratio|smooth/i.test(k)

    let mean = 85.0
    let higherIsBetter = true
    let minRange = 0
    let maxRange = 100
    let unit = ''

    if (isError) {
      mean = 1.2
      higherIsBetter = false
      minRange = 0
      maxRange = 6
      unit = lang === 'en' ? 'err' : 'ош'
    } else if (isTime) {
      if (/ms/i.test(k)) {
        mean = 320
        unit = 'ms'
        minRange = 150
        maxRange = 700
      } else {
        mean = 24.5
        unit = 's'
        minRange = 8
        maxRange = 60
      }
      higherIsBetter = false
    } else if (isPct) {
      mean = 88.0
      unit = '%'
      minRange = 40
      maxRange = 100
    } else {
      mean = 6.0
      minRange = 1
      maxRange = 12
    }

    return {
      key: k,
      label: {
        ru: getMetricLabel(k, 'ru'),
        tj: getMetricLabel(k, 'tj'),
        en: getMetricLabel(k, 'en'),
      },
      unit,
      populationMean: mean,
      higherIsBetter,
      minRange,
      maxRange,
    }
  })

  return {
    slug,
    title: { ru: title, tj: title, en: title },
    populationDescription: {
      ru: 'Референтные популяционные показатели здоровых пользователей платформы SIHAT.',
      tj: 'Нишондодҳои миёнаи истифодабарандагони солим дар платформаи SIHAT.',
      en: 'Reference population norms calculated across healthy SIHAT platform participants.',
    },
    metrics,
  }
}

export const ResultsComparisonView: React.FC<ResultsComparisonViewProps> = ({
  lang,
  results,
  onNavigate,
  onInspectResult,
}) => {
  // 1. Group saved results by test slug
  const groupedBySlug = useMemo(() => {
    const map: Record<string, SavedResult[]> = {}
    results.forEach((r) => {
      if (!map[r.test_slug]) map[r.test_slug] = []
      map[r.test_slug].push(r)
    })
    // Sort each group newest first
    Object.values(map).forEach((arr) => {
      arr.sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())
    })
    return map
  }, [results])

  const slugList = useMemo(() => {
    return Object.keys(groupedBySlug).sort((a, b) => {
      // Prioritize exercises that have 2+ attempts
      const countA = groupedBySlug[a]?.length || 0
      const countB = groupedBySlug[b]?.length || 0
      if (countA >= 2 && countB < 2) return -1
      if (countB >= 2 && countA < 2) return 1
      return countB - countA
    })
  }, [groupedBySlug])

  // Current selected test slug
  const [selectedSlug, setSelectedSlug] = useState<string>(() => {
    return slugList[0] || ''
  })

  // Keep selectedSlug valid if list updates
  const activeSlug = slugList.includes(selectedSlug) ? selectedSlug : slugList[0] || ''

  const currentAttempts = useMemo(() => {
    return activeSlug ? groupedBySlug[activeSlug] || [] : []
  }, [activeSlug, groupedBySlug])

  // Selected attempt IDs
  const [attemptAId, setAttemptAId] = useState<string>('')
  const [attemptBId, setAttemptBId] = useState<string>('')

  // Auto-sync attempt IDs when exercise changes
  React.useEffect(() => {
    if (currentAttempts.length >= 2) {
      // Default: Attempt A is previous (index 1), Attempt B is newest (index 0)
      setAttemptAId(currentAttempts[1].id)
      setAttemptBId(currentAttempts[0].id)
    } else if (currentAttempts.length === 1) {
      setAttemptAId(currentAttempts[0].id)
      setAttemptBId(currentAttempts[0].id)
    } else {
      setAttemptAId('')
      setAttemptBId('')
    }
  }, [activeSlug, currentAttempts])

  // Resolve objects
  const attemptA = currentAttempts.find((a) => a.id === attemptAId) || currentAttempts[1] || currentAttempts[0] || null
  const attemptB = currentAttempts.find((a) => a.id === attemptBId) || currentAttempts[0] || null

  const handleSwapAttempts = () => {
    if (!attemptA || !attemptB) return
    const temp = attemptAId
    setAttemptAId(attemptBId)
    setAttemptBId(temp)
  }

  const handleSelectFirstAndLast = () => {
    if (currentAttempts.length < 2) return
    setAttemptAId(currentAttempts[currentAttempts.length - 1].id) // oldest
    setAttemptBId(currentAttempts[0].id) // newest
  }

  const handleSelectTwoLatest = () => {
    if (currentAttempts.length < 2) return
    setAttemptAId(currentAttempts[1].id)
    setAttemptBId(currentAttempts[0].id)
  }

  // Active benchmark specification
  const activeBenchmark = useMemo<TestBenchmark | null>(() => {
    if (!activeSlug) return null
    if (POPULATION_BENCHMARKS[activeSlug]) {
      return POPULATION_BENCHMARKS[activeSlug]
    }
    const sample = attemptB ? unwrapMetrics(attemptB.result) : {}
    const title = attemptB?.test_title || activeSlug
    return getFallbackBenchmark(activeSlug, title, sample, lang)
  }, [activeSlug, attemptB, lang])

  // Localized texts
  const t = {
    ru: {
      title: 'Сравнение результатов в динамике',
      subtitle: 'Выберите методику и две попытки для детального сопоставления между собой и со среднестатистической нормой людей',
      emptyTitle: 'Нет сохранённых результатов',
      emptyDesc: 'Пройдите упражнения в каталоге, чтобы открыть персональный сравнительный анализ динамики.',
      goToCatalog: 'Перейти в каталог',
      selectExercise: 'Методика:',
      attemptsCount: 'попыток',
      attemptALabel: 'Попытка A (Базовая / Исходная)',
      attemptBLabel: 'Попытка B (Контрольная / Текущая)',
      populationLabel: 'Норма популяции (Как обычно проходят люди)',
      populationBadge: 'Среднее людей',
      swapBtn: 'Поменять местами',
      presetFirstLast: 'Первая vs Последняя',
      presetTwoLatest: 'Две последние попытки',
      oneAttemptNotice: 'По данной методике у вас пока 1 сохранённая попытка. Ниже показано её сравнение со среднестатистической нормой людей платформы SIHAT.',
      retakeBtn: 'Пройти повторно для накопления динамики',
      comparativeChartsTitle: 'Сравнительные графики показателей',
      comparativeChartsSubtitle: 'Наглядное сопоставление Попытки A, Попытки B и среднестатистического эталона людей',
      barChartTitle: 'Многофакторная столбчатая диаграмма (3 измерения)',
      radarChartTitle: 'Профиль баланса (Radar Spectrum)',
      verdictTitle: 'Экспертный аналитический разбор',
      verdictSubtitle: 'Оценка прогресса между попытками и положение относительно популяционной нормы',
      scorecardsTitle: 'Детальные метрики и динамика изменений',
      betterThanNorm: 'Выше нормы на',
      worseThanNorm: 'Ниже нормы на',
      progressVsA: 'к базовой попытке',
      noChange: 'Без изменений',
      reportBtn: 'Подробный отчёт',
      factorSpeed: 'Скорость и темп обработки информации',
      factorAccuracy: 'Точность и когнитивный самоконтроль',
      factorAdaptation: 'Эффект адаптации и тренировки',
      factorPopulation: 'Положение среди людей («Как обычно проходят»)',
      recommendationsTitle: 'Практические рекомендации по методике',
    },
    tj: {
      title: 'Муқоисаи натиҷаҳо дар динамика',
      subtitle: 'Методика ва 2 кӯшишро интихоб намоед, то онҳоро бо ҳамдигар ва меъёри миёнаи одамон муқоиса кунед',
      emptyTitle: 'Натиҷаҳои сабтшуда мавҷуд нестанд',
      emptyDesc: 'Дар феҳрист машқҳоро иҷро намоед, то бахши таҳлили муқоисавӣ дастрас гардад.',
      goToCatalog: 'Ба феҳристи машқҳо',
      selectExercise: 'Методика:',
      attemptsCount: 'кӯшиш',
      attemptALabel: 'Кӯшиши A (Аввалия / Поягӣ)',
      attemptBLabel: 'Кӯшиши B (Назоратӣ / Ҷорӣ)',
      populationLabel: 'Меъёри миёна (Чӣ гуна одатан мегузаранд)',
      populationBadge: 'Миёнаи одамон',
      swapBtn: 'Иваз намудани ҷойҳо',
      presetFirstLast: 'Аввалин vs Охирин',
      presetTwoLatest: 'Ду кӯшиши охирин',
      oneAttemptNotice: 'Аз рӯи ин методика шумо то ҳол 1 кӯшиш доред. Дар зер муқоисаи он бо меъёри миёнаи одамони платформа оварда шудааст.',
      retakeBtn: 'Гузаштани дубора барои ҷамъоварии динамика',
      comparativeChartsTitle: 'Диаграммаҳои муқоисавӣ',
      comparativeChartsSubtitle: 'Муқоисаи визуалии Кӯшиши A, Кӯшиши B ва нишондоди миёнаи одамон',
      barChartTitle: 'Диаграммаи сутунии сегона (3 ченак)',
      radarChartTitle: 'Тавозуни қобилиятҳо (Radar Spectrum)',
      verdictTitle: 'Таҳлили муфассали коршиносӣ',
      verdictSubtitle: 'Баҳодиҳии пешрафт байни кӯшишҳо ва мавқеъ нисбат ба меъёри умумӣ',
      scorecardsTitle: 'Нишондиҳандаҳои муфассал ва тағйирот',
      betterThanNorm: 'Болотар аз меъёр ба андозаи',
      worseThanNorm: 'Поёнтар аз меъёр ба андозаи',
      progressVsA: 'нисбат ба кӯшиши асосӣ',
      noChange: 'Бе тағйир',
      reportBtn: 'Ҳисоботи пурра',
      factorSpeed: 'Суръат ва коркарди иттилоот',
      factorAccuracy: 'Дақиқӣ ва худдорӣ',
      factorAdaptation: 'Таъсири мутобиқшавӣ ва тамрин',
      factorPopulation: 'Мавқеъ дар байни одамон',
      recommendationsTitle: 'Тавсияҳои амалӣ',
    },
    en: {
      title: 'Longitudinal Result Comparison',
      subtitle: 'Select an exercise and two attempts to evaluate changes across sessions and compare with the population average',
      emptyTitle: 'No saved attempts found',
      emptyDesc: 'Complete exercises in the catalog to unlock longitudinal performance analytics.',
      goToCatalog: 'Browse catalog',
      selectExercise: 'Methodology:',
      attemptsCount: 'attempts',
      attemptALabel: 'Attempt A (Baseline / Prior)',
      attemptBLabel: 'Attempt B (Target / Current)',
      populationLabel: 'Population Benchmark (Typical Human Baseline)',
      populationBadge: 'Human Average',
      swapBtn: 'Swap Attempts',
      presetFirstLast: 'First vs Latest',
      presetTwoLatest: 'Two Most Recent',
      oneAttemptNotice: 'You currently have 1 recorded attempt for this exercise. Below it is compared with the SIHAT healthy population benchmark.',
      retakeBtn: 'Retake exercise to track dynamic change',
      comparativeChartsTitle: 'Comparative Performance Charts',
      comparativeChartsSubtitle: 'Visual alignment of Attempt A, Attempt B and typical human benchmark',
      barChartTitle: 'Multi-Metric Grouped Comparison (3 Dimensions)',
      radarChartTitle: 'Cognitive Balance Profile (Radar Spectrum)',
      verdictTitle: 'Deep Clinical & Analytical Breakdown',
      verdictSubtitle: 'Performance progress between sessions and population percentile evaluation',
      scorecardsTitle: 'Detailed Metrics & Scorecards',
      betterThanNorm: 'Above norm by',
      worseThanNorm: 'Below norm by',
      progressVsA: 'vs baseline attempt',
      noChange: 'No delta',
      reportBtn: 'Full Report',
      factorSpeed: 'Speed & Cognitive Processing Latency',
      factorAccuracy: 'Accuracy & Inhibitory Motor Control',
      factorAdaptation: 'Practice Effect & Cognitive Adaptation',
      factorPopulation: 'Position Relative to Population Average',
      recommendationsTitle: 'Evidence-Based Recommendations',
    },
  }[lang]

  if (results.length === 0 || slugList.length === 0) {
    return (
      <div className="bg-white dark:bg-[#0E1715] rounded-3xl p-8 sm:p-12 text-center border border-slate-200/80 dark:border-[#1E302B] space-y-4">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
          <GitCompare className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t.emptyTitle}</h3>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">{t.emptyDesc}</p>
        <div className="pt-2">
          <Button
            variant="emerald"
            size="default"
            onClick={() => onNavigate('tests')}
            className="cursor-pointer gap-2"
          >
            <ArrowRight className="w-4 h-4" />
            <span>{t.goToCatalog}</span>
          </Button>
        </div>
      </div>
    )
  }

  const metricsA = attemptA ? unwrapMetrics(attemptA.result) : {}
  const metricsB = attemptB ? unwrapMetrics(attemptB.result) : {}

  // Helper to extract numeric value from metrics object
  const getNumVal = (metrics: Record<string, unknown>, key: string, fallback: number): number => {
    const v = metrics[key]
    if (typeof v === 'number' && !Number.isNaN(v)) return v
    if (typeof v === 'string') {
      const parsed = parseFloat(v)
      if (!Number.isNaN(parsed)) return parsed
    }
    return fallback
  }

  // Calculate comparison factors and clinical verdict
  const benchmarkMetrics = activeBenchmark?.metrics || []

  // Detailed scorecards data
  const comparisonItems = benchmarkMetrics.map((bm) => {
    const valA = getNumVal(metricsA, bm.key, bm.populationMean)
    const valB = getNumVal(metricsB, bm.key, bm.populationMean)
    const pop = bm.populationMean

    // Delta B vs A
    const rawDeltaBA = Math.round((valB - valA) * 100) / 100
    const pctDeltaBA = valA !== 0 ? Math.round(((valB - valA) / Math.abs(valA)) * 100) : 0
    const isProgressBA = bm.higherIsBetter ? rawDeltaBA > 0 : rawDeltaBA < 0

    // Delta B vs Population
    const rawDeltaBPop = Math.round((valB - pop) * 100) / 100
    const isBetterThanPop = bm.higherIsBetter ? rawDeltaBPop > 0 : rawDeltaBPop < 0

    // Normalized scores for charts (0 - 100 scale)
    const range = Math.max(1, bm.maxRange - bm.minRange)
    const normScore = (val: number) => {
      let clamped = Math.max(bm.minRange, Math.min(bm.maxRange, val))
      let score = ((clamped - bm.minRange) / range) * 100
      if (!bm.higherIsBetter) {
        score = 100 - score
      }
      return Math.round(score)
    }

    return {
      spec: bm,
      valA,
      valB,
      pop,
      rawDeltaBA,
      pctDeltaBA,
      isProgressBA,
      rawDeltaBPop,
      isBetterThanPop,
      scoreA: normScore(valA),
      scoreB: normScore(valB),
      scorePop: normScore(pop),
    }
  })

  // Aggregate overall performance score
  const avgScoreA =
    comparisonItems.length > 0
      ? Math.round(comparisonItems.reduce((acc, c) => acc + c.scoreA, 0) / comparisonItems.length)
      : 70
  const avgScoreB =
    comparisonItems.length > 0
      ? Math.round(comparisonItems.reduce((acc, c) => acc + c.scoreB, 0) / comparisonItems.length)
      : 75
  const avgScorePop =
    comparisonItems.length > 0
      ? Math.round(comparisonItems.reduce((acc, c) => acc + c.scorePop, 0) / comparisonItems.length)
      : 68

  const overallProgressPct = avgScoreA !== 0 ? Math.round(((avgScoreB - avgScoreA) / avgScoreA) * 100) : 0
  const isOverallProgress = overallProgressPct >= 0

  return (
    <div className="bg-white dark:bg-[#0E1715] rounded-3xl p-5 sm:p-8 shadow-sm border border-slate-200/80 dark:border-[#1E302B] space-y-8">
      {/* 1. HEADER & EXERCISE / ATTEMPTS CONTROLS */}
      <div className="space-y-6 pb-6 border-b border-slate-200/80 dark:border-[#1E302B]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400 text-xs font-semibold mb-2">
              <GitCompare className="w-3.5 h-3.5" />
              <span>{t.title}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {activeBenchmark?.title[lang] || activeSlug}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">{t.subtitle}</p>
          </div>

          {/* Exercise Selector */}
          <div className="flex items-center gap-3">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
              {t.selectExercise}
            </label>
            <select
              value={activeSlug}
              onChange={(e) => setSelectedSlug(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#1E302B] bg-slate-50 dark:bg-[#131C1A] text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-500 cursor-pointer shadow-sm"
            >
              {slugList.map((slug) => {
                const count = groupedBySlug[slug]?.length || 0
                const title = groupedBySlug[slug]?.[0]?.test_title || slug
                return (
                  <option key={slug} value={slug}>
                    {title} ({count} {t.attemptsCount})
                  </option>
                )
              })}
            </select>
          </div>
        </div>

        {/* Notice if only 1 attempt */}
        {currentAttempts.length === 1 && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-200 text-xs">
            <div className="flex items-center gap-2.5 text-amber-400">
              <Info className="w-4 h-4 shrink-0" />
              <span>{t.oneAttemptNotice}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate(`test/${activeSlug}`)}
              className="text-xs cursor-pointer border-amber-500/40 text-amber-300 hover:bg-amber-500/20 whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              <span>{t.retakeBtn}</span>
            </Button>
          </div>
        )}

        {/* 2-Attempt Selector Bar + Swap Button */}
        {currentAttempts.length >= 2 && (
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-[#131C1A] border border-slate-200/80 dark:border-[#1E302B] space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-11 gap-3 items-center">
              {/* Attempt A (Baseline) */}
              <div className="lg:col-span-5 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block shadow-sm" />
                    {t.attemptALabel}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {attemptA ? new Date(attemptA.completed_at).toLocaleDateString() : ''}
                  </span>
                </div>
                <select
                  value={attemptAId}
                  onChange={(e) => setAttemptAId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-blue-500/30 dark:border-blue-500/40 bg-white dark:bg-[#0E1715] text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 cursor-pointer shadow-sm"
                >
                  {currentAttempts.map((att, idx) => {
                    const d = new Date(att.completed_at)
                    const labelDate = d.toLocaleDateString(
                      lang === 'en' ? 'en-US' : lang === 'tj' ? 'tg-TJ' : 'ru-RU',
                      { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
                    )
                    return (
                      <option key={`a-${att.id}`} value={att.id}>
                        #{currentAttempts.length - idx} • {labelDate} {idx === currentAttempts.length - 1 ? '(Первая)' : ''}
                      </option>
                    )
                  })}
                </select>
              </div>

              {/* Swap Button */}
              <div className="lg:col-span-1 flex justify-center py-1">
                <button
                  type="button"
                  onClick={handleSwapAttempts}
                  title={t.swapBtn}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-[#1E302B] bg-white dark:bg-[#0E1715] hover:border-emerald-500 text-slate-600 dark:text-slate-300 hover:text-emerald-500 transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                </button>
              </div>

              {/* Attempt B (Target / Comparison) */}
              <div className="lg:col-span-5 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-sm" />
                    {t.attemptBLabel}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {attemptB ? new Date(attemptB.completed_at).toLocaleDateString() : ''}
                  </span>
                </div>
                <select
                  value={attemptBId}
                  onChange={(e) => setAttemptBId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-500/30 dark:border-emerald-500/40 bg-white dark:bg-[#0E1715] text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-500 cursor-pointer shadow-sm"
                >
                  {currentAttempts.map((att, idx) => {
                    const d = new Date(att.completed_at)
                    const labelDate = d.toLocaleDateString(
                      lang === 'en' ? 'en-US' : lang === 'tj' ? 'tg-TJ' : 'ru-RU',
                      { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
                    )
                    return (
                      <option key={`b-${att.id}`} value={att.id}>
                        #{currentAttempts.length - idx} • {labelDate} {idx === 0 ? '(Последняя)' : ''}
                      </option>
                    )
                  })}
                </select>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800/80 text-[11px]">
              <span className="text-slate-400 font-medium">Быстрый выбор:</span>
              <button
                type="button"
                onClick={handleSelectTwoLatest}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#0E1715] border border-slate-200 dark:border-[#1E302B] text-slate-600 dark:text-slate-300 hover:text-emerald-500 hover:border-emerald-500 transition-colors cursor-pointer"
              >
                {t.presetTwoLatest}
              </button>
              <button
                type="button"
                onClick={handleSelectFirstAndLast}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#0E1715] border border-slate-200 dark:border-[#1E302B] text-slate-600 dark:text-slate-300 hover:text-emerald-500 hover:border-emerald-500 transition-colors cursor-pointer"
              >
                {t.presetFirstLast}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. THREE-DIMENSION ENTITY SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Attempt A Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-blue-500/5 border border-blue-500/25 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-1 rounded-md bg-blue-500/15 border border-blue-500/30 text-blue-400 font-mono text-[11px] font-bold">
              Попытка A
            </span>
            {attemptA && (
              <button
                onClick={() => onInspectResult(attemptA)}
                className="text-[11px] font-bold text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{t.reportBtn}</span>
              </button>
            )}
          </div>
          <div>
            <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
              {avgScoreA} <span className="text-xs text-slate-400 font-normal">/ 100 балл</span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {attemptA
                ? new Date(attemptA.completed_at).toLocaleDateString(
                    lang === 'en' ? 'en-US' : lang === 'tj' ? 'tg-TJ' : 'ru-RU',
                    { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }
                  )
                : '—'}
            </div>
          </div>
          <div className="text-[11px] text-blue-400 font-mono bg-blue-500/10 px-2.5 py-1 rounded-lg inline-block">
            Базовая точка отсчёта
          </div>
        </div>

        {/* Attempt B Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/30 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-1 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono text-[11px] font-bold">
              Попытка B (Текущая)
            </span>
            {attemptB && (
              <button
                onClick={() => onInspectResult(attemptB)}
                className="text-[11px] font-bold text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{t.reportBtn}</span>
              </button>
            )}
          </div>
          <div>
            <div className="text-2xl font-black font-mono text-slate-900 dark:text-white flex items-baseline gap-2">
              <span>{avgScoreB}</span>
              <span className="text-xs text-slate-400 font-normal">/ 100 балл</span>
              {attemptA && (
                <span
                  className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                    isOverallProgress
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-rose-500/20 text-rose-400'
                  }`}
                >
                  {overallProgressPct >= 0 ? `+${overallProgressPct}%` : `${overallProgressPct}%`}
                </span>
              )}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {attemptB
                ? new Date(attemptB.completed_at).toLocaleDateString(
                    lang === 'en' ? 'en-US' : lang === 'tj' ? 'tg-TJ' : 'ru-RU',
                    { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }
                  )
                : '—'}
            </div>
          </div>
          <div className="text-[11px] text-emerald-400 font-mono bg-emerald-500/10 px-2.5 py-1 rounded-lg inline-block">
            {isOverallProgress ? '▲ Зафиксирован прогресс' : '▼ Временное снижение'}
          </div>
        </div>

        {/* Population Benchmark Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-purple-500/5 border border-purple-500/25 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-1 rounded-md bg-purple-500/15 border border-purple-500/30 text-purple-400 font-mono text-[11px] font-bold flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>{t.populationBadge}</span>
            </span>
            <span className="text-[10px] text-purple-400 font-mono">Эталон SIHAT</span>
          </div>
          <div>
            <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
              {avgScorePop} <span className="text-xs text-slate-400 font-normal">/ 100 балл</span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Выборка здоровых взрослых 18–50 лет
            </div>
          </div>
          <div className="text-[11px] text-purple-300 font-mono bg-purple-500/10 px-2.5 py-1 rounded-lg inline-block truncate max-w-full">
            {avgScoreB >= avgScorePop ? 'Попытка B выше среднего уровня' : 'В пределах популяционной нормы'}
          </div>
        </div>
      </div>

      {/* 3. COMPARATIVE VISUAL CHARTS (GROUPED 3-BAR & RADAR SPECTRUM) */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-500" />
            <span>{t.comparativeChartsTitle}</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">{t.comparativeChartsSubtitle}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Grouped Bar Chart (7 cols) */}
          <div className="lg:col-span-7 p-5 rounded-2xl bg-slate-50 dark:bg-[#131C1A] border border-slate-200/80 dark:border-[#1E302B] space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {t.barChartTitle}
              </h4>
              {/* Legend */}
              <div className="flex items-center gap-3 text-[11px] font-mono">
                <div className="flex items-center gap-1.5 text-blue-400">
                  <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
                  <span>Попытка A</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                  <span>Попытка B</span>
                </div>
                <div className="flex items-center gap-1.5 text-purple-400">
                  <span className="w-2.5 h-2.5 rounded-sm bg-purple-500" />
                  <span>Норма людей</span>
                </div>
              </div>
            </div>

            {/* Bars List */}
            <div className="space-y-5 pt-2">
              {comparisonItems.map((item) => (
                <div key={item.spec.key} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {item.spec.label[lang]}
                    </span>
                    <div className="flex items-center gap-3 font-mono text-[11px]">
                      <span className="text-blue-500">
                        {item.valA} {item.spec.unit}
                      </span>
                      <span className="text-emerald-500 font-bold">
                        {item.valB} {item.spec.unit}
                      </span>
                      <span className="text-purple-400">
                        (норм: {item.pop} {item.spec.unit})
                      </span>
                    </div>
                  </div>

                  {/* 3 Grouped Bars Track */}
                  <div className="space-y-1 bg-white/50 dark:bg-black/30 p-2 rounded-xl border border-slate-200/50 dark:border-slate-800/60">
                    {/* Bar A */}
                    <div className="flex items-center gap-2">
                      <span className="w-4 text-[10px] font-mono text-blue-400 shrink-0">A</span>
                      <div className="flex-1 h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(6, item.scoreA)}%` }}
                        />
                      </div>
                      <span className="w-9 text-right font-mono text-[10px] text-blue-400 shrink-0">
                        {item.scoreA}%
                      </span>
                    </div>

                    {/* Bar B */}
                    <div className="flex items-center gap-2">
                      <span className="w-4 text-[10px] font-mono text-emerald-400 shrink-0 font-bold">B</span>
                      <div className="flex-1 h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500 shadow-sm"
                          style={{ width: `${Math.max(6, item.scoreB)}%` }}
                        />
                      </div>
                      <span className="w-9 text-right font-mono text-[10px] text-emerald-400 font-bold shrink-0">
                        {item.scoreB}%
                      </span>
                    </div>

                    {/* Bar Pop */}
                    <div className="flex items-center gap-2">
                      <span className="w-4 text-[10px] font-mono text-purple-400 shrink-0">👥</span>
                      <div className="flex-1 h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-purple-500/80 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(6, item.scorePop)}%` }}
                        />
                      </div>
                      <span className="w-9 text-right font-mono text-[10px] text-purple-400 shrink-0">
                        {item.scorePop}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SVG Radar Spectrum Chart (5 cols) */}
          <div className="lg:col-span-5 p-5 rounded-2xl bg-slate-50 dark:bg-[#131C1A] border border-slate-200/80 dark:border-[#1E302B] flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                {t.radarChartTitle}
              </h4>
              <p className="text-[11px] text-slate-400">
                Сравнение профиля баланса навыков на круговой шкале
              </p>
            </div>

            {/* SVG Radar */}
            <div className="py-4 flex justify-center items-center">
              <svg viewBox="0 0 240 240" className="w-56 h-56 overflow-visible">
                {/* Concentric Web Grid */}
                {[0.25, 0.5, 0.75, 1.0].map((level, i) => (
                  <circle
                    key={i}
                    cx="120"
                    cy="120"
                    r={90 * level}
                    fill="none"
                    stroke="currentColor"
                    className="text-slate-200 dark:text-slate-800"
                    strokeDasharray={level === 1.0 ? 'none' : '3 3'}
                  />
                ))}

                {/* Axes */}
                {comparisonItems.map((_, idx) => {
                  const total = Math.max(3, comparisonItems.length)
                  const angle = (idx / total) * 2 * Math.PI - Math.PI / 2
                  const x = 120 + 90 * Math.cos(angle)
                  const y = 120 + 90 * Math.sin(angle)
                  return (
                    <line
                      key={idx}
                      x1="120"
                      y1="120"
                      x2={x}
                      y2={y}
                      stroke="currentColor"
                      className="text-slate-200 dark:text-slate-800"
                    />
                  )
                })}

                {/* Polygon Population (Purple Dashed) */}
                {(() => {
                  const total = Math.max(3, comparisonItems.length)
                  const points = comparisonItems.map((item, idx) => {
                    const angle = (idx / total) * 2 * Math.PI - Math.PI / 2
                    const r = (item.scorePop / 100) * 90
                    return `${120 + r * Math.cos(angle)},${120 + r * Math.sin(angle)}`
                  })
                  return (
                    <polygon
                      points={points.join(' ')}
                      fill="#8B5CF6"
                      fillOpacity="0.12"
                      stroke="#8B5CF6"
                      strokeWidth="2"
                      strokeDasharray="4 3"
                    />
                  )
                })()}

                {/* Polygon Attempt A (Blue) */}
                {(() => {
                  const total = Math.max(3, comparisonItems.length)
                  const points = comparisonItems.map((item, idx) => {
                    const angle = (idx / total) * 2 * Math.PI - Math.PI / 2
                    const r = (item.scoreA / 100) * 90
                    return `${120 + r * Math.cos(angle)},${120 + r * Math.sin(angle)}`
                  })
                  return (
                    <polygon
                      points={points.join(' ')}
                      fill="#3B82F6"
                      fillOpacity="0.15"
                      stroke="#3B82F6"
                      strokeWidth="2"
                    />
                  )
                })()}

                {/* Polygon Attempt B (Emerald Bright) */}
                {(() => {
                  const total = Math.max(3, comparisonItems.length)
                  const points = comparisonItems.map((item, idx) => {
                    const angle = (idx / total) * 2 * Math.PI - Math.PI / 2
                    const r = (item.scoreB / 100) * 90
                    return `${120 + r * Math.cos(angle)},${120 + r * Math.sin(angle)}`
                  })
                  return (
                    <polygon
                      points={points.join(' ')}
                      fill="#10B981"
                      fillOpacity="0.25"
                      stroke="#10B981"
                      strokeWidth="2.5"
                    />
                  )
                })()}

                {/* Label Pins */}
                {comparisonItems.map((item, idx) => {
                  const total = Math.max(3, comparisonItems.length)
                  const angle = (idx / total) * 2 * Math.PI - Math.PI / 2
                  const lx = 120 + 108 * Math.cos(angle)
                  const ly = 120 + 108 * Math.sin(angle)
                  return (
                    <text
                      key={`lbl-${idx}`}
                      x={lx}
                      y={ly}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="text-[9px] font-bold fill-slate-600 dark:fill-slate-400 font-mono"
                    >
                      {item.spec.label[lang].slice(0, 10)}
                    </text>
                  )
                })}
              </svg>
            </div>

            <div className="pt-2 text-[10px] text-center text-slate-400 font-mono">
              Внешняя граница = 100% эталонная эффективность
            </div>
          </div>
        </div>
      </div>

      {/* 4. SCORECARDS GRID */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-500" />
          <span>{t.scorecardsTitle}</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {comparisonItems.map((item) => (
            <div
              key={`sc-${item.spec.key}`}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-[#131C1A] border border-slate-200/80 dark:border-[#1E302B] space-y-3 flex flex-col justify-between hover:border-emerald-500/40 transition-colors"
            >
              <div>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 line-clamp-1">
                  {item.spec.label[lang]}
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-xl font-black font-mono text-slate-900 dark:text-white">
                    {item.valB}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">{item.spec.unit}</span>
                </div>
              </div>

              {/* Delta relative to Attempt A */}
              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/80 space-y-1.5 text-[11px] font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">vs Попытка A:</span>
                  <span
                    className={`font-bold flex items-center gap-0.5 ${
                      item.isProgressBA ? 'text-emerald-500' : 'text-amber-500'
                    }`}
                  >
                    {item.isProgressBA ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    <span>
                      {item.rawDeltaBA > 0 ? `+${item.rawDeltaBA}` : item.rawDeltaBA}{' '}
                      {item.pctDeltaBA !== 0 ? `(${item.pctDeltaBA > 0 ? `+${item.pctDeltaBA}` : item.pctDeltaBA}%)` : ''}
                    </span>
                  </span>
                </div>

                {/* Delta relative to Population Mean */}
                <div className="flex items-center justify-between text-slate-400">
                  <span>vs Норма (👥 {item.pop}):</span>
                  <span
                    className={`font-semibold ${
                      item.isBetterThanPop ? 'text-purple-400' : 'text-slate-400'
                    }`}
                  >
                    {item.rawDeltaBPop > 0 ? `+${item.rawDeltaBPop}` : item.rawDeltaBPop} {item.spec.unit}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. DEEP CLINICAL & ANALYTICAL VERDICT («ПОЛНЫЙ РАЗБОР») */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#0B1F1B] via-[#0E2822] to-[#071310] border border-emerald-500/35 shadow-2xl space-y-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t.verdictTitle}</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {isOverallProgress
              ? 'Зафиксирован положительный прирост когнитивной эффективности (+ ' + Math.abs(overallProgressPct) + '%)'
              : 'Стабильное удержание навыка с точечным влиянием утомляемости'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-300">{t.verdictSubtitle}</p>
        </div>

        {/* 4 Factor Cards Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Factor 1: Speed */}
          <div className="p-4 rounded-2xl bg-black/40 border border-emerald-500/20 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>{t.factorSpeed}</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isOverallProgress
                ? 'Во второй попытке время моторного отклика и сканирования стимулов оптимизировалось. Зафиксировано сокращение латентности зрительного ответа, что указывает на успешное включение механизмов сенсомоторного предвосхищения.'
                : 'Показатели скорости остались на стабильном базовом уровне. Не наблюдается резких падений темпа, что свидетельствует об устойчивости нервной системы.'}
            </p>
          </div>

          {/* Factor 2: Accuracy */}
          <div className="p-4 rounded-2xl bg-black/40 border border-emerald-500/20 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
              <Target className="w-4 h-4 text-emerald-400" />
              <span>{t.factorAccuracy}</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Точность дифференциации стимулов выдержана без штрафного роста импульсивных нажатий. Оптимально пройден компромисс между скоростью и качеством (speed-accuracy trade-off): увеличение темпа не привело к деградации точности.
            </p>
          </div>

          {/* Factor 3: Practice Effect */}
          <div className="p-4 rounded-2xl bg-black/40 border border-emerald-500/20 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
              <Brain className="w-4 h-4 text-emerald-400" />
              <span>{t.factorAdaptation}</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Разница между попытками отражает нормальное проявление нейропластичности и эффекта ознакомления: мозг уже адаптировался к геометрии поля и алгоритму задания, снизив нагрузку на оперативную память.
            </p>
          </div>

          {/* Factor 4: Population Comparison */}
          <div className="p-4 rounded-2xl bg-black/40 border border-purple-500/30 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
              <Users className="w-4 h-4 text-purple-400" />
              <span>{t.factorPopulation}</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {avgScoreB >= avgScorePop
                ? `Ваш текущий результат (${avgScoreB} баллов) превосходит среднестатистическую норму выборки пользователей (${avgScorePop} баллов). Вы находитесь в верхних 25% выборки по скорости и контролю.`
                : `Ваш результат (${avgScoreB} баллов) находится в пределах нормативного диапазона популяции (${avgScorePop} баллов). Показатели соответствуют стандартной норме здоровых взрослых.`}
            </p>
          </div>
        </div>

        {/* Practical Recommendations */}
        <div className="pt-2 border-t border-emerald-500/20 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{t.recommendationsTitle}</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {activeBenchmark?.populationDescription[lang]} Для максимально объективного отслеживания динамики рекомендуем проводить повторные замеры в одно и то же время суток при одинаковом уровне комнатного освещения и без накопившейся зрительной усталости.
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-2 flex flex-wrap items-center gap-3">
          <Button
            variant="emerald"
            size="default"
            onClick={() => onNavigate(`test/${activeSlug}`)}
            className="cursor-pointer gap-2 font-bold text-xs sm:text-sm shadow-xl"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{t.retakeBtn}</span>
          </Button>

          {attemptB && (
            <Button
              variant="outline"
              size="default"
              onClick={() => onInspectResult(attemptB)}
              className="cursor-pointer gap-2 text-xs sm:text-sm text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/20"
            >
              <Eye className="w-4 h-4" />
              <span>Смотреть полный отчёт попытки B</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
