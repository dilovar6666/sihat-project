import * as React from 'react'
import { cn } from '../../lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'emerald' | 'cyan'
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const base = 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2'
  
  const variants = {
    default: 'liquid-glass-emerald text-white shadow-xs',
    emerald: 'border-emerald-500/35 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 backdrop-blur-md shadow-2xs',
    cyan: 'border-cyan-500/35 bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 backdrop-blur-md shadow-2xs',
    secondary: 'liquid-glass-pill text-zinc-900 dark:text-zinc-100',
    destructive: 'border-red-500/30 bg-red-500/15 text-red-600 dark:text-red-400 backdrop-blur-md',
    outline: 'liquid-glass-pill text-zinc-700 dark:text-zinc-300',
  }

  return (
    <div className={cn(base, variants[variant], className)} {...props} />
  )
}
