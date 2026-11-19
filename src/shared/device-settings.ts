import { create } from 'zustand'

/**
 * Réglages locaux à l'appareil (`reglages.md` § 6) : sons du duel, icônes et points des réponses. Les notifications
 * sont des préférences serveur (`/api/notification-preferences`).
 */
export type DeviceSettings = {
  sound: boolean
  /** `AnswerCard` `details` dans le duel ; désactivé par défaut (opt-in, `reglages.md` § 1). */
  answerDetails: boolean
}

const KEY = 'joutio.deviceSettings'
const DEFAULTS: DeviceSettings = { sound: true, answerDetails: false }

function read(): DeviceSettings {
  try {
    const value = localStorage.getItem(KEY)
    return value ? { ...DEFAULTS, ...(JSON.parse(value) as Partial<DeviceSettings>) } : DEFAULTS
  } catch {
    return DEFAULTS
  }
}

export const useDeviceSettings = create<DeviceSettings & { set: <K extends keyof DeviceSettings>(key: K, value: DeviceSettings[K]) => void }>((set, get) => ({
  ...read(),
  set: (key, value) => {
    set({ [key]: value } as Pick<DeviceSettings, typeof key>)
    const { sound, answerDetails } = get()
    try {
      localStorage.setItem(KEY, JSON.stringify({ sound, answerDetails }))
    } catch {
      // Sans stockage, le réglage vaut pour la session.
    }
  },
}))
