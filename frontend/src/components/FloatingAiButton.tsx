import React from 'react'
import { Sparkles } from 'lucide-react'
import type { Language } from '../i18n'

interface FloatingAiButtonProps {
  isOpen: boolean
  onClick: () => void
  lang?: Language
  className?: string
}

export const FloatingAiButton: React.FC<FloatingAiButtonProps> = ({
  isOpen,
  onClick,
  lang = 'ru',
  className = '',
}) => {
  const label = lang === 'tj' ? 'Ёвари AI' : lang === 'en' ? 'AI Guide' : 'ИИ-помощник'

  return (
    <aside
      aria-label="Плавающая кнопка вызова ИИ-помощника"
      className={`fixed bottom-5 sm:bottom-6 right-4 sm:right-6 z-40 flex items-center ${className}`}
    >
      <button
        onClick={onClick}
        aria-label={isOpen ? 'Скрыть ИИ-помощник' : 'Открыть компактный ИИ-помощник SIHAT'}
        aria-expanded={isOpen}
        className={`group relative flex items-center gap-2.5 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-full shadow-2xl transition-all duration-300 transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
          isOpen
            ? 'liquid-glass ring-2 ring-emerald-500/50 text-zinc-900 dark:text-zinc-100 shadow-emerald-500/20'
            : 'liquid-glass-emerald text-white shadow-emerald-600/35 hover:shadow-emerald-600/60 hover:scale-105'
        }`}
      >
        {/* Ambient Pulsing Glow when closed */}
        {!isOpen && (
          <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 opacity-40 blur-md group-hover:opacity-75 transition-opacity duration-500 -z-10 animate-pulse pointer-events-none" />
        )}

        {/* Icon */}
        <div className="relative flex items-center justify-center">
          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 group-hover:rotate-12 animate-pulse" />
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-zinc-950 dark:ring-white animate-ping" />
        </div>

        {/* Text Pill Label */}
        <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm tracking-tight">
          <span>{label}</span>
          <span className="hidden sm:inline-flex px-1.5 py-0.2 rounded-full text-[9px] font-extrabold uppercase bg-white/20 dark:bg-zinc-900/30 text-white dark:text-zinc-950 tracking-wider">
            2.5
          </span>
        </div>
      </button>
    </aside>
  )
}
