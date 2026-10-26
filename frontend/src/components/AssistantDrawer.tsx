import React, { useState, useEffect, useRef } from 'react'
import {
  Sparkles,
  X,
  Send,
  Bot,
  Maximize2,
} from 'lucide-react'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import { apiRequest } from '../api'
import type { Language } from '../i18n'

interface AssistantDrawerProps {
  isOpen: boolean
  onClose: () => void
  onNavigateToCatalog: () => void
  onOpenDedicated?: () => void
  lang?: Language
}

interface MessageAction {
  name: string
  arguments?: Record<string, any>
  requires_confirmation?: boolean
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  actions?: MessageAction[]
}

export const AssistantDrawer: React.FC<AssistantDrawerProps> = ({
  isOpen,
  onClose,
  onNavigateToCatalog,
  onOpenDedicated,
  lang = 'ru',
}) => {
  const [providerAvailable, setProviderAvailable] = useState<boolean>(true)

  const initialGreeting =
    lang === 'tj'
      ? 'Салом! Ман ёвари клиникии SIHAT ҳастам. Ба шумо барои интихоби скринингҳои биноӣ, шунавоӣ ё диққат кумак мерасонам ва методологияро шарҳ медиҳам. Платформа ташхиси тиббӣ намегузорад.'
      : lang === 'en'
        ? 'Hello! I am SIHAT clinical guide. I can help recommend appropriate vision, hearing, or attention screenings, and explain methodology boundaries. The platform does not formulate medical diagnoses.'
        : 'Здравствуйте! Я клинический навигатор SIHAT. Помогу подобрать скрининг зрения, слуха или внимания, либо объясню условия калибровки и паспорта методик. Платформа не ставит медицинских диагнозов.'

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: initialGreeting,
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // Auto scroll messages container without scrolling window/body
  useEffect(() => {
    if (isOpen && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
  }, [messages, isOpen])

  // Keep greeting localized if chat hasn't started
  useEffect(() => {
    if (messages.length === 1 && messages[0].role === 'assistant') {
      setMessages([{ role: 'assistant', content: initialGreeting }])
    }
  }, [lang])

  if (!isOpen) return null

  const handleSend = async (textToSend?: string) => {
    const userText = (textToSend || input).trim()
    if (!userText || loading) return

    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: userText }])
    setLoading(true)

    const conversation = messages.slice(-10).map((m) => ({
      role: m.role as 'user' | 'assistant',
      text: m.content,
    }))

    try {
      const res = await apiRequest<{
        message: string
        actions?: MessageAction[]
        provider_available: boolean
      }>('/assistant/message', {
        method: 'POST',
        body: JSON.stringify({
          text: userText,
          conversation,
          shared_result_ids: [],
        }),
      })

      setProviderAvailable(res.provider_available)
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: res.message,
          actions: res.actions,
        },
      ])
    } catch (err: unknown) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            err instanceof Error
              ? err.message
              : lang === 'tj'
                ? 'Хатогӣ ҳангоми гирифтани посух.'
                : 'Не удалось получить ответ от ассистента.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const quickPrompts =
    lang === 'tj'
      ? [
        '👁 Чӣ тавр биноиро санҷем?',
        '👂 Чӣ тавр шунавоиро санҷем?',
        '🧠 Тести Струп чист?',
        '🛡 Махфияти натиҷаҳо',
      ]
      : lang === 'en'
        ? [
          '👁 How to test vision?',
          '👂 How to test hearing?',
          '🧠 What is Stroop test?',
          '🛡 How is privacy protected?',
        ]
        : [
          '👁 Как проверить зрение?',
          '👂 Как проверить слух?',
          '🧠 Тест Струпа',
          '🛡 Как защищены мои данные?',
        ]

  return (
    <aside
      aria-label="Компактное окно ИИ-помощника"
      className="!fixed bottom-20 sm:bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[420px] h-[520px] max-h-[78vh] rounded-3xl liquid-glass shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
    >
      {/* Compact Header */}
      <div className="px-4 py-3 border-b border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between shrink-0 bg-zinc-50/70 dark:bg-zinc-900/50">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                {lang === 'tj' ? 'Ёвари AI SIHAT' : lang === 'en' ? 'SIHAT AI Guide' : 'AI Навигатор SIHAT'}
              </span>
              {providerAvailable ? (
                <Badge variant="emerald" className="text-[9px] py-0 px-1.5 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Gemini
                </Badge>
              ) : (
                <Badge variant="cyan" className="text-[9px] py-0 px-1.5 font-bold flex items-center gap-1">
                  Офлайн
                </Badge>
              )}
            </div>
            <p className="text-[10px] text-zinc-400 truncate">
              {lang === 'tj' ? 'Бе ташхиси тиббӣ • Эфемерӣ' : lang === 'en' ? 'No Diagnoses • Volatile' : 'Без диагнозов • Zero-Retention'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 shrink-0">
          {onOpenDedicated && (
            <button
              onClick={() => {
                onClose()
                onOpenDedicated()
              }}
              className="p-1.5 rounded-xl text-zinc-500 hover:text-emerald-600 dark:text-zinc-400 dark:hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
              title="Открыть отдельный сайт ИИ"
              aria-label="Открыть отдельный сайт ИИ"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title="Закрыть"
            aria-label="Закрыть"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Message History */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-3.5 space-y-3 text-xs">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex gap-2.5 leading-relaxed ${m.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
          >
            {m.role === 'assistant' && (
              <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                <Bot className="w-3.5 h-3.5" />
              </div>
            )}
            <div
              className={`p-3 rounded-2xl max-w-[85%] ${m.role === 'user'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-tr-sm shadow-sm'
                  : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border border-zinc-200/80 dark:border-zinc-800/80 rounded-tl-sm shadow-xs'
                }`}
            >
              <p className="whitespace-pre-wrap text-[11.5px] leading-relaxed">{m.content}</p>

              {m.actions && m.actions.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60 flex flex-wrap gap-1.5">
                  {m.actions.map((act, actIdx) => (
                    <button
                      key={actIdx}
                      onClick={() => {
                        onClose()
                        onNavigateToCatalog()
                      }}
                      className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 transition-colors flex items-center gap-1 shadow-xs"
                    >
                      <span>
                        {act.name === 'open_test'
                          ? `Перейти к тесту: ${act.arguments?.slug || ''} →`
                          : lang === 'tj'
                            ? 'Феҳристи скринингҳо →'
                            : lang === 'en'
                              ? 'Open Catalog →'
                              : 'Открыть каталог →'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-[11px] text-zinc-400 italic">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            {lang === 'tj' ? 'Омодасозии посух...' : lang === 'en' ? 'Formulating response...' : 'Формирование ответа...'}
          </div>
        )}
      </div>

      {/* Quick Question Pills */}
      <div
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        className="px-3 py-1.5 border-t border-zinc-200/60 dark:border-zinc-800/60 flex gap-1.5 overflow-x-auto text-[10px] shrink-0 bg-zinc-50/50 dark:bg-zinc-900/30 no-scrollbar"
      >
        {quickPrompts.map((p, pIdx) => (
          <button
            key={pIdx}
            onClick={() => handleSend(p)}
            className="whitespace-nowrap px-2.5 py-1 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 text-zinc-600 dark:text-zinc-300 transition-colors shadow-2xs font-medium"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSend()
        }}
        className="p-2.5 border-t border-zinc-200/80 dark:border-zinc-800/80 flex items-center gap-2 shrink-0 bg-white dark:bg-zinc-950"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            lang === 'tj'
              ? 'Дар бораи тестҳо пурсед...'
              : lang === 'en'
                ? 'Ask about tests or symptoms...'
                : 'Спросите о тестах или симптомах...'
          }
          className="flex-1 px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
        />
        <Button
          type="submit"
          variant="emerald"
          size="sm"
          disabled={loading || !input.trim()}
          className="px-3 py-2 rounded-xl h-auto"
          aria-label="Отправить запрос"
        >
          <Send className="w-3.5 h-3.5" />
        </Button>
      </form>
    </aside>
  )
}
