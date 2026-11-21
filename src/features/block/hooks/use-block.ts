import { applyBlock, blockedPlayersQuery, blockKeys, optimisticUpdate } from '@joutio/client/query'
import { ProhibitIcon } from '@phosphor-icons/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMe } from '@/features/me'
import { api } from '@/lib/api'
import { useT } from '@/lib/i18n'
import { showDialog } from '@/shared/dialog'
import { toast } from '@/shared/toast'
import { blockService } from '../lib/block-service'

/** Mes joueurs bloqués (`GET /api/me/blocked`), Réglages › Confidentialité. */
export function useBlockedPlayers() {
  return useQuery(blockedPlayersQuery(api))
}

/**
 * Bloquer / débloquer un joueur, **optimiste et sans relecture** (`donnees-et-etat.md` § Mutations) : `applyBlock`
 * applique l'effet symétrique du serveur à toutes les vues en cache (fiche, compteurs, listes Social, défis en attente,
 * bloqués), restaurées si refus.
 */
export function useBlockPlayer(player: { userId: string; pseudonym: string }) {
  const client = useQueryClient()
  const t = useT()
  const meId = useMe().data?.userId ?? ''
  return useMutation({
    mutationFn: (block: boolean) => blockService.block(player.userId, block),
    onMutate: (block: boolean) => optimisticUpdate(client, blockKeys(meId, player.userId), () => applyBlock(client, meId, player.userId, block)),
    onSuccess: (_data, block) => toast.success(t(block ? 'player.blockedToast' : 'player.unblockedToast', { name: player.pseudonym })),
    onError: (_error, block, context) => {
      context?.rollback()
      toast.error(t(block ? 'player.blockError' : 'player.unblockError'), t('home.errorText'))
    },
  })
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
