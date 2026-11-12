import { useRef, useState } from 'react'
import { isApiError } from '@/lib/api'
import { useT } from '@/lib/i18n'
import { isAcceptedImage, uploadImage } from '@/shared/media'
import { toast } from '@/shared/toast'

/**
 * Choix d'image envoyé au BFF (`POST /api/media`), pour la vignette, le pictogramme et les questions. `png` : PNG seul,
 * sans recadrage, pour garder la transparence du pictogramme.
 */
export function useImageUpload(onUploaded: (url: string) => void, png = false) {
  const t = useT()
  const input = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const upload = async (file: File | undefined) => {
    if (!file) return
    if (!isAcceptedImage(file, png)) {
      toast.error(t('settings.imageError'), t(png ? 'workshop.pngRule' : 'settings.imageRule'))
      return
    }
    setUploading(true)
    try {
      onUploaded((await uploadImage(file)).url)
    } catch (error) {
      toast.error(t('settings.imageError'), (isApiError(error) && error.detail) || t('settings.imageRule'))
    } finally {
      setUploading(false)
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
  return { uploading, pick: () => input.current?.click(), field }
}

