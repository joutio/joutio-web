import { useBlockPlayer as useBlockCommand } from '@joutio/client/social'
import { ProhibitIcon } from '@phosphor-icons/react'
import { useT } from '@/lib/i18n'
import { selectUserId, useSessionStore } from '@/lib/session'
import { showDialog } from '@/shared/dialog'
import { toast } from '@/shared/toast'

/**
 * Bloquer (`block(true)`) ou débloquer (`block(false)`) un joueur : `useBlockPlayer` de `@joutio/client` applique tout de
 * suite l'effet symétrique du serveur à toutes les vues (fiche, compteurs, listes Social, défis en attente, bloqués) ;
 * l'issue s'annonce en toast.
 */
export function useBlockPlayer(player: { userId: string; pseudonym: string }) {
  const t = useT()
  const meId = useSessionStore(selectUserId) ?? ''
  const command = useBlockCommand(meId, player.userId)
  return {
    isPending: command.isPending,
    block: (block: boolean) =>
      command.mutate(block, {
        onSuccess: () => toast.success(t(block ? 'player.blockedToast' : 'player.unblockedToast', { name: player.pseudonym })),
        onError: () => toast.error(t(block ? 'player.blockError' : 'player.unblockError'), t('home.errorText')),
      }),
  }
}

/** Confirmation avant de bloquer (`fiche-joueur.md` § 2) : `Dialog` destructif, effet symétrique rappelé. */
export function useConfirmBlock() {
  const t = useT()
  return (name: string, onConfirm: () => void) =>
    showDialog({
      sheet: true,
      tone: 'danger',
      icon: ProhibitIcon,
      title: t('player.blockTitle', { name }),
      message: t('player.blockText'),
      actions: [
        { label: t('player.block'), variant: 'tinted', tone: 'destructive', onClick: onConfirm },
        { label: t('common.cancel'), variant: 'plain', tone: 'neutral' },
      ],
    })
}
