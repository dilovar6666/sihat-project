import React from 'react'
import { AlertCircle, Sparkles } from 'lucide-react'
import type { Language, Translations } from '../i18n'

interface FooterProps {
  t?: Translations
  lang?: Language
  onNavigate: (sectionId: string) => void
}

export const Footer: React.FC<FooterProps> = ({ lang = 'ru', onNavigate }) => {
  const disclaimerTitle = lang === 'tj'
    ? 'Огоҳиномаи расмии тиббӣ:'
    : lang === 'en'
    ? 'Official Medical Notice:'
    : 'Официальное медицинское уведомление:'

  const disclaimerText = lang === 'tj'
    ? 'Платформаи SIHAT (Сиҳат) воситаи иттилоотӣ-таълимии худбаҳодиҳӣ буда, маҳсулоти тиббӣ намебошад. Платформа ташхиси клиникӣ намегузорад, фоизҳои сохтаи саломатиро ҳисоб намекунад ва машварати духтурро иваз намекунад.'
    : lang === 'en'
    ? 'The SIHAT platform is an informational and educational self-screening tool and is not a medical device. It does not provide clinical diagnoses, does not compute arbitrary aggregate health scores, and does not replace medical consultation.'
    : 'Платформа SIHAT (Сиҳат) является информационно-образовательным инструментом скрининговой самооценки и не является медицинским изделием. Платформа не ставит клинических диагнозов, не рассчитывает проценты здоровья и не заменяет консультацию врача.'

  const rightsText = lang === 'tj'
    ? '© 2026 Ҳамаи ҳуқуқҳо маҳфузанд.'
    : lang === 'en'
    ? '© 2026 All rights reserved.'
    : '© 2026 Все права защищены.'

  const navLabels = {
    features: lang === 'tj' ? 'Имкониятҳо' : lang === 'en' ? 'Features' : 'Возможности',
    catalog: lang === 'tj' ? 'Феҳрист' : lang === 'en' ? 'Catalog' : 'Каталог',
    faq: lang === 'tj' ? 'Саволҳо ва ҷавобҳо' : lang === 'en' ? 'FAQ' : 'Вопросы и ответы',
    contact: lang === 'tj' ? 'Дастгирӣ' : lang === 'en' ? 'Support' : 'Поддержка',
  }

  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Medical disclaimer alert banner */}
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-950/20 p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            <strong className="text-zinc-900 dark:text-zinc-100 font-semibold block mb-0.5">
              {disclaimerTitle}
            </strong>
            {disclaimerText}
          </div>
        </div>

        {/* Links & Brand */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 text-xs text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center gap-3">
            <img
              src="/sihat-logo.png"
              alt="SIHAT"
              className="h-7 w-auto object-contain dark:brightness-175 dark:contrast-110"
            />
            <span>•</span>
            <span>{rightsText}</span>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <button onClick={() => onNavigate('features')} className="hover:text-emerald-500 transition-colors">
              {navLabels.features}
            </button>
            <button onClick={() => onNavigate('catalog')} className="hover:text-emerald-500 transition-colors">
              {navLabels.catalog}
            </button>
            <button onClick={() => onNavigate('passport')} className="hover:text-emerald-500 transition-colors">
              {lang === 'tj' ? 'Шиносномаи методӣ' : lang === 'en' ? 'Methodology' : 'Паспорт методик'}
            </button>
            <button onClick={() => onNavigate('assistant')} className="hover:text-emerald-500 transition-colors flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{lang === 'tj' ? 'Ёвари AI' : lang === 'en' ? 'AI Assistant' : 'ИИ-ассистент'}</span>
            </button>
            <button onClick={() => onNavigate('faq')} className="hover:text-emerald-500 transition-colors">
              {navLabels.faq}
            </button>
            <button onClick={() => onNavigate('contact')} className="hover:text-emerald-500 transition-colors">
              {navLabels.contact}
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}
