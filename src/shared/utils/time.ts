/** Formatage relatif compact en français (ex. « il y a 5 min », « il y a 3 j »). */
export function timeAgo(iso: string, now: number = Date.now()): string {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return "récemment"

  const seconds = Math.max(0, Math.floor((now - then) / 1000))
  if (seconds < 60) return "il y a un instant"

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `il y a ${minutes} min`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `il y a ${hours} h`

  const days = Math.floor(hours / 24)
  if (days < 7) return `il y a ${days} j`

  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `il y a ${weeks} sem`

  const months = Math.floor(days / 30)
  if (months < 12) return `il y a ${months} mois`

  const years = Math.floor(days / 365)
  return `il y a ${years} an${years > 1 ? "s" : ""}`
}
