# xArtists navigation V2 — parcours débutant / architecture d'information

Date : 8 novembre 2026 — frontend browse-only. Le changement ne touche aucun
contrat, fonds, statut métier, paiement ou rôle d'administration.

## Avant

- Le dock mobile comportait Accueil, Marketplace, **Enchères**, Studio, DAO.
  « Découvrir » / Musée n'était accessible que via le menu.
- Le menu regroupait de nombreux services techniques derrière un seul
  bloc secondaire non différencié.
- La recherche affichait la quarantaine de modules au premier clic.
- Les sections du menu desktop ne restaient pas sélectionnées sur des alias
  ou des sous-pages (exemple /auction et /finance/governance).

## Après

- **Dock mobile à cinq accès clairs : Accueil · Découvrir · Créer · Marketplace · DAO**.
  Les enchères restent atteignables depuis la marketplace, l'accueil et le menu
  détaillé. Aucun module ni alias supprimé.
- Menu « débutant d'abord » : accueil, musée, Studio, marketplace, guide,
  **annuaire complet** avant les catégories spécialistes repliées :
  enchères/RWA, IA, NFT Factory, jumeau 3D, licences XA World Rights, wallet,
  portfolio et packs.
- Recherche globale ⌘/Ctrl+K : six entrées essentielles à vide, maximum
  douze résultats pour une requête, lien direct à l'annuaire qui permet de
  retrouver **tous** les modules.
- Les routes historiques et les sous-pages donnent un état actif cohérent
  au menu et au dock ; aucun wallet exigé pour la découverte.
- Design premium en **light** par défaut, dark via toggle existant. Contraste
  des tokens `--xa-text`, `--xa-accent`; focus visible, touches de 44 px,
  prise en charge des préférences de réduction des animations.

## Matrice fonctionnelle de validation

| Scénario | Chemin | Validation attendue |
| --- | --- | --- |
| Nouveau visiteur | / → Découvrir → /explore/museum | Le dock affiche « Découvrir » actif |
| Créateur NFT | / → Créer → /create/studio | Studio sans wallet obligatoire à la consultation |
| Acheteur explorateur | / → Marketplace → /explore/market | Achats encore verrouillés selon capacité réelle |
| Enchères | Menu → section avancée → /auction | Route toujours présente ; jamais « achat live » par défaut |
| Gouvernance | Dock DAO → /finance/governance | Parcours visible ; votes démo clairement distingués |
| Artiste 3D | Menu avancé → /digital-twin et /nft-factory | Les outils restent accessibles |
| Droits sociaux | Menu avancé → /create/world-rights | Atelier consultable ; plugin payant verrouillé |
| Chercher une fonction | ⌘/Ctrl+K ; rechercher ; annuaire | 6 suggestions initiales, 12 max, catalogue entier via /directory |
| Accessibilité | 360, 390, 430, 1440 px | Aucun débordement ; focus + Escape ; contraste light/dark |
| Anciennes URLs | /marketplace, /museum, /dao, /rwa, /auction | Les alias restent intacts et montrent le bon hub actif |

## Validation / GO

Tests : `node --test apps/frontend/tests/navigation-v2.test.mjs` et
les contrats existants beginner, mobile commerce, DAO et responsive Playwright.
Vérifier le build TypeScript et capture visuelle mobile **avant merge**.
Après merge, vérifier que le `source_sha` publié par Pages/Render égale
exactement le SHA fusionné.

**Ce changement n'active aucune fonctionnalité commerciale.** Le niveau
`browse` ne signifie jamais paiement, IPFS pin, mint, DAO on-chain,
escrow ou trading live. Aucun lien historique ne doit être supprimé.
