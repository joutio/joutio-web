import { api } from "@/lib/api"
import { ENDPOINTS } from "@/lib/endpoints"
import type { IdResponse } from "@/shared/types/api"
import type { ChallengeView } from "../domain/challenge"

/** Défi nominatif : création, consultation, acceptation/refus/annulation. */
export const challengesService = {
  create: (
    params: { topicId: string; opponentId: string; gameId?: string | null },
    options: { skipErrorBus?: boolean } = {}
  ): Promise<IdResponse> =>
    api.post<IdResponse>(ENDPOINTS.challenges.create, params, options),

  get: (
    challengeId: string,
    options: { skipErrorBus?: boolean } = {}
  ): Promise<ChallengeView> =>
    api.get<ChallengeView>(ENDPOINTS.challenges.detail(challengeId), options),

  /** Défis en attente où le joueur est lanceur ou invité. */
  mine: (): Promise<ChallengeView[]> =>
    api.get<ChallengeView[]>(ENDPOINTS.challenges.mine),

  accept: (challengeId: string): Promise<void> =>
    api.post<void>(ENDPOINTS.challenges.accept(challengeId)),

  decline: (challengeId: string): Promise<void> =>
    api.post<void>(ENDPOINTS.challenges.decline(challengeId)),

  cancel: (challengeId: string): Promise<void> =>
    api.post<void>(ENDPOINTS.challenges.cancel(challengeId)),
}
