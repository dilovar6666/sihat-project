import React, { useState, useEffect, useRef } from 'react'
import {
  MessageSquare,
  Send,
  Plus,
  Trash2,
  Lock,
  Unlock,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Headphones,
  ShieldAlert,
  RefreshCw,
  Search,
  Sparkles,
  CheckCheck,
} from 'lucide-react'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import type { SupportTicket, UserProfile as UserType } from '../types'
import {
  fetchMySupportTickets,
  fetchSupportTicketDetail,
  sendSupportTicketMessage,
  toggleBlockSupportTicket,
  deleteSupportTicket,
  createSupportTicket,
} from '../api'
import type { Language } from '../i18n'

interface SupportChatsViewProps {
  user: UserType | null
  lang: Language
  initialTicketId?: string | null
  onNavigate?: (page: string) => void
  onNotify?: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void
}

export const SupportChatsView: React.FC<SupportChatsViewProps> = ({
  user,
  lang = 'ru',
  initialTicketId = null,
  onNavigate: _onNavigate,
  onNotify,
}) => {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(initialTicketId)
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null)
  const [loadingList, setLoadingList] = useState(false)
  const [loadingChat, setLoadingChat] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // New ticket modal
  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const [newSubject, setNewSubject] = useState('')
  const [newMessage, setNewMessage] = useState('')
  const [newEmail, setNewEmail] = useState(user?.email || '')
  const [creating, setCreating] = useState(false)

  // Delete confirm modal
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  const t = {
    ru: {
      title: 'Служба поддержки SIHAT',
      subtitle: 'Прямой защищённый диалог со специалистами и инженерами платформы. Ответ в течение 24 часов.',
      newTicketBtn: 'Новое обращение',
      searchPlaceholder: 'Поиск по теме обращения...',
      noTicketsTitle: 'У вас пока нет обращений',
      noTicketsSubtitle: 'Если у вас возник вопрос по тестам, методике или работе аккаунта — задайте его напрямую нашей команде.',
      createFirstBtn: 'Создать первое обращение',
      selectChatPrompt: 'Выберите обращение слева, чтобы открыть переписку',
      backToList: 'К списку обращений',
      sendBtn: 'Отправить',
      replyPlaceholder: 'Напишите ваше сообщение поддержке...',
      pressEnterHint: 'Enter — отправить, Shift + Enter — перенос строки',
      statusOpen: 'Ожидает ответа',
      statusInProgress: 'В работе',
      statusResolved: 'Решено',
      statusClosed: 'Закрыто',
      statusBlocked: 'Заблокирован',
      blockBtn: 'Заблокировать чат',
      unblockBtn: 'Разблокировать',
      deleteBtn: 'Удалить чат',
      chatBlockedBanner: 'Этот диалог заблокирован вами. Вы можете разблокировать его в любой момент, чтобы продолжить диалог.',
      teamBadge: 'Команда поддержки SIHAT',
      youBadge: 'Вы',
      modalTitle: 'Новое обращение в поддержку',
      modalSubtitle: 'Опишите ваш вопрос или сложность. Специалист ответит в этом чате.',
      subjectLabel: 'Тема обращения',
      subjectPlaceholder: 'Краткая суть вопроса',
      emailLabel: 'Контактный email',
      messageLabel: 'Текст обращения',
      messagePlaceholder: 'Опишите ситуацию, упражнение или вопрос как можно подробнее...',
      cancelBtn: 'Отмена',
      submitTicketBtn: 'Создать диалог',
      confirmDeleteTitle: 'Удалить диалог?',
      confirmDeleteText: 'Все сообщения этого чата будут безвозвратно удалены. Восстановить историю будет невозможно.',
      confirmDeleteBtn: 'Да, удалить навсегда',
      ticketCreatedSuccess: 'Обращение создано! Специалисты уже уведомлены.',
      messageSentSuccess: 'Сообщение отправлено.',
      ticketBlockedMsg: 'Чат заблокирован.',
      ticketUnblockedMsg: 'Чат разблокирован.',
      ticketDeletedMsg: 'Чат успешно удалён.',
      refreshBtn: 'Обновить',
    },
    tj: {
      title: 'Хадамоти дастгирии SIHAT',
      subtitle: 'Гуфтугӯи мустақим ва ҳифзшуда бо мутахассисон ва муҳандисони платформа. Посух дар муддати 24 соат.',
      newTicketBtn: 'Муроҷиати нав',
      searchPlaceholder: 'Ҷустуҷӯ аз рӯи мавзӯъ...',
      noTicketsTitle: 'Шумо ҳоло муроҷиате надоред',
      noTicketsSubtitle: 'Агар оид ба машқҳо, методика ё корбарии сайти савол дошта бошед — ба мо муроҷиат кунед.',
      createFirstBtn: 'Эҷоди муроҷиати аввалин',
      selectChatPrompt: 'Аз чап муроҷиатро интихоб намоед, то мукотиба кушода шавад',
      backToList: 'Ба рӯйхати муроҷиатҳо',
      sendBtn: 'Фиристодан',
      replyPlaceholder: 'Паёми худро ба дастгирӣ нависед...',
      pressEnterHint: 'Enter — фиристодан, Shift + Enter — сатри нав',
      statusOpen: 'Интизори посух',
      statusInProgress: 'Дар раванд',
      statusResolved: 'Ҳал шуд',
      statusClosed: 'Пӯшида',
      statusBlocked: 'Манъ карда шудааст',
      blockBtn: 'Манъ кардани чат',
      unblockBtn: 'Кушодани чат',
      deleteBtn: 'Нест кардани чат',
      chatBlockedBanner: 'Ин гуфтугӯ аз ҷониби шумо баста шудааст. Шумо метавонед онро кушоед.',
      teamBadge: 'Дастаи дастгирии SIHAT',
      youBadge: 'Шумо',
      modalTitle: 'Муроҷиати нав ба дастгирӣ',
      modalSubtitle: 'Саволи худро муфассал шарҳ диҳед. Мутахассисон дар ҳамин чат посух медиҳанд.',
      subjectLabel: 'Мавзӯи муроҷиат',
      subjectPlaceholder: 'Моҳияти кӯтоҳи савол',
      emailLabel: 'Почтаи электронии тамос',
      messageLabel: 'Матни муроҷиат',
      messagePlaceholder: 'Вазъият ё саволро муфассал баён кунед...',
      cancelBtn: 'Бекор кардан',
      submitTicketBtn: 'Оғози гуфтугӯ',
      confirmDeleteTitle: 'Чат нест карда шавад?',
      confirmDeleteText: 'Тамоми паёмҳои ин гуфтугӯ бебозгашт нест карда мешаванд.',
      confirmDeleteBtn: 'Ҳа, пурра нест шавад',
      ticketCreatedSuccess: 'Муроҷиат қабул шуд! Мутахассисон огоҳ карда шуданд.',
      messageSentSuccess: 'Паём фиристода шуд.',
      ticketBlockedMsg: 'Чат манъ карда шуд.',
      ticketUnblockedMsg: 'Чат дубора фаъол шуд.',
      ticketDeletedMsg: 'Чат бомуваффақият нест шуд.',
      refreshBtn: 'Навсозӣ',
    },
    en: {
      title: 'SIHAT Support Desk',
      subtitle: 'Direct secure communication with platform specialists and clinical engineers. 24h SLA response.',
      newTicketBtn: 'New Ticket',
      searchPlaceholder: 'Search conversations by subject...',
      noTicketsTitle: 'No conversations yet',
      noTicketsSubtitle: 'If you have any questions about methodologies, tests, or account settings, send a message directly to our team.',
      createFirstBtn: 'Create First Ticket',
      selectChatPrompt: 'Select a conversation from the left to view messages',
      backToList: 'Back to ticket list',
      sendBtn: 'Send',
      replyPlaceholder: 'Type your message to support...',
      pressEnterHint: 'Enter to send, Shift + Enter for new line',
      statusOpen: 'Awaiting Reply',
      statusInProgress: 'In Progress',
      statusResolved: 'Resolved',
      statusClosed: 'Closed',
      statusBlocked: 'Blocked',
      blockBtn: 'Block Chat',
      unblockBtn: 'Unblock',
      deleteBtn: 'Delete Chat',
      chatBlockedBanner: 'This conversation was blocked by you. You can unblock it anytime to resume chatting.',
      teamBadge: 'SIHAT Support Team',
      youBadge: 'You',
      modalTitle: 'New Support Ticket',
      modalSubtitle: 'Describe your inquiry or situation. Our specialist will reply in this direct chat thread.',
      subjectLabel: 'Subject',
      subjectPlaceholder: 'Short summary of your question',
      emailLabel: 'Contact Email',
      messageLabel: 'Message',
      messagePlaceholder: 'Please provide full details about the exercise, situation, or issue...',
      cancelBtn: 'Cancel',
      submitTicketBtn: 'Start Conversation',
      confirmDeleteTitle: 'Delete Conversation?',
      confirmDeleteText: 'All messages in this conversation will be permanently deleted and cannot be recovered.',
      confirmDeleteBtn: 'Yes, permanently delete',
      ticketCreatedSuccess: 'Ticket created! Our support engineers have been notified.',
      messageSentSuccess: 'Message sent successfully.',
      ticketBlockedMsg: 'Conversation blocked.',
      ticketUnblockedMsg: 'Conversation unblocked.',
      ticketDeletedMsg: 'Conversation deleted successfully.',
      refreshBtn: 'Refresh',
    },
  }[lang]




  // Auto-scroll messages to bottom
  const scrollToBottom = () => {
    if (chatContainerRef.current) { chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight }
  }

  // Load ticket list
  const loadTickets = async (preferSelectedId?: string | null) => {
    setLoadingList(true)
    try {
      const data = await fetchMySupportTickets()
      setTickets(data)
      const targetId = preferSelectedId ?? selectedTicketId
      if (targetId && data.some((t) => t.id === targetId)) {
        setSelectedTicketId(targetId)
      } else if (data.length > 0 && !selectedTicketId) {
        setSelectedTicketId(data[0].id)
      }
    } catch (err: unknown) {
      console.error('Failed to load tickets', err)
    } finally {
      setLoadingList(false)
    }
  }

  // Load specific ticket conversation detail
  const loadTicketDetail = async (ticketId: string) => {
    setLoadingChat(true)
    try {
      const detail = await fetchSupportTicketDetail(ticketId)
      setActiveTicket(detail)
      // update ticket item in list (to clear unread count)
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, unread_user_count: 0 } : t))
      )
    } catch (err: unknown) {
      console.error('Failed to load ticket detail', err)
      onNotify?.(err instanceof Error ? err.message : 'Error loading chat', 'error')
    } finally {
      setLoadingChat(false)
    }
  }

  useEffect(() => {
    loadTickets(initialTicketId)
  }, [initialTicketId])

  useEffect(() => {
    if (selectedTicketId) {
      loadTicketDetail(selectedTicketId)
    } else {
      setActiveTicket(null)
    }
  }, [selectedTicketId])

  useEffect(() => {
    scrollToBottom()
  }, [activeTicket?.messages])


  // Real-time WebSocket connection for instant chat updates without page reload
  useEffect(() => {
    if (!selectedTicketId) return

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const token = sessionStorage.getItem('sihat_access_token') || ''
    const wsUrl = `${wsProtocol}//${window.location.host}/api/ws/support/${selectedTicketId}${token ? `?token=${encodeURIComponent(token)}` : ''}`

    let ws: WebSocket | null = null
    let pingTimer: any = null
    let isMounted = true

    const connectWs = () => {
      try {
        ws = new WebSocket(wsUrl)
        ws.onopen = () => {
          pingTimer = setInterval(() => {
            if (ws && ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'ping' }))
            }
          }, 25000)
        }

        ws.onmessage = (event) => {
          if (!isMounted) return
          try {
            const data = JSON.parse(event.data)
            if ((data.event === 'new_message' || data.event === 'human_requested') && data.ticket_id === selectedTicketId) {
              const newMsg = data.message
              setActiveTicket((prev) => {
                if (!prev) return null
                if (prev.messages?.some((m) => m.id === newMsg.id)) return prev
                return {
                  ...prev,
                  messages: [...(prev.messages || []), newMsg],
                  status: data.ticket?.status || prev.status,
                  is_ai_active: data.ticket?.is_ai_active ?? prev.is_ai_active,
                  needs_human: data.ticket?.needs_human ?? prev.needs_human,
                  admin_notes: data.ticket?.admin_notes ?? prev.admin_notes,
                }
              })
              setTickets((prev) =>
                prev.map((t) =>
                  t.id === selectedTicketId
                    ? {
                        ...t,
                        last_message: newMsg.message,
                        last_message_at: newMsg.created_at,
                        status: data.ticket?.status || t.status,
                        admin_notes: data.ticket?.admin_notes ?? t.admin_notes,
                        unread_user_count: 0,
                      }
                    : t
                )
              )
            } else if (data.event === 'ticket_updated' && data.ticket_id === selectedTicketId) {
              setActiveTicket((prev) => (prev ? { ...prev, ...data.ticket } : null))
            }
          } catch {}
        }

        ws.onerror = () => {}
        ws.onclose = () => {
          if (pingTimer) clearInterval(pingTimer)
          if (isMounted) setTimeout(connectWs, 3000)
        }
      } catch {}
    }

    connectWs()

    return () => {
      isMounted = false
      if (pingTimer) clearInterval(pingTimer)
      if (ws) ws.close()
    }
  }, [selectedTicketId])

  // Periodic light poll for new messages in active chat
  useEffect(() => {
    if (!selectedTicketId) return
    const interval = setInterval(async () => {
      try {
        const detail = await fetchSupportTicketDetail(selectedTicketId)
        setActiveTicket((prev) => {
          if (!prev) return detail
          if (detail.messages?.length !== prev.messages?.length || detail.status !== prev.status) {
            return detail
          }
          return prev
        })
      } catch {}
    }, 8000)
    return () => clearInterval(interval)
  }, [selectedTicketId])

  // Send message
  const handleSendMessage = async () => {
    if (!selectedTicketId || !replyText.trim() || sending) return
    const text = replyText.trim()
    setSending(true)
    try {
      const newMsg = await sendSupportTicketMessage(selectedTicketId, text)
      setReplyText('')
      setActiveTicket((prev) => {
        if (!prev) return null
        return {
          ...prev,
          status: 'open',
          messages: [...(prev.messages || []), newMsg],
          last_message: text,
          last_message_at: newMsg.created_at,
        }
      })
      // update list
      setTickets((prev) =>
        prev.map((t) =>
          t.id === selectedTicketId
            ? { ...t, status: 'open', last_message: text, last_message_at: newMsg.created_at }
            : t
        )
      )
      onNotify?.(t.messageSentSuccess, 'success')
    } catch (err: unknown) {
      onNotify?.(err instanceof Error ? err.message : 'Error sending message', 'error')
    } finally {
      setSending(false)
    }
  }

  // Toggle block
  const handleToggleBlock = async () => {
    if (!selectedTicketId || !activeTicket) return
    const newBlockedState = !activeTicket.is_blocked
    try {
      const updated = await toggleBlockSupportTicket(selectedTicketId, newBlockedState)
      setActiveTicket((prev) => (prev ? { ...prev, is_blocked: newBlockedState, status: updated.status } : null))
      setTickets((prev) =>
        prev.map((t) =>
          t.id === selectedTicketId ? { ...t, is_blocked: newBlockedState, status: updated.status } : t
        )
      )
      onNotify?.(newBlockedState ? t.ticketBlockedMsg : t.ticketUnblockedMsg, 'info')
    } catch (err: unknown) {
      onNotify?.(err instanceof Error ? err.message : 'Error changing status', 'error')
    }
  }

  // Delete chat
  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return
    setDeleting(true)
    try {
      await deleteSupportTicket(deleteConfirmId)
      onNotify?.(t.ticketDeletedMsg, 'success')
      setTickets((prev) => prev.filter((t) => t.id !== deleteConfirmId))
      if (selectedTicketId === deleteConfirmId) {
        setSelectedTicketId(null)
        setActiveTicket(null)
      }
      setDeleteConfirmId(null)
    } catch (err: unknown) {
      onNotify?.(err instanceof Error ? err.message : 'Error deleting chat', 'error')
    } finally {
      setDeleting(false)
    }
  }

  // Create new ticket
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSubject.trim() || !newMessage.trim() || !newEmail.trim() || creating) return
    setCreating(true)
    try {
      const created = await createSupportTicket({
        contact_email: newEmail.trim(),
        subject: newSubject.trim(),
        message: newMessage.trim(),
      })
      setIsNewModalOpen(false)
      setNewSubject('')
      setNewMessage('')
      onNotify?.(t.ticketCreatedSuccess, 'success')
      await loadTickets(created.id)
      setSelectedTicketId(created.id)
    } catch (err: unknown) {
      onNotify?.(err instanceof Error ? err.message : 'Error creating ticket', 'error')
    } finally {
      setCreating(false)
    }
  }

  // Helper status badge
  const renderStatusBadge = (ticket: SupportTicket) => {
    if (ticket.is_blocked || ticket.status === 'closed') {
      return (
        <Badge variant="outline" className="text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900/50">
          <Lock className="w-2.5 h-2.5 mr-1 inline" />
          {ticket.is_blocked ? t.statusBlocked : t.statusClosed}
        </Badge>
      )
    }
    if (ticket.status === 'resolved') {
      return (
        <Badge variant="emerald" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30">
          <CheckCircle2 className="w-2.5 h-2.5 mr-1 inline" />
          {t.statusResolved}
        </Badge>
      )
    }
    if (ticket.status === 'in_progress') {
      return (
        <Badge variant="cyan" className="bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/30">
          <Clock className="w-2.5 h-2.5 mr-1 inline" />
          {t.statusInProgress}
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30">
        <Clock className="w-2.5 h-2.5 mr-1 inline" />
        {t.statusOpen}
      </Badge>
    )
  }

  // Filtered tickets
  const filteredTickets = tickets.filter(
    (ticket) =>
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.contact_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ticket.last_message && ticket.last_message.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const formatTime = (isoString?: string | null) => {
    if (!isoString) return ''
    try {
      const date = new Date(isoString)
      const now = new Date()
      const isToday = date.toDateString() === now.toDateString()
      if (isToday) {
        return date.toLocaleTimeString(lang === 'tj' ? 'tg-TJ' : lang === 'ru' ? 'ru-RU' : 'en-US', {
          hour: '2-digit',
          minute: '2-digit',
        })
      }
      return date.toLocaleDateString(lang === 'tj' ? 'tg-TJ' : lang === 'ru' ? 'ru-RU' : 'en-US', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return ''
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-in fade-in-50 duration-200">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-emerald-50/70 via-white to-slate-50 dark:from-[#0F1D1A] dark:via-[#0B1513] dark:to-[#080E0D] border border-slate-200/90 dark:border-[#1E302B] shadow-lg dark:shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#17A884]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[#103D35] dark:text-[#17A884] text-xs font-semibold">
              <Headphones className="w-3.5 h-3.5" />
              <span>SIHAT SUPPORT HUB</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {t.title}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
              {t.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadTickets()}
              disabled={loadingList}
              className="border-slate-200 dark:border-[#1E302B] bg-white dark:bg-transparent hover:bg-slate-100 dark:hover:bg-[#131C1A] text-slate-700 dark:text-slate-300 shadow-xs"
            >
              <RefreshCw className={`w-4 h-4 mr-1.5 ${loadingList ? 'animate-spin' : ''}`} />
              {t.refreshBtn}
            </Button>
            <Button
              variant="emerald"
              size="sm"
              onClick={() => setIsNewModalOpen(true)}
              className="shadow-lg shadow-[#17A884]/20"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              {t.newTicketBtn}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Support Chat Shell */}
      <div className="flex flex-col lg:flex-row bg-white dark:bg-[#0E1715] rounded-3xl border border-slate-200/90 dark:border-[#1E302B] shadow-2xl overflow-hidden h-[740px] max-h-[calc(100vh-140px)] min-h-[580px]">
        {/* Left Column: Tickets List */}
        <div
          className={`w-full lg:w-[320px] xl:w-[360px] shrink-0 border-r border-slate-200/90 dark:border-[#1E302B] flex flex-col h-full bg-slate-50/60 dark:bg-[#0A1210] overflow-hidden ${
            selectedTicketId ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Search Bar & New Chat Button */}
          <div className="p-3 border-b border-slate-200/90 dark:border-[#1E302B] bg-white/80 dark:bg-[#0E1715]/80 backdrop-blur-sm flex items-center gap-2 shrink-0">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full pl-8 pr-3 py-1.5 rounded-full bg-slate-100 dark:bg-[#14201D] border border-transparent focus:border-emerald-500/50 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none transition-all"
              />
            </div>
            <button
              type="button"
              onClick={() => setIsNewModalOpen(true)}
              className="w-8 h-8 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-[#17A884] flex items-center justify-center shrink-0 transition-colors cursor-pointer"
              title={t.newTicketBtn}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* List items with Internal Independent Scrollbar */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-[#162521] p-1.5 space-y-0.5">
            {loadingList && tickets.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 animate-pulse">
                Загрузка чатов...
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-[#131C1A] border border-slate-200 dark:border-[#1E302B] text-slate-500 dark:text-slate-400 flex items-center justify-center mx-auto">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t.noTicketsTitle}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
                  {t.noTicketsSubtitle}
                </p>
                <Button
                  variant="emerald"
                  size="sm"
                  onClick={() => setIsNewModalOpen(true)}
                  className="mt-2 text-xs"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  {t.createFirstBtn}
                </Button>
              </div>
            ) : (
              filteredTickets.map((ticket) => {
                const isSelected = ticket.id === selectedTicketId
                const hasUnread = (ticket.unread_user_count || 0) > 0
                const initials = ticket.subject
                  ? ticket.subject.replace(/[\[\]]/g, '').trim().slice(0, 2).toUpperCase()
                  : 'ЧТ'

                return (
                  <button
                    key={ticket.id}
                    onClick={() => setSelectedTicketId(ticket.id)}
                    className={`w-full text-left p-2.5 rounded-2xl transition-all relative flex items-center gap-3 group cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500/15 dark:bg-emerald-500/20 text-slate-900 dark:text-white'
                        : 'hover:bg-slate-200/60 dark:hover:bg-[#13201D] text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {/* Telegram Avatar */}
                    <div className="relative shrink-0">
                      <div
                        className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-xs ${
                          ticket.is_blocked || ticket.status === 'closed'
                            ? 'bg-slate-400 dark:bg-slate-700'
                            : isSelected
                            ? 'bg-gradient-to-tr from-emerald-500 to-teal-600'
                            : 'bg-gradient-to-tr from-teal-600 to-emerald-700'
                        }`}
                      >
                        {initials}
                      </div>
                      {/* Status indicator dot */}
                      {ticket.is_ai_active !== false && !ticket.is_blocked && ticket.status !== 'closed' ? (
                        <span
                          className="w-3 h-3 rounded-full bg-teal-400 border-2 border-white dark:border-[#0E1715] absolute bottom-0 right-0 shadow-xs"
                          title="ИИ онлайн"
                        />
                      ) : ticket.needs_human || !ticket.is_ai_active ? (
                        <span
                          className="w-3 h-3 rounded-full bg-amber-400 border-2 border-white dark:border-[#0E1715] absolute bottom-0 right-0 shadow-xs"
                          title="Ожидает администратора"
                        />
                      ) : null}
                    </div>

                    {/* Title and Snippet */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {ticket.subject}
                        </h4>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium shrink-0 font-mono">
                          {formatTime(ticket.last_message_at || ticket.updated_at || ticket.created_at)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate leading-snug">
                          {ticket.last_message || ticket.message}
                        </p>
                        {hasUnread ? (
                          <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0 shadow-xs">
                            {ticket.unread_user_count}
                          </span>
                        ) : ticket.is_blocked ? (
                          <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                        ) : null}
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Right Column: Chat Thread */}
        <div
          className={`flex-1 flex flex-col h-full bg-slate-100/60 dark:bg-[#070D0C] overflow-hidden ${
            !selectedTicketId ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {selectedTicketId && activeTicket ? (
            <>
              {/* Telegram Chat Header */}
              <div className="px-4 py-3 border-b border-slate-200/90 dark:border-[#1E302B] bg-white/95 dark:bg-[#0E1715]/95 backdrop-blur-sm flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => setSelectedTicketId(null)}
                    className="lg:hidden p-1.5 rounded-full bg-slate-100 dark:bg-[#14201D] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white shrink-0 cursor-pointer"
                    title={t.backToList}
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                    {activeTicket.subject.replace(/[\[\]]/g, '').trim().slice(0, 2).toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {activeTicket.subject}
                      </h3>
                      {renderStatusBadge(activeTicket)}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      {activeTicket.is_blocked || activeTicket.status === 'closed' ? (
                        <span className="text-slate-400 text-[11px] flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          {t.statusClosed}
                        </span>
                      ) : activeTicket.is_ai_active !== false ? (
                        <span className="text-teal-600 dark:text-teal-400 text-[11px] font-medium flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                          {lang === 'tj' ? 'Ёвари зеҳнии сунъӣ фаъол аст' : lang === 'en' ? 'AI Assistant online' : 'ИИ-ассистент онлайн • мгновенный ответ'}
                        </span>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400 text-[11px] font-medium flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          {lang === 'tj' ? 'Ба маъмур гузаронида шуд' : lang === 'en' ? 'Transferred to admin' : 'Передано администратору'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Top Action Buttons: Block, Delete */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={handleToggleBlock}
                    className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-[#14201D] text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
                    title={activeTicket.is_blocked ? t.unblockBtn : t.blockBtn}
                  >
                    {activeTicket.is_blocked ? <Unlock className="w-4 h-4 text-emerald-500" /> : <Lock className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(activeTicket.id)}
                    className="p-2 rounded-full hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-500 transition-colors cursor-pointer"
                    title={t.deleteBtn}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Telegram System Escalation Pill */}
              {activeTicket.is_ai_active === false && (
                <div className="mx-auto my-2 px-3.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2 shadow-xs shrink-0 max-w-fit">
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                  <span>
                    {lang === 'tj'
                      ? 'Муроҷиат ба маъмури платформа равона шуд. Озодона нависед.'
                      : lang === 'en'
                      ? 'Transferred to the human administrator.'
                      : 'Диалог передан администратору платформы.'}
                  </span>
                </div>
              )}

              {/* Chat Messages History - Telegram Style */}
              <div ref={chatContainerRef} className="flex-1 p-3.5 sm:p-5 overflow-y-auto space-y-3">
                {loadingChat && (!activeTicket.messages || activeTicket.messages.length === 0) ? (
                  <div className="py-20 text-center text-xs text-slate-400 animate-pulse">
                    Загрузка диалога...
                  </div>
                ) : (
                  <>
                    {/* Fallback initial ticket message if messages table was empty */}
                    {(!activeTicket.messages || activeTicket.messages.length === 0) && (
                      <div className="flex flex-col items-end">
                        <div className="max-w-[85%] sm:max-w-[70%] rounded-2xl rounded-tr-xs px-4 py-2.5 bg-emerald-600 dark:bg-[#103D35] text-white shadow-sm text-xs sm:text-[13px] leading-relaxed">
                          <p className="whitespace-pre-wrap break-words">{activeTicket.message}</p>
                          <div className="flex items-center justify-end gap-1 text-[10px] text-emerald-100/80 dark:text-emerald-300/80 select-none mt-1 font-mono">
                            <span>{formatTime(activeTicket.created_at)}</span>
                            <CheckCheck className="w-3.5 h-3.5 inline text-emerald-200" />
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTicket.messages?.map((msg) => {
                      const isAdmin = msg.sender_type === 'admin'
                      const isAi = msg.sender_type === 'ai'

                      if (!isAdmin && !isAi) {
                        return (
                          <div key={msg.id} className="flex flex-col items-end">
                            <div className="max-w-[85%] sm:max-w-[70%] rounded-2xl rounded-tr-xs px-4 py-2.5 bg-emerald-600 dark:bg-[#103D35] text-white shadow-sm text-xs sm:text-[13px] leading-relaxed">
                              <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                              <div className="flex items-center justify-end gap-1 text-[10px] text-emerald-100/80 dark:text-emerald-300/80 select-none mt-1 font-mono">
                                <span>{formatTime(msg.created_at)}</span>
                                <CheckCheck className="w-3.5 h-3.5 inline text-emerald-200" />
                              </div>
                            </div>
                          </div>
                        )
                      }

                      {/* AI or Admin incoming bubble */}
                      return (
                        <div key={msg.id} className="flex flex-col items-start">
                          <div className="max-w-[85%] sm:max-w-[70%] rounded-2xl rounded-tl-xs px-4 py-2.5 bg-white dark:bg-[#182522] border border-slate-200/90 dark:border-[#233832] text-slate-900 dark:text-slate-100 shadow-sm text-xs sm:text-[13px] leading-relaxed">
                            <div className="flex items-center gap-1.5 text-[11px] font-bold pb-1">
                              {isAi ? (
                                <span className="text-teal-600 dark:text-teal-400 flex items-center gap-1">
                                  <Sparkles className="w-3 h-3 text-teal-500 animate-pulse" />
                                  <span>{msg.sender_name || 'ИИ-ассистент SIHAT'}</span>
                                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-teal-500/15 text-teal-600 dark:text-teal-300">AI</span>
                                </span>
                              ) : (
                                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                  <Headphones className="w-3 h-3" />
                                  <span>{msg.sender_name || t.teamBadge}</span>
                                </span>
                              )}
                            </div>
                            <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                            <div className="flex items-center justify-end text-[10px] text-slate-400 dark:text-slate-500 select-none mt-1 font-mono">
                              <span>{formatTime(msg.created_at)}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}

                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Chat Input or Blocked Banner - Telegram Style */}
              <div className="p-3 bg-white dark:bg-[#0E1715] border-t border-slate-200/90 dark:border-[#1E302B] shrink-0">
                {activeTicket.is_blocked ? (
                  <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 text-xs text-amber-800 dark:text-amber-200">
                      <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>{t.chatBlockedBanner}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleToggleBlock}
                      className="border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 text-xs shrink-0 self-start sm:self-auto"
                    >
                      <Unlock className="w-3.5 h-3.5 mr-1" />
                      {t.unblockBtn}
                    </Button>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      handleSendMessage()
                    }}
                    className="flex items-center gap-2 max-w-4xl mx-auto"
                  >
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={t.replyPlaceholder}
                      className="flex-1 px-4 py-2.5 rounded-full bg-slate-100 dark:bg-[#14201D] border border-slate-200/80 dark:border-[#1E302B] text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all shadow-inner"
                    />
                    <button
                      type="submit"
                      disabled={!replyText.trim() || sending}
                      className="w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-600 active:scale-95 disabled:opacity-40 disabled:hover:bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md transition-all cursor-pointer"
                      title={t.sendBtn}
                    >
                      <Send className={`w-4 h-4 ml-0.5 ${sending ? 'animate-spin' : ''}`} />
                    </button>
                  </form>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4 text-slate-400">
              <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-[#131C1A] border border-slate-200 dark:border-[#1E302B] flex items-center justify-center text-slate-500 dark:text-slate-400 shadow-xs">
                <MessageSquare className="w-8 h-8" />
              </div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 max-w-sm">
                {t.selectChatPrompt}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsNewModalOpen(true)}
                className="border-slate-200 dark:border-[#1E302B] bg-white dark:bg-transparent text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white shadow-xs"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                {t.newTicketBtn}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create New Ticket */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in-50">
          <div className="w-full max-w-lg bg-white dark:bg-[#0E1715] border border-slate-200 dark:border-[#1E302B] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-[#17A884] text-xs font-bold uppercase tracking-wider">
                <Headphones className="w-3.5 h-3.5" />
                {t.modalTitle}
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                {t.modalTitle}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {t.modalSubtitle}
              </p>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t.subjectLabel}
                </label>
                <input
                  type="text"
                  required
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder={t.subjectPlaceholder}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#131C1A] border border-slate-200 dark:border-[#1E302B] text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#17A884] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t.emailLabel}
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#131C1A] border border-slate-200 dark:border-[#1E302B] text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#17A884] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t.messageLabel}
                </label>
                <textarea
                  required
                  rows={4}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={t.messagePlaceholder}
                  className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-[#131C1A] border border-slate-200 dark:border-[#1E302B] text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#17A884] focus:bg-white resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsNewModalOpen(false)}
                  className="text-xs text-slate-500 dark:text-slate-400"
                >
                  {t.cancelBtn}
                </Button>
                <Button
                  type="submit"
                  variant="emerald"
                  disabled={creating || !newSubject.trim() || !newMessage.trim()}
                  className="text-xs"
                >
                  {creating ? 'Создание...' : t.submitTicketBtn}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in-50">
          <div className="w-full max-w-md bg-white dark:bg-[#0E1715] border border-rose-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-500 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t.confirmDeleteTitle}</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {t.confirmDeleteText}
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="ghost"
                onClick={() => setDeleteConfirmId(null)}
                className="text-xs text-slate-400"
              >
                {t.cancelBtn}
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="text-xs"
              >
                {deleting ? 'Удаление...' : t.confirmDeleteBtn}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
