import React from 'react'
import {
  Award,
  Calendar,
  CheckCircle,
  CheckCircle2,
  Download,
  RotateCcw,
  Save,
  ShieldCheck,
  Trash2,
  TrendingUp,
  AlertTriangle,
  Activity,
  BarChart3,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import { Card } from './ui/Card'
import type { Language } from '../i18n'
import type { SavedResult } from '../types'

export interface ResultReportViewProps {
  lang: Language
  testSlug?: string
  slug?: string
  testTitle?: string
  title?: string
  methodologyName?: string
  methodology?: { name?: string | null; version?: string | null; source?: string | null; limitations?: string | null } | null
  completedAt?: string
  resultData?: Record<string, any>
  result?: Record<string, any>
  limitations?: string
  previousResults?: SavedResult[]
  isSaved?: boolean
  isSaving?: boolean
  isDownloadingPdf?: boolean
  canSave?: boolean
  isAuthenticated?: boolean
  compact?: boolean
  onSave?: () => void
  onDiscard?: () => void
  onRetake?: () => void
  onDownloadPdf?: () => void
  onOpenAuth?: () => void
  onBackToCatalog?: () => void
}

interface MetricSpec {
  key: string
  label: { ru: string; tj: string; en: string }
  unit?: { ru: string; tj: string; en: string }
  isErrorMetric?: boolean
}

const METRIC_DICTIONARY: Record<string, MetricSpec> = {
  total_time_sec: {
    key: 'total_time_sec',
    label: { ru: 'Общее время', tj: 'Вақти умумӣ', en: 'Total Time' },
    unit: { ru: 'с', tj: 'с', en: 's' },
  },
  completion_time_sec: {
    key: 'completion_time_sec',
    label: { ru: 'Время прохождения', tj: 'Вақти гузаштан', en: 'Completion Time' },
    unit: { ru: 'с', tj: 'с', en: 's' },
  },
  time_sec: {
    key: 'time_sec',
    label: { ru: 'Затраченное время', tj: 'Вақти сарфшуда', en: 'Elapsed Time' },
    unit: { ru: 'с', tj: 'с', en: 's' },
  },
  duration_sec: {
    key: 'duration_sec',
    label: { ru: 'Длительность', tj: 'Давомнокӣ', en: 'Duration' },
    unit: { ru: 'с', tj: 'с', en: 's' },
  },
  tracking_duration_sec: {
    key: 'tracking_duration_sec',
    label: { ru: 'Длительность слежения', tj: 'Давомнокии пайгирӣ', en: 'Tracking Duration' },
    unit: { ru: 'с', tj: 'с', en: 's' },
  },
  average_step_ms: {
    key: 'average_step_ms',
    label: { ru: 'Средний темп шага', tj: 'Суръати миёнаи қадам', en: 'Average Step Pace' },
    unit: { ru: 'мс', tj: 'мс', en: 'ms' },
  },
  first_half_sec: {
    key: 'first_half_sec',
    label: { ru: 'Первая половина (1–12)', tj: 'Нисфи аввал (1–12)', en: 'First Half (1–12)' },
    unit: { ru: 'с', tj: 'с', en: 's' },
  },
  second_half_sec: {
    key: 'second_half_sec',
    label: { ru: 'Вторая половина (14–25)', tj: 'Нисфи дуюм (14–25)', en: 'Second Half (14–25)' },
    unit: { ru: 'с', tj: 'с', en: 's' },
  },
  part_a_sec: {
    key: 'part_a_sec',
    label: { ru: 'Часть A (прямой счёт)', tj: 'Қисми A (ҳисоби оддӣ)', en: 'Part A (Sequential)' },
    unit: { ru: 'с', tj: 'с', en: 's' },
  },
  part_b_sec: {
    key: 'part_b_sec',
    label: { ru: 'Часть B (чередование)', tj: 'Қисми B (ивазкунӣ)', en: 'Part B (Alternating)' },
    unit: { ru: 'с', tj: 'с', en: 's' },
  },
  switching_cost_sec: {
    key: 'switching_cost_sec',
    label: { ru: 'Цена переключения (B − A)', tj: 'Арзиши ивазшавӣ (B − A)', en: 'Switching Cost (B − A)' },
    unit: { ru: 'с', tj: 'с', en: 's' },
  },
  max_span: {
    key: 'max_span',
    label: { ru: 'Максимальная длина цепочки', tj: 'Дарозии ниҳоии занҷир', en: 'Max Sequence Span' },
    unit: { ru: 'эл.', tj: 'унсур', en: 'items' },
  },
  max_spatial_span: {
    key: 'max_spatial_span',
    label: { ru: 'Максимальная длина цепочки', tj: 'Дарозии ниҳоии занҷир', en: 'Max Spatial Span' },
    unit: { ru: 'эл.', tj: 'унсур', en: 'items' },
  },
  forward_span: {
    key: 'forward_span',
    label: { ru: 'Прямой цифровой ряд', tj: 'Қатори мустақим', en: 'Forward Digit Span' },
    unit: { ru: 'цифр', tj: 'рақам', en: 'digits' },
  },
  backward_span: {
    key: 'backward_span',
    label: { ru: 'Обратный цифровой ряд', tj: 'Қатори бозгаштӣ', en: 'Backward Digit Span' },
    unit: { ru: 'цифр', tj: 'рақам', en: 'digits' },
  },
  max_digit_span: {
    key: 'max_digit_span',
    label: { ru: 'Объём памяти на цифры', tj: 'Ҳаҷми хотираи рақамҳо', en: 'Digit Span' },
    unit: { ru: 'цифр', tj: 'рақам', en: 'digits' },
  },
  trials_passed: {
    key: 'trials_passed',
    label: { ru: 'Успешных проб', tj: 'Кӯшишҳои бобарор', en: 'Trials Passed' },
  },
  trials_attempted: {
    key: 'trials_attempted',
    label: { ru: 'Всего проб', tj: 'Ҳамагӣ кӯшишҳо', en: 'Trials Attempted' },
  },
  correct_count: {
    key: 'correct_count',
    label: { ru: 'Правильных ответов', tj: 'Ҷавобҳои дуруст', en: 'Correct Responses' },
  },
  items_attempted: {
    key: 'items_attempted',
    label: { ru: 'Всего ответов', tj: 'Ҳамагӣ ҷавобҳо', en: 'Items Attempted' },
  },
  speed_per_minute: {
    key: 'speed_per_minute',
    label: { ru: 'Скорость верных ответов', tj: 'Суръати ҷавобҳои дуруст', en: 'Correct Rate' },
    unit: { ru: 'в мин', tj: 'дар 1 дақ', en: '/ min' },
  },
  threshold_contrast_pct: {
    key: 'threshold_contrast_pct',
    label: { ru: 'Порог контраста', tj: 'Ҳадди контраст', en: 'Contrast Threshold' },
    unit: { ru: '%', tj: '%', en: '%' },
  },
  levels_passed: {
    key: 'levels_passed',
    label: { ru: 'Пройдено уровней', tj: 'Сатҳҳои гузашташуда', en: 'Levels Passed' },
  },
  trials_correct: {
    key: 'trials_correct',
    label: { ru: 'Верных проб', tj: 'Кӯшишҳои дуруст', en: 'Correct Trials' },
  },
  moves_count: {
    key: 'moves_count',
    label: { ru: 'Количество ходов', tj: 'Шумораи гаштҳо', en: 'Total Moves' },
  },
  total_moves: {
    key: 'total_moves',
    label: { ru: 'Количество ходов', tj: 'Шумораи гаштҳо', en: 'Total Moves' },
  },
  efficiency_pct: {
    key: 'efficiency_pct',
    label: { ru: 'Точность поиска пар', tj: 'Самаранокии ҷустуҷӯ', en: 'Search Efficiency' },
    unit: { ru: '%', tj: '%', en: '%' },
  },
  routes_correct: {
    key: 'routes_correct',
    label: { ru: 'Маршрутов без ошибок', tj: 'Масирҳои бехато', en: 'Exact Routes' },
  },
  routes_total: {
    key: 'routes_total',
    label: { ru: 'Всего маршрутов', tj: 'Ҳамагӣ масирҳо', en: 'Total Routes' },
  },
  steps_correct: {
    key: 'steps_correct',
    label: { ru: 'Верных шагов маршрута', tj: 'Қадамҳои дуруст', en: 'Correct Route Steps' },
  },
  steps_total: {
    key: 'steps_total',
    label: { ru: 'Всего шагов маршрута', tj: 'Ҳамагӣ қадамҳо', en: 'Total Route Steps' },
  },
  longest_route: {
    key: 'longest_route',
    label: { ru: 'Макс. длина маршрута', tj: 'Дарозии ниҳоии масир', en: 'Longest Exact Route' },
    unit: { ru: 'шагов', tj: 'қадам', en: 'steps' },
  },
  total_items: {
    key: 'total_items',
    label: { ru: 'Всего заданий', tj: 'Ҳамагӣ супоришҳо', en: 'Total Items' },
  },
  mean_item_sec: {
    key: 'mean_item_sec',
    label: { ru: 'Среднее время размышления', tj: 'Вақти миёнаи фикрронӣ', en: 'Mean Thinking Time' },
    unit: { ru: 'с', tj: 'с', en: 's' },
  },
  total_trials: {
    key: 'total_trials',
    label: { ru: 'Всего проб', tj: 'Ҳамагӣ кӯшишҳо', en: 'Total Trials' },
  },
  smallest_reliable_delta_pct: {
    key: 'smallest_reliable_delta_pct',
    label: { ru: 'Мин. различимая разница частот', tj: 'Фарқи ҳадди ақали басомад', en: 'Smallest Pitch Delta' },
    unit: { ru: '%', tj: '%', en: '%' },
  },
  same_pairs_correct: {
    key: 'same_pairs_correct',
    label: { ru: 'Верно узнано одинаковых пар', tj: 'Ҷуфтҳои якхелаи дуруст', en: 'Identical Pairs Correct' },
  },
  digits_correct: {
    key: 'digits_correct',
    label: { ru: 'Распознано цифр', tj: 'Рақамҳои шинохташуда', en: 'Digits Recognized' },
  },
  digits_total: {
    key: 'digits_total',
    label: { ru: 'Всего цифр', tj: 'Ҳамагӣ рақамҳо', en: 'Total Digits' },
  },
  triplets_exact: {
    key: 'triplets_exact',
    label: { ru: 'Полных троек без ошибок', tj: 'Сегонаҳои пурраи бехато', en: 'Exact Triplets' },
  },
  triplets_total: {
    key: 'triplets_total',
    label: { ru: 'Всего троек', tj: 'Ҳамагӣ сегонаҳо', en: 'Total Triplets' },
  },
  mean_rt_ms: {
    key: 'mean_rt_ms',
    label: { ru: 'Среднее время реакции', tj: 'Вақти миёнаи аксуламал', en: 'Mean Reaction Time' },
    unit: { ru: 'мс', tj: 'мс', en: 'ms' },
  },
  reaction_time_ms: {
    key: 'reaction_time_ms',
    label: { ru: 'Среднее время реакции', tj: 'Вақти миёнаи аксуламал', en: 'Mean Reaction Time' },
    unit: { ru: 'мс', tj: 'мс', en: 'ms' },
  },
  median_rt_ms: {
    key: 'median_rt_ms',
    label: { ru: 'Медианное время реакции', tj: 'Вақти миёнарави аксуламал', en: 'Median Reaction Time' },
    unit: { ru: 'мс', tj: 'мс', en: 'ms' },
  },
  best_rt_ms: {
    key: 'best_rt_ms',
    label: { ru: 'Лучшее время реакции', tj: 'Беҳтарин вақти аксуламал', en: 'Best Reaction Time' },
    unit: { ru: 'мс', tj: 'мс', en: 'ms' },
  },
  best_time_ms: {
    key: 'best_time_ms',
    label: { ru: 'Лучшее время реакции', tj: 'Беҳтарин вақти аксуламал', en: 'Best Reaction Time' },
    unit: { ru: 'мс', tj: 'мс', en: 'ms' },
  },
  slowest_rt_ms: {
    key: 'slowest_rt_ms',
    label: { ru: 'Самая медленная попытка', tj: 'Кӯшиши сусттарин', en: 'Slowest Reaction' },
    unit: { ru: 'мс', tj: 'мс', en: 'ms' },
  },
  variability_ms: {
    key: 'variability_ms',
    label: { ru: 'Разброс времени реакции (SD)', tj: 'Парокандагии аксуламал (SD)', en: 'Reaction Variability (SD)' },
    unit: { ru: 'мс', tj: 'мс', en: 'ms' },
  },
  valid_trials: {
    key: 'valid_trials',
    label: { ru: 'Засчитанных попыток', tj: 'Кӯшишҳои ҳисобшуда', en: 'Valid Trials' },
  },
  go_hits: {
    key: 'go_hits',
    label: { ru: 'Точных нажатий Go', tj: 'Пахшҳои дурусти Go', en: 'Correct Go Hits' },
  },
  correct_rejections: {
    key: 'correct_rejections',
    label: { ru: 'Удержаний на No-Go', tj: 'Худдорӣ дар No-Go', en: 'Correct No-Go Rejections' },
  },
  inhibition_pct: {
    key: 'inhibition_pct',
    label: { ru: 'Точность торможения (No-Go)', tj: 'Дақиқияти боздорӣ (No-Go)', en: 'Inhibition Accuracy' },
    unit: { ru: '%', tj: '%', en: '%' },
  },
  accuracy_pct: {
    key: 'accuracy_pct',
    label: { ru: 'Общая точность', tj: 'Дақиқияти умумӣ', en: 'Overall Accuracy' },
    unit: { ru: '%', tj: '%', en: '%' },
  },
  time_on_target_pct: {
    key: 'time_on_target_pct',
    label: { ru: 'Удержание цели', tj: 'Нигоҳдории ҳадаф', en: 'Time on Target' },
    unit: { ru: '%', tj: '%', en: '%' },
  },
  in_corridor_pct: {
    key: 'in_corridor_pct',
    label: { ru: 'Удержание в коридоре', tj: 'Нигоҳдорӣ дар роҳрав', en: 'Inside Corridor' },
    unit: { ru: '%', tj: '%', en: '%' },
  },
  deviation_rmse_pct: {
    key: 'deviation_rmse_pct',
    label: { ru: 'Среднеквадратичное отклонение', tj: 'Инҳирофи миёнаквадратӣ', en: 'RMS Deviation' },
    unit: { ru: '%', tj: '%', en: '%' },
  },
  mean_deviation_pct: {
    key: 'mean_deviation_pct',
    label: { ru: 'Среднее отклонение от траектории', tj: 'Инҳирофи миёна аз масир', en: 'Mean Path Deviation' },
    unit: { ru: '%', tj: '%', en: '%' },
  },
  pta_db: {
    key: 'pta_db',
    label: { ru: 'Чистотональный порог слуха (PTA)', tj: 'Ҳадди софи шунавоӣ (PTA)', en: 'Pure Tone Average' },
    unit: { ru: 'дБ HL', tj: 'дБ HL', en: 'dB HL' },
  },
  // Error metrics
  errors_count: {
    key: 'errors_count',
    label: { ru: 'Ошибок', tj: 'Хатоҳо', en: 'Errors' },
    isErrorMetric: true,
  },
  error_count: {
    key: 'error_count',
    label: { ru: 'Ошибок', tj: 'Хатоҳо', en: 'Errors' },
    isErrorMetric: true,
  },
  errors_a: {
    key: 'errors_a',
    label: { ru: 'Ошибок в части A', tj: 'Хатоҳо дар қисми A', en: 'Part A Errors' },
    isErrorMetric: true,
  },
  errors_b: {
    key: 'errors_b',
    label: { ru: 'Ошибок в части B', tj: 'Хатоҳо дар қисми B', en: 'Part B Errors' },
    isErrorMetric: true,
  },
  mismatches_count: {
    key: 'mismatches_count',
    label: { ru: 'Несовпавших открытий пар', tj: 'Кушодани ҷуфтҳои номувофиқ', en: 'Mismatched Pair Flips' },
    isErrorMetric: true,
  },
  anticipations_count: {
    key: 'anticipations_count',
    label: { ru: 'Фальстартов (ранних нажатий)', tj: 'Пахшҳои пеш аз вақт', en: 'False Starts (Anticipations)' },
    isErrorMetric: true,
  },
  lapses_count: {
    key: 'lapses_count',
    label: { ru: 'Задержек (> 500 мс)', tj: 'Таъхирҳо (> 500 мс)', en: 'Attention Lapses (> 500 ms)' },
    isErrorMetric: true,
  },
  omissions_count: {
    key: 'omissions_count',
    label: { ru: 'Пропусков сигнала Go', tj: 'Гузаронидани сигнали Go', en: 'Go Omissions' },
    isErrorMetric: true,
  },
  commission_errors: {
    key: 'commission_errors',
    label: { ru: 'Ложных нажатий на No-Go', tj: 'Пахшҳои хато дар No-Go', en: 'No-Go False Alarms' },
    isErrorMetric: true,
  },
  boundary_exits: {
    key: 'boundary_exits',
    label: { ru: 'Выходов за границу коридора', tj: 'Берунравиҳо аз роҳрав', en: 'Corridor Boundary Exits' },
    isErrorMetric: true,
  },
  protan_errors: {
    key: 'protan_errors',
    label: { ru: 'Ошибки в красном спектре (L)', tj: 'Хатоҳо дар спектри сурх (L)', en: 'Protan Errors (L-cone)' },
    isErrorMetric: true,
  },
  deutan_errors: {
    key: 'deutan_errors',
    label: { ru: 'Ошибки в зелёном спектре (M)', tj: 'Хатоҳо дар спектри сабз (M)', en: 'Deutan Errors (M-cone)' },
    isErrorMetric: true,
  },
  tritan_errors: {
    key: 'tritan_errors',
    label: { ru: 'Ошибки в сине-жёлтом спектре (S)', tj: 'Хатоҳо дар спектри кабуду зард (S)', en: 'Tritan Errors (S-cone)' },
    isErrorMetric: true,
  },
  l_cone_pct: {
    key: 'l_cone_pct',
    label: { ru: 'Чувствительность L-колбочек (красный)', tj: 'Ҳассосияти колбочкаҳои L (сурх)', en: 'L-Cone Sensitivity (Red)' },
    unit: { ru: '%', tj: '%', en: '%' },
  },
  m_cone_pct: {
    key: 'm_cone_pct',
    label: { ru: 'Чувствительность M-колбочек (зелёный)', tj: 'Ҳассосияти колбочкаҳои M (сабз)', en: 'M-Cone Sensitivity (Green)' },
    unit: { ru: '%', tj: '%', en: '%' },
  },
  s_cone_pct: {
    key: 's_cone_pct',
    label: { ru: 'Чувствительность S-колбочек (синий)', tj: 'Ҳассосияти колбочкаҳои S (кабуд)', en: 'S-Cone Sensitivity (Blue)' },
    unit: { ru: '%', tj: '%', en: '%' },
  },
}

export const PRIORITY_METRIC_ORDER = [
  'accuracy_pct',
  'inhibition_pct',
  'efficiency_pct',
  'time_on_target_pct',
  'in_corridor_pct',
  'threshold_contrast_pct',
  'pta_db',
  'score',
  'percentage',
  'mean_rt_ms',
  'reaction_time_ms',
  'median_rt_ms',
  'total_time_sec',
  'completion_time_sec',
  'time_sec',
  'speed_per_minute',
  'mean_item_sec',
  'switching_cost_sec',
  'correct_count',
  'go_hits',
  'max_span',
  'max_spatial_span',
  'max_digit_span',
  'routes_correct',
  'steps_correct',
  'digits_correct',
  'triplets_exact',
  'moves_count',
  'total_moves',
  'trials_passed',
  'trials_correct',
  'levels_passed',
  'errors_count',
  'commission_errors',
  'boundary_exits',
  'mean_deviation_pct',
]

export function getTopMetricKeys(metrics: Record<string, any>, limit = 4): string[] {
  if (!metrics || typeof metrics !== 'object') return []
  const keys = Object.keys(metrics).filter(
    (k) => metrics[k] !== undefined && metrics[k] !== null && typeof metrics[k] !== 'object'
  )
  keys.sort((a, b) => {
    const idxA = PRIORITY_METRIC_ORDER.indexOf(a)
    const idxB = PRIORITY_METRIC_ORDER.indexOf(b)
    const rankA = idxA === -1 ? 999 : idxA
    const rankB = idxB === -1 ? 999 : idxB
    return rankA - rankB
  })
  return keys.slice(0, limit)
}

export function unwrapSeries(resultObj?: Record<string, any> | null): Record<string, any> {
  if (!resultObj || typeof resultObj !== 'object') return {}
  if (resultObj.series && typeof resultObj.series === 'object' && !Array.isArray(resultObj.series)) {
    return resultObj.series
  }
  if (resultObj.metrics && typeof resultObj.metrics === 'object') {
    if (resultObj.metrics.series && typeof resultObj.metrics.series === 'object' && !Array.isArray(resultObj.metrics.series)) {
      return resultObj.metrics.series
    }
    if (resultObj.metrics.metrics && typeof resultObj.metrics.metrics === 'object' && resultObj.metrics.metrics.series) {
      return resultObj.metrics.metrics.series
    }
  }
  if (resultObj.result && typeof resultObj.result === 'object') {
    if (resultObj.result.series && typeof resultObj.result.series === 'object') {
      return resultObj.result.series
    }
    if (resultObj.result.metrics && typeof resultObj.result.metrics === 'object' && resultObj.result.metrics.series) {
      return resultObj.result.metrics.series
    }
  }
  return {}
}

export function unwrapMetrics(resultObj?: Record<string, any> | null): Record<string, any> {
  if (!resultObj || typeof resultObj !== 'object') return {}

  let curr: any = resultObj
  for (let i = 0; i < 5; i++) {
    if (curr && typeof curr === 'object') {
      if (curr.metrics && typeof curr.metrics === 'object' && !Array.isArray(curr.metrics)) {
        curr = curr.metrics
      } else if (curr.result && typeof curr.result === 'object' && !Array.isArray(curr.result)) {
        curr = curr.result
      } else {
        break
      }
    }
  }

  const IGNORED_KEYS = new Set([
    'version', 'engine', 'series', 'trials', 'steps', 'details', 'answers',
    'summary', 'timestamp', 'session_id', 'questionnaire_version', 'status',
    'target', 'logs', 'raw_data', 'trajectory', 'trajectory_summary',
    'samples', 'by_rule', 'item_times_sec', 'history', 'target_path', 'cursor_path',
    'grid_size', 'frequencies', 'category', 'efficiency_category', 'status_category'
  ])

  const cleaned: Record<string, any> = {}

  const collect = (obj: any) => {
    if (!obj || typeof obj !== 'object') return
    for (const [k, v] of Object.entries(obj)) {
      if (IGNORED_KEYS.has(k)) continue
      if (v === null || v === undefined) continue
      if (typeof v === 'number' || typeof v === 'string' || typeof v === 'boolean') {
        if (cleaned[k] === undefined) cleaned[k] = v
      } else if (typeof v === 'object' && !Array.isArray(v)) {
        collect(v)
      }
    }
  }

  collect(curr)
  collect(resultObj)

  return cleaned
}

export interface ClinicalAssessment {
  score: number // 0 to 100
  tier: 'excellent' | 'normal' | 'attention'
  badgeLabel: string
  verdictTitle: string
  explanation: string
  referenceNorm: string
  benchmarkTag: string
}

export function computeAssessment(
  slug: string,
  rawMetrics: Record<string, any>,
  lang: Language = 'ru'
): ClinicalAssessment {
  const m = rawMetrics || {}

  switch (slug) {
    case 'cursor-path': {
      const inCorridor = Number(m.in_corridor_pct) || 100
      const exits = Number(m.boundary_exits) || 0
      const timeSec = Number(m.completion_time_sec) || 20
      const score = Math.max(10, Math.min(100, Math.round(inCorridor - exits * 10)))
      const tier: 'excellent' | 'normal' | 'attention' = exits === 0 && inCorridor >= 90 ? 'excellent' : exits <= 2 && inCorridor >= 75 ? 'normal' : 'attention'

      if (lang === 'tj') {
        return {
          score,
          tier,
          badgeLabel: tier === 'excellent' ? 'Меъёр • Ҳамоҳангии аъло' : tier === 'normal' ? 'Меъёр' : 'Диққат талаб мекунад',
          verdictTitle: tier === 'excellent' ? 'Ҳамоҳангии баланди моторӣ ва суботи ҳаракат' : tier === 'normal' ? 'Идораи мӯътадили курсор дар дохили масир' : 'Инҳирофи моторӣ ва коҳиши дақиқият',
          explanation: `Курсор дар ${timeSec} сония бо ${exits} баромад аз ҳудуд ва ${inCorridor}% нигоҳдорӣ дар дохили роҳрав гузаронида шуд.`,
          referenceNorm: 'Стандарти ISO 9241-9 (Нигоҳдорӣ дар роҳрав ≥ 85%, 0–1 баромад)',
          benchmarkTag: 'Нишондиҳандаи ҳадаф: ≥ 85%',
        }
      }
      if (lang === 'en') {
        return {
          score,
          tier,
          badgeLabel: tier === 'excellent' ? 'Optimal • High Motor Precision' : tier === 'normal' ? 'Normal Range' : 'Attention Required',
          verdictTitle: tier === 'excellent' ? 'Excellent Motor Steering Stability' : tier === 'normal' ? 'Acceptable Trajectory Control' : 'Motor Deviation / Boundary Exits Detected',
          explanation: `Route completed in ${timeSec}s with ${exits} boundary exits and ${inCorridor}% inside corridor boundaries.`,
          referenceNorm: 'ISO 9241-9 Motor Steering Standard (Target ≥ 85%, 0–1 exits)',
          benchmarkTag: 'Benchmark: ≥ 85%',
        }
      }
      return {
        score,
        tier,
        badgeLabel: tier === 'excellent' ? 'Норма • Отличная координация' : tier === 'normal' ? 'В пределах нормы' : 'Требует внимания',
        verdictTitle: tier === 'excellent' ? 'Высокая моторная координация и кинематическая стабильность' : tier === 'normal' ? 'Уверенный моторный контроль траектории' : 'Снижение точности моторного слежения',
        explanation: `Коридор пройден за ${timeSec} с. Доля пути внутри границ — ${inCorridor}%, зафиксировано ${exits} выходов за границы. Показатели свидетельствуют о хорошей тонкой моторике.`,
        referenceNorm: 'Стандарт ISO 9241-9 / Закон руления Акко-Цхая (норма ≥ 85%, 0–1 выходов)',
        benchmarkTag: 'Целевой диапазон: ≥ 85%',
      }
    }

    case 'attention-concentration': {
      const time = Number(m.total_time_sec || m.completion_time_sec) || 35
      const errs = Number(m.errors_count) || 0
      const score = Math.max(10, Math.min(100, Math.round(110 - time * 1.2 - errs * 8)))
      const tier: 'excellent' | 'normal' | 'attention' = time <= 38 && errs === 0 ? 'excellent' : time <= 52 && errs <= 1 ? 'normal' : 'attention'

      if (lang === 'tj') {
        return {
          score,
          tier,
          badgeLabel: tier === 'excellent' ? 'Меъёр • Диққати баланд' : tier === 'normal' ? 'Меъёр' : 'Хастагии биноӣ',
          verdictTitle: tier === 'excellent' ? 'Суботи баланди диққат ва суръати фаврии ҷустуҷӯ' : tier === 'normal' ? 'Сатҳи муқаррарии тамаркузи диққат' : 'Коҳиши суръати коркарди иттилоот',
          explanation: `Ҷадвали Шульте 5×5 дар ${time} с бо ${errs} хато гузашта шуд. Нишондиҳандаи самаранокӣ дар ҳудуди меъёри синнусолӣ аст.`,
          referenceNorm: 'Меъёри клиникии Шульте: 30–45 с барои синни 18–50',
          benchmarkTag: 'Меъёри синнусолӣ: < 45 с',
        }
      }
      if (lang === 'en') {
        return {
          score,
          tier,
          badgeLabel: tier === 'excellent' ? 'Optimal • High Concentration' : tier === 'normal' ? 'Normal Attention' : 'Attentional Fatigue',
          verdictTitle: tier === 'excellent' ? 'High Visual Search Stability & Speed' : tier === 'normal' ? 'Normal Attentional Focus' : 'Attentional Search Slowdown',
          explanation: `Schulte 5×5 grid completed in ${time}s with ${errs} errors. Indicates steady cognitive efficiency.`,
          referenceNorm: 'Schulte Norm: 30–45s for adults aged 18–50',
          benchmarkTag: 'Target: < 45s',
        }
      }
      return {
        score,
        tier,
        badgeLabel: tier === 'excellent' ? 'Норма • Высокая концентрация' : tier === 'normal' ? 'В пределах нормы' : 'Признаки утомления',
        verdictTitle: tier === 'excellent' ? 'Высокая устойчивость и концентрация внимания' : tier === 'normal' ? 'Хорошая работоспособность и темп поиска' : 'Замедление темпа / сенсорное утомление',
        explanation: `Таблица 5×5 пройдена за ${time} с (ошибок: ${errs}). Время поиска чисел укладывается в популяционную норму без признаков истощения внимания.`,
        referenceNorm: 'Клиническая норма Шульте: 30–45 с для взрослых 18–50 лет',
        benchmarkTag: 'Популяционная норма: < 45 с',
      }
    }

    case 'attention-switching': {
      const bSec = Number(m.part_b_sec) || 45
      const cost = Number(m.switching_cost_sec) || 15
      const score = Math.max(10, Math.min(100, Math.round(105 - bSec * 0.9 - Math.max(0, cost - 10) * 1.5)))
      const tier: 'excellent' | 'normal' | 'attention' = bSec <= 50 && cost <= 20 ? 'excellent' : bSec <= 75 ? 'normal' : 'attention'

      return {
        score,
        tier,
        badgeLabel: tier === 'excellent' ? (lang === 'tj' ? 'Меъёр • Гузариши фаврӣ' : 'Норма • Высокая гибкость') : (lang === 'tj' ? 'Меъёр' : 'В пределах нормы'),
        verdictTitle: tier === 'excellent' ? (lang === 'tj' ? 'Чандирии баланди маърифатӣ' : 'Высокая когнитивная гибкость и переключаемость') : (lang === 'tj' ? 'Сатҳи муқаррарии ивазкунӣ' : 'Удовлетворительная скорость переключения внимания'),
        explanation: lang === 'tj' ? `Қисми B дар ${bSec} с иҷро шуд (арзиши ивазшавӣ B − A: ${cost} с).` : `Часть B выполнена за ${bSec} с, цена переключения между цифрами и буквами составила ${cost} с.`,
        referenceNorm: 'Trail Making Test (Part B < 65 с, Reitan Neuropsychology Lab)',
        benchmarkTag: 'Норма Part B: < 65 с',
      }
    }

    case 'reaction-speed': {
      const rt = Number(m.mean_rt_ms || m.reaction_time_ms) || 240
      const score = Math.max(10, Math.min(100, Math.round(120 - (rt - 180) * 0.45)))
      const tier: 'excellent' | 'normal' | 'attention' = rt <= 230 ? 'excellent' : rt <= 310 ? 'normal' : 'attention'

      return {
        score,
        tier,
        badgeLabel: tier === 'excellent' ? 'Отличная реакция (выше среднего)' : tier === 'normal' ? 'Нормальная скорость реакции' : 'Замедление реакции',
        verdictTitle: tier === 'excellent' ? 'Быстрая сенсомоторная проводимость' : tier === 'normal' ? 'Среднестатистическая скорость реакции' : 'Задержка сенсомоторного ответа',
        explanation: `Среднее время реакции составило ${rt} мс. Отличная согласованность зрительного анализатора и двигательного ответа.`,
        referenceNorm: 'Медиана нормы: 210–270 мс для простого зрительного стимула',
        benchmarkTag: 'Популяционная медиана: 250 мс',
      }
    }

    case 'color-perception': {
      const acc = Number(m.accuracy_pct) || 100
      const protan = Number(m.protan_errors) || 0
      const deutan = Number(m.deutan_errors) || 0
      const score = Math.max(10, Math.min(100, Math.round(acc)))
      const tier: 'excellent' | 'normal' | 'attention' = acc >= 90 ? 'excellent' : acc >= 70 ? 'normal' : 'attention'

      return {
        score,
        tier,
        badgeLabel: tier === 'excellent' ? 'Норма • Полная трихромазия' : 'Отклонение цветовосприятия',
        verdictTitle: tier === 'excellent' ? 'Нормальное восприятие спектра (Трихромазия)' : 'Признаки цветоаномалии (дейтеран/протан)',
        explanation: `Точность распознавания полихроматических таблиц: ${acc}%. Ошибок в красном спектре: ${protan}, в зелёном: ${deutan}.`,
        referenceNorm: 'Таблицы Рабкина 9-е изд. / Ишихара (норма ≥ 9 из 10)',
        benchmarkTag: 'Клиническая норма: ≥ 90%',
      }
    }

    case 'go-no-go': {
      const inh = Number(m.inhibition_pct) || 90
      const hits = Number(m.go_hits) || 10
      const score = Math.max(10, Math.min(100, Math.round(inh)))
      const tier: 'excellent' | 'normal' | 'attention' = inh >= 88 ? 'excellent' : inh >= 75 ? 'normal' : 'attention'

      return {
        score,
        tier,
        badgeLabel: tier === 'excellent' ? 'Норма • Высокий самоконтроль' : 'Умеренная импульсивность',
        verdictTitle: tier === 'excellent' ? 'Отличный тормозной контроль и баланс ЦНС' : 'Снижение тормозного контроля',
        explanation: `Точность удержания на запрещающих сигналах: ${inh}%, точных нажатий Go: ${hits}. Отличная регуляция двигательной импульсивности.`,
        referenceNorm: 'Нейрокогнитивный тест D-KEFS (норма удержания No-Go ≥ 85%)',
        benchmarkTag: 'Целевой порог: ≥ 85%',
      }
    }

    case 'mouse-eye-coordination': {
      const tot = Number(m.time_on_target_pct) || 85
      const score = Math.max(10, Math.min(100, Math.round(tot)))
      const tier: 'excellent' | 'normal' | 'attention' = tot >= 80 ? 'excellent' : tot >= 65 ? 'normal' : 'attention'

      return {
        score,
        tier,
        badgeLabel: tier === 'excellent' ? 'Норма • Точное слежение' : 'Удовлетворительное слежение',
        verdictTitle: tier === 'excellent' ? 'Высокая координация глаз-рука' : 'Умеренное отклонение от движущейся цели',
        explanation: `Курсор удерживался внутри цели ${tot}% времени слежения. Высокая непрерывность зрительно-моторного сопровождения.`,
        referenceNorm: 'Pursuit Rotor Standard (норма удержания цели ≥ 70%)',
        benchmarkTag: 'Нормативный порог: ≥ 70%',
      }
    }

    default: {
      const acc = Number(m.accuracy_pct || m.efficiency_pct || m.score || 85)
      const score = Math.max(10, Math.min(100, Math.round(acc)))
      const tier: 'excellent' | 'normal' | 'attention' = score >= 85 ? 'excellent' : score >= 70 ? 'normal' : 'attention'

      return {
        score,
        tier,
        badgeLabel: tier === 'excellent' ? 'Норма (Отлично)' : tier === 'normal' ? 'В пределах нормы' : 'Требует внимания',
        verdictTitle: tier === 'excellent' ? 'Показатели в диапазоне высокой нормы' : 'Показатели соответствуют средневозрастной норме',
        explanation: 'Результат упражнения зафиксирован для отслеживания динамики в профиле.',
        referenceNorm: 'Научный паспорт методики SIHAT v2.0',
        benchmarkTag: 'Норма: ≥ 75%',
      }
    }
  }
}

export function getMetricLabel(key: string, lang: Language = 'ru'): string {
  const spec = METRIC_DICTIONARY[key]
  if (spec) return spec.label[lang] || spec.label.ru
  const fallback: Record<string, string> = {
    score: lang === 'en' ? 'Score' : lang === 'tj' ? 'Хол' : 'Балл',
    percentage: lang === 'en' ? 'Accuracy' : lang === 'tj' ? 'Дақиқӣ' : 'Точность',
    correct_count: lang === 'en' ? 'Correct' : lang === 'tj' ? 'Дуруст' : 'Верных ответов',
    total_questions: lang === 'en' ? 'Total items' : lang === 'tj' ? 'Ҳамагӣ' : 'Всего заданий',
    mean_rt_ms: lang === 'en' ? 'Mean reaction' : lang === 'tj' ? 'Вокуниши миёна' : 'Средняя реакция',
    median_rt_ms: lang === 'en' ? 'Median reaction' : lang === 'tj' ? 'Медианаи вокуниш' : 'Медианная реакция',
    total_time_ms: lang === 'en' ? 'Total time' : lang === 'tj' ? 'Вақти умумӣ' : 'Общее время',
  }
  return fallback[key] || key.replace(/_/g, ' ')
}

export function formatMetricValue(key: string, value: unknown, lang: Language = 'ru'): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'boolean') {
    return value ? (lang === 'en' ? 'Yes' : 'Да') : lang === 'en' ? 'No' : 'Нет'
  }
  if (typeof value === 'object') {
    return '—'
  }
  const spec = METRIC_DICTIONARY[key]
  const unit = spec?.unit ? spec.unit[lang] || spec.unit.ru : ''
  if (typeof value === 'number') {
    const numStr = Number.isInteger(value) ? String(value) : value.toFixed(1)
    return unit ? `${numStr} ${unit}` : numStr
  }
  return unit ? `${String(value)} ${unit}` : String(value)
}

