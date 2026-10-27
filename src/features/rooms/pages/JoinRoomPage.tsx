import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router-dom"
import { TOKEN } from "@/shared/theme/tokens"

/**
 * Point d'entrée d'un lien de partage `/join/{roomId}` : redirige vers la salle.
 * L'apparition (présence + enregistrement) est faite par la salle elle-même à son montage
 * (`useRoomJoin`), quand l'utilisateur y est réellement. L'utilisateur doit être authentifié
 * (retour après login géré).
 */
export function JoinRoomPage() {
  const { t } = useTranslation()
  const { roomId = "" } = useParams<{ roomId: string }>()
  const navigate = useNavigate()

  useEffect(() => {
    if (!roomId) return
    void navigate(`/rooms/${roomId}`, { replace: true })
  }, [roomId, navigate])

  return (
    <div
      className="grid h-full place-items-center p-6 text-sm"
      style={{ background: TOKEN.duelBg, color: TOKEN.mutedFg }}
    >
      {t("game.room.connecting")}
    </div>
  )
}
