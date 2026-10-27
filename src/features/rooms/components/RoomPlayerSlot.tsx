import { Check, Clock } from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn } from "cn"
import { SuspendedBadge } from "@/shared/components/suspended-badge"
import { UserAvatar } from "@/shared/components/user-avatar"
import { TOKEN } from "@/shared/theme/tokens"

/** Un joueur de la salle : identité + présence temps réel (entré dans la salle ou non). */
export interface RoomSlot {
  name: string
  userId?: string
  avatarOptions?: string | null
  present: boolean
  isMe?: boolean
  suspended?: boolean
}

/**
 * Avatar + présence : anneau vert et pastille à coche quand le joueur est dans la salle ; avatar
 * estompé et halos pulsés tant qu'il manque. Le joueur courant est marqué « Toi ».
 */
export function RoomPlayerSlot({ slot }: { slot: RoomSlot }) {
  const { t } = useTranslation()
  return (
    <div className="flex w-24 flex-col items-center gap-2.5 desktop:w-28">
      <div className="relative grid place-items-center">
        {!slot.present && (
          <>
            {[0, 1].map((index) => (
              <span
                key={index}
                aria-hidden
                className="qu-ping col-start-1 row-start-1 size-[72px] place-self-center rounded-full desktop:size-[96px]"
                style={{
                  border: `1.5px solid ${TOKEN.timer}`,
                  animationDelay: `${index * 0.8}s`,
                }}
              />
            ))}
          </>
        )}
        <span
          className={cn(
            "col-start-1 row-start-1 grid size-[72px] place-items-center rounded-full transition-all duration-300 desktop:size-[96px]",
            !slot.present && "opacity-50 grayscale"
          )}
          style={
            slot.present
              ? { boxShadow: `0 0 0 3px ${TOKEN.correctAccent}` }
              : undefined
          }
        >
          <UserAvatar
            name={slot.name}
            userId={slot.userId}
            avatarOptions={slot.avatarOptions ?? undefined}
            fluid
            // La salle porte sa propre bordure de présence : elle prime sur le palier Elo.
            eloFrame={false}
          />
        </span>
        <span
          className={cn(
            "absolute right-0 bottom-0 grid size-5 place-items-center rounded-full border-2 text-white transition-colors duration-300 desktop:size-6",
            slot.present ? "bg-[var(--duel-correct-accent)]" : "bg-muted"
          )}
          style={{ borderColor: TOKEN.duelBg }}
        >
          {slot.present ? (
            <Check size={11} strokeWidth={3.5} aria-hidden />
          ) : (
            <Clock size={10} className="text-muted-foreground" aria-hidden />
          )}
        </span>
      </div>
      <span
        className={cn(
          "max-w-full truncate text-xs",
          slot.present ? "text-foreground" : "text-muted-foreground"
        )}
      >
        {slot.isMe ? t("game.common.you") : slot.name}
      </span>
      {slot.suspended ? <SuspendedBadge className="scale-90" /> : null}
    </div>
  )
}
