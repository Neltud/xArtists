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

## Reste à produire pour fidélité complète

- **Galerie (visuel 1)** : grille asymétrique, distinction œuvres/expositions, photographie réelle et provenance au premier plan ; ne pas contourner les règles de listings et disponibilité.
- **Studio (visuel 3)** : véritable éditeur en trois volets, import local image/vidéo/audio, brouillons robustes, panneau droits et prévisualisation. L'apparence ne doit pas laisser croire que l'upload serveur et la publication sont actifs avant preuve.
- **Cockpit (visuel 2)** : capture comparative desktop/mobile contre la référence et correction des écarts après CI, contrôle des thèmes et contrastes.
- Vérifier tous les tests, routes, 8 langues et responsive avant fusion. Le code de la branche est un lot de refonte, **pas une affirmation de publication sur xartists.art**.

## Contraintes non négociables

- Ne jamais inventer de solde, NFT, permission, paiement ou transaction.
- Ne jamais utiliser de seed/clé privée en frontend.
- Conservation de la navigation par clavier, du dock mobile et des anciennes URLs.
- Publication et transactions restent sous leurs garde-fous existants.
