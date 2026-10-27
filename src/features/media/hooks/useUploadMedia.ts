import { useMutation } from "@tanstack/react-query"
import { mediaService } from "../lib/media"
import type { MediaUpload } from "../domain/media"

/** Upload d'une image vers le BFF (MinIO) — l'appelant attache ensuite l'URL retournée. */
export function useUploadMedia() {
  return useMutation<MediaUpload, Error, File>({
    mutationFn: (file) => mediaService.upload(file),
  })
}
