import type { Language, NotificationCategory, NotificationPreferenceView } from '@joutio/client-domain/api-types'
import { api, request } from '@/lib/api'

const id = encodeURIComponent

export const SETTINGS_ENDPOINTS = {
  field: (userId: string, field: 'pseudonym' | 'bio' | 'country' | 'banner' | 'language' | 'avatar-options') => `/api/profiles/${id(userId)}/${field}`,
  interests: '/api/me/interests',
  media: '/api/media',
  preferences: '/api/notification-preferences',
  preference: (category: NotificationCategory) => `/api/notification-preferences/${category}`,
  deletionCode: '/api/me/deletion-code',
  me: '/api/me',
} as const

/** Image publiée dans MinIO par le BFF (`POST /api/media`). */
export interface MediaView {
  id: string
  url: string
}

export const MAX_PSEUDONYM = 40
export const MAX_BIO = 160
export const MAX_INTERESTS = 3

/** Réglages du joueur connecté : profil, préférences de notification, suppression du compte. */
export const settingsService = {
  pseudonym: (userId: string, pseudonym: string) => api.put<void>(SETTINGS_ENDPOINTS.field(userId, 'pseudonym'), { pseudonym }),
  bio: (userId: string, bio: string | null) => api.put<void>(SETTINGS_ENDPOINTS.field(userId, 'bio'), { bio: bio || null }),
  country: (userId: string, country: string | null) => api.put<void>(SETTINGS_ENDPOINTS.field(userId, 'country'), { country }),
  banner: (userId: string, bannerUrl: string | null) => api.put<void>(SETTINGS_ENDPOINTS.field(userId, 'banner'), { bannerUrl }),
  language: (userId: string, language: Language) => api.put<void>(SETTINGS_ENDPOINTS.field(userId, 'language'), { language }),
  avatarOptions: (userId: string, avatarOptions: string | null) => api.put<void>(SETTINGS_ENDPOINTS.field(userId, 'avatar-options'), { avatarOptions }),
  interests: (interests: readonly string[]) => api.put<void>(SETTINGS_ENDPOINTS.interests, { interests }),

  /** Image JPG ou PNG de 5 Mo au plus, normalisée par le BFF. */
  upload: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post<MediaView>(SETTINGS_ENDPOINTS.media, form)
  },

  preferences: () => api.get<NotificationPreferenceView[]>(SETTINGS_ENDPOINTS.preferences),
  setPreference: (category: NotificationCategory, enabled: boolean) => api.put<void>(SETTINGS_ENDPOINTS.preference(category), { enabled }),

  requestDeletionCode: () => api.post<void>(SETTINGS_ENDPOINTS.deletionCode),
  deleteAccount: (code: string) => request<void>(SETTINGS_ENDPOINTS.me, { method: 'DELETE', body: { code } }),
}
