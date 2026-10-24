import React, { useState } from 'react'
import {
  ShieldCheck,
  AlertTriangle,
  Sliders,
  ArrowRight,
  Award,
  Search,
  BookOpen,
} from 'lucide-react'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import type { Language } from '../i18n'
import type { TestItem } from '../types'

interface MethodologyPageProps {
  tests: TestItem[]
  currentSlug: string | null
  lang: Language
  token: string
  onNavigate: (route: string) => void
  onStartAttempt: (test: TestItem) => void
  onOpenAuth: () => void
}

export const MethodologyPage: React.FC<MethodologyPageProps> = ({
  tests,
  currentSlug,
  lang,
  onNavigate,
  onStartAttempt,
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  // Filter only published / valid tests
  const approvedTests = tests.filter((t) => t.status !== 'draft')

  const t = {
    ru: {
      libraryTitle: 'Библиотека паспортов методик SIHAT',
      librarySubtitle: 'Полный реестр открытых научно-обоснованных спецификаций, психофизиологических калибровок и ограничений всех 16 утверждённых скринингов.',
      searchPlaceholder: 'Поиск по названию методики или стандарту...',
      allCategories: 'Все домены',
      viewPassport: 'Паспорт методики',
      startScreening: 'Запустить скрининг',
      backToLibrary: '← Вернуться в библиотеку методик',
      backCatalog: 'Назад в каталог',
      breadcrumbRoot: 'Главная',
      breadcrumbLibrary: 'Методологии',
      breadcrumbPassport: 'Паспорт методики',
      switcherTitle: 'Выберите скрининг для изучения паспорта:',
      version: 'Версия протокола',
      validatedBadge: 'Доказательная медицина • Класс A (ISO / WHO)',
      digitalBadge: 'Цифровой психофизиологический скрининг',
      evidenceTitle: 'Научная база, доказательность и стандартизация',
      licenseTitle: 'Лицензирование и открытый доступ:',
      licenseDesc: 'Creative Commons CC BY-NC-SA 4.0 • Открытый протокол доказательного самоконтроля.',
      conditionsTitle: 'Протокол калибровки оборудования и внешних условий',
      condLightTitle: 'Освещение рабочего места',
      condLightDesc: 'Стабильный рассеянный свет (300–500 Люкс) без прямых бликов на дисплее.',
      condDistanceTitle: 'Дистанция и угол обзора',
      condDistanceDesc: 'Фиксированное расстояние 50–60 см от экрана, монитор на уровне глаз под углом 90°.',
      condDisplayTitle: 'Дисплей и рендеринг',
      condDisplayDesc: 'Цветовой охват sRGB, частота от 60 Гц. Рекомендуется отключить TrueTone/NightShift.',
      condAcousticTitle: 'Сенсорный покой',
      condAcousticDesc: 'Отсутствие громких фоновых шумов (>45 дБ) и посторонних отвлекающих факторов.',
      limitsTitle: 'Клинические ограничения и этическое уведомление',
      limitsDesc: 'Данный скрининг является цифровым психофизиологическим тестом функционального самоконтроля. Он не является клиническим диагнозом, не заменяет очного медицинского осмотра и не подтверждает наличие или отсутствие патологий в соответствии с МКБ-10/МКБ-11.',
      footerNotice: 'Все результаты обрабатываются строго локально с вашим правом на немедленное удаление (Zero-retention).',
    },
    tj: {
      libraryTitle: 'Осорхонаи шиносномаҳои методии SIHAT',
      librarySubtitle: 'Феҳристи пурраи методологияҳои исботшудаи илмӣ ва меъёрҳои калибровка барои 16 санҷиши тасдиқшуда.',
      searchPlaceholder: 'Ҷустуҷӯи метод...',
      allCategories: 'Ҳамаи соҳаҳо',
      viewPassport: 'Шиносномаи методӣ',
      startScreening: 'Оғози санҷиш',
      backToLibrary: '← Баргаштан ба осорхонаи методҳо',
      backCatalog: 'Баргаштан ба феҳрист',
      breadcrumbRoot: 'Асосӣ',
      breadcrumbLibrary: 'Методологияҳо',
      breadcrumbPassport: 'Шиносномаи методӣ',
      switcherTitle: 'Санҷишро барои дидани шиноснома интихоб кунед:',
      version: 'Версияи протокол',
      validatedBadge: 'Тибби исботшуда • Синфи А (ISO / WHO)',
      digitalBadge: 'Скрининги рақамии психофизиологӣ',
      evidenceTitle: 'Пойгоҳи илмӣ ва стандартизатсия',
      licenseTitle: 'Иҷозатнома ва дастрасии кушода:',
      licenseDesc: 'Creative Commons CC BY-NC-SA 4.0 • Протоколи кушодаи илмӣ.',
      conditionsTitle: 'Протоколи калибровка ва шароити беруна',
      condLightTitle: 'Рӯшноии ҷои кор',
      condLightDesc: 'Нӯри муътадил (300–500 Люкс) бидуни инъикоси чароғ дар экран.',
      condDistanceTitle: 'Масофа ва кунҷи дид',
      condDistanceDesc: 'Масофаи 50–60 см аз экран, монитор дар баробари чашм дар кунҷи 90°.',
      condDisplayTitle: 'Дисплей ва тасвир',
      condDisplayDesc: 'Фарогирии sRGB, аз 60 Гц баландтар. Хомӯш кардани TrueTone.',
      condAcousticTitle: 'Оромии сенсорӣ',
      condAcousticDesc: 'Набудани садоҳои баланди нохуш (>45 дБ).',
      limitsTitle: 'Маҳдудиятҳои клиникӣ ва огоҳии ахлоқӣ',
      limitsDesc: 'Ин санҷиш танҳо хусусияти омӯзишӣ дорад ва ташхиси тиббӣ намебошад.',
      footerNotice: 'Ҳамаи натиҷаҳо таҳти низоми Zero-retention коркард мешаванд.',
    },
    en: {
      libraryTitle: 'SIHAT Methodology Passports Library',
      librarySubtitle: 'Complete evidence-based repository of psychophysiological standards, calibration specifications, and clinical limitations across all 16 approved screenings.',
      searchPlaceholder: 'Search by methodology name or standard...',
      allCategories: 'All Domains',
      viewPassport: 'View Passport',
      startScreening: 'Start Screening',
      backToLibrary: '← Back to Methodology Library',
      backCatalog: 'Back to Catalog',
      breadcrumbRoot: 'Home',
      breadcrumbLibrary: 'Methodologies',
      breadcrumbPassport: 'Methodology Passport',
      switcherTitle: 'Select screening to examine methodology passport:',
      version: 'Protocol Version',
      validatedBadge: 'Evidence-Based • Class A (ISO / WHO)',
      digitalBadge: 'Digital Psychophysiological Screening',
      evidenceTitle: 'Scientific Foundation & Standardization',
      licenseTitle: 'Licensing & Open Access:',
      licenseDesc: 'Creative Commons CC BY-NC-SA 4.0 • Open science self-monitoring protocol.',
      conditionsTitle: 'Hardware Calibration & Environmental Conditions',
      condLightTitle: 'Ambient Lighting',
      condLightDesc: 'Stable diffused light (300–500 Lux) without direct screen glare.',
      condDistanceTitle: 'Distance & Viewing Angle',
      condDistanceDesc: 'Fixed 50–60 cm viewing distance, screen at eye level at 90° angle.',
      condDisplayTitle: 'Display & Rendering',
      condDisplayDesc: 'sRGB gamut, refresh rate ≥ 60 Hz. Disable TrueTone / NightShift.',
      condAcousticTitle: 'Sensory Baseline',
      condAcousticDesc: 'Absence of loud ambient noise (>45 dB) and external distractions.',
      limitsTitle: 'Clinical Boundaries & Ethical Disclosure',
      limitsDesc: 'This screening is an educational digital tool for self-monitoring. It does not constitute a medical diagnosis, does not substitute for a clinical consultation, and does not diagnose conditions under ICD-10/ICD-11.',
      footerNotice: 'Zero-retention architecture: results are processed with full user autonomy.',
    },
  }[lang]

  // If NO individual slug is selected, render the Library Catalog View
  if (!currentSlug) {
    const categories = Array.from(new Set(approvedTests.map((t) => t.category_id).filter(Boolean)))
    const filteredTests = approvedTests.filter((test) => {
      const loc = test.localizations?.[lang] || test.localizations?.ru || test.localizations?.en
      const title = loc?.title || test.slug
      const standard = test.methodology?.name || ''
      const matchesSearch =
        title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        standard.toLowerCase().includes(searchQuery.toLowerCase()) ||
        test.slug.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCat = categoryFilter === 'all' || test.category_id === categoryFilter
      return matchesSearch && matchesCat
    })

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-in fade-in duration-300">
        {/* Header Hero */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#17A884]/15 border border-[#17A884]/30 text-xs font-bold text-[#103D35] dark:text-[#2EC4A7] mb-4">
            <BookOpen className="w-4 h-4" />
            <span>16 Утверждённых Паспортов Методик</span>
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
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-hidden focus:border-[#17A884] shadow-xs"
            />
          </div>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                categoryFilter === 'all'
                  ? 'bg-[#103D35] text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-[#17A884]/40'
              }`}
            >
              {t.allCategories}
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-[#103D35] text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-[#17A884]/40'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid of Passports */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTests.map((test) => {
            const loc = test.localizations?.[lang] || test.localizations?.ru || test.localizations?.en
            const title = loc?.title || test.slug
            const passport = test.methodology
            return (
              <div
                key={test.id || test.slug}
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between transition-all hover:border-[#17A884]/50 hover:shadow-2xl"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-mono font-bold text-[#17A884] px-2 py-0.5 rounded-md bg-[#17A884]/10">
                      v{passport?.version || '1.0.0'}
                    </span>
                    <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 text-[10px]">
                      {passport?.evidence_status === 'validated' ? 'ISO Class A' : 'Evidence-Based'}
                    </Badge>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug mb-2">
                    {title}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 mb-4 leading-relaxed">
                    {loc?.description || ''}
                  </p>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 mb-6 space-y-1 text-[11px]">
                    <div className="text-slate-500">
                      Стандарт: <strong className="text-slate-700 dark:text-slate-300">{passport?.name || title}</strong>
                    </div>
                    <div className="text-slate-500 line-clamp-1">
                      Базис: <span className="italic">{passport?.source || 'Open Science'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
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
      </div>
    )
  }

  // INDIVIDUAL PASSPORT VIEW
  const activeTest = approvedTests.find((t) => t.slug === currentSlug) || approvedTests[0]
  const loc =
    activeTest?.localizations?.[lang] ||
    activeTest?.localizations?.ru ||
    activeTest?.localizations?.en
  const title = loc?.title || activeTest?.slug || 'Скрининг'
  const desc = loc?.description || ''
  const methodology = activeTest?.methodology

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-in fade-in duration-300">
      {/* Top Breadcrumb & Return to Library */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <button
          onClick={() => onNavigate('methodologies')}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#17A884] transition-colors cursor-pointer"
        >
          <span>{t.backToLibrary}</span>
        </button>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 bg-emerald-500/5">
            <ShieldCheck className="w-3.5 h-3.5 mr-1" />
            <span>
              {methodology?.evidence_status === 'validated'
                ? t.validatedBadge
                : t.digitalBadge}
            </span>
          </Badge>
          <span className="text-xs font-mono font-bold text-slate-400">
            {t.version} {methodology?.version || '1.0.0'}
          </span>
        </div>
      </div>

      {/* Header Banner */}
      <div className="bg-gradient-to-br from-[#103D35] to-[#17A884] rounded-3xl p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden mb-8">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-xs font-semibold mb-3 border border-white/20">
            <BookOpen className="w-3.5 h-3.5 text-[#2EC4A7]" />
            <span>Официальный паспорт клинической методики</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">{title}</h1>
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
          </div>
        </div>
      </div>

      {/* Detailed Specifications Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Evidence & Standard */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Award className="w-5 h-5 text-[#17A884]" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {t.evidenceTitle}
            </h3>
          </div>
          <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <span className="font-bold text-slate-900 dark:text-white block mb-1">
                Стандарт протокола:
              </span>
              <span>{methodology?.name || title} (v{methodology?.version || '1.0.0'})</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <span className="font-bold text-slate-900 dark:text-white block mb-1">
                Научный первоисточник:
              </span>
              <span>{methodology?.source || 'Открытые рецензируемые спецификации психофизиологии'}</span>
            </div>
            <p className="text-[11px] text-slate-400 italic pt-2">{t.licenseDesc}</p>
          </div>
        </div>

        {/* Environmental Conditions */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Sliders className="w-5 h-5 text-[#17A884]" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {t.conditionsTitle}
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <span className="font-bold text-slate-900 dark:text-white block mb-0.5">
                {t.condLightTitle}
              </span>
              <span className="text-slate-500 text-[11px]">{t.condLightDesc}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <span className="font-bold text-slate-900 dark:text-white block mb-0.5">
                {t.condDistanceTitle}
              </span>
              <span className="text-slate-500 text-[11px]">{t.condDistanceDesc}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <span className="font-bold text-slate-900 dark:text-white block mb-0.5">
                {t.condDisplayTitle}
              </span>
              <span className="text-slate-500 text-[11px]">{t.condDisplayDesc}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
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
