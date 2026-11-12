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
`@fontsource-variable/geist`, `@fontsource-variable/geist-mono`, `@joutio/client-domain`, `@dicebear/core` et
`@dicebear/styles` (avatars des joueurs, mêmes options et même rendu que le lab et le mobile ; décision du 2026-11-11,
moteur dans `src/shared/avatar/`, styles chargés à la demande par `import()`), `vaul` (feuilles `MobileSheet` : geste
tirer-pour-fermer, voile, focus, Échap ; rendue dans la colonne, sans portail) et `embla-carousel-react` (`Carousel` de
`src/ui/web/` : Détails du duel, séquence de déblocages, Signalements d'une question) — décision du 2026-11-12.
Dev : Vite 8, `@vitejs/plugin-react`, Tailwind v4 (`@tailwindcss/vite`), TypeScript ~6 strict, ESLint, Vitest
(jsdom, Testing Library).

**Exclues** (bloquées par `no-restricted-imports`) : shadcn, Radix (seulement en dépendance de Vaul, jamais
importé), Base UI, framer-motion / motion, cmdk, sonner, oidc-client-ts, i18next, lucide. Toute nouvelle dépendance se justifie ici avant d'être ajoutée.

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
| `public/brand/` | idem |

Pas de `public/topics/` : un dossier servi à `/topics/` masque la route Sujets (nginx `try_files $uri $uri/` → 403 au
rechargement). Aucun dossier de `public/` ne doit porter le nom d'une route.

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
- [x] Étape 4 — Écrans dans l'ordre du parcours (`web-kit.md` § 6)
  - [x] Onboarding `/welcome` (connexion code/Google/Facebook, univers, notifications, premier thème, compte suspendu)
  - [x] Accueil `/` (Top 10, Nouveaux thèmes, Suivis paginés par univers, rang, série, cloche) ; fiche sujet,
        notifications et recherche en écrans d'attente. Le BFF n'a pas de slug de sujet : `/topics/{topicId}` en attendant
  - [x] Sujets `/topics` (recherche, puces et feuille Filtres, tri, masquage des suivis côté app comme le mobile ;
        grille adaptative de `TopicTile` depuis le 2026-11-12 : pictogramme, sinon vignette, sinon univers ; pages en
        rangées pleines, `size` multiple du nombre de colonnes ; palettes d'univers claire/sombre synchronisées du lab)
  - [x] Fiche sujet `/topics/{topicId}` (Pill d'univers, Suivre optimiste avec retour arrière, Copier le lien, onglets
        Parties / Classement / Progression, titre porté optimiste, avatars DiceBear)
  - [x] Lancer une partie, Matchmaking, Rejoindre : feuille des 4 modes (difficulté du robot sur l'appareil, défi d'un
        abonnement/abonné), salon `/rooms/{id}` temps réel (présence, étapes, décompte, wizz, lien, fermeture),
        matchmaking `/play?ticket=` (entraînement automatique, panneau sans adversaire), `/join/{id}` public (connexion
        puis retour) ; horloge serveur et `useEventStream`
  - [x] Duel `/games/{id}` : arène toujours sombre pilotée par `sceneAt` (face-à-face, intros de manche, lecture de 2 s,
        question, révélation), réponse optimiste avec rattrapage REST, jauges, abandon confirmé à toute sortie
        (`useBlocker`), reconnexion, partie expirée ; toasts suspendus
  - [x] Résultat `/games/{id}/result` : séquence de déblocages juste après le duel (rang puis titres, déduits du bilan),
        en-tête et séries, Elo, anneau de maîtrise (récompense interrogée toutes les 1,5 s), revanche par le flux
        personnel (fenêtre de 10 s), Nouvel adversaire, Détails du duel, signalement du joueur et de la question.
        Écarts : pas de chat (le BFF n'a pas de messagerie), pas de Bloquer (aucun point d'entrée), badges non célébrés
        tant que `BadgeEarnedEvent` ne porte pas de `gameId`, revanche reçue (`RematchPrompt` global) à faire
  - [x] Profil `/me` (bannière en parallaxe, titre porté, rang, pays, compteurs, Copier le lien ; onglets Statistiques,
        Badges, Titres, Historique ; feuilles Rangs et famille de badges), Série `/me/streak` (calendrier, carte Micah),
        Sujets joués `/me/played`, Tous les titres `/me/titles` (recherche, rang, tri, porter optimiste), Toutes les
        parties `/me/games` (`?topicId`, `?opponentId`, filtres Type/Résultat/Tri), Tous les classements
        `/topics/{id}/leaderboard` (période, périmètre, podium, ma ligne en pied), Fiche joueur `/players/{id}`
        (Défier par choix du sujet, Suivre optimiste, actions dans la barre compacte, Signaler, bilan et 10 dernières
        parties ; ma fiche renvoie au Profil) ; les lignes de classement ouvrent la fiche. Réglages `/me/settings` en
        écran d'attente. Écarts : titres sans date de déblocage (tri « récents » = ordre du serveur), Bloquer absent
        (aucun endpoint), titre porté d'un autre joueur résolu par l'aperçu de son sujet
  - [x] Social `/social` (abonnements / abonnés avec totaux de `MeView`, recherche, feuille « Trier par » dont
        Présence par défaut, 20 par page côté serveur, épée → choix du sujet → défi, Inviter un ami par partage ou
        copie), Défis `/challenges` (quota des envoyés en sous-titre, puces avec compteurs, Reçus en aperçu de 3 puis
        paginés par 10, Tout refuser confirmé, Accepter ouvre la salle, Refuser / Annuler optimistes et par lot, Salons
        privés, état vide avec Créer un salon privé), Notifications `/notifications` (sections Aujourd'hui / Cette
        semaine / Plus ancien, défis reçus ouverts en tête, 10 par page, toucher = lue + écran de l'action, balayer =
        supprimer, Tout marquer comme lu, Tout supprimer confirmé). Flux personnel monté une fois (`PersonalRuntime`) :
        défis, salons, boîte et cloche relus sans polling ; pastille de l'onglet Défis = reçus en attente
        (`useTabBadges` du shell). Écarts : Relancer un défi visible mais inactif (aucun endpoint BFF), salle d'un défi
        accepté relue sur `GET /api/challenges/{id}` jusqu'à son `roomId` (pas de recalcul local de l'identifiant),
        brouillon et signalement ouvrent `/me/topics` en écran d'attente (atelier à l'écran 11), pas de toast à la
        réception d'une notification ni de bandeau « Partie en cours »
  - [x] Réglages `/me/settings` (Profil : avatar, pseudonyme, bio, pays avec drapeaux, centres d'intérêt, bannière
        envoyée par `POST /api/media` ; Langue ; Apparence Sombre / Clair / Système ; Duel sans Vibrations ;
        Notifications avec la `Notice` tant que le navigateur ne les autorise pas ; Compte : Premium, Mes sujets, pages
        légales du site (`VITE_SITE_URL`), Se déconnecter confirmé), Supprimer mon compte `/me/settings/delete` (code
        envoyé à l'ouverture, Renvoyer le code, confirmation puis retour à la connexion), Éditeur d'avatar
        `/me/settings/avatar` (onglets du lab Style, Visage, Cheveux, Lunettes, Fond ; droits des styles comme
        `AvatarEntitlementPolicy` ; enregistrement optimiste), Premium : feuille unique (`PremiumHost`, `showPremium`)
        ouverte par les Réglages, l'éditeur, Sujets joués et la limite de défis, `/premium` l'ouvre sur l'Accueil.
        Écarts : Premium en état Bientôt seulement (offre non ouverte, liste d'attente mémorisée sur l'appareil,
        aucun endpoint) ; Revanches, Rangs et badges, Sons du duel et Icônes et points des réponses sont locaux à
        l'appareil (`useDeviceSettings`), seul Défis et salons est persisté (`ROOM`) ; aucun son n'existe encore ;
        l'éditeur ne règle que les options Micah maquettées par le lab (Lorelei et Notionists : style et fond)
  - [x] Création `/me/topics` (atelier, feature `workshop`) : Mes sujets (À traiter avec pastille, + Nouveau sujet,
        Premium au-delà du sujet publié gratuit), Mon sujet `/me/topics/{id}` (parallaxe, statut et rôle, nom FR/EN,
        univers, vignette, pictogramme PNG, Questions / Équipe / Modération, Publier, Supprimer le brouillon, Repasser
        en brouillon), Questions `…/questions` (recherche, Trier et filtrer, statuts, repère du minimum ou du plafond,
        10 par page), éditeur `…/questions/{id|new}` (image, FR/EN, description d'image, Juste, Gérer selon le rôle,
        enregistrement optimiste par opérations de `@joutio/client-domain`), Modération `…/moderation` (À valider /
        Signalements, rejet motivé), Signalements `…/reports/{questionId}` (file balayable, `DetentSheet`, Actuelle /
        Signalée, Clore confirmé, Modifier clôt en `RESOLVED`), Équipe `…/team`. Les notifications de signalement
        ouvrent la file sur leur question (signalement cerclé, retour « Notifications »), celles de brouillon Mon sujet.
        Écarts : plafonds (1 / 10 sujets, 30 / 150 questions, Équipe Premium) appliqués par l'app seule ; description
        d'image saisie mais non envoyée (aucun champ backend) ; recherche, tri et filtres sur toutes les questions
        chargées (pas de filtre serveur) ; statuts montrés aussi en brouillon, comme le mobile ; invitation par la
        recherche globale (2 lettres) au lieu d'une liste paginée de candidats ; pas d'entrée Modération sur la Fiche
        sujet (absente du lab)
  - [x] États système : bannière de connexion, reconnexion, partie expirée, compte suspendu et session expirée déjà en
        place ; ajout de **Reprendre une partie** (`features/ongoing`) : parties actives (`GET /api/games?active=true`)
        relues au démarrage, au retour de l'onglet et de la connexion et à chaque défi accepté, salons visités suivis en
        temps réel (`shared/ongoing-store`), bandeau global « Partie en cours » (Rejoindre) à la place de la bannière de
        connexion quand elle est absente, sans redirection, masqué dans l'arène de la partie. Pas de suivi publicitaire
        ni d'`AdSlot` sur le web (aucune régie en V1)
  - [x] Recherche `/search` (champ focalisé, récentes sur l'appareil `joutio.search.recents`, Sujets puis Joueurs dès
        2 lettres par `GET /api/suggestions`, hors connexion, aucun résultat). Écart : sans bottom nav, comme le lab (la
        spec, encore en brouillon, la mentionne) ; l'écran d'attente `PendingScreen` est retiré, plus aucun écran manquant
- [x] Ajustements web du 2026-11-12 : feuilles sur Vaul, `TabsScrollView` sans balayage (propre au mobile), `Carousel`
      Embla (Détails du duel, chaque manche défilable ; séquence de déblocages ; Signalements), séquence de déblocages
      jouée une seule fois par partie (`features/result/lib/celebrated.ts` + état de navigation nettoyé), bannière
      « Joutio est meilleur dans l'app » sur l'Accueil (< 1 024 px, masquée après « Ouvrir »), tirer-pour-rafraîchir
      rendu à `ParallaxScreen`, `public/topics/` retiré (403 au rechargement de `/topics`)
- [ ] Bascule (merge de `rewrite/web-kit`)
