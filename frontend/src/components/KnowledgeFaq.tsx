import React, { useState, useMemo } from 'react'
import {
  ChevronDown,
  HelpCircle,
  Search,
  Send,
  CheckCircle2,
  AlertCircle,
  MessageSquarePlus,
  ExternalLink,
} from 'lucide-react'
import { Card } from './ui/Card'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import { apiRequest } from '../api'
import type { Language, Translations } from '../i18n'
import type { FaqItem, KnowledgeArticle } from '../types'

interface KnowledgeFaqProps {
  t?: Translations
  lang: Language
  faq: FaqItem[]
  articles: KnowledgeArticle[]
  onNavigateArticle?: (article: KnowledgeArticle) => void
}

interface ComprehensiveFaq {
  category: 'platform' | 'privacy' | 'methodology' | 'devices'
  q: { ru: string; tj: string; en: string }
  a: { ru: string; tj: string; en: string }
}

const EXTENDED_FAQS: ComprehensiveFaq[] = [
  {
    category: 'platform',
    q: {
      ru: 'Что такое платформа SIHAT и для чего она создана?',
      tj: 'Платформаи SIHAT чист ва барои чӣ таъсис ёфтааст?',
      en: 'What is SIHAT and what is its purpose?',
    },
    a: {
      ru: 'SIHAT — это веб-платформа для осознанного самонаблюдения, когнитивного скрининга и проверки сенсорных функций (зрение, слух, координация, внимание, память). Она позволяет отслеживать личные параметры в динамике в одинаковых условиях без искажений.',
      tj: 'SIHAT — ин платформаи рақамӣ барои худмушоҳида ва скрининги қобилиятҳои маърифатӣ ва сенсорӣ (биниш, шунавоӣ, ҳамоҳангии ҳаракат, тамаркуз ва хотира) мебошад. Он имкон медиҳад, ки тағйироти шахсӣ дар шароити баробар сабт шаванд.',
      en: 'SIHAT is a web platform for conscious self-observation, cognitive screening, and sensory monitoring (vision, hearing, motor coordination, attention, memory) using standardized digital benchmarks.',
    },
  },
  {
    category: 'platform',
    q: {
      ru: 'Является ли SIHAT медицинским диагностическим инструментом?',
      tj: 'Оё SIHAT воситаи ташхиси расмии тиббӣ мебошад?',
      en: 'Is SIHAT a clinical medical diagnostic tool?',
    },
    a: {
      ru: 'Нет. Платформа SIHAT не ставит клинических диагнозов, не заменяет очный осмотр врача-специалиста (офтальмолога, невролога, сурдолога) и не вычисляет абстрактный «процент общего здоровья». Она помогает заметить изменения и подготовить объективные данные к визиту к врачу.',
      tj: 'Не. Платформаи SIHAT ташхиси клиникӣ намегузорад ва машварати табиби мутахассисро иваз намекунад. Он танҳо барои худсанҷиши огоҳона ва сабти тағйироти аввалия пешбинӣ шудааст.',
      en: 'No. SIHAT does not provide medical diagnoses, formulate treatment plans, or compute arbitrary health percentages. It delivers evidence-bounded self-observation exercises to help track trends.',
    },
  },
  {
    category: 'privacy',
    q: {
      ru: 'Как защищена конфиденциальность моих результатов?',
      tj: 'Махфияти маълумот ва натиҷаҳои ман чӣ гуна ҳифз мешавад?',
      en: 'How is the privacy of my results protected?',
    },
    a: {
      ru: 'Мы строго соблюдаем принцип Zero-Retention (нулевого удержания). В гостевом режиме результаты существуют только в оперативной памяти вашего браузера. При сохранении в профиль данные шифруются, не связываются с коммерческими рекламными сетями и могут быть удалены вами в один клик.',
      tj: 'Мо принсипи Zero-Retention-ро риоя мекунем. Дар ҳолати меҳмонӣ маълумот дар сервер сабт намешавад. Ҳангоми сабт дар профил ҳамаи натиҷаҳо рамзгузорӣ шуда, ба шабакаҳои таблиғотӣ ҳаргиз дода намешаванд.',
      en: 'We uphold strict Zero-Retention principles. In guest mode, data lives only in memory. When saved to your account, results are encrypted and never transmitted to advertising networks or third-party trackers.',
    },
  },
  {
    category: 'privacy',
    q: {
      ru: 'Передаются ли данные сторонним рекламным трекерам (Google, Meta)?',
      tj: 'Оё маълумот ба трекерҳои таблиғотии дигар (Google, Meta) интиқол меёбад?',
      en: 'Is any data shared with advertising networks (Google, Meta)?',
    },
    a: {
      ru: 'Категорически нет. В архитектуре SIHAT полностью отсутствуют коммерческие рекламные пиксели, трекеры ремаркетинга или сторонние аналитические скрипты, которые могли бы собирать цифровой отпечаток вашего здоровья.',
      tj: 'Қатъиян не. Дар сохтори SIHAT ягон пиксели тиҷоратии шабакаҳои таблиғотӣ ва скриптҳои пайгирӣ мавҷуд нест.',
      en: 'Strictly no. SIHAT does not deploy third-party advertising pixels, remarketing tags, or health-tracking commercial scripts.',
    },
  },
  {
    category: 'methodology',
    q: {
      ru: 'На каких научных стандартах основаны упражнения?',
      tj: 'Машқҳо дар кадом стандартҳои илмӣ асос ёфтаанд?',
      en: 'What scientific standards are the exercises based on?',
    },
    a: {
      ru: 'Все методики соответствуют открытым научным протоколам: таблицы Шульте (исследование переключаемости внимания), таблицы Рабкина 9-е изд. и Ишихара (цветовосприятие), решётки Габора (контрастная чувствительность ISO 8596), Motor Steering Law (точность движений руки ISO 9241-9). Паспорт методики доступен в карточке каждого теста.',
      tj: 'Ҳамаи методҳо ба стандартҳои байналмилалӣ мувофиқанд: ҷадвалҳои Шульте, лавҳаҳои Рабкин ва Ишихара, панҷараҳои Габор ва стандарти ҳамоҳангии ISO 9241-9. Ҳар як метод шиносномаи илмии худро дорад.',
      en: 'Every exercise follows established clinical protocols: Schulte attention grids, Rabkin & Ishihara trichromacy plates, Gabor contrast gratings, and ISO 9241-9 Motor Steering Law kinematics.',
    },
  },
  {
    category: 'methodology',
    q: {
      ru: 'Почему SIHAT не вычисляет единый «общий процент здоровья»?',
      tj: 'Чаро SIHAT «фоизи умумии саломатӣ»-ро ҳисоб намекунад?',
      en: 'Why does SIHAT avoid calculating an arbitrary total health score?',
    },
    a: {
      ru: 'В доказательной медицине не существует универсального «процента здоровья». Объединение слухового порога, цветоразличения и скорости реакции в одну вымышленную цифру вводит пользователя в опасное заблуждение. SIHAT предоставляет точные, раздельные метрики с референсными границами нормы.',
      tj: 'Дар тибби илмӣ «фоизи умумии саломатӣ» вуҷуд надорад. Якҷоя кардани шунавоӣ, биниш ва суръати аксуламал ба як рақам корбарро гумроҳ месозад. SIHAT нишондиҳандаҳои алоҳида ва дақиқро пешниҳод менамояд.',
      en: 'In evidence-based medicine, an arbitrary combined "health score" is scientifically invalid. Conflating sensory acuity with motor speed obscures clinically significant individual variance.',
    },
  },
  {
    category: 'devices',
    q: {
      ru: 'Влияет ли частота обновления экрана (60 Гц vs 144 Гц) на время реакции?',
      tj: 'Оё суръати экрани монитор (60 Гц ё 144 Гц) ба вақти вокуниш таъсир дорад?',
      en: 'Does monitor refresh rate (60Hz vs 144Hz) affect reaction time?',
    },
    a: {
      ru: 'Да, мониторы с частотой 60 Гц обновляют кадр каждые 16.6 мс, а 144 Гц — каждые 6.9 мс. Поэтому для объективного сравнения динамики мы рекомендуем проходить повторные тесты на одном и том же устройстве при стабильном освещении.',
      tj: 'Бале, экранҳои 60 Гц тасвирро ҳар 16.6 мс нав мекунанд, экранҳои 144 Гц бошад ҳар 6.9 мс. Барои муқоисаи дурусти динамика машқҳоро дар як дастгоҳ такрор кунед.',
      en: 'Yes. A 60Hz display introduces up to 16.6ms input latency compared to 6.9ms on 144Hz displays. For reliable longitudinal comparisons, perform repeat attempts on the same device.',
    },
  },
  {
    category: 'devices',
    q: {
      ru: 'Влияют ли ночной режим (Night Shift, f.lux) на цветовую проверку?',
      tj: 'Оё реҷаи шабона (Night Shift) ба санҷиши рангҳо таъсир мерасонад?',
      en: 'Do night light filters (Night Shift, f.lux) alter color perception tests?',
    },
    a: {
      ru: 'Да, обязательно отключайте фильтры тёплого света перед проверкой цветовосприятия и контрастной чувствительности. Фильтры сдвигают сине-жёлтый спектр (S-колбочки) и вызывают ложные ошибки.',
      tj: 'Бале, пеш аз оғози санҷиши рангҳо реҷаи шабонаро ҳатман хомӯш кунед, чунки он спектри кабуду зардро тағйир дода, хатоҳои бардурӯғ меорад.',
      en: 'Yes. Always disable Night Shift, True Tone, or blue-light filters before color vision exercises, as warm-tint overlays distort S-cone spectral stimuli.',
    },
  },
  {
    category: 'devices',
    q: {
      ru: 'Как правильно откалибровать звук для упражнений на слух?',
      tj: 'Барои машқҳои шунавоӣ садоро чӣ гуна бояд дуруст танзим кард?',
      en: 'How should audio volume be calibrated for hearing exercises?',
    },
    a: {
      ru: 'Используйте наушники (вкладыши или полноразмерные). Перед началом теста звучит контрольный тон комфортной громкости. Отрегулируйте системную громкость так, чтобы тон звучал отчётливо, но мягко, и не меняйте её в процессе скрининга.',
      tj: 'Аз гӯшмонакҳо истифода баред. Пеш аз оғоз овози озмоишӣ садо медиҳад. Онро ба сатҳи мусоид монед ва ҳангоми машқ баландиро дигар накунед.',
      en: 'Use stereo headphones. Prior to test execution, a baseline reference tone is played. Adjust system volume to comfortable speech volume and keep it constant throughout the trials.',
    },
  },
  {
    category: 'methodology',
    q: {
      ru: 'Как экспортировать результаты в официальный PDF для врача?',
      tj: 'Натиҷаҳоро чӣ гуна метавон ба файли PDF барои табиб содир кард?',
      en: 'How can results be exported to an official PDF for a physician?',
    },
    a: {
      ru: 'На странице отчёта любого завершённого теста или в личном кабинете нажмите кнопку «Скачать PDF-отчёт». Система сформирует защищённый документ с паспортом методики, графиком выполнения, временными интервалами и юридическим дисклеймером.',
      tj: 'Дар саҳифаи ҳисоботи машқ ё дар утоқи шахсӣ тугмаи «Боргирии PDF»-ро пахш намоед. Ҳуҷҷати расмӣ бо шиносномаи методӣ ва графикҳо сабт мешавад.',
      en: 'Click "Download PDF Report" on any report view or in your profile. SIHAT compiles an authenticated document detailing methodology credentials, telemetry graphs, and clinical context.',
    },
  },
]

