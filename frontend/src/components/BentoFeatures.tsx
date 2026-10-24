import React from 'react'
import { FileText, Trash2, Cpu, Sparkles, ExternalLink } from 'lucide-react'
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
  const content = {
    ru: {
      badge: 'Архитектура доверия',
      title: 'Всё нужное для осознанного контроля здоровья',
      subtitle: 'Мы устранили скрытые манипуляции, агрессивные диагнозы и неясные проценты. Только открытые данные и уважение к пользователю.',
      card1Badge: 'Открытая методология',
      card1Title: 'Прозрачные паспорта каждого теста',
      card1Desc: 'Перед началом проверки вы видите научные первоисточники (PubMed/ISO), класс доказательности, целевую выборку, условия калибровки экрана и исчерпывающие ограничения применимости.',
      card1Btn: 'Посмотреть структуру паспорта',
      card2Badge: 'Этический шлюз',
      card2Title: 'Право стереть всё',
      card2Desc: 'После завершения теста результат остаётся временным: вы сами выбираете «Сохранить в личный закрытый архив» или «Удалить немедленно без сохранения на сервере».',
      card3Badge: '15 категорий',
      card3Title: 'Сенсорика и реакция',
      card3Desc: 'Острота зрения, пороги слышимости тонов, тест Струпа, оперативная память, скорость моторной реакции и динамическая координация.',
      card3Btn: 'В каталог упражнений →',
      card4Badge: 'AI Клинический гид',
      card4Title: 'Навигатор с этическими рамками',
      card4Desc: 'Умный помощник подсказывает подходящие скрининги по возрасту и запросу, объясняет методику понятным языком и строго защищён от постановки медицинских диагнозов.',
      card4Btn: 'Задать вопрос AI-помощнику →',
    },
    tj: {
      badge: 'Меъмории боварӣ',
      title: 'Ҳамаи чизи зарурӣ барои назорати огоҳонаи саломатӣ',
      subtitle: 'Мо фиребҳои пинҳонӣ, ташхисҳои хашмгин ва фоизҳои сохтаи саломатиро аз байн бурдем. Танҳо маълумоти ошкоро ва эҳтиром ба корбар.',
      card1Badge: 'Методологияи ошкоро',
      card1Title: 'Шиносномаҳои шаффофи ҳар як тест',
      card1Desc: 'Пеш аз оғоз шумо сарчашмаҳои илмӣ (PubMed/ISO), синфи исботшуда, шартҳои калибрсозии экран ва маҳдудиятҳои татбиқро мебинед.',
      card1Btn: 'Дидани сохтори шиноснома',
      card2Badge: 'Дарвозаи ахлоқӣ',
      card2Title: 'Ҳуқуқи нест кардани ҳама чиз',
      card2Desc: 'Пас аз анҷоми санҷиш натиҷа муваққатӣ мемонад: худатон интихоб мекунед, ки онро дар бойгонии пӯшида нигоҳ доред ё фавран нест кунед.',
      card3Badge: '15 категория',
      card3Title: 'Сенсорика ва вокуниш',
      card3Desc: 'Шиддати биноӣ, остонаи шунавоии оҳангҳо, тести Струп, хотираи фаврӣ, суръати вокуниши моторӣ ва ҳамоҳангсозӣ.',
      card3Btn: 'Ба феҳристи машқҳо →',
      card4Badge: 'Ёвари клиникии AI',
      card4Title: 'Роҳнамои боэътимод бе ташхиси бардурӯғ',
      card4Desc: 'Ёвари интеллектуалӣ скринингҳои мувофиқро тавсия медиҳад, методологияро шарҳ медиҳад ва бидуни гузоштани ташхис машварат медиҳад.',
      card4Btn: 'Савол додан ба ёвари AI →',
    },
    en: {
      badge: 'Architecture of Trust',
      title: 'Everything Needed for Mindful Health Awareness',
      subtitle: 'We eliminated deceptive mechanics, invasive diagnoses, and fabricated percentages. Only open science and user respect.',
      card1Badge: 'Open Methodology',
      card1Title: 'Transparent Passports for Every Test',
      card1Desc: 'Prior to testing, you inspect scientific literature citations (PubMed/ISO), evidence grade, display calibration thresholds, and explicit medical limitations.',
      card1Btn: 'View Passport Structure',
      card2Badge: 'Ethical Gateway',
      card2Title: 'The Right to Erase Everything',
      card2Desc: 'Upon test completion, outcomes remain in volatile memory: you decide whether to save to private storage or wipe immediately.',
      card3Badge: '15 Categories',
      card3Title: 'Sensory & Reaction Speed',
      card3Desc: 'Visual acuity, tonal hearing thresholds, Stroop effect, working memory, motor latency, and dynamic sensorimotor coordination.',
      card3Btn: 'To Screening Catalog →',
      card4Badge: 'AI Clinical Guide',
      card4Title: 'Navigation With Ethical Boundaries',
      card4Desc: 'An intelligent companion guiding you toward age-appropriate checks, explaining methodology plainly, strictly bounded against diagnosing.',
      card4Btn: 'Ask AI Navigator →',
    },
  }[lang] || {
    badge: 'Architecture of Trust',
    title: 'Everything Needed for Mindful Health Awareness',
    subtitle: 'We eliminated deceptive mechanics, invasive diagnoses, and fabricated percentages. Only open science and user respect.',
    card1Badge: 'Open Methodology',
    card1Title: 'Transparent Passports for Every Test',
    card1Desc: 'Prior to testing, you inspect scientific literature citations (PubMed/ISO), evidence grade, display calibration thresholds, and explicit medical limitations.',
    card1Btn: 'View Passport Structure',
    card2Badge: 'Ethical Gateway',
    card2Title: 'The Right to Erase Everything',
    card2Desc: 'Upon test completion, outcomes remain in volatile memory: you decide whether to save to private storage or wipe immediately.',
    card3Badge: '15 Categories',
    card3Title: 'Sensory & Reaction Speed',
    card3Desc: 'Visual acuity, tonal hearing thresholds, Stroop effect, working memory, motor latency, and dynamic sensorimotor coordination.',
    card3Btn: 'To Screening Catalog →',
    card4Badge: 'AI Clinical Guide',
    card4Title: 'Navigation With Ethical Boundaries',
    card4Desc: 'An intelligent companion guiding you toward age-appropriate checks, explaining methodology plainly, strictly bounded against diagnosing.',
    card4Btn: 'Ask AI Navigator →',
  }

  return (
    <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center max-w-3xl mx-auto mb-14">
        <Badge variant="emerald" className="mb-3 uppercase tracking-wider text-[11px] font-bold">
          {content.badge}
        </Badge>
        <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
          {content.title}
        </h2>
        <p className="mt-3 text-base text-zinc-600 dark:text-zinc-400">
          {content.subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: 2 columns wide */}
        <Card className="md:col-span-2 p-8 hover:border-emerald-500/50 hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
            <FileText className="w-6 h-6" />
          </div>
          <Badge variant="emerald" className="mb-3">
            {content.card1Badge}
          </Badge>
          <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-3">
            {content.card1Title}
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-xl mb-6">
            {content.card1Desc}
          </p>
          <button
            onClick={onOpenMethodology}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            <span>{content.card1Btn}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </Card>

        {/* Card 2: 1 column */}
        <Card className="p-8 hover:border-emerald-500/50 hover:shadow-lg transition-all duration-300 group">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400 mb-6 group-hover:scale-110 transition-transform">
            <Trash2 className="w-6 h-6" />
          </div>
          <Badge variant="cyan" className="mb-3">
            {content.card2Badge}
          </Badge>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-3">
            {content.card2Title}
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {content.card2Desc}
          </p>
        </Card>

        {/* Card 3: 1 column */}
        <Card className="p-8 hover:border-emerald-500/50 hover:shadow-lg transition-all duration-300 group">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-600 dark:text-cyan-400 mb-6 group-hover:scale-110 transition-transform">
            <Cpu className="w-6 h-6" />
          </div>
          <Badge variant="cyan" className="mb-3">
            {content.card3Badge}
          </Badge>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-3">
            {content.card3Title}
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {content.card3Desc}
          </p>
          <button
            onClick={onOpenCatalog}
            className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            <span>{content.card3Btn}</span>
          </button>
        </Card>

        {/* Card 4: 2 columns wide */}
        <Card className="md:col-span-2 p-8 hover:border-emerald-500/50 hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
            <Sparkles className="w-6 h-6" />
          </div>
          <Badge variant="emerald" className="mb-3">
            {content.card4Badge}
          </Badge>
          <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-3">
            {content.card4Title}
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-xl mb-6">
            {content.card4Desc}
          </p>
          <button
            onClick={onOpenAssistant}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            <span>{content.card4Btn}</span>
          </button>
        </Card>
      </div>
    </section>
  )
}
