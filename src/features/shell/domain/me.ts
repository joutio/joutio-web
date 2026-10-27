import type {
  DuelStats,
  Language,
  Progression,
} from "@/features/player/domain/profile"

/** Joueur courant (`MeView`) — coquille et écrans profil. */
export interface Me {
  userId: string
  email: string | null
  pseudonym: string | null
  bio: string | null
  country: string | null
  avatarOptions: string | null
  bannerUrl: string | null
  language: Language
  /** Clé du titre thématique porté (`topicId:TIER`), `null` si aucun. */
  equippedTitle?: string | null
  progression: Progression
  stats: DuelStats
  followingCount: number
  followersCount: number
  /** Onboarding terminé (ou première partie humaine jouée), exposé par le BFF. */
  onboardingCompleted?: boolean
  /** Récompenses persistées (`MICAH_AVATAR`, …). */
  rewards?: string[]
  /** Compte Premium (admin par défaut) : débloque les styles d'avatar DiceBear. */
  premium?: boolean
  /**
   * Centres d'intérêt persistés : codes `TopicCategory` ordonnés (le premier est l'univers
   * principal). Liste vide ou absente = aucun intérêt.
   */
  interests?: string[]
}
