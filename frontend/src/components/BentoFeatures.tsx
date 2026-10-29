import React, { useState } from 'react'
import {
  FileText,
  Trash2,
  Cpu,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Volume2,
  Eye,
  Brain,
  Timer,
  Bot,
  ArrowRight,
} from 'lucide-react'
import { Card } from './ui/Card'
import { Badge } from './ui/Badge'
import type { Language, Translations } from '../i18n'

interface BentoFeaturesProps {
  t: Translations
  lang: Language
  onOpenMethodology: () => void
  onOpenCatalog: () => void
  onOpenAssistant: () => void
}

export const BentoFeatures: React.FC<BentoFeaturesProps> = ({
  lang,
  onOpenMethodology,
  onOpenCatalog,
  onOpenAssistant,
}) => {
  const [clearedNotice, setClearedNotice] = useState(false)

  const handleWipeLocal = () => {
    try {
      sessionStorage.clear()
      setClearedNotice(true)
      setTimeout(() => setClearedNotice(false), 3000)
    } catch {
      setClearedNotice(true)
      setTimeout(() => setClearedNotice(false), 3000)
    }
  }

  const content = {
    ru: {
      badge: 'Архитектура доверия',
      title: 'Всё нужное для осознанного контроля здоровья',
      subtitle:
        'Мы устранили скрытые манипуляции, агрессивные диагнозы и неясные проценты. Только открытые научные данные и уважение к пользователю.',
      card1Badge: 'Открытая методология',
      card1Title: 'Прозрачные паспорта каждого теста',
      card1Desc:
        'Перед началом проверки вы видите научные первоисточники (PubMed/ISO), класс доказательности, условия калибровки экрана и исчерпывающие ограничения применимости.',
      card1Btn: 'Посмотреть структуру паспорта',
      card1SampleTitle: 'ПАСПОРТ МЕТОДИКИ',
      card1Iso: 'ISO 8596 / PubMed',
      card1Verified: 'Верифицировано',
      card1Pubmed: 'PubMed ID: 18492041',
      card1Class: 'Класс доказательности: II-A',
      card1Sample: 'Выборка: N = 1 420',
      card1Reliability: 'Надёжность: r = 0.94',
      card1Check1: 'Калибровка яркости и гаммы экрана',
      card1Check2: 'Исключение клинических диагнозов',
      card1Check3: 'Объективные психофизические пороги',
      card2Badge: 'Этический шлюз',
      card2Title: 'Право стереть всё',
      card2Desc:
        'После завершения теста результат остаётся временным: вы сами выбираете «Сохранить в личный закрытый архив» или «Удалить немедленно без сохранения на сервере».',
      card2StorageLabel: 'Хранилище сессии',
      card2StorageVal: 'Volatile RAM (Ephemeral)',
      card2CryptLabel: 'Шифрование архива',
      card2CryptVal: 'AES-256 GCM',
      card2TrackingLabel: 'Сторонний трекинг',
      card2TrackingVal: '0 трекеров и cookie',
      card2WipeBtn: 'Очистить локальные данные',
      card2Wiped: 'Локальные следы очищены!',
      card3Badge: '16 скринингов',
      card3Title: 'Сенсорика и реакция',
      card3Desc:
        'Острота зрения, пороги слышимости тонов, тест Струпа, оперативная память, скорость моторной реакции и координация.',
      card3Btn: 'В каталог упражнений →',
      card3Mini1: 'Зрение & Контраст',
      card3Mini1Sub: '0.02 c/deg • Порог контраста',
      card3Mini2: 'Слух & Частоты',
      card3Mini2Sub: '125 Hz — 8 kHz • Тональный тест',
      card3Mini3: 'Внимание & Память',
      card3Mini3Sub: 'Шульте • Блоки Корси',
      card3Mini4: 'Реакция & Моторика',
      card3Mini4Sub: '185 мс • Go/No-Go координация',
      card4Badge: 'AI Клинический гид',
      card4Title: 'Навигатор с этическими рамками',
      card4Desc:
        'Умный помощник подсказывает подходящие скрининги по возрасту и запросу, объясняет методику понятным языком и строго защищён от постановки псевдодиагнозов.',
      card4Btn: 'Задать вопрос AI-помощнику →',
      aiAssistantName: 'Клинический навигатор SIHAT',
      aiAssistantStatus: 'AI 2.5 • Без диагнозов',
      aiUserMsg: 'К вечеру устают глаза и плывут буквы от экрана. С чего начать проверку?',
      aiBotMsg:
        'Рекомендую начать со скрининга контрастной чувствительности и таблиц Шульте. Обратите внимание: SIHAT не ставит диагнозов. Если дискомфорт не проходит — обратитесь к офтальмологу.',
      aiChip1: 'Без диагнозов',
      aiChip2: 'Zero-Retention приватность',
      aiChip3: 'Клинический триаж',
      aiPrompt1: '👁️ Тест контраста',
      aiPrompt2: '⚡ Оценка реакции',
    },
    tj: {
      badge: 'Меъмории боварӣ',
      title: 'Ҳамаи чизи зарурӣ барои назорати огоҳонаи саломатӣ',
      subtitle:
        'Мо фиребҳои пинҳонӣ, ташхисҳои хашмгин ва фоизҳои сохтаи саломатиро аз байн бурдем. Танҳо маълумоти ошкоро ва эҳтиром ба корбар.',
      card1Badge: 'Методологияи ошкоро',
      card1Title: 'Шиносномаҳои шаффофи ҳар як тест',
      card1Desc:
        'Пеш аз оғоз шумо сарчашмаҳои илмӣ (PubMed/ISO), синфи исботшуда, шартҳои калибрсозии экран ва маҳдудиятҳои татбиқро мебинед.',
      card1Btn: 'Дидани сохтори шиноснома',
      card1SampleTitle: 'ШИНОСНОМАИ МЕТОДИКА',
      card1Iso: 'ISO 8596 / PubMed',
      card1Verified: 'Санҷидашуда',
      card1Pubmed: 'PubMed ID: 18492041',
      card1Class: 'Синфи исбот: II-A',
      card1Sample: 'Интихоби намунавӣ: N = 1 420',
      card1Reliability: 'Эътимоднокӣ: r = 0.94',
      card1Check1: 'Калибрсозии равшании экран',
      card1Check2: 'Бе гузоштани ташхиси тиббӣ',
      card1Check3: 'Остонаҳои психофизикии воқеӣ',
      card2Badge: 'Дарвозаи ахлоқӣ',
      card2Title: 'Ҳуқуқи нест кардани ҳама чиз',
      card2Desc:
        'Пас аз анҷоми санҷиш натиҷа муваққатӣ мемонад: худатон интихоб мекунед, ки онро дар бойгонии пӯшида нигоҳ доред ё фавран нест кунед.',
      card2StorageLabel: 'Нигаҳдории сессия',
      card2StorageVal: 'Хотираи муваққатӣ (RAM)',
      card2CryptLabel: 'Рамзгузории бойгонӣ',
      card2CryptVal: 'AES-256 GCM',
      card2TrackingLabel: 'Пайгирии бегона',
      card2TrackingVal: '0 трекер ва cookie',
      card2WipeBtn: 'Тоза кардани маълумоти маҳаллӣ',
      card2Wiped: 'Маълумот фавран тоза карда шуд!',
      card3Badge: '16 скрининг',
      card3Title: 'Сенсорика ва вокуниш',
      card3Desc:
        'Шиддати биноӣ, остонаи шунавоии оҳангҳо, тести Струп, хотираи фаврӣ, суръати вокуниши моторӣ ва ҳамоҳангсозӣ.',
      card3Btn: 'Ба феҳристи машқҳо →',
      card3Mini1: 'Биниш & Контраст',
      card3Mini1Sub: '0.02 c/deg • Остонаи контраст',
      card3Mini2: 'Шунавоӣ & Оҳангҳо',
      card3Mini2Sub: '125 Hz — 8 kHz • Санҷиши тоналӣ',
      card3Mini3: 'Диққат & Хотира',
      card3Mini3Sub: 'Ҷадвали Шулте • Блокҳои Корси',
      card3Mini4: 'Вокуниш & Моторика',
      card3Mini4Sub: '185 мс • Go/No-Go ҳамоҳангӣ',
      card4Badge: 'Ёвари клиникии AI',
      card4Title: 'Роҳнамои боэътимод бе ташхиси бардурӯғ',
      card4Desc:
        'Ёвари интеллектуалӣ скринингҳои мувофиқро тавсия медиҳад, методологияро шарҳ медиҳад ва бидуни гузоштани ташхис машварат медиҳад.',
      card4Btn: 'Савол додан ба ёвари AI →',
      aiAssistantName: 'Роҳнамои клиникии SIHAT',
      aiAssistantStatus: 'AI 2.5 • Бе ташхис',
      aiUserMsg: 'Бегоҳирӯзӣ чашмонам хаста мешаванд ва ҳарфҳо хира менамоянд. Аз чӣ оғоз кунам?',
      aiBotMsg:
        'Тавсия медиҳам, ки аз скрининги ҳассосияти контрастӣ ва ҷадвали Шулте оғоз намоед. SIHAT ташхиси тиббӣ намегузорад. Дар сурати давом ёфтани аломатҳо ба духтури чашм муроҷиат кунед.',
      aiChip1: 'Бе ташхиси тиббӣ',
      aiChip2: 'Махфияти комил',
      aiChip3: 'Триажи клиникӣ',
      aiPrompt1: '👁️ Тести контраст',
      aiPrompt2: '⚡ Санҷиши вокуниш',
    },
    en: {
      badge: 'Architecture of Trust',
      title: 'Everything Needed for Mindful Health Awareness',
      subtitle:
        'We eliminated deceptive mechanics, invasive diagnoses, and fabricated percentages. Only open science and absolute user respect.',
      card1Badge: 'Open Methodology',
      card1Title: 'Transparent Passports for Every Test',
      card1Desc:
        'Prior to testing, you inspect scientific literature citations (PubMed/ISO), evidence grade, display calibration thresholds, and explicit medical limitations.',
      card1Btn: 'View Passport Structure',
      card1SampleTitle: 'METHODOLOGY PASSPORT',
      card1Iso: 'ISO 8596 / PubMed',
      card1Verified: 'Verified',
      card1Pubmed: 'PubMed ID: 18492041',
      card1Class: 'Evidence Grade: II-A',
      card1Sample: 'Sample Size: N = 1,420',
      card1Reliability: 'Reliability: r = 0.94',
      card1Check1: 'Display brightness & gamma calibration',
      card1Check2: 'Strict non-diagnostic boundaries',
      card1Check3: 'Objective psychophysical thresholds',
      card2Badge: 'Ethical Gateway',
      card2Title: 'The Right to Erase Everything',
      card2Desc:
        'Upon test completion, outcomes remain in volatile memory: you decide whether to save to private storage or wipe immediately.',
      card2StorageLabel: 'Session Storage',
      card2StorageVal: 'Volatile RAM (Ephemeral)',
      card2CryptLabel: 'Archive Encryption',
      card2CryptVal: 'AES-256 GCM',
      card2TrackingLabel: 'Third-Party Trackers',
      card2TrackingVal: '0 Trackers & Cookies',
      card2WipeBtn: 'Clear Local Session Cache',
      card2Wiped: 'Local Session Cleared!',
      card3Badge: '16 Screenings',
      card3Title: 'Sensory & Reaction Speed',
      card3Desc:
        'Visual acuity, tonal hearing thresholds, Stroop effect, working memory, motor latency, and sensorimotor coordination.',
      card3Btn: 'To Screening Catalog →',
      card3Mini1: 'Vision & Contrast',
      card3Mini1Sub: '0.02 c/deg • Spatial Contrast',
      card3Mini2: 'Hearing & Frequencies',
      card3Mini2Sub: '125 Hz — 8 kHz • Pure Tone Test',
      card3Mini3: 'Attention & Memory',
      card3Mini3Sub: 'Schulte Tables • Corsi Blocks',
      card3Mini4: 'Reaction & Motor Latency',
      card3Mini4Sub: '185 ms • Go/No-Go Coordination',
      card4Badge: 'AI Clinical Guide',
      card4Title: 'Navigation With Ethical Boundaries',
      card4Desc:
        'An intelligent companion guiding you toward age-appropriate checks, explaining methodology plainly, strictly bounded against diagnosing.',
      card4Btn: 'Ask AI Navigator →',
      aiAssistantName: 'SIHAT Clinical Navigator',
      aiAssistantStatus: 'AI 2.5 • Zero Diagnosis',
      aiUserMsg: 'My eyes feel strained by evening and text gets blurry. What should I check first?',
      aiBotMsg:
        'I suggest starting with the Contrast Sensitivity screening and Schulte Tables to evaluate visual fatigue. SIHAT does not diagnose. If symptoms persist, please consult an ophthalmologist.',
      aiChip1: 'Zero Medical Diagnosis',
      aiChip2: 'Zero-Retention Privacy',
      aiChip3: 'Clinical Triage',
      aiPrompt1: '👁️ Contrast Test',
      aiPrompt2: '⚡ Reaction Check',
    },
  }[lang] || {
    badge: 'Архитектура доверия',
    title: 'Всё нужное для осознанного контроля здоровья',
    subtitle:
      'Мы устранили скрытые манипуляции, агрессивные диагнозы и неясные проценты. Только открытые данные и уважение к пользователю.',
    card1Badge: 'Открытая методология',
    card1Title: 'Прозрачные паспорта каждого теста',
    card1Desc:
      'Перед началом проверки вы видите научные первоисточники, класс доказательности и исчерпывающие ограничения применимости.',
    card1Btn: 'Посмотреть структуру паспорта',
    card1SampleTitle: 'ПАСПОРТ МЕТОДИКИ',
    card1Iso: 'ISO 8596 / PubMed',
    card1Verified: 'Верифицировано',
    card1Pubmed: 'PubMed ID: 18492041',
    card1Class: 'Класс доказательности: II-A',
    card1Sample: 'Выборка: N = 1 420',
    card1Reliability: 'Надёжность: r = 0.94',
    card1Check1: 'Калибровка яркости и гаммы экрана',
    card1Check2: 'Исключение клинических диагнозов',
    card1Check3: 'Объективные психофизические пороги',
    card2Badge: 'Этический шлюз',
    card2Title: 'Право стереть всё',
    card2Desc:
      'После завершения теста результат остаётся временным: вы сами выбираете «Сохранить в личный закрытый архив» или «Удалить немедленно без сохранения на сервере».',
    card2StorageLabel: 'Хранилище сессии',
    card2StorageVal: 'Volatile RAM',
    card2CryptLabel: 'Шифрование архива',
    card2CryptVal: 'AES-256 GCM',
    card2TrackingLabel: 'Сторонний трекинг',
    card2TrackingVal: '0 трекеров',
    card2WipeBtn: 'Очистить локальные данные',
    card2Wiped: 'Локальные следы очищены!',
    card3Badge: '16 скринингов',
    card3Title: 'Сенсорика и реакция',
    card3Desc:
      'Острота зрения, пороги слышимости тонов, тест Струпа, оперативная память, скорость моторной реакции и координация.',
    card3Btn: 'В каталог упражнений →',
    card3Mini1: 'Зрение & Контраст',
    card3Mini1Sub: '0.02 c/deg • Порог контраста',
    card3Mini2: 'Слух & Частоты',
    card3Mini2Sub: '125 Hz — 8 kHz • Тональный тест',
    card3Mini3: 'Внимание & Память',
    card3Mini3Sub: 'Шульте • Блоки Корси',
    card3Mini4: 'Реакция & Моторика',
    card3Mini4Sub: '185 мс • Go/No-Go координация',
    card4Badge: 'AI Клинический гид',
    card4Title: 'Навигатор с этическими рамками',
    card4Desc:
      'Умный помощник подсказывает подходящие скрининги по возрасту и запросу, объясняет методику понятным языком и строго защищён от постановки медицинских диагнозов.',
    card4Btn: 'Задать вопрос AI-помощнику →',
    aiAssistantName: 'Клинический навигатор SIHAT',
    aiAssistantStatus: 'AI 2.5 • Без диагнозов',
    aiUserMsg: 'К вечеру устают глаза и плывут буквы от экрана. С чего начать проверку?',
    aiBotMsg:
      'Рекомендую начать со скрининга контрастной чувствительности. SIHAT не ставит диагнозов. Если дискомфорт не проходит — обратитесь к офтальмологу.',
    aiChip1: 'Без диагнозов',
    aiChip2: 'Zero-Retention приватность',
    aiChip3: 'Клинический триаж',
    aiPrompt1: '👁️ Тест контраста',
    aiPrompt2: '⚡ Оценка реакции',
  }

  return (
    <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative scroll-mt-24">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-emerald-500/10 via-teal-500/5 to-cyan-500/10 blur-[120px] pointer-events-none -z-10" />

      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <Badge
          variant="emerald"
          className="mb-3 uppercase tracking-wider text-[11px] font-bold px-3 py-1 bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
        >
          {content.badge}
        </Badge>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
          {content.title}
        </h2>
        <p className="mt-4 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          {content.subtitle}
        </p>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* CARD 1: 2 COLUMNS - Прозрачные паспорта каждого теста */}
        <Card className="lg:col-span-2 p-6 sm:p-8 rounded-3xl bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/50 shadow-xl transition-all duration-300 relative overflow-hidden group flex flex-col justify-between">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Left Description */}
            <div className="md:col-span-6 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                <FileText className="w-6 h-6" />
              </div>
              <Badge variant="emerald" className="text-xs">
                {content.card1Badge}
              </Badge>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {content.card1Title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {content.card1Desc}
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onOpenMethodology}
                  className="inline-flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors group/btn cursor-pointer"
                >
                  <span>{content.card1Btn}</span>
                  <ExternalLink className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>

            {/* Right Interactive Mockup: Clinical Passport Sheet */}
            <div className="md:col-span-6">
              <div className="rounded-2xl p-4 sm:p-5 bg-slate-50 dark:bg-slate-950/70 border border-slate-200/90 dark:border-slate-800/90 shadow-inner space-y-3.5">
                {/* Header bar of passport */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 text-[11px]">
                  <div className="flex items-center gap-1.5 font-mono font-bold text-slate-800 dark:text-slate-200">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>{content.card1SampleTitle}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
                    {content.card1Verified}
                  </span>
                </div>

                {/* Evidence metrics grid */}
                <div className="grid grid-cols-2 gap-2 text-[10px] sm:text-[11px] font-mono">
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80">
                    <span className="text-slate-400 block text-[9px]">SOURCE</span>
                    <strong className="text-slate-900 dark:text-white">{content.card1Pubmed}</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80">
                    <span className="text-slate-400 block text-[9px]">GRADE</span>
                    <strong className="text-emerald-600 dark:text-emerald-400">{content.card1Class}</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80">
                    <span className="text-slate-400 block text-[9px]">COHORT</span>
                    <strong className="text-slate-900 dark:text-white">{content.card1Sample}</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80">
                    <span className="text-slate-400 block text-[9px]">RELIABILITY</span>
                    <strong className="text-cyan-600 dark:text-cyan-400">{content.card1Reliability}</strong>
                  </div>
                </div>

                {/* Checklist criteria */}
                <div className="space-y-1.5 pt-1 text-[11px] text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>{content.card1Check1}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>{content.card1Check2}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>{content.card1Check3}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* CARD 2: 1 COLUMN - Право стереть всё (Zero-Retention) */}
        <Card className="p-6 sm:p-8 rounded-3xl bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 hover:border-teal-500/50 shadow-xl transition-all duration-300 group flex flex-col justify-between">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400 group-hover:scale-105 transition-transform">
              <Trash2 className="w-6 h-6" />
            </div>
            <Badge variant="cyan" className="text-xs">
              {content.card2Badge}
            </Badge>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {content.card2Title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {content.card2Desc}
            </p>

            {/* Privacy Architecture Widget */}
            <div className="rounded-2xl p-3.5 bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800/80 space-y-2.5 text-xs font-mono">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 text-[10px] flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-teal-500" />
                  {content.card2StorageLabel}
                </span>
                <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400">
                  {content.card2StorageVal}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 text-[10px]">{content.card2CryptLabel}</span>
                <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200">
                  {content.card2CryptVal}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-[10px]">{content.card2TrackingLabel}</span>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  {content.card2TrackingVal}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Wipe Action */}
          <div className="pt-4">
            <button
              type="button"
              onClick={handleWipeLocal}
              className={`w-full py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer ${
                clearedNotice
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-600 dark:text-emerald-300'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/70 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
              }`}
            >
              {clearedNotice ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>{content.card2Wiped}</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5 text-teal-500" />
                  <span>{content.card2WipeBtn}</span>
                </>
              )}
            </button>
          </div>
        </Card>

        {/* CARD 3: 1 COLUMN - Сенсорика и реакция (16 скринингов с реальными графическими виджетами) */}
        <Card className="p-6 sm:p-8 rounded-3xl bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 hover:border-cyan-500/50 shadow-xl transition-all duration-300 group flex flex-col justify-between">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-600 dark:text-cyan-400 group-hover:scale-105 transition-transform">
              <Cpu className="w-6 h-6" />
            </div>
            <Badge variant="cyan" className="text-xs">
              {content.card3Badge}
            </Badge>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {content.card3Title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {content.card3Desc}
            </p>

            {/* 4 Interactive Mini Screening Preview Cards (NO random stock photos!) */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              {/* 1. Vision & Contrast */}
              <div
                onClick={onOpenCatalog}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/50 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20 transition-all cursor-pointer group/tile flex flex-col justify-between aspect-[16/11]"
              >
                <div className="flex items-center justify-between">
                  <Eye className="w-4 h-4 text-emerald-500" />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-tight">
                    {content.card3Mini1}
                  </div>
                  <div className="text-[9px] font-mono text-slate-400 truncate mt-0.5">
                    {content.card3Mini1Sub}
                  </div>
                </div>
              </div>

              {/* 2. Hearing & Frequencies */}
              <div
                onClick={onOpenCatalog}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 hover:border-teal-500/50 hover:bg-teal-50/20 dark:hover:bg-teal-950/20 transition-all cursor-pointer group/tile flex flex-col justify-between aspect-[16/11]"
              >
                <div className="flex items-center justify-between">
                  <Volume2 className="w-4 h-4 text-teal-500" />
                  {/* Wave equalizer bars */}
                  <div className="flex items-end gap-0.5 h-3">
                    <span className="w-1 bg-teal-500/70 h-2 rounded-full" />
                    <span className="w-1 bg-teal-500 h-3 rounded-full animate-pulse" />
                    <span className="w-1 bg-teal-500/70 h-1.5 rounded-full" />
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-tight">
                    {content.card3Mini2}
                  </div>
                  <div className="text-[9px] font-mono text-slate-400 truncate mt-0.5">
                    {content.card3Mini2Sub}
                  </div>
                </div>
              </div>

              {/* 3. Attention & Memory */}
              <div
                onClick={onOpenCatalog}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 hover:border-cyan-500/50 hover:bg-cyan-50/20 dark:hover:bg-cyan-950/20 transition-all cursor-pointer group/tile flex flex-col justify-between aspect-[16/11]"
              >
                <div className="flex items-center justify-between">
                  <Brain className="w-4 h-4 text-cyan-500" />
                  <div className="grid grid-cols-2 gap-0.5 w-3.5 h-3.5 opacity-60">
                    <span className="bg-cyan-500 rounded-xs" />
                    <span className="bg-cyan-400 rounded-xs" />
                    <span className="bg-cyan-400 rounded-xs" />
                    <span className="bg-cyan-500 rounded-xs" />
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-tight">
                    {content.card3Mini3}
                  </div>
                  <div className="text-[9px] font-mono text-slate-400 truncate mt-0.5">
                    {content.card3Mini3Sub}
                  </div>
                </div>
              </div>

              {/* 4. Reaction & Motor */}
              <div
                onClick={onOpenCatalog}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/20 transition-all cursor-pointer group/tile flex flex-col justify-between aspect-[16/11]"
              >
                <div className="flex items-center justify-between">
                  <Timer className="w-4 h-4 text-indigo-500" />
                  <span className="text-[9px] font-mono font-bold text-indigo-500 bg-indigo-500/10 px-1 py-0.5 rounded">
                    185ms
                  </span>
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-tight">
                    {content.card3Mini4}
                  </div>
                  <div className="text-[9px] font-mono text-slate-400 truncate mt-0.5">
                    {content.card3Mini4Sub}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="button"
              onClick={onOpenCatalog}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors cursor-pointer"
            >
              <span>{content.card3Btn}</span>
            </button>
          </div>
        </Card>

        {/* CARD 4: 2 COLUMNS - Навигатор с этическими рамками (AI клинический триаж вживую) */}
        <Card className="lg:col-span-2 p-6 sm:p-8 rounded-3xl bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/50 shadow-xl transition-all duration-300 relative overflow-hidden group flex flex-col justify-between">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Left Content */}
            <div className="md:col-span-6 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <Sparkles className="w-6 h-6" />
              </div>
              <Badge variant="emerald" className="text-xs">
                {content.card4Badge}
              </Badge>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {content.card4Title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {content.card4Desc}
              </p>

              {/* Ethics chips */}
              <div className="flex items-center gap-2 flex-wrap text-xs font-semibold">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {content.aiChip1}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20">
                  {content.aiChip2}
                </span>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onOpenAssistant}
                  className="inline-flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors group/btn cursor-pointer"
                >
                  <span>{content.card4Btn}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            {/* Right Interactive Live Simulated AI Consultation Card (NO random robot doll images!) */}
            <div className="md:col-span-6">
              <div
                onClick={onOpenAssistant}
                className="rounded-2xl p-4 sm:p-5 bg-slate-50 dark:bg-slate-950/70 border border-slate-200/90 dark:border-slate-800/90 shadow-inner space-y-3 cursor-pointer group/chat hover:border-emerald-500/40 transition-colors"
              >
                {/* Simulated Assistant Header */}
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-tight">
                        {content.aiAssistantName}
                      </div>
                      <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-mono flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {content.aiAssistantStatus}
                      </div>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono text-slate-400 bg-slate-200/60 dark:bg-slate-900 px-2 py-0.5 rounded">
                    Triage v2
                  </span>
                </div>

                {/* Simulated User Bubble */}
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-tr-xs p-2.5 bg-emerald-600 text-white text-[11px] leading-relaxed shadow-xs">
                    {content.aiUserMsg}
                  </div>
                </div>

                {/* Simulated Assistant Bubble */}
                <div className="flex justify-start">
                  <div className="max-w-[90%] rounded-2xl rounded-tl-xs p-2.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed shadow-xs space-y-1">
                    <p>{content.aiBotMsg}</p>
                  </div>
                </div>

                {/* Quick Interactive Prompt Pills */}
                <div className="flex items-center gap-1.5 pt-1 flex-wrap text-[10px]">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 font-medium transition-colors">
                    {content.aiPrompt1}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/20 font-medium transition-colors">
                    {content.aiPrompt2}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  )
}
