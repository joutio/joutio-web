import { api } from "@/lib/api"
import { ENDPOINTS } from "@/lib/endpoints"
import type { MediaUpload } from "../domain/media"

/**
 * Téléverse une image sur le BFF (`POST /api/media`, multipart) : validation, normalisation
 * (JPEG/PNG, max 1600 px) et stockage objet côté serveur. L'URL retournée est ensuite attachée
 * aux entités via les endpoints existants.
 */
export const mediaService = {
  upload(file: File): Promise<MediaUpload> {
    const formData = new FormData()
    formData.append("file", file)
    return api.upload<MediaUpload>(ENDPOINTS.media.upload, formData)
  },
}
