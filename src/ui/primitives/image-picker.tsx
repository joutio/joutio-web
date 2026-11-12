import { ImageIcon, TrashIcon } from '@phosphor-icons/react'
import { cn } from '../lib/cn'
import { IconButton } from './icon-button'

const HATCH = 'repeating-linear-gradient(45deg, var(--jo-surface) 0 8px, var(--jo-raised) 8px 16px)'

export type ImagePickerProps = {
  /** Image choisie. */
  image?: string
  /** Consigne de l'état vide. */
  hint?: string
  error?: string
  onPick?: () => void
  onRemove?: () => void
  className?: string
}

/** Choix d'une image, facultative. Le sélecteur de fichier appartient à l'écran. */
export function ImagePicker({ image, hint = 'Ajouter une image · facultatif · JPG ou PNG, 5 Mo', error, onPick, onRemove, className }: ImagePickerProps) {
  return (
    <div className={cn('grid gap-1', className)}>
      {image ? (
        <div className="relative h-40 overflow-hidden rounded-jo-md">
          <img src={image} alt="" className="size-full object-cover" />
          <IconButton icon={TrashIcon} label="Retirer l'image" media size="S" className="absolute top-2 right-2" onClick={onRemove} />
        </div>
      ) : (
        <button
          type="button"
          onClick={onPick}
          style={{ backgroundImage: HATCH }}
          className={cn('jo-transition jo-focus jo-type-caption grid h-24 w-full cursor-pointer place-items-center gap-1 rounded-jo-md px-4 text-center text-jo-muted jo-pressed:opacity-70', error && 'ring-2 ring-jo-wrong')}
        >
          <span className="grid justify-items-center gap-1">
            <ImageIcon size={20} aria-hidden />
            {hint}
          </span>
        </button>
      )}
      {error && <span className="jo-type-caption text-jo-wrong">{error}</span>}
    </div>
  )
}
