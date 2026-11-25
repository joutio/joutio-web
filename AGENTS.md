# AGENTS.md — joutio-web

App web joueur de Joutio (`app.joutio.com`) : le même produit que l'app mobile, porté depuis le lab
[`design/`](../../design/README.md) selon [`design/specs/web-kit.md`](../../design/specs/web-kit.md).

Lire : `../../AGENTS.md`, [`docs/frontend/`](../../docs/frontend/architecture.md), le contrat
[`docs/api/`](../../docs/api/README.md), la spec de l'écran dans `design/specs/screens/` et les règles
web (`design/specs/platforms/web.md`, `desktop.md`).

## Sources de vérité

- **Le lab fait foi** : textes, composants, comportements. Son code se **porte** (même API, mêmes
  classes, mêmes jetons) mais ne s'importe jamais (`eslint` l'interdit). En cas d'écart, on corrige
  l'app ; un manque du lab se règle d'abord dans le lab.
- **Domaine, données et textes** : `@joutio/client` (pin exact, 11.1.0) : repli du duel, salles (un défi est une salle
  `INVITED`), atelier, DTOs, **toutes les lectures, mutations et la synchronisation temps réel**, et
  `@joutio/client/core/i18n`. Aucune règle métier dupliquée ici.
- **Cadre** (D16, `design/specs/platforms/desktop.md`) : plein écran sur téléphone ; `WebFrame` en iPhone Duo
  ouvert portrait (626 × 890) sur tablette en portrait, en paysage (890 × 626, filet en `outline`) dès 938 px, marque
  dans les marges dès 1 280 px. Largeur « regular » (cadre paysage, ou ≥ 700 px et paysage) décidée par `WebFrame`
  (`useRegular()`, `data-jo-regular`, variante CSS `jo-regular:`) : `BottomNav` en rail de 88 px à gauche, Résultat en
  deux volets.

## Dépendances admises

- **Exécution** :
  - `react`, `react-dom`, `react-router-dom`, `zustand` ;
  - `@tanstack/react-query` : dépendance pair de `@joutio/client` seulement, jamais importée par l'app ;
  - `zod`, `react-hook-form`, `@hookform/resolvers` (`zodResolver`) : formulaires sur les schémas de
    `@joutio/client` (`schema/` de chaque feature : `me`, `profile`, `authoring`) ;
  - `@stomp/stompjs`, `@phosphor-icons/react` ;
  - `class-variance-authority`, `clsx`, `tailwind-merge` ;
  - `@fontsource-variable/geist(-mono)`, `@joutio/client` ;
  - `@dicebear/core` et `@dicebear/styles` : avatars, styles chargés à la demande ;
  - `vaul` : feuilles rendues dans la colonne, sans portail ;
  - `uqr` : QR code local du partage.
- **Développement** : Vite 8, Tailwind v4, TypeScript strict, ESLint, Vitest (jsdom, Testing
  Library).
- **Exclues** (`no-restricted-imports`) : shadcn, Radix (seulement comme dépendance de Vaul), Base
  UI, framer-motion/motion, cmdk, sonner, oidc-client-ts, i18next, lucide.
- Toute nouvelle dépendance se justifie ici avant d'être ajoutée.

## Structure

```
src/
  main.tsx      polices, CSS, télémétrie, initSession puis rendu
  app/          JoutioClientProvider (cache vidé en fin de session), router, runtime personnel (useJoutioSync)
  styles/       index.css + fichiers synchronisés du lab (ne pas éditer)
  ui/           design system porté du lab (barrel `@/ui`) : lib/ brand/ primitives/ mobile/ web/ site/
  lib/          config (Zod), endpoints, api (HTTP + RFC 7807, `http` : HttpClient de la lib), session (OIDC PKCE
                maison), realtime (STOMP, `realtime` : RealtimeTransport de la lib, horloge serveur), i18n, push,
                telemetry
  shared/       routes, stores, toasts, dialogues, avatars, utilitaires
  features/<f>/ components/ hooks/ lib/ index.ts (import par le barrel uniquement)
```

Routes notables :
- `/welcome` : onboarding ;
- `/login` (alias qui relance la connexion) et `/callback` ;
- `/me/edit` ;
- `/me/settings[/{account,privacy,notifications,game,display,help}]`, `/me/settings/privacy/blocked` ;
- `/join/:roomId` ;
- `/me/topics/:topicId/report/:reportId` : signalement ouvert depuis une notification, redirigé vers ses signalements ;
- `/dev/ui` : vitrine du socle, en dev seulement.

## Règles propres

