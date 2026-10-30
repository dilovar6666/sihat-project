import React, { useState, useMemo } from 'react'
import {
  ChevronDown,
  HelpCircle,
  Search,
  Send,
  CheckCircle2,
  AlertCircle,
  MessageSquarePlus,
  ShieldCheck,
  Brain,
  Monitor,
  Activity,
  Sparkles,
  BookOpen,
  ThumbsUp,
  ThumbsDown,
  Clock,
  Check,
  PhoneCall,
  X,
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
  onNavigateAssistant?: () => void
}

interface ComprehensiveFaq {
  id: string
  category: 'platform' | 'privacy' | 'methodology' | 'devices'
  tag: { ru: string; tj: string; en: string }
  q: { ru: string; tj: string; en: string }
  a: { ru: string; tj: string; en: string }
}

const EXTENDED_FAQS: ComprehensiveFaq[] = [
  {
    id: 'faq-1',
    category: 'platform',
    tag: { ru: 'О платформе', tj: 'Дар бораи платформа', en: 'Platform' },
    q: {
      ru: 'Что такое платформа SIHAT и для чего она создана?',
      tj: 'Платформаи SIHAT чист ва барои чӣ таъсис ёфтааст?',
      en: 'What is SIHAT and what is its purpose?',
    },
    a: {
      ru: 'SIHAT — это современная цифровая веб-платформа для осознанного самонаблюдения, когнитивного скрининга и объективной оценки сенсорных функций (зрение, слух, координация, внимание, память). Сервис создан для того, чтобы каждый человек мог отслеживать динамику личных психофизиологических показателей в строго одинаковых условиях без погрешностей.',
      tj: 'SIHAT — ин платформаи муосири рақамӣ барои худмушоҳидаи огоҳона, скрининги қобилиятҳои маърифатӣ ва санҷиши вазифаҳои сенсорӣ (биниш, шунавоӣ, ҳамоҳангии ҳаракат, тамаркуз ва хотира) мебошад. Он имкон медиҳад, ки нишондиҳандаҳои шахсӣ дар шароити якхела ва бе таҳриф сабт шаванд.',
      en: 'SIHAT is an evidence-bounded digital platform for cognitive screening and sensory self-observation (vision, hearing, motor coordination, attention, memory) using standardized digital benchmarks.',
    },
  },
  {
    id: 'faq-2',
    category: 'platform',
    tag: { ru: 'Границы применения', tj: 'Ҳудуди истифода', en: 'Clinical Scope' },
    q: {
      ru: 'Является ли SIHAT медицинским диагностическим инструментом?',
      tj: 'Оё SIHAT воситаи ташхиси расмии тиббӣ мебошад?',
      en: 'Is SIHAT a clinical medical diagnostic tool?',
    },
    a: {
      ru: 'Нет. Платформа SIHAT не ставит клинических диагнозов, не заменяет очный визит к врачу (офтальмологу, неврологу, сурдологу) и не вычисляет абстрактный «процент здоровья». Платформа предназначена для раннего выявления отклонений от персонального базового уровня и подготовки объективных данных для консультации со специалистом.',
      tj: 'Не. Платформаи SIHAT ташхиси расмии тиббӣ намегузорад ва муоинаи табиби мутахассисро иваз намекунад. Он барои пайгирии тағйироти аввалия ва омода намудани маълумоти саҳеҳ ба табиб пешбинӣ шудааст.',
      en: 'No. SIHAT does not provide medical diagnoses, formulate treatment plans, or compute arbitrary health percentages. It delivers evidence-bounded self-observation exercises to help track personal performance trends.',
    },
  },
  {
    id: 'faq-3',
    category: 'privacy',
    tag: { ru: 'Zero-Retention', tj: 'Бе сабти маълумот', en: 'Zero-Retention' },
    q: {
      ru: 'Как защищена конфиденциальность моих результатов?',
      tj: 'Махфияти маълумот ва натиҷаҳои ман чӣ гуна ҳифз мешавад?',
      en: 'How is the privacy of my results protected?',
    },
    a: {
      ru: 'Мы строго соблюдаем международный принцип Zero-Retention (нулевое удержание). В гостевом режиме сырые ответы и траектории хранятся исключительно в оперативной памяти вашего браузера. При сохранении в профиль данные шифруются по протоколам TLS 1.3 / AES-256, изолируются и никогда не передаются сторонним организациям.',
      tj: 'Мо принсипи Zero-Retention-ро риоя мекунем. Дар ҳолати меҳмонӣ маълумот танҳо дар хотираи фаврии браузери шумо мавҷуд аст. Ҳангоми сабт дар профил ҳамаи натиҷаҳо бо TLS 1.3 ва AES-256 рамзгузорӣ шуда, ба ҳеҷ ҷониби сеюм дода намешаванд.',
      en: 'We uphold strict Zero-Retention principles. In guest mode, data lives only in ephemeral client memory. When saved to your account, results are encrypted via TLS 1.3 / AES-256 and never shared with external parties.',
    },
  },
  {
    id: 'faq-4',
    category: 'privacy',
    tag: { ru: 'Трекеры и реклама', tj: 'Бидуни таблиғ', en: 'No Ad Trackers' },
    q: {
      ru: 'Передаются ли данные сторонним рекламным трекерам (Google, Meta)?',
      tj: 'Оё маълумот ба трекерҳои таблиғотии дигар (Google, Meta) интиқол меёбад?',
      en: 'Is any data shared with advertising networks (Google, Meta)?',
    },
    a: {
      ru: 'Категорически нет. В программном коде SIHAT полностью отсутствуют коммерческие рекламные пиксели (Meta Pixel, Google Ads, TikTok Pixel) и скрытые системы видеозаписи экрана (вебвизоры). Ваши когнитивные показатели принадлежат только вам.',
      tj: 'Қатъиян не. Дар рамзи барномавии SIHAT ягон пиксели тиҷоратии шабакаҳои таблиғотӣ ва скриптҳои сабти амалҳои корбар мавҷуд нест. Натиҷаҳои шумо танҳо ба худи шумо дастрасанд.',
      en: 'Strictly no. SIHAT does not deploy third-party advertising pixels, remarketing tags, or session replay trackers. Your cognitive and sensory data remains solely yours.',
    },
  },
  {
    id: 'faq-5',
    category: 'methodology',
    tag: { ru: 'Стандарты науки', tj: 'Стандартҳои илмӣ', en: 'Scientific Standards' },
    q: {
      ru: 'На каких научных стандартах основаны упражнения?',
      tj: 'Машқҳо дар кадом стандартҳои илмӣ асос ёфтаанд?',
      en: 'What scientific standards are the exercises based on?',
    },
    a: {
      ru: 'Каждое упражнение опирается на валидированные международные протоколы: таблицы Шульте (исследование переключаемости внимания), полихроматические таблицы Рабкина 9-е изд. и Ишихара (цветовосприятие CIE 1931), решётки Габора (контрастная чувствительность ISO 8596), Motor Steering Law (точность движений руки ISO 9241-9) и нормативы Miller 7±2. Паспорт с научными ссылками доступен в карточке каждого теста.',
      tj: 'Ҳамаи методҳо ба протоколҳои эътирофшуда такя мекунанд: ҷадвалҳои Шульте, лавҳаҳои Рабкин ва Ишихара (CIE 1931), решёткаҳои Габор (ISO 8596), стандарти ҳамоҳангии ISO 9241-9 ва қоидаи Миллер 7±2. Шиносномаи муфассал дар саҳифаи ҳар як машқ дастрас аст.',
      en: 'Every exercise follows established clinical protocols: Schulte attention grids, Rabkin & Ishihara trichromacy plates, Gabor contrast gratings, and ISO 9241-9 Motor Steering Law kinematics.',
    },
  },
  {
    id: 'faq-6',
    category: 'methodology',
    tag: { ru: 'Оценка здоровья', tj: 'Баҳодиҳии саломатӣ', en: 'Holistic Scores' },
    q: {
      ru: 'Почему SIHAT не вычисляет единый «общий процент здоровья»?',
      tj: 'Чаро SIHAT як фоизи умумии «саломатии комил»-ро ҳисоб намекунад?',
      en: 'Why does SIHAT avoid calculating a single unified health score?',
    },
    a: {
      ru: 'С медицинской и научной точки зрения объединение разнородных сенсорных систем (слух, аккомодация глаз, скорость реакции, пространственная память) в одну цифру некорректно и вводит человека в заблуждение. Высокая скорость реакции не компенсирует снижение контрастного зрения. SIHAT предоставляет детализированный профиль по каждой отдельной функции.',
      tj: 'Аз нигоҳи тиббӣ якҷоя кардани системаҳои гуногуни ҳиссиёт (шунавоӣ, биниш, суръати вокуниш ва хотира) ба як рақами умумӣ нодуруст аст. Суръати хуби вокуниш пастшавии биниши контрастиро ҷуброн карда наметавонад. SIHAT нишондиҳандаҳоро алоҳида таҳлил мекунад.',
      en: 'From a clinical standpoint, collapsing disparate sensory and cognitive domains into a single arbitrary score is misleading. Exceptional motor speed cannot offset reduced contrast sensitivity; SIHAT analyzes each physiological metric independently.',
    },
  },
  {
    id: 'faq-7',
    category: 'devices',
    tag: { ru: 'Экраны и Гц', tj: 'Экран ва Гертс', en: 'Monitors & Hz' },
    q: {
      ru: 'Влияет ли частота обновления экрана (60 Гц vs 144 Гц) на время реакции?',
      tj: 'Оё суръати навшавии экран (60 Гц ё 144 Гц) ба вақти вокуниш таъсир мерасонад?',
      en: 'Does screen refresh rate (60 Hz vs 144 Hz) impact reaction time scores?',
    },
    a: {
      ru: 'Да, мониторы с частотой 60 Гц имеют аппаратный интервал кадра ~16.6 мс, тогда как при 144 Гц задержка составляет всего ~6.9 мс. Кроме того, беспроводные мыши или Bluetooth-наушники могут добавлять до 30-50 мс задержки. Поэтому важно сравнивать результаты, полученные на одном и том же устройстве.',
      tj: 'Бале, экранҳои 60 Гц тақрибан 16.6 мс таъхир доранд, дар ҳоле ки экранҳои 144 Гц танҳо 6.9 мс таъхир доранд. Инчунин гӯшмонакҳои Bluetooth ё мушҳои бесим метавонанд 30-50 мс таъхир илова кунанд. Аз ин рӯ, натиҷаҳоро дар ҳамон як дастгоҳ муқоиса кардан тавсия мешавад.',
      en: 'Yes. A 60 Hz display has a frame interval of ~16.6 ms, whereas 144 Hz reduces latency to ~6.9 ms. Wireless peripherals also introduce input latency. For valid longitudinal tracking, use consistent hardware.',
    },
  },
  {
    id: 'faq-8',
    category: 'devices',
    tag: { ru: 'Калибровка цвета', tj: 'Танзими рангҳо', en: 'Color Calibration' },
    q: {
      ru: 'Влияют ли ночной режим (Night Shift, f.lux) на цветовую проверку?',
      tj: 'Оё режими шабона (Night Shift, f.lux) ба санҷиши рангҳо таъсир мерасонад?',
      en: 'Do night light filters (Night Shift, f.lux) distort color vision tests?',
    },
    a: {
      ru: 'Критически влияют. Любые фильтры синего света, приложения вроде f.lux или функции Night Shift смещают цветовую температуру дисплея в тёплый жёлто-оранжевый спектр. При прохождении тестов на цветовосприятие (Рабкин, Ишихара) и контраст их обязательно нужно отключить и установить яркость дисплея на 70-80%.',
      tj: 'Таъсири хеле калон мерасонанд. Филтрҳои ранги кабуд ва режимҳои шабона ҳарорати рангҳоро тағйир медиҳанд. Ҳангоми гузаштани санҷишҳои биниш (Рабкин, Ишихара) ин барномаҳоро ҳатман хомӯш кунед ва равшании экранро то 70-80% баланд намоед.',
      en: 'Significantly. Night shift filters skew the screen color spectrum toward warm amber. Always disable software color filters and set display brightness to 70–80% prior to color and contrast screenings.',
    },
  },
  {
    id: 'faq-9',
    category: 'devices',
    tag: { ru: 'Аудио и наушники', tj: 'Садо ва гӯшмонак', en: 'Audio Calibration' },
    q: {
      ru: 'Как правильно откалибровать звук для упражнений на слух?',
      tj: 'Садоро барои машқҳои шунавоӣ чӣ гуна бояд дуруст танзим кард?',
      en: 'How should audio levels be calibrated for hearing screenings?',
    },
    a: {
      ru: 'Рекомендуется использовать полноразмерные проводные наушники в тихой комнате. Перед началом тестирования включите проверочный сигнал частотой 1000 Гц и настройте громкость на комфортный, едва различимый порог. Не меняйте системную громкость во время прохождения теста.',
      tj: 'Истифодаи гӯшмонакҳои симин дар хонаи ором тавсия мешавад. Пеш аз оғоз садои озмоишии 1000 Гц-ро фаъол карда, баландӣ онро дар сатҳи мусоид ва ором танзим кунед. Ҳангоми тест баландии садоро дигар накунед.',
      en: 'Use wired over-ear headphones in a quiet environment. Calibrate via the 1000 Hz reference tone to a comfortable, clear volume and maintain that level throughout the assessment.',
    },
  },
  {
    id: 'faq-10',
    category: 'platform',
    tag: { ru: 'Экспорт PDF', tj: 'Экспорти PDF', en: 'PDF Export' },
    q: {
      ru: 'Как экспортировать результаты в официальный PDF для врача?',
      tj: 'Натиҷаҳоро чӣ гуна метавон ба файли PDF барои табиб зеркашӣ кард?',
      en: 'How can results be exported to an official PDF report for a physician?',
    },
    a: {
      ru: 'В личном кабинете или сразу после прохождения теста нажмите кнопку «Скачать PDF-отчёт». Документ формируется на официальном бланке SIHAT с указанием даты, точного времени, сырых метрик, графиков и паспорта методики со ссылкой на научный первоисточник.',
      tj: 'Дар утоқи шахсӣ ё пас аз анҷоми машқ тугмаи «PDF»-ро пахш намоед. Ҳуҷҷат дар бланки расмии SIHAT бо сабти сана, метрикаҳо, диаграммаҳо ва маълумотномаи илмӣ таҳия мешавад.',
      en: 'In your profile or completion report, click "Download PDF Report". The document formats into a standardized clinical summary containing timestamps, quantitative metrics, charts, and methodology citations.',
    },
  },
  {
    id: 'faq-11',
    category: 'privacy',
    tag: { ru: 'Удаление данных', tj: 'Нест кардани бойгонӣ', en: 'Data Erasure' },
    q: {
      ru: 'Могу ли я полностью удалить всю свою историю тестирований?',
      tj: 'Оё ман метавонам тамоми таърихи санҷишҳоямро пурра нест кунам?',
      en: 'Can I permanently erase all my testing history?',
    },
    a: {
      ru: 'Да, в соответствии со стандартом GDPR (Right to Erasure). В личном кабинете во вкладке «Безопасность» доступна функция «Очистить архив». Все ваши сохранённые протоколы и результаты удаляются из базы данных без возможности восстановления.',
      tj: 'Бале, тибқи стандарти байналмилалии GDPR. Дар бахши «Амният»-и утоқи шахсӣ тугмаи «Тоза кардани бойгонӣ» мавҷуд аст, ки ҳамаи сабтҳои шуморо аз пойгоҳи додаҳо ба пуррагӣ нест менамояд.',
      en: 'Yes, fully compliant with GDPR Right to Erasure. Under "Security" in your profile, you can clear individual records or permanently wipe your entire history from the database in one click.',
    },
  },
  {
    id: 'faq-12',
    category: 'methodology',
    tag: { ru: 'Регулярность', tj: 'Даврият', en: 'Frequency' },
    q: {
      ru: 'Как часто рекомендуется проходить когнитивные скрининги?',
      tj: 'Машқҳои маърифатиро чӣ қадар такрор кардан лозим аст?',
      en: 'How often should cognitive and sensory screenings be repeated?',
    },
    a: {
      ru: 'Для устойчивого мониторинга рекомендуется проходить скрининги 1–2 раза в неделю в одно и то же время суток (например, утром до начала интенсивной работы) и в одинаковом физическом состоянии. Это позволяет исключить влияние суточных биоритмов.',
      tj: 'Барои пайгирии дақиқ гузаштани машқҳо ҳафтае 1-2 маротиба дар як вақти муайяни рӯз (масалан, саҳар пеш аз оғози кори асосӣ) тавсия мешавад.',
      en: 'For reliable baseline monitoring, conduct screenings 1–2 times weekly at the same time of day (e.g., mornings before cognitive fatigue sets in) under consistent lighting and posture.',
    },
  },
]

