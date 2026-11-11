# AGENTS.md — joutio-web

> Application web de Joutio, **réécrite depuis une feuille blanche** à partir du laboratoire
> [`design/`](../../design/README.md) selon le kit [`design/specs/web-kit.md`](../../design/specs/web-kit.md) (D17).
> Branche longue `rewrite/web-kit` : `main` garde l'ancienne app (release et déploiement inchangés) jusqu'à la
> bascule, qui est le merge de cette branche (`web-kit.md` § 9).
> **Contrat backend normatif** : [`services/joutio-bff/AGENTS.md`](../../services/joutio-bff/AGENTS.md) § 3.
> Conventions de code : [`best-practices/.frontend/`](../../best-practices/.frontend/).

---

## 1. Rôle et sources de vérité

- Même produit que l'app mobile, sur le web : écrans du lab (`design/src/screens/`, specs
  `design/specs/screens/`, règles web `design/specs/platforms/web.md`). Au-delà de 640 px l'app vit dans la
  colonne de `WebFrame` (430 px, marque dans les marges, D16).
- **`design/` fait foi** : textes, composants, comportements. Le code du lab se **porte** (même API, mêmes classes,
  mêmes jetons), il ne s'importe jamais (`eslint` interdit tout import de `design/`). En cas d'écart, on corrige
  l'app, pas le lab ; un manque du lab se règle d'abord dans le lab.
- **Domaine client** : `@joutio/client-domain` (pin exact, GitHub Packages) — fold du duel, salles, atelier, DTOs du
  BFF. Aucune règle métier dupliquée dans l'app.
- L'ancienne app (`main`) se lit pour le comportement (auth web, refresh, cas limites), elle ne se copie pas.

## 2. Dépendances admises

`react`, `react-dom`, `react-router-dom`, `@tanstack/react-query`, `zustand`, `zod`, `react-hook-form`,
`@stomp/stompjs`, `@phosphor-icons/react`, `class-variance-authority`, `clsx`, `tailwind-merge`,
`@fontsource-variable/geist`, `@fontsource-variable/geist-mono`, `@joutio/client-domain`.
Dev : Vite 8, `@vitejs/plugin-react`, Tailwind v4 (`@tailwindcss/vite`), TypeScript ~6 strict, ESLint, Vitest
(jsdom, Testing Library).

**Exclues** (bloquées par `no-restricted-imports`) : shadcn, Radix, Base UI, framer-motion / motion, cmdk, sonner,
embla, oidc-client-ts, i18next, lucide. Toute nouvelle dépendance se justifie ici avant d'être ajoutée.

## 3. Structure

```
src/
  main.tsx            polices, CSS, télémétrie, initSession puis rendu
  app/                App (providers, thème, renouvellement), router
  styles/             index.css (Tailwind, @theme, utilitaires) + fichiers synchronisés du lab
  ui/                 socle de composants porté du lab (barrel `@/ui`)
    lib/ brand/ primitives/ mobile/ web/ site/
  lib/                infra transverse
    config.ts         variables Vite validées par Zod
    endpoints.ts      toutes les routes BFF / identity
    api/              client HTTP + erreurs RFC 7807
    session/          OIDC PKCE maison, store, renouvellement
    realtime/         STOMP + EventStream (dédoublonnage)
    query-client.ts, query-keys.ts
    i18n/ theme/ push/ telemetry.ts
  features/<nom>/     écrans + `lib/` (service → hook React Query), import par le barrel `index.ts` uniquement
```

`features/shell` : cadre (`AppFrame`), garde connectée (non onboardé → `/welcome`), onglets, bannière de connexion,
`/login`, `/callback`. `features/onboarding` : `/welcome` (étapes en mémoire, reprise aux univers après le retour OIDC). `features/dev` : vitrine `/dev/ui` (dev uniquement) pour comparer le socle au lab.

## 4. Jetons et styles

