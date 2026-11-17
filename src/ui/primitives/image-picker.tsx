import { ImageIcon, TrashIcon } from '@phosphor-icons/react'
import { cn } from '../lib/cn'
import { IconButton } from './icon-button'
import { ProgressBar } from './progress-bar'
import { useT } from '@/lib/i18n'

const HATCH = 'repeating-linear-gradient(45deg, var(--jo-surface) 0 8px, var(--jo-raised) 8px 16px)'

export type ImagePickerProps = {
  /** Image choisie. */
  image?: string
  /** Consigne de l'état vide. */
  hint?: string
  error?: string
  /**
   * Envoi en cours, de 0 à 100 (2026-11-16) : barre de progression sous la consigne, choix et retrait inactifs. La
   * consigne dit alors l'avancement (« Envoi de l'image · 42 % »).
   */
  progress?: number
  onPick?: () => void
  onRemove?: () => void
  className?: string
}

/** Choix d'une image, facultative. Le sélecteur de fichier appartient à l'écran. */
export function ImagePicker({ image, hint: ownHint, error, progress, onPick, onRemove, className }: ImagePickerProps) {
  const t = useT()
  const hint = ownHint ?? t('ds.addImage')
  const uploading = progress !== undefined
  return (
    <div className={cn('grid gap-1', className)}>
      {image ? (
        <div className="relative h-40 overflow-hidden rounded-jo-md">
          <img src={image} alt="" className="size-full object-cover" />
          {!uploading && <IconButton icon={TrashIcon} label={t('ds.removeImage')} media size="S" className="absolute top-2 right-2" onClick={onRemove} />}
          {uploading && (
            <div className="absolute inset-x-2 bottom-2 grid gap-1 rounded-jo-sm bg-jo-surface/90 px-3 py-2 text-jo-text">
              <span className="jo-type-caption">{hint}</span>
              <ProgressBar value={progress} ariaLabel={hint} />
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={onPick}
          disabled={uploading}
          aria-busy={uploading || undefined}
          style={{ backgroundImage: HATCH }}
          className={cn('jo-transition jo-focus jo-type-caption grid h-24 w-full cursor-pointer place-items-center gap-1 rounded-jo-md px-4 text-center text-jo-muted jo-pressed:opacity-70', error && 'ring-2 ring-jo-wrong')}
        >
          <span className="grid justify-items-center gap-1">
            <ImageIcon size={20} aria-hidden />
            {hint}
            {uploading && <ProgressBar value={progress} ariaLabel={hint} className="w-40" />}
          </span>
        </button>
      )}
      {error && <span className="jo-type-caption text-jo-wrong">{error}</span>}
    </div>
  )
}