- **Jetons** : `npm run sync:design` recopie du lab `tokens.generated.css`, `site.css` (→
  `design.css`), `tokens.generated.ts` et `public/brand/`. Jamais d'édition à la main.
- Aucun dossier de `public/` ne porte le nom d'une route : nginx répondrait `403` au rechargement.
- Typographie en `cqw` (relative à la colonne). Thème `data-jo-theme` sur `<html>`, posé avant le
  premier rendu (préférence `joutio-theme`) ; les écrans toujours sombres le forcent sur leur
  sous-arbre.
- **Session** : OIDC Authorization Code + PKCE maison (`lib/session/oauth.ts`), client public `web`.
  - Renouvellement en single-flight (`navigator.locks`) à l'échéance, au retour d'onglet et au
    retour réseau.
  - Échec transitoire : la session reste. Échec définitif : fin de session (`expired`,
    `unknownUser`, `suspended`).
  - `401` → renouvellement puis un seul rejeu ; `401 unknownUser` et `403 accountSuspended` →
    fin de session.
- **Données** (`docs/frontend/donnees-et-etat.md`) : l'app ne touche jamais au cache. Ni `useQueryClient`, ni
  `useQuery`/`useMutation`, ni clé, ni service de lecture ou d'écriture local : uniquement les hooks de
  `@joutio/client`, l'identifiant du joueur lu dans la session (`selectUserId`). Toasts et navigation passent à
  `mutate(v, { onSuccess, onError })` ; une sortie d'écran (fermer un salon, annuler une recherche) se fait dès l'appel.
  Restent côté app : l'envoi d'images (`shared/media`, progression d'envoi) et la rafale `/api/clock` de l'horloge
  serveur. `useAction` (`shared/`) ne sert qu'à la connexion chez identity, hors BFF.
- **Compte** : `useMe` n'est appelé que sous session (`AppFrame`, `AuthenticatedLayout`, onboarding et
  `JoinPage` séparent leur partie connectée) ; `useAccountLanguage` applique la langue du compte.
- **Temps réel** : connexion STOMP suspendue quand l'onglet est caché, avec backoff croissant ; bannière `connection`.
  Les flux (partie, salle, ticket) et la synchronisation personnelle (`useJoutioSync`, monté dans `PersonalRuntime`)
  sont ceux de `@joutio/client` (délai de grâce d'un agrégat neuf compris) ; l'arène appelle `resync()` quand une
  transition serveur ou l'écho d'une réponse tarde. Le transport ré-ancre l'horloge serveur sur chaque trame d'agrégat.
  Le bandeau « Partie en cours » lit `useActiveGames`, tenu à jour par la lib. Les canaux de
  présence (salon, ticket) sont ouverts par l'écran qui les affiche ; les toasts de notification lisent le flux
  personnel par `useSubscription`.
- **Défis** : onglet Défis sur `useDefis` (Salons rangés par `origin` : défis acceptés puis salons privés), pastille
  `useDefisBadge`, revanche par `useCreateChallenge` + `useRoomStream` (échéance du serveur), proposition reçue
  `useIncomingRematch`. Le lien Web Push `/social?tab=challenges&type=…` du BFF mène à `/challenges`.
- **Lien partagé** : `returnTo` garde `/join/{roomId}` pendant la connexion et l'onboarding ; le premier thème ne
  crée pas son salon tant qu'un lien attend (`returnTo.joinPending()`).
- **Web Push** (`public/sw.js`, `lib/push`) : seulement sur une action explicite.
- **Langue** : français par défaut tant que `MeView.language` est inconnu. Ajouter une clé :
  1. l'ajouter dans `@joutio/client` (FR et EN) ;
  2. publier ;
  3. l'utiliser ici.
- Pas de publicité ni d'`AdSlot` tant qu'aucune régie n'est branchée.

## Configuration

`VITE_API_URL` (BFF ; le WebSocket en dérive : `ws(s)://…/ws/websocket`),
`VITE_OIDC_AUTHORITY`, `VITE_OIDC_CLIENT_ID` (`web`), `VITE_OIDC_REDIRECT_URI` (défaut
`origin/callback`). Elles sont inlinées au build de l'image.

## Commandes

```bash
npm ci                 # jeton GitHub Packages requis pour @joutio (.npmrc)
npm run dev            # http://localhost:5173
npm run typecheck && npm run lint && npm test && npm run build
npm run sync:design    # après une évolution des jetons ou visuels du lab
```

CI `ci.yml` sur les PR ; `release.yml` part de `main` (semantic-release, image nginx, Image Updater).
