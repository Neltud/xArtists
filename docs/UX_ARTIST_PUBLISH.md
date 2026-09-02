# UX Artist Publish — xArtists

## Flux artiste en 3 étapes

1. **Wallet**
   - connecter son wallet si disponible
   - sinon continuer en mode préparation sans bloquer l’artiste
2. **Œuvre**
   - image locale avec preview
   - titre, description, type `digital|phygital`
   - prix EGLD + royalties
3. **Confirmer**
   - sauvegarde locale de la fiche
   - export JSON partageable
   - CTA mint / list si les adresses SC sont disponibles

## Dégradation élégante

- Si l’adresse marketplace ou minter manque, `/publish` reste utilisable en mode **Préparer la fiche**.
- Aucun secret, PEM ou clé n’est requis pour cette UX.
- Les images restent locales jusqu’au mint réel.

## Portes produit

- **Artiste** : publier une œuvre rapidement depuis `/publish`
- **Collectionneur** : explorer `/marketplace` et `/agents`

## Business model

- **Marketplace fee** : commission xArtists sur les ventes
- **Royalties** : pourcentage reversé à l’artiste
- **Agents LIA limited edition** : ventes limitées via `/agents`
- **Tip** : soutien direct à l’écosystème / artistes

## Notes frontend

- Mobile-first et dark mode natifs
- FR/EN basique sur le flux publish
- En cas d’absence de SC, la UI ne crash pas et garde les CTA utiles
