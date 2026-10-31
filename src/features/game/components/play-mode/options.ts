import {
  FireIcon,
  GaugeIcon,
  GlobeHemisphereWestIcon,
  LinkIcon,
  RobotIcon,
  SmileyIcon,
  SwordIcon,
  UserCheckIcon,
  UsersIcon,
} from "@phosphor-icons/react"
import type { BotDifficulty } from "../../domain/game-dto"
import type { PlayerSource } from "../../domain/opponents"

/** Étape « qui défier » de la popup de duel. */
export type Opponent = "world" | "player" | "bot" | "private"

/** Difficultés de bot proposées (libellés + accroches i18n). */
export const DIFFICULTIES = [
  {
    value: "EASY",
    icon: SmileyIcon,
    labelKey: "game.playMode.difficulties.easy.label",
    hintKey: "game.playMode.difficulties.easy.hint",
  },
  {
    value: "NORMAL",
    icon: GaugeIcon,
    labelKey: "game.playMode.difficulties.normal.label",
    hintKey: "game.playMode.difficulties.normal.hint",
  },
  {
    value: "HARD",
    icon: FireIcon,
    labelKey: "game.playMode.difficulties.hard.label",
    hintKey: "game.playMode.difficulties.hard.hint",
  },
] as const satisfies readonly {
  value: BotDifficulty
  icon: typeof GlobeHemisphereWestIcon
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
    icon: GlobeHemisphereWestIcon,
    titleKey: "game.playMode.choices.world.title",
    descKey: "game.playMode.choices.world.description",
  },
  {
    id: "player",
    icon: SwordIcon,
    titleKey: "game.playMode.choices.player.title",
    descKey: "game.playMode.choices.player.description",
  },
  {
    id: "bot",
    icon: RobotIcon,
    titleKey: "game.playMode.choices.bot.title",
    descKey: "game.playMode.choices.bot.description",
  },
  {
    id: "private",
    icon: LinkIcon,
    titleKey: "game.playMode.choices.private.title",
    descKey: "game.playMode.choices.private.description",
  },
] as const

/** Source de recherche du joueur cible (étape 2, mode « défier un joueur »). */
export const PLAYER_SOURCE_CHOICES = [
  {
    id: "following",
    icon: UserCheckIcon,
    titleKey: "game.playMode.sources.following.title",
    descKey: "game.playMode.sources.following.description",
  },
  {
    id: "followers",
    icon: UsersIcon,
    titleKey: "game.playMode.sources.followers.title",
    descKey: "game.playMode.sources.followers.description",
  },
  {
    id: "all",
    icon: GlobeHemisphereWestIcon,
    titleKey: "game.playMode.sources.all.title",
    descKey: "game.playMode.sources.all.description",
  },
] as const
