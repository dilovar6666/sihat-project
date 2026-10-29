import React from 'react'
import {
  Award,
  Calendar,
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
}

function getExplanation(slug: string, metrics: Record<string, any>, lang: Language): string {
  const m = metrics || {}
  if (lang === 'tj') {
    switch (slug) {
      case 'attention-concentration':
        return `Шумо ҷадвали 5×5 (аз 1 то 25)-ро дар ${m.total_time_sec ?? m.completion_time_sec ?? '—'} сония бо ${m.errors_count ?? 0} хато паймудед. Муқоисаи нисфи аввал (${m.first_half_sec ?? '—'} с) ва нисфи дуюм (${m.second_half_sec ?? '—'} с) устувории суръати ҷустуҷӯи биноиро нишон медиҳад.`
      case 'attention-switching':
        return `Қисми A дар ${m.part_a_sec ?? '—'} с ва Қисми B (ивазкунии рақаму ҳарфҳо) дар ${m.part_b_sec ?? '—'} с иҷро шуд. Фарқияти B − A (${m.switching_cost_sec ?? '—'} с) нишондиҳандаи чандирии гузариш байни ду қоида мебошад.`
      case 'visual-memory':
        return `Дарозии ниҳоии занҷири дуруст такроршуда (Span): ${m.max_span ?? m.max_spatial_span ?? 0} блок аз ${m.trials_attempted ?? '—'} кӯшиш.`
      case 'short-term-memory':
        return `Ҳаҷми қатори мустақим: ${m.forward_span ?? 0} рақам, қатори бозгаштӣ: ${m.backward_span ?? 0} рақам. Қатори бозгаштӣ нигоҳдорӣ ва табдили фаъоли иттилоотро дар хотираи корӣ инъикос мекунад.`
      case 'information-processing-speed':
        return `Дар муддати машқ ${m.correct_count ?? 0} рамз дуруст мувофиқ карда шуд (суръат: ${m.speed_per_minute ?? '—'} дар як дақиқа, дақиқият: ${m.accuracy_pct ?? '—'}%).`
      case 'contrast-sensitivity':
        return `Сатҳи ҳадди ақали контрасти боэътимод фарқшаванда: ${m.threshold_contrast_pct != null ? `${m.threshold_contrast_pct}%` : 'муайян нашуд'}. Натиҷа ба равшании экран ва рӯшноии хона вобаста аст.`
      case 'visual-pairs':
        return `Ҳамаи 6 ҷуфт дар ${m.moves_count ?? m.total_moves ?? '—'} гашт ва ${m.time_sec ?? '—'} сония ёфт шуданд (самаранокӣ: ${m.efficiency_pct ?? '—'}%).`
      case 'path-memory':
        return `Аз ${m.steps_total ?? '—'} қадами масир ${m.steps_correct ?? 0} қадам дуруст такрор шуд (${m.routes_correct ?? 0} аз ${m.routes_total ?? 3} масир пурра бехато).`
      case 'pattern-matrix':
        return `Аз ${m.total_items ?? 6} супориши мантиқӣ ${m.correct_count ?? 0} ҷавоби дуруст дода шуд. Вақти миёнаи фикрронӣ барои ҳар супориш: ${m.mean_item_sec ?? '—'} с.`
      case 'sound-discrimination':
        return `Дар муқоисаи баландии овозҳо ${m.correct_count ?? 0} аз ${m.total_trials ?? 14} ҷуфт дуруст муайян шуд (${m.accuracy_pct ?? '—'}%).`
      case 'speech-in-noise':
        return `Дар заминаи садои бегона ${m.digits_correct ?? 0} аз ${m.digits_total ?? 30} рақам ва ${m.triplets_exact ?? 0} сегонаи пурра дуруст шинохта шуд.`
      case 'reaction-speed':
        return `Вақти миёнаи аксуламал: ${m.mean_rt_ms ?? m.reaction_time_ms ?? '—'} мс (медиана: ${m.median_rt_ms ?? '—'} мс, парокандагӣ SD: ${m.variability_ms ?? '—'} мс).`
      case 'go-no-go':
        return `Дақиқияти боздорӣ дар сигналҳои No-Go: ${m.inhibition_pct ?? '—'}%, пахшҳои дурусти Go: ${m.go_hits ?? 0}, вақти миёнаи аксуламал: ${m.mean_rt_ms ?? '—'} мс.`
      case 'mouse-eye-coordination':
        return `Нигоҳдории курсор дар дохили ҳадафи ҳаракаткунанда: ${m.time_on_target_pct ?? '—'}% вақт, инҳирофи миёна: ${m.mean_deviation_pct ?? '—'}%.`
      case 'cursor-path':
        return `Масир дар ${m.completion_time_sec ?? '—'} с тай шуд. Нигоҳдорӣ дар дохили роҳрав: ${m.in_corridor_pct ?? '—'}%, берунравиҳо: ${m.boundary_exits ?? 0}.`
      default:
        return 'Натиҷаи машқи интерактивӣ барои худмушоҳида ва муқоиса бо кӯшишҳои қаблии шумо сабт гардид.'
    }
  }

  if (lang === 'en') {
    switch (slug) {
      case 'attention-concentration':
        return `You completed the 5×5 Schulte grid (1 to 25) in ${m.total_time_sec ?? m.completion_time_sec ?? '—'} s with ${m.errors_count ?? 0} errors. Comparing the first half (${m.first_half_sec ?? '—'} s) and second half (${m.second_half_sec ?? '—'} s) reflects visual search pace stability.`
      case 'attention-switching':
        return `Part A took ${m.part_a_sec ?? '—'} s and Part B (number-letter alternation) took ${m.part_b_sec ?? '—'} s. The difference B − A (${m.switching_cost_sec ?? '—'} s) represents your task-set switching cost.`
      case 'visual-memory':
        return `Your maximum reproduced spatial sequence length (Span) was ${m.max_span ?? m.max_spatial_span ?? 0} blocks across ${m.trials_attempted ?? '—'} trials.`
      case 'short-term-memory':
        return `Forward span: ${m.forward_span ?? 0} digits; Backward span: ${m.backward_span ?? 0} digits. Backward recall engages active manipulation in working memory.`
      case 'information-processing-speed':
        return `You matched ${m.correct_count ?? 0} symbols correctly (pace: ${m.speed_per_minute ?? '—'} per min, accuracy: ${m.accuracy_pct ?? '—'}%).`
      case 'contrast-sensitivity':
        return `Lowest contrast level reliably resolved on both trials: ${m.threshold_contrast_pct != null ? `${m.threshold_contrast_pct}%` : 'not reached'}. Results depend on display brightness and ambient lighting.`
      case 'visual-pairs':
        return `All 6 pairs were matched in ${m.moves_count ?? m.total_moves ?? '—'} moves over ${m.time_sec ?? '—'} s (efficiency: ${m.efficiency_pct ?? '—'}%).`
      case 'path-memory':
        return `You reproduced ${m.steps_correct ?? 0} of ${m.steps_total ?? '—'} route steps (${m.routes_correct ?? 0} of ${m.routes_total ?? 3} routes completely error-free).`
      case 'pattern-matrix':
        return `You solved ${m.correct_count ?? 0} of ${m.total_items ?? 6} geometric sequences with a mean thinking time of ${m.mean_item_sec ?? '—'} s per item.`
      case 'sound-discrimination':
        return `You correctly judged ${m.correct_count ?? 0} of ${m.total_trials ?? 14} tone pairs (${m.accuracy_pct ?? '—'}% accuracy).`
      case 'speech-in-noise':
        return `Against background masking noise, you identified ${m.digits_correct ?? 0} of ${m.digits_total ?? 30} digits and ${m.triplets_exact ?? 0} complete triplets.`
      case 'reaction-speed':
        return `Mean reaction time: ${m.mean_rt_ms ?? m.reaction_time_ms ?? '—'} ms (median: ${m.median_rt_ms ?? '—'} ms, variability SD: ${m.variability_ms ?? '—'} ms).`
      case 'go-no-go':
        return `No-Go inhibition accuracy: ${m.inhibition_pct ?? '—'}%, Go hits: ${m.go_hits ?? 0}, mean Go reaction time: ${m.mean_rt_ms ?? '—'} ms.`
      case 'mouse-eye-coordination':
        return `Cursor stayed inside the moving target for ${m.time_on_target_pct ?? '—'}% of the 20s run, with a mean deviation of ${m.mean_deviation_pct ?? '—'}%.`
      case 'cursor-path':
        return `Corridor traversed in ${m.completion_time_sec ?? '—'} s, staying within boundaries for ${m.in_corridor_pct ?? '—'}% of the path (${m.boundary_exits ?? 0} exits).`
      default:
        return 'Your interactive self-observation metrics have been recorded for personal tracking over time.'
    }
  }

  // Default: Russian
  switch (slug) {
    case 'attention-concentration':
      return `Таблица Шульте 5×5 (числа от 1 до 25) пройдена за ${m.total_time_sec ?? m.completion_time_sec ?? '—'} с при ${m.errors_count ?? 0} ошибках. Сравнение первой половины (${m.first_half_sec ?? '—'} с) и второй половины (${m.second_half_sec ?? '—'} с) показывает устойчивость темпа зрительного поиска.`
    case 'attention-switching':
      return `Часть A (числа 1→8) заняла ${m.part_a_sec ?? '—'} с, а Часть B (чередование 1→A→2→B...) — ${m.part_b_sec ?? '—'} с. Разница B − A (${m.switching_cost_sec ?? '—'} с) отражает затраты времени на переключение между двумя правилами.`
    case 'visual-memory':
      return `Максимальная длина безошибочно воспроизведённой пространственной цепочки (Span): ${m.max_span ?? m.max_spatial_span ?? 0} блоков из ${m.trials_attempted ?? '—'} выполненных проб.`
    case 'short-term-memory':
      return `Объём прямого цифрового ряда составил ${m.forward_span ?? 0} цифр, обратного ряда — ${m.backward_span ?? 0} цифр. Обратный ряд требует активного удержания и перестановки элементов в рабочей памяти.`
    case 'information-processing-speed':
      return `Вы дали ${m.correct_count ?? 0} верных ответов из ${m.items_attempted ?? '—'} (средний темп: ${m.speed_per_minute ?? '—'} знаков/мин, точность: ${m.accuracy_pct ?? '—'}%).`
    case 'contrast-sensitivity':
      return `Минимальный уровень контраста, уверенно распознанный в обеих пробах: ${m.threshold_contrast_pct != null ? `${m.threshold_contrast_pct}%` : 'не достигнут'}. Показатель зависит от яркости экрана и внешнего освещения.`
    case 'visual-pairs':
      return `Все 6 пар символов найдены за ${m.moves_count ?? m.total_moves ?? '—'} ходов и ${m.time_sec ?? '—'} с (эффективность поиска: ${m.efficiency_pct ?? '—'}%).`
    case 'path-memory':
      return `Верно воспроизведено ${m.steps_correct ?? 0} из ${m.steps_total ?? '—'} шагов (${m.routes_correct ?? 0} из ${m.routes_total ?? 3} маршрутов пройдено полностью без ошибок).`
    case 'pattern-matrix':
      return `Верно решено ${m.correct_count ?? 0} из ${m.total_items ?? 6} последовательностей. Среднее время размышления над одной задачей — ${m.mean_item_sec ?? '—'} с.`
    case 'sound-discrimination':
      return `Вы верно определили соотношение высоты тонов в ${m.correct_count ?? 0} из ${m.total_trials ?? 14} звуковых пар (общая точность: ${m.accuracy_pct ?? '—'}%).`
    case 'speech-in-noise':
      return `На фоне маскирующего шума верно распознано ${m.digits_correct ?? 0} из ${m.digits_total ?? 30} цифр и ${m.triplets_exact ?? 0} полных троек из ${m.triplets_total ?? 10}.`
    case 'reaction-speed':
      return `Среднее время реакции составило ${m.mean_rt_ms ?? m.reaction_time_ms ?? '—'} мс (медиана — ${m.median_rt_ms ?? '—'} мс, разброс SD — ${m.variability_ms ?? '—'} мс).`
    case 'go-no-go':
      return `Точность удержания на запрещающих сигналах No-Go: ${m.inhibition_pct ?? '—'}%, точных нажатий Go: ${m.go_hits ?? 0}, среднее время реакции: ${m.mean_rt_ms ?? '—'} мс.`
    case 'mouse-eye-coordination':
      return `Курсор удерживался внутри движущейся цели ${m.time_on_target_pct ?? '—'}% времени при среднем отклонении от центра цели ${m.mean_deviation_pct ?? '—'}%.`
    case 'cursor-path':
      return `Коридор пройден за ${m.completion_time_sec ?? '—'} с. Доля пути внутри границ коридора — ${m.in_corridor_pct ?? '—'}%, выходов за границу — ${m.boundary_exits ?? 0}.`
    default:
      return 'Показатели упражнения зафиксированы для самонаблюдения и сравнения с вашими предыдущими попытками в одинаковых условиях.'
  }
}

