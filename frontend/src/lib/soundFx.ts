import { getPlatformSettings } from './settings'

let sharedAudioCtx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    if (!sharedAudioCtx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) {
        sharedAudioCtx = new AudioCtx()
      }
    }
    if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
      void sharedAudioCtx.resume()
    }
    return sharedAudioCtx
  } catch {
    return null
  }
}

/**
 * Play a short subtle pleasant click tone
 */
export function playSoundTick(): void {
  const settings = getPlatformSettings()
  if (!settings.soundEnabled) return

  const ctx = getAudioContext()
  if (!ctx) return

  try {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(600, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.04)

    gain.gain.setValueAtTime(0.08, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.045)
  } catch {
    // ignore
  }
}

/**
 * Play pleasant success chime (correct target hit, correct answer)
 */
export function playSoundSuccess(): void {
  const settings = getPlatformSettings()
  if (!settings.soundEnabled) return

  const ctx = getAudioContext()
  if (!ctx) return

  try {
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(523.25, now) // C5
    osc.frequency.setValueAtTime(659.25, now + 0.07) // E5

    gain.gain.setValueAtTime(0.001, now)
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.02)
    gain.gain.setValueAtTime(0.12, now + 0.07)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(now + 0.23)
  } catch {
    // ignore
  }
}

/**
 * Play subtle soft error tone (misclick)
 */
export function playSoundError(): void {
  const settings = getPlatformSettings()
  if (!settings.soundEnabled) return

  const ctx = getAudioContext()
  if (!ctx) return

  try {
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(220, now) // A3
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.12)

    gain.gain.setValueAtTime(0.001, now)
    gain.gain.exponentialRampToValueAtTime(0.1, now + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(now + 0.15)
  } catch {
    // ignore
  }
}

/**
 * Play celebration / test completion fanfare
 */
export function playSoundComplete(): void {
  const settings = getPlatformSettings()
  if (!settings.soundEnabled) return

  const ctx = getAudioContext()
  if (!ctx) return

  try {
    const notes = [523.25, 659.25, 783.99, 1046.5] // C5, E5, G5, C6
    const now = ctx.currentTime
    notes.forEach((freq, idx) => {
      const start = now + idx * 0.08
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, start)

      gain.gain.setValueAtTime(0.001, start)
      gain.gain.exponentialRampToValueAtTime(0.12, start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(start)
      osc.stop(start + 0.24)
    })
  } catch {
    // ignore
  }
}
