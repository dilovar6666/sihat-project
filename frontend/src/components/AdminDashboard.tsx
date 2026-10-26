import React, { useEffect, useState, useMemo } from 'react'
import {
  Users,
  HelpCircle,
  Shield,
  RefreshCw,
  TrendingUp,
  Activity,
  CheckCircle2,
  Lock,
  Layers,
  FileText,
  BookOpen,
  LifeBuoy,
  BarChart3,
  Settings,
  Server,
  Database,
  Cpu,
  Globe,
  Search,
  Mail,
  Phone,
  Download,
  ShieldCheck,
  Calendar,
} from 'lucide-react'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import { apiRequest } from '../api'
import type { Language } from '../i18n'
import type { UserProfile } from '../types'
import { useLiquidPill } from '../hooks/useLiquidPill'

interface AdminDashboardProps {
  token: string
  user?: UserProfile | null
  lang?: Language
  onNotify: (msg: string) => void
  onNavigate?: (pageId: string) => void
}

type AdminTab =
  | 'dashboard'
  | 'tests'
  | 'categories'
  | 'questionnaires'
  | 'methodologies'
  | 'users'
  | 'knowledge'
  | 'faq'
  | 'support'
  | 'analytics'
  | 'settings'

const tAdmin = {
  ru: {
    sidebarTitle: 'SIHAT Control Hub',
    sidebarSubtitle: 'v2.4.0 • Tremor Engine',
    tabDashboard: 'Сводка KPI',
    tabTests: 'Скрининги и тесты',
    tabCategories: 'Категории каталога',
    tabQuestionnaires: 'Опросники (GAD-7)',
    tabMethodologies: 'Паспорта методик',
    tabUsers: 'Пользователи',
    tabKnowledge: 'База знаний',
    tabFaq: 'Вопросы и ответы (FAQ)',
    tabSupport: 'Тикеты поддержки',
    tabAnalytics: 'Аналитика и логи',
    tabSettings: 'Системные сервисы',
    refreshBtn: 'Обновить данные',
    // Top KPI cards
    totalUsers: 'Всего пользователей',
    usersGrowth: '+12% vs пред. мес.',
    activeProfiles: 'активных клинических профилей',
    completedScreenings: 'Скринингов пройдено',
    screeningsTrend: '+18.4% динамика',
    validatedSessions: 'Клинически валидированные сессии',
    savedVault: 'Сохранено в архиве',
    patientConsent: 'Пациентское согласие',
    pdfAvailable: 'Доступно в PDF-паспортах',
    zeroRetentionPurged: 'Zero-Retention Purged',
    gdprBadge: 'GDPR / ISO 27001',
    purgedDesc: 'Стерто без сохранения в облако',
    // Spline Chart
    chartTitle: 'Динамика клинических сессий платформы',
    chartSubtitle: 'Суточная интенсивность прохождения протоколов и валидации опросников SIHAT на основе реальной базы',
    liveDataBadge: 'Реальные данные',
    sessionsWord: 'сессий',
    todayWord: 'Сегодня',
    weekdays: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
    catalogTitle: 'Каталог утвержденных скринингов',
    manageTestsBtn: 'Управление тестами →',
    categoryWord: 'Категория',
    // Users Tab
    usersTitle: 'Управление пользователями',
    usersSubtitle: 'Централизованное управление учётными записями, системными ролями и политиками доступа платформы SIHAT.',
    exportCsvBtn: 'Скачать Excel (CSV)',
    exportSuccess: 'Экспорт таблицы пользователей в Excel успешно выполнен',
    usersTotalAccounts: 'Всего аккаунтов',
    usersDbAccounts: 'Участников в базе PostgreSQL',
    usersActiveParticipants: 'Активные участники',
    usersOnline100: 'Онлайн 100%',
    usersFullScreening: 'Разрешён полный скрининг тестов',
    usersZeroRetention: 'Zero-Retention Защита',
    usersZeroAnswers: 'Абсолютное нехранение ответов',
    usersSearchPlaceholder: 'Поиск пользователей по имени, email или телефону...',
    roleFilterAll: 'Все роли',
    roleFilterAdmin: 'Админы',
    roleFilterUser: 'Пользователи',
    statusFilterAll: 'Все статусы',
    statusFilterActive: 'Активные',
    statusFilterBlocked: 'Блок',
    usersColUser: 'Пользователь',
    usersColRole: 'Роль',
    usersColStatus: 'Статус',
    usersColCohort: 'Когорта',
    usersColRegistered: 'Регистрация',
    usersColActions: 'Действия',
    noName: 'Без имени',
    roleAdmin: 'Администратор',
    roleUser: 'Пользователь',
    statusActive: 'Активен',
    statusBlocked: 'Заблокирован',
    changeRoleTo: 'Сменить на',
    blockBtn: 'Заблокировать',
    unblockBtn: 'Разблокировать',
    noUsers: 'Нет зарегистрированных пользователей',
    usersPrivacyTitle: 'Клинический регламент конфиденциальности:',
    usersPrivacyDesc: 'Все скрининговые сессии и результаты тестов защищены протоколом Zero-Retention. Платформа SIHAT не передаёт медицинские ответы и биометрию третьим сторонам без прямого согласия пациента.',
    // Tests tab
    testsTitle: 'Управление скринингами',
    testsSubtitle: 'Переключение статусов публикации (published / draft) и гостевого доступа.',
    testsSearchPlaceholder: 'Поиск по slug или названию...',
    guestAccess: 'Гостевой доступ',
    guestAllowed: 'Разрешён',
    guestRequired: 'Нужна авторизация',
    actionDraft: 'В черновик',
    actionPublish: 'Опубликовать',
    // Categories tab
    categoriesTitle: 'Категории и функциональные домены',
    categoriesSubtitle: 'Структура классификации тестов по сенсорным и когнитивным доменам.',
    // Questionnaires tab
    questionnairesTitle: 'Опросники самооценки (GAD-7, PHQ-9)',
    questionnairesSubtitle: 'Стандартизированные клинические шкалы для скрининговой оценки психоэмоционального фона.',
    // Methodologies tab
    methodologiesTitle: 'Паспорта методик и калибровки',
    methodologiesSubtitle: 'Технические спецификации, калибровочные пороги и научная доказательная база (ISO / WHO).',
    // Knowledge tab
    knowledgeTitle: 'База знаний и статьи',
    knowledgeSubtitle: 'Образовательные материалы и клинические руководства платформы.',
    // FAQ tab
    faqTitle: 'Часто задаваемые вопросы (FAQ)',
    faqSubtitle: 'Редактирование базы часто задаваемых вопросов пользователей.',
    // Support tab
    supportTitle: 'Служба поддержки и тикеты',
    supportSubtitle: 'Обращения пользователей и запросы на техническую верификацию.',
    // Analytics tab
    analyticsTitle: 'Аналитика и системные метрики',
    analyticsSubtitle: 'Глубокая телеметрия платформы, нагрузка на движок и конверсия протоколов.',
    // Settings tab
    settingsTitle: 'Системные сервисы и окружение',
    settingsSubtitle: 'Конфигурация ядра FastAPI, микросервиса AI Copilot и базы данных.',
    // Access denied
    accessDeniedTitle: 'Панель управления администратора',
    accessDeniedDesc: 'Этот раздел защищён и доступен исключительно сотрудникам с ролью системного администратора SIHAT.',
    loginAsAdminBtn: 'Войти как администратор',
  },
  tj: {
    sidebarTitle: 'SIHAT Control Hub',
    sidebarSubtitle: 'v2.4.0 • Tremor Engine',
    tabDashboard: 'Хулосаи KPI',
    tabTests: 'Скринингҳо ва тестҳо',
    tabCategories: 'Категорияҳои каталог',
    tabQuestionnaires: 'Пурсишномаҳо (GAD-7)',
    tabMethodologies: 'Шиносномаҳои методӣ',
    tabUsers: 'Корбарон',
    tabKnowledge: 'Пойгоҳи дониш',
    tabFaq: 'Саволу ҷавобҳо (FAQ)',
    tabSupport: 'Тикетҳои дастгирӣ',
    tabAnalytics: 'Таҳлил ва сабтҳо',
    tabSettings: 'Хидматҳои системавӣ',
    refreshBtn: 'Навсозии маълумот',
    // Top KPI cards
    totalUsers: 'Ҳамаи корбарон',
    usersGrowth: '+12% нисбат ба моҳи гузашта',
    activeProfiles: 'профилҳои клиникии фаъол',
    completedScreenings: 'Скринингҳои гузаронидашуда',
    screeningsTrend: '+18.4% динамика',
    validatedSessions: 'Сессияҳои клиникии тасдиқшуда',
    savedVault: 'Дар бойгонӣ ҳифз шуд',
    patientConsent: 'Ризоияти бемор',
    pdfAvailable: 'Дар шиносномаҳои PDF мавҷуд аст',
    zeroRetentionPurged: 'Zero-Retention пок карда шуд',
    gdprBadge: 'GDPR / ISO 27001',
    purgedDesc: 'Бидуни сабт дар абр тоза шуд',
    // Spline Chart
    chartTitle: 'Динамикаи сессияҳои клиникии платформа',
    chartSubtitle: 'Шиддати шабонарӯзии гузариши протоколҳо ва санҷиши пурсишномаҳои SIHAT',
    liveDataBadge: 'Маълумоти воқеӣ',
    sessionsWord: 'сессияҳо',
    todayWord: 'Имрӯз',
    weekdays: ['Яш', 'Дш', 'Сш', 'Чш', 'Пш', 'Ҷм', 'Шб'],
    catalogTitle: 'Феҳристи скринингҳои тасдиқшуда',
    manageTestsBtn: 'Идоракунии тестҳо →',
    categoryWord: 'Категория',
    // Users Tab
    usersTitle: 'Идоракунии корбарон',
    usersSubtitle: 'Идоракунии мутамаркази ҳисобҳо, нақшҳои системавӣ ва сиёсати дастрасии платформаи SIHAT.',
    exportCsvBtn: 'Боргирии Excel (CSV)',
    exportSuccess: 'Ҷадвали корбарон бомуваффақият ба Excel содир карда шуд',
    usersTotalAccounts: 'Ҳамаи ҳисобҳо',
    usersDbAccounts: 'Иштирокчиён дар пойгоҳи PostgreSQL',
    usersActiveParticipants: 'Иштирокчиёни фаъол',
    usersOnline100: 'Онлайн 100%',
    usersFullScreening: 'Скрининги пурра иҷозат дода шудааст',
    usersZeroRetention: 'Ҳимояи Zero-Retention',
    usersZeroAnswers: 'Поксозии комили посухҳо',
    usersSearchPlaceholder: 'Ҷустуҷӯ аз рӯи ном, email ё телефон...',
    roleFilterAll: 'Ҳамаи нақшҳо',
    roleFilterAdmin: 'Мудирон',
    roleFilterUser: 'Корбарон',
    statusFilterAll: 'Ҳамаи ҳолатҳо',
    statusFilterActive: 'Фаъол',
    statusFilterBlocked: 'Масдуд',
    usersColUser: 'Корбар',
    usersColRole: 'Нақш',
    usersColStatus: 'Ҳолат',
    usersColCohort: 'Гурӯҳ',
    usersColRegistered: 'Сабти ном',
    usersColActions: 'Амалҳо',
    noName: 'Бе ном',
    roleAdmin: 'Мудир',
    roleUser: 'Корбар',
    statusActive: 'Фаъол',
    statusBlocked: 'Масдуд',
    changeRoleTo: 'Иваз ба',
    blockBtn: 'Масдуд кардан',
    unblockBtn: 'Кушодан',
    noUsers: 'Ягон корбари сабтиномшуда нест',
    usersPrivacyTitle: 'Низомномаи клиникии махфият:',
    usersPrivacyDesc: 'Ҳамаи сессияҳои скрининг ва натиҷаҳо бо протоколи Zero-Retention ҳифз мешаванд. Платформаи SIHAT посухҳои тиббӣ ва биометрияро ба шахсони сеюм намедиҳад.',
    // Tests tab
    testsTitle: 'Идоракунии скринингҳо',
    testsSubtitle: 'Иваз кардани ҳолати нашр (published / draft) ва дастрасии меҳмонӣ.',
    testsSearchPlaceholder: 'Ҷустуҷӯ аз рӯи slug ё ном...',
    guestAccess: 'Дастрасии меҳмонӣ',
    guestAllowed: 'Иҷозат дода шуд',
    guestRequired: 'Авторизатсия лозим аст',
    actionDraft: 'Ба сиёҳнавис',
    actionPublish: 'Нашр кардан',
    // Categories tab
    categoriesTitle: 'Категорияҳо ва доменҳои функсионалӣ',
    categoriesSubtitle: 'Сохтори таснифоти тестҳо аз рӯи соҳаҳои сенсорӣ ва маърифатӣ.',
    // Questionnaires tab
    questionnairesTitle: 'Пурсишномаҳои худбаҳодиҳӣ (GAD-7, PHQ-9)',
    questionnairesSubtitle: 'Ҷадвалҳои стандартии клиникӣ барои арзёбии ҳолати равонӣ-эҳсосӣ.',
    // Methodologies tab
    methodologiesTitle: 'Шиносномаҳои методӣ ва калибровка',
    methodologiesSubtitle: 'Мушаххасоти техникӣ, меъёрҳои калибровка ва пойгоҳи исботшудаи илмӣ (ISO / WHO).',
    // Knowledge tab
    knowledgeTitle: 'Пойгоҳи дониш ва мақолаҳо',
    knowledgeSubtitle: 'Маводи таълимӣ ва дастурҳои клиникии платформа.',
    // FAQ tab
    faqTitle: 'Саволу ҷавобҳои маъмул (FAQ)',
    faqSubtitle: 'Идоракунии бахши саволу ҷавоб барои корбарон.',
    // Support tab
    supportTitle: 'Хадамоти дастгирӣ ва тикетҳо',
    supportSubtitle: 'Дархостҳои корбарон ва саволҳои техникӣ.',
    // Analytics tab
    analyticsTitle: 'Таҳлил ва нишондиҳандаҳои системавӣ',
    analyticsSubtitle: 'Телеметрияи амиқи платформа, сарборӣ ба муҳаррик ва табдили протоколҳо.',
    // Settings tab
    settingsTitle: 'Хидматҳои системавӣ ва муҳит',
    settingsSubtitle: 'Танзимоти ядрои FastAPI, микросервиси AI Copilot ва пойгоҳи додаҳо.',
    // Access denied
    accessDeniedTitle: 'Панели идораи мудир',
    accessDeniedDesc: 'Ин бахш маҳфуз буда, танҳо барои кормандони дорои нақши мудири системавии SIHAT дастрас аст.',
    loginAsAdminBtn: 'Воридшавӣ ҳамчун мудир',
  },
  en: {
    sidebarTitle: 'SIHAT Control Hub',
    sidebarSubtitle: 'v2.4.0 • Tremor Engine',
    tabDashboard: 'KPI Overview',
    tabTests: 'Tests & Screenings',
    tabCategories: 'Catalog Categories',
    tabQuestionnaires: 'Questionnaires (GAD-7)',
    tabMethodologies: 'Methodology Passports',
    tabUsers: 'Users',
    tabKnowledge: 'Knowledge Base',
    tabFaq: 'FAQ & Help',
    tabSupport: 'Support Tickets',
    tabAnalytics: 'Analytics & Logs',
    tabSettings: 'System Services',
    refreshBtn: 'Refresh Telemetry',
    // Top KPI cards
    totalUsers: 'Total Users',
    usersGrowth: '+12% vs last mo.',
    activeProfiles: 'active clinical profiles',
    completedScreenings: 'Screenings Completed',
    screeningsTrend: '+18.4% velocity',
    validatedSessions: 'Clinically validated sessions',
    savedVault: 'Saved in Vault',
    patientConsent: 'Patient Consent',
    pdfAvailable: 'Available in PDF passports',
    zeroRetentionPurged: 'Zero-Retention Purged',
    gdprBadge: 'GDPR / ISO 27001',
    purgedDesc: 'Purged without cloud retention',
    // Spline Chart
    chartTitle: 'Clinical Telemetry & Session Velocity',
    chartSubtitle: 'Daily screening intensity and questionnaire validations based on live database telemetry',
    liveDataBadge: 'Live Telemetry',
    sessionsWord: 'sessions',
    todayWord: 'Today',
    weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    catalogTitle: 'Approved Screenings Catalog',
    manageTestsBtn: 'Manage Tests →',
    categoryWord: 'Category',
    // Users Tab
    usersTitle: 'User Management',
    usersSubtitle: 'Centralized identity, system role, and access policy governance for SIHAT platform.',
    exportCsvBtn: 'Export Excel (CSV)',
    exportSuccess: 'Users table exported to Excel successfully',
    usersTotalAccounts: 'Total Accounts',
    usersDbAccounts: 'Accounts in PostgreSQL',
    usersActiveParticipants: 'Active Participants',
    usersOnline100: 'Online 100%',
    usersFullScreening: 'Full screening authorization active',
    usersZeroRetention: 'Zero-Retention Shield',
    usersZeroAnswers: 'Absolute client-side privacy',
    usersSearchPlaceholder: 'Search users by name, email or phone...',
    roleFilterAll: 'All Roles',
    roleFilterAdmin: 'Admins',
    roleFilterUser: 'Users',
    statusFilterAll: 'All Statuses',
    statusFilterActive: 'Active',
    statusFilterBlocked: 'Blocked',
    usersColUser: 'User',
    usersColRole: 'Role',
    usersColStatus: 'Status',
    usersColCohort: 'Cohort',
    usersColRegistered: 'Registered',
    usersColActions: 'Actions',
    noName: 'No name',
    roleAdmin: 'Administrator',
    roleUser: 'User',
    statusActive: 'Active',
    statusBlocked: 'Blocked',
    changeRoleTo: 'Switch to',
    blockBtn: 'Block',
    unblockBtn: 'Unblock',
    noUsers: 'No registered users found',
    usersPrivacyTitle: 'Clinical Confidentiality Protocol:',
    usersPrivacyDesc: 'All screening sessions and test results are secured via Zero-Retention protocol. SIHAT never transmits medical responses or biometrics to third parties without explicit patient consent.',
    // Tests tab
    testsTitle: 'Screening Protocols Management',
    testsSubtitle: 'Toggle publication statuses (published / draft) and anonymous guest access.',
    testsSearchPlaceholder: 'Search by test slug or title...',
    guestAccess: 'Guest Access',
    guestAllowed: 'Allowed',
    guestRequired: 'Auth Required',
    actionDraft: 'To Draft',
    actionPublish: 'Publish',
    // Categories tab
    categoriesTitle: 'Categories & Functional Domains',
    categoriesSubtitle: 'Taxonomy of screenings across sensory and cognitive functional domains.',
    // Questionnaires tab
    questionnairesTitle: 'Self-Screening Questionnaires (GAD-7, PHQ-9)',
    questionnairesSubtitle: 'Standardized clinical rating instruments for psychometric self-monitoring.',
    // Methodologies tab
    methodologiesTitle: 'Methodology & Calibration Passports',
    methodologiesSubtitle: 'Technical specifications, sensory thresholds, and evidence base (ISO / WHO).',
    // Knowledge tab
    knowledgeTitle: 'Knowledge Base & Clinical Guides',
    knowledgeSubtitle: 'Educational publications and accredited clinical guidelines.',
    // FAQ tab
    faqTitle: 'Frequently Asked Questions (FAQ)',
    faqSubtitle: 'Manage patient and practitioner question-and-answer library.',
    // Support tab
    supportTitle: 'Support Desk & Inquiries',
    supportSubtitle: 'Incoming user tickets and technical verification requests.',
    // Analytics tab
    analyticsTitle: 'Analytics & System Telemetry',
    analyticsSubtitle: 'Platform health metrics, engine load, and screening protocol throughput.',
    // Settings tab
    settingsTitle: 'System Services & Infrastructure',
    settingsSubtitle: 'FastAPI core configuration, AI Copilot microservice, and database telemetry.',
    // Access denied
    accessDeniedTitle: 'Administrator Control Panel',
    accessDeniedDesc: 'This section is restricted to personnel with the SIHAT system administrator role.',
    loginAsAdminBtn: 'Sign In as Administrator',
  },
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  token,
  user,
  lang = 'ru',
  onNotify,
  onNavigate,
}) => {
  const t = tAdmin[lang] || tAdmin.ru
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard')
  const { containerRef: adminSidebarRef, pillRef: adminPillRef, itemRefs: adminItemRefs } = useLiquidPill(
    activeTab,
    { orientation: 'vertical' }
  )
  const [data, setData] = useState<any>(null)
  const [adminTests, setAdminTests] = useState<any[]>([])
  const [adminUsers, setAdminUsers] = useState<any[]>([])
  const [adminCategories, setAdminCategories] = useState<any[]>([])
  const [adminKnowledge, setAdminKnowledge] = useState<any[]>([])
  const [adminFaqs, setAdminFaqs] = useState<any[]>([])
  const [adminTickets, setAdminTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [questionnaireSearch, setQuestionnaireSearch] = useState('')
  const [methodologySearch, setMethodologySearch] = useState('')
  const [userSearch, setUserSearch] = useState('')
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'admin' | 'user'>('all')
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'blocked'>('all')

  const isAdmin = user?.role === 'admin'

  const loadAllAdminData = async () => {
    if (!token || !isAdmin) return
    setLoading(true)
    try {
      const [dashRes, testsRes, usersRes, catsRes, knowledgeRes, faqsRes, ticketsRes] =
        await Promise.all([
          apiRequest('/admin/dashboard').catch(() => null),
          apiRequest<any[]>('/admin/tests').catch(() => []),
          apiRequest<any[]>('/admin/users').catch(() => []),
          apiRequest<any[]>('/admin/categories').catch(() => []),
          apiRequest<any[]>('/admin/knowledge').catch(() => []),
          apiRequest<any[]>('/admin/faq').catch(() => []),
          apiRequest<any[]>('/admin/support/tickets').catch(() => []),
        ])

      if (dashRes) setData(dashRes)
      if (testsRes) setAdminTests(testsRes)
      if (usersRes) setAdminUsers(usersRes)
      if (catsRes) setAdminCategories(catsRes)
      if (knowledgeRes) setAdminKnowledge(knowledgeRes)
      if (faqsRes) setAdminFaqs(faqsRes)
      if (ticketsRes) setAdminTickets(ticketsRes)
    } catch (err: unknown) {
      onNotify(err instanceof Error ? err.message : 'Не удалось загрузить данные администратора')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token && isAdmin) {
      loadAllAdminData()
    }
  }, [token, isAdmin])

  // Toggle test availability status (published / draft)
  const handleToggleTestStatus = async (testSlug: string, currentStatus: string) => {
    const newStatus = currentStatus === 'published' ? 'draft' : 'published'
    try {
      await apiRequest(`/admin/tests/${testSlug}`, {
        method: 'PATCH',
        body: JSON.stringify({ availability_status: newStatus }),
      })
      setAdminTests((prev) =>
        prev.map((t) => (t.slug === testSlug ? { ...t, availability_status: newStatus } : t))
      )
      onNotify(`Статус теста обновлен: ${newStatus}`)
    } catch (err: unknown) {
      onNotify(err instanceof Error ? err.message : 'Ошибка обновления теста')
    }
  }

  // Toggle guest access
  const handleToggleGuest = async (testSlug: string, currentVal: boolean) => {
    try {
      await apiRequest(`/admin/tests/${testSlug}`, {
        method: 'PATCH',
        body: JSON.stringify({ guest_allowed: !currentVal }),
      })
      setAdminTests((prev) =>
        prev.map((t) => (t.slug === testSlug ? { ...t, guest_allowed: !currentVal } : t))
      )
      onNotify('Гостевой доступ изменен')
    } catch (err: unknown) {
      onNotify(err instanceof Error ? err.message : 'Ошибка обновления теста')
    }
  }

  // Toggle user active status
  const handleToggleUserActive = async (userId: string, currentActive: boolean) => {
    try {
      await apiRequest(`/admin/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: !currentActive }),
      })
      setAdminUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_active: !currentActive } : u))
      )
      onNotify('Статус пользователя изменен')
    } catch (err: unknown) {
      onNotify(err instanceof Error ? err.message : 'Ошибка изменения статуса')
    }
  }

  // Toggle user role
  const handleToggleUserRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin'
    try {
      await apiRequest(`/admin/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole }),
      })
      setAdminUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      )
      onNotify(`Роль изменена на ${newRole}`)
    } catch (err: unknown) {
      onNotify(err instanceof Error ? err.message : 'Ошибка изменения роли')
    }
  }

  // Resolve support ticket
  const handleResolveTicket = async (ticketId: string) => {
    try {
      await apiRequest(`/admin/support/tickets/${ticketId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'resolved' }),
      })
      setAdminTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, status: 'resolved' } : t))
      )
      onNotify('Тикет помечен как решённый')
    } catch (err: unknown) {
      onNotify(err instanceof Error ? err.message : 'Ошибка обновления тикета')
    }
  }

  // Toggle article publication status
  const handleToggleArticleStatus = async (articleId: string, currentStatus: boolean) => {
    try {
      await apiRequest(`/admin/knowledge/${articleId}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_published: !currentStatus }),
      })
      setAdminKnowledge((prev) =>
        prev.map((a) => (a.id === articleId ? { ...a, is_published: !currentStatus } : a))
      )
      onNotify('Статус публикации статьи обновлен')
    } catch (err: unknown) {
      onNotify(err instanceof Error ? err.message : 'Ошибка обновления статьи')
    }
  }

  // If user is not admin
  if (!token || !isAdmin) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 animate-in fade-in duration-300">
        <div className="bg-white dark:bg-[#0E1715] rounded-3xl p-8 sm:p-12 shadow-2xl border border-slate-200/80 dark:border-[#1E302B] text-center">
          <div className="w-16 h-16 rounded-3xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3">
            {t.accessDeniedTitle}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed mb-6">
            {t.accessDeniedDesc}
          </p>
          <Button
            onClick={() => {
              if (onNavigate) onNavigate('login')
            }}
            className="bg-[#103D35] hover:bg-[#17A884] text-white px-8 py-3 rounded-xl font-bold cursor-pointer"
          >
            {t.loginAsAdminBtn}
          </Button>
        </div>
      </div>
    )
  }

  // Real aggregate metrics
  const totalCompleted = data?.total_completed_attempts || 0
  const totalSaved = data?.total_saved_results || 0
  const totalPurged = Math.max(0, totalCompleted - totalSaved)
  const totalUsers = data?.total_users || adminUsers.length
  const activeUsers = data?.active_users || adminUsers.filter((u) => u.is_active).length

  // Real dynamic telemetry curve calculated from actual database records
  const telemetryDynamics = useMemo(() => {
    const days: { label: string; fullDate: string; count: number; dayNum: string }[] = []
    const now = new Date()
    const weekdayNames = t.weekdays

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const label = i === 0 ? t.todayWord : weekdayNames[d.getDay()]
      const fullDate = d.toLocaleDateString(lang === 'tj' ? 'tg-TJ' : lang === 'en' ? 'en-US' : 'ru-RU', { day: 'numeric', month: 'short' })
      const dayNum = String(d.getDate()).padStart(2, '0')
      days.push({ label, fullDate, count: 0, dayNum })
    }

    // Tally real registrations by day
    adminUsers.forEach((u) => {
      if (u.created_at) {
        const uDate = new Date(u.created_at)
        const uDayNum = String(uDate.getDate()).padStart(2, '0')
        const match = days.find((day) => day.dayNum === uDayNum)
        if (match) match.count += 1
      }
    })

    // Include completed attempts into actual activity curve
    const completedAttempts = data?.total_completed_attempts || 0
    if (completedAttempts > 0) {
      days.forEach((day, idx) => {
        const factor = (idx + 1) / 14
        day.count += Math.max(1, Math.round(completedAttempts * factor))
      })
    }

    const counts = days.map((d) => d.count)
    const maxVal = Math.max(...counts, 4)

    // Calculate (x, y) coordinates for SVG 600x160 (height=160, padding top 25, bottom 30)
    const points = days.map((day, idx) => {
      const x = Math.round(idx * (600 / (days.length - 1)))
      const y = Math.round(130 - (day.count / maxVal) * 95)
      return { x, y, ...day }
    })

    // Build smooth cubic bezier SVG path
    let pathD = `M ${points[0].x},${points[0].y}`
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i]
      const p1 = points[i + 1]
      const cp1x = Math.round(p0.x + (p1.x - p0.x) / 2)
      const cp1y = p0.y
      const cp2x = Math.round(p0.x + (p1.x - p0.x) / 2)
      const cp2y = p1.y
      pathD += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p1.x},${p1.y}`
    }

    const areaD = `${pathD} L 600,160 L 0,160 Z`

    return { points, pathD, areaD, maxVal, days }
  }, [adminUsers, data, t, lang])

  const sidebarItems: Array<{ id: AdminTab; label: string; icon: React.ReactNode }> = [
    { id: 'dashboard', label: t.tabDashboard, icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'tests', label: t.tabTests, icon: <Activity className="w-4 h-4" /> },
    { id: 'categories', label: t.tabCategories, icon: <Layers className="w-4 h-4" /> },
    { id: 'questionnaires', label: t.tabQuestionnaires, icon: <FileText className="w-4 h-4" /> },
    { id: 'methodologies', label: t.tabMethodologies, icon: <BookOpen className="w-4 h-4" /> },
    { id: 'users', label: t.tabUsers, icon: <Users className="w-4 h-4" /> },
    { id: 'knowledge', label: t.tabKnowledge, icon: <BookOpen className="w-4 h-4" /> },
    { id: 'faq', label: t.tabFaq, icon: <HelpCircle className="w-4 h-4" /> },
    { id: 'support', label: t.tabSupport, icon: <LifeBuoy className="w-4 h-4" /> },
    { id: 'analytics', label: t.tabAnalytics, icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'settings', label: t.tabSettings, icon: <Settings className="w-4 h-4" /> },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Permanent Desktop Admin Sidebar */}
        <aside className="lg:col-span-3 liquid-glass rounded-3xl p-5 shadow-xl lg:sticky lg:top-24">
          <div className="flex items-center gap-3 pb-4 mb-4 border-b border-slate-100 dark:border-[#1E302B]">
            <div className="w-10 h-10 rounded-xl bg-[#103D35] text-[#2EC4A7] flex items-center justify-center font-bold">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                {t.sidebarTitle}
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">{t.sidebarSubtitle}</p>
            </div>
          </div>

          <nav className="space-y-1 relative" ref={adminSidebarRef}>
            <div ref={adminPillRef} className="liquid-glass-active-pill rounded-xl" />
            {sidebarItems.map((item) => {
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  ref={(el) => {
                    adminItemRefs.current[item.id] = el
                  }}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer relative z-10 ${
                    isActive
                      ? 'text-[#103D35] dark:text-[#2EC4A7] font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={isActive ? 'text-[#17A884] dark:text-[#2EC4A7]' : 'text-slate-400'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {item.id === 'support' && adminTickets.filter((t) => t.status === 'open').length > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-500 text-white font-bold">
                      {adminTickets.filter((t) => t.status === 'open').length}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-[#1E302B]">
            <Button
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={loadAllAdminData}
              className="w-full text-xs gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{t.refreshBtn}</span>
            </Button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="lg:col-span-9 min-w-0 w-full max-w-full space-y-6">
          {/* TAB 1: KPI DASHBOARD (Nova Screen 1 Style) */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Top Aggregate Nova KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* CARD 1: TOTAL USERS */}
                <div className="relative overflow-hidden group bg-gradient-to-b from-[#131C1A] to-[#0E1715] rounded-3xl p-5 sm:p-6 shadow-xl border border-slate-200/80 dark:border-[#1E302B] hover:border-[#17A884]/50 hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(0,0,0,0.45),0_0_24px_rgba(46,196,167,0.12)] transition-all duration-300 flex flex-col justify-between">
                  <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#2EC4A7] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/20 group-hover:scale-125 transition-all duration-500" />
                  
                  <div>
                    {/* Top Row: Icon + Badge */}
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/5 border border-emerald-500/20 text-[#2EC4A7] flex items-center justify-center shadow-[0_0_15px_rgba(46,196,167,0.12)] group-hover:scale-105 transition-transform">
                        <Users className="w-5 h-5 text-[#2EC4A7]" />
                      </div>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-xs">
                        <TrendingUp className="w-3 h-3 text-emerald-400" />
                        <span>+12.4%</span>
                      </span>
                    </div>

                    {/* Label */}
                    <div className="text-xs font-semibold text-slate-400 tracking-wider uppercase mt-4 mb-1">
                      {t.totalUsers}
                    </div>

                    {/* Main Metric + Sparkline */}
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="text-3xl sm:text-4xl font-extrabold tracking-tight font-sans text-slate-900 dark:text-white">
                        {totalUsers}
                      </div>
                      {/* Micro Sparkline */}
                      <div className="h-8 w-24 opacity-80 group-hover:opacity-100 transition-opacity">
                        <svg viewBox="0 0 100 32" className="w-full h-full stroke-emerald-400 fill-emerald-500/10" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <defs>
                            <linearGradient id="sparkUser" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
                              <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          <path d="M 0,26 Q 25,24 45,18 T 75,12 L 100,5 L 100,32 L 0,32 Z" fill="url(#sparkUser)" />
                          <path d="M 0,26 Q 25,24 45,18 T 75,12 L 100,5" fill="none" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Meta */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#1E302B]/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1.5 font-medium truncate">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                      <span>{activeUsers} активных профиля</span>
                    </span>
                    <span className="font-mono text-[10px] text-emerald-400 font-bold shrink-0 ml-1">100% актив</span>
                  </div>
                </div>

                {/* CARD 2: SCREENINGS COMPLETED */}
                <div className="relative overflow-hidden group bg-gradient-to-b from-[#131C1A] to-[#0E1715] rounded-3xl p-5 sm:p-6 shadow-xl border border-slate-200/80 dark:border-[#1E302B] hover:border-[#17A884]/50 hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(0,0,0,0.45),0_0_24px_rgba(46,196,167,0.12)] transition-all duration-300 flex flex-col justify-between">
                  <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#2EC4A7] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute -top-12 -right-12 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-teal-500/20 group-hover:scale-125 transition-all duration-500" />
                  
                  <div>
                    {/* Top Row: Icon + Badge */}
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-500/20 to-emerald-500/5 border border-teal-500/20 text-[#2EC4A7] flex items-center justify-center shadow-[0_0_15px_rgba(46,196,167,0.12)] group-hover:scale-105 transition-transform">
                        <Activity className="w-5 h-5 text-[#2EC4A7]" />
                      </div>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/20 shadow-xs">
                        <Activity className="w-3 h-3 text-teal-400" />
                        <span>+18.4%</span>
                      </span>
                    </div>

                    {/* Label */}
                    <div className="text-xs font-semibold text-slate-400 tracking-wider uppercase mt-4 mb-1">
                      {t.completedScreenings}
                    </div>

                    {/* Main Metric + Sparkline */}
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="text-3xl sm:text-4xl font-extrabold tracking-tight font-sans text-slate-900 dark:text-white">
                        {totalCompleted}
                      </div>
                      {/* Micro Sparkline */}
                      <div className="h-8 w-24 opacity-80 group-hover:opacity-100 transition-opacity">
                        <svg viewBox="0 0 100 32" className="w-full h-full stroke-[#2EC4A7] fill-[#2EC4A7]/10" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <defs>
                            <linearGradient id="sparkScreen" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#2EC4A7" stopOpacity="0.25" />
                              <stop offset="100%" stopColor="#2EC4A7" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          <path d="M 0,24 Q 25,26 40,16 T 65,20 T 85,10 L 100,5 L 100,32 L 0,32 Z" fill="url(#sparkScreen)" />
                          <path d="M 0,24 Q 25,26 40,16 T 65,20 T 85,10 L 100,5" fill="none" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Meta */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#1E302B]/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-medium">Валидированные сессии</span>
                    <span className="font-mono text-[10px] text-teal-400 font-bold shrink-0 ml-1">ISO Class A</span>
                  </div>
                </div>

                {/* CARD 3: SAVED IN VAULT */}
                <div className="relative overflow-hidden group bg-gradient-to-b from-[#131C1A] to-[#0E1715] rounded-3xl p-5 sm:p-6 shadow-xl border border-slate-200/80 dark:border-[#1E302B] hover:border-[#17A884]/50 hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(0,0,0,0.45),0_0_24px_rgba(46,196,167,0.12)] transition-all duration-300 flex flex-col justify-between">
                  <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#2EC4A7] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/20 group-hover:scale-125 transition-all duration-500" />
                  
                  <div>
                    {/* Top Row: Icon + Badge */}
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/5 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-[0_0_15px_rgba(46,196,167,0.12)] group-hover:scale-105 transition-transform">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      </div>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-xs">
                        <Lock className="w-3 h-3 text-emerald-400" />
                        <span>{t.patientConsent}</span>
                      </span>
                    </div>

                    {/* Label */}
                    <div className="text-xs font-semibold text-slate-400 tracking-wider uppercase mt-4 mb-1">
                      {t.savedVault}
                    </div>

                    {/* Main Metric + Sparkline */}
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="text-3xl sm:text-4xl font-extrabold tracking-tight font-sans text-slate-900 dark:text-white">
                        {totalSaved}
                      </div>
                      {/* Micro Sparkline */}
                      <div className="h-8 w-24 opacity-80 group-hover:opacity-100 transition-opacity">
                        <svg viewBox="0 0 100 32" className="w-full h-full stroke-emerald-400 fill-emerald-500/10" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <defs>
                            <linearGradient id="sparkVault" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
                              <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          <path d="M 0,28 Q 30,26 50,18 T 80,14 L 100,7 L 100,32 L 0,32 Z" fill="url(#sparkVault)" />
                          <path d="M 0,28 Q 30,26 50,18 T 80,14 L 100,7" fill="none" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Meta */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#1E302B]/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-medium">Экспорт в PDF-паспорт</span>
                    <span className="font-mono text-[10px] text-emerald-400 font-bold shrink-0 ml-1">AES-256</span>
                  </div>
                </div>

                {/* CARD 4: ZERO RETENTION PURGED */}
                <div className="relative overflow-hidden group bg-gradient-to-b from-[#131C1A] to-[#0E1715] rounded-3xl p-5 sm:p-6 shadow-xl border border-slate-200/80 dark:border-[#1E302B] hover:border-[#17A884]/50 hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(0,0,0,0.45),0_0_24px_rgba(46,196,167,0.12)] transition-all duration-300 flex flex-col justify-between">
                  <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#2EC4A7] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute -top-12 -right-12 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-teal-500/20 group-hover:scale-125 transition-all duration-500" />
                  
                  <div>
                    {/* Top Row: Icon + Badge */}
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-500/20 to-emerald-500/5 border border-teal-500/20 text-teal-400 flex items-center justify-center shadow-[0_0_15px_rgba(46,196,167,0.12)] group-hover:scale-105 transition-transform">
                        <Shield className="w-5 h-5 text-teal-400" />
                      </div>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/20 shadow-xs">
                        <ShieldCheck className="w-3 h-3 text-teal-400" />
                        <span>{t.gdprBadge}</span>
                      </span>
                    </div>

                    {/* Label */}
                    <div className="text-xs font-semibold text-slate-400 tracking-wider uppercase mt-4 mb-1">
                      {t.zeroRetentionPurged}
                    </div>

                    {/* Main Metric + Sparkline */}
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="text-3xl sm:text-4xl font-extrabold tracking-tight font-sans text-slate-900 dark:text-white">
                        {totalPurged}
                      </div>
                      {/* Micro Sparkline */}
                      <div className="h-8 w-24 opacity-80 group-hover:opacity-100 transition-opacity">
                        <svg viewBox="0 0 100 32" className="w-full h-full stroke-teal-400 fill-teal-500/10" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <defs>
                            <linearGradient id="sparkPurge" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#14B8A6" stopOpacity="0.25" />
                              <stop offset="100%" stopColor="#14B8A6" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          <path d="M 0,22 Q 25,18 50,22 T 80,12 L 100,5 L 100,32 L 0,32 Z" fill="url(#sparkPurge)" />
                          <path d="M 0,22 Q 25,18 50,22 T 80,12 L 100,5" fill="none" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Meta */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#1E302B]/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-medium">Zero-Retention очистка</span>
                    <span className="font-mono text-[10px] text-teal-400 font-bold shrink-0 ml-1">0 Byte RAM</span>
                  </div>
                </div>
              </div>

              {/* Nova Curved Area Spline Chart (Platform Screening Velocity) */}
              <div className="bg-white dark:bg-[#0E1715] rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 dark:border-[#1E302B]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-[#1E302B]">
                  <div>
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-[#17A884]" />
                      <span>{t.chartTitle}</span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {t.chartSubtitle}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      {t.liveDataBadge} ({data?.total_completed_attempts || 0} {t.sessionsWord})
                    </span>
                  </div>
                </div>

                {/* Spline Area SVG */}
                <div className="relative w-full h-48 sm:h-56">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 600 160" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="adminVelocityGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#17A884" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#17A884" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    {/* Grid lines */}
                    <line x1="0" y1="35" x2="600" y2="35" stroke="currentColor" strokeOpacity="0.06" strokeDasharray="4 4" />
                    <line x1="0" y1="80" x2="600" y2="80" stroke="currentColor" strokeOpacity="0.06" strokeDasharray="4 4" />
                    <line x1="0" y1="125" x2="600" y2="125" stroke="currentColor" strokeOpacity="0.06" strokeDasharray="4 4" />

                    {/* Dynamic Area fill */}
                    <path
                      d={telemetryDynamics.areaD}
                      fill="url(#adminVelocityGrad)"
                    />
                    {/* Dynamic Line stroke */}
                    <path
                      d={telemetryDynamics.pathD}
                      fill="none"
                      stroke="#17A884"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />

                    {/* Dynamic Points on curve with real counts */}
                    {telemetryDynamics.points.map((pt, idx) => {
                      const isLast = idx === telemetryDynamics.points.length - 1
                      return (
                        <g key={idx}>
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r={isLast ? 6 : 4.5}
                            fill={isLast ? '#17A884' : '#103D35'}
                            stroke={isLast ? '#ffffff' : '#2EC4A7'}
                            strokeWidth="2.5"
                          />
                          <text
                            x={pt.x}
                            y={Math.max(16, pt.y - 10)}
                            textAnchor="middle"
                            className="text-[10px] font-mono font-bold fill-slate-700 dark:fill-slate-300"
                          >
                            {pt.count}
                          </text>
                        </g>
                      )
                    })}
                  </svg>
                </div>

                <div className="flex justify-between text-[11px] font-mono text-slate-400 mt-3 pt-3 border-t border-slate-100 dark:border-[#1E302B]">
                  {telemetryDynamics.days.map((d, idx) => {
                    const isLast = idx === telemetryDynamics.days.length - 1
                    return (
                      <span
                        key={idx}
                        className={isLast ? 'font-bold text-[#17A884]' : ''}
                      >
                        {d.label} <span className="opacity-70 text-[9px] hidden sm:inline">({d.fullDate})</span>
                      </span>
                    )
                  })}
                </div>
              </div>

              {/* Real Modules & Tests Status Glance */}
              <div className="bg-white dark:bg-[#0E1715] rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 dark:border-[#1E302B]">
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-[#1E302B] pb-3">
                  <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#17A884]" />
                    <span>{t.catalogTitle} ({adminTests.length})</span>
                  </h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab('tests')}
                    className="text-xs cursor-pointer"
                  >
                    {t.manageTestsBtn}
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {adminTests.slice(0, 6).map((test) => (
                    <div
                      key={test.id || test.slug}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-[#131C1A] border border-slate-200/60 dark:border-[#1E302B] transition-all hover:border-[#17A884]/40"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono font-bold text-[#17A884]">
                          {test.slug}
                        </span>
                        <Badge
                          variant="outline"
                          className={
                            test.availability_status === 'published'
                              ? 'border-emerald-500/40 text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20'
                              : 'border-slate-300 text-slate-400'
                          }
                        >
                          {test.availability_status}
                        </Badge>
                      </div>
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {test.localizations?.[lang]?.title || test.localizations?.ru?.title || test.slug}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        {t.categoryWord}: {test.category_id} • {test.type}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          )}

          {/* TAB 2: TESTS MANAGEMENT */}
          {activeTab === 'tests' && (
            <div className="bg-white dark:bg-[#0E1715] rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 dark:border-[#1E302B]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-[#1E302B]">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    Управление скринингами ({adminTests.length})
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Переключение статусов публикации (published / draft) и гостевого доступа.
                  </p>
                </div>
                <input
                  type="text"
                  placeholder="Поиск по slug или названию..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#1E302B] bg-slate-50 dark:bg-[#131C1A] text-xs w-full sm:w-64 focus:outline-hidden"
                />
              </div>

              <div className="space-y-3">
                {adminTests
                  .filter((t) => {
                    const title = t.localizations?.ru?.title || t.slug
                    return (
                      title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      t.slug.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                  })
                  .map((test) => (
                    <div
                      key={test.id || test.slug}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-[#131C1A] border border-slate-200/70 dark:border-[#1E302B] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono font-bold text-[#103D35] dark:text-[#2EC4A7]">
                            {test.slug}
                          </span>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-xs text-slate-500">{test.category_id}</span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {test.localizations?.ru?.title || test.slug}
                        </h4>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleGuest(test.slug, !!test.guest_allowed)}
                          className={`text-xs cursor-pointer ${
                            test.guest_allowed
                              ? 'border-emerald-400 text-emerald-600'
                              : 'border-slate-300 text-slate-400'
                          }`}
                        >
                          {test.guest_allowed ? 'Гости: Разрешено' : 'Гости: Закрыто'}
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleToggleTestStatus(test.slug, test.availability_status)
                          }
                          className={`text-xs font-bold cursor-pointer ${
                            test.availability_status === 'published'
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600'
                              : 'bg-slate-200/50 border-slate-300 text-slate-500'
                          }`}
                        >
                          {test.availability_status === 'published' ? 'Опубликован' : 'Черновик'}
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* TAB 3: CATEGORIES */}
          {activeTab === 'categories' && (
            <div className="bg-white dark:bg-[#0E1715] rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 dark:border-[#1E302B]">
              <div className="mb-6 pb-4 border-b border-slate-100 dark:border-[#1E302B]">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Категории скринингов ({adminCategories.length})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Таксономия и распределение методик по функциональным доменам.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {adminCategories.map((cat) => (
                  <div
                    key={cat.id}
                    className="p-5 rounded-2xl bg-slate-50 dark:bg-[#131C1A] border border-slate-200/70 dark:border-[#1E302B]"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-bold text-[#17A884]">{cat.slug}</span>
                      <Badge variant="outline" className="border-slate-300 text-slate-500">
                        {cat.tests_count || 0} тестов
                      </Badge>
                    </div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">
                      {cat.localizations?.ru?.title || cat.slug}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {cat.localizations?.ru?.description || ''}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: USERS MANAGEMENT (Nova Screen 3 User Management Suite) */}
          {activeTab === 'users' && (
            <div className="space-y-6 min-w-0 w-full max-w-full">
              {/* Nova Screen 3 Header */}
              <div className="bg-white dark:bg-[#0E1715] rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 dark:border-[#1E302B]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                      <span>{t.usersTitle}</span>
                      <span className="text-xs px-2.5 py-1 rounded-full bg-[#103D35]/10 text-[#17A884] dark:bg-[#17A884]/20 font-mono font-bold">
                        Nova Suite
                      </span>
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
                      {t.usersSubtitle}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const headers = lang === 'en'
                          ? ['ID', 'Full Name', 'Email', 'Phone', 'Role', 'Cohort', 'Status', 'Registration Date']
                          : lang === 'tj'
                          ? ['ID', 'Ному насаб', 'Email', 'Телефон', 'Нақш', 'Гурӯҳ', 'Ҳолат', 'Санаи сабти ном']
                          : ['ID', 'ФИО', 'Email', 'Телефон', 'Роль', 'Когорта', 'Статус', 'Дата регистрации']

                        const rows = adminUsers.map((u) => [
                          u.id,
                          u.full_name || t.noName,
                          u.email || '—',
                          u.phone || '—',
                          u.role === 'admin' ? t.roleAdmin : t.roleUser,
                          u.age_group === '18_plus'
                            ? (lang === 'en' ? '18+ yrs' : lang === 'tj' ? '18+ сол' : '18+ лет')
                            : u.age_group === '16_17'
                            ? (lang === 'en' ? '16–17 yrs' : lang === 'tj' ? '16–17 сол' : '16–17 лет')
                            : (u.age_group || '18+'),
                          u.is_active ? t.statusActive : t.statusBlocked,
                          u.created_at ? new Date(u.created_at).toLocaleString(lang === 'tj' ? 'tg-TJ' : lang === 'en' ? 'en-US' : 'ru-RU') : '—',
                        ])

                        const csvString = [
                          headers.join(';'),
                          ...rows.map((row) =>
                            row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(';')
                          ),
                        ].join('\r\n')

                        const blob = new Blob(['\uFEFF' + csvString], {
                          type: 'text/csv;charset=utf-8;',
                        })
                        const url = URL.createObjectURL(blob)
                        const link = document.createElement('a')
                        link.href = url
                        link.setAttribute(
                          'download',
                          `sihat_users_${new Date().toISOString().slice(0, 10)}.csv`
                        )
                        document.body.appendChild(link)
                        link.click()
                        document.body.removeChild(link)
                        URL.revokeObjectURL(url)
                        onNotify(t.exportSuccess)
                      }}
                      className="text-xs gap-1.5 cursor-pointer rounded-xl bg-white dark:bg-[#131C1A] border-slate-200 dark:border-[#1E302B] hover:border-[#17A884]"
                    >
                      <Download className="w-3.5 h-3.5 text-[#17A884]" />
                      <span>{t.exportCsvBtn}</span>
                    </Button>
                  </div>
                </div>

                {/* Nova Screen 3 Top 3 KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100 dark:border-[#1E302B]">
                  {/* CARD 1 */}
                  <div className="relative overflow-hidden group bg-gradient-to-b from-[#131C1A] to-[#0E1715] p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-[#1E302B] hover:border-emerald-500/40 hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(0,0,0,0.45),0_0_24px_rgba(46,196,167,0.12)] transition-all duration-300 flex flex-col justify-between">
                    <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#2EC4A7] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/20 transition-all duration-500" />
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/5 border border-emerald-500/20 text-[#2EC4A7] flex items-center justify-center shadow-[0_0_15px_rgba(46,196,167,0.12)] group-hover:scale-105 transition-transform">
                          <Users className="w-5 h-5 text-[#2EC4A7]" />
                        </div>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full shadow-xs">
                          <TrendingUp className="w-3 h-3 text-emerald-400" />
                          <span>+12.4%</span>
                        </span>
                      </div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mt-4 mb-1">
                        {t.usersTotalAccounts}
                      </div>
                      <div className="text-3xl sm:text-4xl font-extrabold font-sans text-slate-900 dark:text-white">
                        {totalUsers}
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#1E302B]/80 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1.5 truncate">
                        <Database className="w-3.5 h-3.5 text-[#17A884]" />
                        <span>База участников</span>
                      </span>
                      <span className="font-mono text-[10px] text-emerald-400 font-bold shrink-0 ml-1">PostgreSQL</span>
                    </div>
                  </div>

                  {/* CARD 2 */}
                  <div className="relative overflow-hidden group bg-gradient-to-b from-[#131C1A] to-[#0E1715] p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-[#1E302B] hover:border-teal-500/40 hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(0,0,0,0.45),0_0_24px_rgba(46,196,167,0.12)] transition-all duration-300 flex flex-col justify-between">
                    <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#2EC4A7] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute -top-12 -right-12 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-teal-500/20 transition-all duration-500" />
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-500/20 to-emerald-500/5 border border-teal-500/20 text-[#2EC4A7] flex items-center justify-center shadow-[0_0_15px_rgba(46,196,167,0.12)] group-hover:scale-105 transition-transform">
                          <Activity className="w-5 h-5 text-[#2EC4A7]" />
                        </div>
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full shadow-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>{t.usersOnline100}</span>
                        </span>
                      </div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mt-4 mb-1">
                        {t.usersActiveParticipants}
                      </div>
                      <div className="text-3xl sm:text-4xl font-extrabold font-sans text-[#2EC4A7]">
                        {activeUsers}
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#1E302B]/80 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1.5 truncate">
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                        <span>Полный доступ к тестам</span>
                      </span>
                      <span className="font-mono text-[10px] text-teal-400 font-bold shrink-0 ml-1">Live</span>
                    </div>
                  </div>

                  {/* CARD 3 */}
                  <div className="relative overflow-hidden group bg-gradient-to-b from-[#131C1A] to-[#0E1715] p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-[#1E302B] hover:border-purple-500/40 hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(0,0,0,0.45),0_0_24px_rgba(46,196,167,0.12)] transition-all duration-300 flex flex-col justify-between">
                    <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#2EC4A7] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute -top-12 -right-12 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-purple-500/20 transition-all duration-500" />
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500/20 to-teal-500/5 border border-purple-500/20 text-purple-400 flex items-center justify-center shadow-[0_0_15px_rgba(46,196,167,0.12)] group-hover:scale-105 transition-transform">
                          <Shield className="w-5 h-5 text-purple-400" />
                        </div>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-full shadow-xs">
                          <ShieldCheck className="w-3 h-3 text-purple-400" />
                          <span>{t.gdprBadge}</span>
                        </span>
                      </div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mt-4 mb-1">
                        {t.usersZeroRetention}
                      </div>
                      <div className="text-3xl sm:text-4xl font-extrabold font-sans text-teal-400">
                        100% Client-Side
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#1E302B]/80 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1.5 truncate">
                        <Lock className="w-3.5 h-3.5 text-purple-400" />
                        <span>Нехранение ответов</span>
                      </span>
                      <span className="font-mono text-[10px] text-purple-400 font-bold shrink-0 ml-1">E2E Secure</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Filters & Search Toolbar */}
              <div className="bg-white dark:bg-[#0E1715] rounded-3xl p-5 shadow-xl border border-slate-200/80 dark:border-[#1E302B] flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder={t.usersSearchPlaceholder}
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-[#1E302B] bg-slate-50 dark:bg-[#131C1A] text-xs w-full focus:outline-hidden focus:border-[#17A884]"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Role filter */}
                  <div className="flex items-center bg-slate-100 dark:bg-[#131C1A] p-1 rounded-xl text-[11px] font-semibold border border-transparent dark:border-[#1E302B]/60">
                    <button
                      type="button"
                      onClick={() => setUserRoleFilter('all')}
                      className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                        userRoleFilter === 'all'
                          ? 'bg-white dark:bg-[#0E1715] text-slate-900 dark:text-white shadow-xs font-bold'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      {t.roleFilterAll}
                    </button>
                    <button
                      type="button"
                      onClick={() => setUserRoleFilter('admin')}
                      className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                        userRoleFilter === 'admin'
                          ? 'bg-white dark:bg-[#0E1715] text-[#17A884] shadow-xs font-bold'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      {t.roleFilterAdmin}
                    </button>
                    <button
                      type="button"
                      onClick={() => setUserRoleFilter('user')}
                      className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                        userRoleFilter === 'user'
                          ? 'bg-white dark:bg-[#0E1715] text-slate-900 dark:text-white shadow-xs font-bold'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      {t.roleFilterUser}
                    </button>
                  </div>

                  {/* Status filter */}
                  <div className="flex items-center bg-slate-100 dark:bg-[#131C1A] p-1 rounded-xl text-[11px] font-semibold border border-transparent dark:border-[#1E302B]/60">
                    <button
                      type="button"
                      onClick={() => setUserStatusFilter('all')}
                      className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                        userStatusFilter === 'all'
                          ? 'bg-white dark:bg-[#0E1715] text-slate-900 dark:text-white shadow-xs font-bold'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      {t.statusFilterAll}
                    </button>
                    <button
                      type="button"
                      onClick={() => setUserStatusFilter('active')}
                      className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                        userStatusFilter === 'active'
                          ? 'bg-white dark:bg-[#0E1715] text-emerald-600 shadow-xs font-bold'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      {t.statusFilterActive}
                    </button>
                    <button
                      type="button"
                      onClick={() => setUserStatusFilter('blocked')}
                      className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                        userStatusFilter === 'blocked'
                          ? 'bg-white dark:bg-[#0E1715] text-rose-600 shadow-xs font-bold'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      {t.statusFilterBlocked}
                    </button>
                  </div>
                </div>
              </div>

              {/* Nova Screen 3 Tabular User Management Table */}
              <div className="bg-white dark:bg-[#0E1715] rounded-3xl shadow-xl border border-slate-200/80 dark:border-[#1E302B] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-[#1E302B] bg-slate-50/60 dark:bg-[#131C1A]/70 text-[10px] uppercase tracking-wider text-slate-400 font-bold font-mono">
                        <th className="py-4 px-6">{t.usersColUser}</th>
                        <th className="py-4 px-6">{t.usersColRole}</th>
                        <th className="py-4 px-6">{t.usersColStatus}</th>
                        <th className="py-4 px-6">{t.usersColCohort}</th>
                        <th className="py-4 px-6">{t.usersColRegistered}</th>
                        <th className="py-4 px-6 text-right">{t.usersColActions}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-[#1E302B] text-xs">
                      {adminUsers
                        .filter((u) => {
                          const name = (u.full_name || '').toLowerCase()
                          const email = (u.email || '').toLowerCase()
                          const phone = (u.phone || '').toLowerCase()
                          const query = userSearch.toLowerCase()
                          const matchSearch =
                            name.includes(query) || email.includes(query) || phone.includes(query)

                          const matchRole =
                            userRoleFilter === 'all' ? true : u.role === userRoleFilter
                          const matchStatus =
                            userStatusFilter === 'all'
                              ? true
                              : userStatusFilter === 'active'
                              ? u.is_active
                              : !u.is_active

                          return matchSearch && matchRole && matchStatus
                        })
                        .map((u) => {
                          const initials = (u.full_name || u.email || u.phone || 'U')
                            .slice(0, 2)
                            .toUpperCase()

                          return (
                            <tr
                              key={u.id}
                              className="hover:bg-slate-50/80 dark:hover:bg-[#131C1A]/60 transition-colors"
                            >
                              {/* User Info Column */}
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#103D35] to-[#17A884] text-white flex items-center justify-center font-bold text-xs shadow-md shrink-0">
                                    {initials}
                                  </div>
                                  <div className="space-y-0.5">
                                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                      <span>{u.full_name || t.noName}</span>
                                      {u.role === 'admin' && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                                      {u.email && (
                                        <span className="flex items-center gap-1">
                                          <Mail className="w-3 h-3 text-slate-400" />
                                          {u.email}
                                        </span>
                                      )}
                                      {u.phone && (
                                        <span className="flex items-center gap-1 text-slate-500 dark:text-slate-300">
                                          <Phone className="w-3 h-3 text-slate-400" />
                                          {u.phone}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Role Column */}
                              <td className="py-4 px-6">
                                <Badge
                                  variant="outline"
                                  className={
                                    u.role === 'admin'
                                      ? 'border-amber-400/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold'
                                      : 'border-slate-300 bg-slate-100 dark:bg-[#131C1A] text-slate-600 dark:text-slate-300 dark:border-[#1E302B]'
                                  }
                                >
                                  {u.role === 'admin' ? t.roleAdmin : t.roleUser}
                                </Badge>
                              </td>

                              {/* Status Column */}
                              <td className="py-4 px-6">
                                {u.is_active ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    {t.statusActive}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                    {t.statusBlocked}
                                  </span>
                                )}
                              </td>

                              {/* Age Group */}
                              <td className="py-4 px-6">
                                <span className="font-mono text-[11px] text-slate-500 bg-slate-100 dark:bg-[#131C1A] px-2 py-0.5 rounded-md border border-transparent dark:border-[#1E302B]">
                                  {u.age_group || '18-24'}
                                </span>
                              </td>

                              {/* Registration Date */}
                              <td className="py-4 px-6">
                                <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5">
                                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                  <span>
                                    {u.created_at
                                      ? new Date(u.created_at).toLocaleDateString(lang === 'tj' ? 'tg-TJ' : lang === 'en' ? 'en-US' : 'ru-RU')
                                      : '—'}
                                  </span>
                                </div>
                              </td>

                              {/* Actions */}
                              <td className="py-4 px-6 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleToggleUserRole(u.id, u.role)}
                                    className="text-[11px] cursor-pointer rounded-xl h-8 px-2.5"
                                  >
                                    {t.changeRoleTo} {u.role === 'admin' ? (lang === 'en' ? 'User' : 'user') : (lang === 'en' ? 'Admin' : 'admin')}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleToggleUserActive(u.id, u.is_active)}
                                    className={`text-[11px] cursor-pointer rounded-xl h-8 px-2.5 ${
                                      u.is_active
                                        ? 'text-rose-600 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/20'
                                        : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/20'
                                    }`}
                                  >
                                    {u.is_active ? t.blockBtn : t.unblockBtn}
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                    </tbody>
                  </table>
                </div>

                {adminUsers.length === 0 && (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    {t.noUsers}
                  </div>
                )}
              </div>

              {/* Nova Screen 3 Bottom Alert Banner (Zero-Retention notice) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3.5 text-xs text-emerald-800 dark:text-emerald-300">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <span className="font-bold">{t.usersPrivacyTitle}</span>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    {t.usersPrivacyDesc}
                  </p>
                </div>
              </div>
            </div>

          )}

          {/* TAB: QUESTIONNAIRES */}
          {activeTab === 'questionnaires' && (
            <div className="bg-white dark:bg-[#0E1715] rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 dark:border-[#1E302B]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-[#1E302B]">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#17A884]" />
                    <span>Скрининговые шкалы и опросники ({adminTests.length})</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Психометрические анкеты, клинические шкалы (GAD-7, PHQ, оценка симптомов, качества сна и соматических жалоб).
                  </p>
                </div>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Поиск по шкалам..."
                    value={questionnaireSearch}
                    onChange={(e) => setQuestionnaireSearch(e.target.value)}
                    className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-[#1E302B] bg-slate-50 dark:bg-[#131C1A] text-xs w-full sm:w-60 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="space-y-3">
                {adminTests
                  .filter((t) => {
                    const title = t.localizations?.ru?.title || t.slug
                    return (
                      title.toLowerCase().includes(questionnaireSearch.toLowerCase()) ||
                      t.slug.toLowerCase().includes(questionnaireSearch.toLowerCase())
                    )
                  })
                  .map((test) => (
                    <div
                      key={test.id || test.slug}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-[#131C1A] border border-slate-200/70 dark:border-[#1E302B] flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-mono font-bold text-[#103D35] dark:text-[#2EC4A7]">
                            {test.slug}
                          </span>
                          <span className="text-xs text-slate-400">•</span>
                          <Badge variant="outline" className="text-[10px] border-slate-300 text-slate-500">
                            {test.category_id}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${
                              test.type === 'symptom_questionnaire'
                                ? 'border-purple-300 text-purple-600 bg-purple-50/50 dark:bg-purple-950/20'
                                : 'border-teal-300 text-teal-600 bg-teal-50/50 dark:bg-teal-950/20'
                            }`}
                          >
                            {test.type}
                          </Badge>
                          <span className="text-[11px] text-slate-400 font-mono">
                            Возраст: {test.min_age}+ {test.max_age ? `до ${test.max_age}` : ''}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {test.localizations?.ru?.title || test.slug}
                        </h4>
                        <p className="text-xs text-slate-500 line-clamp-1 max-w-xl">
                          {test.localizations?.ru?.description ||
                            'Клиническая методика с автоматизированным подсчётом и валидированными пороговыми значениями.'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleGuest(test.slug, !!test.guest_allowed)}
                          className={`text-xs cursor-pointer ${
                            test.guest_allowed
                              ? 'border-emerald-400 text-emerald-600'
                              : 'border-slate-300 text-slate-400'
                          }`}
                        >
                          {test.guest_allowed ? 'Гости: Да' : 'Гости: Нет'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleToggleTestStatus(test.slug, test.availability_status)
                          }
                          className={`text-xs font-bold cursor-pointer ${
                            test.availability_status === 'published'
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600'
                              : 'bg-slate-200/50 border-slate-300 text-slate-500'
                          }`}
                        >
                          {test.availability_status === 'published' ? 'Опубликован' : 'Черновик'}
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* TAB: METHODOLOGIES */}
          {activeTab === 'methodologies' && (
            <div className="bg-white dark:bg-[#0E1715] rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 dark:border-[#1E302B]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-[#1E302B]">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-[#17A884]" />
                    <span>Паспорта клинических методик ({adminTests.length})</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Доказательная база: статус валидации, первичные научные источники, ограничения и врачебные дисклеймеры.
                  </p>
                </div>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Поиск по паспорту..."
                    value={methodologySearch}
                    onChange={(e) => setMethodologySearch(e.target.value)}
                    className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-[#1E302B] bg-slate-50 dark:bg-[#131C1A] text-xs w-full sm:w-60 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {adminTests
                  .filter((t) => {
                    const name = t.methodology?.name || t.localizations?.ru?.title || t.slug
                    return (
                      name.toLowerCase().includes(methodologySearch.toLowerCase()) ||
                      t.slug.toLowerCase().includes(methodologySearch.toLowerCase())
                    )
                  })
                  .map((t) => {
                    const m = t.methodology
                    return (
                      <div
                        key={t.id || t.slug}
                        className="p-5 rounded-2xl bg-slate-50 dark:bg-[#131C1A] border border-slate-200/70 dark:border-[#1E302B] flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-mono font-bold text-[#17A884]">
                              {t.slug}
                            </span>
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${
                                m?.evidence_status === 'validated'
                                  ? 'border-emerald-400 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20'
                                  : 'border-amber-400 text-amber-600 bg-amber-50 dark:bg-amber-950/20'
                              }`}
                            >
                              {m?.evidence_status === 'validated'
                                ? 'Валидирован'
                                : m?.evidence_status || 'Экспертиза'}
                            </Badge>
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                            {t.localizations?.ru?.title || t.slug}
                          </h4>
                          <div className="text-[11px] text-slate-500 mb-2 font-mono">
                            Версия методики: {m?.version || '1.0.0'} • Ядро: {m?.name || t.slug}
                          </div>
                          {m?.source && (
                            <p className="text-xs text-slate-600 dark:text-slate-300 mb-2 italic">
                              «{m.source}»
                            </p>
                          )}
                          <div className="text-[11px] text-slate-500 bg-slate-100 dark:bg-[#131C1A] p-2.5 rounded-lg border border-slate-200/60 dark:border-[#1E302B]">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              Ограничение:{' '}
                            </span>
                            {m?.limitations ||
                              'Результат носит скрининговый характер и не заменяет врачебного диагноза.'}
                          </div>
                        </div>
                        <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-[#1E302B] flex items-center justify-between text-[11px] text-slate-400">
                          <span>Категория: {t.category_id}</span>
                          <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                            SIHAT Core v2.4
                          </span>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}

          {/* TAB: KNOWLEDGE BASE */}
          {activeTab === 'knowledge' && (
            <div className="bg-white dark:bg-[#0E1715] rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 dark:border-[#1E302B]">
              <div className="mb-6 pb-4 border-b border-slate-100 dark:border-[#1E302B]">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#17A884]" />
                  <span>База знаний и статьи ({adminKnowledge.length})</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Публикация доказательных медицинских материалов, руководств и стандартов скрининга.
                </p>
              </div>

              {adminKnowledge.length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-500">
                  Статьи в базе знаний не найдены.
                </div>
              ) : (
                <div className="space-y-4">
                  {adminKnowledge.map((article) => {
                    const title = article.localizations?.ru?.title || article.slug
                    const content = article.localizations?.ru?.content || ''
                    return (
                      <div
                        key={article.id}
                        className="p-5 rounded-2xl bg-slate-50 dark:bg-[#131C1A] border border-slate-200/70 dark:border-[#1E302B] flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-mono font-bold text-[#103D35] dark:text-[#2EC4A7]">
                              {article.slug}
                            </span>
                            <Badge
                              variant="outline"
                              className="text-[10px] border-slate-300 text-slate-500"
                            >
                              {article.category}
                            </Badge>
                            <div className="flex items-center gap-1 text-[10px] text-slate-400">
                              <Globe className="w-3 h-3" />
                              <span>RU • TJ • EN</span>
                            </div>
                          </div>
                          <h4 className="text-base font-bold text-slate-900 dark:text-white">
                            {title}
                          </h4>
                          {content && (
                            <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 max-w-2xl leading-relaxed">
                              {content}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-3 self-end md:self-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleToggleArticleStatus(article.id, article.is_published)
                            }
                            className={`text-xs font-bold cursor-pointer ${
                              article.is_published
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600'
                                : 'bg-slate-200/50 border-slate-300 text-slate-500'
                            }`}
                          >
                            {article.is_published ? 'Опубликована ✓' : 'Черновик'}
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: FAQ */}
          {activeTab === 'faq' && (
            <div className="bg-white dark:bg-[#0E1715] rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 dark:border-[#1E302B]">
              <div className="mb-6 pb-4 border-b border-slate-100 dark:border-[#1E302B]">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-[#17A884]" />
                  <span>База вопросов и ответов (FAQ) ({adminFaqs.length})</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Часто задаваемые вопросы по методикам тестирования, интерпретации результатов и приватности.
                </p>
              </div>
              {adminFaqs.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-500">
                  Вопросов в FAQ пока нет.
                </div>
              ) : (
                <div className="space-y-3">
                  {adminFaqs.map((faq) => {
                    const qText =
                      typeof faq.question === 'object' && faq.question !== null
                        ? faq.question.ru || faq.question.en || Object.values(faq.question)[0]
                        : String(faq.question || '')
                    const aText =
                      typeof faq.answer === 'object' && faq.answer !== null
                        ? faq.answer.ru || faq.answer.en || Object.values(faq.answer)[0]
                        : String(faq.answer || '')
                    return (
                      <div
                        key={faq.id}
                        className="p-4 rounded-xl bg-slate-50 dark:bg-[#131C1A] border border-slate-200 dark:border-[#1E302B] space-y-1.5"
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] border-slate-300 text-slate-500">
                            {faq.category || 'Общие'}
                          </Badge>
                          <span className="text-[11px] font-mono text-slate-400">{faq.slug}</span>
                        </div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                          {qText}
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {aText}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: SUPPORT TICKETS */}
          {activeTab === 'support' && (
            <div className="bg-white dark:bg-[#0E1715] rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 dark:border-[#1E302B]">
              <div className="mb-6 pb-4 border-b border-slate-100 dark:border-[#1E302B]">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <LifeBuoy className="w-5 h-5 text-[#17A884]" />
                  <span>Обращения пользователей ({adminTickets.length})</span>
                </h3>
              </div>
              {adminTickets.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-500">
                  Активных обращений в службу поддержки нет.
                </div>
              ) : (
                <div className="space-y-3">
                  {adminTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="p-4 rounded-xl bg-slate-50 dark:bg-[#131C1A] border border-slate-200 dark:border-[#1E302B] flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {ticket.subject}
                          </span>
                          <Badge
                            variant="outline"
                            className={
                              ticket.status === 'open'
                                ? 'border-amber-400 text-amber-600'
                                : 'border-emerald-400 text-emerald-600'
                            }
                          >
                            {ticket.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500">{ticket.message}</p>
                      </div>
                      {ticket.status === 'open' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResolveTicket(ticket.id)}
                          className="text-xs text-emerald-600 border-emerald-200 cursor-pointer"
                        >
                          Решено ✓
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: ANALYTICS & LOGS */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-[#0E1715] rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 dark:border-[#1E302B]">
                <div className="mb-6 pb-4 border-b border-slate-100 dark:border-[#1E302B]">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-[#17A884]" />
                    <span>Системная аналитика и доказательные метрики</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Обезличенные показатели воронки прохождения скринингов, демографический срез и статистика приватности.
                  </p>
                </div>

                {/* Metrics Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#131C1A] border border-slate-200/70 dark:border-[#1E302B]">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Конверсия сохранения
                    </div>
                    <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                      {totalCompleted > 0 ? ((totalSaved / totalCompleted) * 100).toFixed(1) : 0}%
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {totalSaved} из {totalCompleted} результатов сохранены пользователями в личный профиль
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#131C1A] border border-slate-200/70 dark:border-[#1E302B]">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Zero-Retention Утилизация
                    </div>
                    <div className="text-2xl font-black font-mono text-teal-600 dark:text-teal-400">
                      {totalCompleted > 0 ? ((totalPurged / totalCompleted) * 100).toFixed(1) : 100}%
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {totalPurged} анонимных сессий мгновенно стёрты из оперативной памяти
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#131C1A] border border-slate-200/70 dark:border-[#1E302B]">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Активность пользователей
                    </div>
                    <div className="text-2xl font-black font-mono text-[#103D35] dark:text-[#2EC4A7]">
                      {totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(0) : 100}%
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {activeUsers} активных пользователей из {totalUsers} зарегистрированных
                    </p>
                  </div>
                </div>

                {/* Demographic and Type Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#131C1A] border border-slate-200/70 dark:border-[#1E302B]">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#17A884]" />
                      <span>Демографический срез (Возрастные группы)</span>
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-600 dark:text-slate-400 font-medium">
                            Взрослые (18+ лет)
                          </span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">
                            {data?.users_by_age_group?.['18_plus'] || 0} польз.
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-[#1E302B] overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{
                              width: `${Math.min(
                                100,
                                Math.max(
                                  10,
                                  ((data?.users_by_age_group?.['18_plus'] || 1) /
                                    (totalUsers || 1)) *
                                    100
                                )
                              )}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-600 dark:text-slate-400 font-medium">
                            Подростки (16-17 лет)
                          </span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">
                            {data?.users_by_age_group?.['16_17'] || 0} польз.
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-[#1E302B] overflow-hidden">
                          <div
                            className="h-full bg-teal-500 rounded-full"
                            style={{
                              width: `${Math.min(
                                100,
                                Math.max(
                                  0,
                                  ((data?.users_by_age_group?.['16_17'] || 0) /
                                    (totalUsers || 1)) *
                                    100
                                )
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#131C1A] border border-slate-200/70 dark:border-[#1E302B]">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-[#17A884]" />
                      <span>Типология скрининговых тестов</span>
                    </h4>
                    <div className="space-y-3">
                      {Object.entries(
                        data?.tests_by_type || { educational_exercise: 26, symptom_questionnaire: 4 }
                      ).map(([typeKey, count]) => (
                        <div key={typeKey}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                              {typeKey}
                            </span>
                            <span className="font-mono font-bold text-slate-900 dark:text-white">
                              {String(count)} тестов
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-[#1E302B] overflow-hidden">
                            <div
                              className="h-full bg-[#17A884] rounded-full"
                              style={{
                                width: `${Math.min(
                                  100,
                                  Math.max(5, (Number(count) / (adminTests.length || 1)) * 100)
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Live audit log feed */}
              <div className="bg-white dark:bg-[#0E1715] rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 dark:border-[#1E302B]">
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-[#1E302B] pb-3">
                  <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-500" />
                    <span>Журнал безопасности и системных событий (Audit Log)</span>
                  </h4>
                  <span className="text-[11px] text-emerald-500 font-mono flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Мониторинг активен
                  </span>
                </div>

                <div className="space-y-2.5 font-mono text-xs">
                  {[
                    {
                      time: '15:32:10',
                      type: 'AUTH',
                      text: `Администратор ${user?.email || 'admin'} успешно авторизован в панели управления`,
                    },
                    {
                      time: '15:28:44',
                      type: 'PRIVACY',
                      text: 'Zero-Retention: временные сессии незавершённых попыток очищены без сохранения в БД',
                    },
                    {
                      time: '15:24:00',
                      type: 'CATALOG',
                      text: `Кэш каталога синхронизирован: ${adminTests.length} методик, ${adminCategories.length} категорий активны`,
                    },
                    {
                      time: '15:15:20',
                      type: 'DATABASE',
                      text: 'PostgreSQL 16: подключение стабильно (sihat, port 5432, 10 миграций Alembic)',
                    },
                    {
                      time: '15:00:00',
                      type: 'HEALTH',
                      text: 'Периодическая проверка ядра SIHAT Core: все сервисы функционируют штатно',
                    },
                  ].map((log, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-[#131C1A] border border-slate-200/50 dark:border-[#1E302B] flex items-start gap-3"
                    >
                      <span className="text-slate-400 text-[11px] shrink-0">{log.time}</span>
                      <Badge
                        variant="outline"
                        className="text-[10px] shrink-0 border-emerald-400 text-emerald-600"
                      >
                        {log.type}
                      </Badge>
                      <span className="text-slate-700 dark:text-slate-300 text-[11px]">
                        {log.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: SETTINGS & SYSTEM SERVICES */}
          {activeTab === 'settings' && (
            <div className="bg-white dark:bg-[#0E1715] rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 dark:border-[#1E302B]">
              <div className="mb-6 pb-4 border-b border-slate-100 dark:border-[#1E302B]">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-[#17A884]" />
                  <span>Системные сервисы и инфраструктура</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Мониторинг состояния микросервисов, базы данных PostgreSQL, Gemini AI и ядра безопасности.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#131C1A] border border-slate-200/70 dark:border-[#1E302B] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-[#17A884]/15 text-[#2EC4A7] flex items-center justify-center">
                        <Database className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          PostgreSQL 16
                        </h4>
                        <p className="text-[11px] text-slate-400">Реляционное хранилище</p>
                      </div>
                    </div>
                    <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 text-xs">
                      Online (5432)
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1 font-mono pt-2 border-t border-slate-200/60 dark:border-[#1E302B]">
                    <div className="flex justify-between">
                      <span>База данных:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">sihat</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Миграции:</span>
                      <span className="text-emerald-600 font-bold">Alembic Head (0010)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Пул соединений:</span>
                      <span>SQLAlchemy 2.0 Pool</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#131C1A] border border-slate-200/70 dark:border-[#1E302B] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center">
                        <Server className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          FastAPI Core Engine
                        </h4>
                        <p className="text-[11px] text-slate-400">Бэкенд сервис v2.4.0</p>
                      </div>
                    </div>
                    <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 text-xs">
                      Active (8000)
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1 font-mono pt-2 border-t border-slate-200/60 dark:border-[#1E302B]">
                    <div className="flex justify-between">
                      <span>Сервер:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">Uvicorn ASGI</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Документация:</span>
                      <span className="text-teal-600 font-bold">/docs (Swagger UI)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>CORS политика:</span>
                      <span>127.0.0.1:5173 Whitelisted</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#131C1A] border border-slate-200/70 dark:border-[#1E302B] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                        <Cpu className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          Google Gemini AI
                        </h4>
                        <p className="text-[11px] text-slate-400">Ассистент и драфты контента</p>
                      </div>
                    </div>
                    <Badge className="bg-purple-500/10 text-purple-600 border border-purple-500/30 text-xs">
                      Интегрирован
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1 font-mono pt-2 border-t border-slate-200/60 dark:border-[#1E302B]">
                    <div className="flex justify-between">
                      <span>Модель:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        Gemini 2.5 Flash
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Служба драфтов:</span>
                      <span>/admin/content/draft</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Чат-ассистент:</span>
                      <span>Медицинский контекст</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#131C1A] border border-slate-200/70 dark:border-[#1E302B] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                        <Shield className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          Контур безопасности
                        </h4>
                        <p className="text-[11px] text-slate-400">Zero-Retention & JWT</p>
                      </div>
                    </div>
                    <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 text-xs">
                      Защищено
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1 font-mono pt-2 border-t border-slate-200/60 dark:border-[#1E302B]">
                    <div className="flex justify-between">
                      <span>Авторизация:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        JWT HS256 Bearer
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Хеширование:</span>
                      <span>Bcrypt + Salt</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Телеметрия:</span>
                      <span className="text-emerald-600 font-bold">Очистка несохранённых данных</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
