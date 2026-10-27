#!/usr/bin/env bash
#
# Dev local branché sur les services de PRODUCTION.
#
# Le serveur Vite sert le build local sur l'origine publique
# `app.joutio.com` (port 443, TLS local). C'est la seule origine acceptée par
# identity en production : redirect URI enregistrée, origine autorisée en CORS, et
# cookie de session `AUTH_TX` (SameSite=Lax) same-site avec `identity.`.
#
# Usage :
#   scripts/dev-prod.sh          # prépare le certificat + /etc/hosts puis lance Vite (sudo)
#   scripts/dev-prod.sh --off    # retire /etc/hosts et arrête le serveur (garde certs/cache)
#   scripts/dev-prod-revert.sh   # nettoyage complet : serveur, hosts, certs et cache Vite
#
# prérequis : mkcert (`brew install mkcert`), Node installé, port 443 libre.
set -euo pipefail

HOST="app.joutio.com"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CERT_DIR="$ROOT/certs"

cd "$ROOT"

if [ "${1:-}" = "--off" ]; then
  shift
  # Même logique que le revert complet, sans toucher aux certificats ni au cache.
  exec "$ROOT/scripts/dev-prod-revert.sh" --keep-certs --keep-cache "$@"
fi

if ! command -v mkcert >/dev/null 2>&1; then
  echo "✗ mkcert manquant : brew install mkcert" >&2
  exit 1
fi

# 1. Certificat local pour l'origine mimée.
if [ ! -f "$CERT_DIR/app.pem" ] || [ ! -f "$CERT_DIR/app-key.pem" ]; then
  echo "→ génération du certificat local pour ${HOST}"
  mkdir -p "$CERT_DIR"
  # `mkcert -install` demande les droits admin : on ne le lance que si la CA manque.
  if ! security find-certificate -c "mkcert" /Library/Keychains/System.keychain >/dev/null 2>&1; then
    mkcert -install
  fi
  mkcert -cert-file "$CERT_DIR/app.pem" -key-file "$CERT_DIR/app-key.pem" "$HOST"
else
  echo "✓ certificat présent (${CERT_DIR})"
fi

# 2. Résolution locale de l'origine prod (Safari ne sait pas surcharger le DNS).
if ! grep -qE "^[^#]*[[:space:]]${HOST}([[:space:]]|$)" /etc/hosts; then
  echo "→ ajout de ${HOST} → 127.0.0.1 dans /etc/hosts"
  echo "127.0.0.1 ${HOST}" | sudo tee -a /etc/hosts >/dev/null
else
  echo "✓ /etc/hosts contient déjà ${HOST}"
fi

# 3. Environnement prod-local (fichier ignoré, créé depuis l'exemple si absent).
if [ ! -f .env.prod-local.local ]; then
  if [ -f .env.prod-local.example ]; then
    echo "→ création de .env.prod-local.local depuis .env.prod-local.example"
    cp .env.prod-local.example .env.prod-local.local
  else
    echo "✗ .env.prod-local.example manquant" >&2
    exit 1
  fi
fi

# 4. Le port 443 doit être libre (sinon Vite échoue en strictPort).
if lsof -nP -iTCP:443 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "✗ le port 443 est déjà utilisé :" >&2
  lsof -nP -iTCP:443 -sTCP:LISTEN >&2
  exit 1
fi

# 5. Cache Vite hors dépôt : il appartient à root après un premier lancement, on le
#    recrée pour repartir d'un état propre (optimisation des dépendances).
if [ -d /tmp/joutio-vite-cache ] && [ ! -w /tmp/joutio-vite-cache ]; then
  echo "→ purge du cache Vite root-owned"
  sudo rm -rf /tmp/joutio-vite-cache
fi

echo "→ https://${HOST} (mot de passe sudo demandé pour le port 443)"
echo "  données réelles : utilise un compte de test dédié."
exec sudo -E env "PATH=$PATH" npm run dev:prod