function getExplanation(slug: string, metrics: Record<string, any>, lang: Language): string {
  const m = metrics || {}
  if (lang === 'tj') {
    switch (slug) {
      case 'attention-concentration':
        return `Шумо ҷадвали 5×5 (аз 1 то 25)-ро дар ${m.total_time_sec ?? m.completion_time_sec ?? '—'} сония бо ${m.errors_count ?? 0} хато паймудед.`
      case 'cursor-path':
        return `Роҳрав дар ${m.completion_time_sec ?? '—'} с гузашта шуд. Ҳиссаи ҳаракат дар дохили роҳрав — ${m.in_corridor_pct ?? '—'}%, баромад аз ҳудуд — ${m.boundary_exits ?? 0}.`
      case 'mouse-eye-coordination':
        return `Курсор ${m.time_on_target_pct ?? '—'}% вақт дар дохили ҳадаф нигоҳ дошта шуд.`
      default:
        return 'Нишондиҳандаҳои машқ барои худмушоҳида ва муқоиса сабт шуданд.'
    }
  }

  if (lang === 'en') {
    switch (slug) {
      case 'cursor-path':
        return `Corridor traversed in ${m.completion_time_sec ?? '—'}s. Time inside boundaries: ${m.in_corridor_pct ?? '—'}%, boundary exits: ${m.boundary_exits ?? 0}.`
      case 'mouse-eye-coordination':
        return `Cursor remained on target ${m.time_on_target_pct ?? '—'}% of tracking duration with ${m.mean_deviation_pct ?? '—'}% average deviation.`
      case 'attention-concentration':
        return `Schulte 5×5 grid completed in ${m.total_time_sec ?? m.completion_time_sec ?? '—'} seconds with ${m.errors_count ?? 0} penalty clicks.`
      default:
        return 'Performance metrics recorded for educational self-observation.'
    }
  }

  switch (slug) {
    case 'cursor-path':
      return `Коридор пройден за ${m.completion_time_sec ?? '—'} с. Доля пути внутри границ коридора — ${m.in_corridor_pct ?? '—'}%, выходов за границу — ${m.boundary_exits ?? 0}.`
    case 'mouse-eye-coordination':
      return `Курсор удерживался внутри движущейся цели ${m.time_on_target_pct ?? '—'}% времени при среднем отклонении ${m.mean_deviation_pct ?? '—'}%.`
    case 'attention-concentration':
      return `Таблица Шульте 5×5 пройдена за ${m.total_time_sec ?? m.completion_time_sec ?? '—'} с при ${m.errors_count ?? 0} штрафных кликах.`
    case 'reaction-speed':
      return `Среднее время реакции составило ${m.mean_rt_ms ?? m.reaction_time_ms ?? '—'} мс (разброс SD: ${m.variability_ms ?? '—'} мс).`
    case 'color-perception':
      return `Распознано ${m.correct_count ?? 0} из ${m.total_plates ?? 10} полихроматических таблиц (точность: ${m.accuracy_pct ?? '—'}%).`
    default:
      return 'Показатели упражнения зафиксированы для самонаблюдения и сравнения с вашими предыдущими попытками.'
  }
}

