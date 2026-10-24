import React, { useState, useEffect } from 'react'
import {
  User,
  ShieldCheck,
  FileText,
  Download,
  Trash2,
  Camera,
  CheckCircle2,
  Clock,
  Lock,
  TrendingUp,
  Settings,
  LogOut,
  LayoutDashboard,
  History,
  GitCompare,
  Activity,
} from 'lucide-react'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import { Modal } from './ui/Modal'
import { UserAvatar, PRESET_AVATARS } from './UserAvatar'
import { apiRequest } from '../api'
import type { Language } from '../i18n'
import type { SavedResult, UserProfile } from '../types'

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
}

type ProfileTab =
  | 'overview'
  | 'results'
  | 'history'
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
}) => {
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview')
  const [results, setResults] = useState<SavedResult[]>(propResults || [])
  const [selectedResultForCompare, setSelectedResultForCompare] = useState<SavedResult | null>(null)
  const [comparisonData, setComparisonData] = useState<SavedResult[]>([])

  // Edit profile form
  const [fullName, setFullName] = useState(user?.full_name || '')
  const [ageGroup, setAgeGroup] = useState(user?.age_group || '18_plus')
  const [savingProfile, setSavingProfile] = useState(false)

  // Avatar modal
  const [avatarModalOpen, setAvatarModalOpen] = useState(false)
  const [selectedAvatar, setSelectedAvatar] = useState<string>(user?.avatar_url || '')
  const [savingAvatar, setSavingAvatar] = useState(false)

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
      sidebarTitle: 'Личный кабинет',
      tabOverview: 'Сводка и профиль',
      tabResults: 'Мои результаты',
      tabHistory: 'История скринингов',
      tabComparisons: 'Сравнение и динамика',
      tabPersonal: 'Личные данные',
      tabSecurity: 'Безопасность и сессии',
      tabSettings: 'Настройки аккаунта',
      tabLogout: 'Выйти из аккаунта',
      guestTitle: 'Личный закрытый кабинет SIHAT',
      guestDesc: 'Войдите в аккаунт или зарегистрируйтесь, чтобы сохранять результаты скринингов, анализировать динамику когнитивных маркеров и управлять профилем.',
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
      fullNameLabel: 'Полное имя / Никнейм',
      ageGroupLabel: 'Возрастная категория',
      age18: '18 лет и старше (Взрослый контур)',
      age1617: '16–17 лет (Юношеский контур)',
      emailLabel: 'Привязанный Email',
      roleLabel: 'Роль в системе',
      saveChangesBtn: 'Сохранить изменения профиля',
      archiveTitle: 'Персональный архив результатов',
      archiveDesc: 'Результаты хранятся строго с вашего информированного согласия. Вы можете скачать PDF или удалить запись в любой момент.',
      clearAllBtn: 'Очистить историю',
      downloadPdfBtn: 'Экспорт PDF',
      deleteBtn: 'Удалить',
      compareBtn: 'Динамика',
      noResultsTitle: 'В вашем архиве пока нет сохранённых результатов.',
      noResultsDesc: 'Пройдите любой из 16 доказательных скринингов сенсорных, когнитивных и моторных функций.',
      startFirstTestBtn: 'Выбрать тест в каталоге',
      searchPlaceholder: 'Поиск по названию скрининга...',
      recentActivity: 'Последняя активность',
      completedAt: 'Дата прохождения',
      activeSessions: 'Активные сессии',
      sessionCurrent: 'Текущий браузер (Активен)',
      twoFactor: 'Двухфакторная аутентификация (2FA)',
      twoFactorStatus: 'Email-верификация включена по умолчанию',
      deleteAccountNotice: 'Удаление аккаунта навсегда стирает все связанные биометрические данные из базы данных.',
      deleteAccountBtn: 'Запросить удаление аккаунта',
    },
    tj: {
      sidebarTitle: 'Ҳисоби шахсӣ',
      tabOverview: 'Хулоса ва профил',
      tabResults: 'Натиҷаҳои ман',
      tabHistory: 'Таърихи скринингҳо',
      tabComparisons: 'Муқоиса ва динамика',
      tabPersonal: 'Маълумоти шахсӣ',
      tabSecurity: 'Амният ва сессияҳо',
      tabSettings: 'Танзимоти ҳисоб',
      tabLogout: 'Баромад аз ҳисоб',
      guestTitle: 'Ҳисоби шахсии SIHAT',
      guestDesc: 'Барои нигоҳдории натиҷаҳо ва дидани динамикаи нишондиҳандаҳо ба ҳисоби худ ворид шавед.',
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
      fullNameLabel: 'Ному насаб',
      ageGroupLabel: 'Гурӯҳи синну сол',
      age18: '18 сола ва калонтар',
      age1617: '16–17 сола',
      emailLabel: 'Почтаи электронӣ',
      roleLabel: 'Нақш дар система',
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
    },
    en: {
      sidebarTitle: 'Personal Dashboard',
      tabOverview: 'Overview & Profile',
      tabResults: 'My Results',
      tabHistory: 'Screening History',
      tabComparisons: 'Biomarker Comparisons',
      tabPersonal: 'Personal Data',
      tabSecurity: 'Security & Sessions',
      tabSettings: 'Account Settings',
      tabLogout: 'Sign Out',
      guestTitle: 'Private SIHAT Dashboard',
      guestDesc: 'Sign in or register to preserve screening results, monitor longitudinal cognitive biomarkers, and manage your account.',
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
      fullNameLabel: 'Full Name / Alias',
      ageGroupLabel: 'Age Cohort',
      age18: '18+ years (Adult Protocol)',
      age1617: '16–17 years (Adolescent Protocol)',
      emailLabel: 'Linked Email Address',
      roleLabel: 'System Role',
      saveChangesBtn: 'Save Changes',
      archiveTitle: 'Confidential Results Vault',
      archiveDesc: 'Results are stored exclusively with your explicit consent. You can download PDF records or permanently purge any record.',
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
    },
  }[lang]

  // Filtered results
  const filteredResults = results.filter((r) =>
    r.test_title.toLowerCase().includes(searchFilter.toLowerCase())
  )

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
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
    if (!token || !selectedAvatar) return
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
    { id: 'history', label: t.tabHistory, icon: <History className="w-4 h-4" /> },
    { id: 'comparisons', label: t.tabComparisons, icon: <GitCompare className="w-4 h-4" /> },
    { id: 'personal_data', label: t.tabPersonal, icon: <User className="w-4 h-4" /> },
    { id: 'security', label: t.tabSecurity, icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'settings', label: t.tabSettings, icon: <Settings className="w-4 h-4" /> },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Permanent Desktop Sidebar */}
        <aside className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-200/80 dark:border-slate-800 lg:sticky lg:top-24">
          {/* User Profile Glance */}
          <div className="flex flex-col items-center text-center pb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="relative mb-3 group cursor-pointer" onClick={() => setAvatarModalOpen(true)}>
              <UserAvatar
                user={user}
                size="xl"
                className="ring-4 ring-[#17A884]/20 group-hover:opacity-90 transition-opacity"
              />
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-5 h-5 text-white" />
              </div>
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
              {user.full_name}
            </h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{user.email}</p>
            <div className="mt-2.5 flex items-center gap-1.5">
              <Badge variant="outline" className="border-[#17A884]/40 text-[#17A884] text-[10px]">
                {user.role === 'admin' ? t.adminProfile : t.verifiedProfile}
              </Badge>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="mt-4 space-y-1">
            {sidebarNavItems.map((item) => {
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#103D35] text-white shadow-md shadow-[#103D35]/20 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <span className={isActive ? 'text-[#2EC4A7]' : 'text-slate-400'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              )
            })}

            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  if (onLogout) onLogout()
                  else {
                    onNotify('Вы вышли из системы')
                    onNavigate('home')
                  }
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-rose-500" />
                <span>{t.tabLogout}</span>
              </button>
            </div>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="lg:col-span-9 space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stat Highlights Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-[#103D35] to-[#17A884] rounded-2xl p-5 text-white shadow-lg">
                  <div className="text-xs uppercase tracking-wider text-white/70 font-semibold mb-1">
                    {t.resultsCount}
                  </div>
                  <div className="text-3xl font-black font-mono">{results.length}</div>
                  <div className="text-[11px] text-[#DDF5EB] mt-2 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Верифицировано в архиве</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-lg border border-slate-200/80 dark:border-slate-800">
                  <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">
                    {t.privacyStatus}
                  </div>
                  <div className="text-lg font-bold text-slate-800 dark:text-slate-100">
                    Zero-Retention Enabled
                  </div>
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{t.privacyStandard}</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-lg border border-slate-200/80 dark:border-slate-800">
                  <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">
                    {t.ageGroupLabel}
                  </div>
                  <div className="text-lg font-bold text-slate-800 dark:text-slate-100">
                    {user.age_group === '18_plus' ? 'Взрослый (18+)' : 'Юношеский (16–17)'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-[#17A884]" />
                    <span>Нормативные калибровки ISO</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions & Recent Results */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#17A884]" />
                    <span>{t.recentActivity}</span>
                  </h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab('results')}
                    className="text-xs cursor-pointer"
                  >
                    Все результаты ({results.length}) →
                  </Button>
                </div>

                {results.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {t.noResultsTitle}
                    </p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                      {t.noResultsDesc}
                    </p>
                    <Button
                      onClick={() => onNavigate('catalog')}
                      className="bg-[#17A884] hover:bg-[#103D35] text-white text-xs px-4 py-2 font-bold cursor-pointer"
                    >
                      {t.startFirstTestBtn}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {results.slice(0, 4).map((res) => (
                      <div
                        key={res.id}
                        className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                            {res.test_title}
                          </h5>
                          <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{new Date(res.completed_at).toLocaleString()}</span>
                            <span>•</span>
                            <span className="font-mono text-[#17A884] font-semibold">
                              v{res.methodology_version}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => onDownloadPdf(res.id)}
                            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
                            title={t.downloadPdfBtn}
                          >
                            <Download className="w-4 h-4 text-[#17A884]" />
                          </button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedResultForCompare(res)
                              setActiveTab('comparisons')
                            }}
                            className="text-xs gap-1 cursor-pointer"
                          >
                            <GitCompare className="w-3.5 h-3.5 text-[#17A884]" />
                            <span>{t.compareBtn}</span>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: MY RESULTS / ARCHIVE */}
          {(activeTab === 'results' || activeTab === 'history') && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 dark:border-slate-800">
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
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 dark:border-slate-800">
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
                  {/* Selector for test */}
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

                  {/* Render comparison list */}
                  {selectedResultForCompare && (
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-[#17A884]/10 border border-[#17A884]/20 text-xs text-[#103D35] dark:text-[#2EC4A7] font-semibold">
                        Найдено попыток со сравнимым калибровочным профилем: {comparisonData.length}
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
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 dark:border-slate-800">
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
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 dark:border-slate-800 space-y-6">
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
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 dark:border-slate-800 space-y-6">
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

      {/* Avatar Modal */}
      <Modal
        isOpen={avatarModalOpen}
        onClose={() => setAvatarModalOpen(false)}
        title={t.avatarModalTitle}
      >
        <div className="space-y-6">
          <p className="text-xs text-slate-500 leading-relaxed">{t.avatarModalDesc}</p>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {PRESET_AVATARS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => setSelectedAvatar(preset.id)}
                className={`relative rounded-2xl p-2.5 transition-all cursor-pointer flex flex-col items-center gap-1.5 border ${
                  selectedAvatar === preset.id
                    ? 'border-[#17A884] bg-[#17A884]/15 ring-2 ring-[#17A884]'
                    : 'border-slate-200 dark:border-slate-800 hover:border-[#17A884]/40 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${preset.bg} flex items-center justify-center text-2xl shadow-xs`}
                >
                  {preset.emoji}
                </div>
                <span className="text-[10px] text-slate-600 dark:text-slate-400 font-bold truncate max-w-[80px]">
                  {preset.label}
                </span>
              </button>
            ))}
          </div>

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
              className="bg-[#17A884] hover:bg-[#103D35] text-white text-xs font-bold cursor-pointer"
            >
              {savingAvatar ? '...' : t.saveAvatarBtn}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
