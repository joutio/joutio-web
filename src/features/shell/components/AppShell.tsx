import { useEffect, useRef, useState } from "react"
import type { CSSProperties } from "react"
import { Outlet, useLocation, useNavigate } from "react-router-dom"
import { cn } from "cn"
import { ErrorBoundary } from "@/shared/components/ErrorBoundary"
import { clearReturnTo, readReturnTo, useSessionRefresh } from "@/features/auth"
import { useStopSoundsOnNavigate } from "@/shared/hooks/useStopSoundsOnNavigate"
import { ScrollContainerProvider } from "@/shared/components/scroll-container-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "./AppSidebar"
import { Topbar } from "./Topbar"
import { BottomNav } from "./BottomNav"
import { CommandPalette } from "./CommandPalette"
import { InstallBanner } from "./InstallBanner"
import { UpdateBanner } from "./UpdateBanner"
import { ResumeBanner } from "@/features/home"
import {
  useAppBadge,
  useFirstRunPushPrompt,
  useFlushPendingNotificationToasts,
  useFollowPresenceToasts,
  useNotificationStream,
  usePushMessages,
  usePushSubscriptionSync,
  RematchRequestDialog,
  useRematchRequestStore,
} from "@/features/notifications"
import {
  AchievementCelebration,
  useAchievementSound,
  useAchievementStore,
  useAchievementStream,
} from "@/features/progression"
import { useIsImmersiveRoute } from "@/features/shell"
import { useSidebarStore } from "@/features/shell"
import { useBottomNavStore } from "@/features/shell"
import { useChromeStore } from "../stores/useChromeStore"
import { useVisualViewportVar } from "@/shared/hooks/useVisualViewportVar"
import { useDevice } from "@/shared/hooks/use-device"
import { useScrollHeader } from "@/shared/hooks/useScrollHeader"
import { useScrollRestoration } from "@/shared/hooks/useScrollRestoration"
import { useEloRatingSync } from "@/shared/elo/elo-rating-store"

/**
 * Coquille applicative : sidebar (desktop) + topbar + contenu + nav basse (mobile) + palette ⌘K.
 * Pendant un duel, la sidebar est retirée (arène plein écran) et la topbar est masquée.
 */
