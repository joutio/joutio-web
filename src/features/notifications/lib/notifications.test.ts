import { describe, expect, it } from 'vitest'
import type { NotificationView } from '@/lib/realtime'
import { durationParts } from '@/shared/duration'
import { notificationTarget } from './notification-target'
import { dayOf } from './notifications-service'

const notice = (patch: Partial<NotificationView>): NotificationView => ({
  notificationId: 'n1',
  type: 'FOLLOW',
  actorId: 'u2',
  sourceId: null,
  topicId: null,
  gameId: null,
  expiresAt: null,
  readAt: null,
  createdAt: '2026-11-12T10:00:00Z',
  ...patch,
})

describe('notificationTarget', () => {
  const now = Date.parse('2026-11-12T12:00:00Z')

  it('opens the player page for a follower or a declined challenge', () => {
    expect(notificationTarget(notice({ type: 'FOLLOW' }), now)).toEqual({ kind: 'player', id: 'u2' })
    expect(notificationTarget(notice({ type: 'CHALLENGE_DECLINED' }), now)).toEqual({ kind: 'player', id: 'u2' })
  })

  it('opens Challenges for a received challenge and the room for an accepted one or a nudge', () => {
    expect(notificationTarget(notice({ type: 'CHALLENGE_RECEIVED', sourceId: 'c1' }), now)).toEqual({ kind: 'challenges' })
    expect(notificationTarget(notice({ type: 'ROOM_ACCEPTED', sourceId: 'r1' }), now)).toEqual({ kind: 'room', id: 'r1' })
    expect(notificationTarget(notice({ type: 'WIZZ', sourceId: 'r1' }), now)).toEqual({ kind: 'room', id: 'r1' })
  })

  it('falls back when the invitation has expired', () => {
    expect(notificationTarget(notice({ type: 'ROOM_ACCEPTED', sourceId: 'r1', expiresAt: '2026-11-12T11:00:00Z' }), now)).toEqual({ kind: 'fallback', challenges: true, expired: true })
  })

  it('opens the reports of the question for a report, and the topic for a draft', () => {
    expect(notificationTarget(notice({ type: 'QUESTION_REPORTED', actorId: null, topicId: 't1', sourceId: 'rep1' }), now)).toEqual({ kind: 'report', topicId: 't1', reportId: 'rep1' })
    expect(notificationTarget(notice({ type: 'TOPIC_DRAFTED', actorId: null, topicId: 't1' }), now)).toEqual({ kind: 'workshop', id: 't1' })
  })
})

describe('dayOf', () => {
  const now = new Date(2026, 10, 12, 15)
  it('splits today, the last six days and older', () => {
    expect(dayOf(new Date(2026, 10, 12, 1).toISOString(), now)).toBe('today')
    expect(dayOf(new Date(2026, 10, 8, 12).toISOString(), now)).toBe('week')
    expect(dayOf(new Date(2026, 10, 1, 12).toISOString(), now)).toBe('older')
  })
})

describe('durationParts', () => {
  it('reads days beyond two days, hours beyond an hour, minutes otherwise', () => {
    expect(durationParts(3 * 86_400_000)).toEqual({ unit: 'days', count: 3 })
    expect(durationParts(23 * 3_600_000 + 1)).toEqual({ unit: 'hours', count: 23 })
    expect(durationParts(10_000)).toEqual({ unit: 'minutes', count: 1 })
  })
})
