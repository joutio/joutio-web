/**
 * Parties dont la séquence de déblocages a déjà été montrée, sur cet appareil. La séquence ne se joue qu'une fois, juste
 * après le duel : un rechargement, un retour arrière (l'état de navigation porte encore `celebrate`) ou une réouverture
 * depuis l'historique montrent le résultat seul.
 */
const KEY = 'joutio.result.celebrated'
const LIMIT = 30

const read = (): string[] => {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
  } catch {
    return []
  }
}

export const celebrated = {
  has: (gameId: string) => read().includes(gameId),
  add: (gameId: string) => {
    try {
      const next = [gameId, ...read().filter((item) => item !== gameId)].slice(0, LIMIT)
      localStorage.setItem(KEY, JSON.stringify(next))
    } catch {
      // Stockage indisponible (navigation privée) : l'état de navigation, nettoyé, suffit pour un rechargement.
    }
  },
}
