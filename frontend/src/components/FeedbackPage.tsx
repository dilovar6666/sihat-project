import React, { useState } from 'react'
import { MessageSquare, AlertCircle, CheckCircle2, Send, ArrowLeft, Bug, Lightbulb, HelpCircle, ShieldAlert } from 'lucide-react'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { apiRequest } from '../api'
import type { Language } from '../i18n'

interface FeedbackPageProps {
  lang: Language
  onBack: () => void
  userEmail?: string
}

type FeedbackType = 'complaint' | 'suggestion' | 'bug' | 'methodology'

export const FeedbackPage: React.FC<FeedbackPageProps> = ({ lang, onBack, userEmail = '' }) => {
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('complaint')
  const [email, setEmail] = useState(userEmail)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successTicketId, setSuccessTicketId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const t = {
    ru: {
      badge: 'Служба заботы о пользователях',
      title: 'Центр обратной связи и жалоб',
      subtitle: 'Мы стремимся сделать платформу SIHAT максимально точной, честной и безопасной. Каждое обращение лично рассматривается командой разработчиков и методологов.',
      backBtn: 'Назад',
      typeComplaint: 'Жалоба на работу платформы',
      typeSuggestion: 'Идея / Предложение',
      typeBug: 'Техническая ошибка (Баг)',
      typeMethodology: 'Вопрос по методологии теста',
      emailLabel: 'Ваш контактный email для ответа',
      subjectLabel: 'Тема обращения',
      messageLabel: 'Подробное описание ситуации',
      submitBtn: 'Отправить обращение',
      submittingBtn: 'Отправка обращения...',
      successTitle: 'Обращение успешно зарегистрировано!',
      successDesc: 'Мы присвоили вашему запросу номер:',
      successEta: 'Служба контроля качества SIHAT свяжется с вами по указанному email в течение 24 часов.',
      newTicketBtn: 'Отправить ещё одно обращение',
      slaPill: 'Регламент ответа: до 24 часов',
    },
    tj: {
      badge: 'Хадамоти ғамхорӣ дар ҳаққи корбарон',
      title: 'Маркази муроҷиат ва шикоятҳо',
      subtitle: 'Ҳар як шикоят ва пешниҳоди шумо аз ҷониби мутахассисони SIHAT шахсан баррасӣ мегардад.',
      backBtn: 'Бозгашт',
      typeComplaint: 'Шикоят оид ба кори платформа',
      typeSuggestion: 'Пешниҳод оид ба беҳбудӣ',
      typeBug: 'Хатои техникӣ (Баг)',
      typeMethodology: 'Савол оид ба методология',
      emailLabel: 'Email-и шумо барои посух',
      subjectLabel: 'Мавзӯи муроҷиат',
      messageLabel: 'Шарҳи муфассал',
      submitBtn: 'Фиристодани муроҷиат',
      submittingBtn: 'Дар ҳоли фиристодан...',
      successTitle: 'Муроҷиати шумо бомуваффақият сабт шуд!',
      successDesc: 'Рақами муроҷиати шумо:',
      successEta: 'Дастаи SIHAT дар давоми 24 соат ба почтаи шумо посух медиҳад.',
      newTicketBtn: 'Фиристодани муроҷиати дигар',
      slaPill: 'Муҳлати посух: то 24 соат',
    },
    en: {
      badge: 'User Care & Patient Advocacy',
      title: 'Feedback, Inquiries & Complaints Center',
      subtitle: 'We are committed to the highest standards of safety and transparency. Every complaint or suggestion is reviewed directly by our methodological team.',
      backBtn: 'Back',
      typeComplaint: 'Platform Complaint',
      typeSuggestion: 'Feature Suggestion',
      typeBug: 'Technical Bug Report',
      typeMethodology: 'Methodology Question',
      emailLabel: 'Contact Email for Response',
      subjectLabel: 'Subject',
      messageLabel: 'Detailed Description',
      submitBtn: 'Submit Inquiry',
      submittingBtn: 'Submitting...',
      successTitle: 'Inquiry Successfully Registered!',
      successDesc: 'Your request reference number is:',
      successEta: 'The SIHAT clinical and technical team will follow up via your email within 24 hours.',
      newTicketBtn: 'Submit Another Inquiry',
      slaPill: 'SLA Response: within 24 hours',
    },
  }[lang]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !subject || !message) return

    setIsSubmitting(true)
    setErrorMessage(null)

    const prefix =
      feedbackType === 'complaint'
        ? '[ЖАЛОБА] '
        : feedbackType === 'bug'
        ? '[БАГ] '
        : feedbackType === 'methodology'
        ? '[МЕТОДОЛОГИЯ] '
        : '[ПРЕДЛОЖЕНИЕ] '

    try {
      const res = await apiRequest<{ id: string }>('/support/tickets', {
        method: 'POST',
        body: JSON.stringify({
          contact_email: email.trim(),
          subject: `${prefix}${subject.trim()}`,
          message: message.trim(),
        }),
      })

      if (res?.id) {
        setSuccessTicketId(res.id)
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Произошла ошибка при отправке обращения')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-8 animate-in fade-in duration-300">
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="gap-2 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{t.backBtn}</span>
      </Button>

      {/* Header */}
      <div className="space-y-3 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Badge variant="destructive" className="gap-1.5 py-1 px-3">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{t.badge}</span>
          </Badge>
          <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
            {t.slaPill}
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {t.title}
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
          {t.subtitle}
        </p>
      </div>

      {successTicketId ? (
        <Card className="p-8 sm:p-10 rounded-3xl bg-emerald-500/[0.06] border-emerald-500/30 text-center space-y-5 shadow-lg animate-in fade-in duration-300">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{t.successTitle}</h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">{t.successDesc}</p>
            <div className="inline-block px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-emerald-500/30 font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
              {successTicketId}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto pt-2">
              {t.successEta}
            </p>
          </div>
          <div className="pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSuccessTicketId(null)
                setSubject('')
                setMessage('')
              }}
              className="text-xs cursor-pointer"
            >
              <span>{t.newTicketBtn}</span>
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Type Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Категория обращения
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: 'complaint', label: t.typeComplaint, icon: ShieldAlert },
                { id: 'suggestion', label: t.typeSuggestion, icon: Lightbulb },
                { id: 'bug', label: t.typeBug, icon: Bug },
                { id: 'methodology', label: t.typeMethodology, icon: HelpCircle },
              ].map((item) => {
                const Icon = item.icon
                const isSelected = feedbackType === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFeedbackType(item.id as FeedbackType)}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-[11px] font-bold leading-tight">{item.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t.emailLabel}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t.subjectLabel}
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Краткое описание вопроса или проблемы"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t.messageLabel}
              </label>
              <textarea
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Пожалуйста, опишите ситуацию как можно подробнее (какое упражнение выполнялось, какое устройство использовалось)..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none leading-relaxed"
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                variant="emerald"
                disabled={isSubmitting}
                className="gap-2 font-bold cursor-pointer shadow-md"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? t.submittingBtn : t.submitBtn}</span>
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  )
}
