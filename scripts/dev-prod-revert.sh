#!/usr/bin/env bash
#
# Annule l'installation locale de `scripts/dev-prod.sh` :
#   1. arrête le serveur Vite qui écoute sur le port 443 (s'il tourne) ;
#   2. retire l'entrée `app.joutio.com` de /etc/hosts ;
#   3. supprime les certificats locaux `certs/app.pem` et `certs/app-key.pem` ;
#   4. supprime le cache Vite root-owned `/tmp/joutio-vite-cache`.
#
# Usage :
#   scripts/dev-prod-revert.sh                # tout nettoyer
#   scripts/dev-prod-revert.sh --keep-certs   # conserver certs/
#   scripts/dev-prod-revert.sh --keep-cache   # conserver /tmp/joutio-vite-cache
#   scripts/dev-prod-revert.sh --force        # arrêter aussi un process 443 non-Vite
#   scripts/dev-prod-revert.sh --dry-run      # afficher les actions sans les exécuter
#
# La CA mkcert installée dans le trousseau n'est **jamais** retirée : elle est partagée
# avec les autres projets locaux. `mkcert -uninstall` reste une action manuelle.
set -euo pipefail

HOST="app.joutio.com"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CERT_DIR="$ROOT/certs"
CACHE_DIR="/tmp/joutio-vite-cache"

KEEP_CERTS=0
KEEP_CACHE=0
FORCE=0
DRY_RUN=0

for arg in "$@"; do
  case "$arg" in
    --keep-certs) KEEP_CERTS=1 ;;
    --keep-cache) KEEP_CACHE=1 ;;
    --force) FORCE=1 ;;
    --dry-run) DRY_RUN=1 ;;
    -h|--help)
      sed -n '2,20p' "$0"
      exit 0
      ;;
    *)
      echo "✗ option inconnue : $arg" >&2
      exit 2
      ;;
  esac
done

run() {
  if [ "$DRY_RUN" = 1 ]; then
    printf '  [dry-run]'
    printf ' %q' "$@"
    printf '\n'
  else
    "$@"
  fi
}

echo "→ revert dev-prod (${HOST})"

# 1. Serveur sur 443. On ne tue que Vite/Node par défaut : le port peut appartenir à
#    un autre service local.
PIDS="$(lsof -nP -tiTCP:443 -sTCP:LISTEN 2>/dev/null || true)"
if [ -n "$PIDS" ]; then
  for pid in $PIDS; do
    COMMAND="$(ps -p "$pid" -o command= 2>/dev/null || true)"
    case "$COMMAND" in
      *vite*|*node*)
        echo "→ arrêt du PID ${pid} sur 443"
        run sudo kill "$pid"
        ;;
      *)
        if [ "$FORCE" = 1 ]; then
          echo "→ arrêt forcé du PID ${pid} sur 443 (${COMMAND})"
          run sudo kill "$pid"
        else
          echo "✗ le port 443 est tenu par un process non-Vite :" >&2
          echo "  ${pid} ${COMMAND}" >&2
          echo "  relance avec --force pour l'arrêter." >&2
          exit 1
        fi
        ;;
    esac
  done
  if [ "$DRY_RUN" = 0 ]; then
    for _ in 1 2 3 4 5; do
      lsof -nP -iTCP:443 -sTCP:LISTEN >/dev/null 2>&1 || break
      sleep 0.2
    done
    if lsof -nP -iTCP:443 -sTCP:LISTEN >/dev/null 2>&1; then
      echo "✗ le port 443 est toujours occupé." >&2
      exit 1
    fi
  fi
else
  echo "✓ aucun serveur sur 443"
fi

# 2. Résolution locale.
if grep -qE "^[^#]*[[:space:]]${HOST}([[:space:]]|$)" /etc/hosts; then
  echo "→ suppression de l'entrée ${HOST} de /etc/hosts"
  run sudo sed -i '' "/[[:space:]]${HOST}\$/d" /etc/hosts
else
  echo "✓ /etc/hosts ne contient pas ${HOST}"
fi

# 3. Certificats locaux.
if [ "$KEEP_CERTS" = 1 ]; then
  echo "✓ certificats conservés (${CERT_DIR})"
else
  for file in "$CERT_DIR/app.pem" "$CERT_DIR/app-key.pem"; do
    if [ -f "$file" ]; then
      echo "→ suppression de ${file#"$ROOT"/}"
      run rm -f "$file"
    fi
  done
  if [ "$DRY_RUN" = 0 ] && [ -d "$CERT_DIR" ] && [ -z "$(ls -A "$CERT_DIR" 2>/dev/null)" ]; then
    rmdir "$CERT_DIR"
  fi
fi

# 4. Cache Vite hors dépôt (root après un lancement sous sudo).
if [ "$KEEP_CACHE" = 1 ]; then
  echo "✓ cache Vite conservé (${CACHE_DIR})"
elif [ -e "$CACHE_DIR" ]; then
  echo "→ suppression du cache Vite ${CACHE_DIR}"
  if [ -w "$CACHE_DIR" ]; then
    run rm -rf "$CACHE_DIR"
  else
    run sudo rm -rf "$CACHE_DIR"
  fi
else
  echo "✓ aucun cache Vite à supprimer"
fi

if [ "$DRY_RUN" = 0 ]; then
  echo "✓ dev-prod annulé."
  echo "  La CA mkcert reste installée ; 'mkcert -uninstall' est manuel."
fi
