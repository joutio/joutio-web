import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Pencil } from "lucide-react"
import { BannerGlow } from "@/shared/components/banner-glow"
import { StatStrip, type StatStripItem } from "@/shared/components/stat-strip"
import { UserAvatar } from "@/shared/components/user-avatar"
import { TIER_COLORS, type Rank } from "@/features/progression/domain/progression"

interface ProfileBannerProps {
  name: string
  avatar?: {
    size?: number
    userId?: string
    avatarOptions?: string
  }
  /** Bannière uploadée (URL MinIO) affichée derrière le halo. */
  bannerUrl?: string | null
  /** Palier Elo courant : teinte l'anneau de l'avatar et le filet du bandeau. */
  eloTier?: Rank | null
  /** Badge crayon sur l'avatar (profil courant) : ouvre l'éditeur d'avatar. */
  onEditAvatar?: () => void
  /** Ruban sous les informations du joueur (ex. titre porté), aligné comme le nom. */
  titleRibbon?: ReactNode
  meta?: ReactNode
  /** Ligne optionnelle (présence, etc.). */
  extra?: ReactNode
  /** Boutons d'action, empilés dans la colonne de droite. */
  actions?: ReactNode
  stats: StatStripItem[]
  /**
   * Bloc optionnel rendu **avant** les statistiques (ex. jauge Elo) — **sans divider** :
   * la séparation avec l'en-tête (actions) est portée par l'espacement du bandeau.
   */
  aboveStats?: ReactNode
  /** Bloc optionnel rendu après les statistiques, sous un divider. */
  belowStats?: ReactNode
}

/**
 * Bandeau d'identité (profil courant ou fiche joueur) — avatar à gauche, identité,
 * CTA empilés à droite, puis `StatStrip` pleine largeur. Aucune couleur de fond, `border-b`.
 */
export function ProfileBanner({
  name,
  avatar,
  bannerUrl,
  eloTier,
  onEditAvatar,
  titleRibbon,
  meta,
  extra,
  actions,
  stats,
  aboveStats,
  belowStats,
}: ProfileBannerProps) {
  const { t } = useTranslation()
  return (
    <div
      data-slot="profile-banner"
      className="relative overflow-hidden border-b border-border bg-background"
      data-elo-tier={eloTier ?? undefined}
    >
      {bannerUrl ? (
        <>
          <img
            src={bannerUrl}
            alt=""
            aria-hidden
            className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          />
          {/* Voile pour garder le texte/contrôles lisibles sur n'importe quelle bannière. */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/55 via-background/75 to-background" />
        </>
      ) : null}
      <BannerGlow />
      <div className="relative mx-auto flex w-full max-w-screen-xl flex-col gap-5 px-(--page-gutter-x) py-6 tablet-up:py-8">
        <div className="flex flex-col items-center gap-5 tablet-up:flex-row tablet-up:items-center">
          <div className="flex min-w-0 flex-1 flex-col items-center gap-3 text-center tablet-up:flex-row tablet-up:items-center tablet-up:gap-5 tablet-up:text-left">
            <span className="relative shrink-0">
              {/* Bordure portée par un wrapper : l'avatar garde sa taille pleine (pas de rognage). */}
              <span
                className="inline-flex rounded-full border-4"
                style={{
                  borderColor: eloTier
                    ? TIER_COLORS[eloTier].fill
                    : "var(--foreground)",
                }}
              >
                <UserAvatar
                  name={name}
                  userId={avatar?.userId}
                  avatarOptions={avatar?.avatarOptions}
                  size={avatar?.size ?? 96}
                  eloFrame={false}
                />
              </span>
              {onEditAvatar && (
                <button
                  type="button"
                  onClick={onEditAvatar}
                  aria-label={t("player.banner.editAvatar")}
                  title={t("player.banner.editAvatar")}
                  className="absolute -right-0.5 -bottom-0.5 grid size-(--control-h-md) place-items-center rounded-full border-2 border-foreground bg-primary text-primary-foreground shadow-md transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <Pencil size={14} aria-hidden />
                </button>
              )}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center justify-center gap-2.5 tablet-up:justify-start">
                <h1 className="font-heading text-3xl font-extrabold tracking-tight">
                  {name}
                </h1>
              </div>
              {meta && (
                <div className="mt-1 text-sm text-muted-foreground">{meta}</div>
              )}
              {extra && <div className="mt-1.5">{extra}</div>}
              {titleRibbon && (
                <div className="mt-2 flex justify-center tablet-up:justify-start">
                  {titleRibbon}
                </div>
              )}
            </div>
          </div>

          {actions && (
            <div className="flex w-full shrink-0 flex-col gap-2 tablet-up:w-[200px]">
              {actions}
            </div>
          )}
        </div>

        {aboveStats}

        <StatStrip className="border-t border-border pt-3" items={stats} />

        {belowStats && (
          <div className="border-t border-border pt-3">{belowStats}</div>
        )}
      </div>
    </div>
  )
}
