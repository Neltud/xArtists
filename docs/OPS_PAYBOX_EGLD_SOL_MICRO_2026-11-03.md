# xArtists — PayBox et microtests xEGLD/SOL sans dépenses (3 novembre 2026)

## Périmètre effectivement autorisé

Les essais automatisés ne débloquent **aucun** système commercial. Le workflow
`paybox-egld-sol-micro-preflight.yml` sépare clairement :

| Volet | Exécution sûre | Montant fictif | Ce qui n'est PAS exécuté |
|---|---|---:|---|
| **PayBox System / Verifone** | HMAC outbound, RSA-2048 IPN de test en mémoire | packs fictifs | aucun checkout réel, carte, remboursement PSP ou IPN prestataire |
| **MultiversX Devnet** | requête GET de réseau + `POST /transaction/cost` en sandbox, non persistante | 0,001 **xEGLD de test** | aucune signature, envoi, mint ni modification de prix |
| **Solana Devnet** | `getLatestBlockhash` + `getFeeForMessage` JSON-RPC, en lecture seule | 0,000001 **SOL de test** (1 000 lamports) | aucun `requestAirdrop`, `sendTransaction`, token SPL ni bridge |

Les requêtes s'exécutent **sur Devnet seulement**. Le code génère des
**adresses publiques éphémères sans aucune clé privée** et ne peut donc
pas signer ou envoyer les deux microtransferts. Les estimations de frais
n'illustrent pas un envoi réussi. Une erreur RPC, de réseau ou de disponibilité
de faucet est signalée comme **BLOCKED**, jamais comme transaction payée.

## Vérifications des gardes-fous

Le job demande ensuite l'état JSON `/health` du service Render et exige
`paybox_checkout_enabled=false`, `mint_dispatch_enabled=false`,
`mint_dry_run=true`, `mint_live_enabled=false`,
`lia_live_trading=0` et `tro_solana_bridge=off`.

La suite locale `paybox_v2.test.mjs` teste cryptographie, signatures et
refus des faux callbacks. Une seconde suite existante prouve l'idempotence
`HTTP signé → PostgreSQL jetable` :
[PR #291](https://github.com/Neltud/xArtists/pull/291).
Ces tests ne sont **pas** des paiements réellement effectués.

## Pour passer à une véritable opération S1 / micro mainnet

Il manque des **préconditions indépendantes** :
- PayBox : un contrat prestataire actif, un accès préproduction habilité et
  un plan de paiement/remboursement opérateur ; émission de paiement **avec
  approbation** et suivi de l'identifiant transaction.
- EGLD mainnet : portefeuille signataire explicitement autorisé, adresse
  bénéficiaire vérifiée, solde, frais et transaction simulée/validée.
  La procédure de micro-prix `setPackPrice`/achat non atomique est
  **interdite en production**.
- SOL mainnet : portefeuille source authentifié, adresse de destination
  vérifiée, montant plafonné et estimation frais/risque.
  **Aucun bridge TRO↔Solana déployé n'est attesté**.
- Les preuves S1/S2 exigent des reçus indépendants ; l'idempotence de la
  simulation CI ne les remplace pas.

Ne pas publier de PAT, PEM, phrase de récupération ou clé privée dans
GitHub, Render, le chat ou les logs. L'ancien PAT exposé doit être
révoqué sur GitHub.

## Sources réseau officielles

- [MultiversX — estimate transaction cost](https://docs.multiversx.com/sdk-and-tools/rest-api/transactions/)
- [MultiversX — estimation et simulation sans diffusion](https://docs.multiversx.com/sdk-and-tools/sdk-js/cookbook/network-providers/simulate-estimate-transaction/)
- [Solana — clusters / Devnet](https://solana.com/docs/references/clusters)
- [Solana — getFeeForMessage](https://solana.com/docs/rpc/http)
- [PayBox runbook de callback signé](./OPS_PAYBOX_SIGNED_IPN_RECONCILIATION_2026-11-03.md)

**Commercial / mint / bridge mainnet : NO-GO**. Suivi :
[GitHub #281](https://github.com/Neltud/xArtists/issues/281).
