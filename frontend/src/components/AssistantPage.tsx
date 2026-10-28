import React, { useState, useEffect, useRef } from 'react'
import {
  Sparkles,
  Send,
  Bot,
  ShieldCheck,
  AlertCircle,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  Eye,
  Ear,
  Brain,
  Shield,
} from 'lucide-react'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import { Card } from './ui/Card'
import { UserAvatar } from './UserAvatar'
import { apiRequest } from '../api'
import type { Language } from '../i18n'
import type { UserProfile } from '../types'

interface AssistantPageProps {
  user: UserProfile | null
  lang: Language
  onNavigate: (pageId: string) => void
  onNotify: (msg: string) => void
}

interface MessageAction {
  name: string
  arguments?: Record<string, any>
  requires_confirmation?: boolean
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  actions?: MessageAction[]
}

export const AssistantPage: React.FC<AssistantPageProps> = ({
  user,
  lang = 'ru',
  onNavigate,
  onNotify,
}) => {
  const [providerAvailable, setProviderAvailable] = useState<boolean>(true)

  const initialGreeting =
    lang === 'tj'
      ? 'Салом! Ман навигатори клиникии зеҳни сунъии SIHAT ҳастам. Ман ба шумо кумак мерасонам, ки аз рӯи нишонаҳо скринингҳои дурусти биноӣ, шунавоӣ ва диққатро интихоб намоед, қоидаҳои калибровкаи экранро фаҳмед ва шиносномаҳои методологиро таҳлил кунед. Платформа ташхиси тиббӣ намегузорад ва дору таъин намекунад.'
      : lang === 'en'
      ? 'Hello! I am the SIHAT Clinical AI Navigator. I assist in selecting appropriate vision, hearing, and cognitive screenings based on your sensory symptoms, explain screen calibration protocols, and analyze methodology passports. The platform does not formulate medical diagnoses or prescribe medications.'
      : 'Здравствуйте! Я клинический навигатор искусственного интеллекта SIHAT. Я помогаю подобрать доказательные скрининги зрения, слуха и когнитивных функций, объясняю условия калибровки экрана и разбираю паспорта методик. Платформа не ставит медицинских диагнозов и не назначает лекарственных средств.'

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: initialGreeting,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleClearHistory = () => {
    setMessages([
      {
        role: 'assistant',
        content: initialGreeting,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ])
    onNotify(lang === 'tj' ? 'Таърихи муколама тоза карда шуд' : 'История диалога очищена')
  }

  const handleSend = async (textToSend?: string) => {
    const userText = (textToSend || input).trim()
    if (!userText || loading) return

    setInput('')
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    setMessages((prev) => [...prev, { role: 'user', content: userText, timestamp: timeStr }])
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
          lang,
        }),
      })

      setProviderAvailable(res.provider_available)
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: res.message,
          actions: res.actions,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  // Quick scenario cards
  const scenarioCards = [
    {
      icon: Eye,
      color: 'from-blue-500/20 to-cyan-500/20 text-cyan-500 border-cyan-500/30',
      title: lang === 'tj' ? 'Санҷиши биноӣ ва контраст' : lang === 'en' ? 'Vision & Contrast Screenings' : 'Скрининги зрения и контрастность',
      prompt: 'Помоги подобрать научно обоснованный тест для проверки остроты зрения и контрастной чувствительности (ISO 8596).',
      desc: 'Оптотипы Ландольта, таблицы Исихары, калибровка экрана 50–60 см.',
    },
    {
      icon: Ear,
      color: 'from-teal-500/20 to-emerald-500/20 text-emerald-500 border-emerald-500/30',
      title: lang === 'tj' ? 'Аудиометрия ва шунавоӣ' : lang === 'en' ? 'Pure-Tone Audiometry' : 'Аудиометрия чистых тонов',
      prompt: 'Как правильно настроить наушники и проверить слух на частотах от 250 до 8000 Гц по стандарту ISO 8253-1?',
      desc: 'Пороги слышимости, правила громкости до 60%, дифференциация тиннитуса.',
    },
    {
      icon: Brain,
      color: 'from-purple-500/20 to-indigo-500/20 text-purple-500 border-purple-500/30',
      title: lang === 'tj' ? 'Диққат ва хастагӣ' : lang === 'en' ? 'Cognitive Control & Focus' : 'Внимание и ментальное утомление',
      prompt: 'В чем разница между тестом Струпа, таблицами Шульте и тестом Trail Making (TMT-B)?',
      desc: 'Когнитивная интерференция, устойчивость фиксации, скорость переключения.',
    },
    {
      icon: Shield,
      color: 'from-emerald-500/20 to-teal-500/20 text-emerald-500 border-emerald-500/30',
      title: lang === 'tj' ? 'Амният ва махфият' : lang === 'en' ? 'Zero-Retention Architecture' : 'Zero-Retention архитектура',
      prompt: 'Как в SIHAT защищены мои сенсорные ответы и почему данные не передаются третьим лицам?',
      desc: 'Локальная обработка реакций, эфемерные сессии, шифрование HS256.',
    },
  ]

  const quickPrompts = [
    '👁 Правило 20-20-20 для глаз',
    '👂 Как калибровать наушники?',
    '🧠 Что такое эффект Струпа?',
    '🛡 Удаление данных из архива',
    '📋 Какие 15 скринингов доступны?',
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300 space-y-8">
      {/* Hero Header */}
      <div className="p-6 sm:p-10 rounded-3xl liquid-glass shadow-2xl relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-cyan-500/15 blur-3xl pointer-events-none -z-10" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="emerald" className="gap-1.5 text-xs font-mono font-bold py-1 px-3 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                <span>SIHAT AI Lab</span>
              </Badge>
              {providerAvailable ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold liquid-glass-pill text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  {lang === 'tj' ? 'AI Фаъол' : lang === 'en' ? 'AI Active' : 'ИИ Активен'}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold liquid-glass-pill text-cyan-600 dark:text-cyan-400 border-cyan-500/30">
                  {lang === 'tj' ? 'Роҳнамои клиникӣ' : lang === 'en' ? 'Clinical Guide' : 'Клинический справочник'}
                </span>
              )}
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono text-zinc-500 liquid-glass-pill">
                Zero-Retention
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
              {lang === 'tj' ? 'Ёвари клиникии зеҳни сунъии SIHAT' : lang === 'en' ? 'SIHAT Clinical AI Navigator' : 'Клинический ИИ-ассистент SIHAT'}
            </h1>
            <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {lang === 'tj'
                ? 'Платформаи интеллектуалӣ барои таҳлили аломатҳо, интихоби скринингҳои сенсорӣ ва тафсири шиносномаҳои методӣ.'
                : lang === 'en'
                ? 'Intelligent conversational guide for sensory symptom triage, screening recommendations, and methodology calibration analysis.'
                : 'Специализированная нейросетевая среда для разбора сенсорных симптомов, подбора методик скрининга и разъяснения стандартов ISO.'}
            </p>
          </div>

          {/* Quick Actions Header */}
          <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearHistory}
              className="gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              title="Начать новый диалог"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{lang === 'tj' ? 'Муколамаи нав' : lang === 'en' ? 'New chat' : 'Новый диалог'}</span>
            </Button>
          </div>
        </div>

        {/* 4 Quick Scenario Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-8 pt-6 border-t border-zinc-200/80 dark:border-zinc-800/80">
          {scenarioCards.map((sc, i) => {
            const Icon = sc.icon
            return (
              <button
                key={i}
                type="button"
                onClick={() => handleSend(sc.prompt)}
                className="group p-4 rounded-3xl liquid-glass-card text-left transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${sc.color} flex items-center justify-center transition-transform group-hover:scale-110 shadow-xs`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-emerald-500 transition-colors" />
                  </div>
                  <h2 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {sc.title}
                  </h2>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug line-clamp-2">
                    {sc.desc}
                  </p>
                </div>
                <div className="mt-3 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 opacity-80 group-hover:opacity-100">
                  <span>Запустить консультацию</span>
                  <span>→</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Interactive Chat Console */}
      <Card className="rounded-3xl liquid-glass shadow-2xl overflow-hidden flex flex-col h-[640px]">
        {/* Chat Top Bar */}
        <div className="px-6 py-4 border-b border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between bg-zinc-50/70 dark:bg-zinc-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                  SIHAT Clinical Dialogue Engine
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                  v2.5
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Эфемерный диалог • Никакие данные не сохраняются в БД</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('catalog')}
              className="text-xs gap-1.5 border-zinc-200 dark:border-zinc-800"
            >
              <span>Каталог 15 тестов</span>
              <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
            </Button>
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-3.5 sm:gap-4 leading-relaxed ${
                m.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {m.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-md shadow-emerald-600/20">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`p-4 sm:p-5 rounded-3xl max-w-[85%] sm:max-w-[78%] space-y-2.5 ${
                  m.role === 'user'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-tr-sm shadow-md'
                    : 'bg-zinc-50 dark:bg-zinc-950/70 text-zinc-800 dark:text-zinc-200 border border-zinc-200/80 dark:border-zinc-800/80 rounded-tl-sm shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between gap-4 border-b border-white/10 dark:border-zinc-800/60 pb-1.5 text-[11px] opacity-75">
                  <span className="font-semibold">
                    {m.role === 'user' ? (user?.full_name || 'Вы') : 'Клинический навигатор SIHAT'}
                  </span>
                  <span className="font-mono text-[10px]">{m.timestamp}</span>
                </div>

                <p className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed">
                  {m.content}
                </p>

                {/* Interactive Action Buttons if returned by Assistant */}
                {m.actions && m.actions.length > 0 && (
                  <div className="pt-2.5 border-t border-zinc-200/60 dark:border-zinc-800/60 flex flex-wrap gap-2">
                    {m.actions.map((act, actIdx) => {
                      const testSlug = act.arguments?.slug || act.arguments?.test_slug
                      const testTitle = act.arguments?.title
                      const isTest = act.name === 'open_test' && !!testSlug

                      return (
                        <button
                          key={actIdx}
                          onClick={() => {
                            if (isTest && testSlug) {
                              onNavigate(`test/${testSlug}`)
                            } else {
                              onNavigate('catalog')
                            }
                          }}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>
                            {isTest
                              ? (lang === 'tj'
                                  ? `Гузариш ба санҷиш: ${testTitle || testSlug} →`
                                  : lang === 'en'
                                  ? `Start Test: ${testTitle || testSlug} →`
                                  : `Пройти тест: ${testTitle || testSlug} →`)
                              : lang === 'tj'
                                ? 'Феҳристи скринингҳо →'
                                : lang === 'en'
                                  ? 'Open Catalog →'
                                  : 'Открыть каталог →'}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {m.role === 'user' && (
                <div className="shrink-0 mt-0.5">
                  <UserAvatar user={user} size="sm" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-3 text-xs text-zinc-400 p-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-2 italic">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>ИИ формирует доказательный клинический ответ...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Chips */}
        <div
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          className="px-6 py-2 border-t border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950/40 flex gap-2 overflow-x-auto text-xs no-scrollbar"
        >
          {quickPrompts.map((p, pIdx) => (
            <button
              key={pIdx}
              onClick={() => handleSend(p)}
              className="whitespace-nowrap px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 text-zinc-600 dark:text-zinc-300 transition-colors shadow-2xs font-medium text-xs"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Chat Input Console */}
        <div className="p-4 sm:p-5 border-t border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-950">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
            className="flex items-end gap-3"
          >
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                rows={2}
                placeholder={
                  lang === 'tj'
                    ? 'Аломатҳои худро тавсиф кунед ё дар бораи методикаҳо бипурсед (Enter барои фиристодан)...'
                    : 'Опишите ваши симптомы или спросите о стандарте скрининга (Enter для отправки)...'
                }
                className="w-full px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
              />
            </div>

            <Button
              type="submit"
              variant="emerald"
              size="lg"
              disabled={loading || !input.trim()}
              className="px-5 py-3 h-auto rounded-2xl gap-2 shadow-lg shadow-emerald-600/20"
            >
              <span>Отправить</span>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </Card>

      {/* Safety Clinical Notice */}
      <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-3">
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold">Клинический регламент безопасности:</span>
          <p className="leading-relaxed">
            Платформа SIHAT (Сиҳат) является информационно-образовательным инструментом скрининговой самооценки и не является медицинским изделием.
            ИИ-ассистент не ставит клинических диагнозов, не рассчитывает проценты здоровья и не назначает терапию. При острых состояниях немедленно обращайтесь к врачу или по экстренному номеру 103/112.
          </p>
        </div>
      </div>
    </div>
  )
}
