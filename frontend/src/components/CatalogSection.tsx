import React, { useState, useMemo } from 'react'
import { Search, Eye, Volume2, Brain, Zap, Clock, UserCheck, ChevronRight, FileText } from 'lucide-react'
import { Card } from './ui/Card'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import type { Language, Translations } from '../i18n'
import type { TestItem, Category } from '../types'

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

  const filteredTests = useMemo(() => {
    return tests.filter((item) => {
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
  }, [tests, searchQuery, selectedCat, lang])

  return (
    <section id="catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
        <div>
          <Badge variant="emerald" className="mb-2">
            {t.nav?.catalog || (lang === 'tj' ? 'Феҳристи скринингҳо' : lang === 'en' ? 'Screening Catalog' : 'Каталог скринингов')}
          </Badge>
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            {lang === 'ru' ? 'Программы самопроверки и тренировки' : lang === 'tj' ? 'Барномаҳои санҷиши худӣ ва машқҳо' : 'Screening & Exercise Catalog'}
          </h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
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
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl liquid-glass-pill text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
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
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl text-xs font-semibold transition-all ${
                isActive
                  ? 'liquid-glass-emerald text-white shadow-md'
                  : 'liquid-glass-pill text-zinc-600 dark:text-zinc-400 hover:border-emerald-500/50 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{chip.label}</span>
            </button>
          )
        })}
      </div>

      {/* Test Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTests.map((test) => {
          const loc = test.localizations?.[lang]
            || (lang === 'tj' ? test.localizations?.tg : undefined)
            || test.localizations?.ru
            || test.localizations?.en

          const title = loc?.title || test.slug
          const desc = loc?.description || (lang === 'tj' ? 'Амалияи интерактивии таҳлили сенсорӣ бо пойгоҳи кушодаи исботшуда.' : lang === 'en' ? 'Interactive sensory analysis with transparent methodology.' : 'Интерактивная практика сенсорного анализа с открытой доказательной базой.')
          const evidenceStatus = test.methodology?.evidence_status || 'validated'

          return (
            <Card
              key={test.id}
              className="p-6 flex flex-col justify-between hover:border-emerald-500/50 hover:shadow-lg transition-all duration-300 group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <Badge variant={evidenceStatus === 'validated' ? 'emerald' : 'cyan'}>
                    {evidenceStatus === 'validated'
                      ? (lang === 'tj' ? 'Исботшуда: Синфи А' : lang === 'en' ? 'Evidence: Class A' : 'Доказано: Класс A')
                      : (lang === 'tj' ? 'Скрининги рақамӣ' : lang === 'en' ? 'Digital Screening' : 'Цифровой скрининг')}
                  </Badge>
                  <div className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                    <Clock className="w-3 h-3" />
                    <span>{lang === 'tj' ? '3 дақ' : lang === 'en' ? '3 min' : '3 мин'}</span>
                    <span>•</span>
                    <UserCheck className="w-3 h-3" />
                    <span>{test.min_age}+</span>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2 group-hover:text-emerald-500 transition-colors">
                  {title}
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed line-clamp-3">
                  {desc}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSelectTest(test)}
                  className="flex-1 gap-1 text-xs"
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{lang === 'tj' ? 'Шиносномаи методӣ' : lang === 'en' ? 'Methodology Passport' : 'Паспорт методики'}</span>
                </Button>
                <Button
                  variant="emerald"
                  size="sm"
                  onClick={() => onStartAttempt(test)}
                  className="gap-1 text-xs"
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
        <div className="text-center py-16 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/30">
          <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
            {lang === 'ru' ? 'Тесты по вашему запросу не найдены' : lang === 'tj' ? 'Санҷишҳо бо дархости шумо ёфт нашуданд' : 'No screenings match your criteria'}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setSearchQuery(''); setSelectedCat('all'); }}
            className="mt-4"
          >
            {lang === 'ru' ? 'Сбросить фильтры' : lang === 'tj' ? 'Тоза кардани филтрҳо' : 'Reset Filters'}
          </Button>
        </div>
      )}
    </section>
  )
}
