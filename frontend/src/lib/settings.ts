import { useState, useEffect } from 'react'

export interface PlatformSettings {
  /**
   * Автоматическое сохранение результатов в архив:
   * false (по умолчанию): результаты тестов НЕ записываются автоматически в базу. Пользователь сам решает: нажать «Сохранить в профиль» или сбросить.
   * true: результат автоматически записывается в базу профиля по завершении упражнения.
   */
  autoSaveResults: boolean

  /**
   * Совместимость с legacy-кодом (инверсия autoSaveResults):
   * true = сохранение только с согласия (autoSaveResults = false)
   * false = автосохранение включено (autoSaveResults = true)
   */
  privacyShield: boolean

  /**
   * Включать паспорт методики в PDF-отчёт и детальные протоколы:
   * true (по умолчанию): добавлять научный первоисточник (PubMed/ISO), валидность и ограничения оборудования.
   * false: формировать компактный протокол без раздела паспорта методики и ограничений оборудования.
   */
  pdfIncludeMethodology: boolean

  /**
   * Звуковое сопровождение в тестах:
   * true (по умолчанию): звуковая обратная связь при ответах, завершении тестов и генерация частот в тестах слуха.
   * false: полная тишина (отключение всех звуковых сигналов и Web Audio API).
   */
  soundEnabled: boolean
}

export const STORAGE_KEYS = {
  autoSaveResults: 'sihat_setting_auto_save',
  privacyShield: 'sihat_setting_privacy_shield',
  pdfIncludeMethodology: 'sihat_setting_pdf_methodology',
  soundEnabled: 'sihat_setting_sound_enabled',
} as const

export function getPlatformSettings(): PlatformSettings {
  if (typeof window === 'undefined') {
    return {
      autoSaveResults: false,
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

  let autoSaveVal = false
  try {
    const rawAuto = localStorage.getItem(STORAGE_KEYS.autoSaveResults)
    if (rawAuto !== null) {
      autoSaveVal = rawAuto === 'true'
    } else {
      // Default is strictly false: no unexpected autosaves
      autoSaveVal = false
    }
  } catch {
    autoSaveVal = false
  }

  return {
    autoSaveResults: autoSaveVal,
    privacyShield: !autoSaveVal,
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
    if (key === 'autoSaveResults') {
      localStorage.setItem(STORAGE_KEYS.autoSaveResults, String(value))
      localStorage.setItem(STORAGE_KEYS.privacyShield, String(!value))
    } else if (key === 'privacyShield') {
      localStorage.setItem(STORAGE_KEYS.privacyShield, String(value))
      localStorage.setItem(STORAGE_KEYS.autoSaveResults, String(!value))
    } else {
      localStorage.setItem(STORAGE_KEYS[key], String(value))
    }
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
    setSettings((prev) => {
      if (key === 'autoSaveResults') {
        return { ...prev, autoSaveResults: Boolean(value), privacyShield: !value }
      }
      if (key === 'privacyShield') {
        return { ...prev, privacyShield: Boolean(value), autoSaveResults: !value }
      }
      return { ...prev, [key]: value }
    })
  }

  return [settings, updateSetting]
}
