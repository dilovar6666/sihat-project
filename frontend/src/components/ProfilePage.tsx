import React, { useState, useEffect, useRef } from 'react'
import {
  User,
  ShieldCheck,
  FileText,
  Download,
  Trash2,
  Camera,
  Lock,
  Settings,
  LogOut,
  LayoutDashboard,
  GitCompare,
  Bell,
  ChevronDown,
  Search,
  HeartPulse,
  Sparkles,
  ExternalLink,
  Upload,
  Check,
  RefreshCw,
} from 'lucide-react'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import { Modal } from './ui/Modal'
import { PRESET_AVATARS } from './UserAvatar'
import { apiRequest } from '../api'
import type { Language } from '../i18n'
import type { SavedResult, UserProfile } from '../types'

export const PRESET_PORTRAITS = [
  { id: '/images/profile-default.webp', label: 'Стандарт', role: 'Врач' },
  { id: '/images/avatars/female-doctor.webp', label: 'Доктор (ж)', role: 'Невролог' },
  { id: '/images/avatars/male-doctor.webp', label: 'Клиницист', role: 'Офтальмолог' },
  { id: '/images/avatars/female-scientist.webp', label: 'Учёный', role: 'Психофизиолог' },
  { id: '/images/avatars/male-scientist.webp', label: 'Специалист', role: 'Аудиолог' },
  { id: '/images/avatars/neuro-avatar.webp', label: 'Нейросеть', role: 'ИИ' },
]

interface ProfilePageProps {
  user: UserProfile | null
  token: string
  lang: Language
  results: SavedResult[]
  onDownloadPdf: (resultId: string) => void
  onDeleteResult: (resultId: string) => void
  onClearAll: () => void
  onOpenAuth?: () => void
  onUpdateUser: (updatedUser: UserProfile) => void
  onNavigate: (pageId: string) => void
  onNotify: (msg: string) => void
  onLogout?: () => void
  onOpenNotifications?: () => void
  unreadNotificationsCount?: number
}

type ProfileTab =
  | 'overview'
  | 'results'
  | 'comparisons'
  | 'personal_data'
  | 'security'
  | 'settings'

