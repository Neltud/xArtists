# GO live health snapshot — 2026-11-02 ~20:38 CET

## Archive remplacée pour les décisions de lancement

**Ce snapshot du 2 novembre est historique.** Pour les blocages et preuves exigées, consulter [GO live status](GO_LIVE_STATUS.md). Le 4 novembre, la sonde publique de `/health` a reçu HTTP 503 à deux reprises ; les flags actuels ne sont donc pas établis par ce contrôle.

Les valeurs historiques étaient : `paybox_mode=prod`, `orders_backend=postgres`, `mint_dry_run=true`, `mint_live_enabled=false`, `mint_dispatch_enabled=false`, `lia_live_trading=0`. Elles ne sont ni une garantie de disponibilité actuelle, ni une preuve de règlement PSP, ni une preuve NFT.

## Correction des anciennes recommandations

- **Prod + Postgres ne signifie pas « commercial ready ».** Il faut les preuves de paiement signé, livraison atomique, propriété et remboursement de [#281](https://github.com/Neltud/xArtists/issues/281).
- Le chemin de préparation a évolué vers **OIDC pull dry-run**. L'ancienne recommandation de créer un PAT et d'armer le dispatch push est retirée. Vérifier l'architecture et les contrôles actuels avant toute modification.
- Une acceptation de job GitHub ou OIDC n'est pas un mint confirmé.
- Le constat historique « toutes les routes critiques HTTP 200 » ne s'applique plus : sondes du 4 novembre, Auction et Offres 404, page TRO en erreur de CSS ; [#362](https://github.com/Neltud/xArtists/issues/362).
- Aucun flag commercial ou trading ne doit être activé sur la base de cette archive. La PR #378 fusionnée fournit uniquement une simulation PAPER.

Aucun secret, PAT, PEM ou contenu client ne doit être ajouté à ce document.
