import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  User,
  ShieldAlert,
  Headphones,
  FileText,
  Download,
  Trash2,
  Camera,
  LogOut,
  LayoutDashboard,
  GitCompare,
  Search,
  Upload,
  Activity,
  Sliders,
  AlertCircle,
  Eye,
  Ear,
  Brain,
  ArrowRight,
  Lock,
  KeyRound,
  Mail,
  CheckCircle2,
  AlertTriangle,
  History,
  Calendar,
  Crosshair,
  X,
  Volume2,
} from 'lucide-react'
import { Button } from './ui/Button'
import { Modal } from './ui/Modal'
import { Badge } from './ui/Badge'
import { PRESET_AVATARS } from './UserAvatar'
import { apiRequest, fetchSupportUnreadCount } from '../api'
import { SupportChatsView } from './SupportChatsView'
import type { Language } from '../i18n'
import type { SavedResult, UserProfile } from '../types'
import { usePlatformSettings } from '../lib/settings'
import { playSoundSuccess } from '../lib/soundFx'
import { ResultsComparisonView } from './ResultsComparisonView'
import {
  ResultReportView,
  unwrapMetrics,
  getMetricLabel,
  formatMetricValue,
  getTopMetricKeys,
} from './ResultReportView'

export const PRESET_PORTRAITS = [
  { id: '/images/profile-default.webp', label: 'Стандарт', role: 'Участник' },
  { id: '/images/avatars/female-doctor.webp', label: 'Доктор (ж)', role: 'Специалист' },
  { id: '/images/avatars/male-doctor.webp', label: 'Клиницист', role: 'Офтальмолог' },
  { id: '/images/avatars/female-scientist.webp', label: 'Исследователь', role: 'Психофизиолог' },
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
  onNotify: (msg: string, type?: 'success' | 'info' | 'warning' | 'error') => void
  onLogout?: () => void
  onOpenNotifications?: () => void
  unreadNotificationsCount?: number
}

type ProfileTab =
  | 'overview'
  | 'results'
  | 'history'
  | 'comparisons'
  | 'personal'
  | 'security'
  | 'settings'
  | 'support'

