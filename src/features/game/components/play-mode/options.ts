import {
  Bot,
  Flame,
  Gauge,
  Globe,
  Link2,
  Smile,
  Swords,
  UserCheck,
  Users,
} from "lucide-react"
import type { BotDifficulty } from "../../domain/game-dto"
import type { PlayerSource } from "../../domain/opponents"

/** Étape « qui défier » de la popup de duel. */
export type Opponent = "world" | "player" | "bot" | "private"

/** Difficultés de bot proposées (libellés + accroches i18n). */
export const DIFFICULTIES = [
  {
    value: "EASY",
    icon: Smile,
    labelKey: "game.playMode.difficulties.easy.label",
    hintKey: "game.playMode.difficulties.easy.hint",
  },
  {
    value: "NORMAL",
    icon: Gauge,
    labelKey: "game.playMode.difficulties.normal.label",
    hintKey: "game.playMode.difficulties.normal.hint",
  },
  {
    value: "HARD",
    icon: Flame,
    labelKey: "game.playMode.difficulties.hard.label",
    hintKey: "game.playMode.difficulties.hard.hint",
  },
] as const satisfies readonly {
  value: BotDifficulty
  icon: typeof Globe
  labelKey: string
  hintKey: string
}[]

/** Clés i18n de la recherche de joueur, par source (abonnements / abonnés / universelle). */
export const PLAYER_SOURCE_KEYS: Record<
  PlayerSource,
  {
    placeholder: `game.playMode.sources.${PlayerSource}.placeholder`
    empty: `game.playMode.sources.${PlayerSource}.empty`
  }
> = {
  following: {
    placeholder: "game.playMode.sources.following.placeholder",
    empty: "game.playMode.sources.following.empty",
  },
  followers: {
    placeholder: "game.playMode.sources.followers.placeholder",
    empty: "game.playMode.sources.followers.empty",
  },
  all: {
    placeholder: "game.playMode.sources.all.placeholder",
    empty: "game.playMode.sources.all.empty",
  },
}

/** Choix de l'adversaire (étape 1). */
export const OPPONENT_CHOICES = [
  {
    id: "world",
    icon: Globe,
    titleKey: "game.playMode.choices.world.title",
    descKey: "game.playMode.choices.world.description",
  },
  {
    id: "player",
    icon: Swords,
    titleKey: "game.playMode.choices.player.title",
    descKey: "game.playMode.choices.player.description",
  },
  {
    id: "bot",
    icon: Bot,
    titleKey: "game.playMode.choices.bot.title",
    descKey: "game.playMode.choices.bot.description",
  },
  {
    id: "private",
    icon: Link2,
    titleKey: "game.playMode.choices.private.title",
    descKey: "game.playMode.choices.private.description",
  },
] as const

/** Source de recherche du joueur cible (étape 2, mode « défier un joueur »). */
export const PLAYER_SOURCE_CHOICES = [
  {
    id: "following",
    icon: UserCheck,
    titleKey: "game.playMode.sources.following.title",
    descKey: "game.playMode.sources.following.description",
  },
  {
    id: "followers",
    icon: Users,
    titleKey: "game.playMode.sources.followers.title",
    descKey: "game.playMode.sources.followers.description",
  },
  {
    id: "all",
    icon: Globe,
    titleKey: "game.playMode.sources.all.title",
    descKey: "game.playMode.sources.all.description",
  },
] as const
