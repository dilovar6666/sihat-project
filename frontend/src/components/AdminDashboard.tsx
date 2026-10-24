import React, { useEffect, useState } from 'react'
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
} from 'lucide-react'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import { apiRequest } from '../api'
import type { Language } from '../i18n'
import type { UserProfile } from '../types'

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

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  token,
  user,
  onNotify,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard')
  const [data, setData] = useState<any>(null)
  const [adminTests, setAdminTests] = useState<any[]>([])
  const [adminUsers, setAdminUsers] = useState<any[]>([])
  const [adminCategories, setAdminCategories] = useState<any[]>([])
  const [adminFaqs, setAdminFaqs] = useState<any[]>([])
  const [adminTickets, setAdminTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const isAdmin = user?.role === 'admin'

  const loadAllAdminData = async () => {
    if (!token || !isAdmin) return
    setLoading(true)
    try {
      const [dashRes, testsRes, usersRes, catsRes, faqsRes, ticketsRes] = await Promise.all([
        apiRequest('/admin/dashboard').catch(() => null),
        apiRequest<any[]>('/admin/tests').catch(() => []),
        apiRequest<any[]>('/admin/users').catch(() => []),
        apiRequest<any[]>('/admin/categories').catch(() => []),
        apiRequest<any[]>('/admin/faqs').catch(() => []),
        apiRequest<any[]>('/admin/support/tickets').catch(() => []),
      ])

      if (dashRes) setData(dashRes)
      if (testsRes) setAdminTests(testsRes)
      if (usersRes) setAdminUsers(usersRes)
      if (catsRes) setAdminCategories(catsRes)
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

  // If user is not admin
  if (!token || !isAdmin) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 animate-in fade-in duration-300">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-12 shadow-2xl border border-slate-200/80 dark:border-slate-800 text-center">
          <div className="w-16 h-16 rounded-3xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3">
            Панель управления администратора
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed mb-6">
            Этот раздел защищён и доступен исключительно сотрудникам с ролью системного администратора SIHAT.
          </p>
          <Button
            onClick={() => {
              if (onNavigate) onNavigate('login')
            }}
            className="bg-[#103D35] hover:bg-[#17A884] text-white px-8 py-3 rounded-xl font-bold cursor-pointer"
          >
            Войти как администратор
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

  const sidebarItems: Array<{ id: AdminTab; label: string; icon: React.ReactNode }> = [
    { id: 'dashboard', label: 'Сводка KPI', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'tests', label: 'Скрининги и тесты', icon: <Activity className="w-4 h-4" /> },
    { id: 'categories', label: 'Категории каталога', icon: <Layers className="w-4 h-4" /> },
    { id: 'questionnaires', label: 'Опросники (GAD-7)', icon: <FileText className="w-4 h-4" /> },
    { id: 'methodologies', label: 'Паспорта методик', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'users', label: 'Пользователи', icon: <Users className="w-4 h-4" /> },
    { id: 'knowledge', label: 'База знаний', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'faq', label: 'Вопросы и ответы (FAQ)', icon: <HelpCircle className="w-4 h-4" /> },
    { id: 'support', label: 'Тикеты поддержки', icon: <LifeBuoy className="w-4 h-4" /> },
    { id: 'analytics', label: 'Аналитика и логи', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'settings', label: 'Системные сервисы', icon: <Settings className="w-4 h-4" /> },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Permanent Desktop Admin Sidebar */}
        <aside className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-xl border border-slate-200/80 dark:border-slate-800 lg:sticky lg:top-24">
          <div className="flex items-center gap-3 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-[#103D35] text-[#2EC4A7] flex items-center justify-center font-bold">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                SIHAT Control Hub
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">v2.4.0 • Tremor Engine</p>
            </div>
          </div>

          <nav className="space-y-1">
            {sidebarItems.map((item) => {
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#103D35] text-white shadow-md shadow-[#103D35]/20 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={isActive ? 'text-[#2EC4A7]' : 'text-slate-400'}>
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

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={loadAllAdminData}
              className="w-full text-xs gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Обновить данные</span>
            </Button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="lg:col-span-9 space-y-6">
          {/* TAB 1: KPI DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Top Aggregate KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-lg border border-slate-200/80 dark:border-slate-800">
                  <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">
                    Всего пользователей
                  </div>
                  <div className="text-3xl font-black font-mono text-slate-900 dark:text-white">
                    {totalUsers}
                  </div>
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1 font-semibold">
                    <Users className="w-3.5 h-3.5" />
                    <span>{activeUsers} активных аккаунтов</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-lg border border-slate-200/80 dark:border-slate-800">
                  <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">
                    Скринингов пройдено
                  </div>
                  <div className="text-3xl font-black font-mono text-[#103D35] dark:text-[#2EC4A7]">
                    {totalCompleted}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-[#17A884]" />
                    <span>Реальные сессии попыток</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-lg border border-slate-200/80 dark:border-slate-800">
                  <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">
                    Сохранено в архиве
                  </div>
                  <div className="text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                    {totalSaved}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>С согласия пользователей</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-lg border border-slate-200/80 dark:border-slate-800">
                  <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">
                    Zero-Retention Purged
                  </div>
                  <div className="text-3xl font-black font-mono text-teal-600 dark:text-teal-400">
                    {totalPurged}
                  </div>
                  <div className="text-[11px] text-teal-600 dark:text-teal-400 mt-2 flex items-center gap-1 font-semibold">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Стерто без сохранения</span>
                  </div>
                </div>
              </div>

              {/* Real Modules & Tests Status Glance */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#17A884]" />
                    <span>Каталог утвержденных скринингов ({adminTests.length})</span>
                  </h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab('tests')}
                    className="text-xs cursor-pointer"
                  >
                    Управление тестами →
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {adminTests.slice(0, 6).map((test) => (
                    <div
                      key={test.id || test.slug}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-mono font-bold text-[#17A884]">
                          {test.slug}
                        </span>
                        <Badge
                          variant="outline"
                          className={
                            test.availability_status === 'published'
                              ? 'border-emerald-500/40 text-emerald-600'
                              : 'border-slate-300 text-slate-400'
                          }
                        >
                          {test.availability_status}
                        </Badge>
                      </div>
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {test.localizations?.ru?.title || test.slug}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TESTS MANAGEMENT */}
          {activeTab === 'tests' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
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
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs w-full sm:w-64 focus:outline-hidden"
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
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
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
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 dark:border-slate-800">
              <div className="mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
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
                    className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70"
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

          {/* TAB 4: USERS MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 dark:border-slate-800">
              <div className="mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Учётные записи ({adminUsers.length})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Управление правами доступа и блокировкой профилей.
                </p>
              </div>

              <div className="space-y-3">
                {adminUsers.map((u) => (
                  <div
                    key={u.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {u.full_name}
                        </span>
                        <Badge
                          variant="outline"
                          className={
                            u.role === 'admin'
                              ? 'border-purple-400 text-purple-600 bg-purple-50 dark:bg-purple-950/20'
                              : 'border-slate-300 text-slate-500'
                          }
                        >
                          {u.role}
                        </Badge>
                      </div>
                      <div className="text-xs text-slate-500 font-mono">{u.email}</div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleUserRole(u.id, u.role)}
                        className="text-xs cursor-pointer"
                      >
                        Сменить роль ({u.role === 'admin' ? 'user' : 'admin'})
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleUserActive(u.id, u.is_active)}
                        className={`text-xs cursor-pointer ${
                          u.is_active
                            ? 'text-rose-600 border-rose-200 hover:bg-rose-50'
                            : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'
                        }`}
                      >
                        {u.is_active ? 'Заблокировать' : 'Разблокировать'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: FAQ & SUPPORT */}
          {activeTab === 'faq' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 dark:border-slate-800">
              <div className="mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  База вопросов и ответов (FAQ) ({adminFaqs.length})
                </h3>
              </div>
              <div className="space-y-3">
                {adminFaqs.map((faq) => (
                  <div
                    key={faq.id}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700"
                  >
                    <div className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                      {faq.question}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-300">{faq.answer}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: SUPPORT TICKETS */}
          {activeTab === 'support' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 dark:border-slate-800">
              <div className="mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Обращения пользователей ({adminTickets.length})
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
                      className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between"
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

          {/* Fallback for other tabs */}
          {['questionnaires', 'methodologies', 'knowledge', 'analytics', 'settings'].includes(
            activeTab
          ) && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 dark:border-slate-800 text-center py-12">
              <Shield className="w-12 h-12 text-[#17A884] mx-auto mb-3" />
              <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                Раздел {activeTab}
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Все методики и опросники синхронизированы с доказательным ядром SIHAT.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
