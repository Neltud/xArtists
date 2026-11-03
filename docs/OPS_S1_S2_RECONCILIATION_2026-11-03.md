# xArtists — rapprochement S1 PayBox / S2 NFT MultiversX

**Date :** 3 novembre 2026. **État :** vérification logicielle, **NO-GO commercial**.
Les scénarios CI sont fictifs, n'effectuent aucune requête vers PayBox ni MultiversX
mainnet, et ne démontrent pas un paiement réel.

## Séparation des preuves

| Gate | Preuve indépendante attendue | État au 3 novembre |
|---|---|---|
| S1 | Callback RSA réellement signé par le PSP autorisé, PSP `idtrans`, montant exact, commande persistée, preuve comptable et remboursement | **NON PROUVÉ EN RÉEL** ; simulations CI OK |
| Dispatch | Job GitHub corrélé à la commande, code HTTP 204, exécution réussie | **OIDC authentifié prouvé** ; aucune commande candidate réelle lors du run |
| S2 | Transaction on-chain `executed` + `process-status=success`, un événement ESDTNFTTransfer exact, détention du NFT par le bon acheteur | **VERIFICATEUR READ-ONLY** ; pas encore de reçu de vente réel |
| Livraison | Transaction SQL atomique et vérifiable liant commande, PSP, token et tx, anti-replay, approbation opérateur et remboursement | **PAS IMPLÉMENTÉ**, ne pas afficher « livré » |

## Contrôle technique supplémentaire

`services/access-api/src/s1s2Reconciliation.mjs` fournit
`verifyOrderReceiptBindings` et `attestS1S2Candidate`.

Ce module n'a **ni API publique, ni écriture SQL, ni fonction de mint ou de
paiement**. Les preuves doivent provenir d'un opérateur agréé ayant obtenu
une lecture cohérente de la base de commandes, de la base de jobs mint et
de la configuration de collection/issuer auditée. Il vérifie :

1. La commande existe en `paid`, avec `server_confirmed=true`,
   `payment_verified=true`, un `provider_tx_id` valide, un acheteur
   MultiversX et un montant en EUR égal **exactement** au catalogue
   `PACK_FIAT_CENTS` du pack. Pas d'ordre remboursé, refusé ou livré.
2. Le job a même order ID, pack, adresse acheteur, montant et transaction
   PayBox ; `mode=live` requis : **tout dry-run OIDC est rejeté**.
3. Le job porte déjà un hash mainnet et un identifiant de NFT, correspondant
   à l'issuer et à la collection **approuvés indépendamment**, et au nonce
   canonique. Aucun opérateur ne doit prendre ces attributs dans une
   requête client non authentifiée.
4. Les snapshots complets du ledger ne contiennent ni réutilisation
   d'identifiant PSP, ni réutilisation de hash de chaîne ou de NFT pour une
   autre commande.
5. Seulement après ces contrôles, le vérificateur de reçu
   `mvxReceiptVerifier.mjs` peut lire le gateway mainnet (GET uniquement)
   pour confirmer statut, événement transféré et détention réelle.

Les assertions locales et les tests de simulation du gateway sont isolés
dans [le workflow CI](https://github.com/Neltud/xArtists/actions/workflows/s1s2-reconciliation-ci.yml).
Aucune clé, aucun PEM et aucune identité client réelle ne sont nécessaires.

## Limites impératives

- Une capture de commande, un événement de transfert sur une autre vente, une
  signature de job GitHub ou une détention NFT actuelle **ne prouvent pas à eux
  seuls** la livraison due au paiement concerné. Le rapport est
  `candidate_verified=true`, **`delivery_verified=false`**.
- La vérification de doublons sur snapshots suppose qu'ils sont **complets et
  cohérents** : l'opérateur doit utiliser une lecture SQL cohérente. Le prochain
  chantier applicatif est une contrainte UNIQUE SQL sur les attributs
  attestés et une transaction atomique de livraison approuvée. Ne jamais
  utiliser un tableau fourni par le navigateur.
- Ne pas activer le mint live. Le chemin `setPackPrice` suivi de
  `buyPack` reste **non atomique** et doit être redessiné avant lancement.
- Ne pas créer d'ordre payé artificiel sur Render pour obtenir une CI verte.
  Le PSP réel doit déclencher l'IPN normal, dans un test S1 autorisé et
  documenté.
- Les retours PayBox, annulations tardives, litiges, remboursement et
  propriété du NFT après revente nécessitent une politique dédiée.
- `PAYBOX_CHECKOUT_ENABLED=0`, `MINT_LIVE_ENABLED=0`,
  `MINT_DISPATCH_ENABLED=0`, `MINT_DRY_RUN=1` et
  `LIA_LIVE_TRADING=0` restent fermés ; seul OIDC dry-run est autorisé.

## Ordre d'exécution opérateur

1. Revoir la sécurité, la disponibilité du PSP préproduction et la
   révocation effective du PAT GitHub exposé.
2. Définir **par écrit** le plafond de paiement S1, le bénéficiaire, les
   contraintes du remboursement et l'autorisation du signataire.
3. Effectuer S1 via le vrai PSP autorisé, collecter son reçu et l'IPN RSA
   corrélé au ledger sans publier de secrets ni de données acheteur.
4. Financer correctement le deployer et résoudre le prix du contrat/Rule1
   **sans mutation publique temporaire non atomique**.
5. Réaliser un mint avec accord explicite, relever l'identifiant et le hash,
   exécuter le contrôleur S2, puis un commit de livraison **séparé, relu,
   atomique**. Aucune étape n'est franchie à la place d'une autre.

État suivi : [issue #281](https://github.com/Neltud/xArtists/issues/281).
