import { api } from '@/lib/api'

/** Image publiée dans MinIO par le BFF (`POST /api/media`). */
export interface MediaView {
  id: string
  url: string
}

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024

/** JPG ou PNG de 5 Mo au plus ; `png` : PNG seul (pictogramme, transparence gardée). */
export const isAcceptedImage = (file: File, png = false) => (png ? file.type === 'image/png' : ['image/jpeg', 'image/png'].includes(file.type)) && file.size <= MAX_IMAGE_BYTES

/** Envoie une image au BFF, unique voie d'écriture des médias (normalisation, quota par joueur). */
export function uploadImage(file: File): Promise<MediaView> {
  const form = new FormData()
  form.append('file', file)
  return api.post<MediaView>('/api/media', form)
}