export const ProfilePage: React.FC<ProfilePageProps> = ({
  user,
  token,
  lang,
  results: propResults,
  onDownloadPdf,
  onDeleteResult,
  onClearAll,
  onUpdateUser,
  onNavigate,
  onNotify,
  onLogout,
  onOpenNotifications,
  unreadNotificationsCount = 0,
}) => {
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview')
  const [results, setResults] = useState<SavedResult[]>(propResults || [])
  const [selectedResultForCompare, setSelectedResultForCompare] = useState<SavedResult | null>(null)
  const [comparisonData, setComparisonData] = useState<SavedResult[]>([])

  // Edit profile form
  const [fullName, setFullName] = useState(user?.full_name || '')
  const [ageGroup, setAgeGroup] = useState(user?.age_group || '18_plus')
  const [savingProfile, setSavingProfile] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)

  // Avatar modal
  const [avatarModalOpen, setAvatarModalOpen] = useState(false)
  const [selectedAvatar, setSelectedAvatar] = useState<string>(user?.avatar_url || '')
  const [savingAvatar, setSavingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Keep selected avatar synced if user prop changes
  useEffect(() => {
    setSelectedAvatar(user?.avatar_url || '')
  }, [user?.avatar_url])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      onNotify('Пожалуйста, выберите файл изображения (PNG, JPG, WebP)')
      return
    }
    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new window.Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX_SIZE = 500
        let width = img.width
        let height = img.height
        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width)
            width = MAX_SIZE
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height)
            height = MAX_SIZE
          }
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height)
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.88)
          setSelectedAvatar(compressedDataUrl)
        }
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  const handleResetAvatar = () => {
    setSelectedAvatar('')
  }

  // Filter
  const [searchFilter, setSearchFilter] = useState('')

  // Sync prop results
  useEffect(() => {
    if (propResults && propResults.length > 0) {
      setResults(propResults)
    }
  }, [propResults])

  // Fetch results from backend if authenticated
  useEffect(() => {
    if (token) {
      apiRequest<SavedResult[]>('/results/history')
        .then((data) => {
          if (Array.isArray(data)) {
            setResults(data)
          }
        })
        .catch(() => {})
    }
  }, [token])

  // Update comparison when selected result changes
  useEffect(() => {
    if (selectedResultForCompare && token) {
      apiRequest<{ results?: SavedResult[] }>(`/results/${selectedResultForCompare.id}/compare`)
        .then((res) => {
          if (res?.results) {
            setComparisonData(res.results)
          } else {
            setComparisonData([selectedResultForCompare])
          }
        })
        .catch(() => {
          setComparisonData([selectedResultForCompare])
        })
    }
  }, [selectedResultForCompare, token])

  const t = {
    ru: {
      dashboardTitle: 'Личный кабинет здоровья',
      dashboardSubtitle: 'Центр доказательной психофизиологии и скринингов',
      helloUser: 'Привет',
      tabOverview: 'Сводка и профиль',
      tabResults: 'Мои результаты',
      tabComparisons: 'Сравнение и динамика',
      tabPersonal: 'Личные данные',
      tabSecurity: 'Безопасность и сессии',
      tabSettings: 'Настройки аккаунта',
      tabLogout: 'Выйти из аккаунта',
      myProfileTitle: 'Мой профиль',
      lastLoginLabel: 'Последний вход: 24 окт 2026, 17:25 • Web Client',
      fullNameLabel: 'Имя пользователя',
      ageGroupLabel: 'Возрастная группа',
      emailLabel: 'Электронная почта',
      phoneLabel: 'Контактный телефон',
      alertsActivation: 'Email & SMS оповещения',
      saveBtn: 'Сохранить',
      myAccountsTitle: 'Мои аккаунты SIHAT',
      editBtn: 'Изменить',
      activeAccountLabel: 'Основной аккаунт',
      activeAccountId: 'ID: #8040 0000 8028 4525 • Роль: Пользователь',
      blockAccountBtn: 'Завершить сеанс',
      googleAccountLabel: 'Google Identity',
      googleAccountId: 'Google OAuth 2.0 • Привязанный аккаунт',
      unblockAccountBtn: 'Активен',
      myBillsTitle: 'Мои скрининги и метрики',
      filterByBtn: 'Фильтр',
      billPaid: 'В норме',
      billPending: 'Пройдено',
      billNotPaid: 'Требуется',
      guestTitle: 'Личный закрытый кабинет SIHAT',
      guestDesc:
        'Войдите в аккаунт или зарегистрируйтесь, чтобы сохранять результаты скринингов, анализировать динамику когнитивных маркеров и управлять профилем.',
      guestLoginBtn: 'Войти в аккаунт',
      guestRegisterBtn: 'Создать аккаунт',
      exploreCatalogBtn: 'Перейти в каталог скринингов',
      resultsCount: 'Сохранённых скринингов',
      privacyStatus: 'Архитектура данных',
      privacyStandard: 'GDPR / HIPAA Конфиденциальность',
      verifiedProfile: 'Верифицированный профиль',
      adminProfile: 'Администратор системы',
      changeAvatarBtn: 'Сменить аватарку',
      avatarModalTitle: 'Выбор клинической аватарки',
      avatarModalDesc: 'Выберите одну из предустановленных аватарок для вашего профиля.',
      saveAvatarBtn: 'Применить аватарку',
      saveSuccess: 'Профиль успешно обновлён!',
      avatarSaved: 'Аватарка успешно сохранена!',
      age18: '18 лет и старше (Взрослый)',
      age1617: '16–17 лет (Юношеский)',
      saveChangesBtn: 'Сохранить изменения профиля',
      archiveTitle: 'Персональный архив результатов',
      archiveDesc:
        'Результаты хранятся строго с вашего информированного согласия. Вы можете скачать PDF или удалить запись в любой момент.',
      clearAllBtn: 'Очистить историю',
      downloadPdfBtn: 'Экспорт PDF',
      deleteBtn: 'Удалить',
      compareBtn: 'Динамика',
      noResultsTitle: 'В вашем архиве пока нет сохранённых результатов.',
      noResultsDesc: 'Пройдите любой из 16 доказательных скринингов функций.',
      startFirstTestBtn: 'Выбрать тест в каталоге',
      searchPlaceholder: 'Поиск по названию скрининга...',
      recentActivity: 'Последняя активность',
      completedAt: 'Дата прохождения',
      activeSessions: 'Активные сессии',
      sessionCurrent: 'Текущий браузер (Активен)',
      twoFactor: 'Двухфакторная аутентификация (2FA)',
      twoFactorStatus: 'Email-верификация включена по умолчанию',
      deleteAccountNotice:
        'Удаление аккаунта навсегда стирает все связанные биометрические данные из базы данных.',
      deleteAccountBtn: 'Запросить удаление аккаунта',
      notificationsRead: 'Все уведомления прочитаны',
    },
    tj: {
      dashboardTitle: 'Ҳисоби шахсии саломатӣ',
      dashboardSubtitle: 'Маркази скринингҳо ва психофизиологияи исботшуда',
      helloUser: 'Салом',
      tabOverview: 'Хулоса ва профил',
      tabResults: 'Натиҷаҳои ман',
      tabComparisons: 'Муқоиса ва динамика',
      tabPersonal: 'Маълумоти шахсӣ',
      tabSecurity: 'Амният ва сессияҳо',
      tabSettings: 'Танзимоти ҳисоб',
      tabLogout: 'Баромад аз ҳисоб',
      myProfileTitle: 'Профили ман',
      lastLoginLabel: 'Вуруди охирин: 24 окт 2026, 17:25 • Web Client',
      fullNameLabel: 'Ному насаб',
      ageGroupLabel: 'Гурӯҳи синну сол',
      emailLabel: 'Почтаи электронӣ',
      phoneLabel: 'Рақами тамос',
      alertsActivation: 'Огоҳиномаҳои Email ва SMS',
      saveBtn: 'Сабт кардан',
      myAccountsTitle: 'Ҳисобҳои ман дар SIHAT',
      editBtn: 'Таҳрир',
      activeAccountLabel: 'Ҳисоби асосӣ',
      activeAccountId: 'ID: #8040 0000 8028 4525 • Нақш: Корбар',
      blockAccountBtn: 'Баромад аз сессия',
      googleAccountLabel: 'Google Identity',
      googleAccountId: 'Google OAuth 2.0 • Ҳисоби пайвастшуда',
      unblockAccountBtn: 'Фаъол аст',
      myBillsTitle: 'Скринингҳо ва нишондиҳандаҳо',
      filterByBtn: 'Филтр',
      billPaid: 'Меъёр',
      billPending: 'Гузашта',
      billNotPaid: 'Лозим аст',
      guestTitle: 'Ҳисоби шахсии SIHAT',
      guestDesc:
        'Барои нигоҳдории натиҷаҳо ва дидани динамикаи нишондиҳандаҳо ба ҳисоби худ ворид шавед.',
      guestLoginBtn: 'Воридшавӣ',
      guestRegisterBtn: 'Бақайдгирӣ',
      exploreCatalogBtn: 'Дидани феҳристи тестҳо',
      resultsCount: 'Скринингҳои сабтшуда',
      privacyStatus: 'Ҳолати маълумот',
      privacyStandard: 'GDPR / HIPAA Маҳрамона',
      verifiedProfile: 'Ҳисоби тасдиқшуда',
      adminProfile: 'Маъмури система',
      changeAvatarBtn: 'Ивази расми ҳисоб',
      avatarModalTitle: 'Интихоби аватари клиникӣ',
      avatarModalDesc: 'Яке аз расмҳои омодашударо интихоб кунед.',
      saveAvatarBtn: 'Сабти расм',
      saveSuccess: 'Маълумот нав карда шуд!',
      avatarSaved: 'Расми нав қабул шуд!',
      age18: '18 сола ва калонтар (Калонсолон)',
      age1617: '16–17 сола (Наврасон)',
      saveChangesBtn: 'Сабти тағйирот',
      archiveTitle: 'Бойгонии шахсии натиҷаҳо',
      archiveDesc: 'Натиҷаҳо танҳо бо розигии шумо нигоҳ дошта мешаванд.',
      clearAllBtn: 'Тоза кардани бойгонӣ',
      downloadPdfBtn: 'Боргирии PDF',
      deleteBtn: 'Нест кардан',
      compareBtn: 'Муқоиса',
      noResultsTitle: 'Дар бойгонӣ ҳоло ягон натиҷа нест.',
      noResultsDesc: 'Яке аз 16 санҷиши исботшудаи илмиро оғоз намоед.',
      startFirstTestBtn: 'Интихоби тест аз феҳрист',
      searchPlaceholder: 'Ҷустуҷӯ...',
      recentActivity: 'Фаъолияти охирин',
      completedAt: 'Санаи супоридан',
      activeSessions: 'Сессияҳои фаъол',
      sessionCurrent: 'Браузери ҳозира (Фаъол)',
      twoFactor: 'Тасдиқи думарҳилагӣ (2FA)',
      twoFactorStatus: 'Email-тасдиқ фаъол аст',
      deleteAccountNotice: 'Нест кардани ҳисоб ҳама маълумотро комилан пок месозад.',
      deleteAccountBtn: 'Дархости несткунии ҳисоб',
      notificationsRead: 'Ҳамаи огоҳиномаҳо хонда шуданд',
    },
    en: {
      dashboardTitle: 'My Health Dashboard',
      dashboardSubtitle: 'Welcome to SIHAT personal health portal',
      helloUser: 'Hello',
      tabOverview: 'Summary & Profile',
      tabResults: 'My Results',
      tabComparisons: 'Comparison & Dynamics',
      tabPersonal: 'Personal Data',
      tabSecurity: 'Security & Sessions',
      tabSettings: 'Account Settings',
      tabLogout: 'Sign Out',
      myProfileTitle: 'My Profile',
      lastLoginLabel: 'Last login: 24 Oct 2026, 17:25 • Web Client',
      fullNameLabel: 'User Name',
      ageGroupLabel: 'Age Group',
      emailLabel: 'Email Address',
      phoneLabel: 'Phone Number',
      alertsActivation: 'Email & SMS alerts',
      saveBtn: 'Save',
      myAccountsTitle: 'My SIHAT Accounts',
      editBtn: 'Edit',
      activeAccountLabel: 'Active Account',
      activeAccountId: 'ID: #8040 0000 8028 4525 • Role: User',
      blockAccountBtn: 'Sign Out Session',
      googleAccountLabel: 'Google Identity',
      googleAccountId: 'Google OAuth 2.0 • Linked Identity',
      unblockAccountBtn: 'Active',
      myBillsTitle: 'My Screenings & Metrics',
      filterByBtn: 'Filter by',
      billPaid: 'Normal',
      billPending: 'Completed',
      billNotPaid: 'Pending',
      guestTitle: 'Private SIHAT Dashboard',
      guestDesc:
        'Sign in or register to preserve screening results, monitor longitudinal cognitive biomarkers, and manage your account.',
      guestLoginBtn: 'Sign In',
      guestRegisterBtn: 'Create Account',
      exploreCatalogBtn: 'Explore Test Catalog',
      resultsCount: 'Archived Screenings',
      privacyStatus: 'Data Architecture',
      privacyStandard: 'GDPR / HIPAA Compliant Security',
      verifiedProfile: 'Verified Profile',
      adminProfile: 'System Administrator',
      changeAvatarBtn: 'Change Avatar',
      avatarModalTitle: 'Select Clinical Avatar',
      avatarModalDesc: 'Select an avatar representation for your personal account.',
      saveAvatarBtn: 'Apply Avatar',
      saveSuccess: 'Profile updated successfully!',
      avatarSaved: 'Avatar applied successfully!',
      age18: '18+ years (Adult)',
      age1617: '16–17 years (Adolescent)',
      saveChangesBtn: 'Save Changes',
      archiveTitle: 'Confidential Results Vault',
      archiveDesc:
        'Results are stored exclusively with your explicit consent. You can download PDF records or permanently purge any record.',
      clearAllBtn: 'Purge All History',
      downloadPdfBtn: 'Export PDF',
      deleteBtn: 'Delete',
      compareBtn: 'Compare',
      noResultsTitle: 'No archived results in your vault yet.',
      noResultsDesc: 'Take any of the 16 validated sensory, cognitive, and motor screenings.',
      startFirstTestBtn: 'Select Test in Catalog',
      searchPlaceholder: 'Search by screening title...',
      recentActivity: 'Recent Screening Activity',
      completedAt: 'Completed At',
      activeSessions: 'Active Authentication Sessions',
      sessionCurrent: 'Current Browser Session (Active)',
      twoFactor: 'Two-Factor Authentication (2FA)',
      twoFactorStatus: 'Email security verification active by default',
      deleteAccountNotice: 'Account deletion permanently erases all biometric history.',
      deleteAccountBtn: 'Request Account Deletion',
      notificationsRead: 'All notifications caught up',
    },
  }[lang]

  // Filtered results
  const filteredResults = results.filter((r) =>
    r.test_title.toLowerCase().includes(searchFilter.toLowerCase())
  )

  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!token) return
    setSavingProfile(true)
    try {
      const updated = await apiRequest<UserProfile>('/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          full_name: fullName,
          age_group: ageGroup,
        }),
      })
      onUpdateUser(updated)
      onNotify(t.saveSuccess)
    } catch (err: unknown) {
      onNotify(err instanceof Error ? err.message : 'Ошибка обновления профиля')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleSaveAvatar = async () => {
    if (!token) return
    setSavingAvatar(true)
    try {
      const updated = await apiRequest<UserProfile>('/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          avatar_url: selectedAvatar,
        }),
      })
      onUpdateUser(updated)
      setAvatarModalOpen(false)
      onNotify(t.avatarSaved)
    } catch (err: unknown) {
      onNotify(err instanceof Error ? err.message : 'Ошибка обновления аватара')
    } finally {
      setSavingAvatar(false)
    }
  }

  // If user is guest / unauthenticated
  if (!user || !token) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 animate-in fade-in duration-300">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-12 shadow-2xl border border-slate-200/80 dark:border-slate-800 text-center">
          <div className="w-16 h-16 rounded-3xl bg-[#17A884]/15 text-[#17A884] flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#103D35] dark:text-white tracking-tight mb-3">
            {t.guestTitle}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-lg mx-auto leading-relaxed mb-8">
            {t.guestDesc}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              onClick={() => onNavigate('login')}
              className="w-full sm:w-auto bg-[#103D35] hover:bg-[#17A884] text-white px-8 py-3.5 rounded-xl font-bold shadow-lg shadow-[#17A884]/20 cursor-pointer"
            >
              {t.guestLoginBtn}
            </Button>
            <Button
              variant="outline"
              onClick={() => onNavigate('register')}
              className="w-full sm:w-auto border-slate-300 dark:border-slate-700 px-6 py-3.5 rounded-xl font-bold cursor-pointer"
            >
              {t.guestRegisterBtn}
            </Button>
            <Button
              variant="outline"
              onClick={() => onNavigate('catalog')}
              className="w-full sm:w-auto border-[#17A884]/30 text-[#17A884] hover:bg-[#17A884]/10 px-6 py-3.5 rounded-xl font-bold cursor-pointer"
            >
              {t.exploreCatalogBtn}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const sidebarNavItems: Array<{ id: ProfileTab; label: string; icon: React.ReactNode }> = [
    { id: 'overview', label: t.tabOverview, icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'results', label: t.tabResults, icon: <FileText className="w-4 h-4" /> },
    { id: 'comparisons', label: t.tabComparisons, icon: <GitCompare className="w-4 h-4" /> },
    { id: 'personal_data', label: t.tabPersonal, icon: <User className="w-4 h-4" /> },
    { id: 'security', label: t.tabSecurity, icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'settings', label: t.tabSettings, icon: <Settings className="w-4 h-4" /> },
  ]

  // Default illustrative screenings for dashboard if empty or fewer than 4
  const defaultDashboardScreenings = [
    {
      id: 'sc-1',
      title: 'Таблицы Шульте',
      category: 'Концентрация и темп внимания',
      dotColor: 'bg-emerald-500',
      badgeText: t.billPaid,
      badgeClass: 'bg-gradient-to-r from-emerald-500 to-[#17A884] text-white',
      testSlug: 'attention-concentration',
    },
    {
      id: 'sc-2',
      title: 'Скорость реакции',
      category: 'Сенсомоторная латентность',
      dotColor: 'bg-emerald-500',
      badgeText: t.billPaid,
      badgeClass: 'bg-gradient-to-r from-emerald-500 to-[#17A884] text-white',
      testSlug: 'reaction-speed',
    },
    {
      id: 'sc-3',
      title: 'Блоки Корси',
      category: 'Пространственная память',
      dotColor: 'bg-teal-500',
      badgeText: t.billPending,
      badgeClass: 'bg-gradient-to-r from-teal-500 to-[#2EC4A7] text-white',
      testSlug: 'visual-memory',
    },
    {
      id: 'sc-4',
      title: 'Шкала тревожности GAD-7',
      category: 'Эмоциональный баланс',
      dotColor: 'bg-amber-500',
      badgeText: t.billPaid,
      badgeClass: 'bg-gradient-to-r from-emerald-500 to-green-600 text-white',
      testSlug: 'anxiety',
    },
  ]

  const userAvatarImage =
    user.avatar_url &&
    (user.avatar_url.startsWith('http') ||
      user.avatar_url.startsWith('data:image') ||
      user.avatar_url.startsWith('/images/'))
      ? user.avatar_url
      : '/images/profile-default.webp'

  return (
    <div className="min-h-screen bg-[#F4F6F9] dark:bg-slate-950 py-6 sm:py-10 px-3 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Decorative Organic Rounded Gradient Shapes in SIHAT Signature Emerald / Teal / Mint Colors (Exact Reference Style) */}
      <div className="absolute -bottom-16 -right-16 w-80 h-80 rounded-[3.5rem] bg-gradient-to-tr from-[#17A884] via-[#2EC4A7] to-[#DDF5EB] opacity-60 blur-xs rotate-12 pointer-events-none" />
      <div className="absolute -bottom-28 right-24 w-72 h-72 rounded-[3rem] bg-gradient-to-br from-[#103D35] via-[#17A884] to-[#2EC4A7] opacity-80 rotate-45 pointer-events-none shadow-2xl" />
      <div className="absolute -bottom-36 right-72 w-52 h-52 rounded-[2.5rem] bg-gradient-to-tr from-[#2EC4A7] to-[#103D35] opacity-40 rotate-30 pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Top App Header (Matching Reference Image) */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7 px-2">
          {/* Brand & Page Title */}
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#103D35] via-[#17A884] to-[#2EC4A7] p-0.5 shadow-lg shadow-[#17A884]/20 flex items-center justify-center">
              <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[14px] flex items-center justify-center">
                <HeartPulse className="w-6 h-6 text-[#17A884]" />
              </div>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {t.dashboardTitle}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {t.dashboardSubtitle}
              </p>
            </div>
          </div>

          {/* User Profile Pill & Notifications */}
          <div className="flex items-center gap-3 self-end sm:self-auto">
            <button
              type="button"
              onClick={onOpenNotifications || (() => onNotify(t.notificationsRead))}
              className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center text-slate-500 hover:text-[#17A884] shadow-xs hover:shadow-md transition-all cursor-pointer relative"
              title="Уведомления"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-2 right-2 min-w-[16px] h-4 px-1 rounded-full bg-[#17A884] text-white text-[9px] font-black flex items-center justify-center shadow-xs animate-pulse">
                  {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                </span>
              )}
            </button>

            <div
              onClick={() => setAvatarModalOpen(true)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs cursor-pointer hover:border-[#17A884]/60 transition-colors"
            >
              <div className="w-7 h-7 rounded-full overflow-hidden bg-slate-200 shrink-0 ring-1 ring-[#17A884]/40">
                <img
                  src={userAvatarImage}
                  alt={user.full_name}
                  className="w-full h-full object-cover grayscale contrast-125"
                />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                {t.helloUser} {user.full_name?.split(' ')[0] || 'User'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>
        </header>

        {/* Master Rounded Container Card (Matching Reference Image) */}
        <div className="bg-[#EBF0F5] dark:bg-slate-900/90 rounded-[2.5rem] p-4 sm:p-7 lg:p-8 shadow-2xl border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
            {/* Left Sidebar Menu */}
            <aside className="lg:col-span-3 space-y-1">
              <nav className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
                {sidebarNavItems.map((item) => {
                  const isActive = activeTab === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveTab(item.id)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 lg:w-full ${
                        isActive
                          ? 'bg-gradient-to-r from-[#103D35] to-[#17A884] text-white shadow-lg shadow-[#17A884]/25'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <span
                        className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                          isActive
                            ? 'bg-[#2EC4A7]/25 text-[#2EC4A7]'
                            : 'bg-slate-200/70 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </button>
                  )
                })}

                <div className="pt-2 lg:pt-4 border-t border-slate-300/60 dark:border-slate-800 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (onLogout) onLogout()
                      else {
                        onNotify('Вы вышли из системы')
                        onNavigate('home')
                      }
                    }}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all cursor-pointer whitespace-nowrap shrink-0 lg:w-full"
                  >
                    <span className="w-6 h-6 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-500 shrink-0">
                      <LogOut className="w-3.5 h-3.5" />
                    </span>
                    <span>{t.tabLogout}</span>
                  </button>
                </div>
              </nav>
            </aside>

            {/* Main Content Pane */}
            <main className="lg:col-span-9">
              {/* TAB 1: OVERVIEW — EXACT REPRODUCTION OF THE REFERENCE SCREEN */}
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  {/* Left Column: My Profile Card */}
                  <div className="md:col-span-6 bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between">
                    <div>
                      {/* Portrait Photo Container */}
                      <div
                        onClick={() => setAvatarModalOpen(true)}
                        className="relative w-full h-60 sm:h-68 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center group cursor-pointer shadow-inner mb-5"
                      >
                        <img
                          src={userAvatarImage}
                          alt={user.full_name}
                          className={`w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500 ${
                            userAvatarImage === '/images/profile-default.webp' ? 'grayscale contrast-125' : ''
                          }`}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
                        <div className="absolute top-3 right-3 flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setAvatarModalOpen(true)
                            }}
                            className="px-3 py-1.5 rounded-full bg-white/95 dark:bg-slate-900/95 text-slate-800 dark:text-slate-100 text-[11px] font-bold shadow-md hover:bg-[#17A884] hover:text-white transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur-md"
                          >
                            <Camera className="w-3.5 h-3.5 text-[#17A884]" />
                            <span>{t.changeAvatarBtn || 'Сменить фото'}</span>
                          </button>
                        </div>
                        <div className="absolute bottom-3 left-4 text-white text-xs font-bold tracking-wider uppercase flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-[#2EC4A7]" />
                          <span>{user.full_name}</span>
                        </div>
                      </div>

                      {/* Header row: My profile & Last login */}
                      <div className="flex items-start justify-between gap-2 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                        <div>
                          <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                            {t.myProfileTitle}
                          </h3>
                        </div>
                        <div className="text-[10px] text-slate-400 text-right leading-tight font-mono">
                          {t.lastLoginLabel}
                        </div>
                      </div>

                      {/* Minimalist Form Inputs (Style from Reference) */}
                      <form onSubmit={handleSaveProfile} className="space-y-3.5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                              {t.fullNameLabel}
                            </label>
                            <input
                              type="text"
                              value={fullName}
                              onChange={(e) => setFullName(e.target.value)}
                              placeholder="Имя пользователя"
                              className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:border-[#17A884] focus:ring-1 focus:ring-[#17A884]"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                              {t.ageGroupLabel}
                            </label>
                            <select
                              value={ageGroup}
                              onChange={(e) => setAgeGroup(e.target.value)}
                              className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:border-[#17A884]"
                            >
                              <option value="18_plus">{t.age18}</option>
                              <option value="16_17">{t.age1617}</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            {t.emailLabel}
                          </label>
                          <input
                            type="email"
                            disabled
                            value={user.email}
                            className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-slate-100/70 dark:bg-slate-800/30 border border-slate-200/50 dark:border-slate-700/50 text-slate-500 cursor-not-allowed"
                          />
                        </div>

                        {/* Switch row (SMS / Email alert activation) */}
                        <div className="flex items-center justify-between pt-2">
                          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                            {t.alertsActivation}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const next = !notificationsEnabled
                              setNotificationsEnabled(next)
                              onNotify(
                                next ? 'Оповещения активированы' : 'Оповещения приостановлены'
                              )
                            }}
                            className={`w-10 h-5.5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                              notificationsEnabled ? 'bg-[#17A884]' : 'bg-slate-300 dark:bg-slate-700'
                            }`}
                          >
                            <div
                              className={`bg-white w-4.5 h-4.5 rounded-full shadow-md transform transition-transform ${
                                notificationsEnabled ? 'translate-x-4.5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>

                        {/* Save Button */}
                        <div className="pt-3 text-center">
                          <Button
                            type="submit"
                            disabled={savingProfile}
                            className="w-auto px-10 py-2.5 rounded-full bg-gradient-to-r from-[#103D35] via-[#17A884] to-[#2EC4A7] hover:brightness-110 text-white font-bold text-xs shadow-lg shadow-[#17A884]/25 transition-all cursor-pointer"
                          >
                            {savingProfile ? '...' : t.saveBtn}
                          </Button>
                        </div>
                      </form>
                    </div>
                  </div>

                  {/* Right Column: Stacked Cards (My accounts & My bills/screenings) */}
                  <div className="md:col-span-6 space-y-6">
                    {/* Top Right Card: My SIHAT Accounts & Security */}
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200/60 dark:border-slate-800">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
                          {t.myAccountsTitle}
                        </h3>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setActiveTab('security')}
                            className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
                            title="Поиск"
                          >
                            <Search className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveTab('personal_data')}
                            className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                          >
                            {t.editBtn}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3.5">
                        {/* Active Account Row */}
                        <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                          <div>
                            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              {t.activeAccountLabel}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              {user.email}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (onLogout) onLogout()
                              else {
                                onNotify('Вы вышли из системы')
                                onNavigate('home')
                              }
                            }}
                            className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white text-[11px] font-bold shadow-xs transition-all cursor-pointer"
                          >
                            {t.blockAccountBtn}
                          </button>
                        </div>

                        {/* Google Identity Row */}
                        <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                          <div>
                            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              {t.googleAccountLabel}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              {t.googleAccountId}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => onNotify('Google Identity Services активен')}
                            className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-[#17A884] text-white text-[11px] font-bold shadow-xs hover:brightness-110 transition-all cursor-pointer"
                          >
                            {t.unblockAccountBtn}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Right Card: My Screenings (My Bills Style) */}
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200/60 dark:border-slate-800">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
                          {t.myBillsTitle}
                        </h3>
                        <button
                          type="button"
                          onClick={() => setActiveTab('results')}
                          className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                        >
                          {t.filterByBtn}
                        </button>
                      </div>

                      <div className="space-y-3">
                        {/* Display either real results or default clinical screenings */}
                        {results.length > 0
                          ? results.slice(0, 4).map((r) => (
                              <div
                                key={r.id}
                                className="flex items-center justify-between gap-3 py-1 border-b border-slate-50 dark:border-slate-800 last:border-b-0"
                              >
                                <div className="flex items-center gap-2.5">
                                  <span className="w-2.5 h-2.5 rounded-full bg-[#17A884] shrink-0" />
                                  <div>
                                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                      {r.test_title}
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-mono">
                                      {new Date(r.completed_at).toLocaleDateString()}
                                    </div>
                                  </div>
                                </div>
                                <span className="px-3.5 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-[#17A884] text-white text-[11px] font-bold shadow-xs">
                                  {t.billPaid}
                                </span>
                              </div>
                            ))
                          : defaultDashboardScreenings.map((sc) => (
                              <div
                                key={sc.id}
                                className="flex items-center justify-between gap-3 py-1 border-b border-slate-50 dark:border-slate-800 last:border-b-0"
                              >
                                <div className="flex items-center gap-2.5">
                                  <span className={`w-2.5 h-2.5 rounded-full ${sc.dotColor} shrink-0`} />
                                  <div>
                                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                      {sc.title}
                                    </div>
                                    <div className="text-[10px] text-slate-400">
                                      {sc.category}
                                    </div>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => onNavigate(`test:${sc.testSlug}`)}
                                  className={`px-3.5 py-1 rounded-full text-[11px] font-bold shadow-xs hover:scale-105 transition-all cursor-pointer ${sc.badgeClass}`}
                                >
                                  {sc.badgeText}
                                </button>
                              </div>
                            ))}
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
                        <button
                          type="button"
                          onClick={() => onNavigate('catalog')}
                          className="text-xs font-bold text-[#17A884] hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span>{t.exploreCatalogBtn}</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: MY RESULTS / ARCHIVE */}
              {activeTab === 'results' && (
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/60 dark:border-slate-800">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                        {t.archiveTitle}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">{t.archiveDesc}</p>
                    </div>

                    {results.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onClearAll}
                        className="border-rose-200 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-xs gap-1.5 self-start sm:self-center cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{t.clearAllBtn}</span>
                      </Button>
                    )}
                  </div>

                  {/* Search input */}
                  <div className="mb-6">
                    <input
                      type="text"
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      placeholder={t.searchPlaceholder}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-hidden focus:border-[#17A884]"
                    />
                  </div>

                  {filteredResults.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        {t.noResultsTitle}
                      </p>
                      <Button
                        onClick={() => onNavigate('catalog')}
                        className="bg-[#17A884] hover:bg-[#103D35] text-white text-xs px-4 py-2 font-bold cursor-pointer mt-4"
                      >
                        {t.startFirstTestBtn}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredResults.map((item) => (
                        <div
                          key={item.id}
                          className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 transition-all hover:border-[#17A884]/40"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-[#17A884]/15 text-[#103D35] dark:text-[#2EC4A7]">
                                  {item.test_slug}
                                </span>
                                <span className="text-xs text-slate-400">•</span>
                                <span className="text-xs text-slate-500 font-mono">
                                  {new Date(item.completed_at).toLocaleString()}
                                </span>
                              </div>
                              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                                {item.test_title}
                              </h4>

                              {/* Render primary metric preview */}
                              <div className="mt-3 flex flex-wrap gap-2">
                                {Object.entries(item.result).map(([k, v]) => {
                                  if (typeof v === 'object' && v !== null) return null
                                  return (
                                    <span
                                      key={k}
                                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] font-mono"
                                    >
                                      {k.replace(/_/g, ' ')}:{' '}
                                      <strong className="text-[#17A884]">{String(v)}</strong>
                                    </span>
                                  )
                                })}
                              </div>
                            </div>

                            {/* Action buttons */}
                            <div className="flex items-center gap-2 self-end sm:self-start">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onDownloadPdf(item.id)}
                                className="text-xs gap-1.5 cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5 text-[#17A884]" />
                                <span>{t.downloadPdfBtn}</span>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedResultForCompare(item)
                                  setActiveTab('comparisons')
                                }}
                                className="text-xs gap-1.5 cursor-pointer"
                              >
                                <GitCompare className="w-3.5 h-3.5 text-[#17A884]" />
                                <span>{t.compareBtn}</span>
                              </Button>
                              <button
                                type="button"
                                onClick={() => onDeleteResult(item.id)}
                                className="p-2 rounded-lg border border-rose-200 dark:border-rose-900/40 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer"
                                title={t.deleteBtn}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: COMPARISONS */}
              {activeTab === 'comparisons' && (
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/60 dark:border-slate-800">
                  <div className="mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <GitCompare className="w-5 h-5 text-[#17A884]" />
                      <span>{t.tabComparisons}</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Динамический анализ повторных попыток по совместимым условиям скрининга.
                    </p>
                  </div>

                  {results.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-xs text-slate-500">{t.noResultsTitle}</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wider">
                          Выберите скрининг для построения тренда:
                        </label>
                        <select
                          value={selectedResultForCompare?.id || ''}
                          onChange={(e) => {
                            const target = results.find((r) => r.id === e.target.value)
                            setSelectedResultForCompare(target || null)
                          }}
                          className="w-full max-w-md px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-hidden font-semibold"
                        >
                          <option value="">-- Выберите результат из архива --</option>
                          {results.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.test_title} ({new Date(r.completed_at).toLocaleDateString()})
                            </option>
                          ))}
                        </select>
                      </div>

                      {selectedResultForCompare && (
                        <div className="space-y-4">
                          <div className="p-4 rounded-xl bg-[#17A884]/10 border border-[#17A884]/20 text-xs text-[#103D35] dark:text-[#2EC4A7] font-semibold">
                            Найдено попыток со сравнимым калибровочным профилем:{' '}
                            {comparisonData.length}
                          </div>

                          <div className="space-y-3">
                            {comparisonData.map((item, idx) => (
                              <div
                                key={item.id}
                                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                              >
                                <div>
                                  <div className="text-xs text-slate-400">
                                    Попытка #{idx + 1} • {new Date(item.completed_at).toLocaleString()}
                                  </div>
                                  <div className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-1">
                                    {item.test_title}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className="text-xs font-mono font-bold text-[#17A884]">
                                    {String(Object.values(item.result)[0] || '100%')}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: PERSONAL DATA */}
              {activeTab === 'personal_data' && (
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/60 dark:border-slate-800">
                  <div className="mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                      {t.tabPersonal}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Управление учетными данными вашего закрытого профиля.
                    </p>
                  </div>

                  <form onSubmit={handleSaveProfile} className="space-y-5 max-w-xl">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                        {t.fullNameLabel}
                      </label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-hidden focus:border-[#17A884]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                        {t.emailLabel}
                      </label>
                      <input
                        type="email"
                        disabled
                        value={user.email}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/40 text-slate-500 text-sm cursor-not-allowed font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                        {t.ageGroupLabel}
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <label
                          className={`p-3 rounded-xl border text-xs font-semibold cursor-pointer flex items-center justify-between ${
                            ageGroup === '18_plus'
                              ? 'border-[#17A884] bg-[#17A884]/10 text-[#103D35] dark:text-[#2EC4A7]'
                              : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          <span>{t.age18}</span>
                          <input
                            type="radio"
                            name="age_prof"
                            value="18_plus"
                            checked={ageGroup === '18_plus'}
                            onChange={(e) => setAgeGroup(e.target.value)}
                            className="hidden"
                          />
                        </label>

                        <label
                          className={`p-3 rounded-xl border text-xs font-semibold cursor-pointer flex items-center justify-between ${
                            ageGroup === '16_17'
                              ? 'border-[#17A884] bg-[#17A884]/10 text-[#103D35] dark:text-[#2EC4A7]'
                              : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          <span>{t.age1617}</span>
                          <input
                            type="radio"
                            name="age_prof"
                            value="16_17"
                            checked={ageGroup === '16_17'}
                            onChange={(e) => setAgeGroup(e.target.value)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={savingProfile}
                      className="bg-[#103D35] hover:bg-[#17A884] text-white px-6 py-2.5 font-bold rounded-xl text-sm shadow-md cursor-pointer"
                    >
                      {savingProfile ? '...' : t.saveChangesBtn}
                    </Button>
                  </form>
                </div>
              )}

              {/* TAB 5: SECURITY */}
              {activeTab === 'security' && (
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/60 dark:border-slate-800 space-y-6">
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-[#17A884]" />
                      <span>{t.tabSecurity}</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Аутентификация, токены доступа и контроль сессий.
                    </p>
                  </div>

                  <div className="space-y-4 max-w-xl">
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                          {t.activeSessions}
                        </span>
                        <Badge variant="outline" className="border-emerald-500/40 text-emerald-600">
                          1 Активная
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 font-mono">{t.sessionCurrent}</p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                          {t.twoFactor}
                        </span>
                        <Badge variant="outline" className="border-emerald-500/40 text-emerald-600">
                          Активно
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500">{t.twoFactorStatus}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: SETTINGS */}
              {activeTab === 'settings' && (
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/60 dark:border-slate-800 space-y-6">
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Settings className="w-5 h-5 text-[#17A884]" />
                      <span>{t.tabSettings}</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Управление политикой хранения и правом на забвение.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/20 max-w-xl">
                    <h4 className="text-sm font-bold text-rose-700 dark:text-rose-400 mb-1">
                      Право на забвение (GDPR Art. 17)
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                      {t.deleteAccountNotice}
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => onNotify('Запрос на удаление профиля принят')}
                      className="border-rose-300 text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-950/40 text-xs font-bold cursor-pointer"
                    >
                      {t.deleteAccountBtn}
                    </Button>
                  </div>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>

      {/* Avatar Modal */}
      <Modal
        isOpen={avatarModalOpen}
        onClose={() => setAvatarModalOpen(false)}
        title={t.avatarModalTitle || 'Выбор и загрузка аватара'}
      >
        <div className="space-y-6">
          {/* Top Preview & Direct Upload Area */}
          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
            {/* Live Preview */}
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-slate-200 dark:bg-slate-700 shrink-0 border-2 border-[#17A884] shadow-md">
              <img
                src={
                  selectedAvatar && (selectedAvatar.startsWith('http') || selectedAvatar.startsWith('data:') || selectedAvatar.startsWith('/'))
                    ? selectedAvatar
                    : userAvatarImage
                }
                alt="Предпросмотр аватара"
                className="w-full h-full object-cover object-top"
              />
            </div>

            {/* Upload & Reset Controls */}
            <div className="flex-1 space-y-2.5 text-center sm:text-left">
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {lang === 'tj' ? 'Акси шахсӣ ё аватари шумо' : lang === 'en' ? 'Your Personal Photo or Avatar' : 'Ваша личная фотография или аватар'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {lang === 'tj'
                    ? 'Акси худро аз дастгоҳ боргузорӣ кунед (JPG, PNG, WebP) ё аз коллексияи зер интихоб намоед.'
                    : lang === 'en'
                    ? 'Upload your photo from your device (JPG, PNG, WebP) or choose from the gallery below.'
                    : 'Загрузите своё фото с компьютера/телефона (JPG, PNG, WebP) или выберите из коллекции ниже.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <input
                  type="file"
                  id="avatar-file-input"
                  ref={fileInputRef}
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-[#17A884] hover:bg-[#103D35] text-white text-xs font-bold gap-1.5 cursor-pointer shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{lang === 'tj' ? 'Боргузории акси худ' : lang === 'en' ? 'Upload Photo' : 'Загрузить своё фото'}</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResetAvatar}
                  className="text-xs text-slate-600 dark:text-slate-300 gap-1.5 cursor-pointer"
                  title="Вернуть стандартный аватар"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{lang === 'tj' ? 'Пешфарз' : lang === 'en' ? 'Default' : 'По умолчанию'}</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Section: Preset Professional Portraits */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                {lang === 'tj' ? 'Коллексияи портретҳо' : lang === 'en' ? 'Portrait Gallery' : 'Коллекция портретов'}
              </span>
              <span className="text-[10px] text-slate-400">
                {lang === 'tj' ? 'Барои интихоб зер кунед' : lang === 'en' ? 'Click to select' : 'Кликните для выбора'}
              </span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
              {PRESET_PORTRAITS.map((p) => {
                const isSelected = selectedAvatar === p.id || (!selectedAvatar && p.id === '/images/profile-default.webp')
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedAvatar(p.id)}
                    className={`relative rounded-2xl overflow-hidden aspect-square border-2 transition-all cursor-pointer group flex flex-col justify-end p-1.5 ${
                      isSelected
                        ? 'border-[#17A884] ring-2 ring-[#17A884]/40 scale-102 shadow-md'
                        : 'border-slate-200 dark:border-slate-700 hover:border-[#17A884]/60 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={p.id}
                      alt={p.label}
                      className="absolute inset-0 w-full h-full object-cover object-top"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#17A884] text-white flex items-center justify-center shadow-xs">
                        <Check className="w-2.5 h-2.5 stroke-3" />
                      </div>
                    )}
                    <span className="relative z-10 text-[9px] font-bold text-white leading-tight truncate w-full text-center">
                      {p.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Section: Clinical & Science Badges */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                {lang === 'tj' ? 'Нишонаҳои клиникӣ' : lang === 'en' ? 'Clinical Badges' : 'Специализированные иконки'}
              </span>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {PRESET_AVATARS.slice(0, 6).map((preset) => {
                const isSelected = selectedAvatar === preset.id
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSelectedAvatar(preset.id)}
                    className={`relative rounded-xl p-2 transition-all cursor-pointer flex flex-col items-center gap-1 border ${
                      isSelected
                        ? 'border-[#17A884] bg-[#17A884]/15 ring-2 ring-[#17A884]'
                        : 'border-slate-200 dark:border-slate-800 hover:border-[#17A884]/40 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-lg bg-gradient-to-tr ${preset.bg} flex items-center justify-center text-lg shadow-xs`}
                    >
                      {preset.emoji}
                    </div>
                    <span className="text-[9px] text-slate-600 dark:text-slate-400 font-bold truncate max-w-[70px]">
                      {preset.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="outline"
              onClick={() => setAvatarModalOpen(false)}
              className="text-xs cursor-pointer"
            >
              Отмена
            </Button>
            <Button
              onClick={handleSaveAvatar}
              disabled={savingAvatar}
              className="bg-[#17A884] hover:bg-[#103D35] text-white text-xs font-bold cursor-pointer shadow-md shadow-[#17A884]/20"
            >
              {savingAvatar ? 'Сохранение...' : (t.saveAvatarBtn || 'Сохранить аватар')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