export function AppShell() {
  const [paletteOpen, setPaletteOpen] = useState(false)
  const sidebarOpen = useSidebarStore((s) => s.open)
  const setSidebarOpen = useSidebarStore((s) => s.setOpen)
  const inMatch = useIsImmersiveRoute()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const device = useDevice()
  const bottomNavVariant = useBottomNavStore((s) => s.variant)
  const scrollRef = useRef<HTMLDivElement>(null)
  // L'éditeur d'avatar porte ses propres bandeaux collants : nav basse masquée partout,
  // topbar masquée en compact (le bandeau preview + les onglets la remplacent).
  const avatarEditor = pathname.startsWith("/settings/avatar")
  const hideBottomNav = avatarEditor
  const hideMobileTopbar = avatarEditor && device === "compact"
  const setChromeHidden = useChromeStore((state) => state.setHidden)
  const { reset: resetScrollHeader } = useScrollHeader(scrollRef, {
    enabled: device === "compact" && !inMatch && !hideBottomNav,
    onHiddenChange: setChromeHidden,
  })
  // Quitter un écran coupe ses sons (jingle, salve, tic-tac) — cf. `stopChimes`.
  useStopSoundsOnNavigate()
  useScrollRestoration({
    containerRef: scrollRef,
    onRestored: resetScrollHeader,
  })
  // Aucun toast sur un écran immersif : ils sont mis en file et rejoués à la sortie, ou sur la
  // page résultat d'un duel (écran de respiration autorisé).
  const onDuelResult =
    pathname.startsWith("/game/") && pathname.endsWith("/result")
  const deferNotificationToasts = inMatch && !onDuelResult
  useNotificationStream(inMatch, deferNotificationToasts)
  useFlushPendingNotificationToasts(deferNotificationToasts)
  useFollowPresenceToasts(inMatch)
  // Déblocages : le flux reste actif partout (les célébrations reçues en duel sont conservées),
  // l'overlay s'affiche hors écran immersif — l'écran de résultat, juste après la partie, en fait
  // partie.
  useAchievementStream()
  useEloRatingSync()
  const achievements = useAchievementStore((state) => state.queue)
  const rematchRequestPending = useRematchRequestStore(
    (state) => state.requests.length > 0
  )
  const celebrated = !inMatch || pathname.endsWith("/result")
  // Même règle pour la popup de revanche : jamais pendant un duel/salon, mais autorisée sur la
  // page résultat (les deux joueurs y sont encore juste après la partie).
  const rematchPopupVisible = celebrated
  useAchievementSound(celebrated ? achievements[0] : undefined)
  usePushSubscriptionSync()
  usePushMessages(deferNotificationToasts)
  useFirstRunPushPrompt()
  useAppBadge()
  useVisualViewportVar()
  useSessionRefresh()

  // Filet de restauration de la cible mémorisée avant login (ex. lien de salon `/join/:code`) :
  // le `state` OIDC la restaure normalement depuis `/callback`.
  useEffect(() => {
    const returnTo = readReturnTo()
    if (returnTo && returnTo !== pathname) {
      clearReturnTo()
      void navigate(returnTo, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Habillage de la nav basse exposé au CSS (`--bottom-nav-offset` / `--bottom-nav-reserve`).
  useEffect(() => {
    document.documentElement.dataset.bottomNav = bottomNavVariant
  }, [bottomNavVariant])

  // Sur tablette, la sidebar est un rail replié (contrat device) ; la préférence desktop
  // persiste mais n'est appliquée qu'à partir du breakpoint desktop.
  const effectiveSidebarOpen = device === "tablet" ? false : sidebarOpen
  const handleSidebarOpenChange = (open: boolean) => {
    if (device !== "tablet") setSidebarOpen(open)
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setPaletteOpen((open) => !open)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  return (
    <TooltipProvider>
      <SidebarProvider
        open={effectiveSidebarOpen}
        onOpenChange={handleSidebarOpenChange}
        className="h-svh overflow-hidden"
      >
        {/* Duel : la sidebar disparaît complètement pour rendre l'arène plein écran (desktop). */}
        {!inMatch && <AppSidebar />}
        <SidebarInset className="flex min-h-0 flex-col overflow-hidden bg-background">
          <div className="relative z-10 flex min-h-0 flex-1 flex-col">
            {/* Reprise de partie : épinglée hors du scroll, donc visible quel que soit le défilement. */}
            {!inMatch && <ResumeBanner />}
            {/* Nouveau build déployé : propose un rechargement (hors immersif, non bloquant). */}
            {!inMatch && <UpdateBanner />}
            <ScrollContainerProvider containerRef={scrollRef}>
              <div
                ref={scrollRef}
                data-scroll-root
                style={
                  {
                    // Offset de repos des bandes collantes (topbar + encoche). Le repli de la
                    // topbar est porté par `--qu-chrome-shift` (CSS), pas par cet offset.
                    "--qu-topbar-offset": hideMobileTopbar
                      ? "var(--qu-safe-top)"
                      : "calc(var(--topbar-h) + var(--qu-safe-top))",
                  } as CSSProperties
                }
                className={cn(
                  "flex-1",
                  // Routes normales : overscroll par défaut → le pull-to-refresh natif du
                  // navigateur reste possible (le scroll remonte jusqu'au root).
                  // Routes immersives : contenu figé, on neutralise le geste.
                  inMatch
                    ? "overflow-hidden overscroll-y-contain"
                    : "overflow-y-auto"
                )}
              >
                {/* Topbar collante : surface pleine au repos, verre dépoli dès que le contenu
                    est passé dessous (`data-scrolled`, posé par `useScrollHeader`) ; sur mobile
                    elle se translate hors écran en descendant (comportement natif). */}
                {!inMatch && <InstallBanner />}
                {!inMatch && !hideMobileTopbar && (
                  <div
                    className="qu-topbar sticky top-0 z-20"
                    data-slot="topbar"
                  >
                    <Topbar onOpenPalette={() => setPaletteOpen(true)} />
                  </div>
                )}
                {/* Filet par route : un crash de page n'emporte pas la coquille ; le
                    changement de `key` réinitialise l'état d'erreur à la navigation. */}
                {inMatch ? (
                  // Flux immersif desktop : toutes les pages (duel, résultat, salons,
                  // matchmaking, join) partagent un cadre paysage 3:2 (largeur dérivée de la
                  // hauteur, 1320 px max) centré sur le canvas. En tactile, le cadre disparaît : plein écran natif.
                  <div className="relative flex h-full items-center justify-center desktop:bg-canvas">
                    <div
                      data-slot="game-frame"
                      className="relative h-full w-full overflow-hidden desktop:aspect-[3/2] desktop:h-auto desktop:w-[min(100%,calc((100dvh-3rem)*3/2))] desktop:max-w-[1320px] desktop:rounded-xl desktop:border desktop:border-[#313131] desktop:bg-[var(--duel-bg)]"
                    >
                      <ErrorBoundary key={pathname}>
                        <Outlet />
                      </ErrorBoundary>
                    </div>
                  </div>
                ) : (
                  <ErrorBoundary key={pathname}>
                    <Outlet />
                  </ErrorBoundary>
                )}
                {/* Dégage la nav flottante : le dernier contenu peut passer au-dessus. */}
                {!inMatch && !hideBottomNav && (
                  <div
                    className="hidden h-[var(--bottom-nav-reserve)] compact:block"
                    aria-hidden="true"
                  />
                )}
              </div>
            </ScrollContainerProvider>
            {!inMatch && !hideBottomNav && <BottomNav />}
          </div>
        </SidebarInset>
      </SidebarProvider>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      {/* La popup de revanche est prioritaire : la célébration attend son issue (10 s max). */}
      {celebrated && achievements[0] && !rematchRequestPending && (
        <AchievementCelebration achievement={achievements[0]} />
      )}
      {rematchPopupVisible && <RematchRequestDialog />}
    </TooltipProvider>
  )
}