export const ResultReportView: React.FC<ResultReportViewProps> = ({
  lang,
  testSlug: propTestSlug,
  slug,
  testTitle: propTestTitle,
  title,
  methodologyName: propMethodologyName,
  methodology,
  completedAt,
  resultData: propResultData,
  result,
  limitations: propLimitations,
  previousResults = [],
  isSaved = false,
  isSaving = false,
  isDownloadingPdf = false,
  canSave = true,
  isAuthenticated = false,
  onSave,
  onDiscard,
  onRetake,
  onDownloadPdf,
  onOpenAuth,
}) => {
  const testSlug = propTestSlug || slug || ''
  const testTitle = propTestTitle || title || testSlug
  const resultData = propResultData || result || {}
  const methodologyName =
    propMethodologyName ||
    (methodology?.name
      ? `${methodology.name}${methodology.version ? ' v' + methodology.version : ''}`
      : undefined)

  // Robust recursive unwrapping
  const rawMetrics: Record<string, any> = unwrapMetrics(resultData)
  const series: Record<string, any> = unwrapSeries(resultData)
  const engineKind: string =
    (typeof resultData?.engine === 'string' ? resultData.engine : '') || testSlug

  // Compute clinical assessment
  const assessment = computeAssessment(testSlug, rawMetrics, lang)

  // Localized honest medical disclaimer (never fall back to raw English text in Russian/Tajik UI)
  const localizedDisclaimer = React.useMemo(() => {
    if (propLimitations && typeof propLimitations === 'string' && !propLimitations.startsWith('Educational self-observation')) {
      return propLimitations
    }
    if (lang === 'tj') {
      return 'Ин машқ танҳо барои худмушоҳида ва муқоисаи динамикаи шахсӣ дар шароити якхела таҳия шудааст. Натиҷаҳои веб-санҷиш ташхиси тиббӣ намебошанд ва машварати табиби мутахассисро иваз намекунанд.'
    }
    if (lang === 'en') {
      return 'This exercise is an educational self-observation tool. Scores depend on device, lighting, and fatigue and do not constitute a formal clinical diagnosis.'
    }
    return 'Данное упражнение разработано для образовательного самонаблюдения и отслеживания личной динамики в одинаковых условиях. Цифровая веб-оценка не является медицинским диагнозом и не заменяет очный приём врача-специалиста.'
  }, [propLimitations, lang])

  const ui = {
    ru: {
      reportBadge: 'Образовательный отчёт самонаблюдения',
      assessmentTitle: 'Клиническая оценка и вердикт',
      explanationTitle: 'Разбор результата',
      keyMetricsTitle: 'Ключевые показатели упражнения',
      chartTitle: 'Индивидуальный график и визуализация выполнения',
      errorsTitle: 'Статистика ошибок и точности',
      zeroErrors: 'Упражнение выполнено безупречно, без штрафных ошибок.',
      comparisonTitle: 'Сравнение с предыдущими попытками в динамике',
      noPrevAttempts: 'Это ваша первая сохранённая запись по данной методике. Пройдите упражнение повторно позже, чтобы увидеть динамику.',
      disclaimerTitle: 'Методологическое примечание и границы применения',
      disclaimerBody: localizedDisclaimer,
      saveBtn: 'Сохранить в профиль',
      savingBtn: 'Сохранение...',
      savedBadge: 'Сохранено в профиле',
      discardBtn: 'Не сохранять',
      retakeBtn: 'Пройти повторно (новое задание)',
      pdfBtn: 'Скачать PDF-отчёт',
      loginToSave: 'Войдите в аккаунт, чтобы сохранять результаты и отслеживать динамику',
      loginBtn: 'Войти / Регистрация',
      benchmarkLabel: 'Референсный диапазон:',
    },
    tj: {
      reportBadge: 'Ҳисоботи таълимии худмушоҳида',
      assessmentTitle: 'Баҳодиҳии клиникӣ ва натиҷа',
      explanationTitle: 'Шарҳи натиҷа',
      keyMetricsTitle: 'Нишондиҳандаҳои асосии машқ',
      chartTitle: 'График ва тасвири инфиродии иҷро',
      errorsTitle: 'Омори хатоҳо ва дақиқият',
      zeroErrors: 'Машқ бе ягон хатои ҷаримавӣ бенуқсон иҷро шуд.',
      comparisonTitle: 'Муқоиса бо кӯшишҳои қаблӣ дар динамика',
      noPrevAttempts: 'Ин аввалин сабти шумо аз рӯи ин метод аст. Барои дидани динамика машқро такроран гузаред.',
      disclaimerTitle: 'Эзоҳи методологӣ ва ҳудуди истифода',
      disclaimerBody: localizedDisclaimer,
      saveBtn: 'Сабт дар профил',
      savingBtn: 'Дар ҳоли сабт...',
      savedBadge: 'Дар профил сабт шуд',
      discardBtn: 'Сабт накардан',
      retakeBtn: 'Аз нав гузаштан (супориши нав)',
      pdfBtn: 'Боргирии PDF',
      loginToSave: 'Барои сабти натиҷаҳо ба ҳисоби худ ворид шавед',
      loginBtn: 'Воридшавӣ',
      benchmarkLabel: 'Ҳудуди меъёрӣ:',
    },
    en: {
      reportBadge: 'Educational Self-Observation Report',
      assessmentTitle: 'Performance Verdict & Clinical Grade',
      explanationTitle: 'Result Breakdown',
      keyMetricsTitle: 'Key Exercise Metrics',
      chartTitle: 'Performance Visualization & Execution Chart',
      errorsTitle: 'Error & Precision Breakdown',
      zeroErrors: 'Completed flawlessly with zero penalty errors.',
      comparisonTitle: 'Progress & Comparison with Previous Attempts',
      noPrevAttempts: 'This is your first saved record for this exercise. Complete it again later to track your personal trend.',
      disclaimerTitle: 'Methodological Note & Application Scope',
      disclaimerBody: localizedDisclaimer,
      saveBtn: 'Save to Profile',
      savingBtn: 'Saving...',
      savedBadge: 'Saved in Profile',
      discardBtn: 'Do Not Save',
      retakeBtn: 'Retake (Fresh Task Variant)',
      pdfBtn: 'Download PDF Report',
      loginToSave: 'Sign in to save your results and compare progress over time',
      loginBtn: 'Sign In / Register',
      benchmarkLabel: 'Reference Range:',
    },
  }[lang]

  const formattedDate = React.useMemo(() => {
    const dt = completedAt ? new Date(completedAt) : new Date()
    if (Number.isNaN(dt.getTime())) return completedAt || ''
    return dt.toLocaleString(lang === 'en' ? 'en-US' : 'ru-RU', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }, [completedAt, lang])

  // Extract main cards and error cards
  const { mainCards, errorCards } = React.useMemo(() => {
    const main: Array<{ key: string; label: string; value: string; unit: string }> = []
    const errs: Array<{ key: string; label: string; value: string; unit: string }> = []

    for (const [k, v] of Object.entries(rawMetrics)) {
      if (
        v === null ||
        v === undefined ||
        typeof v === 'object' ||
        k === 'version' ||
        k === 'engine' ||
        k === 'status_category' ||
        k === 'efficiency_category' ||
        k === 'category' ||
        k === 'grid_size'
      ) {
        continue
      }
      const spec = METRIC_DICTIONARY[k]
      if (!spec) continue
      const label = spec.label[lang] || spec.label.ru
      const unit = spec.unit ? spec.unit[lang] || spec.unit.ru : ''
      const valStr = typeof v === 'number' && !Number.isInteger(v) ? v.toFixed(1) : String(v)
      const item = { key: k, label, value: valStr, unit }
      if (spec.isErrorMetric) {
        errs.push(item)
      } else {
        main.push(item)
      }
    }
    return { mainCards: main, errorCards: errs }
  }, [rawMetrics, lang])

  const explanationText = getExplanation(testSlug, rawMetrics, lang)

  // Assessment styling theme
  const assessmentTheme = React.useMemo(() => {
    if (assessment.tier === 'excellent') {
      return {
        bg: 'bg-emerald-500/[0.08] dark:bg-emerald-500/10 border-emerald-500/30 dark:border-emerald-500/30',
        stroke: 'text-emerald-500',
        badge: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40',
        scoreColor: 'text-emerald-600 dark:text-emerald-400',
      }
    }
    if (assessment.tier === 'normal') {
      return {
        bg: 'bg-cyan-500/[0.08] dark:bg-cyan-500/10 border-cyan-500/30 dark:border-cyan-500/30',
        stroke: 'text-cyan-500',
        badge: 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/40',
        scoreColor: 'text-cyan-600 dark:text-cyan-400',
      }
    }
    return {
      bg: 'bg-amber-500/[0.08] dark:bg-amber-500/10 border-amber-500/30 dark:border-amber-500/30',
      stroke: 'text-amber-500',
      badge: 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40',
      scoreColor: 'text-amber-600 dark:text-amber-400',
    }
  }, [assessment.tier])

  // Tailored SVG visualization
  const renderChart = () => {
    // 1. Schulte step times
    if (
      (engineKind === 'schulte' || testSlug === 'attention-concentration') &&
      Array.isArray(series.step_times_ms) &&
      series.step_times_ms.length > 0
    ) {
      const steps: number[] = series.step_times_ms
      const maxVal = Math.max(1000, ...steps)
      return (
        <div className="space-y-3">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>
              {lang === 'en'
                ? 'Search time per number (1 → 25) in ms'
                : lang === 'tj'
                ? 'Вақти ҷустуҷӯи ҳар як адад (1 → 25), мс'
                : 'Время поиска каждого числа (1 → 25), мс'}
            </span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
              max: {Math.round(maxVal)} ms
            </span>
          </div>
          <svg viewBox="0 0 500 130" className="w-full h-36 overflow-visible">
            {steps.map((ms, idx) => {
              const barH = Math.max(6, Math.round((ms / maxVal) * 95))
              const x = 8 + idx * 19.4
              const y = 105 - barH
              const isSecondHalf = idx >= 12
              return (
                <g key={idx}>
                  <rect
                    x={x}
                    y={y}
                    width={14}
                    height={barH}
                    rx={4}
                    fill={isSecondHalf ? '#06b6d4' : '#10b981'}
                    opacity={0.9}
                  />
                  <text
                    x={x + 7}
                    y={120}
                    textAnchor="middle"
                    className="fill-slate-400 text-[8px] font-mono"
                  >
                    {idx + 1}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
      )
    }

    // 2. Cursor Path / Pursuit 2D track replay
    if (
      (testSlug === 'cursor-path' || engineKind === 'cursor_path' || testSlug === 'mouse-eye-coordination' || engineKind === 'pursuit') &&
      Array.isArray(series.track) &&
      series.track.length > 1
    ) {
      const track: Array<{ x: number; y: number }> = series.track
      const pts = track.map((pt) => `${(pt.x * 400).toFixed(1)},${(pt.y * 220).toFixed(1)}`).join(' ')
      const firstPt = track[0]
      const lastPt = track[track.length - 1]

      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>
              {lang === 'en'
                ? 'Recorded 2D motion trajectory replay:'
                : lang === 'tj'
                ? 'Харитаи ҳаракати 2D сабтшуда:'
                : 'Записанная 2D траектория движения курсора:'}
            </span>
            <span className="font-mono text-emerald-500 font-bold">
              {track.length} {lang === 'en' ? 'samples' : 'точек'} • {rawMetrics.in_corridor_pct ?? rawMetrics.time_on_target_pct ?? 100}%
            </span>
          </div>

          <div className="relative w-full rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-inner p-2">
            <svg viewBox="0 0 400 220" className="w-full h-48 sm:h-56">
              {/* Reference Grid */}
              <line x1="20" y1="110" x2="380" y2="110" stroke="#334155" strokeWidth="1" strokeDasharray="4 4" opacity="0.4" />
              <line x1="200" y1="15" x2="200" y2="205" stroke="#334155" strokeWidth="1" strokeDasharray="4 4" opacity="0.4" />

              {/* Start Circle */}
              {firstPt && (
                <g>
                  <circle cx={firstPt.x * 400} cy={firstPt.y * 220} r="14" fill="#10b981" opacity="0.25" />
                  <circle cx={firstPt.x * 400} cy={firstPt.y * 400 > 220 ? 110 : firstPt.y * 220} r="7" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
                  <text x={firstPt.x * 400 + 16} y={firstPt.y * 220 + 4} fill="#10b981" className="text-[9px] font-mono font-bold">
                    СТАРТ
                  </text>
                </g>
              )}

              {/* User Trajectory Polyline */}
              <polyline
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={pts}
              />

              {/* Finish Target */}
              {lastPt && (
                <g>
                  <circle cx={lastPt.x * 400} cy={lastPt.y * 220} r="14" fill="#06b6d4" opacity="0.25" />
                  <circle cx={lastPt.x * 400} cy={lastPt.y * 220} r="7" fill="#06b6d4" stroke="#ffffff" strokeWidth="2" />
                  <text x={lastPt.x * 400 - 18} y={lastPt.y * 220 - 12} textAnchor="end" fill="#06b6d4" className="text-[9px] font-mono font-bold">
                    ФИНИШ
                  </text>
                </g>
              )}
            </svg>
          </div>
        </div>
      )
    }

    // 3. Color Perception (Ishihara / Rabkin): Photoreceptors & Plate Grid
    if (testSlug === 'color-perception' || engineKind === 'color_perception') {
      const lCone = rawMetrics.l_cone_pct != null ? Number(rawMetrics.l_cone_pct) : 100
      const mCone = rawMetrics.m_cone_pct != null ? Number(rawMetrics.m_cone_pct) : 100
      const sCone = rawMetrics.s_cone_pct != null ? Number(rawMetrics.s_cone_pct) : 100
      const plates: Array<{ id: string; correct?: boolean }> = series.plate_breakdown || []

      return (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20">
              <div className="flex items-center justify-between text-xs font-bold text-rose-500 mb-2">
                <span>L-колбочки (Красный)</span>
                <span className="font-mono">{lCone}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                <div className="bg-rose-500 h-full rounded-full" style={{ width: `${lCone}%` }} />
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-500 mb-2">
                <span>M-колбочки (Зелёный)</span>
                <span className="font-mono">{mCone}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${mCone}%` }} />
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/20">
              <div className="flex items-center justify-between text-xs font-bold text-sky-500 mb-2">
                <span>S-колбочки (Синий)</span>
                <span className="font-mono">{sCone}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                <div className="bg-sky-500 h-full rounded-full" style={{ width: `${sCone}%` }} />
              </div>
            </div>
          </div>

          {plates.length > 0 && (
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
              {plates.map((p, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded-xl border text-center ${
                    p.correct
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-500'
                  }`}
                >
                  <span className="text-[10px] font-mono block opacity-60">№{idx + 1}</span>
                  <span className="text-xs font-bold">{p.correct ? '✓' : '✗'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )
    }

    // 4. Reaction Times / Go-No-Go Bar Chart
    if (Array.isArray(series.rt_ms) && series.rt_ms.length > 0) {
      const rts: number[] = series.rt_ms
      const maxRt = Math.max(450, ...rts)
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Распределение времени реакции по пробам (мс)</span>
            <span className="text-emerald-500 font-mono font-bold">Норма: &lt; 270 мс</span>
          </div>
          <svg viewBox="0 0 460 130" className="w-full h-36">
            <line x1="16" y1={98 - Math.round((250 / maxRt) * 85)} x2="444" y2={98 - Math.round((250 / maxRt) * 85)} stroke="#10b981" strokeDasharray="3 3" opacity="0.6" />
            {rts.map((rt, idx) => {
              const stepW = Math.min(36, Math.floor(400 / Math.max(1, rts.length)))
              const gap = Math.max(4, Math.floor((430 - stepW * rts.length) / Math.max(1, rts.length)))
              const x = 16 + idx * (stepW + gap)
              const h = Math.max(8, Math.round((rt / maxRt) * 85))
              const y = 98 - h
              return (
                <g key={idx}>
                  <rect x={x} y={y} width={stepW} height={h} rx={5} fill={rt <= 270 ? '#10b981' : '#06b6d4'} />
                  <text x={x + stepW / 2} y={115} textAnchor="middle" className="fill-slate-400 text-[8px] font-mono">
                    #{idx + 1}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
      )
    }

    // 5. Fallback Visual Metric Comparison Scale
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {(mainCards.length > 0 ? mainCards : [{ key: 'score', label: 'Результативность', value: String(assessment.score), unit: '%' }]).slice(0, 4).map((m) => {
          const numVal = Number(m.value)
          const pct = Number.isFinite(numVal) ? (m.unit === '%' ? Math.max(5, Math.min(100, numVal)) : 80) : 75
          return (
            <div key={m.key} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
              <div className="flex justify-between text-xs mb-2">
                <span className="text-slate-600 dark:text-slate-300 font-semibold">{m.label}</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {m.value} {m.unit}
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <Card
      data-testid="result-report-view"
      className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-8"
    >
      {/* 1. Header: Title, Methodology, Date */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-start gap-4">
          <div className="w-13 h-13 rounded-2xl bg-[#17A884]/15 text-[#17A884] flex items-center justify-center shrink-0 border border-[#17A884]/30">
            <Award className="w-7 h-7" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <Badge variant="emerald" className="text-[11px]">
                {ui.reportBadge}
              </Badge>
              {methodologyName && (
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  • {methodologyName}
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
              {testTitle}
            </h2>
            {formattedDate && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
                <Calendar className="w-3.5 h-3.5 text-[#17A884]" />
                <span>{formattedDate}</span>
              </div>
            )}
          </div>
        </div>

        {isSaved && (
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/25 shrink-0">
            <CheckCircle2 className="w-4 h-4" />
            <span>{ui.savedBadge}</span>
          </div>
        )}
      </div>

      {/* 2. HERO CLINICAL ASSESSMENT & VERDICT GAUGE */}
      <div className={`p-6 rounded-3xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-6 ${assessmentTheme.bg}`}>
        <div className="flex items-center gap-5">
          {/* Circular Score Gauge */}
          <div className="relative w-22 h-22 sm:w-24 sm:h-24 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-200 dark:text-slate-800"
                strokeWidth="3.2"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={assessmentTheme.stroke}
                strokeDasharray={`${assessment.score}, 100`}
                strokeWidth="3.2"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className={`text-2xl sm:text-3xl font-black font-mono leading-none ${assessmentTheme.scoreColor}`}>
                {assessment.score}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">из 100</span>
            </div>
          </div>

          {/* Verdict Text */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider ${assessmentTheme.badge}`}>
                <CheckCircle className="w-3.5 h-3.5" />
                {assessment.badgeLabel}
              </span>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                {assessment.benchmarkTag}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
              {assessment.verdictTitle}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
              {assessment.explanation}
            </p>
          </div>
        </div>

        {/* Reference Standard Pill */}
        <div className="hidden lg:flex flex-col items-end text-right shrink-0 pl-4 border-l border-slate-200 dark:border-slate-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Референсный стандарт</span>
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 mt-1 max-w-[200px]">
            {assessment.referenceNorm}
          </span>
        </div>
      </div>

      {/* 3. Human-Readable Explanation */}
      <div className="p-5 rounded-2xl bg-emerald-500/[0.05] dark:bg-emerald-500/[0.08] border border-emerald-500/20">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#17A884] mb-1.5">
          <Activity className="w-4 h-4" />
          <span>{ui.explanationTitle}</span>
        </div>
        <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
          {explanationText}
        </p>
      </div>

      {/* 4. Key Metric Cards */}
      {mainCards.length > 0 && (
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#17A884]" />
            <span>{ui.keyMetricsTitle}</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {mainCards.map((card) => (
              <div
                key={card.key}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between"
              >
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  {card.label}
                </span>
                <div className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white">
                  {card.value}{' '}
                  {card.unit && (
                    <span className="text-xs font-normal text-slate-400">{card.unit}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Individual Performance Visualization / Chart */}
      <div className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">
          <BarChart3 className="w-4 h-4 text-[#17A884]" />
          <span>{ui.chartTitle}</span>
        </div>
        {renderChart()}
      </div>

      {/* 6. Errors Breakdown */}
      <div className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
          <ShieldCheck className="w-4 h-4 text-[#17A884]" />
          <span>{ui.errorsTitle}</span>
        </div>
        {errorCards.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {errorCards.map((err) => (
              <div
                key={err.key}
                className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between"
              >
                <span className="text-xs text-slate-600 dark:text-slate-300">{err.label}</span>
                <span
                  className={`text-base font-mono font-extrabold ${
                    Number(err.value) > 0 ? 'text-amber-500' : 'text-emerald-500'
                  }`}
                >
                  {err.value}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
            {ui.zeroErrors}
          </p>
        )}
      </div>

      {/* 7. Comparison with Previous Attempts in Dynamic Detail */}
      <div className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
          <TrendingUp className="w-4 h-4 text-[#17A884]" />
          <span>{ui.comparisonTitle}</span>
        </div>
        {previousResults.length > 0 ? (
          <div className="space-y-2.5">
            {previousResults.slice(0, 4).map((prev) => {
              const prevM = unwrapMetrics(prev.result)
              const primaryKey = mainCards[0]?.key || 'in_corridor_pct'
              const prevVal = prevM[primaryKey] ?? prevM.accuracy_pct ?? prevM.score
              const currVal = rawMetrics[primaryKey] ?? rawMetrics.accuracy_pct ?? rawMetrics.score
              const delta = typeof prevVal === 'number' && typeof currVal === 'number' ? currVal - prevVal : null

              const dtStr = new Date(prev.completed_at).toLocaleDateString(
                lang === 'en' ? 'en-US' : 'ru-RU',
                { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }
              )

              return (
                <div
                  key={prev.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 font-mono">{dtStr}</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {prev.test_title || testTitle}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    {prevVal !== undefined && (
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                        {getMetricLabel(primaryKey, lang)}: {prevVal} {mainCards[0]?.unit || ''}
                      </span>
                    )}

                    {delta !== null && delta !== 0 && (
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-mono font-bold ${
                          delta > 0
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {delta > 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                        {delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-500 dark:text-slate-400">{ui.noPrevAttempts}</p>
        )}
      </div>

      {/* 8. Honest Methodological Note */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 dark:text-amber-200/90 leading-relaxed">
          <strong className="block mb-0.5">{ui.disclaimerTitle}</strong>
          <span>{ui.disclaimerBody}</span>
        </div>
      </div>

      {/* 9. Action Bar */}
      <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {canSave && !isSaved && (
            isAuthenticated ? (
              onSave && (
                <Button
                  onClick={onSave}
                  disabled={isSaving}
                  className="bg-[#17A884] hover:bg-[#103D35] text-white gap-2 rounded-xl px-5 py-2.5 text-xs font-bold cursor-pointer shadow-md"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? ui.savingBtn : ui.saveBtn}</span>
                </Button>
              )
            ) : (
              onOpenAuth && (
                <Button
                  onClick={onOpenAuth}
                  className="bg-[#17A884] hover:bg-[#103D35] text-white gap-2 rounded-xl px-5 py-2.5 text-xs font-bold cursor-pointer shadow-md"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{ui.loginBtn}</span>
                </Button>
              )
            )
          )}

          {onDownloadPdf && (
            <Button
              variant="outline"
              onClick={onDownloadPdf}
              disabled={isDownloadingPdf}
              className="gap-2 rounded-xl px-4 py-2.5 text-xs font-bold border-slate-200 dark:border-slate-700 cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#17A884]" />
              <span>{ui.pdfBtn}</span>
            </Button>
          )}

          {canSave && !isSaved && onDiscard && (
            <Button
              variant="ghost"
              onClick={onDiscard}
              className="gap-2 rounded-xl px-4 py-2.5 text-xs text-slate-500 hover:text-rose-500 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>{ui.discardBtn}</span>
            </Button>
          )}
        </div>

        {onRetake && (
          <Button
            variant="outline"
            onClick={onRetake}
            className="gap-2 rounded-xl px-4 py-2.5 text-xs font-bold border-slate-200 dark:border-slate-700 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-[#17A884]" />
            <span>{ui.retakeBtn}</span>
          </Button>
        )}
      </div>
    </Card>
  )
}
