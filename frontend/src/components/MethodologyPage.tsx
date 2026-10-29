import React, { useState } from 'react'
import {
  ShieldCheck,
  AlertTriangle,
  Sliders,
  ArrowRight,
  Award,
  Search,
  BookOpen,
  Calculator,
  Target,
} from 'lucide-react'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import type { Language } from '../i18n'
import type { TestItem, Category } from '../types'
import { getTestCover, getTestAlt, getTestPhotoCredit } from '../lib/testImages'
import { APPROVED_15_SLUGS } from './test-engines/engineTypes'

interface MethodologyPageProps {
  tests: TestItem[]
  categories?: Category[]
  currentSlug: string | null
  lang: Language
  token: string
  onNavigate: (route: string) => void
  onStartAttempt: (test: TestItem) => void
  onOpenAuth: () => void
}

const SCORING_SUMMARY_BY_SLUG: Record<
  string,
  {
    ru: { measures: string; scoring: string }
    tj: { measures: string; scoring: string }
    en: { measures: string; scoring: string }
  }
> = {
  'attention-concentration': {
    ru: {
      measures: 'Объём распределённого периферического внимания, устойчивость концентрации и темп зрительного поиска чисел 1–25 в случайной матрице 5×5.',
      scoring: 'Суммарное время прохождения (мс), средний интервал между кликами, индекс равномерности темпа (первая vs вторая половина) и количество ошибочных нажатий.',
    },
    tj: {
      measures: 'Ҳаҷми диққати периферӣ, устувории тамаркуз ва суръати ҷустуҷӯи рақамҳои 1–25 дар ҷадвали 5×5.',
      scoring: 'Вақти умумӣ (мс), фосилаи миёна байни пахшкуниҳо, шохиси устувории суръат ва шумораи хатогиҳо.',
    },
    en: {
      measures: 'Peripheral visual attention span, concentration stability, and visual search speed across a randomized 5×5 matrix (1–25).',
      scoring: 'Total completion time (ms), mean inter-click interval, tempo stability ratio (first vs second half), and erroneous clicks.',
    },
  },
  'attention-switching': {
    ru: {
      measures: 'Когнитивная гибкость и скорость переключения между двумя рядами стимулов (числа и буквы: 1 → А → 2 → Б) по парадигме Trail Making Test Part B.',
      scoring: 'Общее время маршрута, средний шаг соединения узлов, отношение времени когнитивного переключения и ошибки чередования.',
    },
    tj: {
      measures: 'Чандирии маърифатӣ ва суръати гузариш байни рақамҳо ва ҳарфҳо (1 → А → 2 → Б) аз рӯи Trail Making Test B.',
      scoring: 'Вақти умумии масир, қадами миёнаи пайвастшавӣ ва шумораи хатогиҳои пайдарпайӣ.',
    },
    en: {
      measures: 'Cognitive flexibility and set-shifting speed between alternating numerical and alphabetical sequences (1 → A → 2 → B, Trail Making Part B).',
      scoring: 'Total path completion time, mean node-to-node transition latency, switching overhead, and sequencing errors.',
    },
  },
  'visual-memory': {
    ru: {
      measures: 'Объём зрительно-пространственной рабочей памяти (Corsi Block-Tapping): способность удерживать и воспроизводить координаты вспыхивающих блоков.',
      scoring: 'Максимальная длина безошибочно воспроизведённой последовательности (Corsi Span), доля верных раундов и точность по уровням сложности.',
    },
    tj: {
      measures: 'Ҳаҷми хотираи кории визуалӣ-фазоӣ (Corsi Block-Tapping): қобилияти нигоҳдорӣ ва барқароркунии блокҳо.',
      scoring: 'Дарозии максималии пайдарпайии дуруст (Corsi Span), фоизи даврҳои дуруст ва дақиқӣ.',
    },
    en: {
      measures: 'Visuospatial working memory capacity (Corsi Block-Tapping): ability to retain and reproduce spatial block sequences.',
      scoring: 'Maximum accurately reproduced sequence length (Corsi Span), round accuracy rate, and level progression.',
    },
  },
  'short-term-memory': {
    ru: {
      measures: 'Аудиально-визуальный объём кратковременной памяти (Digit Span Forward) и оперативной переработки (Digit Span Backward).',
      scoring: 'Максимальный прямой и обратный индекс удержания цифр, процент точных воспроизведений и среднее время ввода.',
    },
    tj: {
      measures: 'Ҳаҷми хотираи кӯтоҳмуддати рақамӣ дар тартиби рост (Forward) ва баръакс (Backward).',
      scoring: 'Нишондиҳандаи максималии нигоҳдории рақамҳо дар тартиби рост ва баръакс ва фоизи ҷавобҳои дуруст.',
    },
    en: {
      measures: 'Short-term numerical retention (Digit Span Forward) and working memory manipulation (Digit Span Backward).',
      scoring: 'Maximum forward and backward digit span, overall sequence accuracy percentage, and recall latency.',
    },
  },
  'information-processing-speed': {
    ru: {
      measures: 'Психомоторная скорость перекодирования информации и зрительно-моторная ассоциация по случайно генерируемому ключу «символ — цифра» (SDMT).',
      scoring: 'Количество верно сопоставленных пар за 60 секунд, точность ответов (%) и средняя задержка декодирования одного стимула (мс).',
    },
    tj: {
      measures: 'Суръати психомотории коркарди маълумот ва муқоисаи «аломат — рақам» (SDMT).',
      scoring: 'Шумораи ҷуфтҳои дуруст дар 60 сония, дақиқии ҷавобҳо (%) ва вақти миёнаи як аломат (мс).',
    },
    en: {
      measures: 'Psychomotor information processing speed and visual-motor substitution using a randomized symbol-digit key (SDMT paradigm).',
      scoring: 'Correct substitutions within 60 seconds, response accuracy (%), and mean per-item decoding latency (ms).',
    },
  },
  'contrast-sensitivity': {
    ru: {
      measures: 'Способность зрительного анализатора различать ориентацию решёток Габора при ступенчатом снижении контраста (по методу Pelli-Robson / лестничной процедуре).',
      scoring: 'Логарифмический индекс контрастной чувствительности (log CS), минимальный распознанный порог контраста (%) и кривая точности по уровням.',
    },
    tj: {
      measures: 'Қобилияти фарқ кардани самти панҷараҳои Габор ҳангоми паст шудани контраст (Pelli-Robson).',
      scoring: 'Шохиси логарифмии ҳассосияти контрастӣ (log CS), ҳадди минималии контраст (%) ва дақиқӣ.',
    },
    en: {
      measures: 'Visual ability to discriminate Gabor grating orientation across progressively decreasing Michelson contrast levels.',
      scoring: 'Log contrast sensitivity index (log CS), minimum threshold contrast percentage, and staircase accuracy curve.',
    },
  },
  'visual-pairs': {
    ru: {
      measures: 'Зрительно-ассоциативная эпизодическая память: запоминание расположения парных геометрических паттернов на поле.',
      scoring: 'Общее число ходов до полного открытия пар, число неверных сопоставлений (ошибок памяти) и время прохождения.',
    },
    tj: {
      measures: 'Хотираи визуалӣ-ассотсиативӣ: дар хотир гирифтани ҷойгиршавии ҷуфтҳои геометрӣ.',
      scoring: 'Шумораи умумии кӯшишҳо, хатогиҳои хотира ва вақти умумии кушодани ҷуфтҳо.',
    },
    en: {
      measures: 'Visual associative episodic memory: spatial encoding and recall of matching geometric pattern pairs.',
      scoring: 'Total moves to match all pairs, memory mismatch errors, matching efficiency ratio, and completion time.',
    },
  },
  'path-memory': {
    ru: {
      measures: 'Пространственная навигационная память: удержание и пошаговое воспроизведение маршрута движения по матричной сетке.',
      scoring: 'Точность воспроизведённых узлов маршрута (%), максимальная длина безошибочного пути и среднее время шага.',
    },
    tj: {
      measures: 'Хотираи фазоии паймоиш: дар хотир гирифтан ва такрор кардани масир дар шабака.',
      scoring: 'Дақиқии гиреҳҳои масир (%), дарозии максималии масири бехато ва вақти миёнаи қадам.',
    },
    en: {
      measures: 'Spatial navigation memory: encoding and step-by-step reproduction of a multi-segment grid route.',
      scoring: 'Route node accuracy (%), maximum error-free path length, and mean step latency.',
    },
  },
  'pattern-matrix': {
    ru: {
      measures: 'Невербальное логическое мышление и распознавание закономерностей (прогрессия форм, поворотов, количества элементов и инверсии).',
      scoring: 'Процент верно решённых матричных задач, точность по уровням сложности и среднее время анализа одной матрицы.',
    },
    tj: {
      measures: 'Тафаккури мантиқии ғайринутқӣ ва дарёфти қонуниятҳои геометрӣ дар матритсаҳо.',
      scoring: 'Фоизи масъалаҳои дуруст ҳалшуда, дақиқӣ аз рӯи сатҳи душворӣ ва вақти миёнаи таҳлил.',
    },
    en: {
      measures: 'Non-verbal fluid reasoning and pattern recognition across shape, rotation, count, and parity progressions.',
      scoring: 'Percentage of solved matrix items, accuracy across difficulty tiers, and mean reasoning time per item.',
    },
  },
  'sound-discrimination': {
    ru: {
      measures: 'Дифференциальная частотная чувствительность слуха: различение высоты синтезированных чистых тонов (Web Audio API) с уменьшающейся разницей в Гц.',
      scoring: 'Минимальный различаемый порог частоты (Гц), общая точность сравнения тонов (%) и профиль ответов по дельте частот.',
    },
    tj: {
      measures: 'Ҳассосияти басомадии шунавоӣ: фарқ кардани баландии садоҳои синтезшуда (Гц).',
      scoring: 'Ҳадди минималии фарқияти басомад (Гц), дақиқии умумии муқоиса (%) ва профили ҷавобҳо.',
    },
    en: {
      measures: 'Auditory frequency discrimination (Pitch JND): distinguishing synthesized pure tones across narrowing Hz deltas.',
      scoring: 'Just-noticeable frequency difference threshold (Hz), overall pitch comparison accuracy (%), and delta curve.',
    },
  },
  'speech-in-noise': {
    ru: {
      measures: 'Помехоустойчивость слухового восприятия (Digits-in-Noise): распознавание триплетов цифр на фоне маскирующего широкополосного шума при разных SNR.',
      scoring: 'Порог разборчивости в шуме (SNR, дБ), процент верно распознанных триплетов и динамика точности при усилении шума.',
    },
    tj: {
      measures: 'Устувории шунавоӣ дар садои баланд (Digits-in-Noise): шинохтани сегонаи рақамҳо дар пасманзари шавшув.',
      scoring: 'Ҳадди фаҳмиш дар шавшув (SNR, дБ), фоизи сегонаҳои дуруст ва динамикаи дақиқӣ.',
    },
    en: {
      measures: 'Auditory speech-in-noise perception (Digits-in-Noise): recognizing digit triplets embedded in masking noise across varying SNR levels.',
      scoring: 'Estimated speech reception threshold (SNR dB), triplet recognition accuracy (%), and SNR performance curve.',
    },
  },
  'reaction-speed': {
    ru: {
      measures: 'Простая зрительно-моторная реакция (Simple Reaction Time): латентность ответа на появление визуального стимула со случайным предстимульным интервалом.',
      scoring: 'Среднее и медианное время реакции (мс), стандартное отклонение (стабильность, мс) и число преждевременных нажатий (фальстартов).',
    },
    tj: {
      measures: 'Вокуниши оддии визуалӣ-моторӣ: суръати пахшкунӣ ҳангоми пайдоиши стимул.',
      scoring: 'Вақти миёна ва медиании вокуниш (мс), устувории вокуниш ва шумораи пахшкуниҳои пешакӣ.',
    },
    en: {
      measures: 'Simple visuomotor reaction time (SRT): response latency to visual stimulus onset with randomized foreperiods.',
      scoring: 'Mean and median reaction time (ms), response variability (SD, ms), and premature false-start count.',
    },
  },
  'go-no-go': {
    ru: {
      measures: 'Исполнительный контроль и торможение импульсивного ответа (Go/No-Go): быстрая реакция на целевой стимул (Go) и подавление действия на запретный (No-Go).',
      scoring: 'Точность торможения на No-Go (%), пропуск целевых стимулов (Omission), ложные срабатывания (Commission) и средняя реакция на Go (мс).',
    },
    tj: {
      measures: 'Назорати иҷроия ва боздории импулс (Go/No-Go): вокуниш ба стимулҳои мақсаднок ва худдорӣ аз стимулҳои манъшуда.',
      scoring: 'Дақиқии боздорӣ (%), хатогиҳои саросемагӣ (Commission), партофтани ҳадаф (Omission) ва суръати Go (мс).',
    },
    en: {
      measures: 'Executive inhibitory control (Go/No-Go): rapid response to target Go stimuli while suppressing action on No-Go distractors.',
      scoring: 'Inhibitory accuracy (%), commission errors (false alarms), omission misses, and mean Go reaction time (ms).',
    },
  },
  'mouse-eye-coordination': {
    ru: {
      measures: 'Непрерывная зрительно-моторная координация (Pursuit Rotor): плавное удержание курсора или касания внутри движущейся по сложной орбите мишени.',
      scoring: 'Процент времени удержания на цели (Time on Target, %), среднее радиальное отклонение от центра мишени (px) и число срывов слежения.',
    },
    tj: {
      measures: 'Ҳамоҳангии пайвастаи чашму даст (Pursuit Rotor): нигоҳ доштани курсор дар дохили ҳадафи ҳаракаткунанда.',
      scoring: 'Фоизи вақт дар дохили ҳадаф (%), инҳирофи миёна аз марказ (px) ва шумораи баромаданҳо.',
    },
    en: {
      measures: 'Continuous visuomotor pursuit tracking: maintaining pointer position inside a target moving along a variable-speed trajectory.',
      scoring: 'Time-on-target percentage (%), mean radial tracking deviation (px), and boundary exit count.',
    },
  },
  'cursor-path': {
    ru: {
      measures: 'Точность мелкой моторики и управление движением по закону Фиттса — Аккота (Steering Law): проведение курсора от старта до финиша внутри изогнутого коридора.',
      scoring: 'Чистота удержания в границах коридора (%), число выходов за стенки, время прохождения (мс) и индекс плавности движения.',
    },
    tj: {
      measures: 'Дақиқии моторикаи хурд (Steering Law): гузаронидани курсор аз оғоз то анҷом дар дохили роҳрави каҷ.',
      scoring: 'Тозагии ҳаракат дар дохили роҳрав (%), шумораи бархӯрд ба деворҳо ва вақти гузариш (мс).',
    },
    en: {
      measures: 'Fine motor steering precision (Accot-Zhai Steering Law): navigating a pointer through a curved bounded tunnel from start to finish.',
      scoring: 'In-bounds path accuracy (%), wall collision count, traversal time (ms), and movement smoothness index.',
    },
  },
}