`npm run sync:design` recopie depuis le lab (jamais d'édition à la main) :

| Lab | App |
|---|---|
| `src/styles/tokens.generated.css` | `src/styles/tokens.generated.css` |
| `src/styles/site.css` | `src/styles/design.css` |
| `src/design-system/tokens.generated.ts` | `src/ui/tokens.generated.ts` |
| `public/brand/`, `public/topics/` | idem |

Typographie en `cqw`, relative à la colonne de `WebFrame`. Thème système / clair / sombre via `data-jo-theme` sur
`<html>` (script inline d'`index.html` avant le premier rendu, préférence `localStorage` `joutio-theme`) ; les écrans
toujours sombres posent `data-jo-theme="dark"` sur leur sous-arbre.

## 5. Plomberie

- **Config** : `VITE_API_URL` (BFF ; le WebSocket en dérive : `ws(s)://…/ws/websocket`), `VITE_OIDC_AUTHORITY`
  (`joutio-identity`), `VITE_OIDC_CLIENT_ID` (`web`), `VITE_OIDC_REDIRECT_URI` (défaut `origin/callback`). Noms
  conservés de l'ancienne app pour rester compatibles avec `release.yml`.
- **Session** : OIDC Authorization Code + PKCE implémenté maison (`lib/session/oauth.ts`), client public `web`.
  Connexion par code (`/api/auth/web/request-login-code`, `login-with-code`), Google / Facebook
  (`start-*-login`), logout. Renouvellement piloté (échéance, retour d'onglet, retour réseau) en single-flight
  (`navigator.locks`). Échec **transitoire** (réseau, 5xx) : la session reste ; échec **définitif**
  (`invalid_grant`…) : fin de session avec raison `expired | unknownUser | suspended`.
- **HTTP** : `401` → renouvellement puis rejeu unique ; `401 urn:joutio:authentification:unknownUser` → fin
  `unknownUser` ; `403 urn:joutio:authorization:accountSuspended` → fin `suspended`.
- **Retour d'identity** : `/login` est un alias qui relance la connexion (identity redirige encore les connexions
  sociales vers `/login?social=success`) ; `?continue=` reprend une autorisation tierce `/oauth2/authorize`.
- **Temps réel** : une connexion STOMP, JWT au `CONNECT`, backoff croissant, suspendue onglet caché ; état réseau
  (`useConnectionStore`) → `Banner` `connection`. `EventStream` dédoublonne par `sequenceNumber` et tamponne les trous.
- **Web Push** : `public/sw.js` + `lib/push`, déclenché seulement par une action explicite.
- **Langue** : FR/EN maison (`lib/i18n`), français par défaut tant que `MeView.language` n'est pas connu ; textes
  français = textes du lab, mot pour mot.
- **Télémétrie** : `/api/telemetry/events` (liste autorisée) et `/client-errors`.

## 6. Commandes

```bash
npm ci               # nécessite un jeton GitHub Packages pour @joutio (cf. .npmrc)
npm run dev          # http://localhost:5173
npm run typecheck && npm run lint && npm test && npm run build
npm run sync:design  # après une évolution des jetons / actifs du lab
```

CI : `ci.yml` (frontend-ci réutilisable) sur les PR. `release.yml` ne part que de `main`.

## 7. Avancement (`web-kit.md`)

- [x] Étape 1 — Fondations
- [x] Étape 2 — Plomberie (tests : client HTTP, session, EventStream)
- [x] Étape 3 — Socle de composants (groupes 1 à 5) ; onglets en écrans placeholder
- [ ] Étape 4 — Écrans dans l'ordre du parcours (`web-kit.md` § 6)
  - [x] Onboarding `/welcome` (connexion code/Google/Facebook, univers, notifications, premier thème, compte suspendu)
  - [x] Accueil `/` (Top 10, Nouveaux thèmes, Suivis paginés par univers, rang, série, cloche) ; fiche sujet,
        notifications et recherche en écrans d'attente. Le BFF n'a pas de slug de sujet : `/topics/{topicId}` en attendant
  - [x] Sujets `/topics` (recherche, puces et feuille Filtres, tri, masquage des suivis côté app comme le mobile)
- [ ] Bascule (merge de `rewrite/web-kit`)
