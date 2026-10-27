# Rangs du Top 10

Chiffres 1 → 10 repris des SVG de FranceTV (`https://www.france.tv/images/top-10-{n}.svg`).

Ils conservent les largeurs intrinsèques de chaque chiffre (et donc le chevauchement exact
avec la carte) ainsi que leur hauteur commune. Utilisés en `<img>` : les identifiants de
dégradés internes restent isolés dans chaque document SVG.

Le SVG du `1` est recadré à gauche (`viewBox` 16.705 → 44.051) pour supprimer son padding
transparent interne : son glyphe démarre ainsi au bord du ScrollArea, aligné avec le titre et
les cartes des sections suivantes.
