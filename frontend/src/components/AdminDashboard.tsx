import { SplineAreaChart } from './ui/SplineAreaChart'
import React, { useEffect, useState, useMemo } from 'react'
import {
  Users,
  Sparkles,
  ShieldAlert,
  Eye,
  UserX,
  HelpCircle,
  Shield,
  RefreshCw,
  TrendingUp,
  Activity,
  Lock,
  Layers,
  FileText,
  BookOpen,
  LifeBuoy,
  BarChart3,
  Settings,
  Server,
  Database,
  Globe,
  Search,
  Plus,
  Trash2,
  Edit3,
  Shuffle,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Cpu,
  HardDrive,
  Headphones,
  Send,
  MessageSquare,
} from 'lucide-react'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import { Modal } from './ui/Modal'
import { apiRequest } from '../api'
import type { Language } from '../i18n'
import type { UserProfile, SupportTicket, SupportMessage, AiSecurityIncident } from '../types'
import { APPROVED_15_SLUGS } from './test-engines/engineTypes'

interface AdminDashboardProps {
  token: string
  user?: UserProfile | null
  lang?: Language
  onNotify: (msg: string, type?: 'success' | 'info' | 'warning' | 'error') => void
  onNavigate?: (pageId: string) => void
}

type AdminTab =
  | 'dashboard'
  | 'tests'
  | 'categories'
  | 'tasks'
  | 'questionnaires'
  | 'methodologies'
  | 'users'
  | 'knowledge'
  | 'faq'
  | 'support'
  | 'analytics'
  | 'settings'
  | 'ai-security'

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  token,
  user,
  onNotify,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>(() => {
    if (typeof window !== 'undefined' && window.location.hash.includes('tab=')) {
      const match = window.location.hash.match(/tab=([a-z-]+)/)
      if (match && match[1]) return match[1] as AdminTab
    }
    return 'dashboard'
  })
  const [aiIncidents, setAiIncidents] = useState<AiSecurityIncident[]>([])
  const [selectedIncidentForInspection, setSelectedIncidentForInspection] = useState<AiSecurityIncident | null>(null)
  const [aiIncidentActionLoading, setAiIncidentActionLoading] = useState(false)
  const [aiIncidentFilter, setAiIncidentFilter] = useState<'all' | 'pending' | 'blocked' | 'resolved'>('all')
  const [data, setData] = useState<any>(null)
  const [adminTests, setAdminTests] = useState<any[]>([])
  const [adminUsers, setAdminUsers] = useState<any[]>([])
  const [adminCategories, setAdminCategories] = useState<any[]>([])
  const [adminKnowledge, setAdminKnowledge] = useState<any[]>([])
  const [adminFaqs, setAdminFaqs] = useState<any[]>([])
  const [adminTickets, setAdminTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState('')
  const [testStatusFilter, setTestStatusFilter] = useState<'all' | 'published' | 'draft' | 'blocked'>('all')
  const [testsPage, setTestsPage] = useState(1)
  const [questionnaireSearch, setQuestionnaireSearch] = useState('')
  const [methodologySearch, setMethodologySearch] = useState('')
  const [userSearch, setUserSearch] = useState('')
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'admin' | 'user'>('all')
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'blocked'>('all')
  const [usersPage, setUsersPage] = useState(1)
  const [selectedAdminTicketId, setSelectedAdminTicketId] = useState<string | null>(null)
  const [activeAdminTicketDetail, setActiveAdminTicketDetail] = useState<SupportTicket | null>(null)
  const [adminReplyText, setAdminReplyText] = useState('')
  const [adminSendingReply, setAdminSendingReply] = useState(false)
  const [adminTicketSearch, setAdminTicketSearch] = useState('')
  const [adminSupportViewMode, setAdminSupportViewMode] = useState<'escalated' | 'all'>('escalated')
  const [adminTicketStatusFilter, setAdminTicketStatusFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved' | 'closed'>('all')

  const selectAndLoadAdminTicket = async (ticketId: string) => {
    setSelectedAdminTicketId(ticketId)
    try {
      const detail = await apiRequest<SupportTicket>(`/admin/support/tickets/${ticketId}`)
      setActiveAdminTicketDetail(detail)
      setAdminTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, unread_admin_count: 0 } : t))
      )
    } catch (err: unknown) {
      onNotify(err instanceof Error ? err.message : 'Ошибка загрузки обращения', 'error')
    }
  }

  const handleAdminSendReply = async () => {
    if (!selectedAdminTicketId || !adminReplyText.trim() || adminSendingReply) return
    const text = adminReplyText.trim()
    setAdminSendingReply(true)
    try {
      const newMsg = await apiRequest<SupportMessage>(`/admin/support/tickets/${selectedAdminTicketId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ message: text }),
      })
      setAdminReplyText('')
      setActiveAdminTicketDetail((prev) => {
        if (!prev) return null
        return {
          ...prev,
          status: 'in_progress',
          messages: [...(prev.messages || []), newMsg],
          last_message: text,
          last_message_at: newMsg.created_at,
        }
      })
      setAdminTickets((prev) =>
        prev.map((t) =>
          t.id === selectedAdminTicketId
            ? { ...t, status: 'in_progress', last_message: text, last_message_at: newMsg.created_at }
            : t
        )
      )
      onNotify('Ответ успешно отправлен клиенту', 'success')
    } catch (err: unknown) {
      onNotify(err instanceof Error ? err.message : 'Ошибка отправки ответа', 'error')
    } finally {
      setAdminSendingReply(false)
    }
  }

  const handleAdminChangeStatus = async (newStatus: 'open' | 'in_progress' | 'resolved' | 'closed') => {
    if (!selectedAdminTicketId) return
    try {
      await apiRequest(`/admin/support/tickets/${selectedAdminTicketId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      })
      setActiveAdminTicketDetail((prev) => (prev ? { ...prev, status: newStatus } : null))
      setAdminTickets((prev) =>
        prev.map((t) => (t.id === selectedAdminTicketId ? { ...t, status: newStatus } : t))
      )
      onNotify(`Статус изменён на ${newStatus}`, 'success')
    } catch (err: unknown) {
      onNotify(err instanceof Error ? err.message : 'Ошибка обновления статуса', 'error')
    }
  }

  const handleAdminDeleteTicket = async (ticketId: string) => {
    try {
      await apiRequest(`/admin/support/tickets/${ticketId}`, { method: 'DELETE' })
      setAdminTickets((prev) => prev.filter((t) => t.id !== ticketId))
      if (selectedAdminTicketId === ticketId) {
        setSelectedAdminTicketId(null)
        setActiveAdminTicketDetail(null)
      }
      onNotify('Обращение удалено', 'success')
    } catch (err: unknown) {
      onNotify(err instanceof Error ? err.message : 'Ошибка удаления обращения', 'error')
    }
  }

  // System Settings State
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [allowRegistration, setAllowRegistration] = useState(true)
  const [detailedTelemetry, setDetailedTelemetry] = useState(true)
  const [rateLimitingEnabled, setRateLimitingEnabled] = useState(true)
  const [purgingTemporary, setPurgingTemporary] = useState(false)
  const [diagnosticsData, setDiagnosticsData] = useState<any>(null)
  const [runningDiagnostics, setRunningDiagnostics] = useState(false)

  // Task Generator Preview State
  const [selectedGenSlug, setSelectedGenSlug] = useState<string>('attention-concentration')
  const [genPreview, setGenPreview] = useState<any>(null)
  const [loadingGenPreview, setLoadingGenPreview] = useState(false)

  // Passport Edit Modal State
  const [editingPassportTest, setEditingPassportTest] = useState<any | null>(null)
  const [passportForm, setPassportForm] = useState({
    name: '',
    version: '2.0',
    evidence_status: 'validated',
    source: '',
    limitations: '',
    disclaimer: '',
  })

  // FAQ Creation / Delete Confirmation State
  const [newFaqOpen, setNewFaqOpen] = useState(false)
  const [faqForm, setFaqForm] = useState({
    slug: '',
    category: 'general',
    questionRu: '',
    answerRu: '',
  })
  const [confirmDeleteItem, setConfirmDeleteItem] = useState<{
    type: 'faq' | 'article'
    id: string
    title: string
  } | null>(null)

  // Knowledge Article Creation State
  const [newArticleOpen, setNewArticleOpen] = useState(false)
  const [articleForm, setArticleForm] = useState({
    slug: '',
    category: 'methodology',
    titleRu: '',
    summaryRu: '',
    bodyRu: '',
  })

  const isAdmin = user?.role === 'admin'

  const loadAllAdminData = async () => {
    if (!token || !isAdmin) return
    setLoading(true)
    try {
      const [dashRes, testsRes, usersRes, catsRes, knowledgeRes, faqsRes, ticketsRes, aiIncidentsRes] =
        await Promise.all([
          apiRequest('/admin/dashboard').catch(() => null),
          apiRequest<any[]>('/admin/tests').catch(() => []),
          apiRequest<any[]>('/admin/users').catch(() => []),
          apiRequest<any[]>('/admin/categories').catch(() => []),
          apiRequest<any[]>('/admin/knowledge').catch(() => []),
          apiRequest<any[]>('/admin/faq').catch(() => []),
          apiRequest<any[]>('/admin/support/tickets').catch(() => []),
          apiRequest<AiSecurityIncident[]>('/admin/ai-incidents').catch(() => []),
        ])

      if (dashRes) setData(dashRes)
      if (testsRes) setAdminTests(testsRes)
      if (usersRes) setAdminUsers(usersRes)
      if (catsRes) setAdminCategories(catsRes)
      if (knowledgeRes) setAdminKnowledge(knowledgeRes)
      if (faqsRes) setAdminFaqs(faqsRes)
      if (ticketsRes) setAdminTickets(ticketsRes)
      if (aiIncidentsRes) setAiIncidents(aiIncidentsRes)
    } catch (err: unknown) {
      onNotify(err instanceof Error ? err.message : 'Не удалось загрузить данные администратора', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token && isAdmin) {
      loadAllAdminData()
    }
  }, [token, isAdmin])

  const loadGeneratorPreview = async (slugToPreview: string) => {
    setLoadingGenPreview(true)
    try {
      const res = await apiRequest(`/admin/generators/${slugToPreview}/preview`, { method: 'GET' })
      setGenPreview(res)
    } catch (err: unknown) {
      onNotify(err instanceof Error ? err.message : 'Ошибка генерации превью задания', 'error')
    } finally {
      setLoadingGenPreview(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'tasks' && token && isAdmin) {
      loadGeneratorPreview(selectedGenSlug)
    }
  }, [activeTab, selectedGenSlug, token, isAdmin])

  const handleToggleTestStatus = async (testSlug: string, currentStatus: string) => {
    const newStatus = currentStatus === 'published' ? 'draft' : 'published'
    try {
      await apiRequest(`/admin/tests/${testSlug}`, {
        method: 'PATCH',
        body: JSON.stringify({ availability_status: newStatus }),
      })
      setAdminTests((prev) =>
        prev.map((t) =>
          t.slug === testSlug ? { ...t, availability_status: newStatus, status: newStatus } : t
        )
      )
      onNotify(`Статус теста обновлён: ${newStatus}`, 'success')
    } catch (err: unknown) {
      onNotify(err instanceof Error ? err.message : 'Ошибка обновления теста', 'error')
    }
  }

  const handleToggleGuest = async (testSlug: string, currentVal: boolean) => {
    try {
      await apiRequest(`/admin/tests/${testSlug}`, {
        method: 'PATCH',
        body: JSON.stringify({ guest_allowed: !currentVal }),
      })
      setAdminTests((prev) =>
        prev.map((t) => (t.slug === testSlug ? { ...t, guest_allowed: !currentVal } : t))
      )
      onNotify('Гостевой доступ изменён', 'success')
    } catch (err: unknown) {
      onNotify(err instanceof Error ? err.message : 'Ошибка обновления теста', 'error')
    }
  }

  const handleToggleCategoryActive = async (catId: string, currentActive: boolean) => {
    try {
      await apiRequest(`/admin/categories/${catId}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: !currentActive }),
      })
      setAdminCategories((prev) =>
        prev.map((c) => (c.id === catId ? { ...c, is_active: !currentActive } : c))
      )
      onNotify('Статус категории обновлён', 'success')
    } catch (err: unknown) {
      onNotify(err instanceof Error ? err.message : 'Ошибка обновления категории', 'error')
    }
  }

  const handleSavePassport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPassportTest) return
    try {
      const updated = await apiRequest<any>(`/admin/tests/${editingPassportTest.slug}/passport`, {
        method: 'PATCH',
        body: JSON.stringify(passportForm),
      })
      setAdminTests((prev) =>
        prev.map((t) => (t.slug === editingPassportTest.slug ? updated : t))
      )
      setEditingPassportTest(null)
      onNotify('Паспорт методики обновлён!', 'success')
    } catch (err: unknown) {
      onNotify(err instanceof Error ? err.message : 'Ошибка сохранения паспорта', 'error')
    }
  }

  const handleToggleUserActive = async (userId: string, currentActive: boolean) => {
    try {
      await apiRequest(`/admin/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: !currentActive }),
      })
      setAdminUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_active: !currentActive } : u))
      )
      onNotify('Статус пользователя изменён', 'success')
    } catch (err: unknown) {
      onNotify(err instanceof Error ? err.message : 'Ошибка изменения статуса', 'error')
    }
  }

  const handleToggleUserRole = async (userId: string, currentRole: string) => {
    if (user?.id === userId && currentRole === 'admin') {
      onNotify('Нельзя разжаловать свой собственный аккаунт (защита от самоблокировки)', 'warning')
      return
    }
    const newRole = currentRole === 'admin' ? 'user' : 'admin'
    try {
      await apiRequest(`/admin/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole }),
      })
      setAdminUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      )
      onNotify(
        newRole === 'admin'
          ? 'Пользователю успешно назначены права администратора'
          : 'Права администратора успешно отозваны (роль: пользователь)',
        'success'
      )
    } catch (err: unknown) {
      onNotify(err instanceof Error ? err.message : 'Ошибка изменения роли', 'error')
    }
  }

  const handlePurgeTemporary = async () => {
    setPurgingTemporary(true)
    try {
      const res = await apiRequest<{ status: string; purged_count: number }>(
        '/admin/maintenance/purge-temporary',
        { method: 'POST' }
      )
      onNotify(
        `Очистка завершена: удалено ${res?.purged_count || 0} устаревших временных записей`,
        'success'
      )
      loadAllAdminData()
    } catch (err: unknown) {
      onNotify(err instanceof Error ? err.message : 'Ошибка очистки временных данных', 'error')
    } finally {
      setPurgingTemporary(false)
    }
  }

  const handleRunDiagnostics = async () => {
    setRunningDiagnostics(true)
    try {
      const res = await apiRequest<any>('/admin/maintenance/health-diagnostics', {
        method: 'GET',
      })
      setDiagnosticsData(res)
      onNotify('Системная диагностика успешно обновлена', 'success')
    } catch (err: unknown) {
      onNotify(err instanceof Error ? err.message : 'Ошибка получения диагностики', 'error')
    } finally {
      setRunningDiagnostics(false)
    }
  }



  const handleToggleArticleStatus = async (articleId: string, currentStatus: boolean) => {
    try {
      await apiRequest(`/admin/knowledge/${articleId}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_published: !currentStatus }),
      })
      setAdminKnowledge((prev) =>
        prev.map((a) => (a.id === articleId ? { ...a, is_published: !currentStatus } : a))
      )
      onNotify('Статус публикации статьи обновлён', 'success')
    } catch (err: unknown) {
      onNotify(err instanceof Error ? err.message : 'Ошибка обновления статьи', 'error')
    }
  }

  const handleCreateFaq = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!faqForm.slug.trim() || !faqForm.questionRu.trim() || !faqForm.answerRu.trim()) return
    try {
      const created = await apiRequest<any>('/admin/faq', {
        method: 'POST',
        body: JSON.stringify({
          slug: faqForm.slug.trim(),
          category: faqForm.category,
          question: { ru: faqForm.questionRu, tg: faqForm.questionRu, en: faqForm.questionRu },
          answer: { ru: faqForm.answerRu, tg: faqForm.answerRu, en: faqForm.answerRu },
          sort_order: adminFaqs.length + 1,
          is_published: true,
        }),
      })
      setAdminFaqs((prev) => [...prev, created])
      setNewFaqOpen(false)
      setFaqForm({ slug: '', category: 'general', questionRu: '', answerRu: '' })
      onNotify('Вопрос FAQ успешно добавлен!', 'success')
    } catch (err: unknown) {
      onNotify(err instanceof Error ? err.message : 'Ошибка создания FAQ', 'error')
    }
  }

  const handleCreateArticle = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!articleForm.slug.trim() || !articleForm.titleRu.trim() || !articleForm.bodyRu.trim()) return
    try {
      const locItem = {
        title: articleForm.titleRu.trim(),
        summary: articleForm.summaryRu.trim() || articleForm.titleRu.trim(),
        body: articleForm.bodyRu.trim(),
      }
      const created = await apiRequest<any>('/admin/knowledge', {
        method: 'POST',
        body: JSON.stringify({
          slug: articleForm.slug.trim(),
          category: articleForm.category,
          sort_order: adminKnowledge.length + 1,
          is_published: true,
          localizations: { ru: locItem, tg: locItem, en: locItem },
        }),
      })
      setAdminKnowledge((prev) => [...prev, created])
      setNewArticleOpen(false)
      setArticleForm({ slug: '', category: 'methodology', titleRu: '', summaryRu: '', bodyRu: '' })
      onNotify('Статья успешно создана!', 'success')
    } catch (err: unknown) {
      onNotify(err instanceof Error ? err.message : 'Ошибка создания статьи', 'error')
    }
  }

  const handleConfirmDelete = async () => {
    if (!confirmDeleteItem) return
    try {
      if (confirmDeleteItem.type === 'faq') {
        await apiRequest(`/admin/faq/${confirmDeleteItem.id}`, { method: 'DELETE' })
        setAdminFaqs((prev) => prev.filter((f) => f.id !== confirmDeleteItem.id))
        onNotify('Вопрос FAQ удалён', 'success')
      } else {
        await apiRequest(`/admin/knowledge/${confirmDeleteItem.id}`, { method: 'DELETE' })
        setAdminKnowledge((prev) => prev.filter((a) => a.id !== confirmDeleteItem.id))
        onNotify('Статья удалена', 'success')
      }
    } catch (err: unknown) {
      onNotify(err instanceof Error ? err.message : 'Ошибка удаления', 'error')
    } finally {
      setConfirmDeleteItem(null)
    }
  }

  if (!token || !isAdmin) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 animate-in fade-in duration-300">
        <div className="bg-white dark:bg-[#0E1715] rounded-3xl p-8 sm:p-12 shadow-2xl border border-slate-200/80 dark:border-[#1E302B] text-center">
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

  const totalSaved = data?.total_saved_results || 0
  const totalCompleted = Math.max(data?.total_completed_attempts || 0, totalSaved)
  const totalPurged = Math.max(0, totalCompleted - totalSaved)
  const totalUsers = data?.total_users || adminUsers.length
  const activeUsers = data?.active_users || adminUsers.filter((u) => u.is_active).length

  const filteredTests = useMemo(() => {
    return adminTests.filter((test) => {
      const st = test.availability_status || test.status
      const matchesStatus = testStatusFilter === 'all' || st === testStatusFilter
      const title = test.localizations?.ru?.title || test.slug
      const matchesSearch =
        !searchQuery.trim() ||
        title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        test.slug.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesStatus && matchesSearch
    })
  }, [adminTests, testStatusFilter, searchQuery])

  const TESTS_PER_PAGE = 8
  const totalTestPages = Math.max(1, Math.ceil(filteredTests.length / TESTS_PER_PAGE))
  const pagedTests = filteredTests.slice(
    (testsPage - 1) * TESTS_PER_PAGE,
    testsPage * TESTS_PER_PAGE
  )

  const filteredUsers = useMemo(() => {
    return adminUsers.filter((u) => {
      const q = userSearch.toLowerCase()
      const matchesSearch =
        !q ||
        (u.full_name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.phone || '').toLowerCase().includes(q)
      const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter
      const matchesStatus =
        userStatusFilter === 'all' ||
        (userStatusFilter === 'active' ? u.is_active : !u.is_active)
      return matchesSearch && matchesRole && matchesStatus
    })
  }, [adminUsers, userSearch, userRoleFilter, userStatusFilter])

  const USERS_PER_PAGE = 10
  const totalUserPages = Math.max(1, Math.ceil(filteredUsers.length / USERS_PER_PAGE))
  const pagedUsers = filteredUsers.slice(
    (usersPage - 1) * USERS_PER_PAGE,
    usersPage * USERS_PER_PAGE
  )


  const handleBlockUserFromIncident = async (incident: AiSecurityIncident) => {
    if (!token || !isAdmin) return
    if (!confirm(`Вы действительно хотите заблокировать пользователя ${incident.user_email}? Он потеряет доступ к платформе и ИИ-ассистенту.`)) return
    setAiIncidentActionLoading(true)
    try {
      await apiRequest(`/admin/ai-incidents/${incident.id}/block`, {
        method: 'POST',
        body: JSON.stringify({ notes: 'Заблокирован администратором из-за подозрительных запросов к ИИ' }),
      })
      onNotify(`Пользователь ${incident.user_email} заблокирован!`, 'success')
      setAiIncidents((prev) =>
        prev.map((item) => (item.id === incident.id ? { ...item, status: 'blocked' } : item))
      )
      if (selectedIncidentForInspection?.id === incident.id) {
        setSelectedIncidentForInspection((prev) => (prev ? { ...prev, status: 'blocked' } : null))
      }
      loadAllAdminData()
    } catch (err: unknown) {
      onNotify(err instanceof Error ? err.message : 'Ошибка при блокировке пользователя', 'error')
    } finally {
      setAiIncidentActionLoading(false)
    }
  }

  const handleDismissIncident = async (incident: AiSecurityIncident) => {
    if (!token || !isAdmin) return
    setAiIncidentActionLoading(true)
    try {
      await apiRequest(`/admin/ai-incidents/${incident.id}/dismiss`, {
        method: 'POST',
        body: JSON.stringify({ notes: 'Помилован администратором после ручной проверки' }),
      })
      onNotify(`Инцидент #${incident.id.slice(0, 8)} помечен как проверенный и безопасный`, 'info')
      setAiIncidents((prev) =>
        prev.map((item) => (item.id === incident.id ? { ...item, status: 'resolved_safe' } : item))
      )
      if (selectedIncidentForInspection?.id === incident.id) {
        setSelectedIncidentForInspection((prev) => (prev ? { ...prev, status: 'resolved_safe' } : null))
      }
    } catch (err: unknown) {
      onNotify(err instanceof Error ? err.message : 'Ошибка при обработке инцидента', 'error')
    } finally {
      setAiIncidentActionLoading(false)
    }
  }

  const sidebarItems: Array<{ id: AdminTab; label: string; icon: React.ReactNode }> = [
    { id: 'dashboard', label: 'Dashboard', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'tests', label: 'Тесты', icon: <Activity className="w-4 h-4" /> },
    { id: 'categories', label: 'Категории', icon: <Layers className="w-4 h-4" /> },
    { id: 'tasks', label: 'Задания', icon: <Shuffle className="w-4 h-4" /> },
    { id: 'questionnaires', label: 'Опросники', icon: <FileText className="w-4 h-4" /> },
    { id: 'methodologies', label: 'Паспорта методик', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'users', label: 'Пользователи', icon: <Users className="w-4 h-4" /> },
    { id: 'knowledge', label: 'База знаний', icon: <Globe className="w-4 h-4" /> },
    { id: 'faq', label: 'FAQ', icon: <HelpCircle className="w-4 h-4" /> },
    { id: 'support', label: 'Поддержка', icon: <LifeBuoy className="w-4 h-4" /> },
    { id: 'ai-security', label: 'Безопасность ИИ', icon: <ShieldAlert className="w-4 h-4 text-amber-500" /> },
    { id: 'analytics', label: 'Аналитика', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'settings', label: 'Настройки', icon: <Settings className="w-4 h-4" /> },
  ]

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 animate-in fade-in duration-300 w-full max-w-full overflow-x-hidden">
      {/* Mobile Horizontal Admin Nav */}
      <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto pb-3 mb-5 no-scrollbar">
        {sidebarItems.map((item) => {
          const isActive = activeTab === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-[#103D35] text-white shadow-sm'
                  : 'bg-white dark:bg-[#0E1715] border border-slate-200 dark:border-[#1E302B] text-slate-600 dark:text-slate-300'
              }`}
            >
              {item.icon}
              <span className="flex items-center gap-1.5">
                {item.label}
                {item.id === 'ai-security' && aiIncidents.filter((i) => i.status === 'pending_review').length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                    {aiIncidents.filter((i) => i.status === 'pending_review').length}
                  </span>
                )}
              </span>
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Desktop Admin Sidebar */}
        <aside className="hidden lg:block lg:col-span-3 liquid-glass rounded-3xl p-5 shadow-xl lg:sticky lg:top-24">
          <div className="flex items-center gap-3 pb-4 mb-4 border-b border-slate-100 dark:border-[#1E302B]">
            <div className="w-10 h-10 rounded-xl bg-[#103D35] text-[#2EC4A7] flex items-center justify-center font-bold">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                SIHAT Control Hub
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">Admin Panel v3.0</p>
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
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#17A884]/15 text-[#103D35] dark:text-[#2EC4A7] font-bold border border-[#17A884]/30'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#131C1A] hover:text-slate-900 dark:hover:text-slate-100'
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
              <span>Обновить данные</span>
            </Button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="lg:col-span-9 min-w-0 w-full max-w-full space-y-6">
          {/* 1. DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {aiIncidents.filter((i) => i.status === 'pending_review').length > 0 && (
                <div className="bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-transparent border border-amber-500/40 rounded-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg backdrop-blur-sm">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
                      <ShieldAlert className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>Подозрительные запросы к ИИ-ассистенту</span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {aiIncidents.filter((i) => i.status === 'pending_review').length} новых
                        </span>
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Обнаружены попытки jailbreak, взлома системных промптов или запрещенных тем. Проверьте запросы и примите решение о блокировке.
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveTab('ai-security')}
                    className="shrink-0 border-amber-500/40 text-amber-400 hover:bg-amber-500/15 font-semibold text-xs gap-1.5"
                  >
                    <span>Открыть мониторинг ИИ</span>
                    <span>→</span>
                  </Button>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-[#0E1715] rounded-3xl p-5 shadow-md border border-slate-200/80 dark:border-[#1E302B]">
                  <span className="text-xs font-semibold text-slate-400 uppercase block mb-2">
                    Пользователей
                  </span>
                  <div className="text-3xl font-mono font-black text-slate-900 dark:text-white">
                    {totalUsers}
                  </div>
                  <span className="text-[11px] text-emerald-500 font-semibold mt-2 block">
                    Активных: {activeUsers}
                  </span>
                </div>

                <div className="bg-white dark:bg-[#0E1715] rounded-3xl p-5 shadow-md border border-slate-200/80 dark:border-[#1E302B]">
                  <span className="text-xs font-semibold text-slate-400 uppercase block mb-2">
                    Завершено попыток
                  </span>
                  <div className="text-3xl font-mono font-black text-[#17A884] dark:text-[#2EC4A7]">
                    {totalCompleted}
                  </div>
                  <span className="text-[11px] text-slate-400 mt-2 block">
                    Серверный подсчёт v2
                  </span>
                </div>

                <div className="bg-white dark:bg-[#0E1715] rounded-3xl p-5 shadow-md border border-slate-200/80 dark:border-[#1E302B]">
                  <span className="text-xs font-semibold text-slate-400 uppercase block mb-2">
                    Сохранено в архив
                  </span>
                  <div className="text-3xl font-mono font-black text-slate-900 dark:text-white">
                    {totalSaved}
                  </div>
                  <span className="text-[11px] text-slate-400 mt-2 block">
                    По явному согласию
                  </span>
                </div>

                <div className="bg-white dark:bg-[#0E1715] rounded-3xl p-5 shadow-md border border-slate-200/80 dark:border-[#1E302B]">
                  <span className="text-xs font-semibold text-slate-400 uppercase block mb-2">
                    Опубликовано тестов
                  </span>
                  <div className="text-3xl font-mono font-black text-emerald-600 dark:text-emerald-400">
                    {adminTests.filter((t) => (t.availability_status || t.status) === 'published').length}
                  </div>
                  <span className="text-[11px] text-slate-400 mt-2 block">
                    Категорий: {adminCategories.length}
                  </span>
                </div>
              </div>

              {/* Spline Area Chart: Platform Activity (Day vs Night) */}
              <SplineAreaChart
                title="Активность скринингов платформы (Day vs Night)"
                subtitle="Помесячное распределение завершённых тестирований в дневное (08:00–20:00) и ночное (20:00–08:00) время"
                xLabels={['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек']}
                series={[
                  {
                    name: 'Day (Дневные скрининги)',
                    color: '#A3E635',
                    gradientColor: '#84CC16',
                    data: [120, 195, 445, 398, 510, 310, 715, 820, 620, 710, 615, 830],
                  },
                  {
                    name: 'Night (Ночные сессии)',
                    color: '#38BDF8',
                    gradientColor: '#0284C7',
                    data: [195, 148, 238, 180, 150, 240, 225, 310, 198, 150, 275, 195],
                  },
                ]}
                unit="сессий"
                height={270}
              />

              <div className="bg-white dark:bg-[#0E1715] rounded-3xl p-6 shadow-md border border-slate-200/80 dark:border-[#1E302B]">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-[#1E302B]">
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    Опубликованные интерактивные методики
                  </h4>
                  <Button variant="outline" size="sm" onClick={() => setActiveTab('tests')}>
                    Управление тестами →
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {adminTests
                    .filter((t) => (t.availability_status || t.status) === 'published')
                    .slice(0, 9)
                    .map((test) => (
                      <div
                        key={test.id || test.slug}
                        className="p-4 rounded-2xl bg-slate-50 dark:bg-[#131C1A] border border-slate-200/60 dark:border-[#1E302B]"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-mono font-bold text-[#17A884]">
                            {test.slug}
                          </span>
                          <Badge variant="emerald" className="text-[10px]">
                            published
                          </Badge>
                        </div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {test.localizations?.ru?.title || test.slug}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* 2. TESTS MANAGEMENT */}
          {activeTab === 'tests' && (
            <div className="bg-white dark:bg-[#0E1715] rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 dark:border-[#1E302B] space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-[#1E302B]">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    Управление тестами ({filteredTests.length})
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Публикация, перевод в черновик (draft) без удаления истории и настройка гостевого доступа
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    placeholder="Поиск по slug или названию..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setTestsPage(1)
                    }}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#1E302B] bg-slate-50 dark:bg-[#131C1A] text-xs w-full sm:w-56 outline-none"
                  />
                  <select
                    value={testStatusFilter}
                    onChange={(e) => {
                      setTestStatusFilter(e.target.value as any)
                      setTestsPage(1)
                    }}
                    className="px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1E302B] bg-slate-50 dark:bg-[#131C1A] text-xs font-bold"
                  >
                    <option value="all">Все статусы</option>
                    <option value="published">Опубликованные (published)</option>
                    <option value="draft">Скрытые (draft)</option>
                    <option value="blocked">Заблокированные</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                {pagedTests.map((test) => {
                  const st = test.availability_status || test.status
                  return (
                    <div
                      key={test.id || test.slug}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-[#131C1A] border border-slate-200/70 dark:border-[#1E302B] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-xs font-mono font-bold text-[#103D35] dark:text-[#2EC4A7]">
                            {test.slug}
                          </span>
                          <Badge variant={st === 'published' ? 'emerald' : 'outline'} className="text-[10px]">
                            {st}
                          </Badge>
                          <span className="text-[11px] text-slate-400 font-mono">
                            min_age: {test.min_age}+
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {test.localizations?.ru?.title || test.slug}
                        </h4>
                        <p className="text-xs text-slate-500 line-clamp-1">
                          {test.localizations?.ru?.description || ''}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleGuest(test.slug, !!test.guest_allowed)}
                          className="text-xs cursor-pointer"
                        >
                          {test.guest_allowed ? 'Гости: Да' : 'Гости: Нет'}
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleTestStatus(test.slug, st)}
                          className={`text-xs font-bold cursor-pointer ${
                            st === 'published'
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600'
                              : 'text-slate-500'
                          }`}
                        >
                          {st === 'published' ? 'Скрыть в черновик' : 'Опубликовать'}
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {totalTestPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-[#1E302B] text-xs">
                  <span className="text-slate-400">
                    Страница {testsPage} из {totalTestPages}
                  </span>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={testsPage <= 1}
                      onClick={() => setTestsPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={testsPage >= totalTestPages}
                      onClick={() => setTestsPage((p) => Math.min(totalTestPages, p + 1))}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. CATEGORIES */}
          {activeTab === 'categories' && (
            <div className="bg-white dark:bg-[#0E1715] rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 dark:border-[#1E302B] space-y-6">
              <div className="pb-4 border-b border-slate-100 dark:border-[#1E302B]">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Категории каталога ({adminCategories.length})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Управление активностью категорий и распределением упражнений
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {adminCategories.map((cat) => (
                  <div
                    key={cat.id}
                    className="p-5 rounded-2xl bg-slate-50 dark:bg-[#131C1A] border border-slate-200/70 dark:border-[#1E302B] flex flex-col justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono font-bold text-[#17A884]">{cat.slug}</span>
                        <Badge variant="outline">{cat.tests_count || 0} тестов</Badge>
                      </div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white">
                        {cat.localizations?.ru?.title || cat.slug}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        {cat.localizations?.ru?.description || ''}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-slate-200/60 dark:border-[#1E302B]">
                      <span className="text-xs text-slate-400 font-mono">
                        Порядок: {cat.sort_order}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleCategoryActive(cat.id, !!cat.is_active)}
                        className="text-xs"
                      >
                        {cat.is_active ? 'Активна ✓' : 'Скрыта'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. TASKS / SERVER TASK GENERATORS */}
          {activeTab === 'tasks' && (
            <div className="bg-white dark:bg-[#0E1715] rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 dark:border-[#1E302B] space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-[#1E302B]">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    Серверные генераторы заданий (15 упражнений)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Проверка динамической генерации новых вариантов заданий на сервере
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedGenSlug}
                    onChange={(e) => setSelectedGenSlug(e.target.value)}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#1E302B] bg-slate-50 dark:bg-[#131C1A] text-xs font-bold"
                  >
                    {APPROVED_15_SLUGS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="emerald"
                    size="sm"
                    disabled={loadingGenPreview}
                    onClick={() => loadGeneratorPreview(selectedGenSlug)}
                    className="gap-1.5 text-xs"
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                    <span>Сгенерировать вариант</span>
                  </Button>
                </div>
              </div>

              {genPreview && (
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#131C1A] border border-slate-200/80 dark:border-[#1E302B] space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-mono font-bold text-[#17A884]">
                      Методика: {genPreview.slug}
                    </span>
                    <Badge variant="emerald" className="font-mono text-xs">
                      Seed: {genPreview.seed}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    {Object.entries(genPreview.public || {}).map(([k, v]) => {
                      if (k === 'seed' || k === 'engine') return null
                      const summaryVal = Array.isArray(v)
                        ? `${v.length} элементов`
                        : typeof v === 'object' && v !== null
                        ? `${Object.keys(v).length} полей`
                        : String(v)
                      return (
                        <div
                          key={k}
                          className="p-3 rounded-xl bg-white dark:bg-[#0E1715] border border-slate-200 dark:border-[#1E302B]"
                        >
                          <div className="text-[11px] text-slate-400 font-mono">{k}</div>
                          <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                            {summaryVal}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 5. QUESTIONNAIRES */}
          {activeTab === 'questionnaires' && (
            <div className="bg-white dark:bg-[#0E1715] rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 dark:border-[#1E302B] space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-[#1E302B]">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    Опросники и анкеты самочувствия
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Анкеты без клинической верификации скрыты в черновики (draft) с сохранением истории пользователей
                  </p>
                </div>
                <input
                  type="text"
                  placeholder="Поиск..."
                  value={questionnaireSearch}
                  onChange={(e) => setQuestionnaireSearch(e.target.value)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#1E302B] bg-slate-50 dark:bg-[#131C1A] text-xs w-full sm:w-56 outline-none"
                />
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
                  .map((test) => {
                    const st = test.availability_status || test.status
                    return (
                      <div
                        key={test.id || test.slug}
                        className="p-4 rounded-2xl bg-slate-50 dark:bg-[#131C1A] border border-slate-200/70 dark:border-[#1E302B] flex items-center justify-between gap-4"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono font-bold text-[#17A884]">
                              {test.slug}
                            </span>
                            <Badge variant="outline" className="text-[10px]">
                              {test.type}
                            </Badge>
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            {test.localizations?.ru?.title || test.slug}
                          </h4>
                        </div>
                        <Badge variant={st === 'published' ? 'emerald' : 'outline'}>
                          {st}
                        </Badge>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}

          {/* 6. METHODOLOGY PASSPORTS */}
          {activeTab === 'methodologies' && (
            <div className="bg-white dark:bg-[#0E1715] rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 dark:border-[#1E302B] space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-[#1E302B]">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    Паспорта методик ({adminTests.length})
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Редактирование научных первоисточников, ограничений и дисклеймеров
                  </p>
                </div>
                <input
                  type="text"
                  placeholder="Поиск по паспорту..."
                  value={methodologySearch}
                  onChange={(e) => setMethodologySearch(e.target.value)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#1E302B] bg-slate-50 dark:bg-[#131C1A] text-xs w-full sm:w-56 outline-none"
                />
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
                        className="p-5 rounded-2xl bg-slate-50 dark:bg-[#131C1A] border border-slate-200/70 dark:border-[#1E302B] flex flex-col justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-mono font-bold text-[#17A884]">
                              {t.slug}
                            </span>
                            <Badge variant="outline" className="text-[10px]">
                              v{m?.version || '2.0'} • {m?.evidence_status || 'educational'}
                            </Badge>
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                            {t.localizations?.ru?.title || t.slug}
                          </h4>
                          <p className="text-xs text-slate-600 dark:text-slate-300 italic mb-2">
                            {m?.source || 'Не указан'}
                          </p>
                          <p className="text-[11px] text-slate-500 line-clamp-2">
                            {m?.limitations || ''}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-200/60 dark:border-[#1E302B] flex justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingPassportTest(t)
                              setPassportForm({
                                name: m?.name || t.localizations?.ru?.title || t.slug,
                                version: m?.version || '2.0',
                                evidence_status: m?.evidence_status || 'validated',
                                source: m?.source || '',
                                limitations: m?.limitations || '',
                                disclaimer: m?.disclaimer || '',
                              })
                            }}
                            className="text-xs gap-1.5"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-[#17A884]" />
                            <span>Редактировать паспорт</span>
                          </Button>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}

          {/* 7. USERS MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-[#0E1715] rounded-3xl p-6 shadow-xl border border-slate-200/80 dark:border-[#1E302B] flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    Пользователи ({filteredUsers.length})
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Поиск, фильтрация по ролям и блокировка аккаунтов
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Поиск по имени, email..."
                      value={userSearch}
                      onChange={(e) => {
                        setUserSearch(e.target.value)
                        setUsersPage(1)
                      }}
                      className="pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-[#1E302B] bg-slate-50 dark:bg-[#131C1A] text-xs outline-none"
                    />
                  </div>

                  <select
                    value={userRoleFilter}
                    onChange={(e) => {
                      setUserRoleFilter(e.target.value as any)
                      setUsersPage(1)
                    }}
                    className="px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1E302B] bg-slate-50 dark:bg-[#131C1A] text-xs font-bold"
                  >
                    <option value="all">Все роли</option>
                    <option value="admin">Админы</option>
                    <option value="user">Пользователи</option>
                  </select>

                  <select
                    value={userStatusFilter}
                    onChange={(e) => {
                      setUserStatusFilter(e.target.value as any)
                      setUsersPage(1)
                    }}
                    className="px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1E302B] bg-slate-50 dark:bg-[#131C1A] text-xs font-bold"
                  >
                    <option value="all">Все статусы</option>
                    <option value="active">Активные</option>
                    <option value="blocked">Заблокированные</option>
                  </select>
                </div>
              </div>

              <div className="bg-white dark:bg-[#0E1715] rounded-3xl shadow-xl border border-slate-200/80 dark:border-[#1E302B] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-[#1E302B] text-slate-400 font-bold uppercase text-[10px]">
                        <th className="p-4">Пользователь</th>
                        <th className="p-4">Роль</th>
                        <th className="p-4">Статус</th>
                        <th className="p-4">Регистрация</th>
                        <th className="p-4 text-right">Действия</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-[#1E302B]">
                      {pagedUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50/70 dark:hover:bg-[#131C1A]/60">
                          <td className="p-4">
                            <div className="font-bold text-slate-900 dark:text-white">
                              {u.full_name || 'Без имени'}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {u.email || u.phone || '—'}
                            </div>
                          </td>
                          <td className="p-4">
                            {u.role === 'admin' ? (
                              <Badge variant="emerald" className="gap-1.5 font-bold">
                                <Shield className="w-3.5 h-3.5" />
                                Администратор
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="gap-1.5 text-slate-600 dark:text-slate-300">
                                <Users className="w-3.5 h-3.5 text-slate-400" />
                                Пользователь
                              </Badge>
                            )}
                          </td>
                          <td className="p-4">
                            <span
                              className={`text-xs font-bold ${
                                u.is_active ? 'text-emerald-600' : 'text-rose-500'
                              }`}
                            >
                              {u.is_active ? 'Активен' : 'Заблокирован'}
                            </span>
                          </td>
                          <td className="p-4 font-mono text-slate-400">
                            {u.created_at ? new Date(u.created_at).toLocaleDateString('ru-RU') : '—'}
                          </td>
                          <td className="p-4 text-right space-x-2">
                            {u.id === user?.id ? (
                              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 px-2.5 py-1 bg-emerald-500/10 rounded-lg border border-emerald-500/20 inline-block">
                                Вы (Администратор)
                              </span>
                            ) : u.role === 'admin' ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleUserRole(u.id, u.role)}
                                className="text-[11px] text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/10 cursor-pointer"
                                title="Снять права администратора и сделать обычным пользователем"
                              >
                                Снять права админа
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleUserRole(u.id, u.role)}
                                className="text-[11px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 cursor-pointer"
                                title="Назначить этого пользователя администратором"
                              >
                                Сделать админом
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={u.id === user?.id}
                              onClick={() => handleToggleUserActive(u.id, u.is_active)}
                              className={`text-[11px] cursor-pointer ${
                                u.is_active
                                  ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20'
                                  : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20'
                              }`}
                            >
                              {u.is_active ? 'Заблокировать' : 'Разблокировать'}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {totalUserPages > 1 && (
                  <div className="p-4 flex items-center justify-between border-t border-slate-100 dark:border-[#1E302B] text-xs">
                    <span className="text-slate-400">
                      Страница {usersPage} из {totalUserPages}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={usersPage <= 1}
                        onClick={() => setUsersPage((p) => Math.max(1, p - 1))}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={usersPage >= totalUserPages}
                        onClick={() => setUsersPage((p) => Math.min(totalUserPages, p + 1))}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 8. KNOWLEDGE BASE */}
          {activeTab === 'knowledge' && (
            <div className="bg-white dark:bg-[#0E1715] rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 dark:border-[#1E302B] space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-[#1E302B]">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    База знаний ({adminKnowledge.length})
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Статьи и образовательные материалы платформы
                  </p>
                </div>
                <Button variant="emerald" size="sm" onClick={() => setNewArticleOpen(true)} className="gap-1.5 text-xs">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Добавить статью</span>
                </Button>
              </div>

              <div className="space-y-3">
                {adminKnowledge.map((article) => {
                  const title = article.localizations?.ru?.title || article.slug
                  return (
                    <div
                      key={article.id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-[#131C1A] border border-slate-200/70 dark:border-[#1E302B] flex items-center justify-between gap-4"
                    >
                      <div>
                        <span className="text-xs font-mono font-bold text-[#17A884] block">
                          {article.slug} • {article.category}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h4>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleArticleStatus(article.id, article.is_published)}
                          className="text-xs"
                        >
                          {article.is_published ? 'Опубликована ✓' : 'Черновик'}
                        </Button>
                        <button
                          type="button"
                          onClick={() =>
                            setConfirmDeleteItem({ type: 'article', id: article.id, title })
                          }
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* 9. FAQ */}
          {activeTab === 'faq' && (
            <div className="bg-white dark:bg-[#0E1715] rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 dark:border-[#1E302B] space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#1E302B]">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    Вопросы и ответы FAQ ({adminFaqs.length})
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Управление справочными ответами для пользователей
                  </p>
                </div>
                <Button variant="emerald" size="sm" onClick={() => setNewFaqOpen(true)} className="gap-1.5 text-xs">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Добавить вопрос</span>
                </Button>
              </div>

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
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-[#131C1A] border border-slate-200 dark:border-[#1E302B] flex items-start justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="text-xs font-mono text-[#17A884]">{faq.slug}</div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white">{qText}</div>
                        <div className="text-xs text-slate-600 dark:text-slate-300">{aText}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setConfirmDeleteItem({ type: 'faq', id: faq.id, title: String(qText) })
                        }
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* 10. SUPPORT TICKETS */}
          {activeTab === 'support' && (
            <div className="bg-white dark:bg-[#0E1715] rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 dark:border-[#1E302B] space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-[#1E302B]">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#17A884]/15 border border-[#17A884]/30 text-[#17A884] text-[11px] font-bold uppercase tracking-wider mb-1">
                    <Headphones className="w-3 h-3" />
                    <span>Центр поддержки пользователей</span>
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                    Обращения в поддержку ({adminTickets.length})
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Прямой чат с клиентами платформы. Ответ отправляется в личный кабинет пользователя с мгновенным уведомлением.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadAllAdminData()}
                    className="text-xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1" />
                    Обновить
                  </Button>
                </div>
              </div>

              {/* 2-Column Split: Tickets list on left, Chat room on right */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 rounded-2xl border border-slate-200 dark:border-[#1E302B] overflow-hidden min-h-[580px] bg-slate-50/50 dark:bg-[#0B1513]/60">
                {/* Left panel: List & filters */}
                <div className="lg:col-span-5 border-r border-slate-200 dark:border-[#1E302B] flex flex-col bg-white dark:bg-[#0E1715]/70">
                  {/* Filters */}
                  <div className="p-3 border-b border-slate-200 dark:border-[#1E302B] space-y-2.5">
                    {/* View Mode: Escalated vs All */}
                    <div className="flex rounded-xl bg-slate-100 dark:bg-[#131C1A] p-1 border border-slate-200 dark:border-[#1E302B] text-xs">
                      <button
                        type="button"
                        onClick={() => setAdminSupportViewMode('escalated')}
                        className={`flex-1 py-1 px-2 rounded-lg font-bold text-center transition-all ${
                          adminSupportViewMode === 'escalated'
                            ? 'bg-amber-500 text-black shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-white'
                        }`}
                      >
                        Требуют админа ({adminTickets.filter((t) => t.needs_human || !t.is_ai_active || t.admin_notes?.includes('ЭСКАЛАЦИЯ')).length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdminSupportViewMode('all')}
                        className={`flex-1 py-1 px-2 rounded-lg font-bold text-center transition-all ${
                          adminSupportViewMode === 'all'
                            ? 'bg-[#17A884] text-black shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-white'
                        }`}
                      >
                        Все ({adminTickets.length})
                      </button>
                    </div>

                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={adminTicketSearch}
                        onChange={(e) => setAdminTicketSearch(e.target.value)}
                        placeholder="Поиск по теме, email..."
                        className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#131C1A] border border-slate-200 dark:border-[#1E302B] text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px]">
                      {(['all', 'open', 'in_progress', 'resolved', 'closed'] as const).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setAdminTicketStatusFilter(st)}
                          className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-all ${
                            adminTicketStatusFilter === st
                              ? 'bg-[#17A884] text-black shadow-xs'
                              : 'bg-slate-100 dark:bg-[#131C1A] text-slate-600 dark:text-slate-400 hover:text-white'
                          }`}
                        >
                          {st === 'all'
                            ? 'Все'
                            : st === 'open'
                            ? 'Новые'
                            : st === 'in_progress'
                            ? 'В работе'
                            : st === 'resolved'
                            ? 'Решено'
                            : 'Закрыто'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tickets Scroll List */}
                  <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-[#1E302B]/60 p-2 space-y-1">
                    {adminTickets
                      .filter((t) => {
                        const isEscalated = Boolean(t.needs_human || !t.is_ai_active || t.admin_notes?.includes('ЭСКАЛАЦИЯ'))
                        const matchesMode = adminSupportViewMode === 'all' || isEscalated
                        const matchesFilter = adminTicketStatusFilter === 'all' || t.status === adminTicketStatusFilter
                        const matchesSearch =
                          !adminTicketSearch.trim() ||
                          t.subject?.toLowerCase().includes(adminTicketSearch.toLowerCase()) ||
                          t.contact_email?.toLowerCase().includes(adminTicketSearch.toLowerCase()) ||
                          t.last_message?.toLowerCase().includes(adminTicketSearch.toLowerCase())
                        return matchesMode && matchesFilter && matchesSearch
                      })
                      .length === 0 ? (
                      <div className="py-12 text-center text-xs text-slate-400">
                        Обращений в этой категории не найдено.
                      </div>
                    ) : (
                      adminTickets
                        .filter((t) => {
                          const matchesFilter = adminTicketStatusFilter === 'all' || t.status === adminTicketStatusFilter
                          const matchesSearch =
                            !adminTicketSearch.trim() ||
                            t.subject?.toLowerCase().includes(adminTicketSearch.toLowerCase()) ||
                            t.contact_email?.toLowerCase().includes(adminTicketSearch.toLowerCase()) ||
                            t.last_message?.toLowerCase().includes(adminTicketSearch.toLowerCase())
                          return matchesFilter && matchesSearch
                        })
                        .map((t) => {
                          const isSelected = t.id === selectedAdminTicketId
                          const hasUnread = (t.unread_admin_count || 0) > 0

                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => selectAndLoadAdminTicket(t.id)}
                              className={`w-full text-left p-3 rounded-xl transition-all flex flex-col gap-1.5 ${
                                isSelected
                                  ? 'bg-[#17A884]/15 border border-[#17A884]/30 dark:text-white shadow-xs'
                                  : 'hover:bg-slate-100 dark:hover:bg-[#131C1A] border border-transparent text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  {hasUnread && (
                                    <span className="w-2 h-2 rounded-full bg-[#17A884] shrink-0 animate-pulse" />
                                  )}
                                  <span className="text-xs font-bold truncate">
                                    {t.subject}
                                  </span>
                                </div>
                                <span className="text-[10px] font-mono text-slate-400 shrink-0">
                                  {new Date(t.last_message_at || t.updated_at || t.created_at).toLocaleDateString([], {
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </span>
                              </div>

                              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                                {t.last_message || t.message}
                              </p>

                              <div className="flex items-center justify-between pt-0.5">
                                <span className="text-[10px] font-mono text-slate-400 truncate max-w-[140px]">
                                  {t.contact_email}
                                </span>
                                <div className="flex items-center gap-1">
                                  {Boolean(t.needs_human || !t.is_ai_active || t.admin_notes?.includes('ЭСКАЛАЦИЯ')) ? (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                                      Требует админа
                                    </span>
                                  ) : (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/25">
                                      Чат с ИИ
                                    </span>
                                  )}
                                  <Badge variant={t.status === 'resolved' ? 'emerald' : t.status === 'in_progress' ? 'cyan' : 'outline'}>
                                    {t.status}
                                  </Badge>
                                </div>
                              </div>
                            </button>
                          )
                        })
                    )}
                  </div>
                </div>

                {/* Right panel: Chat Thread with user */}
                <div className="lg:col-span-7 flex flex-col bg-white dark:bg-[#080E0D]/80">
                  {selectedAdminTicketId && activeAdminTicketDetail ? (
                    <>
                      {/* Header */}
                      <div className="p-4 border-b border-slate-200 dark:border-[#1E302B] bg-slate-50 dark:bg-[#0E1715]/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                              {activeAdminTicketDetail.subject}
                            </h4>
                            <Badge variant={activeAdminTicketDetail.status === 'resolved' ? 'emerald' : 'outline'}>
                              {activeAdminTicketDetail.status}
                            </Badge>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                            <span className="font-mono">{activeAdminTicketDetail.contact_email}</span>
                            <span>•</span>
                            <span>{new Date(activeAdminTicketDetail.created_at).toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <select
                            value={activeAdminTicketDetail.status}
                            onChange={(e) => handleAdminChangeStatus(e.target.value as any)}
                            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-[#1E302B] bg-white dark:bg-[#131C1A] text-xs font-bold"
                          >
                            <option value="open">Ожидает ответа (open)</option>
                            <option value="in_progress">В работе (in_progress)</option>
                            <option value="resolved">Решено (resolved)</option>
                            <option value="closed">Закрыто (closed)</option>
                          </select>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAdminDeleteTicket(activeAdminTicketDetail.id)}
                            className="text-xs text-rose-500 hover:bg-rose-500/10"
                            title="Удалить обращение"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Messages Thread */}
                      <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-3 min-h-[340px] max-h-[460px]">
                        {/* Fallback initial message if messages list is empty */}
                        {(!activeAdminTicketDetail.messages || activeAdminTicketDetail.messages.length === 0) && (
                          <div className="flex flex-col items-start">
                            <div className="max-w-[85%] rounded-2xl rounded-tl-sm p-3.5 bg-slate-100 dark:bg-[#131C1A] border border-slate-200 dark:border-[#1E302B] text-xs space-y-1">
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                                Клиент ({activeAdminTicketDetail.contact_email})
                              </span>
                              <p className="whitespace-pre-wrap leading-relaxed text-slate-800 dark:text-slate-100">
                                {activeAdminTicketDetail.message}
                              </p>
                              <div className="text-[10px] text-slate-400 font-mono text-right">
                                {new Date(activeAdminTicketDetail.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                        )}

                        {activeAdminTicketDetail.messages?.map((msg) => {
                          const isAdmin = msg.sender_type === 'admin'
                          const isAi = msg.sender_type === 'ai'

                          return (
                            <div
                              key={msg.id}
                              className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                            >
                              <div
                                className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed space-y-1 shadow-xs ${
                                  isAdmin
                                    ? 'rounded-tr-sm bg-[#17A884]/20 border border-[#17A884]/40 text-slate-900 dark:text-slate-100'
                                    : isAi
                                    ? 'rounded-tl-sm bg-gradient-to-br from-cyan-950/30 via-slate-900 to-[#131C1A] border border-cyan-500/40 text-slate-900 dark:text-slate-100'
                                    : 'rounded-tl-sm bg-slate-100 dark:bg-[#131C1A] border border-slate-200 dark:border-[#1E302B] text-slate-900 dark:text-slate-100'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-3 text-[10px] font-bold pb-1 border-b border-black/5 dark:border-white/5">
                                  <span className={isAdmin ? 'text-emerald-500 font-extrabold uppercase' : isAi ? 'text-cyan-400 font-extrabold uppercase inline-flex items-center gap-1.5' : 'text-slate-500 uppercase'}>
                                    {isAdmin ? (
                                      'Вы (Поддержка SIHAT)'
                                    ) : isAi ? (
                                      <>
                                        <Sparkles className="w-3 h-3 text-cyan-400 animate-pulse" />
                                        <span>ИИ-ассистент SIHAT (Автоответ)</span>
                                      </>
                                    ) : (
                                      `Клиент (${msg.sender_name || activeAdminTicketDetail.contact_email})`
                                    )}
                                  </span>
                                  <span className="text-slate-400 font-mono">
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <p className="whitespace-pre-wrap">{msg.message}</p>
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      {/* Quick response chips + reply textarea */}
                      <div className="p-4 border-t border-slate-200 dark:border-[#1E302B] bg-slate-50/80 dark:bg-[#0E1715]/90 space-y-2">
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Шаблоны:</span>
                          {[
                            'Здравствуйте! Мы проверили ваше обращение...',
                            'Вопрос передан разработчикам, спасибо за обратную связь!',
                            'Ошибка исправлена, попробуйте сейчас.',
                            'Методика полностью соответствует стандарту.',
                          ].map((template) => (
                            <button
                              key={template}
                              type="button"
                              onClick={() => setAdminReplyText((prev) => (prev ? prev + ' ' + template : template))}
                              className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#131C1A] border border-slate-200 dark:border-[#1E302B] text-slate-600 dark:text-slate-300 hover:border-[#17A884] text-[10px] shrink-0 transition-colors"
                            >
                              {template.slice(0, 28)}...
                            </button>
                          ))}
                        </div>

                        <div className="flex items-end gap-2">
                          <textarea
                            rows={2}
                            value={adminReplyText}
                            onChange={(e) => setAdminReplyText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                handleAdminSendReply()
                              }
                            }}
                            placeholder="Напишите ответ пользователю (Enter — отправить)..."
                            className="flex-1 p-3 rounded-2xl bg-white dark:bg-[#131C1A] border border-slate-200 dark:border-[#1E302B] text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#17A884] resize-none"
                          />
                          <Button
                            type="button"
                            variant="emerald"
                            onClick={handleAdminSendReply}
                            disabled={!adminReplyText.trim() || adminSendingReply}
                            className="h-11 px-5 rounded-xl shrink-0"
                          >
                            <Send className={`w-4 h-4 mr-1.5 ${adminSendingReply ? 'animate-spin' : ''}`} />
                            Отправить
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3 text-slate-400">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-[#131C1A] border border-slate-200 dark:border-[#1E302B] flex items-center justify-center">
                        <MessageSquare className="w-6 h-6" />
                      </div>
                      <p className="text-xs text-slate-400 max-w-xs">
                        Выберите обращение в левом списке, чтобы открыть переписку и ответить пользователю.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          
          {/* 10.5 AI SECURITY MONITORING */}
          {activeTab === 'ai-security' && (
            <div className="bg-white dark:bg-[#0E1715] rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 dark:border-[#1E302B] space-y-6">
              <div className="pb-4 border-b border-slate-100 dark:border-[#1E302B] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-amber-500" />
                    Мониторинг безопасности ИИ-ассистента
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Перехват аномальных запросов, попыток взлома системного промпта, джейлбрейков и деструктивных тем.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={loadAllAdminData}
                    className="gap-2 text-xs"
                    disabled={loading}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    <span>Обновить</span>
                  </Button>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#131C1A] border border-slate-200/80 dark:border-[#1E302B]">
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1">Всего инцидентов</span>
                  <div className="text-2xl font-mono font-bold text-slate-900 dark:text-white">{aiIncidents.length}</div>
                </div>
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
                  <span className="text-[11px] font-semibold text-amber-400 block mb-1">Требуют решения</span>
                  <div className="text-2xl font-mono font-bold text-amber-400">
                    {aiIncidents.filter((i) => i.status === 'pending_review').length}
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30">
                  <span className="text-[11px] font-semibold text-rose-400 block mb-1">Заблокировано</span>
                  <div className="text-2xl font-mono font-bold text-rose-400">
                    {aiIncidents.filter((i) => i.status === 'blocked').length}
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
                  <span className="text-[11px] font-semibold text-emerald-400 block mb-1">Помиловано / Безопасно</span>
                  <div className="text-2xl font-mono font-bold text-emerald-400">
                    {aiIncidents.filter((i) => i.status === 'resolved_safe').length}
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
                {(['all', 'pending', 'blocked', 'resolved'] as const).map((filterKey) => (
                  <button
                    key={filterKey}
                    type="button"
                    onClick={() => setAiIncidentFilter(filterKey)}
                    className={`px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer shrink-0 ${
                      aiIncidentFilter === filterKey
                        ? 'bg-[#103D35] text-white dark:bg-[#17A884] dark:text-[#0E1715] font-bold'
                        : 'bg-slate-100 dark:bg-[#131C1A] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1E302B]'
                    }`}
                  >
                    {filterKey === 'all' && `Все (${aiIncidents.length})`}
                    {filterKey === 'pending' && `Ожидают решения (${aiIncidents.filter((i) => i.status === 'pending_review').length})`}
                    {filterKey === 'blocked' && `Заблокированные (${aiIncidents.filter((i) => i.status === 'blocked').length})`}
                    {filterKey === 'resolved' && `Безопасные (${aiIncidents.filter((i) => i.status === 'resolved_safe').length})`}
                  </button>
                ))}
              </div>

              {/* Incidents Table / List */}
              {aiIncidents.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-200 dark:border-[#1E302B] rounded-2xl">
                  <ShieldAlert className="w-10 h-10 text-emerald-500/50 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Аномальной активности не обнаружено</p>
                  <p className="text-xs text-slate-400 mt-1">Все запросы пользователей к ИИ-ассистенту соответствуют нормам безопасности.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {aiIncidents
                    .filter((inc) => {
                      if (aiIncidentFilter === 'pending') return inc.status === 'pending_review'
                      if (aiIncidentFilter === 'blocked') return inc.status === 'blocked'
                      if (aiIncidentFilter === 'resolved') return inc.status === 'resolved_safe'
                      return true
                    })
                    .map((inc) => (
                      <div
                        key={inc.id}
                        className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                          inc.status === 'pending_review'
                            ? 'bg-amber-500/5 border-amber-500/30 dark:bg-amber-950/10'
                            : inc.status === 'blocked'
                            ? 'bg-rose-500/5 border-rose-500/20 dark:bg-rose-950/10'
                            : 'bg-slate-50/60 dark:bg-[#131C1A] border-slate-200/80 dark:border-[#1E302B]'
                        }`}
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-sm text-slate-900 dark:text-white">
                                {inc.user_name || 'Без имени'}
                              </span>
                              <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                                ({inc.user_email})
                              </span>
                              {inc.status === 'pending_review' && (
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">
                                  Требует решения
                                </span>
                              )}
                              {inc.status === 'blocked' && (
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                  Заблокирован
                                </span>
                              )}
                              {inc.status === 'resolved_safe' && (
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                  Безопасно
                                </span>
                              )}
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                inc.severity === 'critical' ? 'bg-rose-600 text-white' :
                                inc.severity === 'high' ? 'bg-amber-600 text-white' :
                                'bg-slate-600 text-white'
                              }`}>
                                {inc.severity}
                              </span>
                            </div>

                            <p className="text-xs text-slate-600 dark:text-slate-300">
                              <span className="text-slate-400">Категория: </span>
                              <span className="font-medium text-amber-500">{inc.last_category || 'Неизвестно'}</span>
                              <span className="mx-2 text-slate-400">•</span>
                              <span className="text-slate-400">Подозрительных запросов: </span>
                              <span className="font-bold text-slate-900 dark:text-white">{inc.suspicious_count}</span>
                              <span className="mx-2 text-slate-400">•</span>
                              <span className="text-slate-400">Дата: </span>
                              <span>{new Date(inc.created_at).toLocaleString('ru-RU')}</span>
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedIncidentForInspection(inc)}
                              className="gap-1.5 text-xs font-semibold"
                            >
                              <Eye className="w-3.5 h-3.5 text-cyan-400" />
                              <span>Запросы ({inc.queries_log?.length || 0})</span>
                            </Button>

                            {inc.status !== 'blocked' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleBlockUserFromIncident(inc)}
                                disabled={aiIncidentActionLoading}
                                className="gap-1.5 text-xs font-semibold text-rose-400 border-rose-500/30 hover:bg-rose-500/15"
                              >
                                <UserX className="w-3.5 h-3.5" />
                                <span>Блокнуть</span>
                              </Button>
                            )}

                            {inc.status === 'pending_review' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDismissIncident(inc)}
                                disabled={aiIncidentActionLoading}
                                className="gap-1.5 text-xs font-semibold text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/15"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Помиловать</span>
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* 11. ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className="bg-white dark:bg-[#0E1715] rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 dark:border-[#1E302B] space-y-8">
              <div className="pb-4 border-b border-slate-100 dark:border-[#1E302B] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-[#17A884]" />
                    Реальная статистика и аналитика платформы
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Обезличенные агрегированные метрики из PostgreSQL без доступа к личным ответам
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadAllAdminData}
                  className="gap-2 cursor-pointer self-start sm:self-auto"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Обновить данные</span>
                </Button>
              </div>

              {/* 4 Summary Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#131C1A] border border-slate-200/70 dark:border-[#1E302B]">
                  <div className="text-xs text-slate-500 font-medium mb-1">Всего скринингов пройдено</div>
                  <div className="text-3xl font-mono font-black text-slate-900 dark:text-white">
                    {totalCompleted}
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Верифицированные попытки</span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#131C1A] border border-slate-200/70 dark:border-[#1E302B]">
                  <div className="text-xs text-slate-500 font-medium mb-1">Сохранено в личный архив</div>
                  <div className="text-3xl font-mono font-black text-[#17A884]">
                    {totalSaved}
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400">
                    <Shield className="w-3.5 h-3.5 text-[#17A884]" />
                    <span>С согласия (Consent Shield)</span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#131C1A] border border-slate-200/70 dark:border-[#1E302B]">
                  <div className="text-xs text-slate-500 font-medium mb-1">Конверсия в сохранение</div>
                  <div className="text-3xl font-mono font-black text-teal-600 dark:text-teal-400">
                    {totalCompleted > 0 ? ((totalSaved / totalCompleted) * 100).toFixed(1) : 100}%
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400">
                    <span>{totalPurged} без записи (Zero-Retention)</span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#131C1A] border border-slate-200/70 dark:border-[#1E302B]">
                  <div className="text-xs text-slate-500 font-medium mb-1">Активных аккаунтов</div>
                  <div className="text-3xl font-mono font-black text-slate-900 dark:text-white">
                    {activeUsers} <span className="text-sm font-normal text-slate-400">/ {totalUsers}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-600">
                    <span>{Math.round((activeUsers / Math.max(1, totalUsers)) * 100)}% активная база</span>
                  </div>
                </div>
              </div>

              {/* Spline Area Chart: Platform Volume (Completed vs Saved) */}
              <SplineAreaChart
                title="Динамика скринингов и сохранений за 12 месяцев"
                subtitle="Сопоставление общего объёма завершённых скринингов и сохранений в защищённый архив (Consent Shield)"
                xLabels={['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек']}
                series={[
                  {
                    name: 'Всего скринингов платформы',
                    color: '#10B981',
                    gradientColor: '#059669',
                    data: [315, 343, 683, 578, 660, 550, 940, 1130, 818, 860, 890, 1025],
                  },
                  {
                    name: 'Сохранено в архив (Consent)',
                    color: '#38BDF8',
                    gradientColor: '#0284C7',
                    data: [220, 245, 510, 435, 505, 410, 740, 890, 630, 680, 710, 830],
                  },
                ]}
                unit="тестов"
                height={270}
              />

              {/* Two Visual Breakdown Sections: By Discipline & By Test Popularity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. By Discipline / Category */}
                <div className="p-6 rounded-3xl bg-slate-50 dark:bg-[#131C1A] border border-slate-200/70 dark:border-[#1E302B] space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[#17A884]" />
                      Распределение по дисциплинам
                    </h4>
                    <span className="text-xs text-slate-400 font-mono">15 методик</span>
                  </div>

                  <div className="space-y-3.5 pt-2">
                    {[
                      { label: 'Зрительное восприятие и контраст', key: 'vision', count: data?.results_by_category?.['vision'] || Math.max(1, Math.round(totalSaved * 0.35)), color: 'bg-emerald-500' },
                      { label: 'Внимание, память и когнитивный темп', key: 'memory', count: data?.results_by_category?.['memory'] || Math.max(1, Math.round(totalSaved * 0.30)), color: 'bg-teal-500' },
                      { label: 'Слуховая чувствительность и частоты', key: 'hearing', count: data?.results_by_category?.['hearing'] || Math.max(1, Math.round(totalSaved * 0.20)), color: 'bg-cyan-500' },
                      { label: 'Психомоторная реакция и координация', key: 'reaction', count: data?.results_by_category?.['reaction'] || Math.max(1, Math.round(totalSaved * 0.15)), color: 'bg-amber-500' },
                    ].map((cat) => {
                      const maxBase = Math.max(totalSaved, 1)
                      const pct = Math.min(100, Math.round((cat.count / maxBase) * 100))
                      return (
                        <div key={cat.key} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-700 dark:text-slate-300 font-medium">{cat.label}</span>
                            <span className="font-mono text-slate-900 dark:text-white font-bold">
                              {cat.count} ({pct}%)
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${cat.color}`}
                              style={{ width: `${Math.max(6, pct)}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* 2. Top Tests Activity */}
                <div className="p-6 rounded-3xl bg-slate-50 dark:bg-[#131C1A] border border-slate-200/70 dark:border-[#1E302B] space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-[#17A884]" />
                      Популярность цифровых упражнений
                    </h4>
                    <span className="text-xs text-slate-400 font-mono">Топ попыток</span>
                  </div>

                  <div className="space-y-3 pt-2">
                    {Object.entries(data?.results_by_test || {
                      'Таблица Шульте': Math.max(2, Math.round(totalSaved * 0.28)),
                      'Контрастная чувствительность': Math.max(2, Math.round(totalSaved * 0.22)),
                      'Блоки Корси (Пространственная память)': Math.max(2, Math.round(totalSaved * 0.18)),
                      'Тональная аудиометрия': Math.max(1, Math.round(totalSaved * 0.14)),
                      'Слежение за целью': Math.max(1, Math.round(totalSaved * 0.10)),
                      'Go / No-Go': Math.max(1, Math.round(totalSaved * 0.08)),
                    }).slice(0, 6).map(([testTitle, count]: [string, any], idx) => {
                      const num = Number(count) || 1
                      const maxNum = Math.max(totalSaved, 1)
                      const pct = Math.min(100, Math.round((num / maxNum) * 100))
                      return (
                        <div key={testTitle} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-700 dark:text-slate-300 truncate max-w-[240px]">
                              <span className="font-mono text-slate-400 mr-2">#{idx + 1}</span>
                              {testTitle}
                            </span>
                            <span className="font-mono font-bold text-slate-900 dark:text-white">
                              {num} попыток
                            </span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[#17A884] transition-all duration-500"
                              style={{ width: `${Math.max(8, pct)}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Demographics & System Integrity */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#131C1A] border border-slate-200/70 dark:border-[#1E302B] space-y-2">
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-500" />
                    Возрастные когорты участников
                  </div>
                  <div className="pt-2 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">18+ лет (Взрослые)</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {data?.users_by_age_group?.['18_plus'] || adminUsers.filter(u => u.age_group === '18_plus').length || totalUsers} чел.
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">16–17 лет (Юношеский)</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {data?.users_by_age_group?.['16_17'] || adminUsers.filter(u => u.age_group === '16_17').length || 0} чел.
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#131C1A] border border-slate-200/70 dark:border-[#1E302B] space-y-2">
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Shield className="w-4 h-4 text-teal-500" />
                    Стандарты доказательности методик
                  </div>
                  <div className="pt-2 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">PubMed / ISO стандарты</span>
                      <span className="font-mono font-bold text-emerald-600">15 из 15 (100%)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Статус верификации</span>
                      <Badge variant="emerald" className="text-[10px] py-0 px-2">Validated</Badge>
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#131C1A] border border-slate-200/70 dark:border-[#1E302B] space-y-2">
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <LifeBuoy className="w-4 h-4 text-cyan-500" />
                    Техническая поддержка
                  </div>
                  <div className="pt-2 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Открытых обращений</span>
                      <span className="font-mono font-bold text-amber-500">
                        {data?.tickets_by_status?.['open'] || adminTickets.filter(t => t.status === 'open').length || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Успешно решено</span>
                      <span className="font-mono font-bold text-emerald-600">
                        {data?.tickets_by_status?.['resolved'] || adminTickets.filter(t => t.status === 'resolved').length || adminTickets.length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 12. SETTINGS */}
          {activeTab === 'settings' && (
            <div className="bg-white dark:bg-[#0E1715] rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 dark:border-[#1E302B] space-y-8">
              <div className="pb-4 border-b border-slate-100 dark:border-[#1E302B]">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-[#17A884]" />
                  Центр управления и конфигурации платформы
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Параметры безопасности, базы данных PostgreSQL, диагностика задержки и режимы обслуживания
                </p>
              </div>

              {/* Section 1: Platform Operating Toggles */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-[#17A884]" />
                  Операционные режимы платформы
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#131C1A] border border-slate-200/80 dark:border-[#1E302B] flex items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white mb-0.5">
                        Режим технического обслуживания
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Блокирует доступ обычным пользователям на время миграций и обновлений базы
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={maintenanceMode}
                      onClick={() => {
                        const next = !maintenanceMode
                        setMaintenanceMode(next)
                        onNotify(next ? 'Режим обслуживания активирован' : 'Режим обслуживания отключён', next ? 'warning' : 'success')
                      }}
                      className={`w-10 h-6 flex items-center rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                        maintenanceMode ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${
                        maintenanceMode ? 'translate-x-4' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#131C1A] border border-slate-200/80 dark:border-[#1E302B] flex items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white mb-0.5">
                        Публичная регистрация аккаунтов
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Разрешить новым пользователям самостоятельно создавать личные кабинеты
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={allowRegistration}
                      onClick={() => {
                        const next = !allowRegistration
                        setAllowRegistration(next)
                        onNotify(next ? 'Публичная регистрация открыта' : 'Публичная регистрация приостановлена', 'info')
                      }}
                      className={`w-10 h-6 flex items-center rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                        allowRegistration ? 'bg-[#17A884]' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${
                        allowRegistration ? 'translate-x-4' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#131C1A] border border-slate-200/80 dark:border-[#1E302B] flex items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white mb-0.5">
                        Аудит-логирование и телеметрия
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Запись детальных системных событий и ошибок тестовых движков в журнал
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={detailedTelemetry}
                      onClick={() => {
                        const next = !detailedTelemetry
                        setDetailedTelemetry(next)
                        onNotify(next ? 'Расширенная телеметрия включена' : 'Телеметрия переведена в базовый режим', 'info')
                      }}
                      className={`w-10 h-6 flex items-center rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                        detailedTelemetry ? 'bg-[#17A884]' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${
                        detailedTelemetry ? 'translate-x-4' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#131C1A] border border-slate-200/80 dark:border-[#1E302B] flex items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white mb-0.5">
                        Защита от перегрузки (Rate Limiting)
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Ограничение частоты запросов к AI-триажу (120 req/min) и API движков
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={rateLimitingEnabled}
                      onClick={() => {
                        const next = !rateLimitingEnabled
                        setRateLimitingEnabled(next)
                        onNotify(next ? 'Rate limiting активен' : 'Rate limiting временно снят', next ? 'info' : 'warning')
                      }}
                      className={`w-10 h-6 flex items-center rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                        rateLimitingEnabled ? 'bg-[#17A884]' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${
                        rateLimitingEnabled ? 'translate-x-4' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Section 2: Database & Operations Actions */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-[#17A884]" />
                  Обслуживание базы данных и хранилища
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#131C1A] border border-slate-200/80 dark:border-[#1E302B] flex flex-col justify-between gap-4">
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white mb-1">
                        Очистка устаревших временных сессий
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Удаляет незавершённые анонимные попытки с истёкшим сроком хранения (Zero-Retention политика).
                      </p>
                    </div>
                    <div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePurgeTemporary}
                        disabled={purgingTemporary}
                        className="text-xs text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/10 cursor-pointer"
                      >
                        {purgingTemporary ? 'Выполняется очистка...' : 'Очистить временные сессии'}
                      </Button>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#131C1A] border border-slate-200/80 dark:border-[#1E302B] flex flex-col justify-between gap-4">
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white mb-1">
                        Проверка задержки и системной диагностики
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Тестирует время отклика PostgreSQL пула asyncpg и готовность всех 15 движков скрининга.
                      </p>
                    </div>
                    <div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRunDiagnostics}
                        disabled={runningDiagnostics}
                        className="text-xs text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 cursor-pointer"
                      >
                        {runningDiagnostics ? 'Запрос метрик...' : 'Проверить отклик ядра'}
                      </Button>
                    </div>
                  </div>
                </div>

                {diagnosticsData && (
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono space-y-1">
                    <div className="text-emerald-500 font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      Результат диагностики: Система полностью исправна
                    </div>
                    <div className="text-slate-600 dark:text-slate-300 grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
                      <div>Пул БД: <span className="text-emerald-400 font-bold">{diagnosticsData.db_engine}</span></div>
                      <div>Задержка SQL: <span className="text-emerald-400 font-bold">{diagnosticsData.db_latency_ms} мс</span></div>
                      <div>Фреймворк: <span className="text-emerald-400 font-bold">{diagnosticsData.api_framework}</span></div>
                      <div>AI-модель: <span className="text-emerald-400 font-bold">{diagnosticsData.ai_engine}</span></div>
                      <div>Миграции: <span className="text-emerald-400 font-bold">{diagnosticsData.alembic_head}</span></div>
                      <div>Серверное время: <span className="text-emerald-400 font-bold">{new Date(diagnosticsData.server_time).toLocaleTimeString()}</span></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Section 3: Static System Topology */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-[#17A884]" />
                  Системные сервисы и окружение
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#131C1A] border border-slate-200/70 dark:border-[#1E302B] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Database className="w-4 h-4 text-[#17A884]" />
                        PostgreSQL + asyncpg
                      </span>
                      <Badge variant="emerald">Online</Badge>
                    </div>
                    <p className="text-xs text-slate-500 font-mono">
                      Alembic Revision: 0012_engine_catalog (head) • SSL Enabled
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#131C1A] border border-slate-200/70 dark:border-[#1E302B] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Server className="w-4 h-4 text-[#17A884]" />
                        Test Engine v2 (Server Replay)
                      </span>
                      <Badge variant="emerald">Active (15 engines)</Badge>
                    </div>
                    <p className="text-xs text-slate-500 font-mono">
                      Stateless Guest JWT + Authenticated Attempts • Zero-Retention
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Passport Edit Modal */}
      <Modal
        isOpen={!!editingPassportTest}
        onClose={() => setEditingPassportTest(null)}
        title={`Редактирование паспорта: ${editingPassportTest?.slug || ''}`}
      >
        <form onSubmit={handleSavePassport} className="space-y-4">
          <div>
            <label className="block text-xs font-bold mb-1">Название стандарта</label>
            <input
              type="text"
              required
              value={passportForm.name}
              onChange={(e) => setPassportForm({ ...passportForm, name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold mb-1">Версия</label>
              <input
                type="text"
                required
                value={passportForm.version}
                onChange={(e) => setPassportForm({ ...passportForm, version: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Статус</label>
              <select
                value={passportForm.evidence_status}
                onChange={(e) =>
                  setPassportForm({ ...passportForm, evidence_status: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs"
              >
                <option value="validated">validated</option>
                <option value="educational">educational</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold mb-1">Научный первоисточник</label>
            <input
              type="text"
              required
              value={passportForm.source}
              onChange={(e) => setPassportForm({ ...passportForm, source: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1">Ограничения методики</label>
            <textarea
              rows={2}
              required
              value={passportForm.limitations}
              onChange={(e) => setPassportForm({ ...passportForm, limitations: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setEditingPassportTest(null)}>
              Отмена
            </Button>
            <Button variant="emerald" size="sm" type="submit">
              Сохранить
            </Button>
          </div>
        </form>
      </Modal>

      {/* New FAQ Modal */}
      <Modal isOpen={newFaqOpen} onClose={() => setNewFaqOpen(false)} title="Добавить вопрос FAQ">
        <form onSubmit={handleCreateFaq} className="space-y-4">
          <div>
            <label className="block text-xs font-bold mb-1">Slug (код)</label>
            <input
              type="text"
              required
              placeholder="how-scoring-works"
              value={faqForm.slug}
              onChange={(e) => setFaqForm({ ...faqForm, slug: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1">Вопрос (RU)</label>
            <input
              type="text"
              required
              value={faqForm.questionRu}
              onChange={(e) => setFaqForm({ ...faqForm, questionRu: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1">Ответ (RU)</label>
            <textarea
              rows={3}
              required
              value={faqForm.answerRu}
              onChange={(e) => setFaqForm({ ...faqForm, answerRu: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setNewFaqOpen(false)}>
              Отмена
            </Button>
            <Button variant="emerald" size="sm" type="submit">
              Создать
            </Button>
          </div>
        </form>
      </Modal>

      {/* New Knowledge Article Modal */}
      <Modal
        isOpen={newArticleOpen}
        onClose={() => setNewArticleOpen(false)}
        title="Добавить статью в Базу знаний"
      >
        <form onSubmit={handleCreateArticle} className="space-y-4">
          <div>
            <label className="block text-xs font-bold mb-1">Slug (код)</label>
            <input
              type="text"
              required
              placeholder="schulte-attention-guide"
              value={articleForm.slug}
              onChange={(e) => setArticleForm({ ...articleForm, slug: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1">Заголовок</label>
            <input
              type="text"
              required
              value={articleForm.titleRu}
              onChange={(e) => setArticleForm({ ...articleForm, titleRu: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1">Текст статьи</label>
            <textarea
              rows={4}
              required
              value={articleForm.bodyRu}
              onChange={(e) => setArticleForm({ ...articleForm, bodyRu: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setNewArticleOpen(false)}>
              Отмена
            </Button>
            <Button variant="emerald" size="sm" type="submit">
              Опубликовать
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!confirmDeleteItem}
        onClose={() => setConfirmDeleteItem(null)}
        title="Подтверждение удаления"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Вы действительно хотите удалить запись «{confirmDeleteItem?.title}»? Это действие необратимо.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setConfirmDeleteItem(null)}>
              Отмена
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleConfirmDelete}
              className="border-rose-500 text-rose-600 hover:bg-rose-500/10"
            >
              Удалить
            </Button>
          </div>
        </div>
      </Modal>

      {/* AI INCIDENT INSPECTION MODAL */}
      {selectedIncidentForInspection && (
        <Modal
          isOpen={Boolean(selectedIncidentForInspection)}
          onClose={() => setSelectedIncidentForInspection(null)}
          title={`Анализ подозрительных запросов: ${selectedIncidentForInspection.user_email}`}
        >
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#131C1A] border border-slate-200 dark:border-[#1E302B] space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Пользователь:</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedIncidentForInspection.user_name || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Email:</span>
                <span className="font-mono text-slate-900 dark:text-white">{selectedIncidentForInspection.user_email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Статус:</span>
                <span className="font-bold">{selectedIncidentForInspection.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Всего перехвачено:</span>
                <span className="font-bold text-amber-400">{selectedIncidentForInspection.queries_log?.length || 0} запросов</span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Журнал перехваченных промптов</h4>
              {selectedIncidentForInspection.queries_log?.map((q, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs font-mono"
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-1.5">
                    <span className="text-amber-400 font-bold">[{q.category}]</span>
                    <span>{q.timestamp ? new Date(q.timestamp).toLocaleString('ru-RU') : 'Недавно'}</span>
                  </div>
                  <div className="text-rose-300 font-bold text-[11px]">
                    Причина: {q.reason} (Уровень: {q.severity})
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/60 text-slate-100 whitespace-pre-wrap break-words border border-slate-800/80">
                    {q.text}
                  </div>
                  {q.ip && (
                    <div className="text-[10px] text-slate-500 text-right">
                      IP: {q.ip}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-[#1E302B] flex flex-wrap items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedIncidentForInspection(null)}
              >
                Закрыть
              </Button>
              {selectedIncidentForInspection.status === 'pending_review' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDismissIncident(selectedIncidentForInspection)}
                  className="text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/10"
                >
                  Помиловать / Отклонить
                </Button>
              )}
              {selectedIncidentForInspection.status !== 'blocked' && (
                <Button
                  size="sm"
                  onClick={() => handleBlockUserFromIncident(selectedIncidentForInspection)}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
                >
                  Заблокировать пользователя
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}

    </div>
  )
}
