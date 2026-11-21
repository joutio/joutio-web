import type { UserRefView } from '@joutio/client/api-types'
import { ProhibitIcon, WarningCircleIcon } from '@phosphor-icons/react'
import { useBlockedPlayers, useBlockPlayer } from '@/features/block'
import { usePlayerIdentity } from '@/features/me'
import { useT } from '@/lib/i18n'
import { useUserAvatar } from '@/shared/avatar'
import { ROUTES } from '@/shared/routes'
import { Button, EmptyState, PlayerRow, Skeleton } from '@/ui'
import { Group, SettingsScreen } from './settings-screen'

/**
 * Joueurs bloqués (`reglages.md` § 1, Confidentialité et sécurité ; lab `reglages.tsx`) : un `PlayerRow` par joueur avec
 * « Débloquer », qui retire la ligne tout de suite ; `EmptyState` quand la liste est vide.
 */
export function BlockedPlayersPage() {
  const t = useT()
  const blocked = useBlockedPlayers()
  const players = blocked.data ?? []
  return (
    <SettingsScreen title={t('privacy.blocked')} parent={{ path: ROUTES.settingsPage('privacy'), label: t('settings.privacyCategory') }}>
      {blocked.isPending ? (
        <Skeleton shape="row" />
      ) : blocked.isError ? (
        <EmptyState
          icon={WarningCircleIcon}
          title={t('social.errorTitle')}
          description={t('home.errorText')}
          action={
            <Button loading={blocked.isRefetching} onClick={() => void blocked.refetch()}>
              {t('common.retry')}
            </Button>
          }
        />
      ) : players.length === 0 ? (
        <EmptyState icon={ProhibitIcon} title={t('privacy.blockedEmpty')} description={t('privacy.blockedEmptyText')} />
      ) : (
        <Group footer={t('privacy.blockedFooter')}>
          {players.map((player, index) => (
            <BlockedRow key={player.userId} player={player} last={index === players.length - 1} />
          ))}
        </Group>
      )}
    </SettingsScreen>
  )
}

function BlockedRow({ player, last }: { player: UserRefView; last: boolean }) {
  const t = useT()
  const identity = usePlayerIdentity()
  const src = useUserAvatar(player)
  const unblock = useBlockPlayer(player)
  return (
    <PlayerRow
      name={player.pseudonym}
      premium={identity.premium(player)}
      src={src}
      onClick={identity.open(player.userId)}
      cta={{ label: t('player.unblock'), onClick: () => unblock.mutate(false) }}
      last={last}
    />
  )
}