export const KnowledgeFaq: React.FC<KnowledgeFaqProps> = ({
  lang,
  articles,
  onNavigateArticle,
  onNavigateAssistant,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<
    'all' | 'platform' | 'privacy' | 'methodology' | 'devices'
  >('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [openFaqId, setOpenFaqId] = useState<string | null>('faq-1')
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, 'up' | 'down'>>({})

  // Form state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [contactEmail, setContactEmail] = useState('')
  const [ticketSubject, setTicketSubject] = useState('')
  const [ticketMessage, setTicketMessage] = useState('')
  const [ticketCategory, setTicketCategory] = useState('question')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const labels = {
    ru: {
      heroPill: 'Центр поддержки и база знаний',
      heroTitle: 'Чем мы можем вам помочь?',
      heroSubtitle:
        'Экспертные ответы о научных стандартах, защите персональных данных, калибровке мониторов и правилах когнитивного самонаблюдения.',
      searchPlaceholder: 'Поиск по вопросам, методикам, стандартам...',
      resultsCount: 'Найдено ответов:',
      allFaqs: 'Все темы',
      catPlatform: 'О платформе',
      catPrivacy: 'Безопасность & Zero-Retention',
      catMethodology: 'Методики и наука',
      catDevices: 'Оборудование и калибровка',
      catPlatformDesc: 'Цели, границы самонаблюдения, интерпретация',
      catPrivacyDesc: 'Шифрование, удаление, отсутствие трекеров',
      catMethodologyDesc: 'ISO, таблицы Шульте, Рабкин, ВОЗ',
      catDevicesDesc: 'Частота 60 vs 144 Гц, звук, Night Shift',
      knowledgeTitle: 'База знаний и руководства',
      knowledgeSubtitle: 'Практические статьи о гигиене зрения и когнитивном здоровье.',
      readTimeMin: 'мин чтения',
      wasHelpful: 'Был ли этот ответ полезен?',
      thanksFeedback: 'Спасибо за отзыв!',
      askCtaTitle: 'Не нашли ответ на свой вопрос?',
      askCtaDesc:
        'Наша команда методологов и инженеров готова помочь. Мы рассматриваем каждое обращение индивидуально с регламентом ответа до 24 часов.',
      askCtaBtn: 'Задать персональный вопрос',
      systemHealthTitle: 'Статус систем платформы',
      allSystemsOperational: 'Все сервисы работают в штатном режиме',
      engineOnline: 'Движок тестирования v2.0 (Active)',
      dbOnline: 'PostgreSQL + asyncpg (Online)',
      zeroRetentionActive: 'Zero-Retention Shield (Active)',
      aiAssistantCardTitle: 'Медицинский ИИ-ассистент',
      aiAssistantCardDesc:
        'Задайте вопрос нейросетевому консультанту SIHAT по интерпретации ваших тестов в режиме реального времени.',
      openAiAssistant: 'Открыть диалог с ИИ',
      modalTitle: 'Задать вопрос команде SIHAT',
      modalSubtitle: 'Напишите нам, и мы ответим на ваш email в течение суток.',
      emailLabel: 'Ваш контактный email',
      categoryLabel: 'Категория вопроса',
      subjectLabel: 'Тема обращения',
      messageLabel: 'Текст вопроса или описание ситуации',
      sendBtn: 'Отправить вопрос',
      sendingBtn: 'Отправка...',
      successMsg: 'Вопрос успешно зарегистрирован! Номер обращения:',
      errorMsg: 'Не удалось отправить вопрос. Пожалуйста, проверьте введённые данные.',
      closeBtn: 'Закрыть',
      emergencyNotice:
        'Если вы испытываете резкое ухудшение самочувствия, немедленно обратитесь в службу скорой помощи: 103 или 112.',
    },
    tj: {
      heroPill: 'Маркази дастгирӣ ва дониш',
      heroTitle: 'Мо чӣ гуна метавонем ба шумо кӯмак кунем?',
      heroSubtitle:
        'Ҷавобҳои муфассал оид ба стандартҳои илмӣ, амнияти маълумот ва танзими дурусти таҷҳизот дар SIHAT.',
      searchPlaceholder: 'Ҷустуҷӯ аз рӯи саволҳо ва методҳо...',
      resultsCount: 'Ҷавобҳои ёфтшуда:',
      allFaqs: 'Ҳамаи мавзӯъҳо',
      catPlatform: 'Дар бораи платформа',
      catPrivacy: 'Амният ва Zero-Retention',
      catMethodology: 'Методика ва илм',
      catDevices: 'Таҷҳизот ва танзим',
      catPlatformDesc: 'Мақсадҳо, ҳудуди худмушоҳида, натиҷаҳо',
      catPrivacyDesc: 'Рамзгузорӣ, несткунӣ, бидуни таблиғ',
      catMethodologyDesc: 'ISO, ҷадвалҳои Шульте, Рабкин, ТУТ',
      catDevicesDesc: 'Экранҳои 60 ва 144 Гц, садо, Night Shift',
      knowledgeTitle: 'Пойгоҳи донишҳои SIHAT',
      knowledgeSubtitle: 'Мақолаҳои муфид дар бораи гигиенаи биноӣ ва хоб.',
      readTimeMin: 'дақ. мутолиа',
      wasHelpful: 'Оё ин ҷавоб муфид буд?',
      thanksFeedback: 'Ташаккур барои фикру мулоҳиза!',
      askCtaTitle: 'Ҷавоби саволи худро наёфтед?',
      askCtaDesc:
        'Дастаи мутахассисони мо омодаанд, ки ба ҳар як саволи шумо дар давоми 24 соат посух диҳанд.',
      askCtaBtn: 'Саволи худро фиристед',
      systemHealthTitle: 'Ҳолати системаи платформа',
      allSystemsOperational: 'Ҳамаи хизматрасониҳо фаъоланд',
      engineOnline: 'Муҳаррики машқҳо v2.0 (Active)',
      dbOnline: 'Пойгоҳи додаҳо (Online)',
      zeroRetentionActive: 'Ҳимояи Zero-Retention (Active)',
      aiAssistantCardTitle: 'Ёрдамчии ҳушманди SIHAT',
      aiAssistantCardDesc:
        'Саволҳои худро ба ёрдамчии сунъии мо диҳед ва дарҳол посух гиред.',
      openAiAssistant: 'Кушодани суҳбат бо ИИ',
      modalTitle: 'Фиристодани савол ба дастаи SIHAT',
      modalSubtitle: 'Саволи худро нависед, мо ба почтаи шумо ҷавоб медиҳем.',
      emailLabel: 'Email-и шумо',
      categoryLabel: 'Самти савол',
      subjectLabel: 'Мавзӯи муроҷиат',
      messageLabel: 'Матни савол',
      sendBtn: 'Фиристодани савол',
      sendingBtn: 'Дар ҳоли фиристодан...',
      successMsg: 'Саволи шумо бомуваффақият сабт шуд! Рақами муроҷиат:',
      errorMsg: 'Фиристодани савол муяссар нашуд. Лутфан санҷед.',
      closeBtn: 'Пӯшидан',
      emergencyNotice:
        'Дар ҳолати бад шудани саломатӣ фавран ба ёрии таъҷилӣ занг занед: 103 ё 112.',
    },
    en: {
      heroPill: 'Help Center & Knowledge Base',
      heroTitle: 'How can we help you today?',
      heroSubtitle:
        'Expert guidance on scientific standards, data privacy, device calibration, and cognitive self-observation rules.',
      searchPlaceholder: 'Search questions, protocols, hardware...',
      resultsCount: 'Articles found:',
      allFaqs: 'All Topics',
      catPlatform: 'Platform Scope',
      catPrivacy: 'Privacy & Zero-Retention',
      catMethodology: 'Science & Protocols',
      catDevices: 'Hardware & Calibration',
      catPlatformDesc: 'Objectives, boundaries, interpretation',
      catPrivacyDesc: 'Encryption, erasure, no ad trackers',
      catMethodologyDesc: 'ISO, Schulte grids, Rabkin, WHO',
      catDevicesDesc: '60 vs 144 Hz displays, audio, Night Shift',
      knowledgeTitle: 'Knowledge Base & Guides',
      knowledgeSubtitle: 'Evidence-based articles on sensory hygiene and visual ergonomics.',
      readTimeMin: 'min read',
      wasHelpful: 'Was this answer helpful?',
      thanksFeedback: 'Thank you for your feedback!',
      askCtaTitle: "Couldn't find the answer you need?",
      askCtaDesc:
        'Our clinical and engineering teams review all user inquiries directly with an SLA of under 24 hours.',
      askCtaBtn: 'Ask a Dedicated Question',
      systemHealthTitle: 'Platform System Status',
      allSystemsOperational: 'All Systems Operational',
      engineOnline: 'Test Engine v2.0 (Active)',
      dbOnline: 'PostgreSQL + asyncpg (Online)',
      zeroRetentionActive: 'Zero-Retention Shield (Active)',
      aiAssistantCardTitle: 'SIHAT AI Health Companion',
      aiAssistantCardDesc:
        'Get interactive explanations and guidance from our specialized AI assistant.',
      openAiAssistant: 'Open AI Assistant',
      modalTitle: 'Submit an Inquiry to SIHAT',
      modalSubtitle: 'Send your question and our team will respond via email within 24 hours.',
      emailLabel: 'Contact Email',
      categoryLabel: 'Inquiry Category',
      subjectLabel: 'Subject',
      messageLabel: 'Detailed Message',
      sendBtn: 'Submit Question',
      sendingBtn: 'Submitting...',
      successMsg: 'Inquiry registered successfully! Reference ID:',
      errorMsg: 'Failed to submit inquiry. Please check your input.',
      closeBtn: 'Close',
      emergencyNotice:
        'If experiencing acute health symptoms, immediately dial emergency services: 103 or 112.',
    },
  }[lang]

  // Filtered FAQ items
  const filteredFaqs = useMemo(() => {
    return EXTENDED_FAQS.filter((item) => {
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false
      if (!searchQuery.trim()) return true
      const qText = item.q[lang] || item.q.ru
      const aText = item.a[lang] || item.a.ru
      const tagText = item.tag[lang] || item.tag.ru
      const q = searchQuery.toLowerCase()
      return (
        qText.toLowerCase().includes(q) ||
        aText.toLowerCase().includes(q) ||
        tagText.toLowerCase().includes(q)
      )
    })
  }, [selectedCategory, searchQuery, lang])

  const handleFeedback = (id: string, type: 'up' | 'down') => {
    setFeedbackGiven((prev) => ({ ...prev, [id]: type }))
  }

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
          subject: `[${ticketCategory.toUpperCase()}] ${ticketSubject.trim()}`,
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

  const categoryConfigs = [
    {
      id: 'platform' as const,
      label: labels.catPlatform,
      desc: labels.catPlatformDesc,
      icon: Activity,
      count: EXTENDED_FAQS.filter((f) => f.category === 'platform').length,
    },
    {
      id: 'privacy' as const,
      label: labels.catPrivacy,
      desc: labels.catPrivacyDesc,
      icon: ShieldCheck,
      count: EXTENDED_FAQS.filter((f) => f.category === 'privacy').length,
    },
    {
      id: 'methodology' as const,
      label: labels.catMethodology,
      desc: labels.catMethodologyDesc,
      icon: Brain,
      count: EXTENDED_FAQS.filter((f) => f.category === 'methodology').length,
    },
    {
      id: 'devices' as const,
      label: labels.catDevices,
      desc: labels.catDevicesDesc,
      icon: Monitor,
      count: EXTENDED_FAQS.filter((f) => f.category === 'devices').length,
    },
  ]

  const fallbackArticles: KnowledgeArticle[] = [
    {
      id: 'standards',
      slug: 'standards',
      category: 'standards',
      sort_order: 1,
      localizations: {
        ru: {
          title: 'Стандарты паспортов методик SIHAT',
          summary:
            'Каждое упражнение опирается на клинические протоколы ISO, Шульте и Рабкина.',
        },
        tj: {
          title: 'Стандартҳои шиносномаи методҳои SIHAT',
          summary: 'Ҳар як метод тафтиши ҳатмии сарчашмаҳои илмиро мегузарад.',
        },
        en: {
          title: 'SIHAT Methodology Passport Standards',
          summary:
            'All screening exercises strictly align with peer-reviewed clinical protocols.',
        },
      },
    },
    {
      id: 'guidance',
      slug: 'guidance',
      category: 'guidance',
      sort_order: 2,
      localizations: {
        ru: {
          title: 'Влияние дисплея и освещения на результаты',
          summary:
            'Как частота Гц, фильтры синего света и калибровка влияют на метрики.',
        },
        tj: {
          title: 'Таъсири экран ва равшанӣ ба натиҷаҳо',
          summary:
            'Таъсири равшании экран ва режимҳои шабона ба натиҷаҳои скрининг.',
        },
        en: {
          title: 'Ambient Lighting & Screen Calibration Guidance',
          summary:
            'How refresh rate, night filters, and illumination alter quantitative metrics.',
        },
      },
    },
    {
      id: 'ergonomics',
      slug: 'ergonomics',
      category: 'guidance',
      sort_order: 3,
      localizations: {
        ru: {
          title: 'Эргономика и правило 20-20-20 при работе за ПК',
          summary:
            'Простые научно доказанные привычки для снятия зрительного и мышечного утомления.',
        },
        tj: {
          title: 'Қоидаи 20-20-20 барои ҳифзи биниш дар назди компютер',
          summary: 'Одатҳои осон барои рафъи хастагии чашм ва бадан.',
        },
        en: {
          title: '20-20-20 Ergonomic Rule for Visual Fatigue Prevention',
          summary:
            'Evidence-based habits to alleviate digital eye strain during prolonged screen work.',
        },
      },
    },
  ]

  const displayArticles = articles.length > 0 ? articles : fallbackArticles

  return (
    <div id="faq" className="min-h-screen bg-[#070D0B] text-slate-100 pb-24">
      {/* 1. HERO SECTION WITH SPOTLIGHT SEARCH */}
      <section className="relative pt-24 pb-14 px-4 sm:px-6 lg:px-8 overflow-hidden border-b border-emerald-950/40">
        {/* Subtle Ambient Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[320px] bg-gradient-to-b from-[#17A884]/15 via-emerald-900/5 to-transparent blur-3xl pointer-events-none -z-10" />

        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[#17A884] text-xs font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>{labels.heroPill}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            {labels.heroTitle}
          </h1>

          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            {labels.heroSubtitle}
          </p>

          {/* Spotlight Search Bar */}
          <div className="pt-2 max-w-2xl mx-auto">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/30 to-teal-500/30 rounded-2xl blur opacity-30 group-hover:opacity-70 transition duration-300" />
              <div className="relative flex items-center bg-[#0B1513] border border-emerald-500/30 rounded-2xl shadow-2xl overflow-hidden focus-within:border-[#17A884] focus-within:ring-2 focus-within:ring-[#17A884]/20 transition-all">
                <Search className="w-5 h-5 text-emerald-400 ml-4.5 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={labels.searchPlaceholder}
                  className="w-full bg-transparent px-4 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="mr-3 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer text-xs"
                  >
                    ✕
                  </button>
                )}
                <div className="pr-4 hidden sm:flex items-center text-[10px] font-mono text-slate-500">
                  <span className="px-1.5 py-0.5 rounded border border-slate-700 bg-slate-900/60">
                    ESC
                  </span>
                </div>
              </div>
            </div>

            {searchQuery && (
              <div className="text-xs text-slate-400 mt-2 text-left px-2 flex items-center justify-between">
                <span>
                  {labels.resultsCount}{' '}
                  <strong className="text-emerald-400">{filteredFaqs.length}</strong>
                </span>
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-emerald-400 hover:underline cursor-pointer"
                >
                  Сбросить поиск
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 2. BENTO CATEGORY QUICK JUMP CARDS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {categoryConfigs.map((cat) => {
            const Icon = cat.icon
            const isSelected = selectedCategory === cat.id
            return (
              <button
                key={cat.id}
                onClick={() =>
                  setSelectedCategory((prev) => (prev === cat.id ? 'all' : cat.id))
                }
                className={`p-4 sm:p-5 rounded-2xl text-left border transition-all cursor-pointer relative overflow-hidden group ${
                  isSelected
                    ? 'bg-gradient-to-br from-[#103D35] to-[#0D2621] border-[#17A884] shadow-lg shadow-emerald-950/50 scale-[1.02]'
                    : 'bg-[#0B1513] border-slate-800/80 hover:border-emerald-500/40 hover:bg-[#0E1A17]'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-[#17A884] text-white'
                        : 'bg-emerald-950/60 text-emerald-400 group-hover:bg-[#17A884]/20'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span
                    className={`text-[11px] font-mono px-2 py-0.5 rounded-full border ${
                      isSelected
                        ? 'bg-emerald-400/20 border-emerald-400/40 text-emerald-200'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    {cat.count}
                  </span>
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                  {cat.label}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-1 hidden sm:block">
                  {cat.desc}
                </p>
              </button>
            )
          })}
        </div>

        {/* Active Filter Pill Bar */}
        {selectedCategory !== 'all' && (
          <div className="mt-4 flex items-center gap-2 text-xs">
            <span className="text-slate-400">Фильтр:</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-semibold">
              {categoryConfigs.find((c) => c.id === selectedCategory)?.label}
              <button
                onClick={() => setSelectedCategory('all')}
                className="hover:text-white cursor-pointer ml-1"
              >
                ✕
              </button>
            </span>
            <button
              onClick={() => setSelectedCategory('all')}
              className="text-slate-400 hover:text-white text-xs underline cursor-pointer ml-2"
            >
              Показать все
            </button>
          </div>
        )}
      </section>

      {/* 3. MAIN CONTENT: ACCORDION (LEFT) + SUPPORT & KNOWLEDGE HUB (RIGHT) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: Accordion List (8 cols) */}
          <div className="lg:col-span-8 space-y-3.5">
            {filteredFaqs.length === 0 ? (
              <div className="p-12 text-center rounded-3xl border border-dashed border-slate-800 bg-[#0B1513]/60 space-y-4">
                <HelpCircle className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-sm font-semibold text-slate-300">
                  По запросу «{searchQuery}» ответов не найдено.
                </p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Попробуйте изменить формулировку или отправьте нам персональный вопрос.
                </p>
                <Button
                  variant="emerald"
                  size="sm"
                  onClick={() => setIsFormModalOpen(true)}
                  className="gap-2 cursor-pointer font-bold mt-2"
                >
                  <MessageSquarePlus className="w-4 h-4" />
                  <span>{labels.askCtaBtn}</span>
                </Button>
              </div>
            ) : (
              filteredFaqs.map((item) => {
                const isOpen = openFaqId === item.id
                const qText = item.q[lang] || item.q.ru
                const aText = item.a[lang] || item.a.ru
                const tagText = item.tag[lang] || item.tag.ru
                const feedback = feedbackGiven[item.id]

                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                      isOpen
                        ? 'bg-[#0D1A16] border-emerald-500/40 shadow-xl shadow-emerald-950/30'
                        : 'bg-[#0B1513] border-slate-800/80 hover:border-slate-700 hover:bg-[#0E1A17]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqId(isOpen ? null : item.id)}
                      className="w-full p-4 sm:p-5 text-left flex items-start justify-between gap-4 cursor-pointer select-none"
                    >
                      <div className="space-y-1.5 flex-1 pr-2">
                        <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-mono tracking-wide uppercase bg-emerald-950/70 border border-emerald-800/40 text-emerald-400">
                          {tagText}
                        </span>
                        <h2 className="text-sm sm:text-base font-bold text-white group-hover:text-emerald-300 transition-colors leading-snug">
                          {qText}
                        </h2>
                      </div>
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-200 ${
                          isOpen
                            ? 'bg-emerald-500 text-white border-emerald-400 rotate-180'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </button>

                    {isOpen && (
                      <div className="px-5 pb-5 pt-1 border-t border-emerald-950/40 space-y-4 animate-in fade-in duration-200">
                        <p className="text-xs sm:text-sm text-slate-300 font-reading leading-relaxed">
                          {aText}
                        </p>

                        {/* Interactive Micro-Feedback: Was this helpful? */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/60 text-xs text-slate-400">
                          <span>{labels.wasHelpful}</span>
                          {feedback ? (
                            <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
                              <Check className="w-3.5 h-3.5" />
                              {labels.thanksFeedback}
                            </span>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleFeedback(item.id, 'up')}
                                className="px-2.5 py-1 rounded-lg border border-slate-800 hover:border-emerald-500 hover:text-emerald-400 hover:bg-emerald-950/30 transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
                              >
                                <ThumbsUp className="w-3 h-3" />
                                <span>Да</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleFeedback(item.id, 'down')}
                                className="px-2.5 py-1 rounded-lg border border-slate-800 hover:border-rose-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
                              >
                                <ThumbsDown className="w-3 h-3" />
                                <span>Нет</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>

          {/* RIGHT: Support & Knowledge Hub (4 cols) — STICKY & RICH (NO EMPTY VOID!) */}
          <div className="lg:col-span-4 space-y-5 lg:sticky lg:top-24">
            {/* Widget 1: Рекомендуемые руководства Базы Знаний */}
            <Card className="p-5 rounded-3xl bg-[#0B1513] border-slate-800/90 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
                    {labels.knowledgeTitle}
                  </h3>
                </div>
                <Badge variant="cyan" className="text-[10px]">
                  3 статьи
                </Badge>
              </div>

              <div className="space-y-2.5">
                {displayArticles.map((art) => {
                  const loc = art.localizations[lang] || art.localizations.ru
                  return (
                    <div
                      key={art.id}
                      onClick={() => onNavigateArticle?.(art)}
                      className="p-3 rounded-2xl bg-[#070D0B] border border-slate-800/80 hover:border-emerald-500/40 hover:bg-emerald-950/15 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mb-1">
                        <span className="uppercase tracking-wider text-emerald-400/80">
                          {art.category}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" /> 3 {labels.readTimeMin}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-2">
                        {loc.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                        {loc.summary}
                      </p>
                    </div>
                  )
                })}
              </div>
            </Card>

            {/* Widget 2: Статус платформы в реальном времени (System Health) */}
            <Card className="p-5 rounded-3xl bg-[#0B1513] border-slate-800/90 shadow-xl space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-800/70 pb-2.5">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  {labels.systemHealthTitle}
                </span>
                <span className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  99.9%
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    {labels.engineOnline}
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400">OK</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    {labels.dbOnline}
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400">OK</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    {labels.zeroRetentionActive}
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400">Active</span>
                </div>
              </div>
            </Card>

            {/* Widget 3: ИИ-Ассистент консультант */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-[#103D35]/80 via-[#0B1F1B] to-[#070D0B] border border-emerald-500/30 shadow-xl space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-[#17A884] flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">
                    {labels.aiAssistantCardTitle}
                  </h4>
                  <span className="text-[10px] text-emerald-300/80">Онлайн 24/7</span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {labels.aiAssistantCardDesc}
              </p>

              <Button
                variant="emerald"
                size="sm"
                onClick={() => onNavigateAssistant?.()}
                className="w-full gap-2 cursor-pointer font-bold text-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{labels.openAiAssistant}</span>
              </Button>
            </div>

            {/* Widget 4: Экстренная памятка 103/112 */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200/90 text-[11px] flex items-start gap-2.5 leading-relaxed">
              <PhoneCall className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>{labels.emergencyNotice}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. BOTTOM INVITING CTA FOR ASKING QUESTIONS (CLEAN & BALANCED) */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-[#0B1F1B] via-[#0E2822] to-[#091512] border border-emerald-500/30 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl text-center md:text-left">
            <h3 className="text-xl sm:text-2xl font-extrabold text-white">
              {labels.askCtaTitle}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {labels.askCtaDesc}
            </p>
          </div>

          <Button
            variant="emerald"
            size="lg"
            onClick={() => setIsFormModalOpen(true)}
            className="gap-2.5 px-6 py-3.5 shrink-0 shadow-xl hover:scale-[1.02] cursor-pointer font-bold text-sm"
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span>{labels.askCtaBtn}</span>
          </Button>
        </div>
      </section>

      {/* 5. MODAL FORM: «ЗАДАТЬ ВОПРОС КОМАНДЕ SIHAT» */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className="w-full max-w-lg bg-[#0B1513] border border-emerald-500/30 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <MessageSquarePlus className="w-5 h-5 text-emerald-400" />
                  <span>{labels.modalTitle}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">{labels.modalSubtitle}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsFormModalOpen(false)
                  setSubmitSuccess(null)
                  setSubmitError(null)
                }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {submitSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-xs flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  {labels.successMsg} <strong>{submitSuccess}</strong>
                </span>
              </div>
            )}

            {submitError && (
              <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {!submitSuccess && (
              <form onSubmit={handleSubmitQuestion} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      {labels.emailLabel}
                    </label>
                    <input
                      type="email"
                      required
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-[#070D0B] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      {labels.categoryLabel}
                    </label>
                    <select
                      value={ticketCategory}
                      onChange={(e) => setTicketCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-[#070D0B] text-xs text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                    >
                      <option value="question">Вопрос по методике</option>
                      <option value="privacy">Приватность и данные</option>
                      <option value="hardware">Оборудование и калибровка</option>
                      <option value="general">Общий вопрос</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    {labels.subjectLabel}
                  </label>
                  <input
                    type="text"
                    required
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    placeholder="Краткая суть вопроса"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-[#070D0B] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    {labels.messageLabel}
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={ticketMessage}
                    onChange={(e) => setTicketMessage(e.target.value)}
                    placeholder="Опишите вопрос, упражнение или ситуацию как можно подробнее..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-[#070D0B] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsFormModalOpen(false)}
                    className="text-xs cursor-pointer"
                  >
                    {labels.closeBtn}
                  </Button>
                  <Button
                    type="submit"
                    variant="emerald"
                    size="sm"
                    disabled={isSubmitting}
                    className="gap-2 cursor-pointer font-bold text-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? labels.sendingBtn : labels.sendBtn}</span>
                  </Button>
                </div>
              </form>
            )}

            {submitSuccess && (
              <div className="flex justify-end pt-2">
                <Button
                  variant="emerald"
                  size="sm"
                  onClick={() => {
                    setIsFormModalOpen(false)
                    setSubmitSuccess(null)
                  }}
                  className="cursor-pointer text-xs"
                >
                  {labels.closeBtn}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