export const MethodologyPage: React.FC<MethodologyPageProps> = ({
  tests,
  categories = [],
  currentSlug,
  lang,
  onNavigate,
  onStartAttempt,
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  const getCategoryName = (catId: string) => {
    const found = categories.find((c) => c.id === catId || c.slug === catId)
    if (found) {
      const loc = found.localizations?.[lang] || found.localizations?.ru || found.localizations?.en
      if (loc?.title) return loc.title
      if (found.slug) return found.slug
    }
    const fallbackMap: Record<Language, Record<string, string>> = {
      ru: {
        'memory-attention': 'Внимание и память',
        'vision': 'Зрительное восприятие',
        'hearing': 'Слух',
        'reaction-coordination': 'Реакция и координация',
      },
      tj: {
        'memory-attention': 'Диққат ва хотира',
        'vision': 'Дарки визуалӣ',
        'hearing': 'Шунавоӣ',
        'reaction-coordination': 'Вокуниш ва ҳамоҳангӣ',
      },
      en: {
        'memory-attention': 'Attention & Memory',
        'vision': 'Visual Perception',
        'hearing': 'Hearing',
        'reaction-coordination': 'Reaction & Coordination',
      },
    }
    return fallbackMap[lang]?.[catId] || fallbackMap.ru[catId] || catId
  }

  // Filter strictly to the 15 approved interactive tests
  const approvedSet = new Set<string>(APPROVED_15_SLUGS)
  const approvedTests = tests
    .filter((t) => t.status !== 'draft' && approvedSet.has(t.slug))
    .sort(
      (a, b) =>
        APPROVED_15_SLUGS.indexOf(a.slug as (typeof APPROVED_15_SLUGS)[number]) -
        APPROVED_15_SLUGS.indexOf(b.slug as (typeof APPROVED_15_SLUGS)[number])
    )

  const t = {
    ru: {
      badge15: '15 Утверждённых Паспортов Методик',
      libraryTitle: 'Библиотека паспортов методик SIHAT',
      librarySubtitle:
        'Полный реестр научно обоснованных спецификаций, правил серверного подсчёта, психофизиологических калибровок и ограничений всех 15 интерактивных упражнений.',
      searchPlaceholder: 'Поиск по названию методики, коду или научному источнику...',
      allCategories: 'Все разделы (15)',
      viewPassport: 'Паспорт методики',
      startScreening: 'Запустить упражнение',
      backToLibrary: '← Вернуться в каталог паспортов методик',
      backCatalog: 'Каталог упражнений',
      version: 'Версия протокола',
      validatedBadge: 'Валидированная парадигма • Открытый протокол',
      digitalBadge: 'Цифровой психофизиологический скрининг',
      officialPassportBadge: 'Официальный паспорт методики SIHAT',
      evidenceTitle: 'Научная база, источники и стандартизация',
      protocolStandardLabel: 'Название протокола:',
      scientificSourceLabel: 'Научные первоисточники:',
      standardLabel: 'Методика:',
      basisLabel: 'Источник:',
      measuresTitle: 'Назначение и что измеряет методика',
      scoringTitle: 'Серверная генерация и правила подсчёта',
      dynamicNotice:
        'При каждом запуске сервер генерирует уникальный вариант задания (seed + снимок стимулов) и проверяет журнал событий без передачи ответов на клиент.',
      licenseDesc: 'Открытый протокол доказательного функционального самоконтроля (Non-diagnostic).',
      conditionsTitle: 'Рекомендуемые условия проведения',
      condLightTitle: 'Освещение',
      condLightDesc: 'Спокойный рассеянный свет без прямых бликов на экране.',
      condDistanceTitle: 'Дистанция до экрана',
      condDistanceDesc: 'Комфортное расстояние 45–60 см, экран на уровне глаз.',
      condDisplayTitle: 'Экран и звук',
      condDisplayDesc: 'Для зрительных тестов отключите ночной фильтр; для слуховых используйте наушники.',
      condAcousticTitle: 'Концентрация',
      condAcousticDesc: 'Тихая обстановка без отвлекающих уведомлений на 1–3 минуты.',
      limitsTitle: 'Ограничения и недиагностический статус',
      limitsDesc:
        'Данное упражнение предназначено для ознакомительного функционального самоконтроля и отслеживания личной динамики. Результат зависит от характеристик экрана, аудиоустройства и усталости, не является медицинским диагнозом и не заменяет консультацию врача.',
      footerNotice: 'Вы сами решаете, сохранять ли результат в личный профиль или удалить его после просмотра.',
      emptySearch: 'По вашему запросу методики не найдены. Попробуйте сбросить фильтр.',
      resetFilter: 'Сбросить фильтры',
    },
    tj: {
      badge15: '15 Шиносномаи тасдиқшудаи методӣ',
      libraryTitle: 'Китобхонаи шиносномаҳои методии SIHAT',
      librarySubtitle:
        'Феҳристи пурраи тавсифҳои илмӣ, қоидаҳои ҳисобкунии серверӣ ва маҳдудиятҳои ҳамаи 15 машқи интерактивӣ.',
      searchPlaceholder: 'Ҷустуҷӯ аз рӯи номи методика ё сарчашма...',
      allCategories: 'Ҳамаи бахшҳо (15)',
      viewPassport: 'Шиносномаи методӣ',
      startScreening: 'Оғози машқ',
      backToLibrary: '← Бозгашт ба феҳристи шиносномаҳо',
      backCatalog: 'Феҳристи машқҳо',
      version: 'Версияи протокол',
      validatedBadge: 'Парадигмаи тасдиқшуда • Протоколи кушода',
      digitalBadge: 'Скрининги рақамии психофизиологӣ',
      officialPassportBadge: 'Шиносномаи расмии методикаи SIHAT',
      evidenceTitle: 'Пойгоҳи илмӣ ва сарчашмаҳо',
      protocolStandardLabel: 'Номи протокол:',
      scientificSourceLabel: 'Сарчашмаҳои илмӣ:',
      standardLabel: 'Методика:',
      basisLabel: 'Сарчашма:',
      measuresTitle: 'Таъинот ва чӣ чен карда мешавад',
      scoringTitle: 'Генератсияи серверӣ ва қоидаҳои ҳисобкунӣ',
      dynamicNotice:
        'Ҳангоми ҳар як оғоз сервер варианти нави машқро месозад ва натиҷаро аз рӯи журнали ҳодисаҳо месанҷад.',
      licenseDesc: 'Протоколи кушодаи худназоратии функсионалӣ (Non-diagnostic).',
      conditionsTitle: 'Шароити тавсияшудаи гузаронидан',
      condLightTitle: 'Рӯшноӣ',
      condLightDesc: 'Нури муътадил бидуни инъикос дар экран.',
      condDistanceTitle: 'Масофа то экран',
      condDistanceDesc: 'Масофаи бароҳати 45–60 см дар баробари чашм.',
      condDisplayTitle: 'Экран ва садо',
      condDisplayDesc: 'Барои санҷишҳои биниш филтри шабонаро хомӯш кунед; барои шунавоӣ гӯшмонак истифода баред.',
      condAcousticTitle: 'Тамаркуз',
      condAcousticDesc: 'Муҳити ором бидуни халалдоршавӣ барои 1–3 дақиқа.',
      limitsTitle: 'Маҳдудиятҳо ва мақоми ғайриташхисӣ',
      limitsDesc:
        'Ин машқ танҳо барои худназоратии функсионалӣ пешбинӣ шудааст. Натиҷа ташхиси тиббӣ намебошад ва машварати духтурро иваз намекунад.',
      footerNotice: 'Шумо худатон интихоб мекунед, ки натиҷаро захира кунед ё нест кунед.',
      emptySearch: 'Аз рӯи дархости шумо методика ёфт нашуд.',
      resetFilter: 'Тоза кардани филтрҳо',
    },
    en: {
      badge15: '15 Approved Methodology Passports',
      libraryTitle: 'SIHAT Methodology Passports Library',
      librarySubtitle:
        'Complete repository of scientific foundations, server-side scoring rules, calibration guidelines, and limitations across all 15 interactive exercises.',
      searchPlaceholder: 'Search by methodology title, slug, or scientific source...',
      allCategories: 'All Domains (15)',
      viewPassport: 'View Passport',
      startScreening: 'Launch Exercise',
      backToLibrary: '← Back to Methodology Library',
      backCatalog: 'Exercise Catalog',
      version: 'Protocol Version',
      validatedBadge: 'Validated Paradigm • Open Protocol',
      digitalBadge: 'Digital Psychophysiological Screening',
      officialPassportBadge: 'Official SIHAT Methodology Passport',
      evidenceTitle: 'Scientific Foundation & Primary Sources',
      protocolStandardLabel: 'Protocol Name:',
      scientificSourceLabel: 'Primary Scientific Sources:',
      standardLabel: 'Methodology:',
      basisLabel: 'Source:',
      measuresTitle: 'Purpose & What It Measures',
      scoringTitle: 'Server Task Generation & Scoring Rules',
      dynamicNotice:
        'On every attempt, the server generates a unique task snapshot and scores the event log without exposing answer keys to the client.',
      licenseDesc: 'Open functional self-monitoring protocol (Non-diagnostic).',
      conditionsTitle: 'Recommended Testing Conditions',
      condLightTitle: 'Ambient Lighting',
      condLightDesc: 'Calm diffused room lighting without direct screen glare.',
      condDistanceTitle: 'Viewing Distance',
      condDistanceDesc: 'Comfortable 45–60 cm distance with screen at eye level.',
      condDisplayTitle: 'Display & Audio',
      condDisplayDesc: 'Disable night-shift filters for visual tests; use headphones for hearing exercises.',
      condAcousticTitle: 'Focus Environment',
      condAcousticDesc: 'Quiet setting free from notifications for 1–3 minutes.',
      limitsTitle: 'Limitations & Non-Diagnostic Disclosure',
      limitsDesc:
        'This exercise is designed for educational self-monitoring and personal trend tracking. Results depend on display/audio hardware and fatigue, do not constitute a medical diagnosis, and do not replace clinical consultation.',
      footerNotice: 'You retain full control over whether to save or discard each completed result.',
      emptySearch: 'No methodologies matched your search criteria.',
      resetFilter: 'Reset filters',
    },
  }[lang]

  // LIBRARY CATALOG VIEW (/methodologies)
  if (!currentSlug) {
    const availableCategoryIds = Array.from(
      new Set(approvedTests.map((tItem) => tItem.category_id).filter(Boolean))
    )
    const filteredTests = approvedTests.filter((test) => {
      const loc = test.localizations?.[lang] || test.localizations?.ru || test.localizations?.en
      const title = loc?.title || test.slug
      const standard = test.methodology?.name || ''
      const source = test.methodology?.source || ''
      const q = searchQuery.trim().toLowerCase()
      const matchesSearch =
        !q ||
        title.toLowerCase().includes(q) ||
        standard.toLowerCase().includes(q) ||
        source.toLowerCase().includes(q) ||
        test.slug.toLowerCase().includes(q)
      const matchesCat = categoryFilter === 'all' || test.category_id === categoryFilter
      return matchesSearch && matchesCat
    })

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-in fade-in duration-300">
        {/* Header Hero */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#17A884]/15 border border-[#17A884]/30 text-xs font-bold text-[#103D35] dark:text-[#2EC4A7] mb-4">
            <BookOpen className="w-4 h-4" />
            <span>{t.badge15}</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-[#103D35] dark:text-white tracking-tight mb-4">
            {t.libraryTitle}
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            {t.librarySubtitle}
          </p>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#1E302B] bg-white dark:bg-[#0E1715] text-sm focus:outline-hidden focus:border-[#17A884] shadow-xs"
            />
          </div>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                categoryFilter === 'all'
                  ? 'bg-[#103D35] text-white shadow-xs'
                  : 'bg-white dark:bg-[#0E1715] border border-slate-200 dark:border-[#1E302B] text-slate-600 dark:text-slate-400 hover:border-[#17A884]/40'
              }`}
            >
              {t.allCategories}
            </button>
            {availableCategoryIds.map((catId) => (
              <button
                key={catId}
                type="button"
                onClick={() => setCategoryFilter(catId)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  categoryFilter === catId
                    ? 'bg-[#103D35] text-white shadow-xs'
                    : 'bg-white dark:bg-[#0E1715] border border-slate-200 dark:border-[#1E302B] text-slate-600 dark:text-slate-400 hover:border-[#17A884]/40'
                }`}
              >
                {getCategoryName(catId)}
              </button>
            ))}
          </div>
        </div>

        {/* Empty Search State */}
        {filteredTests.length === 0 ? (
          <div className="bg-white dark:bg-[#0E1715] rounded-3xl p-12 text-center border border-slate-200/80 dark:border-[#1E302B]">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{t.emptySearch}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('')
                setCategoryFilter('all')
              }}
            >
              {t.resetFilter}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTests.map((test) => {
              const loc = test.localizations?.[lang] || test.localizations?.ru || test.localizations?.en
              const title = loc?.title || test.slug
              const passport = test.methodology
              const spec = SCORING_SUMMARY_BY_SLUG[test.slug]?.[lang] || SCORING_SUMMARY_BY_SLUG[test.slug]?.ru
              return (
                <div
                  key={test.id || test.slug}
                  className="bg-white dark:bg-[#0E1715] rounded-3xl p-5 shadow-xl border border-slate-200/80 dark:border-[#1E302B] flex flex-col justify-between transition-all hover:border-[#17A884]/50 hover:shadow-2xl overflow-hidden group"
                >
                  <div>
                    <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden mb-4 bg-slate-900 shadow-inner">
                      <img
                        src={getTestCover(test.slug)}
                        alt={getTestAlt(test.slug, lang)}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                      <div className="absolute top-3 left-3">
                        <Badge
                          variant="outline"
                          className="border-emerald-400 text-emerald-300 bg-emerald-950/60 backdrop-blur-md text-[10px]"
                        >
                          {getCategoryName(test.category_id)}
                        </Badge>
                      </div>
                      <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[10px] text-white/80">
                        <span className="font-mono text-[#2EC4A7] font-bold">
                          v{passport?.version || '2.0'}
                        </span>
                        {getTestPhotoCredit(test.slug) && (
                          <span className="truncate max-w-[140px] text-white/60 font-mono text-[9px]">
                            © {getTestPhotoCredit(test.slug)?.author}
                          </span>
                        )}
                      </div>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug mb-1.5 group-hover:text-[#17A884] transition-colors">
                      {title}
                    </h3>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                      {spec?.measures || loc?.description || ''}
                    </p>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#131C1A] border border-slate-200/60 dark:border-[#1E302B] mb-4 space-y-1 text-[11px]">
                      <div className="text-slate-500 truncate">
                        {t.standardLabel}{' '}
                        <strong className="text-slate-700 dark:text-slate-300">
                          {passport?.name || title}
                        </strong>
                      </div>
                      <div className="text-slate-500 truncate">
                        {t.basisLabel}{' '}
                        <span className="italic">{passport?.source || 'Peer-reviewed paradigm'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-[#1E302B]">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onNavigate(`passport/${test.slug}`)}
                      className="flex-1 text-xs gap-1 font-bold cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-[#17A884]" />
                      <span>{t.viewPassport}</span>
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => onStartAttempt(test)}
                      className="bg-[#103D35] hover:bg-[#17A884] text-white text-xs gap-1 font-bold cursor-pointer"
                    >
                      <span>{t.startScreening}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // INDIVIDUAL PASSPORT VIEW (/passport/:slug)
  const activeTest =
    approvedTests.find((tItem) => tItem.slug === currentSlug) ||
    tests.find((tItem) => tItem.slug === currentSlug) ||
    approvedTests[0]

  if (!activeTest) {
    return null
  }

  const loc =
    activeTest.localizations?.[lang] ||
    activeTest.localizations?.ru ||
    activeTest.localizations?.en
  const title = loc?.title || activeTest.slug
  const desc = loc?.description || ''
  const methodology = activeTest.methodology
  const spec =
    SCORING_SUMMARY_BY_SLUG[activeTest.slug]?.[lang] ||
    SCORING_SUMMARY_BY_SLUG[activeTest.slug]?.ru

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-in fade-in duration-300">
      {/* Top Breadcrumb & Return to Library */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <button
          type="button"
          onClick={() => onNavigate('methodologies')}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#17A884] transition-colors cursor-pointer"
        >
          <span>{t.backToLibrary}</span>
        </button>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 bg-emerald-500/5">
            <ShieldCheck className="w-3.5 h-3.5 mr-1" />
            <span>
              {methodology?.evidence_status === 'validated' ? t.validatedBadge : t.digitalBadge}
            </span>
          </Badge>
          <span className="text-xs font-mono font-bold text-slate-400">
            {t.version} {methodology?.version || '2.0'}
          </span>
        </div>
      </div>

      {/* Header Banner with Rich Thematic Image Backdrop */}
      <div className="relative rounded-3xl overflow-hidden shadow-2xl mb-8 min-h-[300px] flex items-center bg-[#0E1715] border border-slate-200/50 dark:border-[#1E302B]">
        <img
          src={getTestCover(activeTest.slug)}
          alt={getTestAlt(activeTest.slug, lang)}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#103D35]/95 via-[#103D35]/85 to-[#17A884]/70 backdrop-blur-xs" />
        <div className="relative z-10 p-6 sm:p-12 text-white max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-xs font-semibold mb-3 border border-white/20">
            <BookOpen className="w-3.5 h-3.5 text-[#2EC4A7]" />
            <span>{t.officialPassportBadge}</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-3">{title}</h1>
          <p className="text-sm sm:text-base text-white/85 leading-relaxed mb-6">{desc}</p>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => onStartAttempt(activeTest)}
              className="bg-white hover:bg-[#DDF5EB] text-[#103D35] px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg cursor-pointer"
            >
              <span>{t.startScreening}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => onNavigate('catalog')}
              className="border-white/30 text-white hover:bg-white/10 px-5 py-2.5 rounded-xl font-bold text-xs cursor-pointer"
            >
              {t.backCatalog}
            </Button>
            {getTestPhotoCredit(activeTest.slug) && (
              <span className="text-[10px] text-white/60 font-mono self-center ml-2">
                Фото: {getTestPhotoCredit(activeTest.slug)?.author} (Unsplash)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Purpose & Scoring Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white dark:bg-[#0E1715] rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 dark:border-[#1E302B] space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-[#1E302B]">
            <Target className="w-5 h-5 text-[#17A884]" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {t.measuresTitle}
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {spec?.measures || desc}
          </p>
        </div>

        <div className="bg-white dark:bg-[#0E1715] rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 dark:border-[#1E302B] space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-[#1E302B]">
            <Calculator className="w-5 h-5 text-[#17A884]" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {t.scoringTitle}
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {spec?.scoring || desc}
          </p>
          <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-[11px] text-emerald-800 dark:text-emerald-300">
            {t.dynamicNotice}
          </div>
        </div>
      </div>

      {/* Evidence & Environmental Conditions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Evidence & Standard */}
        <div className="bg-white dark:bg-[#0E1715] rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 dark:border-[#1E302B] space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-[#1E302B]">
            <Award className="w-5 h-5 text-[#17A884]" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {t.evidenceTitle}
            </h3>
          </div>
          <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#131C1A] border border-slate-200/60 dark:border-[#1E302B]">
              <span className="font-bold text-slate-900 dark:text-white block mb-1">
                {t.protocolStandardLabel}
              </span>
              <span>
                {methodology?.name || title} (v{methodology?.version || '2.0'})
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#131C1A] border border-slate-200/60 dark:border-[#1E302B]">
              <span className="font-bold text-slate-900 dark:text-white block mb-1">
                {t.scientificSourceLabel}
              </span>
              <span>{methodology?.source || 'Open science peer-reviewed protocol'}</span>
            </div>
            <p className="text-[11px] text-slate-400 italic pt-2">{t.licenseDesc}</p>
          </div>
        </div>

        {/* Environmental Conditions */}
        <div className="bg-white dark:bg-[#0E1715] rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 dark:border-[#1E302B] space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-[#1E302B]">
            <Sliders className="w-5 h-5 text-[#17A884]" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {t.conditionsTitle}
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#131C1A] border border-slate-200/60 dark:border-[#1E302B]">
              <span className="font-bold text-slate-900 dark:text-white block mb-0.5">
                {t.condLightTitle}
              </span>
              <span className="text-slate-500 text-[11px]">{t.condLightDesc}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#131C1A] border border-slate-200/60 dark:border-[#1E302B]">
              <span className="font-bold text-slate-900 dark:text-white block mb-0.5">
                {t.condDistanceTitle}
              </span>
              <span className="text-slate-500 text-[11px]">{t.condDistanceDesc}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#131C1A] border border-slate-200/60 dark:border-[#1E302B]">
              <span className="font-bold text-slate-900 dark:text-white block mb-0.5">
                {t.condDisplayTitle}
              </span>
              <span className="text-slate-500 text-[11px]">{t.condDisplayDesc}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#131C1A] border border-slate-200/60 dark:border-[#1E302B]">
              <span className="font-bold text-slate-900 dark:text-white block mb-0.5">
                {t.condAcousticTitle}
              </span>
              <span className="text-slate-500 text-[11px]">{t.condAcousticDesc}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Clinical Limitations Warning */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-3xl p-6 sm:p-8 flex items-start gap-4">
        <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0 mt-1" />
        <div>
          <h4 className="text-base font-bold text-amber-900 dark:text-amber-300 mb-1">
            {t.limitsTitle}
          </h4>
          <p className="text-xs sm:text-sm text-amber-800/90 dark:text-amber-200/90 leading-relaxed">
            {methodology?.limitations || t.limitsDesc}
          </p>
          <p className="text-xs text-amber-700/80 dark:text-amber-300/80 mt-3 font-semibold">
            {t.footerNotice}
          </p>
        </div>
      </div>
    </div>
  )
}
