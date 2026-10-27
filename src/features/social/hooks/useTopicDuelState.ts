import { useMemo } from "react"
import { useSocialPending } from "./useSocialPending"

export interface TopicDuelState {
  /** Joueurs avec un défi PENDING sur ce sujet (envoyé ou reçu : unicité symétrique). */
  blockedOpponentIds: ReadonlySet<string>
  /** Un défi PENDING implique déjà le joueur sur ce sujet (envoyé ou reçu). */
  challengeInProgressOnTopic: boolean
  /** Un salon créé par le joueur est déjà ouvert sur ce sujet. */
  roomAlreadyOpenOnTopic: boolean
}

/**
 * État anti-spam du sujet, dérivé des listes déjà chargées (aucune requête supplémentaire) :
 * les défis reçus et envoyés bloquent la paire sur ce sujet, et un salon dont le joueur est
 * l'initiateur bloque la création d'un second salon. Les quotas de 5 restent vérifiés par le
 * serveur (le client n'a pas à dupliquer la configuration).
 */
export function useTopicDuelState(topicId: string): TopicDuelState {
  const { received, sent, rooms } = useSocialPending()

  return useMemo(() => {
    const blockedOpponentIds = new Set<string>()
    for (const item of [...received, ...sent]) {
      if (item.kind === "room") continue
      if (item.topic.topicId !== topicId) continue
      const opponentId = item.player?.userId
      if (opponentId) blockedOpponentIds.add(opponentId)
    }
    const challengeInProgressOnTopic = [...received, ...sent].some(
      (item) => item.topic.topicId === topicId
    )
    const roomAlreadyOpenOnTopic = rooms.some(
      (room) =>
        room.kind === "room" &&
        room.topic.topicId === topicId &&
        room.canCancel
    )
    return {
      blockedOpponentIds,
      challengeInProgressOnTopic,
      roomAlreadyOpenOnTopic,
    }
  }, [received, rooms, sent, topicId])
}
