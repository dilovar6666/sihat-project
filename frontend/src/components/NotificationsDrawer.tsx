import React, { useState, useEffect } from 'react'
import {
  Bell,
  X,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCheck,
  Trash2,
  Clock,
  BellOff,
  Sparkles,
} from 'lucide-react'
import { Button } from './ui/Button'
import type { Language } from '../i18n'

export interface NotificationItem {
  id: string
  message: string
  type: 'success' | 'info' | 'warning' | 'error'
  timestamp: string
  read: boolean
}

interface NotificationsDrawerProps {
  isOpen: boolean
  onClose: () => void
  notifications: NotificationItem[]
  onMarkAllAsRead: () => void
  onClearAll: () => void
  onMarkOneRead: (id: string) => void
  onDeleteOne: (id: string) => void
  lang?: Language
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead,
  onClearAll,
  onMarkOneRead,
  onDeleteOne,
  lang = 'ru',
}) => {
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  // Close on Escape & prevent body scroll
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const unreadCount = notifications.filter((n) => !n.read).length
  const displayedNotifications =
    filter === 'unread' ? notifications.filter((n) => !n.read) : notifications

  const t = {
    ru: {
      title: 'Центр уведомлений',
      subtitle: 'История системных статусов и оповещений',
      allTab: 'Все',
      unreadTab: 'Непрочитанные',
      markAllRead: 'Прочитать все',
      clearAll: 'Очистить всё',
      emptyTitle: 'Нет уведомлений',
      emptySubtitle:
        'Здесь отображаются все уведомления, которые появляются в правом нижнем углу экрана (статусы тестов, сохранение результатов, авторизация).',
      close: 'Закрыть',
      now: 'Только что',
    },
    tj: {
      title: 'Маркази огоҳиномаҳо',
      subtitle: 'Таърихи ҳолатҳо ва огоҳиномаҳои системавӣ',
      allTab: 'Ҳама',
      unreadTab: 'Нохонда',
      markAllRead: 'Ҳамаро хондан',
      clearAll: 'Тоза кардан',
      emptyTitle: 'Огоҳинома нест',
      emptySubtitle:
        'Ҳамаи паёмҳое, ки дар кунҷи поёнии экран пайдо мешаванд, дар ин ҷо сабт мегарданд.',
      close: 'Пӯшидан',
      now: 'Ҳозир',
    },
    en: {
      title: 'Notification Center',
      subtitle: 'History of system alerts and statuses',
      allTab: 'All',
      unreadTab: 'Unread',
      markAllRead: 'Mark all as read',
      clearAll: 'Clear all',
      emptyTitle: 'No notifications',
      emptySubtitle:
        'All alerts appearing in the bottom-right corner of the screen will be archived here.',
      close: 'Close',
      now: 'Just now',
    },
  }[lang] || {
    title: 'Центр уведомлений',
    subtitle: 'История системных статусов и оповещений',
    allTab: 'Все',
    unreadTab: 'Непрочитанные',
    markAllRead: 'Прочитать все',
    clearAll: 'Очистить всё',
    emptyTitle: 'Нет уведомлений',
    emptySubtitle:
      'Здесь отображаются все уведомления, которые появляются в правом нижнем углу экрана.',
    close: 'Закрыть',
    now: 'Только что',
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Dimmed backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <aside
          aria-label="Панель уведомлений"
          className="w-screen max-w-md bg-white dark:bg-slate-900 border-l border-slate-200/80 dark:border-slate-800 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#103D35] via-[#17A884] to-[#2EC4A7] text-white flex items-center justify-center shadow-md shadow-[#17A884]/20 shrink-0">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
                      {t.title}
                    </h2>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-[#17A884] text-white text-[10px] font-bold">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {t.subtitle}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label={t.close}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Tabs & Bulk Actions */}
            <div className="flex items-center justify-between gap-2 pt-2">
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-200/60 dark:bg-slate-800/80 text-xs">
                <button
                  type="button"
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    filter === 'all'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {t.allTab} ({notifications.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('unread')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    filter === 'unread'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {t.unreadTab} ({unreadCount})
                </button>
              </div>

              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={onMarkAllAsRead}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-[#17A884] hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                    title={t.markAllRead}
                  >
                    <CheckCheck className="w-4 h-4 text-[#17A884]" />
                    <span className="hidden sm:inline">{t.markAllRead}</span>
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    type="button"
                    onClick={onClearAll}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                    title={t.clearAll}
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">{t.clearAll}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
            {displayedNotifications.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-3 my-auto min-h-[300px]">
                <div className="w-14 h-14 rounded-3xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-slate-400">
                  <BellOff className="w-7 h-7" />
                </div>
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  {t.emptyTitle}
                </h4>
                <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                  {t.emptySubtitle}
                </p>
              </div>
            ) : (
              displayedNotifications.map((n) => {
                const isSuccess = n.type === 'success'
                const isWarning = n.type === 'warning'
                const isError = n.type === 'error'
                const isInfo = n.type === 'info'

                return (
                  <div
                    key={n.id}
                    onClick={() => onMarkOneRead(n.id)}
                    className={`relative p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer group flex items-start gap-3 ${
                      n.read
                        ? 'bg-white/80 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                        : isSuccess
                        ? 'bg-emerald-500/10 dark:bg-emerald-950/20 border-emerald-500/30 text-slate-800 dark:text-slate-100 shadow-xs'
                        : isWarning
                        ? 'bg-amber-500/10 dark:bg-amber-950/20 border-amber-500/30 text-slate-800 dark:text-slate-100'
                        : isError
                        ? 'bg-rose-500/10 dark:bg-rose-950/20 border-rose-500/30 text-slate-800 dark:text-slate-100'
                        : 'bg-teal-500/10 dark:bg-teal-950/20 border-teal-500/30 text-slate-800 dark:text-slate-100 shadow-xs'
                    }`}
                  >
                    {/* Icon */}
                    <div className="shrink-0 mt-0.5">
                      {isSuccess && (
                        <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      )}
                      {isWarning && (
                        <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                      )}
                      {isError && (
                        <div className="w-7 h-7 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                          <AlertCircle className="w-4 h-4" />
                        </div>
                      )}
                      {isInfo && (
                        <div className="w-7 h-7 rounded-xl bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                          <Info className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-6">
                      <p className="text-xs font-semibold leading-relaxed break-words">
                        {n.message}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                        <Clock className="w-3 h-3" />
                        <span>{n.timestamp || t.now}</span>
                        {!n.read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#17A884] animate-pulse" />
                        )}
                      </div>
                    </div>

                    {/* Delete single button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteOne(n.id)
                      }}
                      className="absolute top-3 right-3 p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-700 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title="Удалить оповещение"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer note */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-[#17A884]" />
              Zero-Retention & Live Events
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={onClose}
              className="text-xs font-bold"
            >
              {t.close}
            </Button>
          </div>
        </aside>
      </div>
    </div>
  )
}