const SLUG_CATEGORY_GROUP: Record<string, 'memory' | 'vision' | 'hearing' | 'reaction'> = {
  'attention-concentration': 'memory',
  'attention-switching': 'memory',
  'visual-memory': 'memory',
  'short-term-memory': 'memory',
  'information-processing-speed': 'memory',
  'contrast-sensitivity': 'vision',
  'visual-pairs': 'vision',
  'path-memory': 'vision',
  'pattern-matrix': 'vision',
  'sound-discrimination': 'hearing',
  'speech-in-noise': 'hearing',
  'reaction-speed': 'reaction',
  'go-no-go': 'reaction',
  'mouse-eye-coordination': 'reaction',
  'cursor-path': 'reaction',
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  user,
  token,
  lang,
  results: propResults,
  onDownloadPdf,
  onDeleteResult,
  onClearAll,
  onOpenAuth,
  onUpdateUser,
  onNavigate,
  onNotify,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<ProfileTab>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash
      if (user?.role !== 'admin' && (hash.includes('tab=support') || hash.includes('support'))) return 'support'
      if (hash.includes('tab=comparisons')) return 'comparisons'
      if (hash.includes('tab=results')) return 'results'
      if (hash.includes('tab=history')) return 'history'
      if (hash.includes('tab=settings')) return 'settings'
    }
    return 'overview'
  })

  // Prevent admin from viewing regular user support tab in profile (admins have full Support Hub in Admin Panel)
  useEffect(() => {
    if (user?.role === 'admin' && activeTab === 'support') {
      setActiveTab('overview')
    }
  }, [user?.role, activeTab])
  const [selectedSupportTicketId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const match = window.location.hash.match(/ticket=([a-zA-Z0-9-]+)/)
      return match ? match[1] : null
    }
    return null
  })
  const [unreadSupportCount, setUnreadSupportCount] = useState<number>(0)

  useEffect(() => {
    fetchSupportUnreadCount().then(setUnreadSupportCount).catch(() => {})
  }, [activeTab])
  const [results, setResults] = useState<SavedResult[]>(propResults || [])
  const [vaultDisplayMode, setVaultDisplayMode] = useState<'cards' | 'table'>('cards')
  const [searchFilter, setSearchFilter] = useState('')
  const [historySlugFilter, setHistorySlugFilter] = useState<string>('all')
  const [inspectingResult, setInspectingResult] = useState<SavedResult | null>(null)
  // Lock body scroll and listen for Escape key when inspecting result modal is open
  useEffect(() => {
    if (!inspectingResult) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setInspectingResult(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [inspectingResult])


  // Edit profile form state
  const [fullName, setFullName] = useState(user?.full_name || '')
  const [ageGroup, setAgeGroup] = useState(user?.age_group || '18_plus')
  const [savingProfile, setSavingProfile] = useState(false)

  // Attach email state
  const [attachEmailInput, setAttachEmailInput] = useState('')
  const [attachingEmail, setAttachingEmail] = useState(false)

  // Settings Toggles
  const [platformSettings, updatePlatformSetting] = usePlatformSettings()

  const autoSaveResults = platformSettings.autoSaveResults
  const pdfIncludeMethodology = platformSettings.pdfIncludeMethodology
  const soundEnabled = platformSettings.soundEnabled

  const handleToggleAutoSave = () => {
    const nextVal = !platformSettings.autoSaveResults
    updatePlatformSetting('autoSaveResults', nextVal)
    if (nextVal) {
      onNotify(
        lang === 'tj'
          ? 'Сабти худкор фаъол шуд: натиҷаҳои машқҳо ба таври худкор сабт мешаванд'
          : lang === 'en'
          ? 'Auto-save enabled: test results will automatically save to your personal archive'
          : 'Автосохранение включено: завершённые тесты будут автоматически записываться в архив',
        'success'
      )
    } else {
      onNotify(
        lang === 'tj'
          ? 'Сабти худкор хомӯш карда шуд: натиҷаҳо танҳо бо пахши тугмаи «Сабт» нигоҳ дошта мешаванд'
          : lang === 'en'
          ? 'Auto-save disabled: results will only save when you explicitly click "Save Result"'
          : 'Автосохранение выключено: результаты сохраняются только при нажатии кнопки «Сохранить»',
        'info'
      )
    }
  }

  const handleTogglePdfMethodology = () => {
    const nextVal = !platformSettings.pdfIncludeMethodology
    updatePlatformSetting('pdfIncludeMethodology', nextVal)
    if (nextVal) {
      onNotify(
        lang === 'tj'
          ? 'Шиносномаи методӣ ва маҳдудиятҳо ба протоколи PDF дохил карда мешаванд'
          : lang === 'en'
          ? 'Methodology passport and equipment constraints will be included in exported PDFs'
          : 'Паспорт методики и ограничения оборудования будут включаться в скачиваемый PDF-отчёт',
        'success'
      )
    } else {
      onNotify(
        lang === 'tj'
          ? 'Ҳолати мухтасар: шиносномаи методӣ аз протоколи PDF хориҷ карда шуд'
          : lang === 'en'
          ? 'Compact mode: methodology passport and constraints excluded from exported PDFs'
          : 'Компактный режим: паспорт методики и ограничения исключены из PDF-отчёта',
        'info'
      )
    }
  }

  const handleToggleSound = () => {
    const nextVal = !platformSettings.soundEnabled
    updatePlatformSetting('soundEnabled', nextVal)
    if (nextVal) {
      playSoundSuccess()
      onNotify(
        lang === 'tj'
          ? 'Садо ва эффектҳои аудиоӣ дар ҳамаи машқҳо фаъол шуданд'
          : lang === 'en'
          ? 'Sound effects and audio cues enabled across exercises'
          : 'Звуковое сопровождение и аудиоэффекты в тестах включены',
        'success'
      )
    } else {
      onNotify(
        lang === 'tj'
          ? 'Садо хомӯш карда шуд (реҷаи комилан бесадо)'
          : lang === 'en'
          ? 'Sound muted across exercises (silent mode)'
          : 'Звуковое сопровождение отключено (полная тишина в тестах)',
        'info'
      )
    }
  }

  const handleTestSound = () => {
    if (platformSettings.soundEnabled) {
      playSoundSuccess()
      onNotify(
        lang === 'tj'
          ? 'Садои санҷишӣ бомуваффақият навохта шуд ✓'
          : lang === 'en'
          ? 'Test sound played successfully ✓'
          : 'Звуковой сигнал успешно воспроизведён ✓',
        'success'
      )
    } else {
      onNotify(
        lang === 'tj'
          ? 'Садо дар танзимот хомӯш аст. Барои шунидани садо тугмаро фаъол кунед'
          : lang === 'en'
          ? 'Audio is disabled in settings. Enable the toggle to hear sounds'
          : 'Звук отключён в настройках. Включите тумблер для воспроизведения',
        'info'
      )
    }
  }

  // Security password reset
  const [resettingPassword, setResettingPassword] = useState(false)
  const [resetEmailSuccess, setResetEmailSuccess] = useState<string | null>(null)

  // Avatar modal
  const [avatarModalOpen, setAvatarModalOpen] = useState(false)
  const [selectedAvatar, setSelectedAvatar] = useState<string>(user?.avatar_url || '')
  const [savingAvatar, setSavingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setSelectedAvatar(user?.avatar_url || '')
    setFullName(user?.full_name || '')
    setAgeGroup(user?.age_group || '18_plus')
  }, [user])

  useEffect(() => {
    setResults(propResults || [])
  }, [propResults])

  const t = {
    ru: {
      dashboardTitle: 'Личный кабинет SIHAT',
      dashboardSubtitle: 'Персональный архив результатов, история прохождений и управление профилем',
      tabOverview: 'Обзор',
      tabResults: 'Мои результаты',
      tabHistory: 'История',
      tabComparisons: 'Сравнение результатов',
      tabPersonal: 'Личные данные',
      tabSecurity: 'Безопасность',
      tabSettings: 'Настройки',
      tabSupport: 'Поддержка и чаты',
      tabLogout: 'Выход',
      totalScreenings: 'Сохранено результатов',
      uniqueTests: 'Пройдено методик',
      latestDate: 'Последнее прохождение',
      categorySummary: 'Распределение по направлениям',
      catMemory: 'Внимание и память',
      catVision: 'Зрительное восприятие',
      catHearing: 'Слух',
      catReaction: 'Реакция и координация',
      recentActivity: 'Последние сохранённые результаты',
      openAllResults: 'Все результаты',
      startScreeningBtn: 'Каталог упражнений',
      adminPanelBtn: 'Админ-панель',
      viewReportBtn: 'Отчёт',
      pdfBtn: 'PDF',
      retakeBtn: 'Пройти снова',
      deleteBtn: 'Удалить',
      clearAllBtn: 'Очистить архив',
      noResultsTitle: 'В вашем архиве пока нет сохранённых результатов',
      noResultsDesc: 'Пройдите любое упражнение в каталоге и нажмите «Сохранить результат» после завершения.',
      goToCatalogBtn: 'Перейти в каталог',
      searchPlaceholder: 'Поиск по названию упражнения...',
      compareTitle: 'Сравнение результатов по методикам',
      compareSubtitle: 'Выберите упражнение, чтобы сравнить ваши показатели между несколькими попытками в динамике',
      compareSelectAll: 'Все упражнения с повторными попытками',
      compareNeedMore: 'Для сравнения в динамике сохраните минимум 2 результата одного и того же упражнения.',
      personalTitle: 'Личные данные',
      personalSubtitle: 'Обновите имя, возрастную группу, фотографию профиля и контактные данные',
      fullNameLabel: 'Имя или псевдоним',
      emailLabel: 'Электронная почта (Email)',
      phoneLabel: 'Номер телефона',
      ageGroupLabel: 'Возрастная группа',
      age18: '18+ лет (Взрослый)',
      age1617: '16–17 лет (Юношеский)',
      saveChangesBtn: 'Сохранить изменения',
      discardBtn: 'Сбросить',
      securityTitle: 'Безопасность и доступ',
      securitySubtitle: 'Управление паролем, защита учётной записи и удаление данных',
      resetPasswordBtn: 'Отправить ссылку сброса пароля',
      resetPasswordDesc: 'Мы отправим защищённую ссылку для смены пароля на вашу электронную почту',
      resetEmailSentSuccess: 'Ссылка для сброса пароля отправлена на вашу почту.',
      resetEmailMissing: 'Сначала привяжите email во вкладке «Личные данные».',
      settingsTitle: 'Настройки платформы',
      settingsSubtitle: 'Параметры приватности, звуковых сигналов и формирования PDF-отчётов',
      autoSaveTitle: 'Автоматическое сохранение результатов',
      autoSaveDesc: 'Автоматически сохранять результаты тестов в личный архив. При выключении — сохранение происходит только вручную по кнопке «Сохранить»',
      pdfMethodTitle: 'Включать паспорт методики в PDF-отчёт',
      pdfMethodDesc: 'Добавлять научный первоисточник (PubMed/ISO) и ограничения оборудования в PDF',
      soundTitle: 'Звуковое сопровождение в тестах',
      soundDesc: 'Звуки при ответах, завершении тестов и генерация аудиосигналов в упражнениях',
      testSoundBtn: 'Проверить звук',
      gdprTitle: 'Удаление истории и данных',
      gdprNotice: 'Вы можете в любой момент очистить весь архив сохранённых результатов.',
      unauthTitle: 'Вход в личный кабинет',
      unauthDesc: 'Войдите в аккаунт для просмотра сохранённых результатов, графиков и сравнения попыток.',
      unauthBtn: 'Войти или зарегистрироваться',
      closeReport: 'Закрыть отчёт',
      avatarModalTitle: 'Выбор аватара профиля',
      uploadOwn: 'Загрузить своё фото (до 2 МБ)',
      cancelBtn: 'Отмена',
      applyAvatarBtn: 'Сохранить аватар',
    },
    tj: {
      dashboardTitle: 'Утоқи шахсии SIHAT',
      dashboardSubtitle: 'Бойгонии шахсии натиҷаҳо, таърихи гузариш ва танзимоти профил',
      tabOverview: 'Хулоса',
      tabResults: 'Натиҷаҳои ман',
      tabHistory: 'Таърих',
      tabComparisons: 'Муқоисаи натиҷаҳо',
      tabPersonal: 'Маълумоти шахсӣ',
      tabSecurity: 'Амният',
      tabSettings: 'Танзимот',
      tabSupport: 'Дастгирӣ ва чатҳо',
      tabLogout: 'Баромад',
      totalScreenings: 'Натиҷаҳои сабтшуда',
      uniqueTests: 'Методикаҳои гузашта',
      latestDate: 'Охирин гузариш',
      categorySummary: 'Тақсимот аз рӯи самтҳо',
      catMemory: 'Таваҷҷуҳ ва хотира',
      catVision: 'Дарки визуалӣ',
      catHearing: 'Шунавоӣ',
      catReaction: 'Вокуниш ва ҳамоҳангӣ',
      recentActivity: 'Натиҷаҳои охирини сабтшуда',
      openAllResults: 'Ҳамаи натиҷаҳо',
      startScreeningBtn: 'Феҳристи машқҳо',
      adminPanelBtn: 'Панели админ',
      viewReportBtn: 'Ҳисобот',
      pdfBtn: 'PDF',
      retakeBtn: 'Аз нав гузаштан',
      deleteBtn: 'Нест кардан',
      clearAllBtn: 'Тоза кардани бойгонӣ',
      noResultsTitle: 'Дар бойгонии шумо ҳанӯз натиҷаҳои сабтшуда нест',
      noResultsDesc: 'Ягон машқро дар феҳрист гузаред ва пас аз анҷом тугмаи «Сабт кардан»-ро пахш намоед.',
      goToCatalogBtn: 'Гузаштан ба феҳрист',
      searchPlaceholder: 'Ҷустуҷӯ аз рӯи номи машқ...',
      compareTitle: 'Муқоисаи натиҷаҳо аз рӯи методикаҳо',
      compareSubtitle: 'Машқро интихоб кунед, то нишондиҳандаҳои худро дар байни кӯшишҳо муқоиса намоед',
      compareSelectAll: 'Ҳамаи машқҳо бо кӯшишҳои такрорӣ',
      compareNeedMore: 'Барои муқоиса ҳадди ақал 2 натиҷаи як машқро сабт намоед.',
      personalTitle: 'Маълумоти шахсӣ',
      personalSubtitle: 'Ном, гурӯҳи синну сол ва акси профилро навсозӣ кунед',
      fullNameLabel: 'Ном ё тахаллус',
      emailLabel: 'Почтаи электронӣ (Email)',
      phoneLabel: 'Рақами телефон',
      ageGroupLabel: 'Гурӯҳи синну сол',
      age18: '18+ сола (Калонсолон)',
      age1617: '16–17 сола (Наврасон)',
      saveChangesBtn: 'Сабти тағйирот',
      discardBtn: 'Бекор кардан',
      securityTitle: 'Амният ва дастрасӣ',
      securitySubtitle: 'Идоракунии рамз ва муҳофизати ҳисоб',
      resetPasswordBtn: 'Ирсоли пайванди барқароркунии рамз',
      resetPasswordDesc: 'Мо пайванди амнро барои ивази рамз ба почтаи шумо мефиристем',
      resetEmailSentSuccess: 'Пайванд барои ивази рамз ба почтаи шумо фиристода шуд.',
      resetEmailMissing: 'Аввал дар бахши «Маълумоти шахсӣ» email пайваст кунед.',
      settingsTitle: 'Танзимоти платформа',
      settingsSubtitle: 'Параметрҳои махфият, садо ва ҳисоботи PDF',
      autoSaveTitle: 'Сабти худкори натиҷаҳо',
      autoSaveDesc: 'Натиҷаҳо ба таври худкор дар бойгонӣ сабт мешаванд. Ҳангоми хомӯш будан — танҳо бо пахши тугмаи «Сабт кардан»',
      pdfMethodTitle: 'Шиносномаи методӣ дар гузориши PDF',
      pdfMethodDesc: 'Илова кардани сарчашмаи илмӣ ва маҳдудиятҳо ҳангоми содироти PDF',
      soundTitle: 'Ҳамроҳии аудиоӣ дар машқҳо',
      soundDesc: 'Овозҳои посух, анҷоми санҷиш ва тавлиди сигналҳои аудиоӣ дар машқҳо',
      testSoundBtn: 'Санҷиши садо',
      gdprTitle: 'Поксозии таърих ва маълумот',
      gdprNotice: 'Шумо метавонед дар дилхоҳ вақт тамоми бойгонии натиҷаҳоро пок кунед.',
      unauthTitle: 'Воридшавӣ ба утоқи шахсӣ',
      unauthDesc: 'Барои дидани натиҷаҳои сабтшуда ва муқоисаи кӯшишҳо ба ҳисоб ворид шавед.',
      unauthBtn: 'Воридшавӣ ё бақайдгирӣ',
      closeReport: 'Пӯшидани ҳисобот',
      avatarModalTitle: 'Интихоби аватари профил',
      uploadOwn: 'Боргирии акси худ (то 2 МБ)',
      cancelBtn: 'Бекор кардан',
      applyAvatarBtn: 'Сабти аватар',
    },
    en: {
      dashboardTitle: 'SIHAT Personal Profile',
      dashboardSubtitle: 'Personal result archive, attempt timeline, comparisons, and account settings',
      tabOverview: 'Overview',
      tabResults: 'My Results',
      tabHistory: 'History',
      tabComparisons: 'Compare Results',
      tabPersonal: 'Personal Data',
      tabSecurity: 'Security',
      tabSettings: 'Settings',
      tabSupport: 'Support & Chats',
      tabLogout: 'Sign Out',
      totalScreenings: 'Saved Results',
      uniqueTests: 'Exercises Completed',
      latestDate: 'Latest Session',
      categorySummary: 'Breakdown by Discipline',
      catMemory: 'Attention & Memory',
      catVision: 'Visual Perception',
      catHearing: 'Hearing',
      catReaction: 'Reaction & Coordination',
      recentActivity: 'Recent Saved Results',
      openAllResults: 'View All Results',
      startScreeningBtn: 'Exercise Catalog',
      adminPanelBtn: 'Admin Panel',
      viewReportBtn: 'Report',
      pdfBtn: 'PDF',
      retakeBtn: 'Retake',
      deleteBtn: 'Delete',
      clearAllBtn: 'Clear Archive',
      noResultsTitle: 'No saved results in your archive yet',
      noResultsDesc: 'Complete any exercise in the catalog and click "Save Result" when finished.',
      goToCatalogBtn: 'Browse Catalog',
      searchPlaceholder: 'Search by exercise title...',
      compareTitle: 'Longitudinal Result Comparison',
      compareSubtitle: 'Select an exercise to compare your metrics across multiple saved attempts',
      compareSelectAll: 'All exercises with multiple attempts',
      compareNeedMore: 'Save at least 2 results of the same exercise to compare progress over time.',
      personalTitle: 'Personal Information',
      personalSubtitle: 'Update your display name, age group, avatar, and contact details',
      fullNameLabel: 'Full Name or Alias',
      emailLabel: 'Email Address',
      phoneLabel: 'Phone Number',
      ageGroupLabel: 'Age Group',
      age18: '18+ years (Adult)',
      age1617: '16–17 years (Youth)',
      saveChangesBtn: 'Save Changes',
      discardBtn: 'Reset',
      securityTitle: 'Security & Access',
      securitySubtitle: 'Manage your password, account protection, and data erasure',
      resetPasswordBtn: 'Send Password Reset Link',
      resetPasswordDesc: 'We will send a secure link to update your password to your email address',
      resetEmailSentSuccess: 'Password reset link sent to your email.',
      resetEmailMissing: 'Please link an email address in "Personal Data" first.',
      settingsTitle: 'Platform Settings',
      settingsSubtitle: 'Privacy preferences, audio effects, and PDF report options',
      autoSaveTitle: 'Automatic Result Saving',
      autoSaveDesc: 'Automatically record completed test results to your profile archive. When disabled, results are saved only when you click "Save Result"',
      pdfMethodTitle: 'Include Methodology Passport in PDF',
      pdfMethodDesc: 'Include scientific literature references (PubMed/ISO) and hardware constraints in PDF reports',
      soundTitle: 'Audio Effects & Test Sound',
      soundDesc: 'Interaction sounds, answer feedback, test completion fanfare, and tone synthesis',
      testSoundBtn: 'Test Audio',
      gdprTitle: 'Data & Archive Erasure',
      gdprNotice: 'You can permanently delete individual saved results or clear your entire archive at any time.',
      unauthTitle: 'Sign In to Personal Profile',
      unauthDesc: 'Sign in to view your saved results, interactive charts, and longitudinal comparisons.',
      unauthBtn: 'Sign In or Register',
      closeReport: 'Close Report',
      avatarModalTitle: 'Select Profile Avatar',
      uploadOwn: 'Upload Custom Photo (up to 2 MB)',
      cancelBtn: 'Cancel',
      applyAvatarBtn: 'Save Avatar',
    },
  }[lang]

  const filteredResults = useMemo(() => {
    return results.filter(
      (r) =>
        (r.test_title || '').toLowerCase().includes(searchFilter.toLowerCase()) ||
        (r.test_slug || '').toLowerCase().includes(searchFilter.toLowerCase())
    )
  }, [results, searchFilter])

  const uniqueSlugsInResults = useMemo(() => {
    const map = new Map<string, string>()
    results.forEach((r) => {
      if (!map.has(r.test_slug)) {
        map.set(r.test_slug, r.test_title || r.test_slug)
      }
    })
    return Array.from(map.entries())
  }, [results])

  const categoryCounts = useMemo(() => {
    const counts = { memory: 0, vision: 0, hearing: 0, reaction: 0 }
    results.forEach((r) => {
      const cat = SLUG_CATEGORY_GROUP[r.test_slug] || 'memory'
      counts[cat] += 1
    })
    return counts
  }, [results])

  const handleAttachEmail = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!attachEmailInput.trim()) return
    setAttachingEmail(true)
    try {
      const updated = await apiRequest<UserProfile>('/auth/attach-email', {
        method: 'POST',
        body: JSON.stringify({ email: attachEmailInput.trim() }),
      })
      onUpdateUser(updated)
      setAttachEmailInput('')
      onNotify('Email успешно привязан!', 'success')
    } catch (err: unknown) {
      onNotify(err instanceof Error ? err.message : 'Не удалось привязать email', 'error')
    } finally {
      setAttachingEmail(false)
    }
  }

  const handleRequestPasswordReset = async () => {
    if (!user || !user.email) {
      onNotify(t.resetEmailMissing, 'warning')
      return
    }
    const targetEmail = user.email
    setResettingPassword(true)
    setResetEmailSuccess(null)
    try {
      const res = await apiRequest<{ ok: boolean; email: string; message: string }>(
        '/auth/profile/reset-password',
        { method: 'POST' }
      )
      const successMsg = `${t.resetEmailSentSuccess} (${res.email || targetEmail})`
      setResetEmailSuccess(successMsg)
      onNotify(successMsg, 'success')
    } catch {
      try {
        await apiRequest('/auth/forgot-password', {
          method: 'POST',
          body: JSON.stringify({ email: targetEmail }),
        })
        const successMsg = `${t.resetEmailSentSuccess} (${targetEmail})`
        setResetEmailSuccess(successMsg)
        onNotify(successMsg, 'success')
      } catch (fallbackErr: unknown) {
        onNotify(
          fallbackErr instanceof Error ? fallbackErr.message : 'Ошибка отправки ссылки сброса пароля',
          'error'
        )
      }
    } finally {
      setResettingPassword(false)
    }
  }

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
      onNotify('Личные данные успешно сохранены!', 'success')
    } catch (err: unknown) {
      onNotify(err instanceof Error ? err.message : 'Ошибка сохранения профиля', 'error')
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
      onNotify('Аватар успешно обновлён!', 'success')
    } catch (err: unknown) {
      onNotify(err instanceof Error ? err.message : 'Ошибка сохранения аватара', 'error')
    } finally {
      setSavingAvatar(false)
    }
  }

  const handleUploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      onNotify('Выберите файл изображения (PNG, JPG, WEBP)', 'warning')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      onNotify('Размер файла не должен превышать 2 МБ', 'warning')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setSelectedAvatar(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  if (!user || !token) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center py-16 px-4">
        <div className="max-w-md w-full bg-white dark:bg-[#0E1715] rounded-3xl p-8 border border-slate-200 dark:border-[#1E302B] shadow-xl text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-[#131C1A] text-[#17A884] dark:text-[#2EC4A7] border border-emerald-100 dark:border-[#1E302B] mx-auto mb-4 flex items-center justify-center">
            <User className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{t.unauthTitle}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">{t.unauthDesc}</p>
          <Button
            variant="emerald"
            className="w-full py-3 rounded-xl font-bold text-sm"
            onClick={onOpenAuth || (() => onNavigate('login'))}
          >
            {t.unauthBtn}
          </Button>
        </div>
      </div>
    )
  }

  const sidebarItems: Array<{ id: ProfileTab; label: string; icon: React.ReactNode }> = [
    { id: 'overview', label: t.tabOverview, icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'results', label: t.tabResults, icon: <FileText className="w-4 h-4" /> },
    { id: 'history', label: t.tabHistory, icon: <History className="w-4 h-4" /> },
    { id: 'comparisons', label: t.tabComparisons, icon: <GitCompare className="w-4 h-4" /> },
    { id: 'personal', label: t.tabPersonal, icon: <User className="w-4 h-4" /> },
    { id: 'security', label: t.tabSecurity, icon: <Lock className="w-4 h-4" /> },
    { id: 'settings', label: t.tabSettings, icon: <Sliders className="w-4 h-4" /> },
    ...(user?.role !== 'admin'
      ? [{ id: 'support' as ProfileTab, label: t.tabSupport, icon: <Headphones className="w-4 h-4" /> }]
      : []),
  ]

  const totalCount = results.length
  const uniqueTestsCount = uniqueSlugsInResults.length
  const latestDateStr =
    totalCount > 0
      ? new Date(results[0].completed_at).toLocaleDateString(
          lang === 'en' ? 'en-US' : 'ru-RU',
          { day: '2-digit', month: 'short', year: 'numeric' }
        )
      : '—'

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
      {/* TOP HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              SIHAT Personal Archive
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t.dashboardTitle}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">{t.dashboardSubtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {user.role === 'admin' && (
            <button
              type="button"
              onClick={() => onNavigate('admin')}
              className="px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
            >
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              <span>{t.adminPanelBtn}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onNavigate('catalog')}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#103D35] to-[#17A884] hover:from-[#13493f] hover:to-[#1ab891] text-white text-xs font-bold shadow-md shadow-[#17A884]/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Activity className="w-4 h-4" />
            <span>{t.startScreeningBtn}</span>
          </button>
        </div>
      </header>

      {/* MOBILE HORIZONTAL NAVIGATION BAR */}
      <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto pb-3 mb-5 no-scrollbar">
        {sidebarItems.map((item) => {
          const isActive = activeTab === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setInspectingResult(null)
                setActiveTab(item.id)
              }}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-[#103D35] text-white shadow-sm'
                  : 'bg-white dark:bg-[#0E1715] border border-slate-200 dark:border-[#1E302B] text-slate-600 dark:text-slate-300'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.id === 'support' && unreadSupportCount > 0 && (
                <span className="ml-auto px-1.5 py-0.5 rounded-full bg-[#17A884] text-black text-[10px] font-extrabold animate-pulse">
                  {unreadSupportCount}
                </span>
              )}
            </button>
          )
        })}
        <button
          type="button"
          onClick={() => {
            if (onLogout) onLogout()
            else onNavigate('home')
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 shrink-0 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>{t.tabLogout}</span>
        </button>
      </div>

      {/* MAIN DUAL-PANE LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* DESKTOP SIDEBAR */}
        <aside className="hidden lg:block lg:col-span-3 bg-white dark:bg-[#0E1715] rounded-3xl p-5 shadow-sm border border-slate-200/80 dark:border-[#1E302B] lg:sticky lg:top-24">
          <div className="flex items-center gap-3 pb-5 mb-5 border-b border-slate-100 dark:border-[#1E302B]">
            <div
              onClick={() => setAvatarModalOpen(true)}
              className="relative w-12 h-12 rounded-2xl overflow-hidden bg-slate-100 dark:bg-[#131C1A] border-2 border-slate-200 dark:border-[#1E302B] cursor-pointer group shrink-0"
              title="Сменить аватар"
            >
              <img
                src={user.avatar_url || '/images/profile-default.webp'}
                alt={user.full_name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                <Camera className="w-4 h-4" />
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {user.full_name || 'Пользователь'}
              </h2>
              <p className="text-[11px] text-slate-400 truncate">
                {user.email || user.phone || 'Локальный профиль'}
              </p>
            </div>
          </div>

          <nav className="space-y-1">
            {sidebarItems.map((item) => {
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setInspectingResult(null)
                    setActiveTab(item.id)
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#17A884]/15 text-[#103D35] dark:text-[#2EC4A7] font-bold border border-[#17A884]/30'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#131C1A] hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <span className={isActive ? 'text-[#17A884] dark:text-[#2EC4A7]' : 'text-slate-400'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              )
            })}
          </nav>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-[#1E302B]">
            <button
              type="button"
              onClick={() => {
                if (onLogout) onLogout()
                else onNavigate('home')
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>{t.tabLogout}</span>
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="lg:col-span-9 space-y-6">
          {/* Modal Dialog for Inspecting Saved Result Report */}
          {inspectingResult && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-3 sm:p-6 overflow-y-auto animate-fadeIn"
              onClick={(e) => {
                if (e.target === e.currentTarget) setInspectingResult(null)
              }}
            >
              <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white dark:bg-[#0E1715] rounded-3xl shadow-2xl border border-slate-200 dark:border-[#1E302B] overflow-hidden my-auto animate-scaleUp">
                {/* Modal Sticky Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-[#1E302B] bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-sm shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-[#17A884] flex items-center justify-center font-bold">
                      <Eye className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {inspectingResult.test_title || inspectingResult.test_slug}
                        <Badge variant="emerald" className="text-[10px]">
                          {inspectingResult.methodology_version ? `v${inspectingResult.methodology_version}` : 'v2.0'}
                        </Badge>
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {new Date(inspectingResult.completed_at).toLocaleString(lang === 'en' ? 'en-US' : 'ru-RU', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDownloadPdf(inspectingResult.id)}
                      className="text-xs gap-1.5 hidden sm:flex"
                    >
                      <Download className="w-3.5 h-3.5 text-[#17A884]" />
                      <span>{t.pdfBtn}</span>
                    </Button>
                    <button
                      type="button"
                      onClick={() => setInspectingResult(null)}
                      className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title={t.closeReport}
                      aria-label="Закрыть"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Modal Body with Scroll */}
                <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
                  <ResultReportView
                    slug={inspectingResult.test_slug}
                    title={inspectingResult.test_title || inspectingResult.test_slug}
                    lang={lang}
                    result={inspectingResult.result}
                    completedAt={inspectingResult.completed_at}
                    methodology={{
                      name: inspectingResult.test_title || inspectingResult.test_slug,
                      version: inspectingResult.methodology_version || '2.0',
                    }}
                    previousResults={results.filter(
                      (r) => r.test_slug === inspectingResult.test_slug && r.id !== inspectingResult.id
                    )}
                    canSave={false}
                    isSaved={true}
                    onDownloadPdf={() => onDownloadPdf(inspectingResult.id)}
                    onRetake={() => {
                      setInspectingResult(null)
                      onNavigate(`test/${inspectingResult.test_slug}`)
                    }}
                    compact={false}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <>
              {user.phone && !user.email && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>
                      Вы вошли по номеру телефона ({user.phone}). Привяжите email во вкладке «Личные данные» для восстановления пароля.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('personal')}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shrink-0 cursor-pointer"
                  >
                    Привязать Email →
                  </button>
                </div>
              )}

              {/* Support & Chat Quick Card (only for non-admin users) */}
              {user?.role !== 'admin' && (
                <div className="p-5 rounded-3xl bg-gradient-to-r from-[#17A884]/15 via-[#103D35]/20 to-transparent border border-[#17A884]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-[#17A884]/20 border border-[#17A884]/40 text-[#17A884] flex items-center justify-center shrink-0">
                      <Headphones className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {lang === 'tj' ? 'Хадамоти дастгирӣ ва чатҳо' : lang === 'en' ? 'Support Desk & Direct Chats' : 'Служба поддержки и чаты'}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {lang === 'tj' ? 'Муроҷиатҳои худро пайгирӣ кунед ва бо мутахассисон дар гуфтугӯ бошед.' : lang === 'en' ? 'Direct secure dialog with platform engineers. Follow up on your inquiries.' : 'Прямой диалог со специалистами. Ответы на ваши обращения и консультация.'}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="emerald"
                    size="sm"
                    onClick={() => setActiveTab('support')}
                    className="shrink-0 text-xs shadow-md shadow-[#17A884]/20"
                  >
                    {unreadSupportCount > 0
                      ? `Новые ответы (${unreadSupportCount}) →`
                      : (lang === 'tj' ? 'Кушодани чатҳо →' : lang === 'en' ? 'Open Support Chats →' : 'Открыть чаты с поддержкой →')}
                  </Button>
                </div>
              )}

              {/* 3 Real KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                <div className="bg-white dark:bg-[#0E1715] rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200/80 dark:border-[#1E302B]">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-2">
                    {t.totalScreenings}
                  </span>
                  <div className="text-3xl font-mono font-black text-slate-900 dark:text-white">
                    {totalCount}
                  </div>
                </div>

                <div className="bg-white dark:bg-[#0E1715] rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200/80 dark:border-[#1E302B]">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-2">
                    {t.uniqueTests}
                  </span>
                  <div className="text-3xl font-mono font-black text-[#17A884] dark:text-[#2EC4A7]">
                    {uniqueTestsCount} / 15
                  </div>
                </div>

                <div className="bg-white dark:bg-[#0E1715] rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200/80 dark:border-[#1E302B]">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-2">
                    {t.latestDate}
                  </span>
                  <div className="text-xl sm:text-2xl font-mono font-black text-slate-900 dark:text-white">
                    {latestDateStr}
                  </div>
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="bg-white dark:bg-[#0E1715] rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-[#1E302B]">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-4">
                  {t.categorySummary}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#131C1A] border border-slate-100 dark:border-[#1E302B] flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <Brain className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">{t.catMemory}</div>
                      <div className="text-xs font-mono text-slate-500">{categoryCounts.memory} записей</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#131C1A] border border-slate-100 dark:border-[#1E302B] flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                      <Eye className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">{t.catVision}</div>
                      <div className="text-xs font-mono text-slate-500">{categoryCounts.vision} записей</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#131C1A] border border-slate-100 dark:border-[#1E302B] flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                      <Ear className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">{t.catHearing}</div>
                      <div className="text-xs font-mono text-slate-500">{categoryCounts.hearing} записей</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#131C1A] border border-slate-100 dark:border-[#1E302B] flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <Crosshair className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">{t.catReaction}</div>
                      <div className="text-xs font-mono text-slate-500">{categoryCounts.reaction} записей</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Saved Results */}
              <div className="bg-white dark:bg-[#0E1715] rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-[#1E302B]">
                <div className="flex items-center justify-between gap-3 mb-5">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {t.recentActivity}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab('results')}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#1E302B] text-xs font-bold text-slate-600 dark:text-slate-300 hover:border-[#17A884] transition-colors cursor-pointer"
                  >
                    {t.openAllResults} ({results.length})
                  </button>
                </div>

                {results.length === 0 ? (
                  <div className="py-10 text-center">
                    <FileText className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {t.noResultsTitle}
                    </p>
                    <p className="text-xs text-slate-400 mb-4 max-w-md mx-auto">{t.noResultsDesc}</p>
                    <Button variant="emerald" size="sm" onClick={() => onNavigate('catalog')}>
                      {t.goToCatalogBtn}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {results.slice(0, 5).map((r) => {
                      const metrics = unwrapMetrics(r.result)
                      const topKeys = getTopMetricKeys(metrics, 3)
                      const topMetrics = topKeys.map((k) => [k, metrics[k]])
                      return (
                        <div
                          key={r.id}
                          className="p-4 rounded-2xl bg-slate-50 dark:bg-[#131C1A] border border-slate-200/70 dark:border-[#1E302B] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                                {r.test_title || r.test_slug}
                              </span>
                              <span className="text-[11px] text-slate-400 font-mono">
                                {new Date(r.completed_at).toLocaleString(
                                  lang === 'en' ? 'en-US' : 'ru-RU',
                                  { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
                                )}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {topMetrics.map(([k, v]) => (
                                <span
                                  key={k}
                                  className="px-2 py-0.5 rounded-lg bg-white dark:bg-[#0E1715] border border-slate-200 dark:border-[#1E302B] text-[11px]"
                                >
                                  <span className="text-slate-500">{getMetricLabel(k, lang)}: </span>
                                  <span className="font-mono font-bold text-[#17A884] dark:text-[#2EC4A7]">
                                    {formatMetricValue(k, v, lang)}
                                  </span>
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setInspectingResult(r)}
                              className="text-xs gap-1"
                            >
                              <Eye className="w-3.5 h-3.5 text-[#17A884]" />
                              <span>{t.viewReportBtn}</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onDownloadPdf(r.id)}
                              className="text-xs gap-1"
                            >
                              <Download className="w-3.5 h-3.5 text-[#17A884]" />
                              <span>{t.pdfBtn}</span>
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {/* TAB 2: MY RESULTS */}
          {activeTab === 'results' && (
            <div className="bg-white dark:bg-[#0E1715] rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 dark:border-[#1E302B] space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-[#1E302B]">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t.tabResults}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Все сохранённые результаты с графиками, сравнением и выгрузкой в PDF
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center p-1 bg-slate-100 dark:bg-[#131C1A] rounded-xl border border-slate-200/80 dark:border-[#1E302B]">
                    <button
                      type="button"
                      onClick={() => setVaultDisplayMode('cards')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        vaultDisplayMode === 'cards'
                          ? 'bg-white dark:bg-[#103D35] text-[#17A884] dark:text-[#2EC4A7]'
                          : 'text-slate-500'
                      }`}
                    >
                      Карточки
                    </button>
                    <button
                      type="button"
                      onClick={() => setVaultDisplayMode('table')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        vaultDisplayMode === 'table'
                          ? 'bg-white dark:bg-[#103D35] text-[#17A884] dark:text-[#2EC4A7]'
                          : 'text-slate-500'
                      }`}
                    >
                      Таблица
                    </button>
                  </div>

                  {results.length > 0 && (
                    <button
                      type="button"
                      onClick={onClearAll}
                      className="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t.clearAllBtn}</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#1E302B] bg-slate-50 dark:bg-[#131C1A] text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-[#17A884]"
                />
              </div>

              {filteredResults.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">{t.noResultsTitle}</div>
              ) : vaultDisplayMode === 'cards' ? (
                <div className="space-y-3">
                  {filteredResults.map((item) => {
                    const metrics = unwrapMetrics(item.result)
                    const topKeys = getTopMetricKeys(metrics, 4)
                    const entries = topKeys.map((k) => [k, metrics[k]])
                    return (
                      <div
                        key={item.id}
                        className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-[#131C1A] border border-slate-200/70 dark:border-[#1E302B] flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[#17A884]/40 transition-colors"
                      >
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                              {item.test_title || item.test_slug}
                            </span>
                            <Badge variant="outline" className="text-[10px] font-mono">
                              v{item.methodology_version || '2.0'}
                            </Badge>
                            <span className="text-xs text-slate-400 font-mono">
                              {new Date(item.completed_at).toLocaleString(
                                lang === 'en' ? 'en-US' : 'ru-RU',
                                { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
                              )}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {entries.map(([k, v]) => (
                              <span
                                key={k}
                                className="px-2.5 py-1 rounded-xl bg-white dark:bg-[#0E1715] border border-slate-200 dark:border-[#1E302B] text-xs"
                              >
                                <span className="text-slate-500">{getMetricLabel(k, lang)}: </span>
                                <span className="font-mono font-bold text-[#17A884] dark:text-[#2EC4A7]">
                                  {formatMetricValue(k, v, lang)}
                                </span>
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setInspectingResult(item)}
                            className="text-xs gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#17A884]" />
                            <span>{t.viewReportBtn}</span>
                          </Button>
                          <Button
                            variant="emerald"
                            size="sm"
                            onClick={() => onDownloadPdf(item.id)}
                            className="text-xs gap-1.5"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>{t.pdfBtn}</span>
                          </Button>
                          <button
                            type="button"
                            onClick={() => onDeleteResult(item.id)}
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
                            title={t.deleteBtn}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-[#1E302B] text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                        <th className="pb-3 pl-1">Упражнение</th>
                        <th className="pb-3">Дата</th>
                        <th className="pb-3">Ключевой показатель</th>
                        <th className="pb-3 text-right pr-1">Действия</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-[#1E302B]">
                      {filteredResults.map((item) => {
                        const metrics = unwrapMetrics(item.result)
                        const topKeys = getTopMetricKeys(metrics, 1)
                        const firstEntry = topKeys.length > 0 ? [topKeys[0], metrics[topKeys[0]]] : null
                        return (
                          <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-[#131C1A]/60">
                            <td className="py-3 pl-1 font-bold text-slate-900 dark:text-white">
                              {item.test_title || item.test_slug}
                            </td>
                            <td className="py-3 text-slate-500 font-mono">
                              {new Date(item.completed_at).toLocaleDateString(
                                lang === 'en' ? 'en-US' : 'ru-RU'
                              )}
                            </td>
                            <td className="py-3 font-mono font-bold text-[#17A884] dark:text-[#2EC4A7]">
                              {firstEntry
                                ? `${getMetricLabel(firstEntry[0], lang)}: ${formatMetricValue(firstEntry[0], firstEntry[1], lang)}`
                                : 'Завершено'}
                            </td>
                            <td className="py-3 text-right pr-1 flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setInspectingResult(item)}
                                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#1E302B] text-xs font-bold hover:border-[#17A884] cursor-pointer"
                              >
                                {t.viewReportBtn}
                              </button>
                              <button
                                type="button"
                                onClick={() => onDownloadPdf(item.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-[#17A884] cursor-pointer"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteResult(item.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: HISTORY TIMELINE */}
          {activeTab === 'history' && (
            <div className="bg-white dark:bg-[#0E1715] rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 dark:border-[#1E302B] space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-[#1E302B]">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t.tabHistory}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Хронологическая лента всех ваших прохождений с фильтром по методике
                  </p>
                </div>

                <select
                  value={historySlugFilter}
                  onChange={(e) => setHistorySlugFilter(e.target.value)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#1E302B] bg-slate-50 dark:bg-[#131C1A] text-xs font-bold text-slate-800 dark:text-slate-200 outline-none"
                >
                  <option value="all">Все методики ({results.length})</option>
                  {uniqueSlugsInResults.map(([slug, title]) => (
                    <option key={slug} value={slug}>
                      {title}
                    </option>
                  ))}
                </select>
              </div>

              {results.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">{t.noResultsTitle}</div>
              ) : (
                <div className="relative pl-6 border-l-2 border-emerald-500/30 space-y-5">
                  {results
                    .filter((r) => historySlugFilter === 'all' || r.test_slug === historySlugFilter)
                    .map((item) => {
                      const metrics = unwrapMetrics(item.result)
                      const topKeys = getTopMetricKeys(metrics, 3)
                      const entries = topKeys.map((k) => [k, metrics[k]])
                      return (
                        <div key={item.id} className="relative">
                          <span className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-[#17A884] ring-4 ring-white dark:ring-[#0E1715]" />
                          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#131C1A] border border-slate-200/70 dark:border-[#1E302B] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5 text-[#17A884]" />
                                <span className="text-xs font-mono text-slate-500">
                                  {new Date(item.completed_at).toLocaleString(
                                    lang === 'en' ? 'en-US' : 'ru-RU'
                                  )}
                                </span>
                              </div>
                              <div className="text-sm font-bold text-slate-900 dark:text-white">
                                {item.test_title || item.test_slug}
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {entries.map(([k, v]) => (
                                  <span
                                    key={k}
                                    className="px-2 py-0.5 rounded-lg bg-white dark:bg-[#0E1715] border border-slate-200 dark:border-[#1E302B] text-[11px]"
                                  >
                                    <span className="text-slate-500">{getMetricLabel(k, lang)}: </span>
                                    <span className="font-mono font-bold text-[#17A884] dark:text-[#2EC4A7]">
                                      {formatMetricValue(k, v, lang)}
                                    </span>
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setInspectingResult(item)}
                                className="text-xs"
                              >
                                {t.viewReportBtn}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onNavigate(`test/${item.test_slug}`)}
                                className="text-xs gap-1"
                              >
                                <span>{t.retakeBtn}</span>
                                <ArrowRight className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: COMPARISONS */}
          {activeTab === 'comparisons' && (
            <ResultsComparisonView
              lang={lang}
              results={results}
              onNavigate={onNavigate}
              onInspectResult={(res) => setInspectingResult(res)}
            />
          )}

          {/* TAB 5: PERSONAL DATA */}
          {activeTab === 'personal' && (
            <div className="bg-white dark:bg-[#0E1715] rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 dark:border-[#1E302B] space-y-6">
              <div className="pb-4 border-b border-slate-100 dark:border-[#1E302B]">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t.personalTitle}</h3>
                <p className="text-xs text-slate-500 mt-1">{t.personalSubtitle}</p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4 max-w-2xl">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {t.fullNameLabel}
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ваше имя"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1E302B] bg-slate-50 dark:bg-[#131C1A] text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-[#17A884]"
                  />
                </div>

                {user.phone && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      {t.phoneLabel}
                    </label>
                    <input
                      type="text"
                      disabled
                      value={user.phone}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1E302B] bg-slate-100/70 dark:bg-[#131C1A]/40 text-xs sm:text-sm text-slate-500 font-mono"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {t.emailLabel}
                  </label>
                  {user.email ? (
                    <input
                      type="email"
                      disabled
                      value={user.email}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1E302B] bg-slate-100/70 dark:bg-[#131C1A]/40 text-xs sm:text-sm text-slate-500 font-mono"
                    />
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={attachEmailInput}
                        onChange={(e) => setAttachEmailInput(e.target.value)}
                        placeholder="name@example.com"
                        className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1E302B] bg-slate-50 dark:bg-[#131C1A] text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-[#17A884]"
                      />
                      <button
                        type="button"
                        disabled={attachingEmail || !attachEmailInput.trim()}
                        onClick={handleAttachEmail}
                        className="px-4 py-2 rounded-xl bg-[#103D35] text-white font-bold text-xs cursor-pointer disabled:opacity-50"
                      >
                        {attachingEmail ? '...' : 'Привязать'}
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {t.ageGroupLabel}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setAgeGroup('18_plus')}
                      className={`p-3 rounded-xl border text-xs font-semibold text-left transition-colors cursor-pointer ${
                        ageGroup === '18_plus'
                          ? 'border-[#17A884] bg-[#17A884]/10 text-[#103D35] dark:text-[#2EC4A7]'
                          : 'border-slate-200 dark:border-[#1E302B] text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {t.age18}
                    </button>
                    <button
                      type="button"
                      onClick={() => setAgeGroup('16_17')}
                      className={`p-3 rounded-xl border text-xs font-semibold text-left transition-colors cursor-pointer ${
                        ageGroup === '16_17'
                          ? 'border-[#17A884] bg-[#17A884]/10 text-[#103D35] dark:text-[#2EC4A7]'
                          : 'border-slate-200 dark:border-[#1E302B] text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {t.age1617}
                    </button>
                  </div>
                </div>

                <div className="pt-4 flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#103D35] to-[#17A884] text-white font-bold text-xs shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {savingProfile ? '...' : t.saveChangesBtn}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAvatarModalOpen(true)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#1E302B] text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
                  >
                    Сменить аватар
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 6: SECURITY */}
          {activeTab === 'security' && (
            <div className="bg-white dark:bg-[#0E1715] rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 dark:border-[#1E302B] space-y-6">
              <div className="pb-4 border-b border-slate-100 dark:border-[#1E302B]">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t.securityTitle}</h3>
                <p className="text-xs text-slate-500 mt-1">{t.securitySubtitle}</p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#131C1A] border border-slate-200/80 dark:border-[#1E302B] max-w-2xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <KeyRound className="w-4 h-4 text-[#17A884]" />
                      <span>{t.resetPasswordBtn}</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-md">
                      {t.resetPasswordDesc}
                      {user.email ? `: ${user.email}` : ''}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={resettingPassword || !user.email}
                    onClick={handleRequestPasswordReset}
                    className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2 shrink-0"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>{resettingPassword ? '...' : t.resetPasswordBtn}</span>
                  </button>
                </div>

                {resetEmailSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                    <span>{resetEmailSuccess}</span>
                  </div>
                )}

                {!user.email && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
                    <span>{t.resetEmailMissing}</span>
                  </div>
                )}
              </div>

              <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/20 max-w-2xl space-y-3">
                <div className="text-xs font-bold text-rose-700 dark:text-rose-400">{t.gdprTitle}</div>
                <p className="text-xs text-slate-600 dark:text-slate-300">{t.gdprNotice}</p>
                {results.length > 0 && (
                  <button
                    type="button"
                    onClick={onClearAll}
                    className="px-4 py-2 rounded-xl border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-500/10 cursor-pointer"
                  >
                    {t.clearAllBtn} ({results.length})
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 8: SUPPORT & CHATS */}
          {activeTab === 'support' && user?.role !== 'admin' && (
            <SupportChatsView
              user={user}
              lang={lang}
              initialTicketId={selectedSupportTicketId}
              onNavigate={onNavigate}
              onNotify={onNotify}
            />
          )}

          {/* TAB 7: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="bg-white dark:bg-[#0E1715] rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 dark:border-[#1E302B] space-y-6">
              <div className="pb-4 border-b border-slate-100 dark:border-[#1E302B]">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t.settingsTitle}</h3>
                <p className="text-xs text-slate-500 mt-1">{t.settingsSubtitle}</p>
              </div>

              <div className="space-y-4 max-w-2xl">
                {/* 1. Auto-save Results */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#131C1A] border border-slate-200/80 dark:border-[#1E302B] flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white mb-0.5">
                      {t.autoSaveTitle}
                    </div>
                    <p className="text-[11px] text-slate-500">{t.autoSaveDesc}</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={autoSaveResults}
                    aria-label={t.autoSaveTitle}
                    onClick={handleToggleAutoSave}
                    className={`w-10 h-6 flex items-center rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                      autoSaveResults ? 'bg-[#17A884]' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <div
                      className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${
                        autoSaveResults ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* 2. PDF Methodology Passport */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#131C1A] border border-slate-200/80 dark:border-[#1E302B] flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white mb-0.5">
                      {t.pdfMethodTitle}
                    </div>
                    <p className="text-[11px] text-slate-500">{t.pdfMethodDesc}</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={pdfIncludeMethodology}
                    aria-label={t.pdfMethodTitle}
                    onClick={handleTogglePdfMethodology}
                    className={`w-10 h-6 flex items-center rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                      pdfIncludeMethodology ? 'bg-[#17A884]' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <div
                      className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${
                        pdfIncludeMethodology ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* 3. Audio & Sound FX with Test Button */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#131C1A] border border-slate-200/80 dark:border-[#1E302B] flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white mb-0.5 flex items-center gap-2">
                      <span>{t.soundTitle}</span>
                      <button
                        type="button"
                        onClick={handleTestSound}
                        className="px-2 py-0.5 text-[10px] font-bold rounded-md border border-slate-300 dark:border-[#1E302B] hover:border-[#17A884] text-slate-700 dark:text-slate-300 hover:text-[#17A884] transition-colors cursor-pointer flex items-center gap-1"
                        title={t.testSoundBtn}
                      >
                        <Volume2 className="w-3 h-3 text-[#17A884]" />
                        <span>{t.testSoundBtn}</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500">{t.soundDesc}</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={soundEnabled}
                    aria-label={t.soundTitle}
                    onClick={handleToggleSound}
                    className={`w-10 h-6 flex items-center rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                      soundEnabled ? 'bg-[#17A884]' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <div
                      className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${
                        soundEnabled ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* AVATAR MODAL */}
      <Modal
        isOpen={avatarModalOpen}
        onClose={() => setAvatarModalOpen(false)}
        title={t.avatarModalTitle}
      >
        <div className="space-y-6">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
            {PRESET_PORTRAITS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedAvatar(p.id)}
                className={`p-1 rounded-2xl border-2 transition-all cursor-pointer ${
                  selectedAvatar === p.id
                    ? 'border-[#17A884] ring-2 ring-[#17A884]/30'
                    : 'border-transparent hover:border-slate-200 dark:hover:border-slate-700'
                }`}
              >
                <img src={p.id} alt={p.label} className="w-full h-14 object-cover rounded-xl" />
                <span className="block text-[10px] text-slate-500 mt-1 truncate">{p.label}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {PRESET_AVATARS.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setSelectedAvatar(a.id)}
                className={`p-2 rounded-xl border-2 text-xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                  selectedAvatar === a.id
                    ? 'border-[#17A884] bg-[#17A884]/10'
                    : 'border-slate-100 dark:border-[#1E302B]'
                }`}
              >
                <span>{a.emoji}</span>
                <span className="text-[9px] text-slate-400 mt-1 truncate max-w-full">{a.label}</span>
              </button>
            ))}
          </div>

          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleUploadImage}
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-[#1E302B] text-xs font-bold text-slate-600 dark:text-slate-400 hover:border-[#17A884] hover:text-[#17A884] transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>{t.uploadOwn}</span>
            </button>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-[#1E302B]">
            <Button variant="outline" size="sm" onClick={() => setAvatarModalOpen(false)}>
              {t.cancelBtn}
            </Button>
            <Button
              variant="emerald"
              size="sm"
              disabled={savingAvatar}
              onClick={handleSaveAvatar}
            >
              {savingAvatar ? '...' : t.applyAvatarBtn}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
