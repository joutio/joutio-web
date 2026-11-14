import { buildShareUrl, type ShareKind } from '@joutio/client-domain/share'
import { useCallback } from 'react'
import { useShareStore } from './share-store'

export interface ShareTarget {
  kind: ShareKind
  /** Identifiant du joueur, du sujet, du salon. */
  id: string
  text: string
  title: string
}

/** Navigateur mobile qui propose la feuille de partage du système. */
export const canShareNatively = () =>
  typeof navigator !== 'undefined' && typeof navigator.share === 'function' && window.matchMedia?.('(pointer: coarse)').matches === true

/**
 * Partage d'un contenu (`design/specs/screens/partage.md` § 4) : lien universel.
 * Navigateur mobile : feuille du système ; ordinateur : feuille « Partager » (lien, QR code, stores).
 */
export function useShare() {
  const open = useShareStore((state) => state.open)
  return useCallback(
    ({ kind, id, text, title }: ShareTarget) => {
      const url = buildShareUrl({ kind, id })
      if (canShareNatively()) {
        void navigator.share({ title, text, url }).catch(() => undefined)
        return
      }
      open({ url, text, title })
    },
    [open],
  )
}
