import type { Language } from '../../i18n'

export interface EngineCompletionPayload {
  summary: string
  metrics: Record<string, unknown>
  telemetry?: Record<string, unknown>
}

export interface InteractiveEngineProps {
  lang: Language
  challenge?: Record<string, any> | null
  onComplete: (result: EngineCompletionPayload) => void
  onRequestNewTask?: () => void
}

export const APPROVED_16_SLUGS = [
  'attention-concentration',
  'attention-switching',
  'visual-memory',
  'short-term-memory',
  'information-processing-speed',
  'contrast-sensitivity',
  'color-perception',
  'visual-pairs',
  'path-memory',
  'pattern-matrix',
  'sound-discrimination',
  'speech-in-noise',
  'reaction-speed',
  'go-no-go',
  'mouse-eye-coordination',
  'cursor-path',
] as const

// Backward compatibility alias
export const APPROVED_15_SLUGS = APPROVED_16_SLUGS

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function noAdjacentRepeats<T>(length: number, pool: T[]): T[] {
  const out: T[] = []
  while (out.length < length) {
    const candidate = pool[Math.floor(Math.random() * pool.length)]
    if (out.length === 0 || out[out.length - 1] !== candidate) {
      out.push(candidate)
    }
  }
  return out
}
