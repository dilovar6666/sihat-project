import React, { useState, useMemo } from 'react'
import { Search, Eye, Volume2, Brain, Zap, Clock, UserCheck, ChevronRight, FileText } from 'lucide-react'
import { Card } from './ui/Card'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import type { Language, Translations } from '../i18n'
import type { TestItem, Category } from '../types'
import { getTestCover, getTestAlt, getTestPhotoCredit } from '../lib/testImages'

interface CatalogSectionProps {
  t: Translations
  lang: Language
  tests: TestItem[]
  categories: Category[]
  onSelectTest: (test: TestItem) => void
  onStartAttempt: (test: TestItem) => void
}

export const CatalogSection: React.FC<CatalogSectionProps> = ({
  t,
  lang,
  tests,
  onSelectTest,
  onStartAttempt,
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCat, setSelectedCat] = useState<string>('all')

  const categoryChips = [
    { id: 'all', label: lang === 'ru' ? 'Все тесты' : lang === 'tj' ? 'Ҳамаи санҷишҳо' : 'All Screenings', icon: Zap },
    { id: 'vision', label: lang === 'ru' ? 'Зрение' : lang === 'tj' ? 'Биноӣ' : 'Vision', icon: Eye },
    { id: 'hearing', label: lang === 'ru' ? 'Слух' : lang === 'tj' ? 'Шунавоӣ' : 'Hearing', icon: Volume2 },
    { id: 'cognitive', label: lang === 'ru' ? 'Внимание и память' : lang === 'tj' ? 'Таваҷҷуҳ ва хотира' : 'Attention & Memory', icon: Brain },
  ]

  // Filter out any unpublished / draft tests safely
  const publishedTests = useMemo(() => {
    return tests.filter((item) => item.status !== 'draft')
  }, [tests])

  const filteredTests = useMemo(() => {
    return publishedTests.filter((item) => {
      const title = item.localizations?.[lang]?.title || item.localizations?.en?.title || item.slug
      const desc = item.localizations?.[lang]?.description || item.localizations?.en?.description || ''
      const matchesSearch =
        searchQuery.trim() === '' ||
        title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.slug.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCat =
        selectedCat === 'all' ||
        item.category_id.toLowerCase().includes(selectedCat.toLowerCase()) ||
        item.slug.toLowerCase().includes(selectedCat.toLowerCase())

      return matchesSearch && matchesCat
    })
  }, [publishedTests, searchQuery, selectedCat, lang])

  return (
    <section id="catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-in fade-in duration-300">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
        <div>
          <Badge variant="emerald" className="mb-2">
            {t.nav?.catalog || (lang === 'tj' ? 'Феҳристи скринингҳо' : lang === 'en' ? 'Screening Catalog' : 'Каталог скринингов')}
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#103D35] dark:text-zinc-50">
            {lang === 'ru' ? 'Программы самопроверки и тренировки' : lang === 'tj' ? 'Барномаҳои санҷиши худӣ ва машқҳо' : 'Screening & Exercise Catalog'}
          </h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
            {lang === 'ru'
              ? 'Выберите направление. Каждая проверка начинается со строгой калибровки и паспорта методики.'
              : lang === 'tj'
              ? 'Самти лозимиро интихоб намоед. Ҳар як санҷиш аз калибровкаи дақиқ ва шиносномаи методӣ оғоз меёбад.'
              : 'Choose a discipline. Every screening begins with strict calibration and a documented methodology passport.'}
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={lang === 'ru' ? 'Поиск по тестам и симптомам...' : lang === 'tj' ? 'Ҷустуҷӯи тестҳо ва нишонаҳо...' : 'Search screenings & symptoms...'}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl liquid-glass-pill text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-[#17A884] transition-all"
          />
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap gap-2 mb-8">
        {categoryChips.map((chip) => {
          const Icon = chip.icon
          const isActive = selectedCat === chip.id
          return (
            <button
              key={chip.id}
              onClick={() => setSelectedCat(chip.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#103D35] text-white shadow-md font-bold'
                  : 'liquid-glass-pill text-zinc-600 dark:text-zinc-400 hover:border-[#17A884]/50 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{chip.label}</span>
            </button>
          )
        })}
      </div>

      {/* Test Cards Grid with Thematic Covers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTests.map((test) => {
          const loc = test.localizations?.[lang]
            || (lang === 'tj' ? test.localizations?.tg : undefined)
            || test.localizations?.ru
            || test.localizations?.en

          const title = loc?.title || test.slug
          const desc = loc?.description || (lang === 'tj' ? 'Амалияи интерактивии таҳлили сенсорӣ бо пойгоҳи кушодаи исботшуда.' : lang === 'en' ? 'Interactive sensory analysis with transparent methodology.' : 'Интерактивная практика сенсорного анализа с открытой доказательной базой.')
          const evidenceStatus = test.methodology?.evidence_status || 'validated'
          const coverUrl = getTestCover(test.slug)
          const altText = getTestAlt(test.slug, lang)
          const credit = getTestPhotoCredit(test.slug)

          return (
            <Card
              key={test.id || test.slug}
              className="p-5 flex flex-col justify-between hover:border-[#17A884]/60 hover:shadow-xl transition-all duration-300 group overflow-hidden bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800"
            >
              <div>
                {/* Dedicated Thematic Cover Image */}
                <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden mb-4 bg-slate-900 shadow-inner">
                  <img
                    src={coverUrl}
                    alt={altText}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                  
                  <div className="absolute top-3 left-3">
                    <Badge variant={evidenceStatus === 'validated' ? 'emerald' : 'cyan'} className="shadow-md backdrop-blur-md text-[10px]">
                      {evidenceStatus === 'validated'
                        ? (lang === 'tj' ? 'Исботшуда: Синфи А' : lang === 'en' ? 'Evidence: Class A' : 'Доказано: Класс A')
                        : (lang === 'tj' ? 'Скрининги рақамӣ' : lang === 'en' ? 'Digital Screening' : 'Цифровой скрининг')}
                    </Badge>
                  </div>

                  <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[10px] text-white/80">
                    <div className="flex items-center gap-1.5 font-mono">
                      <Clock className="w-3 h-3 text-[#2EC4A7]" />
                      <span>{lang === 'tj' ? '3 дақ' : lang === 'en' ? '3 min' : '3 мин'}</span>
                      <span>•</span>
                      <UserCheck className="w-3 h-3 text-[#2EC4A7]" />
                      <span>{test.min_age}+</span>
                    </div>
                    {credit && (
                      <span className="truncate max-w-[120px] text-white/60 font-mono text-[9px]">
                        © {credit.author}
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-zinc-100 mb-1.5 group-hover:text-[#17A884] transition-colors leading-snug">
                  {title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
                  {desc}
                </p>
              </div>

              <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSelectTest(test)}
                  className="flex-1 gap-1 text-xs cursor-pointer rounded-xl font-bold border-slate-200 dark:border-slate-700"
                >
                  <FileText className="w-3.5 h-3.5 text-[#17A884]" />
                  <span>{lang === 'tj' ? 'Паспорт' : lang === 'en' ? 'Passport' : 'Паспорт'}</span>
                </Button>
                <Button
                  size="sm"
                  onClick={() => onStartAttempt(test)}
                  className="bg-[#103D35] hover:bg-[#17A884] text-white gap-1 text-xs font-bold cursor-pointer rounded-xl shadow-md"
                >
                  <span>{lang === 'tj' ? 'Оғоз' : lang === 'en' ? 'Start' : 'Начать'}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </Card>
          )
        })}
      </div>

      {filteredTests.length === 0 && (
        <div className="text-center py-16 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl bg-zinc-50/50 dark:bg-zinc-900/30">
          <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
            {lang === 'ru' ? 'Тесты по вашему запросу не найдены' : lang === 'tj' ? 'Санҷишҳо бо дархости шумо ёфт нашуданд' : 'No screenings match your criteria'}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setSearchQuery(''); setSelectedCat('all'); }}
            className="mt-4 cursor-pointer"
          >
            {lang === 'ru' ? 'Сбросить фильтры' : lang === 'tj' ? 'Тоза кардани филтрҳо' : 'Reset Filters'}
          </Button>
        </div>
      )}
    </section>
  )
}