export function unwrapMetrics(resultObj?: Record<string, any> | null): Record<string, any> {
  if (!resultObj || typeof resultObj !== 'object') return {}
  if (typeof resultObj.metrics === 'object' && resultObj.metrics !== null) {
    return resultObj.metrics as Record<string, any>
  }
  return resultObj
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
  const spec = METRIC_DICTIONARY[key]
  const unit = spec?.unit ? spec.unit[lang] || spec.unit.ru : ''
  if (typeof value === 'number') {
    const numStr = Number.isInteger(value) ? String(value) : value.toFixed(1)
    return unit ? `${numStr} ${unit}` : numStr
  }
  return unit ? `${String(value)} ${unit}` : String(value)
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
  const limitations = propLimitations || methodology?.limitations
  // Unwrap v2 { version, engine, metrics, series } or legacy flat object
  const rawMetrics: Record<string, any> =
    resultData && typeof resultData.metrics === 'object' && resultData.metrics !== null
      ? resultData.metrics
      : resultData || {}
  const series: Record<string, any> =
    resultData && typeof resultData.series === 'object' && resultData.series !== null
      ? resultData.series
      : {}
  const engineKind: string =
    (typeof resultData?.engine === 'string' ? resultData.engine : '') || testSlug

  const ui = {
    ru: {
      reportBadge: 'Образовательный отчёт самонаблюдения',
      explanationTitle: 'Разбор результата',
      keyMetricsTitle: 'Основные показатели',
      chartTitle: 'Индивидуальный график выполнения',
      errorsTitle: 'Статистика ошибок и точности',
      zeroErrors: 'Упражнение выполнено без штрафных ошибок.',
      comparisonTitle: 'Сравнение с предыдущими попытками',
      noPrevAttempts: 'Это ваша первая сохранённая запись по данной методике. Пройдите упражнение повторно позже, чтобы увидеть динамику.',
      disclaimerTitle: 'Методологическое примечание',
      disclaimerBody:
        limitations ||
        'Данное упражнение предназначено для самонаблюдения и отслеживания личной динамики. Результаты зависят от экрана, освещения, звука и усталости и не являются медицинским диагнозом.',
      saveBtn: 'Сохранить в профиль',
      savingBtn: 'Сохранение...',
      savedBadge: 'Сохранено в профиле',
      discardBtn: 'Не сохранять',
      retakeBtn: 'Пройти повторно (новое задание)',
      pdfBtn: 'Скачать PDF-отчёт',
      loginToSave: 'Войдите в аккаунт, чтобы сохранять результаты и отслеживать динамику',
      loginBtn: 'Войти / Регистрация',
    },
    tj: {
      reportBadge: 'Ҳисоботи таълимии худмушоҳида',
      explanationTitle: 'Шарҳи натиҷа',
      keyMetricsTitle: 'Нишондиҳандаҳои асосӣ',
      chartTitle: 'Графики инфиродии иҷро',
      errorsTitle: 'Омори хатоҳо ва дақиқият',
      zeroErrors: 'Машқ бе хатоҳои ҷаримавӣ иҷро шуд.',
      comparisonTitle: 'Муқоиса бо кӯшишҳои қаблӣ',
      noPrevAttempts: 'Ин аввалин сабти шумо аз рӯи ин метод аст. Барои дидани динамика машқро такроран гузаред.',
      disclaimerTitle: 'Эзоҳи методологӣ',
      disclaimerBody:
        limitations ||
        'Ин машқ танҳо барои худмушоҳида ва муқоисаи динамикаи шахсӣ пешбинӣ шудааст ва ташхиси тиббӣ намебошад.',
      saveBtn: 'Сабт дар профил',
      savingBtn: 'Дар ҳоли сабт...',
      savedBadge: 'Дар профил сабт шуд',
      discardBtn: 'Сабт накардан',
      retakeBtn: 'Аз нав гузаштан (супориши нав)',
      pdfBtn: 'Боргирии PDF',
      loginToSave: 'Барои сабти натиҷаҳо ба ҳисоби худ ворид шавед',
      loginBtn: 'Воридшавӣ',
    },
    en: {
      reportBadge: 'Educational Self-Observation Report',
      explanationTitle: 'Result Explanation',
      keyMetricsTitle: 'Key Performance Metrics',
      chartTitle: 'Individual Performance Visualization',
      errorsTitle: 'Error & Precision Breakdown',
      zeroErrors: 'Completed with zero penalty errors.',
      comparisonTitle: 'Comparison with Previous Attempts',
      noPrevAttempts: 'This is your first saved record for this exercise. Complete it again later to track your personal trend.',
      disclaimerTitle: 'Methodological Note',
      disclaimerBody:
        limitations ||
        'This exercise is an educational self-observation tool. Scores depend on device, lighting, audio, and fatigue and do not constitute a medical diagnosis.',
      saveBtn: 'Save to Profile',
      savingBtn: 'Saving...',
      savedBadge: 'Saved in Profile',
      discardBtn: 'Do Not Save',
      retakeBtn: 'Retake (Fresh Task Variant)',
      pdfBtn: 'Download PDF Report',
      loginToSave: 'Sign in to save your results and compare progress over time',
      loginBtn: 'Sign In / Register',
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

  // Split metrics into main metrics and error metrics, ignoring internal fields
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

  // Render tailored SVG visualization per test engine
  const renderChart = () => {
    // 1. Schulte step split times
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
            <span className="font-mono text-emerald-600 dark:text-emerald-400">
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
                    opacity={0.85}
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

    // 2. Trail Making A vs B step times
    if (
      (engineKind === 'trail' || testSlug === 'attention-switching') &&
      (Array.isArray(series.step_times_a_ms) || rawMetrics.part_a_sec != null)
    ) {
      const aSec = Number(rawMetrics.part_a_sec) || 1
      const bSec = Number(rawMetrics.part_b_sec) || 1
      const maxSec = Math.max(aSec, bSec, 5)
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-emerald-600 dark:text-emerald-400">Часть A (1 → 8)</span>
              <span className="font-mono">{aSec} с</span>
            </div>
            <div className="h-4 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${Math.min(100, Math.round((aSec / maxSec) * 100))}%` }}
              />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-cyan-600 dark:text-cyan-400">Часть B (1 → A → 2 → B...)</span>
              <span className="font-mono">{bSec} с</span>
            </div>
            <div className="h-4 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-cyan-500 rounded-full"
                style={{ width: `${Math.min(100, Math.round((bSec / maxSec) * 100))}%` }}
              />
            </div>
          </div>
        </div>
      )
    }

    // 3. Corsi / Digit Span progression by length
    if (Array.isArray(series.by_length) || Array.isArray(series.forward)) {
      const rows: Array<{ label: string; pct: number; sub: string }> = []
      if (Array.isArray(series.by_length)) {
        for (const r of series.by_length) {
          rows.push({
            label: `${r.length} эл.`,
            pct: Math.round((r.passed / Math.max(1, r.of)) * 100),
            sub: `${r.passed}/${r.of}`,
          })
        }
      } else {
        for (const r of series.forward || []) {
          rows.push({
            label: `Прямой (${r.length})`,
            pct: Math.round((r.passed / Math.max(1, r.of)) * 100),
            sub: `${r.passed}/${r.of}`,
          })
        }
        for (const r of series.backward || []) {
          rows.push({
            label: `Обратный (${r.length})`,
            pct: Math.round((r.passed / Math.max(1, r.of)) * 100),
            sub: `${r.passed}/${r.of}`,
          })
        }
      }
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {rows.map((r, i) => (
            <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700">
              <div className="flex justify-between text-xs font-mono mb-1.5">
                <span className="font-bold text-slate-700 dark:text-slate-200">{r.label}</span>
                <span className="text-emerald-500 font-bold">{r.sub}</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${r.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      )
    }

    // 4. Symbol-Digit 15s intervals
    if (Array.isArray(series.correct_per_15s) && series.correct_per_15s.length > 0) {
      const bins: number[] = series.correct_per_15s
      const maxBin = Math.max(5, ...bins)
      const labels = ['0–15с', '15–30с', '30–45с', '45–60с', '60–75с', '75–90с']
      return (
        <svg viewBox="0 0 420 130" className="w-full h-36">
          {bins.map((val, idx) => {
            const h = Math.max(6, Math.round((val / maxBin) * 85))
            const x = 20 + idx * 65
            const y = 98 - h
            return (
              <g key={idx}>
                <rect x={x} y={y} width={42} height={h} rx={6} fill="#10b981" />
                <text x={x + 21} y={y - 5} textAnchor="middle" className="fill-emerald-500 text-[10px] font-mono font-bold">
                  {val}
                </text>
                <text x={x + 21} y={116} textAnchor="middle" className="fill-slate-400 text-[9px] font-mono">
                  {labels[idx] || `#${idx + 1}`}
                </text>
              </g>
            )
          })}
        </svg>
      )
    }

    // 5. Contrast / Sound / Speech-in-Noise / Path / Pattern rule breakdowns
    if (
      Array.isArray(series.by_level) ||
      Array.isArray(series.by_delta) ||
      Array.isArray(series.by_noise) ||
      Array.isArray(series.by_route) ||
      Array.isArray(series.by_rule)
    ) {
      const items: Array<{ label: string; pct: number; text: string }> = []
      if (Array.isArray(series.by_level)) {
        for (const x of series.by_level) {
          items.push({
            label: `${x.contrast_pct}%`,
            pct: Math.round((x.correct / Math.max(1, x.of)) * 100),
            text: `${x.correct}/${x.of}`,
          })
        }
      } else if (Array.isArray(series.by_delta)) {
        for (const x of series.by_delta) {
          items.push({
            label: `Δ ${x.delta_pct}%`,
            pct: Math.round((x.correct / Math.max(1, x.of)) * 100),
            text: `${x.correct}/${x.of}`,
          })
        }
      } else if (Array.isArray(series.by_noise)) {
        for (const x of series.by_noise) {
          items.push({
            label: `Шум ${x.noise_level}/5`,
            pct: Math.round((x.correct / Math.max(1, x.of)) * 100),
            text: `${x.correct}/${x.of}`,
          })
        }
      } else if (Array.isArray(series.by_route)) {
        for (const x of series.by_route) {
          items.push({
            label: `${x.length} шаг.`,
            pct: Math.round((x.correct_steps / Math.max(1, x.length)) * 100),
            text: `${x.correct_steps}/${x.length}`,
          })
        }
      } else if (Array.isArray(series.by_rule)) {
        for (const x of series.by_rule) {
          items.push({
            label: String(x.rule),
            pct: Math.round((x.correct / Math.max(1, x.of)) * 100),
            text: `${x.correct}/${x.of}`,
          })
        }
      }

      if (items.length > 0) {
        return (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {items.map((it, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700">
                <div className="flex justify-between text-xs font-mono mb-1.5">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{it.label}</span>
                  <span className="text-emerald-500 font-bold">{it.text}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${it.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        )
      }
    }

    // 6. Visual pairs move outcomes
    if (Array.isArray(series.move_outcomes) && series.move_outcomes.length > 0) {
      const outcomes: boolean[] = series.move_outcomes
      return (
        <div className="space-y-2">
          <div className="text-xs text-slate-500">
            {lang === 'en'
              ? 'Move-by-move sequence (green = pair matched, slate = exploration flip):'
              : 'Последовательность ходов (зелёный — найдена пара, серый — разведочное открытие):'}
          </div>
          <div className="flex flex-wrap gap-2">
            {outcomes.map((hit, i) => (
              <span
                key={i}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold ${
                  hit
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
                }`}
              >
                #{i + 1} {hit ? '✓' : '•'}
              </span>
            ))}
          </div>
        </div>
      )
    }

    // 7. Reaction / Go-No-Go RT series
    if (Array.isArray(series.rt_ms) && series.rt_ms.length > 0) {
      const rts: number[] = series.rt_ms
      const maxRt = Math.max(450, ...rts)
      return (
        <svg viewBox="0 0 460 130" className="w-full h-36">
          {rts.map((rt, idx) => {
            const stepW = Math.min(36, Math.floor(400 / Math.max(1, rts.length)))
            const gap = Math.max(4, Math.floor((430 - stepW * rts.length) / Math.max(1, rts.length)))
            const x = 16 + idx * (stepW + gap)
            const h = Math.max(8, Math.round((rt / maxRt) * 85))
            const y = 98 - h
            return (
              <g key={idx}>
                <rect x={x} y={y} width={stepW} height={h} rx={5} fill="#06b6d4" />
                {rts.length <= 12 && (
                  <text x={x + stepW / 2} y={y - 4} textAnchor="middle" className="fill-cyan-500 text-[9px] font-mono font-bold">
                    {rt}
                  </text>
                )}
                <text x={x + stepW / 2} y={115} textAnchor="middle" className="fill-slate-400 text-[8px] font-mono">
                  #{idx + 1}
                </text>
              </g>
            )
          })}
        </svg>
      )
    }

    // 8. Pursuit / Cursor Path 2D track replay
    if (Array.isArray(series.track) && series.track.length > 2) {
      const track: Array<{ x: number; y: number }> = series.track
      const pts = track.map((pt) => `${(pt.x * 400).toFixed(1)},${(pt.y * 220).toFixed(1)}`).join(' ')
      return (
        <div className="space-y-2">
          <div className="text-xs text-slate-500">
            {lang === 'en' ? 'Recorded 2D cursor trajectory:' : 'Записанная траектория движения курсора:'}
          </div>
          <svg viewBox="0 0 400 220" className="w-full h-44 rounded-2xl bg-slate-950/90 border border-slate-800">
            <polyline
              fill="none"
              stroke="#2EC4A7"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={pts}
            />
          </svg>
        </div>
      )
    }

    // Fallback visual scale for any result
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {mainCards.slice(0, 4).map((m) => {
          const numVal = Number(m.value)
          const pct = Number.isFinite(numVal)
            ? m.unit === '%'
              ? Math.max(5, Math.min(100, numVal))
              : 72
            : 65
          return (
            <div key={m.key} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-600 dark:text-slate-300 font-medium">{m.label}</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {m.value} {m.unit}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full" style={{ width: `${pct}%` }} />
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

      {/* 2. Human-Readable Explanation */}
      <div className="p-5 rounded-2xl bg-emerald-500/[0.06] dark:bg-emerald-500/[0.08] border border-emerald-500/20">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#17A884] mb-1.5">
          <Activity className="w-4 h-4" />
          <span>{ui.explanationTitle}</span>
        </div>
        <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
          {explanationText}
        </p>
      </div>

      {/* 3. Key Metric Cards */}
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

      {/* 4. Individual Performance Visualization / Chart */}
      <div className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">
          <BarChart3 className="w-4 h-4 text-[#17A884]" />
          <span>{ui.chartTitle}</span>
        </div>
        {renderChart()}
      </div>

      {/* 5. Error Statistics */}
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

      {/* 6. Comparison with Previous Attempts */}
      <div className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
          <TrendingUp className="w-4 h-4 text-[#17A884]" />
          <span>{ui.comparisonTitle}</span>
        </div>
        {previousResults.length > 0 ? (
          <div className="space-y-2">
            {previousResults.slice(0, 4).map((prev) => {
              const prevM =
                prev.result && typeof (prev.result as any).metrics === 'object'
                  ? (prev.result as any).metrics
                  : prev.result || {}
              const primaryKey = mainCards[0]?.key
              const prevVal = primaryKey ? prevM[primaryKey] : undefined
              const dtStr = new Date(prev.completed_at).toLocaleDateString(
                lang === 'en' ? 'en-US' : 'ru-RU',
                { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }
              )
              return (
                <div
                  key={prev.id}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 text-xs"
                >
                  <span className="text-slate-500 font-mono">{dtStr}</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {primaryKey && prevVal !== undefined
                      ? `${mainCards[0].label}: ${prevVal} ${mainCards[0].unit}`
                      : prev.test_title}
                  </span>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-500 dark:text-slate-400">{ui.noPrevAttempts}</p>
        )}
      </div>

      {/* 7. Honest Methodological Note */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 dark:text-amber-200/90 leading-relaxed">
          <strong className="block mb-0.5">{ui.disclaimerTitle}</strong>
          <span>{ui.disclaimerBody}</span>
        </div>
      </div>

      {/* 8. Action Bar */}
      <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {canSave && !isSaved && onSave && (
            <Button
              onClick={onSave}
              disabled={isSaving}
              className="bg-[#17A884] hover:bg-[#103D35] text-white gap-2 rounded-xl px-5 py-2.5 text-xs font-bold cursor-pointer shadow-md"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? ui.savingBtn : ui.saveBtn}</span>
            </Button>
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

          {!isSaved && onDiscard && (
            <Button
              variant="outline"
              onClick={onDiscard}
              className="gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-rose-600 border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
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
            className="gap-2 rounded-xl px-4 py-2.5 text-xs font-bold cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{ui.retakeBtn}</span>
          </Button>
        )}
      </div>

      {!isAuthenticated && onOpenAuth && !isSaved && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
          <span className="text-slate-600 dark:text-slate-400">{ui.loginToSave}</span>
          <Button size="sm" variant="emerald" onClick={onOpenAuth} className="cursor-pointer shrink-0">
            {ui.loginBtn}
          </Button>
        </div>
      )}
    </Card>
  )
}
