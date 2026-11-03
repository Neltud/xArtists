# xArtists — registres S1/S2 candidats, unicité PostgreSQL

**3 novembre 2026 — préparation isolée, NO-GO commercial.**

Ce travail poursuit [la PR #306](https://github.com/Neltud/xArtists/pull/306)
qui vérifie les justificatifs de paiement S1 PayBox et de réception NFT
MultiversX S2 **sans aucune écriture** et retourne au maximum
`candidate_verified=true`, `delivery_verified=false`.

## Ce que contient la migration proposée

`services/access-api/sql/s1s2_candidate_reservations.sql` définit une
**table distincte, uniquement de réservations de preuve**. Elle n'est
**PAS appliquée automatiquement** au démarrage de l'API ni lors d'un
déploiement Render :

- `order_id` : clé primaire et référence existante vers
  `paybox_orders` **et** `mint_jobs`.
- `provider_tx_id` : **UNIQUE** (une seule commande par transaction PSP).
- `chain_tx_hash` : **UNIQUE** (une seule commande par tx mainnet).
- `nft_identifier` : **UNIQUE** (un même NFT jamais attribué à deux commandes).
- L'insert SQL exige une commande `paid`, un paiement serveur
  `server_confirmed=true`, `payment_verified=true`, le même acheteur,
  pack, montant et PSP tx ; un job de mint **`mode=live`**, hash/NFT
  cohérents et `github_dispatch_accepted=true`. Un job `dry_run`
  est refusé.
- Le registre est **immuable** : tout `UPDATE` / `DELETE` est rejeté.
- Le seul état disponible est `review_pending`, sans colonne
  `delivery_verified` ou `delivered_at`.

Même une réservation SQL réussie **ne prouve pas** qu'une carte réelle a
été débitée ou qu'un NFT a été miné et reçu. La preuve PSP RSA/IPN et la
lecture indépendante de la chaîne restent des gates séparées ; le SQL
ne vérifie pas la finalité de la blockchain. Ce registre ne peut pas
marquer une commande livrée ni conférer des droits.

## Tests réellement autorisés

Le workflow [S1/S2 PostgreSQL candidate uniqueness](https://github.com/Neltud/xArtists/actions/workflows/s1s2-candidate-postgres-ci.yml)
provisionne **PostgreSQL 16 jetable**, avec une URL strictement limitée à
`127.0.0.1/localhost` et la base **`xartists_s1s2_probe`**.

Les données PSP, transactions, NFT et acheteurs sont **entièrement
synthétiques** et ne sortent pas du runner. Le test refuse une base
externe ou un nom différent ainsi que toute exécution sans l'opt-in
`ALLOW_EPHEMERAL_S1S2_PG_TEST=1`.

La suite vérifie le succès d'une réservation fictive, le rejet du replay,
les doublons de hash/NFT, le refus d'une commande non payée, le refus
d'un mint dry-run, la concurrence de deux inserts, l'immutabilité et
le ROLLBACK SQL ; puis relit `getOrder` pour prouver que
`delivery_verified=false` et `delivery=pending`.

**Il ne faut pas lancer ce SQL contre la base Render/Neon maintenant.**
Le code n'a ni endpoint d'écriture commerciale ni mécanisme d'application
automatique : il attend une migration et une revue de sécurité séparées.

## Ce qui reste à concevoir avant tout GO

1. Un opérateur habilité doit démontrer une signature PayBox PSP **réelle**
   S1 et son `idtrans`, sans révéler de données clients.
2. Le contrôle S2 doit recevoir une véritable tx mainnet, un NFT,
   l'issuer/collection approuvés et une preuve de possession au bon acheteur.
3. Une future transaction SQL unique doit lier **la réservation de preuve**
   à l'état de livraison en tenant compte des remboursements et litiges ;
   cette transaction **n'existe pas dans cette PR**.
4. Il faut redessiner la vente/micro-prix non atomique et vérifier la
   liquidité et les permissions du signataire avant tout mint réel.
5. Le PAT GitHub précédemment exposé doit être révoqué côté GitHub ;
   le pull OIDC n'en a plus besoin.

Le Go actuel concerne la vitrine et les contrôles techniques, pas
l'encaissement ni la livraison NFT. Suivi :
[issue #281](https://github.com/Neltud/xArtists/issues/281).
