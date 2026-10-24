import * as React from 'react'
import { cn } from '../../lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'emerald' | 'glass'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const base = 'inline-flex items-center justify-center whitespace-nowrap rounded-2xl text-sm font-semibold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]'
    
    const variants = {
      default: 'liquid-glass-emerald text-white hover:brightness-110',
      emerald: 'liquid-glass-emerald text-white hover:brightness-110',
      destructive: 'bg-red-600/90 backdrop-blur-md border border-red-400/30 text-white shadow-md hover:bg-red-500',
      outline: 'liquid-glass-pill text-zinc-900 dark:text-zinc-100 hover:border-emerald-500/50 hover:text-emerald-600 dark:hover:text-emerald-400',
      secondary: 'liquid-glass-pill text-zinc-900 dark:text-zinc-100 hover:brightness-105',
      glass: 'liquid-glass-pill text-zinc-900 dark:text-zinc-100 hover:border-emerald-500/50',
      ghost: 'text-zinc-700 dark:text-zinc-300 hover:bg-white/40 dark:hover:bg-zinc-800/40 hover:text-emerald-500 backdrop-blur-xs',
      link: 'text-emerald-600 underline-offset-4 hover:underline dark:text-emerald-400',
    }

    const sizes = {
      default: 'h-10 px-4 py-2',
      sm: 'h-8 rounded-lg px-3 text-xs',
      lg: 'h-12 rounded-xl px-6 text-base',
      icon: 'h-9 w-9',
    }

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'
