import { api } from '@/lib/api'
import { translate, useLanguageStore } from '@/lib/i18n'
import { showDialog } from '@/shared/dialog'

/** Version des CGU dont relève la déclaration de droits (`joutio-landing/src/data/legal.ts`). */
export const TERMS_VERSION = '2026-11-15'

const RIGHTS_KEY = 'joutio.image-rights'
const rightsDeclared = () => {
  try {
    return sessionStorage.getItem(RIGHTS_KEY) === TERMS_VERSION
  } catch {
    return false
  }
}

/**
 * Déclaration de droits avant de choisir une image (CGU, cadre LCEN/DSA) : demandée une fois par session, puis `open`
 * ouvre le sélecteur dans le geste de l'utilisateur.
 */
export function withImageRights(open: () => void) {
  if (rightsDeclared()) return open()
  const t = (key: Parameters<typeof translate>[1]) => translate(useLanguageStore.getState().language, key)
  showDialog({
    sheet: true,
    title: t('rights.required'),
    message: t('rights.declaration'),
    actions: [
      {
        label: t('rights.confirm'),
        variant: 'filled',
        onClick: () => {
          try {
            sessionStorage.setItem(RIGHTS_KEY, TERMS_VERSION)
          } catch {
            // Session privée : la déclaration sera redemandée.
          }
          open()
        },
      },
      { label: t('common.cancel'), variant: 'plain', tone: 'neutral' },
    ],
  })
}

/** Image publiée dans MinIO par le BFF (`POST /api/media`). */
export interface MediaView {
  id: string
  url: string
}

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024

/** JPG ou PNG de 5 Mo au plus ; `png` : PNG seul (pictogramme, transparence gardée). */
export const isAcceptedImage = (file: File, png = false) => (png ? file.type === 'image/png' : ['image/jpeg', 'image/png'].includes(file.type)) && file.size <= MAX_IMAGE_BYTES

/**
 * Envoie une image au BFF, unique voie d'écriture des médias (normalisation, quota par joueur). `onProgress` reçoit
 * l'avancement de l'envoi, de 0 à 100.
 */
export function uploadImage(file: File, onProgress?: (percent: number) => void): Promise<MediaView> {
  const form = new FormData()
  form.append('file', file)
  // L'auteur a déclaré détenir les droits (`withImageRights`) : le BFF conserve la déclaration avec l'image.
  form.append('rightsDeclared', 'true')
  form.append('termsVersion', TERMS_VERSION)
  return api.post<MediaView>('/api/media', form, onProgress ? { onUploadProgress: (fraction) => onProgress(Math.round(fraction * 100)) } : undefined)
}
