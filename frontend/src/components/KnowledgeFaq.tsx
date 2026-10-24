import React, { useState } from 'react'
import { ChevronDown, BookOpen, HelpCircle } from 'lucide-react'
import { Card } from './ui/Card'
import { Badge } from './ui/Badge'
import type { Language, Translations } from '../i18n'
import type { FaqItem, KnowledgeArticle } from '../types'

interface KnowledgeFaqProps {
  t?: Translations
  lang: Language
  faq: FaqItem[]
  articles: KnowledgeArticle[]
}

export const KnowledgeFaq: React.FC<KnowledgeFaqProps> = ({
  lang,
  faq,
  articles,
}) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0)

  // Labels per language
  const labels = {
    ru: {
      badgeFaq: 'База ответов',
      titleFaq: 'Часто задаваемые вопросы',
      subtitleFaq: 'Всё о границах применения, конфиденциальности данных и научной основе платформы.',
      badgeKnowledge: 'Материалы',
      titleKnowledge: 'База знаний SIHAT',
      subtitleKnowledge: 'Полезные экспертные статьи о гигиене зрения, сна и слуха.',
      defaultQuestion: 'Вопрос',
      defaultAnswer: 'Ответ',
      catStandards: 'Стандарты',
      catGuidance: 'Руководство',
      catWellbeing: 'Самочувствие',
    },
    tj: {
      badgeFaq: 'Пойгоҳи посухҳо',
      titleFaq: 'Саволҳои маъмул',
      subtitleFaq: 'Ҳама чиз дар бораи ҳудуди татбиқ, махфияти маълумот ва пояи илмии платформа.',
      badgeKnowledge: 'Маводҳо',
      titleKnowledge: 'Пойгоҳи донишҳои SIHAT',
      subtitleKnowledge: 'Мақолаҳои муфид дар бораи гигиенаи биноӣ, хоб ва шунавоӣ.',
      defaultQuestion: 'Савол',
      defaultAnswer: 'Ҷавоб',
      catStandards: 'Стандартҳо',
      catGuidance: 'Дастур',
      catWellbeing: 'Беҳбудӣ',
    },
    en: {
      badgeFaq: 'FAQ Base',
      titleFaq: 'Frequently Asked Questions',
      subtitleFaq: 'All about application scope, data privacy, and scientific evidence behind SIHAT.',
      badgeKnowledge: 'Resources',
      titleKnowledge: 'SIHAT Knowledge Base',
      subtitleKnowledge: 'Practical articles on vision hygiene, sleep, and hearing.',
      defaultQuestion: 'Question',
      defaultAnswer: 'Answer',
      catStandards: 'Standards',
      catGuidance: 'Guidance',
      catWellbeing: 'Wellbeing',
    },
  }[lang] || {
    badgeFaq: 'FAQ Base',
    titleFaq: 'Frequently Asked Questions',
    subtitleFaq: 'All about application scope, data privacy, and scientific evidence behind SIHAT.',
    badgeKnowledge: 'Resources',
    titleKnowledge: 'SIHAT Knowledge Base',
    subtitleKnowledge: 'Practical articles on vision hygiene, sleep, and hearing.',
    defaultQuestion: 'Question',
    defaultAnswer: 'Answer',
    catStandards: 'Standards',
    catGuidance: 'Guidance',
    catWellbeing: 'Wellbeing',
  }

  const getFaqText = (field: Record<string, string> | undefined): string => {
    if (!field) return ''
    if (field[lang]) return field[lang]
    if (lang === 'tj' && field.tg) return field.tg
    if (field.ru) return field.ru
    if (field.en) return field.en
    return ''
  }

  // Default fallback questions if API is empty
  const defaultFaq = lang === 'tj' ? [
    {
      q: 'Оё SIHAT воситаи ташхиси тиббӣ мебошад?',
      a: 'Не. Платформаи SIHAT ташхиси клиникӣ намегузорад ва машварати табибро иваз намекунад. Ҳамаи тестҳо барои худсанҷиши огоҳона равона шудаанд.',
    },
    {
      q: 'Натиҷаҳои ман дар куҷо нигоҳ дошта мешаванд?',
      a: 'Ҳамаи натиҷаҳо танҳо дар сессияҳои муваққатӣ ташаккул меёбанд. Шумо худатон интихоб мекунед: натиҷаро захира кунед ё фавран нест намоед.',
    },
  ] : lang === 'en' ? [
    {
      q: 'Is SIHAT a clinical diagnostic tool?',
      a: 'No. The SIHAT platform does not formulate medical diagnoses or calculate arbitrary health scores. It provides evidence-bounded screening exercises.',
    },
    {
      q: 'Where are my results stored?',
      a: 'Results remain strictly temporary unless you explicitly choose to save them to your private encrypted archive.',
    },
  ] : [
    {
      q: 'Является ли SIHAT медицинским диагностическим инструментом?',
      a: 'Нет. Платформа SIHAT не ставит клинических диагнозов, не рассчитывает вымышленные проценты здоровья и не заменяет консультацию врача. Все тесты предназначены для осознанной самопроверки и ранней фиксации субъективных изменений.',
    },
    {
      q: 'Куда отправляются и где сохраняются мои результаты?',
      a: 'Все результаты формируются исключительно во временных сессиях. После прохождения скрининга только вы решаете: сохранить запись в личный защищённый архив или удалить её немедленно и безвозвратно.',
    },
    {
      q: 'Откуда берутся методики и нормативы тестов?',
      a: 'Каждый тест базируется на открытых протоколах (ISO 8596, оптотипы Ландольта, тест Струпа, аудиометрия тонов). Полный научный паспорт методики со всеми ограничениями доступен до начала скрининга.',
    },
  ]

  const displayFaq = faq.length > 0
    ? faq.map((item) => ({
        q: getFaqText(item.question) || labels.defaultQuestion,
        a: getFaqText(item.answer) || labels.defaultAnswer,
      }))
    : defaultFaq

  const getCategoryBadgeLabel = (cat: string) => {
    if (cat === 'standards') return labels.catStandards
    if (cat === 'guidance') return labels.catGuidance
    if (cat === 'wellbeing') return labels.catWellbeing
    return cat.toUpperCase()
  }

  return (
    <section id="faq" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left: FAQ Accordion */}
        <div className="lg:col-span-7">
          <Badge variant="emerald" className="mb-2">
            {labels.badgeFaq}
          </Badge>
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 mb-3">
            {labels.titleFaq}
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-8">
            {labels.subtitleFaq}
          </p>

          <div className="space-y-3">
            {displayFaq.map((item, idx) => {
              const isOpen = openFaqIndex === idx

              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden transition-all shadow-sm"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-5 text-left font-semibold text-zinc-900 dark:text-zinc-100 flex items-center justify-between gap-4 hover:text-emerald-500 transition-colors"
                  >
                    <span className="text-sm sm:text-base flex items-center gap-2.5">
                      <HelpCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                      {item.q}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-emerald-500' : 'text-zinc-400'
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed border-t border-zinc-100 dark:border-zinc-800/80 pt-3 animate-in fade-in duration-200">
                      {item.a}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Right: Knowledge Articles Cards */}
        <div className="lg:col-span-5">
          <Badge variant="cyan" className="mb-2">
            {labels.badgeKnowledge}
          </Badge>
          <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-3">
            {labels.titleKnowledge}
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
            {labels.subtitleKnowledge}
          </p>

          <div className="space-y-4">
            {articles.slice(0, 3).map((article) => {
              const loc = article.localizations?.[lang] 
                || (lang === 'tj' ? article.localizations?.tg : undefined)
                || article.localizations?.ru 
                || article.localizations?.en

              const title = loc?.title || article.slug
              const summary = loc?.summary || (lang === 'tj' ? 'Маводи маърифатӣ барои нигоҳубини саломатӣ.' : lang === 'en' ? 'Educational material for health awareness.' : 'Познавательный материал для заботы о здоровье.')

              return (
                <Card
                  key={article.id}
                  className="p-5 hover:border-emerald-500/50 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-[10px] uppercase font-mono font-bold">
                      {getCategoryBadgeLabel(article.category)}
                    </Badge>
                  </div>
                  <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1 group-hover:text-emerald-500 transition-colors flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{title}</span>
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-2">
                    {summary}
                  </p>
                </Card>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
