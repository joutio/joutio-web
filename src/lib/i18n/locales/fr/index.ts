import { authoring } from "./authoring"
import { auth } from "./auth"
import { avatar } from "./avatar"
import { common } from "./common"
import { game } from "./game"
import { history } from "./history"
import { home } from "./home"
import { moderation } from "./moderation"
import { notifications } from "./notifications"
import { social } from "./social"
import { player } from "./player"
import { progression } from "./progression"
import { shared } from "./shared"
import { shell } from "./shell"
import { topic } from "./topic"
import { topics } from "./topics"

/**
 * Catalogue **français** — source de vérité des clés. Les autres langues sont typées
 * structurellement sur `Resources` : une clé manquante casse la compilation.
 */
export const fr = {
  common,
  shell,
  auth,
  home,
  topics,
  topic,
  social,
  player,
  progression,
  notifications,
  game,
  authoring,
  avatar,
  moderation,
  shared,
  history,
}

export type Resources = typeof fr
