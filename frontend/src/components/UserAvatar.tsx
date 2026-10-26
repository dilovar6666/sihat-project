import React from 'react'
import type { UserProfile } from '../types'

export const PRESET_AVATARS = [
  { id: 'avatar:doctor-emerald', emoji: '👨‍⚕️', label: 'Клиницист', bg: 'from-emerald-500 to-teal-700' },
  { id: 'avatar:scientist-teal', emoji: '👩‍🔬', label: 'Исследователь', bg: 'from-teal-500 to-cyan-700' },
  { id: 'avatar:brain-indigo', emoji: '🧠', label: 'Нейробиолог', bg: 'from-indigo-500 to-purple-700' },
  { id: 'avatar:dna-purple', emoji: '🧬', label: 'Генетик', bg: 'from-purple-500 to-fuchsia-700' },
  { id: 'avatar:eye-cyan', emoji: '👁', label: 'Офтальмолог', bg: 'from-cyan-500 to-blue-700' },
  { id: 'avatar:ear-sky', emoji: '👂', label: 'Аудиолог', bg: 'from-sky-500 to-indigo-700' },
  { id: 'avatar:heart-rose', emoji: '🩺', label: 'Кардиолог', bg: 'from-rose-500 to-red-700' },
  { id: 'avatar:pulse-amber', emoji: '⚡', label: 'Биохакер', bg: 'from-amber-500 to-orange-700' },
  { id: 'avatar:shield-emerald', emoji: '🛡', label: 'Защитник приватности', bg: 'from-emerald-600 to-green-800' },
  { id: 'avatar:robot-blue', emoji: '🤖', label: 'ИИ-Ассистент', bg: 'from-blue-500 to-teal-700' },
  { id: 'avatar:lotus-teal', emoji: '🧘', label: 'Психофизиолог', bg: 'from-teal-600 to-emerald-800' },
  { id: 'avatar:microscope-green', emoji: '🔬', label: 'Биохимик', bg: 'from-emerald-500 to-lime-700' },
]

interface UserAvatarProps {
  user: UserProfile | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showBadge?: boolean
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  size = 'md',
  className = '',
  showBadge = false,
}) => {
  const sizeMap = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-24 h-24 text-3xl',
  }

  const dimension = sizeMap[size] || sizeMap.md

  if (!user) {
    return (
      <div
        className={`${dimension} rounded-2xl bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 flex items-center justify-center font-bold ${className}`}
      >
        👤
      </div>
    )
  }

  const avatarUrl = user.avatar_url || ''

  // 1. Check if user avatar is one of the preset avatars
  const matchedPreset = PRESET_AVATARS.find((p) => p.id === avatarUrl)

  // 2. Check if avatar is an uploaded image (data URL or http/relative link)
  const isCustomImage =
    avatarUrl.startsWith('data:image') ||
    avatarUrl.startsWith('http://') ||
    avatarUrl.startsWith('https://') ||
    avatarUrl.startsWith('/')

  return (
    <div className="relative inline-block">
      {isCustomImage ? (
        <img
          src={avatarUrl}
          alt={user.full_name || user.email || 'User'}
          className={`${dimension} rounded-2xl object-cover border-2 border-emerald-500/30 shadow-md ${className}`}
        />
      ) : matchedPreset ? (
        <div
          className={`${dimension} rounded-2xl bg-gradient-to-tr ${matchedPreset.bg} text-white flex items-center justify-center shadow-md border-2 border-white/20 select-none ${className}`}
        >
          <span>{matchedPreset.emoji}</span>
        </div>
      ) : (
        <div
          className={`${dimension} rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-600/25 border-2 border-white/20 select-none ${className}`}
        >
          {user.full_name
            ? user.full_name.charAt(0).toUpperCase()
            : user.email
            ? user.email.charAt(0).toUpperCase()
            : user.phone
            ? user.phone.slice(-2)
            : 'U'}
        </div>
      )}

      {showBadge && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 ${
            size === 'xl' ? 'w-5 h-5 border-3' : size === 'lg' ? 'w-4 h-4 border-2' : 'w-2.5 h-2.5 border-2'
          } rounded-full bg-emerald-500 border-white dark:border-zinc-950 shadow-xs`}
          title="В сети • Zero-Retention"
        />
      )}
    </div>
  )
}