export const KnowledgeFaq: React.FC<KnowledgeFaqProps> = ({
  lang,
  faq: _faq,
  articles,
  onNavigateArticle,
}) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'platform' | 'privacy' | 'methodology' | 'devices'>('all')

  // Ask Question Form State
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [contactEmail, setContactEmail] = useState('')
  const [ticketSubject, setTicketSubject] = useState('')
  const [ticketMessage, setTicketMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const labels = {
    ru: {
      badgeFaq: 'База ответов',
      titleFaq: 'Часто задаваемые вопросы',
      subtitleFaq: 'Всё о границах применения, конфиденциальности данных и научной основе платформы SIHAT.',
      searchPlaceholder: 'Поиск по вопросам и ответам...',
      catAll: 'Все темы',
      catPlatform: 'О платформе',
      catPrivacy: 'Конфиденциальность',
      catMethodology: 'Методики и наука',
      catDevices: 'Оборудование и звук',
      badgeKnowledge: 'Материалы',
      titleKnowledge: 'База знаний SIHAT',
      subtitleKnowledge: 'Полезные экспертные статьи о гигиене зрения, сна и слуха.',
      askQuestionBtn: 'Задать свой вопрос',
      askTitle: 'Не нашли ответ? Задайте свой вопрос команде SIHAT',
      askSubtitle: 'Наши специалисты по методологии и технической поддержке ответят на ваш email в течение 24 часов.',
      emailLabel: 'Ваш контактный email',
      subjectLabel: 'Тема вопроса',
      messageLabel: 'Текст вопроса или описание ситуации',
      sendBtn: 'Отправить вопрос',
      sendingBtn: 'Отправка...',
      successMsg: 'Ваш вопрос успешно зарегистрирован! Номер обращения:',
      errorMsg: 'Не удалось отправить вопрос. Пожалуйста, проверьте введённые данные.',
    },
    tj: {
      badgeFaq: 'Пойгоҳи посухҳо',
      titleFaq: 'Саволҳои маъмул',
      subtitleFaq: 'Ҳама чиз дар бораи ҳудуди татбиқ, махфияти маълумот ва пояи илмии платформаи SIHAT.',
      searchPlaceholder: 'Ҷустуҷӯи савол ва ҷавобҳо...',
      catAll: 'Ҳамаи мавзӯъҳо',
      catPlatform: 'Оид ба платформа',
      catPrivacy: 'Махфият ва амният',
      catMethodology: 'Методика ва илм',
      catDevices: 'Таҷҳизот ва садо',
      badgeKnowledge: 'Маводҳо',
      titleKnowledge: 'Пойгоҳи донишҳои SIHAT',
      subtitleKnowledge: 'Мақолаҳои муфид дар бораи гигиенаи биноӣ, хоб ва шунавоӣ.',
      askQuestionBtn: 'Саволи худро диҳед',
      askTitle: 'Ҷавобро наёфтед? Саволи худро ба дастаи SIHAT фиристед',
      askSubtitle: 'Мутахассисони мо дар давоми 24 соат ба почтаи электронии шумо посух медиҳанд.',
      emailLabel: 'Email-и шумо',
      subjectLabel: 'Мавзӯи савол',
      messageLabel: 'Матни савол',
      sendBtn: 'Фиристодани савол',
      sendingBtn: 'Дар ҳоли фиристодан...',
      successMsg: 'Саволи шумо бомуваффақият сабт шуд! Рақами муроҷиат:',
      errorMsg: 'Фиристодани савол муяссар нашуд. Лутфан маълумотро дубора санҷед.',
    },
    en: {
      badgeFaq: 'Help & Knowledge Base',
      titleFaq: 'Frequently Asked Questions',
      subtitleFaq: 'All about clinical scope, data privacy, device calibration, and scientific protocols behind SIHAT.',
      searchPlaceholder: 'Search questions and answers...',
      catAll: 'All Topics',
      catPlatform: 'About Platform',
      catPrivacy: 'Privacy & Security',
      catMethodology: 'Methodology & Science',
      catDevices: 'Hardware & Calibration',
      badgeKnowledge: 'Clinical Library',
      titleKnowledge: 'SIHAT Knowledge Base',
      subtitleKnowledge: 'Practical articles on vision hygiene, ergonomics, and sensory preservation.',
      askQuestionBtn: 'Ask a Question',
      askTitle: "Didn't find an answer? Submit your inquiry to SIHAT",
      askSubtitle: 'Our methodological and support team will reply directly to your email within 24 hours.',
      emailLabel: 'Contact Email',
      subjectLabel: 'Subject',
      messageLabel: 'Your Question or Message',
      sendBtn: 'Submit Question',
      sendingBtn: 'Submitting...',
      successMsg: 'Your question was submitted successfully! Ticket ID:',
      errorMsg: 'Failed to submit question. Please check the provided information.',
    },
  }[lang]

  // Filtered FAQ items
  const filteredFaqs = useMemo(() => {
    return EXTENDED_FAQS.filter((item) => {
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false
      if (!searchQuery.trim()) return true
      const qText = item.q[lang] || item.q.ru
      const aText = item.a[lang] || item.a.ru
      const q = searchQuery.toLowerCase()
      return qText.toLowerCase().includes(q) || aText.toLowerCase().includes(q)
    })
  }, [selectedCategory, searchQuery, lang])

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contactEmail || !ticketSubject || !ticketMessage) return

    setIsSubmitting(true)
    setSubmitError(null)
    setSubmitSuccess(null)

    try {
      const res = await apiRequest<{ id: string }>('/support/tickets', {
        method: 'POST',
        body: JSON.stringify({
          contact_email: contactEmail.trim(),
          subject: ticketSubject.trim(),
          message: ticketMessage.trim(),
        }),
      })

      if (res?.id) {
        setSubmitSuccess(res.id)
        setTicketSubject('')
        setTicketMessage('')
      }
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : labels.errorMsg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section id="faq" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <Badge variant="emerald" className="mb-2">
            {labels.badgeFaq}
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            {labels.titleFaq}
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 max-w-2xl">
            {labels.subtitleFaq}
          </p>
        </div>

        <Button
          variant="emerald"
          onClick={() => setIsFormOpen((prev) => !prev)}
          className="gap-2 shrink-0 cursor-pointer shadow-md self-start md:self-auto"
        >
          <MessageSquarePlus className="w-4 h-4" />
          <span>{labels.askQuestionBtn}</span>
        </Button>
      </div>

      {/* Interactive Ask Question Form (Collapsible) */}
      {isFormOpen && (
        <Card className="p-6 sm:p-8 rounded-3xl bg-emerald-500/[0.04] dark:bg-emerald-500/[0.06] border-emerald-500/30 shadow-lg animate-in fade-in duration-300 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <MessageSquarePlus className="w-5 h-5 text-emerald-500" />
                <span>{labels.askTitle}</span>
              </h3>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                {labels.askSubtitle}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
            >
              ✕ Закрыть
            </button>
          </div>

          {submitSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>
                {labels.successMsg} <strong>{submitSuccess}</strong>
              </span>
            </div>
          )}

          {submitError && (
            <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          <form onSubmit={handleSubmitQuestion} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  {labels.emailLabel}
                </label>
                <input
                  type="email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  {labels.subjectLabel}
                </label>
                <input
                  type="text"
                  required
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  placeholder="Вопрос по методике / техническая проблема"
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                {labels.messageLabel}
              </label>
              <textarea
                required
                rows={3}
                value={ticketMessage}
                onChange={(e) => setTicketMessage(e.target.value)}
                placeholder="Опишите ваш вопрос или возникшую сложность..."
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                variant="emerald"
                size="sm"
                disabled={isSubmitting}
                className="gap-2 cursor-pointer font-bold"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? labels.sendingBtn : labels.sendBtn}</span>
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Search and Category Filters */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative max-w-xl">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={labels.searchPlaceholder}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs sm:text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'all', label: labels.catAll },
            { id: 'platform', label: labels.catPlatform },
            { id: 'privacy', label: labels.catPrivacy },
            { id: 'methodology', label: labels.catMethodology },
            { id: 'devices', label: labels.catDevices },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: FAQ Accordion and Knowledge Base Articles */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left: FAQ Accordion */}
        <div className="lg:col-span-7 space-y-3">
          {filteredFaqs.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 text-xs text-zinc-400">
              По вашему запросу вопросов не найдено. Нажмите «Задать свой вопрос» выше.
            </div>
          ) : (
            filteredFaqs.map((item, idx) => {
              const isOpen = openFaqIndex === idx
              const qText = item.q[lang] || item.q.ru
              const aText = item.a[lang] || item.a.ru

              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden transition-all shadow-sm"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-4 sm:p-5 text-left font-semibold text-zinc-900 dark:text-zinc-100 flex items-center justify-between gap-4 hover:text-emerald-500 transition-colors cursor-pointer"
                  >
                    <span className="text-xs sm:text-sm flex items-center gap-2.5">
                      <HelpCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                      {qText}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-emerald-500' : 'text-zinc-400'
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed border-t border-zinc-100 dark:border-zinc-800/80 pt-3 animate-in fade-in duration-200">
                      {aText}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Right: Knowledge Articles */}
        <div className="lg:col-span-5 space-y-4">
          <div>
            <Badge variant="cyan" className="mb-2">
              {labels.badgeKnowledge}
            </Badge>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
              {labels.titleKnowledge}
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
              {labels.subtitleKnowledge}
            </p>
          </div>

          <div className="space-y-3">
            {(articles.length > 0 ? articles : [
              {
                id: 'standards',
                slug: 'standards',
                category: 'standards',
                sort_order: 1,
                is_published: true,
                created_at: new Date().toISOString(),
                localizations: {
                  ru: { title: 'Стандарты паспортов методик SIHAT', excerpt: 'Каждая методика проходит обязательную проверку источников.' },
                  tj: { title: 'Стандартҳои шиносномаи методҳои SIHAT', excerpt: 'Ҳар як метод тафтиши ҳатмии сарчашмаҳоро мегузарад.' },
                  en: { title: 'SIHAT Methodology Passport Standards', excerpt: 'All screening exercises strictly align with published peer-reviewed sources.' },
                },
              },
              {
                id: 'guidance',
                slug: 'guidance',
                category: 'guidance',
                sort_order: 2,
                is_published: true,
                created_at: new Date().toISOString(),
                localizations: {
                  ru: { title: 'Влияние дисплея и окружения на результаты', excerpt: 'Пользовательские экраны и освещение влияют на визуальные метрики.' },
                  tj: { title: 'Таъсири экран ва рӯшноӣ ба натиҷаҳо', excerpt: 'Равшании хона ва суръати экран ба нишондиҳандаҳо таъсир мерасонанд.' },
                  en: { title: 'Display Latency & Ambient Environment Impact', excerpt: 'How refresh rates, room lighting, and headphone drivers shape outcomes.' },
                },
              },
              {
                id: 'circadian',
                slug: 'circadian',
                category: 'wellbeing',
                sort_order: 3,
                is_published: true,
                created_at: new Date().toISOString(),
                localizations: {
                  ru: { title: 'Циркадные ритмы и когнитивная работоспособность', excerpt: 'Почему пик скорости реакции наступает во второй половине дня.' },
                  tj: { title: 'Ритмҳои сиркадӣ ва қобилияти маърифатӣ', excerpt: 'Чаро суръати аксуламал дар нимаи дуюми рӯз беҳтар мешавад.' },
                  en: { title: 'Circadian Cycles & Cognitive Performance', excerpt: 'Understanding diurnal variations in reaction speed and attentional vigilance.' },
                },
              },
            ]).map((art) => {
              const loc = (art.localizations?.[lang] || art.localizations?.ru || {}) as any
              return (
                <div
                  key={art.id}
                  onClick={() => onNavigateArticle && onNavigateArticle(art as any)}
                  className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/40 transition-all cursor-pointer group shadow-sm"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      {art.category}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-white group-hover:text-emerald-500 transition-colors flex items-center justify-between">
                    <span>{loc.title || art.slug}</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-500 shrink-0" />
                  </h4>
                  {loc.excerpt && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                      {loc.excerpt}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
