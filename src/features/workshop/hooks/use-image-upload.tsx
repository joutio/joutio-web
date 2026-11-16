import { useRef, useState } from 'react'
import { isApiError } from '@/lib/api'
import { useT } from '@/lib/i18n'
import { isAcceptedImage, uploadImage, withImageRights } from '@/shared/media'
import { toast } from '@/shared/toast'

/**
 * Choix d'image envoyé au BFF (`POST /api/media`), pour la vignette, le pictogramme et les questions. `png` : PNG seul,
 * sans recadrage, pour garder la transparence du pictogramme.
 */
export function useImageUpload(onUploaded: (url: string) => void, png = false) {
  const t = useT()
  const input = useRef<HTMLInputElement>(null)
  // Avancement de l'envoi (0 à 100) ; `undefined` hors envoi.
  const [progress, setProgress] = useState<number | undefined>(undefined)
  const upload = async (file: File | undefined) => {
    if (!file) return
    if (!isAcceptedImage(file, png)) {
      toast.error(t('settings.imageError'), t(png ? 'workshop.pngRule' : 'settings.imageRule'))
      return
    }
    setProgress(0)
    try {
      onUploaded((await uploadImage(file, setProgress)).url)
    } catch (error) {
      toast.error(t('settings.imageError'), (isApiError(error) && error.detail) || t('settings.imageRule'))
    } finally {
      setProgress(undefined)
    }
  }
  const field = (
    <input
      ref={input}
      type="file"
      accept={png ? 'image/png' : 'image/jpeg,image/png'}
      hidden
      onChange={(event) => {
        void upload(event.target.files?.[0])
        event.target.value = ''
      }}
    />
  )
  const uploading = progress !== undefined
  return {
    uploading,
    progress,
    /** Consigne de l'`ImagePicker` pendant l'envoi : « Envoi de l'image · 42 % ». */
    progressHint: uploading ? t('media.uploadingPercent', { percent: progress }) : undefined,
    pick: () => {
      if (!uploading) withImageRights(() => input.current?.click())
    },
    field,
  }
}

