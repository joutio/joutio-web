/**
 * Service Worker Joutio — cache des images externes + notifications Web Push.
 *
 * Cache images : les visuels de sujets/questions viennent de Wikimedia via `Special:FilePath` :
 * la chaîne de redirections n'est pas cacheable (`max-age=0, must-revalidate`) et l'image finale
 * n'a pas de `Cache-Control`. On court-circuite donc les redirections en gardant la réponse finale
 * sous l'URL d'origine : les visites suivantes (et les questions de duel) sont servies
 * instantanément. Ne touche QUE les hôtes d'images : bundles, `index.html` et HMR restent intacts.
 *
 * Push : le payload est structuré (`type`, `actorPseudonym`, `path`…) ; le texte français et la
 * route de clic sont composés ici. Si une fenêtre de l'app est visible, on ne double pas la
 * notification OS (le STOMP met déjà l'inbox à jour) ; sinon on affiche la notification système.
 */
const CACHE = "joutio-images-v3";
const CACHE_PREFIX = "joutio-images-";
const IMAGE_HOSTS = new Set([
  "commons.wikimedia.org",
  "thumb.wikimedia.org",
  "upload.wikimedia.org",
  // Stockage Joutio (couvertures/bannières/questions uploadées + miroir du seed) : cache-first
  // côté client, même si MinIO sert déjà des URLs immuables.
  "media.joutio.com",
]);

const ICON = "/icons/icon-192.png";
const BADGE = "/icons/badge-72.png";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE)
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (!IMAGE_HOSTS.has(url.hostname)) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(request);
      if (cached) return cached;

      try {
        // Requête d'origine (no-cors) : les redirections Wikimedia n'exposent pas d'en-tête CORS,
        // un fetch CORS échouerait. La réponse opaque est acceptée par le Cache API (l'URL est
        // alors réécrite sur celle de la requête) et rejouable telle quelle pour le `<img>`.
        const response = await fetch(request);
        if (response.ok || response.type === "opaque") {
          await cache.put(request, response.clone());
        }
        return response;
      } catch {
        return Response.error();
      }
    })(),
  );
});

/** Texte de la notification (source unique côté client, aligné sur les libellés de l'inbox). */
function notificationContent(data) {
  const actor = typeof data.actorPseudonym === "string" && data.actorPseudonym
    ? data.actorPseudonym
    : "Un joueur";
  switch (data.type) {
    case "CHALLENGE_RECEIVED":
      return data.gameId
        ? {
            title: "Demande de revanche",
            body: `${actor} veut rejouer votre dernier duel.`,
          }
        : { title: "Nouveau défi", body: `${actor} te défie en duel.` };
    case "CHALLENGE_DECLINED":
      return { title: "Défi refusé", body: `${actor} a refusé ton défi.` };
    case "ROOM_ACCEPTED":
      return {
        title: "Défi accepté",
        body: `${actor} a accepté ton défi. Touche pour rejoindre.`,
      };
    case "WIZZ":
      return {
        title: "On te demande dans la salle !",
        body: `${actor} t'attend dans la salle. Touche pour le rejoindre.`,
      };
    case "QUESTION_REPORTED":
      return {
        title: "Signalement de question",
        body: `${actor} a signalé une question d'un de tes sujets.`,
      };
    case "FOLLOW":
      return { title: "Nouvel abonné", body: `${actor} s'est abonné à toi.` };
    default:
      return { title: "Joutio", body: "Tu as une nouvelle notification." };
  }
}

/**
 * Relaie le push aux onglets ouverts (le client rejoue alors ses invalidations React Query) et
 * indique si l'un d'eux est réellement au premier plan — visible **et** focalisé : au
 * verrouillage d'écran, la visibilité peut rester « visible », le focus non.
 */
async function notifyClients(data) {
  const windows = await self.clients.matchAll({
    type: "window",
    includeUncontrolled: true,
  });
  let foreground = false;
  for (const client of windows) {
    client.postMessage({ type: "JOUTIO_PUSH", payload: data });
    if (client.visibilityState === "visible" && client.focused) foreground = true;
  }
  return foreground;
}

self.addEventListener("push", (event) => {
  event.waitUntil(
    (async () => {
      let data = {};
      try {
        data = event.data ? event.data.json() : {};
      } catch {
        data = {};
      }

      // Fenêtre visible et focalisée : pas de notification OS, mais les onglets ouverts reçoivent
      // quand même le message pour rejouer leurs invalidations (WS en veille, trame manquée…).
      if (await notifyClients(data)) return;

      const { title, body } = notificationContent(data);
      // Filet client : si le serveur n'a pas fourni de route, un défi accepté avec partie pointe
      // directement vers l'arène.
      const fallbackPath =
        data.type === "ROOM_ACCEPTED" && data.gameId
          ? `/game/${data.gameId}`
          : "/notifications";
      const path =
        typeof data.path === "string" && data.path ? data.path : fallbackPath;
      await self.registration.showNotification(title, {
        body,
        icon: ICON,
        badge: BADGE,
        tag:
          data.type === "CHALLENGE_RECEIVED" && data.sourceId
            ? `challenge-${data.sourceId}`
            : data.type === "WIZZ" && data.sourceId
              ? `wizz-${data.sourceId}`
              : `notification-${data.notificationId ?? Date.now()}`,
        data: { path },
      });
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const path =
    event.notification.data && event.notification.data.path
      ? event.notification.data.path
      : "/notifications";
  event.waitUntil(focusOrOpen(path));
});

/** Focalise un onglet de l'app et le route sur la cible (sinon en ouvre un). */
async function focusOrOpen(path) {
  const url = new URL(path, self.location.origin).href;
  const windows = await self.clients.matchAll({
    type: "window",
    includeUncontrolled: true,
  });
  const existing = windows.find(
    (client) => new URL(client.url).origin === self.location.origin,
  );
  if (existing) {
    await existing.focus();
    try {
      await existing.navigate(url);
    } catch {
      // Client non contrôlé : la navigation sera retentée au prochain load.
    }
    return;
  }
  await self.clients.openWindow(url);
}
