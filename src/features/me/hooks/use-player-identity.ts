import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@/shared/routes'
import { useMe } from './use-me'

/** Vue joueur du BFF : `premium` n'y figure pas encore partout (seulement `MeView` et les membres d'équipe). */
type PlayerLike = object | null | undefined

const field = (player: PlayerLike, key: 'userId' | 'premium'): unknown => (player && key in player ? (player as Record<string, unknown>)[key] : undefined)

/**
 * Identité d'un joueur à l'écran (`design/specs/components/primitives.md` § Identité d'un joueur) :
 * - `premium` : `PremiumBadge` après le pseudonyme. Le joueur connecté suit `me.premium` ; les autres, le champ
 *   `premium` de leur vue dès que le BFF l'expose (front d'abord, décision du 2026-11-12) ;
 * - `open` : action qui ouvre la fiche du joueur (le Profil pour soi), à passer en `onOpen` / `onClick`. Les écrans
 *   immersifs (duel, salon, matchmaking) ne l'utilisent pas.
 */
export function usePlayerIdentity() {
  const navigate = useNavigate()
  const me = useMe().data
  const myId = me?.userId ?? null
  const myPremium = me?.premium === true

  const premium = useCallback(
    (player: PlayerLike, userId?: string | null) => {
      const id = userId ?? (field(player, 'userId') as string | null | undefined) ?? null
      if (id && id === myId) return myPremium
      return field(player, 'premium') === true
    },
    [myId, myPremium],
  )

  const open = useCallback(
    (userId: string | null | undefined): (() => void) | undefined => {
      if (!userId) return undefined
      return () => void navigate(userId === myId ? ROUTES.me : ROUTES.player(userId))
    },
    [myId, navigate],
  )

  return { premium, open, myId, myPremium }
}
