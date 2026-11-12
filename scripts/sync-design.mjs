// Recopie depuis le lab (`design/`) les fichiers générés ou partagés que l'app ne réécrit jamais (D12, web-kit § 3) :
// tokens CSS et TS, styles partagés, actifs de marque. Les composants, eux, sont portés une fois puis maintenus ici.
// Usage : `npm run sync:design` (le dépôt du workspace doit contenir `design/` à côté de l'app).
import { cpSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const app = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const lab = resolve(app, '../../design')

if (!existsSync(lab)) {
  console.error(`Lab introuvable : ${lab}`)
  process.exit(1)
}

const copies = [
  // Même sortie que le lab : tailles fluides en `cqw` (conteneur = colonne de WebFrame) et `data-jo-theme`
  // applicable à un sous-arbre (écrans toujours sombres). Pas `tokens.web.css`, propre à la landing.
  ['src/styles/tokens.generated.css', 'src/styles/tokens.generated.css'],
  ['src/styles/site.css', 'src/styles/design.css'],
  ['src/design-system/tokens.generated.ts', 'src/ui/tokens.generated.ts'],
  ['public/brand', 'public/brand'],
  // Pas `public/topics` (images de démonstration du lab) : un dossier `topics/` servi à la racine entre en conflit avec
  // la route `/topics`, et nginx (`try_files $uri $uri/`) répond 403 au rechargement de la page Sujets.
]

for (const [from, to] of copies) {
  cpSync(resolve(lab, from), resolve(app, to), { recursive: true })
  console.log(`${from} → ${to}`)
}
