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

- `node scripts/check-routes.mjs` : existence des écrans, unicité des routes, liens internes du graphe d’imports.
- `node scripts/verify-site.mjs` : langues, paramètres, dictionnaires et ressources statiques.
- `node scripts/run-render-check.mjs` : 64 rendus des nouveaux parcours dans 8 langues.
- `node scripts/run-render-check.mjs modules` : 288 rendus initiaux des 36 modules dans 8 langues.
- Build Vite de production.

Ces rendus sont des contrôles serveur, pas une validation visuelle ou une exécution des effets dans un navigateur. L’environnement n’expose pas le contrôle navigateur pris en charge par Sites. Les signatures wallet, les services externes et les parcours connectés n’ont pas été exécutés. Le dépôt comprend des erreurs TypeScript héritées ; les fichiers de la nouvelle expérience ne produisent pas d’erreur TypeScript. Le build de production n’est pas bloqué par ces erreurs héritées.

Source métier : Neltud/xArtists HEAD `4ca8047854f63d1269a6e387a46cb0b8f0684df0`. Les adresses et règles de signature des contrats sont conservées. Le trading autonome LIA reste désactivé, comme dans la configuration d’origine. L’audience Sites reste privée.

## Musée et connexion mobile

La visite s’ouvre dans la page, avec plein écran volontaire et bouton de sortie. La vue subjective laisse les œuvres visibles ; une vue avec avatar reste disponible. L’éclairage, les cadres, les proportions des textures et leur orientation intérieure ont été corrigés. Des boutons précédent/suivant rapprochent le visiteur des œuvres. Les erreurs d’image et le repli sans WebGL sont explicites.

Le joystick partage maintenant les références attendues par le moteur et fournit un déplacement analogique. Son pointeur est indépendant du glissement qui oriente la caméra. Les commandes se réinitialisent à l’annulation du geste, à la perte de focus et au passage en arrière-plan. Le déplacement suit l’orientation de la caméra ; les collisions et la distance de caméra sont conservées. Le clavier accepte flèches, WASD et ZQSD lorsque la salle a le focus.

La connexion xPortal appelle `provider.login({ approval })` avant de lire l’adresse. Les QR sont générés localement ; le passage vers l’app part d’un lien touché par l’utilisateur. Le lien Android utilise l’URI WalletConnect, iOS le schéma xPortal. Le lien Firebase retiré a été supprimé. Délais d’attente, annulation et approbation tardive sont gérés. Les métadonnées du portefeuille utilisent l’origine du Site ; le projet WalletConnect existant est conservé et peut être remplacé par `VITE_WALLETCONNECT_PROJECT_ID`.

`node scripts/run-render-check.mjs mobile` vérifie les déplacements et collisions, l’activation de session avec un fournisseur simulé, refus/expiration/annulation, les liens natifs, le QR local et les commandes dans les huit langues. Ces tests ne valident pas le rendu GPU, les gestes sur un téléphone physique ni l’approbation réelle dans xPortal.
