import type { Resources } from "../fr"
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

/** Catalogue anglais, contraint par la structure du catalogue `fr`. */
export const en: Resources = {
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
