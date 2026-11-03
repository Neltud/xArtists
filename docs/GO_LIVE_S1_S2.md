# GO Live — S1/S2 evidence ladder (3 novembre 2026)

> **CORRECTIF P0 : les consignes « live mint armé par défaut » du 2 novembre sont révoquées.**
> Les ventes NFT, le mint mainnet et la livraison commerciale sont **NO-GO**.
> Les drapeaux Render ne protègent pas, à eux seuls, un workflow GitHub Actions déclenché manuellement.

## État de production observé (3 novembre 2026)

| Contrôle | Mesure | Signification |
|---|---|---|
| `paybox_mode` | `prod` | Merchant configuré, **pas autorisation d'encaisser** |
| `paybox_checkout_enabled` | `false` | Checkout public fermé |
| `mint_oidc_pull_enabled` | `true` | Auth GitHub→Render OIDC vérifiée, **dry-run seulement** |
| `mint_dispatch_enabled` | `false` | Ancien dispatch avec PAT désactivé |
| `mint_dry_run` | `true` | Simulation autorisée |
| `mint_live_enabled` | `false` | Aucun live mint API approuvé |
| `mint_micro_price` | `false` | Micro-prix live interdit |
| `lia_live_trading` | `0` | Signaux paper, pas de trading |
| `tro_solana_bridge` | `off` | Pas de pont ni transfert SOL mainnet |

Vérifier les valeurs les plus récentes sur
[`GET /health`](https://xartists-access-api.onrender.com/health).
Elles n'authentifient **ni** un paiement PayBox réel **ni** un reçu de livraison NFT.

## Workflow Mint on payment — sécurité mainnet

À compter du correctif de sécurité [PR #310](https://github.com/Neltud/xArtists/pull/310),
le job `mint` manuel contient une condition **inconditionnellement fausse**.
Toute sélection `live_mint=true` déclenche un job `live_disabled`
qui **échoue explicitement avant d'accéder à Production ou à un PEM**.
Seule la simulation `live_mint=false` peut réussir.

**Ne pas lancer de mint live ni de micro-mint en contournant ce verrou.**
Le code ancien `setPackPrice → buyPack → transfer NFT` est conservé
comme référence inerte : la modification de prix n'est pas atomique, et
sa séquence ne constitue pas une méthode de vente approuvée.

La présence effective de `SC_DEPLOYER_PEM` parmi les secrets de
l'environnement GitHub `production` **n'a pas été vérifiée ici**.
Même si ce secret existe, il ne vaut pas approbation financière ou
technique. Ne jamais publier ni coller le PEM dans un ticket ou un chat.

## S1, S2 et droit de livraison : trois portes différentes

1. **S1** : paiement PayBox authentique et signé RSA, prix catalogue
   exact, commande `paid` confirmée dans PostgreSQL, preuve PSP et
   procédure de remboursement/contestations validées.
2. **S2** : NFT réellement émis/transféré sur MultiversX mainnet et
   reçu par le bon `buyer erd1` ; vérification indépendante de
   transaction, émetteur, collection, nonce et solde destinataire.
3. **Livraison commerciale** : écriture SQL atomique, anti-replay et
   approuvée qui lie S1 à S2 après relecture de l'état courant,
   notamment tout remboursement tardif.

[PR #306](https://github.com/Neltud/xArtists/pull/306) vérifie des
candidats S1/S2 **en lecture seule**. Les migrations de réservation
[#308](https://github.com/Neltud/xArtists/pull/308) et
[#309](https://github.com/Neltud/xArtists/pull/309) ont été testées
dans PostgreSQL **jetable**, pas appliquées en production.
Un candidat `true` n'attribue **jamais** l'accès au NFT.

## Financement et prix on-chain

L'estimation historique du solde du deployer est d'environ
`0,005 EGLD` au 3 novembre ; refaire une lecture mainnet avant toute
décision. **Ne pas envoyer arbitrairement 15, 20 ou 33 EGLD** en se fondant
sur un ancien tutoriel. L'audit a identifié une divergence entre les
prix du contrat, le référentiel commercial Rule1 et le workflow.
La somme nécessaire doit être recalculée **après vérification
indépendante du contrat et résolution de la modification de prix
non atomique**, puis approuvée séparément.

## Ce qui est permis en attendant

- GitHub OIDC → Render dry-run et simulations de signature sans PEM.
- CI PostgreSQL jetable, tests anti-doublon, audit du refund et des
  preuves S1/S2.
- Amélioration UX, parcours My Packs `pending`, documentation,
  captures authentiques et marketing honnête.
- Publication logicielle de la version `0.130.0` seulement lorsque
  les contrôles CI GitHub de la PR #283 sont réellement verts ;
  **la release ne constitue pas le GO commercial**.

**Interdits tant que les portes ne sont pas levées :** checkout
PayBox réel, mainnet mint, micro-prix temporaire, délivrance automatique
NFT, trading LIA et bridge $TRO/SOL.

Pour l'exploitation :
[`GO_OPERATOR_CHECKLIST.md`](GO_OPERATOR_CHECKLIST.md) et
[`MINT_OIDC_DISPATCH.md`](MINT_OIDC_DISPATCH.md).
Suivi principal : [issue #281](https://github.com/Neltud/xArtists/issues/281).
