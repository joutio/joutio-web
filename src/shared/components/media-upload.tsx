import { useRef, useState, type ChangeEvent } from "react"
import { useTranslation } from "react-i18next"
import { Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useUploadMedia } from "@/features/media"
import { cn } from "@/lib/utils"
import type { ApiError } from "@/shared/types/api"

interface MediaUploadProps {
  /** URL courante de l'image (`null` = aucune). */
  value: string | null
  onChange: (url: string | null) => void
  /** Ratio de l'aperçu (classe Tailwind), ex. `aspect-video` (bannière) ou `aspect-square`. */
  aspectClassName?: string
  disabled?: boolean
  /** Dimension maximale du pré-redimensionnement client (px). */
  maxDimension?: number
  /** Afficher le repli « coller une URL » (désactivé quand la sauvegarde est immédiate). */
  allowUrlInput?: boolean
}

/** Réduit l'image côté client (canvas) pour alléger l'envoi ; le serveur normalise ensuite. */
async function prepareFile(file: File, maxDimension: number): Promise<File> {
  if (!file.type.startsWith("image/")) {
    return file
  }
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(
      1,
      maxDimension / Math.max(bitmap.width, bitmap.height)
    )
    if (scale >= 1 && file.size <= 1_500_000) {
      bitmap.close()
      return file
    }
    const canvas = document.createElement("canvas")
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))
    const context = canvas.getContext("2d")
    if (!context) {
      bitmap.close()
      return file
    }
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()
    const keepAlpha = file.type !== "image/jpeg"
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, keepAlpha ? "image/png" : "image/jpeg", 0.85)
    )
    if (!blob) {
      return file
    }
    const extension = keepAlpha ? ".png" : ".jpg"
    const name = file.name.replace(/\.[^.]+$/, "") + extension
    return new File([blob], name, { type: blob.type })
  } catch {
    // Format non décodable par le navigateur (ex. HEIC) : le serveur tranche avec un message clair.
    return file
  }
}

/**
 * Champ d'image réutilisable (couverture de sujet, bannière, illustration de question) :
 * téléversement multipart vers le BFF/MinIO avec aperçu, pré-redimensionnement client,
 * suppression, et repli « coller une URL ».
 */
export function MediaUpload({
  value,
  onChange,
  aspectClassName = "aspect-video",
  disabled = false,
  maxDimension = 1600,
  allowUrlInput = true,
}: MediaUploadProps) {
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const upload = useUploadMedia()

  const uploading = upload.isPending

  const messageFor = (cause: Error): string => {
    const apiError = cause as ApiError
    const type = apiError.type ?? ""
    if (apiError.statusCode === 413 || type.endsWith(":tooLarge")) {
      return t("shared.media.errors.tooLarge")
    }
    if (apiError.statusCode === 429 || type.endsWith(":quotaExceeded")) {
      return t("shared.media.errors.quota")
    }
    if (apiError.statusCode === 503 || type.endsWith(":storageUnavailable")) {
      return t("shared.media.errors.storage")
    }
    if (type.endsWith(":unsupportedFormat")) {
      return t("shared.media.errors.unsupported")
    }
    if (apiError.statusCode === 400 || type.endsWith(":invalidImage")) {
      return t("shared.media.errors.invalid")
    }
    return t("shared.media.errors.failed")
  }

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) {
      return
    }
    setError(null)
    try {
      const prepared = await prepareFile(file, maxDimension)
      const media = await upload.mutateAsync(prepared)
      onChange(media.url)
    } catch (cause) {
      setError(messageFor(cause as Error))
    }
  }

  return (
    <div className="space-y-2">
      {/* Aperçu uniquement quand une image est disponible : jamais de cadre vide. */}
      {value ? (
        <div
          className={cn(
            "relative overflow-hidden rounded-lg border bg-muted/30",
            aspectClassName
          )}
        >
          <img
            src={value}
            alt={t("shared.media.previewAlt")}
            className="absolute inset-0 h-full w-full object-cover"
          />
          {uploading ? (
            <div className="absolute inset-0 grid place-items-center bg-background/60">
              <Loader2 className="size-5 animate-spin" aria-hidden />
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png"
          className="hidden"
          onChange={(event) => void handleFile(event)}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading
            ? t("shared.media.uploading")
            : value
              ? t("shared.media.change")
              : t("shared.media.upload")}
        </Button>
        {value ? (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={disabled || uploading}
            onClick={() => {
              setError(null)
              onChange(null)
            }}
          >
            <X className="size-4" aria-hidden />
            {t("shared.media.remove")}
          </Button>
        ) : null}
      </div>

      {allowUrlInput ? (
        <Input
          value={value ?? ""}
          onChange={(event) =>
            onChange(event.target.value.trim() ? event.target.value : null)
          }
          placeholder={t("shared.media.urlPlaceholder")}
          aria-label={t("shared.media.urlLabel")}
          disabled={disabled || uploading}
        />
      ) : null}
      <p className="text-xs text-muted-foreground">{t("shared.media.hint")}</p>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}
