import { useState, useEffect } from 'react'

export interface PlatformSettings {
  /**
   * Сохранение только с явного согласия:
   * true (по умолчанию): результаты упражнений не записываются в базу без ручного нажатия «Сохранить».
   * false (автосохранение): после завершения упражнения авторизованным пользователем результат автоматически записывается в архив.
   */
  privacyShield: boolean

  /**
   * Включать паспорт методики в PDF-отчёт:
   * true (по умолчанию): добавлять научный первоисточник (PubMed/ISO), валидность и ограничения оборудования в PDF.
   * false: формировать компактный протокол без раздела паспорта методики и ограничений оборудования.
   */
  pdfIncludeMethodology: boolean

  /**
   * Звуковое сопровождение в тестах:
   * true (по умолчанию): разрешить синтез аудиосигналов и частот Web Audio API в тестах слуха.
   * false: отключить генерацию звука и предупреждать пользователя в слуховых тестах.
   */
  soundEnabled: boolean
}

export const STORAGE_KEYS = {
  privacyShield: 'sihat_setting_privacy_shield',
  pdfIncludeMethodology: 'sihat_setting_pdf_methodology',
  soundEnabled: 'sihat_setting_sound_enabled',
} as const

export function getPlatformSettings(): PlatformSettings {
  if (typeof window === 'undefined') {
    return {
      privacyShield: true,
      pdfIncludeMethodology: true,
      soundEnabled: true,
    }
  }

  const parseBool = (key: string, defaultVal: boolean): boolean => {
    try {
      const val = localStorage.getItem(key)
      if (val === null) return defaultVal
      return val === 'true'
    } catch {
      return defaultVal
    }
  }

  return {
    privacyShield: parseBool(STORAGE_KEYS.privacyShield, true),
    pdfIncludeMethodology: parseBool(STORAGE_KEYS.pdfIncludeMethodology, true),
    soundEnabled: parseBool(STORAGE_KEYS.soundEnabled, true),
  }
}

export function setPlatformSetting<K extends keyof PlatformSettings>(
  key: K,
  value: PlatformSettings[K]
): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEYS[key], String(value))
    window.dispatchEvent(
      new CustomEvent('sihat:setting_changed', {
        detail: { key, value },
      })
    )
  } catch (e) {
    console.error('Failed to set platform setting:', e)
  }
}

export function usePlatformSettings(): [
  PlatformSettings,
  <K extends keyof PlatformSettings>(key: K, value: PlatformSettings[K]) => void
] {
  const [settings, setSettings] = useState<PlatformSettings>(getPlatformSettings)

  useEffect(() => {
    const handleUpdate = () => {
      setSettings(getPlatformSettings())
    }
    window.addEventListener('storage', handleUpdate)
    window.addEventListener('sihat:setting_changed', handleUpdate as EventListener)
    return () => {
      window.removeEventListener('storage', handleUpdate)
      window.removeEventListener('sihat:setting_changed', handleUpdate as EventListener)
    }
  }, [])

  const updateSetting = <K extends keyof PlatformSettings>(key: K, value: PlatformSettings[K]) => {
    setPlatformSetting(key, value)
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  return [settings, updateSetting]
}
