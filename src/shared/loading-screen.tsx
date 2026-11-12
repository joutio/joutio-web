import { Logo, Screen } from '@/ui'

/** Attente plein écran (session, `GET /api/me`) : la marque, sans texte. Pas de splash sur le web. */
export function LoadingScreen() {
  return (
    <Screen>
      <div role="status" aria-busy className="grid h-full place-items-center">
        <Logo variant="mark" size={44} className="animate-pulse motion-reduce:animate-none" />
      </div>
    </Screen>
  )
}
