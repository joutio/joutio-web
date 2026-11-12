import type { ChallengeView } from '@joutio/client-domain/api-types'
import { describe, expect, it } from 'vitest'
import { splitChallenges } from './challenges-service'

const user = (userId: string) => ({ userId, pseudonym: userId, avatarOptions: null, suspended: false })
const challenge = (challengeId: string, from: string, to: string, expiresAt: string, status: ChallengeView['status'] = 'PENDING'): ChallengeView => ({
  challengeId,
  topic: { topicId: 't', names: { fr: 'Sujet' }, category: null, imageUrl: null, pictogramUrl: null },
  challenger: user(from),
  opponent: user(to),
  status,
  roomId: null,
  gameId: null,
  createdAt: expiresAt,
  expiresAt,
})

describe('splitChallenges', () => {
  it('keeps pending challenges, received by nearest deadline and sent by most recent', () => {
    const { received, sent } = splitChallenges(
      [
        challenge('late', 'a', 'me', '2026-11-12T20:00:00Z'),
        challenge('soon', 'b', 'me', '2026-11-12T13:00:00Z'),
        challenge('done', 'c', 'me', '2026-11-12T12:00:00Z', 'DECLINED'),
        challenge('old', 'me', 'd', '2026-11-12T09:00:00Z'),
        challenge('new', 'me', 'e', '2026-11-12T11:00:00Z'),
      ],
      'me',
    )
    expect(received.map((item) => item.challengeId)).toEqual(['soon', 'late'])
    expect(sent.map((item) => item.challengeId)).toEqual(['new', 'old'])
  })
})
