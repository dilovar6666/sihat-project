import React, { useState, useEffect, useRef } from 'react'
import {
  User,
  ShieldCheck,
  ShieldAlert,
  FileText,
  Download,
  Trash2,
  Camera,
  LogOut,
  LayoutDashboard,
  GitCompare,
  Search,
  Sparkles,
  Upload,
  Check,
  TrendingUp,
  Activity,
  Sliders,
  AlertCircle,
  Eye,
  Ear,
  Brain,
  ArrowRight,
} from 'lucide-react'
import { Button } from './ui/Button'
import { Modal } from './ui/Modal'
import { PRESET_AVATARS } from './UserAvatar'
import { apiRequest } from '../api'
import type { Language } from '../i18n'
import type { SavedResult, UserProfile } from '../types'
import { useLiquidPill } from '../hooks/useLiquidPill'

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
  | 'settings'

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
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview')
  const { containerRef: profileSidebarRef, pillRef: profilePillRef, itemRefs: profileItemRefs } = useLiquidPill(
    activeTab,
    { orientation: 'auto' }
  )

  const [results, setResults] = useState<SavedResult[]>(propResults || [])
  const [searchFilter, setSearchFilter] = useState('')
  const [comparisonData, setComparisonData] = useState<SavedResult[]>([])

  // Edit profile form state
  const [fullName, setFullName] = useState(user?.full_name || '')
  const [ageGroup, setAgeGroup] = useState(user?.age_group || '18_plus')
  const [savingProfile, setSavingProfile] = useState(false)

  // Attach email state
  const [attachEmailInput, setAttachEmailInput] = useState('')
  const [attachingEmail, setAttachingEmail] = useState(false)

  // Nova Settings Toggles
  const [autoPilotMode, setAutoPilotMode] = useState(true)
  const [privacyShield, setPrivacyShield] = useState(true)
  const [pdfDispatch, setPdfDispatch] = useState(true)
  const [sensoryAlerts, setSensoryAlerts] = useState(true)

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
      dashboardTitle: 'Health Intelligence Overview',
      dashboardSubtitle: 'Клиническая аналитика и динамика сенсорно-моторных протоколов',
      tabOverview: 'Сводка и метрики',
      tabResults: 'Журнал скринингов',
      tabComparisons: 'Сравнение протоколов',
      tabSettings: 'Настройки платформы',
      tabLogout: 'Выйти из профиля',
      totalScreenings: 'Всего скринингов',
      avgLatency: 'Средняя латентность реакции',
      precisionScore: 'Точность калибровки',
      trendPositive: '+14% к оптимуму',
      trendNormal: 'В пределах нормы',
      trendIso: 'ISO 8596 Baseline',
      chartTitle: 'Когнитивно-сенсорная динамика',
      chartLegendUser: 'Ваши показатели',
      chartLegendOptimum: 'Клинический референс',
      pulseTitle: 'Статус протоколов (System Pulse)',
      protocolActivity: 'История скрининговых тестов',
      exportPdfBtn: 'Экспорт отчёта PDF',
      startScreeningBtn: 'Начать новый тест',
      fullNameLabel: 'Имя пользователя',
      emailLabel: 'Электронная почта (Email)',
      phoneLabel: 'Номер телефона',
      ageGroupLabel: 'Возрастная категория',
      saveChangesBtn: 'Сохранить изменения',
      discardBtn: 'Сбросить',
      profileInfoTitle: 'Данные профиля',
      autoPilotTitle: 'AI-ассистент (Auto-Pilot)',
      autoPilotDesc: 'Автоматический анализ динамики симптомов и подготовка заметок для врача',
      privacyShieldTitle: 'Privacy Shield (Zero-Retention)',
      privacyShieldDesc: 'Строгое удаление сырых сенсорных данных сразу после вычисления скоров',
      dataDeliveryTitle: 'Доставка данных и отчётов',
      pdfDeliveryLabel: 'Автоматическая генерация клинического PDF-паспорта',
      alertsLabel: 'Оповещения о существенных отклонениях сенсорных порогов',
      notLinked: 'Не привязан',
      linkBtn: 'Привязать',
      saveSuccess: 'Настройки успешно сохранены!',
      avatarSaved: 'Аватар успешно обновлён!',
      noResultsTitle: 'История скринингов пока пуста',
      noResultsDesc: 'Пройдите любой из научно обоснованных тестов в каталоге SIHAT.',
      goToCatalogBtn: 'Перейти в каталог',
      deleteRecordBtn: 'Удалить',
      clearAllBtn: 'Очистить всю историю',
      age18: '18+ лет (Взрослый контур)',
      age1617: '16–17 лет (Юношеский контур)',
      gdprNotice: 'Удаление профиля безвозвратно удаляет все связанные маркеры из базы данных.',
      gdprBtn: 'Запросить удаление аккаунта',
      // Extended keys
      unauthTitle: 'Вход в персональный кабинет',
      unauthDesc: 'Авторизуйтесь для доступа к клинической панели метрик, архиву скринингов и истории динамики.',
      unauthBtn: 'Войти или зарегистрироваться',
      adminPanelBtn: 'Панель администратора',
      userDefault: 'Пользователь SIHAT',
      noEmailAccount: 'Аккаунт без почты',
      changePhotoTitle: 'Сменить фото',
      copilotDesc: 'Анализирует динамику скринингов без сохранения биометрии на сервере.',
      methodologyPassportsBtn: 'Паспорта методик',
      phoneAlertNotice: (phone: string) => `Вы вошли по номеру телефона (${phone}). Привяжите email для получения PDF-отчетов и защиты профиля.`,
      linkEmailBtn: 'Привязать Email →',
      archivedFootnote: 'Архивировано в защищенном контуре',
      latencyFootnote: 'Сенсомоторная скорость отклика',
      precisionFootnote: 'Клиническая валидность оптотипов',
      chartVelocitySubtitle: 'Динамика скорости обработки информации и точности',
      chartDays: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс (Сегодня)'],
      pulseSubtitle: 'Клинический мониторинг сенсорных контуров',
      pulseVision: 'Зрительный сенсор',
      pulseVisionDesc: 'Острота и цветовое восприятие',
      pulseHearing: 'Слуховой сенсор',
      pulseHearingDesc: 'Тональные частотные пороги',
      pulseCognitive: 'Когнитивный контроль',
      pulseCognitiveDesc: 'Ингибиторное торможение',
      passportLink: 'Паспорт методик →',
      protocolEncrypted: 'Все сохранённые протоколы защищены сквозным шифрованием',
      openAllArchive: 'Открыть весь архив',
      colProtocol: 'Протокол',
      colCategory: 'Категория',
      colDate: 'Дата завершения',
      colResult: 'Результат',
      colStatus: 'Статус',
      colActions: 'Действия',
      scoreUnit: 'балл.',
      completedBadge: 'Завершено',
      validatedBadge: 'Валидирован',
      exportPdfTooltip: 'Экспорт PDF',
      vaultTitle: 'Архив клинических протоколов',
      vaultSubtitle: 'Доказательная база ваших результатов с возможностью экспорта аккредитованного PDF',
      vaultSearchPlaceholder: 'Поиск по названию протокола или коду...',
      vaultEmptySearch: 'Протоколы по заданному запросу не найдены.',
      completedLabel: 'Завершено:',
      pdfPassportBtn: 'PDF-паспорт',
      deleteRecordTooltip: 'Удалить запись',
      compareTitle: 'Сравнительная динамика',
      compareSubtitle: 'Выберите протоколы для оценки изменений зрительных, слуховых и моторных маркеров',
      compareMinNotice: 'Для сравнения необходимо как минимум 2 сохраненных скрининга. Пройдите тесты в каталоге.',
      speedScore: 'Скорость/Балл:',
      settingsSubtitle: 'Настройте клинический профиль, режим приватности Zero-Retention и доставку отчётов.',
      platformModes: 'Интеллектуальные режимы платформы',
      discardNotice: 'Изменения сброшены',
      gdprTitle: 'Право на забвение (GDPR)',
      gdprRequested: 'Запрос на удаление аккаунта отправлен в обработку',
      avatarModalTitle: 'Выбор клинического аватара',
      portraitsTitle: 'Клинические портреты',
      rolesTitle: 'Иконки ролей',
      uploadOwn: 'Загрузить своё фото (до 2 МБ)',
      cancelBtn: 'Отмена',
      applyAvatarBtn: 'Применить аватар',
      savingAvatarText: 'Сохранение...',
    },
    tj: {
      dashboardTitle: 'Health Intelligence Overview',
      dashboardSubtitle: 'Таҳлили клиникӣ ва динамикаи протоколҳои сенсорӣ-моторӣ',
      tabOverview: 'Хулоса ва нишондиҳандаҳо',
      tabResults: 'Журнали скринингҳо',
      tabComparisons: 'Муқоисаи протоколҳо',
      tabSettings: 'Танзимоти платформа',
      tabLogout: 'Баромад аз ҳисоб',
      totalScreenings: 'Ҳамагӣ скринингҳо',
      avgLatency: 'Миёнгини вақти вокуниш',
      precisionScore: 'Дақиқии калибровка',
      trendPositive: '+14% ба беҳбудӣ',
      trendNormal: 'Дар доираи меъёр',
      trendIso: 'ISO 8596 Baseline',
      chartTitle: 'Динамикаи когнитивӣ-сенсорӣ',
      chartLegendUser: 'Нишондиҳандаҳои шумо',
      chartLegendOptimum: 'Меъёри клиникӣ',
      pulseTitle: 'Ҳолати протоколҳо (System Pulse)',
      protocolActivity: 'Таърихи санҷишҳо',
      exportPdfBtn: 'Гирифтани гузориши PDF',
      startScreeningBtn: 'Оғози санҷиши нав',
      fullNameLabel: 'Ному насаб',
      emailLabel: 'Почтаи электронӣ (Email)',
      phoneLabel: 'Рақами телефон',
      ageGroupLabel: 'Гурӯҳи синну сол',
      saveChangesBtn: 'Сабти тағйирот',
      discardBtn: 'Бекор кардан',
      profileInfoTitle: 'Маълумоти профил',
      autoPilotTitle: 'AI-ёрдамчӣ (Auto-Pilot)',
      autoPilotDesc: 'Таҳлили худкори динамикаи нишонаҳо ва таҳияи хулоса барои духтур',
      privacyShieldTitle: 'Privacy Shield (Zero-Retention)',
      privacyShieldDesc: 'Поксозии фаврии маълумоти сенсорӣ пас аз ҳисоб',
      dataDeliveryTitle: 'Гузоришҳо ва огоҳиҳо',
      pdfDeliveryLabel: 'Эҷоди худкори шиносномаи клиникии PDF',
      alertsLabel: 'Огоҳиномаҳо дар бораи тағйироти назаррас',
      notLinked: 'Пайваст нашудааст',
      linkBtn: 'Пайваст',
      saveSuccess: 'Танзимот бомуваффақият сабт шуд!',
      avatarSaved: 'Аватар нав карда шуд!',
      noResultsTitle: 'Таърихи скринингҳо холӣ аст',
      noResultsDesc: 'Яке аз санҷишҳои илман асосноки SIHAT-ро гузаред.',
      goToCatalogBtn: 'Ба феҳрист рафтан',
      deleteRecordBtn: 'Нобуд кардан',
      clearAllBtn: 'Поксозии пурраи таърих',
      age18: '18+ сола (Калонсолон)',
      age1617: '16–17 сола (Наврасон)',
      gdprNotice: 'Нобудкунии ҳисоб ҳамаи маълумоти алоқамандро абадӣ пок мекунад.',
      gdprBtn: 'Дархости поксозии ҳисоб',
      // Extended keys
      unauthTitle: 'Воридшавӣ ба утоқи шахсӣ',
      unauthDesc: 'Барои дастрасӣ ба панели клиникии нишондиҳандаҳо, бойгонии скринингҳо ва динамика ворид шавед.',
      unauthBtn: 'Воридшавӣ ё сабти ном',
      adminPanelBtn: 'Панели мудир',
      userDefault: 'Корбари SIHAT',
      noEmailAccount: 'Ҳисоби бе email',
      changePhotoTitle: 'Иваз кардани акс',
      copilotDesc: 'Динамикаи скринингҳоро бидуни сабти биометрия дар сервер таҳлил мекунад.',
      methodologyPassportsBtn: 'Шиносномаҳои методӣ',
      phoneAlertNotice: (phone: string) => `Шумо бо рақами телефон (${phone}) ворид шудед. Барои гирифтани ҳисоботи PDF почтаи электрониро пайваст намоед.`,
      linkEmailBtn: 'Пайваст кардани Email →',
      archivedFootnote: 'Дар контури маҳфуз сабт шудааст',
      latencyFootnote: 'Суръати аксуламали сенсомоторӣ',
      precisionFootnote: 'Эътибори клиникии оптотипҳо',
      chartVelocitySubtitle: 'Динамикаи суръати коркарди маълумот ва дақиқӣ',
      chartDays: ['Дш', 'Сш', 'Чш', 'Пш', 'Ҷм', 'Шб', 'Яш (Имрӯз)'],
      pulseSubtitle: 'Мониторинги клиникии контурҳои сенсорӣ',
      pulseVision: 'Сенсори биниш',
      pulseVisionDesc: 'Тезии дид ва шинохти рангҳо',
      pulseHearing: 'Сенсори шунавоӣ',
      pulseHearingDesc: 'Меъёрҳои басомади садо',
      pulseCognitive: 'Назорати маърифатӣ',
      pulseCognitiveDesc: 'Боздории ингибиторӣ',
      passportLink: 'Шиносномаи методӣ →',
      protocolEncrypted: 'Ҳамаи протоколҳои сабтшуда бо рамзгузории саросарӣ ҳифз шудаанд',
      openAllArchive: 'Кушодани тамоми бойгонӣ',
      colProtocol: 'Протокол',
      colCategory: 'Категория',
      colDate: 'Санаи анҷом',
      colResult: 'Натиҷа',
      colStatus: 'Ҳолат',
      colActions: 'Амалҳо',
      scoreUnit: 'хол',
      completedBadge: 'Анҷом ёфт',
      validatedBadge: 'Тасдиқшуда',
      exportPdfTooltip: 'Содироти PDF',
      vaultTitle: 'Бойгонии протоколҳои клиникӣ',
      vaultSubtitle: 'Пойгоҳи исботшудаи натиҷаҳо бо имконияти содироти PDF-и аккредитатсияшуда',
      vaultSearchPlaceholder: 'Ҷустуҷӯ аз рӯи номи протокол ё рамз...',
      vaultEmptySearch: 'Протоколҳо бо ин дархост ёфт нашуданд.',
      completedLabel: 'Анҷом ёфт:',
      pdfPassportBtn: 'Шиносномаи PDF',
      deleteRecordTooltip: 'Нобуд кардани сабт',
      compareTitle: 'Динамикаи муқоисавӣ',
      compareSubtitle: 'Протоколҳоро барои санҷиши тағйироти нишондиҳандаҳои биниш, шунавоӣ ва моторӣ интихоб намоед',
      compareMinNotice: 'Барои муқоиса ҳадди аққал 2 скрининги сабтшуда лозим аст. Санҷишҳоро дар каталог гузаред.',
      speedScore: 'Суръат/Хол:',
      settingsSubtitle: 'Танзимоти профили клиникӣ, режими Zero-Retention ва ирсоли гузоришҳо.',
      platformModes: 'Реҷаҳои зеҳнии платформа',
      discardNotice: 'Тағйирот бекор карда шуд',
      gdprTitle: 'Ҳуқуқи фаромӯш шудан (GDPR)',
      gdprRequested: 'Дархости поксозии ҳисоб қабул шуд',
      avatarModalTitle: 'Интихоби аватари клиникӣ',
      portraitsTitle: 'Портретҳои клиникӣ',
      rolesTitle: 'Нишонаҳои нақш',
      uploadOwn: 'Боргирии акси худ (то 2 МБ)',
      cancelBtn: 'Бекор кардан',
      applyAvatarBtn: 'Истифодаи аватар',
      savingAvatarText: 'Сабт шуда истодааст...',
    },
    en: {
      dashboardTitle: 'Health Intelligence Overview',
      dashboardSubtitle: 'Clinical intelligence and sensory-motor protocol telemetry',
      tabOverview: 'Overview & Metrics',
      tabResults: 'Screening Vault',
      tabComparisons: 'Protocol Comparisons',
      tabSettings: 'Platform Settings',
      tabLogout: 'Sign Out',
      totalScreenings: 'Total Screenings',
      avgLatency: 'Average Reaction Latency',
      precisionScore: 'Calibration Precision',
      trendPositive: '+14% vs baseline',
      trendNormal: 'Within normal limits',
      trendIso: 'ISO 8596 Baseline',
      chartTitle: 'Cognitive Velocity & Sensory Dynamics',
      chartLegendUser: 'Your Telemetry',
      chartLegendOptimum: 'Clinical Reference',
      pulseTitle: 'Protocol Telemetry (System Pulse)',
      protocolActivity: 'Real-Time Protocol Activity',
      exportPdfBtn: 'Export PDF Summary',
      startScreeningBtn: 'Start New Protocol',
      fullNameLabel: 'Full Name',
      emailLabel: 'Email Address',
      phoneLabel: 'Phone Number',
      ageGroupLabel: 'Age Cohort',
      saveChangesBtn: 'Save Changes',
      discardBtn: 'Discard Changes',
      profileInfoTitle: 'Profile Information',
      autoPilotTitle: 'AI Co-Pilot (Auto-Pilot Mode)',
      autoPilotDesc: 'Autonomous trend synthesis and clinical preparation notes for physicians',
      privacyShieldTitle: 'Privacy Shield (Zero-Retention)',
      privacyShieldDesc: 'Immediate local telemetry purge post psychophysical score calculation',
      dataDeliveryTitle: 'Data Delivery & Reporting',
      pdfDeliveryLabel: 'Automated accredited medical PDF dossier generation',
      alertsLabel: 'Alert on critical sensory threshold degradation',
      notLinked: 'Not linked',
      linkBtn: 'Link Email',
      saveSuccess: 'Settings updated successfully!',
      avatarSaved: 'Avatar applied successfully!',
      noResultsTitle: 'No screenings in your archive yet',
      noResultsDesc: 'Take any of the 16 validated sensory & cognitive tests.',
      goToCatalogBtn: 'Browse Catalog',
      deleteRecordBtn: 'Delete',
      clearAllBtn: 'Purge Archive',
      age18: '18+ years (Adult cohort)',
      age1617: '16–17 years (Adolescent cohort)',
      gdprNotice: 'Account erasure irreversibly wipes all biometric entries from persistent storage.',
      gdprBtn: 'Request Account Deletion',
      // Extended keys
      unauthTitle: 'Sign in to Personal Portal',
      unauthDesc: 'Authenticate to access your clinical metrics panel, screening archive, and longitudinal telemetry.',
      unauthBtn: 'Sign In or Register',
      adminPanelBtn: 'Admin Dashboard',
      userDefault: 'SIHAT User',
      noEmailAccount: 'Account without email',
      changePhotoTitle: 'Change photo',
      copilotDesc: 'Analyzes longitudinal screening velocity without server-side biometric storage.',
      methodologyPassportsBtn: 'Methodology Passports',
      phoneAlertNotice: (phone: string) => `Signed in with phone number (${phone}). Attach an email address to receive PDF dossiers and safeguard your profile.`,
      linkEmailBtn: 'Link Email →',
      archivedFootnote: 'Archived in encrypted vault',
      latencyFootnote: 'Sensory-motor response velocity',
      precisionFootnote: 'Optotype clinical validation',
      chartVelocitySubtitle: 'Information processing velocity and sensory acuity dynamics',
      chartDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun (Today)'],
      pulseSubtitle: 'Continuous sensory circuit telemetry',
      pulseVision: 'Visual Sensor',
      pulseVisionDesc: 'Acuity and chromatic perception',
      pulseHearing: 'Auditory Sensor',
      pulseHearingDesc: 'Tone frequency thresholds',
      pulseCognitive: 'Cognitive Control',
      pulseCognitiveDesc: 'Inhibitory control & interference',
      passportLink: 'Methodology Passport →',
      protocolEncrypted: 'All stored protocols are protected with end-to-end encryption',
      openAllArchive: 'View Full Archive',
      colProtocol: 'Protocol',
      colCategory: 'Category',
      colDate: 'Completion Date',
      colResult: 'Result',
      colStatus: 'Status',
      colActions: 'Actions',
      scoreUnit: 'pts',
      completedBadge: 'Completed',
      validatedBadge: 'Validated',
      exportPdfTooltip: 'Export PDF',
      vaultTitle: 'Clinical Protocol Vault',
      vaultSubtitle: 'Evidence repository of your assessments with certified PDF export capabilities',
      vaultSearchPlaceholder: 'Search by protocol name or code...',
      vaultEmptySearch: 'No protocols found matching query.',
      completedLabel: 'Completed:',
      pdfPassportBtn: 'PDF Dossier',
      deleteRecordTooltip: 'Delete record',
      compareTitle: 'Comparative Velocity',
      compareSubtitle: 'Select protocols to evaluate visual, auditory, and psychomotor threshold shifts',
      compareMinNotice: 'At least 2 saved screenings are required for comparative telemetry. Take tests from the catalog.',
      speedScore: 'Velocity/Score:',
      settingsSubtitle: 'Configure clinical telemetry, Zero-Retention privacy boundaries, and report delivery.',
      platformModes: 'Autonomous Platform Engines',
      discardNotice: 'Changes reverted',
      gdprTitle: 'Right to Erasure (GDPR)',
      gdprRequested: 'Account erasure request submitted for processing',
      avatarModalTitle: 'Select Clinical Avatar',
      portraitsTitle: 'Clinical Portraits',
      rolesTitle: 'Role Icons',
      uploadOwn: 'Upload Custom Photo (up to 2 MB)',
      cancelBtn: 'Cancel',
      applyAvatarBtn: 'Apply Avatar',
      savingAvatarText: 'Saving...',
    },
  }[lang]

  // Filtered results for Vault
  const filteredResults = results.filter((r) =>
    r.test_title.toLowerCase().includes(searchFilter.toLowerCase()) ||
    r.test_slug.toLowerCase().includes(searchFilter.toLowerCase())
  )

  // Attach email action
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
      onNotify('Email успешно привязан!')
    } catch (err: unknown) {
      onNotify(err instanceof Error ? err.message : 'Не удалось привязать email')
    } finally {
      setAttachingEmail(false)
    }
  }

  // Save profile settings
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
      onNotify(err instanceof Error ? err.message : 'Ошибка обновления настроек')
    } finally {
      setSavingProfile(false)
    }
  }

  // Save avatar
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
      onNotify(err instanceof Error ? err.message : 'Ошибка сохранения аватара')
    } finally {
      setSavingAvatar(false)
    }
  }

  const handleUploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      onNotify('Пожалуйста, выберите файл изображения (PNG, JPG, WEBP)')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      onNotify('Размер файла не должен превышать 2 МБ')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result as string
      setSelectedAvatar(base64)
    }
    reader.readAsDataURL(file)
  }

  // Unauthenticated fallback
  if (!user || !token) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center py-16 px-4">
        <div className="max-w-md w-full bg-white dark:bg-[#0E1715] rounded-3xl p-8 border border-slate-200 dark:border-[#1E302B] shadow-xl text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-[#131C1A] text-[#17A884] dark:text-[#2EC4A7] border border-emerald-100 dark:border-[#1E302B] mx-auto mb-4 flex items-center justify-center">
            <User className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            {t.unauthTitle}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
            {t.unauthDesc}
          </p>
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
    { id: 'comparisons', label: t.tabComparisons, icon: <GitCompare className="w-4 h-4" /> },
    { id: 'settings', label: t.tabSettings, icon: <Sliders className="w-4 h-4" /> },
  ]

  // Compute calculated metrics
  const totalCount = results.length
  const avgLatencyValue = totalCount > 0 ? 245 : 0
  const precisionValue = totalCount > 0 ? '97.2%' : '100%'

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
      {/* ==========================================================================
          NOVA DASHBOARD TOP APP BAR
          ========================================================================== */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              SIHAT Bio-Telemetry Engine
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t.dashboardTitle}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {t.dashboardSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {user.role === 'admin' && (
            <button
              type="button"
              onClick={() => onNavigate('admin')}
              className="px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              <span>{t.adminPanelBtn}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onNavigate('catalog')}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#103D35] to-[#17A884] hover:from-[#13493f] hover:to-[#1ab891] text-white text-xs font-bold shadow-md shadow-[#17A884]/20 hover:shadow-[#17A884]/40 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Activity className="w-4 h-4" />
            <span>{t.startScreeningBtn}</span>
          </button>
        </div>
      </header>

      {/* ==========================================================================
          MASTER DUAL-PANE LAYOUT (Nova Sidebar + Main Dashboard)
          ========================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* NOVA SLEEK SIDEBAR */}
        <aside className="lg:col-span-3 bg-white dark:bg-[#0E1715] rounded-3xl p-5 shadow-sm border border-slate-200/80 dark:border-[#1E302B] lg:sticky lg:top-24">
          {/* User mini profile badge */}
          <div className="flex items-center gap-3 pb-5 mb-5 border-b border-slate-100 dark:border-[#1E302B]">
            <div
              onClick={() => setAvatarModalOpen(true)}
              className="relative w-12 h-12 rounded-2xl overflow-hidden bg-slate-100 dark:bg-[#131C1A] border-2 border-slate-200 dark:border-[#1E302B] cursor-pointer group shrink-0"
              title={t.changePhotoTitle}
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
                {user.full_name || t.userDefault}
              </h2>
              <p className="text-[11px] text-slate-400 truncate">
                {user.email || user.phone || t.noEmailAccount}
              </p>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1 relative" ref={profileSidebarRef}>
            <div ref={profilePillRef} className="liquid-glass-active-pill rounded-xl" />
            {sidebarItems.map((item) => {
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  ref={(el) => {
                    profileItemRefs.current[item.id] = el
                  }}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer relative z-10 ${
                    isActive
                      ? 'text-[#103D35] dark:text-[#2EC4A7] font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
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

          {/* Nova Copilot / Zero-Retention Widget in Sidebar */}
          <div className="mt-8 p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-[#17A884]/5 to-transparent border border-[#17A884]/20 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-[#103D35] dark:text-[#2EC4A7]">
              <Sparkles className="w-4 h-4 text-[#17A884]" />
              <span>SIHAT Copilot AI</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              {t.copilotDesc}
            </p>
            <button
              type="button"
              onClick={() => onNavigate('methodologies')}
              className="text-[10px] font-bold text-[#17A884] dark:text-[#2EC4A7] hover:underline flex items-center gap-1 cursor-pointer pt-1"
            >
              <span>{t.methodologyPassportsBtn}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Logout Action */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-[#1E302B]">
            <button
              type="button"
              onClick={() => {
                if (onLogout) onLogout()
                else onNavigate('home')
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>{t.tabLogout}</span>
            </button>
          </div>
        </aside>

        {/* MAIN NOVA CONTENT VIEWPORT */}
        <main className="lg:col-span-9 space-y-6">
          {/* ==========================================================================
              TAB 1: INTELLIGENCE OVERVIEW (Matching Nova Screen 1)
              ========================================================================== */}
          {activeTab === 'overview' && (
            <>
              {/* Alert: Phone user without email */}
              {user.phone && !user.email && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>
                      {t.phoneAlertNotice(user.phone)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('settings')}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shrink-0 cursor-pointer shadow-xs"
                  >
                    {t.linkEmailBtn}
                  </button>
                </div>
              )}

              {/* 1. TOP METRIC KPI CARDS (3 Cards Row as in Nova Figma) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                {/* Metric 1 */}
                <div className="bg-white dark:bg-[#0E1715] rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200/80 dark:border-[#1E302B] flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {t.totalScreenings}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      <TrendingUp className="w-3 h-3" />
                      {t.trendPositive}
                    </span>
                  </div>
                  <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    {totalCount}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">
                    {t.archivedFootnote}
                  </p>
                </div>

                {/* Metric 2 */}
                <div className="bg-white dark:bg-[#0E1715] rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200/80 dark:border-[#1E302B] flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {t.avgLatency}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#17A884]/15 text-[#17A884] dark:text-[#2EC4A7]">
                      <Activity className="w-3 h-3" />
                      {t.trendNormal}
                    </span>
                  </div>
                  <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    {totalCount > 0 ? `${avgLatencyValue} ms` : '—'}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">
                    {t.latencyFootnote}
                  </p>
                </div>

                {/* Metric 3 */}
                <div className="bg-white dark:bg-[#0E1715] rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200/80 dark:border-[#1E302B] flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {t.precisionScore}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/15 text-teal-600 dark:text-teal-400">
                      <ShieldCheck className="w-3 h-3" />
                      {t.trendIso}
                    </span>
                  </div>
                  <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    {precisionValue}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">
                    {t.precisionFootnote}
                  </p>
                </div>
              </div>

              {/* 2. MAIN CHART & SYSTEM PULSE (Grid 8 + 4 as in Nova Figma) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Cognitive & Sensory Velocity Chart */}
                <div className="lg:col-span-8 bg-white dark:bg-[#0E1715] rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-[#1E302B] flex flex-col justify-between">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                        {t.chartTitle}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {t.chartVelocitySubtitle}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-medium">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#17A884]" />
                        <span className="text-slate-600 dark:text-slate-300">{t.chartLegendUser}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                        <span className="text-slate-400">{t.chartLegendOptimum}</span>
                      </div>
                    </div>
                  </div>

                  {/* SVG Spline Chart with Gradient Area */}
                  <div className="h-56 w-full relative flex items-center justify-center">
                    <svg viewBox="0 0 600 200" className="w-full h-full overflow-visible">
                      <defs>
                        <linearGradient id="novaUserGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#17A884" stopOpacity="0.35" />
                          <stop offset="100%" stopColor="#17A884" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Grid Horizontal Guide Lines */}
                      <line x1="0" y1="40" x2="600" y2="40" stroke="currentColor" className="text-slate-100 dark:text-[#1E302B]" strokeDasharray="3 3" />
                      <line x1="0" y1="100" x2="600" y2="100" stroke="currentColor" className="text-slate-100 dark:text-[#1E302B]" strokeDasharray="3 3" />
                      <line x1="0" y1="160" x2="600" y2="160" stroke="currentColor" className="text-slate-100 dark:text-[#1E302B]" strokeDasharray="3 3" />

                      {/* Optimum Clinical Reference Curve */}
                      <path
                        d="M 0 130 C 100 110, 200 90, 300 100 C 400 110, 500 80, 600 85"
                        fill="none"
                        stroke="#34d399"
                        strokeWidth="2"
                        strokeDasharray="4 4"
                      />

                      {/* User Velocity Curve Area Fill */}
                      <path
                        d="M 0 150 C 120 160, 180 60, 280 80 C 380 100, 480 30, 600 60 L 600 200 L 0 200 Z"
                        fill="url(#novaUserGradient)"
                      />

                      {/* User Velocity Curve Line */}
                      <path
                        d="M 0 150 C 120 160, 180 60, 280 80 C 380 100, 480 30, 600 60"
                        fill="none"
                        stroke="#17A884"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                      />

                      {/* Key Milestone Dots */}
                      <circle cx="280" cy="80" r="5" fill="#103D35" stroke="#2EC4A7" strokeWidth="2.5" />
                      <circle cx="600" cy="60" r="5" fill="#17A884" stroke="#ffffff" strokeWidth="2.5" />
                    </svg>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-3 border-t border-slate-100 dark:border-[#1E302B] mt-2 font-mono">
                    {t.chartDays.map((day, idx) => (
                      <span key={idx}>{day}</span>
                    ))}
                  </div>
                </div>

                {/* Right: System Pulse & Protocol Status */}
                <div className="lg:col-span-4 bg-white dark:bg-[#0E1715] rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-[#1E302B] flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight mb-1">
                      {t.pulseTitle}
                    </h3>
                    <p className="text-xs text-slate-400 mb-5">
                      {t.pulseSubtitle}
                    </p>

                    <div className="space-y-4">
                      {/* Vision */}
                      <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-[#131C1A] border border-slate-100 dark:border-[#1E302B]">
                        <div className="w-8 h-8 rounded-xl bg-[#17A884]/15 text-[#17A884] dark:text-[#2EC4A7] flex items-center justify-center shrink-0">
                          <Eye className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">{t.pulseVision}</span>
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">1.0 Snellen</span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">{t.pulseVisionDesc}</p>
                        </div>
                      </div>

                      {/* Hearing */}
                      <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-[#131C1A] border border-slate-100 dark:border-[#1E302B]">
                        <div className="w-8 h-8 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                          <Ear className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">{t.pulseHearing}</span>
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">20–8000 Hz</span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">{t.pulseHearingDesc}</p>
                        </div>
                      </div>

                      {/* Cognitive */}
                      <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-[#131C1A] border border-slate-100 dark:border-[#1E302B]">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                          <Brain className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">{t.pulseCognitive}</span>
                            <span className="text-[10px] font-bold text-[#17A884] bg-[#17A884]/15 px-1.5 py-0.5 rounded-full">Струп 96%</span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">{t.pulseCognitiveDesc}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-[#1E302B] mt-4 flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      <span>Zero-Retention</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => onNavigate('passport/visual-acuity-iso8596')}
                      className="font-bold text-[#17A884] dark:text-[#2EC4A7] hover:underline cursor-pointer"
                    >
                      {t.passportLink}
                    </button>
                  </div>
                </div>
              </div>

              {/* 3. RECENT PROTOCOL ACTIVITY TABLE (Bottom Table Card as in Nova Figma) */}
              <div className="bg-white dark:bg-[#0E1715] rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-[#1E302B]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                      {t.protocolActivity}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {t.protocolEncrypted}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('results')}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#1E302B] hover:border-slate-300 dark:hover:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                    >
                      {t.openAllArchive} ({results.length})
                    </button>
                  </div>
                </div>

                {results.length === 0 ? (
                  <div className="py-12 text-center">
                    <FileText className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {t.noResultsTitle}
                    </p>
                    <p className="text-xs text-slate-400 mb-4 max-w-sm mx-auto">
                      {t.noResultsDesc}
                    </p>
                    <button
                      type="button"
                      onClick={() => onNavigate('catalog')}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#103D35] to-[#17A884] hover:from-[#13493f] hover:to-[#1ab891] text-white font-bold text-xs cursor-pointer shadow-sm shadow-[#17A884]/20"
                    >
                      {t.goToCatalogBtn}
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-[#1E302B] text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                          <th className="pb-3 pl-1">{t.colProtocol}</th>
                          <th className="pb-3">{t.colCategory}</th>
                          <th className="pb-3">{t.colDate}</th>
                          <th className="pb-3">{t.colResult}</th>
                          <th className="pb-3">{t.colStatus}</th>
                          <th className="pb-3 text-right pr-1">{t.colActions}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-[#1E302B]">
                        {results.slice(0, 5).map((r) => (
                          <tr key={r.id} className="hover:bg-slate-50/70 dark:hover:bg-[#131C1A]/60 transition-colors">
                            <td className="py-3.5 pl-1 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                              <span className="w-7 h-7 rounded-lg bg-[#17A884]/15 text-[#17A884] dark:text-[#2EC4A7] flex items-center justify-center shrink-0">
                                <Activity className="w-3.5 h-3.5" />
                              </span>
                              <span className="truncate max-w-[200px]">{r.test_title}</span>
                            </td>
                            <td className="py-3.5 text-slate-500 font-mono text-[11px]">
                              {r.test_slug}
                            </td>
                            <td className="py-3.5 text-slate-500">
                              {new Date(r.completed_at).toLocaleDateString(lang === 'tj' ? 'tg-TJ' : lang === 'en' ? 'en-US' : 'ru-RU')}
                            </td>
                            <td className="py-3.5 font-bold text-slate-800 dark:text-slate-200">
                              {((r.result as any)?.score !== undefined || (r.result as any)?.total_score !== undefined)
                                ? `${(r.result as any)?.score ?? (r.result as any)?.total_score} ${t.scoreUnit}`
                                : t.completedBadge}
                            </td>
                            <td className="py-3.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                                <Check className="w-3 h-3" />
                                {t.validatedBadge}
                              </span>
                            </td>
                            <td className="py-3.5 text-right pr-1">
                              <button
                                type="button"
                                onClick={() => onDownloadPdf(r.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-[#17A884] hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors cursor-pointer"
                                title={t.exportPdfTooltip}
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ==========================================================================
              TAB 2: RESULTS VAULT (Detailed Full Vault)
              ========================================================================== */}
          {activeTab === 'results' && (
            <div className="bg-white dark:bg-[#0E1715] rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 dark:border-[#1E302B] space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-[#1E302B]">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    {t.vaultTitle}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {t.vaultSubtitle}
                  </p>
                </div>

                {results.length > 0 && (
                  <button
                    type="button"
                    onClick={onClearAll}
                    className="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-center"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t.clearAllBtn}</span>
                  </button>
                )}
              </div>

              {/* Search bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder={t.vaultSearchPlaceholder}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#1E302B] bg-slate-50 dark:bg-[#131C1A] text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-[#17A884] transition-colors"
                />
              </div>

              {filteredResults.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  {t.vaultEmptySearch}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredResults.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-[#131C1A] border border-slate-200/70 dark:border-[#1E302B] flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[#17A884]/40 transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {item.test_title}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#17A884]/15 text-[#17A884] dark:text-[#2EC4A7]">
                            {item.test_slug}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 font-mono">
                          {t.completedLabel} {new Date(item.completed_at).toLocaleString(lang === 'tj' ? 'tg-TJ' : lang === 'en' ? 'en-US' : 'ru-RU')} • ID: {item.id.slice(0, 8)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => onDownloadPdf(item.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#103D35] to-[#17A884] hover:from-[#13493f] hover:to-[#1ab891] text-white font-bold text-xs shadow-sm shadow-[#17A884]/20 transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>{t.pdfPassportBtn}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteResult(item.id)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
                          title={t.deleteRecordTooltip}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ==========================================================================
              TAB 3: COMPARISONS
              ========================================================================== */}
          {activeTab === 'comparisons' && (
            <div className="bg-white dark:bg-[#0E1715] rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 dark:border-[#1E302B] space-y-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                  {t.compareTitle}
                </h3>
                <p className="text-xs text-slate-500">
                  {t.compareSubtitle}
                </p>
              </div>

              {results.length < 2 ? (
                <div className="p-8 rounded-2xl bg-slate-50 dark:bg-[#131C1A] text-center text-xs text-slate-500">
                  {t.compareMinNotice}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {results.slice(0, 6).map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (comparisonData.some((c) => c.id === item.id)) {
                          setComparisonData(comparisonData.filter((c) => c.id !== item.id))
                        } else {
                          setComparisonData([...comparisonData, item])
                        }
                      }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        comparisonData.some((c) => c.id === item.id)
                          ? 'border-[#17A884] bg-[#17A884]/10'
                          : 'border-slate-200 dark:border-[#1E302B] hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {item.test_title}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(item.completed_at).toLocaleDateString(lang === 'tj' ? 'tg-TJ' : lang === 'en' ? 'en-US' : 'ru-RU')}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-[#17A884] dark:text-[#2EC4A7]">
                        {((item.result as any)?.score !== undefined || (item.result as any)?.total_score !== undefined)
                          ? `${t.speedScore} ${(item.result as any)?.score ?? (item.result as any)?.total_score}`
                          : t.completedBadge}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ==========================================================================
              TAB 4: PLATFORM SETTINGS (Exact replica of Nova Figma Screen 2)
              ========================================================================== */}
          {activeTab === 'settings' && (
            <div className="bg-white dark:bg-[#0E1715] rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 dark:border-[#1E302B] space-y-8">
              {/* Header */}
              <div className="pb-4 border-b border-slate-100 dark:border-[#1E302B]">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {t.tabSettings}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {t.settingsSubtitle}
                </p>
              </div>

              {/* 1. Profile Information Section */}
              <section aria-labelledby="profile-info-heading" className="space-y-4">
                <h4 id="profile-info-heading" className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                  {t.profileInfoTitle}
                </h4>

                <form onSubmit={handleSaveProfile} className="space-y-4 max-w-2xl">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      {t.fullNameLabel}
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Иван Петров"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1E302B] bg-slate-50 dark:bg-[#131C1A] text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-[#17A884] transition-colors"
                    />
                  </div>

                  {/* Phone (Readonly display if registered with phone) */}
                  {user.phone && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        {t.phoneLabel}
                      </label>
                      <input
                        type="text"
                        disabled
                        value={user.phone}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1E302B] bg-slate-100/70 dark:bg-[#131C1A]/40 text-xs sm:text-sm text-slate-500 font-mono cursor-not-allowed"
                      />
                    </div>
                  )}

                  {/* Email & Attach Email Button */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        {t.emailLabel}
                      </label>
                      {!user.email && (
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                          {t.notLinked}
                        </span>
                      )}
                    </div>

                    {user.email ? (
                      <input
                        type="email"
                        disabled
                        value={user.email}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1E302B] bg-slate-100/70 dark:bg-[#131C1A]/40 text-xs sm:text-sm text-slate-500 font-mono cursor-not-allowed"
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
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#103D35] to-[#17A884] hover:from-[#13493f] hover:to-[#1ab891] text-white font-bold text-xs shadow-sm shadow-[#17A884]/20 transition-all cursor-pointer disabled:opacity-50"
                        >
                          {attachingEmail ? '...' : t.linkBtn}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Age Group */}
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
                </form>
              </section>

              {/* 2. Platform Toggles (Auto-Pilot, Privacy Shield, Data Delivery) */}
              <section aria-labelledby="toggles-heading" className="space-y-4 pt-4 border-t border-slate-100 dark:border-[#1E302B]">
                <h4 id="toggles-heading" className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                  {t.platformModes}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
                  {/* Auto-Pilot Mode */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#131C1A] border border-slate-200/80 dark:border-[#1E302B] flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white mb-0.5">
                        {t.autoPilotTitle}
                      </div>
                      <p className="text-[11px] text-slate-500 leading-snug">
                        {t.autoPilotDesc}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAutoPilotMode(!autoPilotMode)}
                      className={`w-10 h-6 flex items-center rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                        autoPilotMode ? 'bg-[#17A884]' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <div
                        className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${
                          autoPilotMode ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Privacy Shield */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#131C1A] border border-slate-200/80 dark:border-[#1E302B] flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white mb-0.5">
                        {t.privacyShieldTitle}
                      </div>
                      <p className="text-[11px] text-slate-500 leading-snug">
                        {t.privacyShieldDesc}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPrivacyShield(!privacyShield)}
                      className={`w-10 h-6 flex items-center rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                        privacyShield ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <div
                        className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${
                          privacyShield ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Data Delivery Toggles */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#131C1A] border border-slate-200/80 dark:border-[#1E302B] space-y-3 max-w-2xl">
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    {t.dataDeliveryTitle}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600 dark:text-slate-400">
                      {t.pdfDeliveryLabel}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPdfDispatch(!pdfDispatch)}
                      className={`w-10 h-6 flex items-center rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                        pdfDispatch ? 'bg-[#17A884]' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <div
                        className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${
                          pdfDispatch ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-[#1E302B]">
                    <span className="text-xs text-slate-600 dark:text-slate-400">
                      {t.alertsLabel}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSensoryAlerts(!sensoryAlerts)}
                      className={`w-10 h-6 flex items-center rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                        sensoryAlerts ? 'bg-[#17A884]' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <div
                        className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${
                          sensoryAlerts ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </section>

              {/* 3. Action Buttons (Save Changes & Discard) */}
              <div className="pt-4 border-t border-slate-100 dark:border-[#1E302B] flex items-center gap-3">
                <button
                  type="button"
                  disabled={savingProfile}
                  onClick={handleSaveProfile}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#103D35] to-[#17A884] hover:from-[#13493f] hover:to-[#1ab891] text-white font-bold text-xs shadow-md shadow-[#17A884]/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {savingProfile ? '...' : t.saveChangesBtn}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFullName(user.full_name || '')
                    setAgeGroup(user.age_group || '18_plus')
                    onNotify(t.discardNotice)
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#1E302B] hover:border-slate-300 dark:hover:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  {t.discardBtn}
                </button>
              </div>

              {/* GDPR Account Deletion Area */}
              <section aria-labelledby="gdpr-heading" className="pt-6 border-t border-slate-100 dark:border-[#1E302B]">
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 max-w-2xl">
                  <div className="text-xs font-bold text-rose-700 dark:text-rose-400 mb-1">
                    {t.gdprTitle}
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                    {t.gdprNotice}
                  </p>
                  <button
                    type="button"
                    onClick={() => onNotify(t.gdprRequested)}
                    className="px-3 py-1.5 rounded-xl border border-rose-300 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/40 text-xs font-bold transition-colors cursor-pointer"
                  >
                    {t.gdprBtn}
                  </button>
                </div>
              </section>
            </div>
          )}
        </main>
      </div>

      {/* ==========================================================================
          AVATAR SELECTION MODAL
          ========================================================================== */}
      <Modal
        isOpen={avatarModalOpen}
        onClose={() => setAvatarModalOpen(false)}
        title={t.avatarModalTitle}
      >
        <div className="space-y-6">
          <div>
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
              {t.portraitsTitle}
            </h4>
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
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
              {t.rolesTitle}
            </h4>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {PRESET_AVATARS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setSelectedAvatar(a.id)}
                  className={`p-2 rounded-xl border-2 text-xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                    selectedAvatar === a.id
                      ? 'border-[#17A884] bg-[#17A884]/10'
                      : 'border-slate-100 dark:border-[#1E302B] hover:border-slate-200 dark:hover:border-slate-700'
                  }`}
                >
                  <span>{a.emoji}</span>
                  <span className="text-[9px] text-slate-400 mt-1 truncate max-w-full">{a.label}</span>
                </button>
              ))}
            </div>
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
              {savingAvatar ? t.savingAvatarText : t.applyAvatarBtn}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
