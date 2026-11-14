import type { GameHistoryItemView } from '@joutio/client-domain/api-types'
import { useNavigate } from 'react-router-dom'
import { dayLabel } from '@/features/topic'
import { useLanguageStore, useT } from '@/lib/i18n'
import { ROUTES } from '@/shared/routes'
import { toCategoryCode, topicName } from '@/shared/topics'
import { MatchRow } from '@/ui'
import { finishedGames, OUTCOMES } from '../lib/outcomes'


/**
 * Parties groupées par jour, une carte de `MatchRow` par jour (`historique.md`) : le sujet en titre, l'adversaire ou
 * « Entraînement » dessous, l'issue et le score. Une ligne ouvre le Résultat de la partie.
 */
export function GameGroups({ games }: { games: readonly GameHistoryItemView[] }) {
  const t = useT()
  const language = useLanguageStore((state) => state.language)
  const navigate = useNavigate()
  const groups: { day: string; games: GameHistoryItemView[] }[] = []
  for (const game of finishedGames(games)) {
    const day = dayLabel(new Date(game.playedAt), language, { today: t('topic.today'), yesterday: t('topic.yesterday') })
    const last = groups[groups.length - 1]
    if (last?.day === day) last.games.push(game)
    else groups.push({ day, games: [game] })
  }
  return (
    <>
      {groups.map((group) => (
        <section key={group.day} className="grid gap-2">
          <span className="jo-type-caption font-semibold text-jo-muted">{group.day}</span>
          <div className="overflow-hidden rounded-jo-lg bg-jo-surface">
            {group.games.map((game, index) => (
              <MatchRow
                key={game.gameId}
                topic={topicName(game.topic.names, language)}
                category={toCategoryCode(game.topic.category)}
                pictogram={game.topic.pictogramUrl ?? undefined}
                image={game.topic.imageUrl ?? undefined}
                sub={game.opponentType === 'BOT' ? t('history.training') : (game.opponent?.pseudonym ?? t('topic.opponent'))}
                outcome={OUTCOMES[game.outcome] ?? 'draw'}
                score={`${game.myScore} · ${game.opponentScore}`}
                bot={game.opponentType === 'BOT'}
                last={index === group.games.length - 1}
                onClick={() => void navigate(ROUTES.result(game.gameId))}
              />
            ))}
          </div>
        </section>
      ))}
    </>
  )
}
