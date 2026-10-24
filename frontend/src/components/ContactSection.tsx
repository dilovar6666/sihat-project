import React, { useState } from 'react'
import { Send, CheckCircle2 } from 'lucide-react'
import { Card } from './ui/Card'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import { apiRequest } from '../api'
import type { Language, Translations } from '../i18n'

interface ContactSectionProps {
  onNotify: (msg: string) => void
  lang?: Language
  t?: Translations
}

export const ContactSection: React.FC<ContactSectionProps> = ({ onNotify, lang = 'ru' }) => {
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const labels = {
    ru: {
      badge: 'Связь с нами',
      title: 'Служба заботы и поддержки',
      subtitle: 'Возникли вопросы по методологии или работе платформы? Мы всегда на связи.',
      emailLabel: 'Ваш Email',
      subjectLabel: 'Тема обращения',
      subjectPlaceholder: 'Вопрос по тесту зрения / Методология',
      msgLabel: 'Сообщение',
      msgPlaceholder: 'Подробно опишите ваш вопрос...',
      sendBtn: 'Отправить запрос',
      sendingBtn: 'Отправка...',
      successNotify: 'Ваш запрос успешно отправлен команде поддержки SIHAT.',
      sentTitle: 'Сообщение отправлено!',
      sentDesc: 'Мы получили ваше обращение и ответим на указанный email в течение 24 часов.',
      sendAnother: 'Отправить ещё одно сообщение',
    },
    tj: {
      badge: 'Тамос бо мо',
      title: 'Хадамоти ғамхорӣ ва дастгирӣ',
      subtitle: 'Оид ба методология ё кори платформа савол доред? Мо ҳамеша дар тамос ҳастем.',
      emailLabel: 'Почтаи электронии шумо',
      subjectLabel: 'Мавзӯи муроҷиат',
      subjectPlaceholder: 'Савол оид ба тести биноӣ / Методология',
      msgLabel: 'Матни паём',
      msgPlaceholder: 'Саволи худро муфассал шарҳ диҳед...',
      sendBtn: 'Фиристодани дархост',
      sendingBtn: 'Дар ҳоли ирсол...',
      successNotify: 'Дархости шумо бомуваффақият ба тими дастгирии SIHAT фиристода шуд.',
      sentTitle: 'Паём фиристода шуд!',
      sentDesc: 'Мо муроҷиати шуморо гирифтем ва дар давоми 24 соат ба почтаи шумо посух медиҳем.',
      sendAnother: 'Фиристодани паёми дигар',
    },
    en: {
      badge: 'Get in Touch',
      title: 'Care & Support Service',
      subtitle: 'Questions regarding methodology or platform operations? We are always ready to assist.',
      emailLabel: 'Your Email',
      subjectLabel: 'Subject',
      subjectPlaceholder: 'Inquiry regarding vision screening / Methodology',
      msgLabel: 'Message',
      msgPlaceholder: 'Describe your inquiry in detail...',
      sendBtn: 'Send Message',
      sendingBtn: 'Sending...',
      successNotify: 'Your inquiry has been successfully sent to the SIHAT support team.',
      sentTitle: 'Message Dispatched!',
      sentDesc: 'We received your inquiry and will follow up via email within 24 hours.',
      sendAnother: 'Send another message',
    },
  }[lang] || {
    badge: 'Get in Touch',
    title: 'Care & Support Service',
    subtitle: 'Questions regarding methodology or platform operations? We are always ready to assist.',
    emailLabel: 'Your Email',
    subjectLabel: 'Subject',
    subjectPlaceholder: 'Inquiry regarding vision screening / Methodology',
    msgLabel: 'Message',
    msgPlaceholder: 'Describe your inquiry in detail...',
    sendBtn: 'Send Message',
    sendingBtn: 'Sending...',
    successNotify: 'Your inquiry has been successfully sent to the SIHAT support team.',
    sentTitle: 'Message Dispatched!',
    sentDesc: 'We received your inquiry and will follow up via email within 24 hours.',
    sendAnother: 'Send another message',
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await apiRequest('/support/tickets', {
        method: 'POST',
        body: JSON.stringify({
          contact_email: email,
          subject,
          message,
        }),
      })
      setSent(true)
      onNotify(labels.successNotify)
      setEmail('')
      setSubject('')
      setMessage('')
    } catch (err: unknown) {
      onNotify(err instanceof Error ? err.message : 'Error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section id="contact" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="max-w-2xl mx-auto text-center mb-10">
        <Badge variant="emerald" className="mb-2">
          {labels.badge}
        </Badge>
        <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
          {labels.title}
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          {labels.subtitle}
        </p>
      </div>

      <Card className="max-w-xl mx-auto p-6 sm:p-8">
        {sent ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{labels.sentTitle}</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
              {labels.sentDesc}
            </p>
            <Button variant="outline" size="sm" onClick={() => setSent(false)} className="mt-2">
              {labels.sendAnother}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                {labels.emailLabel}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                {labels.subjectLabel}
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={labels.subjectPlaceholder}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                {labels.msgLabel}
              </label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={labels.msgPlaceholder}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>

            <Button
              type="submit"
              variant="emerald"
              disabled={loading}
              className="w-full gap-2 py-3"
            >
              <Send className="w-4 h-4" />
              <span>{loading ? labels.sendingBtn : labels.sendBtn}</span>
            </Button>
          </form>
        )}
      </Card>
    </section>
  )
}
