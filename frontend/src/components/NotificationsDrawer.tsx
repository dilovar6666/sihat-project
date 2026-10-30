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
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Dimmed backdrop for click-outside */}
      <div
        className="fixed inset-0 bg-black/25 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-200 pointer-events-auto"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Floating Compact Notification Popover */}
      <aside
        aria-label="Панель уведомлений"
        className="fixed top-14 sm:top-20 left-3 right-3 sm:left-auto sm:right-16 md:right-24 w-auto sm:w-[410px] max-w-[calc(100vw-24px)] max-h-[520px] bg-white dark:bg-[#0E1715] border border-slate-200/90 dark:border-[#1E302B] rounded-3xl shadow-2xl flex flex-col overflow-hidden pointer-events-auto origin-top-right transition-all duration-250 ease-out animate-in fade-in zoom-in-95"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-[#1E302B] bg-slate-50/70 dark:bg-[#131C1A]/80">
          <div className="flex items-center justify-between gap-3 mb-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#103D35] via-[#17A884] to-[#2EC4A7] text-white flex items-center justify-center shadow-md shadow-[#17A884]/20 shrink-0">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 tracking-tight">
                    {t.title}
                  </h2>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-[#17A884] text-white text-[10px] font-bold">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">
                  {t.subtitle}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-[#1E302B] transition-colors cursor-pointer"
              aria-label={t.close}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Filter Tabs & Bulk Actions */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-1 p-0.5 rounded-xl bg-slate-200/60 dark:bg-[#0E1715] text-[11px] border border-transparent dark:border-[#1E302B]">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  filter === 'all'
                    ? 'bg-white dark:bg-[#1E302B] text-slate-900 dark:text-[#2EC4A7] shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {t.allTab} ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('unread')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  filter === 'unread'
                    ? 'bg-white dark:bg-[#1E302B] text-slate-900 dark:text-[#2EC4A7] shadow-xs'
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
                  className="p-1 rounded-lg text-slate-500 hover:text-[#17A884] hover:bg-slate-100 dark:hover:bg-[#1E302B] text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  title={t.markAllRead}
                >
                  <CheckCheck className="w-3.5 h-3.5 text-[#17A884]" />
                  <span>{t.markAllRead}</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={onClearAll}
                  className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  title={t.clearAll}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t.clearAll}</span>
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
                    className={`relative p-3 rounded-2xl border transition-all cursor-pointer group flex items-start gap-3 ${
                      n.read
                        ? 'bg-white/80 dark:bg-[#131C1A]/70 border-slate-200/60 dark:border-[#1E302B] text-slate-600 dark:text-slate-400'
                        : isSuccess
                        ? 'bg-emerald-500/10 dark:bg-emerald-950/30 border-emerald-500/30 text-slate-800 dark:text-slate-100 shadow-xs'
                        : isWarning
                        ? 'bg-amber-500/10 dark:bg-amber-950/30 border-amber-500/30 text-slate-800 dark:text-slate-100'
                        : isError
                        ? 'bg-rose-500/10 dark:bg-rose-950/30 border-rose-500/30 text-slate-800 dark:text-slate-100'
                        : 'bg-[#17A884]/10 dark:bg-[#103D35]/30 border-[#17A884]/30 text-slate-800 dark:text-slate-100 shadow-xs'
                    }`}
                  >
                    {/* Icon */}
                    <div className="shrink-0 mt-0.5">
                      {isSuccess && (
                        <div className="w-6 h-6 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                      )}
                      {isWarning && (
                        <div className="w-6 h-6 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                          <AlertTriangle className="w-3.5 h-3.5" />
                        </div>
                      )}
                      {isError && (
                        <div className="w-6 h-6 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                          <AlertCircle className="w-3.5 h-3.5" />
                        </div>
                      )}
                      {isInfo && (
                        <div className="w-6 h-6 rounded-xl bg-[#17A884]/20 text-[#17A884] dark:text-[#2EC4A7] flex items-center justify-center">
                          <Info className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-5">
                      <p className="text-xs font-semibold leading-relaxed break-words">
                        {n.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400 dark:text-slate-500 font-mono">
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
                      className="absolute top-2.5 right-2.5 p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-[#1E302B] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title="Удалить оповещение"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer note */}
          <div className="p-3.5 border-t border-slate-100 dark:border-[#1E302B] bg-slate-50/70 dark:bg-[#131C1A]/80 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-[#17A884]" />
              Zero-Retention & Live Events
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={onClose}
              className="text-xs font-bold py-1 px-3"
            >
              {t.close}
            </Button>
          </div>
        </aside>
      </div>
  )
}
