# xArtists — Direction visuelle retenue (23 novembre 2026)

## Références fournies par le propriétaire

1. **Galerie immersive xArtists.png** — galerie d'art en papier clair, rail compact violet, œuvre éditoriale dominante et œuvres secondaires.
2. **Cockpit sombre du wallet xArtists.png** — **référence principale retenue** : rail sombre large, navigation par usage, wallet en bandeau violet, états de tokens et NFT, cartes IA à droite, œuvres publiques en bas.
3. **Atelier visuel xArtists.png** — atelier clair en trois colonnes (médias / prévisualisation / propriétés), chargement d'image, vidéo ou musique depuis l'appareil.

Le visuel 2 est la direction maîtresse ; les visuels 1 et 3 sont des variantes de surface pour l'art et la création, pas trois produits différents.

## Lot code livré dans la branche design/visual-reference-2-20261123

- Rail fixe desktop regroupant wallet, marketplace, studio, agents & IA, écosystème. Rail étroit sur les parcours Art / Studio. Navigation existante conservée sur mobile et toutes les anciennes URLs demeurent compatibles.
- Champ de recherche de la coque élargi sur ordinateur, activant toujours la recherche fonctionnelle existante.
- Wallet transformé en cockpit : vrai état de connexion, lecture des montants et actifs via `useUserAccount`, onglets Vue d'ensemble / Tokens / NFT, requête unique réutilisée.
- Pulse/Yield/Sentinel présentés comme **découverte de capacités**, sans prétendre que l'utilisateur détient un pack. Les droits d'accès réels restent sous `/workspace/agents`.
- Galerie d'œuvres depuis la collection NFT publique réellement interrogée ; état indisponible maintenu si le réseau échoue.
- Libellés du nouveau cockpit ajoutés dans huit langues.
- Aucun changement de politique métier : pas d'activation mint, PayBox, xOrus assisted ni trading autonome.

## Lot 2 intégré dans la même PR (#633)

- **Galerie (visuel 1)** : nouvelle grille éditoriale asymétrique. Les trois images sont tirées du catalogue existant `apps/frontend/public/data/xartists_collections.json` daté du 29 juillet 2026 : `ALISTOR-a646bc-03` (TRANSMUNDO 03), `ASFT-a6273a-01` (BlackArtPass), `BGG-2b627c-05` (Line Up #03). Chaque œuvre ouvre sa fiche Explorer, jamais un achat non prouvé. Le statut commercial est explicitement non vérifié. Catalogue de vente et listing de vérification restent plus bas.
- **Studio (visuel 3)** : atelier responsive en trois colonnes (médias, aperçu, droits/propriétés), import local d'images/vidéos/audios, limites 12 fichiers de 30 Mo, galerie de fichiers locale, sélection/suppression, zoom, titre/description/déclaration de licence.
- Le **brouillon de métadonnées** reste sur l'appareil via `localStorage` ; **les fichiers binaires ne sont jamais persistés ni transmis** par cet éditeur. Après rechargement, l'utilisateur doit les choisir à nouveau.
- Le bouton **Publier** du nouvel atelier est désactivé. Le parcours existant `CreatorMediaUpload` / IPFS / NFT, avec ses protections de signature, reste accessible séparément dans la section technique. Aucune transaction ou publication n'est déclenchée par le nouvel atelier.
- Test E2E ajouté pour les trois œuvres de référence, l'import local, les données du brouillon après rechargement, le bouton désactivé et l'absence de débordement mobile.
- Tests E2E de la PR corrigés pour pointer vers le rail et le cockpit de la V2 plutôt que des sélecteurs de l'ancienne navigation.

## Suite avant publication

1. CI TypeScript, 529+ contrats frontend, E2E responsive / wallet / langues / sécurité intégralement verts sur **le dernier commit**, pas seulement sur des commits intermédiaires.
2. Comparaison de captures desktop (1440px) et mobile (390px) avec les trois références, corrections accessibilité/contraste et validation du comportement des images lorsqu'un CDN échoue.
3. Vérifier le lien entre Studio visuel et upload IPFS réel sous quotas et garde-fous serveur ; ne pas confondre brouillon local et fichier publié.
4. Garder les flags commerce, mint et trading hors de cette PR. Pas de fusion ni de publication revendiquée tant que la validation n'est pas vérifiée.

## Contraintes non négociables

- Ne jamais inventer de solde, NFT, permission, paiement ou transaction.
- Ne jamais utiliser de seed/clé privée en frontend.
- Conservation de la navigation par clavier, du dock mobile et des anciennes URLs.
- Publication et transactions restent sous leurs garde-fous existants.
