# xArtists — Dimension

## Direction

Un univers graphite, chrome et vert acide. Une grande composition éditoriale accueille le visiteur ; les écrans de travail emploient une grille sobre, des contrastes lisibles et des actions hiérarchisées. Soul et Hatom ont servi de références pour l’articulation entre un univers visuel immersif et une application lisible. Aucun de leurs actifs n’a été repris.

La sculpture de l’accueil est calculée en WebGL avec Three.js : matériau métallique, éclairage physique, réaction au pointeur, variantes chromatiques, pause et repli CSS. Elle respecte les préférences de réduction des animations, suspend le rendu hors écran, en arrière-plan et pendant une boîte de dialogue. Les ressources GPU sont libérées à la sortie.

## Architecture des parcours

- Explorer : musée, marché, analyses, parcours culturels, RWA, éditions et lieux.
- Créer : studio, jumeau numérique, académie et visibilité.
- Intelligence : LIA, packs agents, contrôle, Lightning, PolyLIA, simulation et réseau.
- Finance : trading, $TRO, staking, liquidité, Hatom, Burnify, gouvernance, vente et soutien.
- Mon espace : wallet, portfolio, agents détenus, identité, paiements, historique et état des services.

`src/experience/modules.ts` est la source commune des routes, alias, menus, recherche et pages de catégories. Les 36 modules correspondent aux écrans du dépôt. Les anciennes routes restent compatibles et conservent les paramètres ; `/legal/terms` ouvre les conditions. Le parcours Voyage mène aux tours culturels, conformément à HEAD. Une page 404 remplace les redirections silencieuses pour les URL inconnues.

Les fiches d’œuvres lisent les NFT MultiversX. Les états chargement, vide, erreur et réessai sont explicites. Les métriques réseau proviennent de l’API ; aucune valeur commerciale n’est simulée.

## Internationalisation

Français, anglais, espagnol, allemand, russe, ukrainien, chinois et arabe. Le catalogue couvre les textes rendus, libellés dynamiques, erreurs, aides et modèles à paramètres. Les composants de traduction consomment le contexte de langue, y compris dans les composants mémorisés. Aucun texte n’est modifié après coup dans le DOM. Les noms d’œuvres, musées, marques, adresses et données saisies restent des contenus d’origine.

La langue est détectée, conservée sur l’appareil et partageable avec `?lang=fr`. `lang`, `dir`, titre, description, balises Open Graph et liens de langues suivent la route et la langue. L’arabe utilise une disposition RTL.

## Contrôles

- `node scripts/check-routes.mjs`
- `node scripts/verify-site.mjs`
- `node scripts/run-render-check.mjs`
- Build Vite de production.

Source métier : Neltud/xArtists. Le trading autonome LIA reste désactivé.

## Musée et connexion mobile

Joystick analogique, dual-touch, xPortal `provider.login({ approval })`, QR local, 8 langues dont RTL arabe.
