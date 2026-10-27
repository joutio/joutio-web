/** Image téléversée sur le BFF (bucket MinIO, URL publique immuable). */
export interface MediaUpload {
  id: string
  url: string
  contentType: string
  sizeBytes: number
  width: number
  height: number
}
