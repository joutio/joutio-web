import type { SuggestionView } from '@joutio/client-domain/api-types'
import type { TeamMember } from '@joutio/client-domain/authoring'
import { ShieldCheckIcon, TrashIcon, UserPlusIcon } from '@phosphor-icons/react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useLanguageStore, useT } from '@/lib/i18n'
import { useUserAvatar } from '@/shared/avatar'
import { showDialog } from '@/shared/dialog'
import { ROUTES } from '@/shared/routes'
import { toast } from '@/shared/toast'
import { topicName } from '@/shared/topics'
import { useBack } from '@/shared/use-back'
import { useDebounced } from '@/shared/use-debounced'
import { EmptyState, IconButton, ListRow, MobileSheet, MobileTopBar, PlayerRow, Screen, SearchField, SectionHeader, Skeleton } from '@/ui'
import { usePlayerSearch, useTeam, useTeamChange, useWorkshop } from '../hooks/use-workshop'

const CARD = 'overflow-hidden rounded-jo-lg bg-jo-surface'

function MemberRow({ member, last, onOpen }: { member: TeamMember; last: boolean; onOpen?: () => void }) {
  const t = useT()
  const src = useUserAvatar(member)
  const creator = member.role === 'CREATOR'
  return <PlayerRow name={member.pseudonym} src={src} sub={creator ? t('workshop.creator') : undefined} chevron={!creator && Boolean(onOpen)} onClick={creator ? undefined : onOpen} last={last} />
}

function CandidateRow({ player, last, onPick }: { player: SuggestionView; last: boolean; onPick: () => void }) {
  const src = useUserAvatar({ userId: player.id, avatarOptions: player.avatarOptions })
  return <PlayerRow name={player.label} src={src} chevron onClick={onPick} last={last} />
}

/**
 * Équipe (`creation.md` § 1 et § 7, lab `Team`) : Administrateurs (créateur compris, non modifiable) et Rédacteurs.
 * Une ligne ouvre une feuille : changer le rôle, retirer après confirmation. + invite un rédacteur (recherche de
 * joueurs). Un administrateur doit être Premium : le BFF refuse sinon.
 */
export function TeamPage() {
  const t = useT()
  const language = useLanguageStore((state) => state.language)
  const { topicId = '' } = useParams()
  const back = useBack(ROUTES.myTopic(topicId))
  const { topic, permissions } = useWorkshop(topicId)
  const team = useTeam(topicId)
  const change = useTeamChange(topicId)
  const [selected, setSelected] = useState<TeamMember>()
  const [inviteOpen, setInviteOpen] = useState(false)
  const [query, setQuery] = useState('')
  const search = useDebounced(query.trim(), 250)
  const players = usePlayerSearch(search)
  const members = team.data ?? []
  const admins = members.filter((member) => member.role !== 'WRITER').sort((a, b) => (a.role === 'CREATOR' ? -1 : b.role === 'CREATOR' ? 1 : 0))
  const writers = members.filter((member) => member.role === 'WRITER')
  const candidates = (players.data ?? []).filter((player) => player.type === 'PLAYER' && !player.suspended && !members.some((member) => member.userId === player.id))
  const manageable = Boolean(permissions?.canManageTeam)

  const confirmRemove = (member: TeamMember) =>
    showDialog({
      sheet: true,
      tone: 'danger',
      icon: TrashIcon,
      title: t('workshop.removeTitle', { name: member.pseudonym }),
      message: t('workshop.removeText'),
      actions: [
        { label: t('workshop.remove'), variant: 'tinted', tone: 'destructive', onClick: () => change.mutate({ member, remove: true }) },
        { label: t('common.cancel'), variant: 'plain', tone: 'neutral' },
      ],
    })

  const section = (title: string, list: readonly TeamMember[]) => (
    <section className="grid gap-3">
      <SectionHeader title={`${title} · ${list.length}`} />
      {list.length > 0 && (
        <div className={CARD}>
          {list.map((member, index) => (
            <MemberRow key={member.userId} member={member} onOpen={manageable ? () => setSelected(member) : undefined} last={index === list.length - 1} />
          ))}
        </div>
      )}
    </section>
  )

  return (
    <Screen
      header={
        <MobileTopBar
          variant="inline"
          back={t('workshop.topic')}
          title={t('workshop.team')}
          onBack={back}
          right={
            permissions?.canAddMembers ? (
              <IconButton
                icon={UserPlusIcon}
                label={t('workshop.invite')}
                variant="plain"
                tone="accent"
                onClick={() => {
                  setQuery('')
                  setInviteOpen(true)
                }}
              />
            ) : undefined
          }
        />
      }
      overlay={
        <>
          <MobileSheet open={selected !== undefined} onClose={() => setSelected(undefined)} title={selected?.pseudonym ?? ''}>
            {selected && (
              <div className="overflow-hidden rounded-jo-lg bg-jo-raised">
                <ListRow
                  icon={ShieldCheckIcon}
                  label={t(selected.role === 'ADMIN' ? 'workshop.makeWriter' : 'workshop.makeAdmin')}
                  control="none"
                  onClick={() => {
                    change.mutate({ member: { ...selected, role: selected.role === 'ADMIN' ? 'WRITER' : 'ADMIN' } })
                    setSelected(undefined)
                  }}
                />
                <ListRow
                  icon={TrashIcon}
                  label={t('workshop.removeMember')}
                  control="none"
                  destructive
                  onClick={() => {
                    confirmRemove(selected)
                    setSelected(undefined)
                  }}
                  last
                />
              </div>
            )}
          </MobileSheet>
          <MobileSheet open={inviteOpen} onClose={() => setInviteOpen(false)} title={t('workshop.invite')} subtitle={topic ? topicName(topic.names, language) : undefined} tall>
            <div className="grid gap-3">
              <div className="sticky top-0 z-10 bg-jo-surface pb-1">
                <SearchField value={query} onChange={setQuery} placeholder={t('social.search')} label={t('social.search')} />
              </div>
              {candidates.length > 0 ? (
                <div className="overflow-hidden rounded-jo-lg bg-jo-raised">
                  {candidates.map((player, index) => (
                    <CandidateRow
                      key={player.id}
                      player={player}
                      onPick={() => {
                        change.mutate(
                          { member: { userId: player.id, pseudonym: player.label, avatarOptions: player.avatarOptions, role: 'WRITER', premium: false } },
                          { onSuccess: () => toast.success(t('workshop.joined', { name: player.label })) },
                        )
                        setInviteOpen(false)
                      }}
                      last={index === candidates.length - 1}
                    />
                  ))}
                </div>
              ) : search.length >= 2 && !players.isPending ? (
                <EmptyState icon={UserPlusIcon} title={t('social.noPlayer')} description={t('social.noPlayerText')} />
              ) : (
                <p className="jo-type-callout m-0 text-jo-muted">{t('workshop.inviteHint')}</p>
              )}
            </div>
          </MobileSheet>
        </>
      }
    >
      {team.isPending ? (
        <div className="grid gap-2 px-4 pt-1">
          <Skeleton shape="row" />
          <Skeleton shape="row" />
        </div>
      ) : (
        <div className="grid gap-6 px-4 pt-1 pb-8">
          {section(t('workshop.admins'), admins)}
          {section(t('workshop.writers'), writers)}
          <p className="jo-type-caption m-0 text-pretty text-jo-muted">{t('workshop.rolesText')}</p>
        </div>
      )}
    </Screen>
  )
}
