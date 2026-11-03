---
description: >-
  Décision d'architecture pour le futur claim NFT post-PayBox ; spécification
  de sécurité en préparation, sans activation commerciale ni on-chain.
---

# Claim voucher post-PayBox — architecture B + A

> **Statut au 3 novembre 2026 : conception et précontrôles seulement.**
> Aucun endpoint `claimPack` n'est déployé ; aucune signature de voucher
> de production n'est émise ; le checkout public et le mint mainnet restent **NO-GO**.

## Décision et séparation des systèmes

**B est le parcours produit** : paiement bancaire PayBox EUR → IPN RSA vérifié
→ commande persistée `paid` ET `server_confirmed=true` ET
`payment_verified=true` avec `provider_tx_id` unique → voucher signé
par une clé spécialisée → acheteur xPortal signe `claimPack` → NFT délivré
au buyer → vérification S2 indépendante → commit atomique des droits.

**A est le socle du smart contract** : les prix on-chain de la voie
`buyPack` crypto directe sont fixes ou timelockés et ne sont **jamais**
modifiés pour traiter une commande fiat. Le catalogue EUR est Pulse 110 €,
Yield 75 €, Sentinel 50 €. Les prix EGLD historiques du contrat ne sont
pas l'autorité de la commande fiat : ne pas les confondre avec Rule1 ni
déployer une prétendue parité sans rapprochement financier.

**C**, pré-mint, est réservé au secours opérateur après réconciliation ;
ce n'est pas la voie de vente.

## Protocole proposé `xartists.claim-pack.v1` (à figer avec les vecteurs test)

La signature de claim est **Ed25519**, sur des octets binaires déterministes,
pas sur JSON réordonnable. Domain separator obligatoire :
`XA-CLAIM-PACK-V1\\0` (ASCII, avec octet NUL final).

| Champ | Encodage signé, dans cet ordre | Autorité |
| --- | --- | --- |
| Domaine | 16 octets ASCII + NUL final (17 octets au total) | Constante V1 |
| `chain_id` | longueur u8 puis ASCII (mainnet `1`, testnet séparé) | SC |
| `sc_address` | 32 octets adresse SC | SC |
| `signer_epoch` | u32 big-endian | gouvernance signer |
| `order_hash` | 32 octets SHA-256(`xartists/order/v1\\0` + UTF-8 `order_id`) | access-api |
| `pack_type` | u8 : 1 Pulse, 2 Yield, 3 Sentinel | catalogue validé |
| `buyer` | 32 octets adresse MultiversX | commande payée |
| `amount_cents` | u64 big-endian, EUR exact | PayBox |
| `not_before` | u64 big-endian, secondes Unix | serveur |
| `expires_at` | u64 big-endian, secondes Unix | serveur |
| `catalog_version` | u16 big-endian | catalogue figé |

**À corriger lors de l'implémentation** : le domaine est défini par les
octets littéraux (non une longueur tapée à la main) ; les vecteurs hex de
référence devront être calculés et comparés Node/Rust avant tout testnet.
Ni `provider_tx_id` ni le prix ELF/EGLD du deployer ne doivent faire
partie d'une transaction NFT publique. Ils restent dans le ledger PSP.
Une signature contient tous les champs ci-dessus ; aucune substitution
de pack, montant, contrat, réseau, signer ou buyer n'est acceptée.

Le SC doit vérifier `verify_ed25519` de la version de framework retenue,
l'epoch et la clé publique de claim active, l'heure blockchain,
`msg.sender == buyer` (V1 sans relayer), le mapping persistant
`claimed[order_hash]`, la non-révocation et la collection configurée.
Il marque `claimed` et mint/transfère **un NFT vers le buyer dans la
même transaction**. Tout échec du mint ou du transfert révoque
transactionnellement le marquage ; le succès est loggé avec l'identifiant
de commande haché, le pack, le nonce et l'acheteur.

## Clés et révocation

La clé de signature des claims **n'est pas** le PEM du deployer ou
l'owner/upgrade du SC. Une paire Ed25519 claim-only et des epochs de
rotation à durée bornée seront gérées dans un coffre serveur ; le
contrat n'accepte que les clés explicitement enregistrées par gouvernance.
Les signatures et les clés privées ne sont jamais envoyées à GitHub Actions,
GitBook ou aux logs.

Un voucher déjà signé reste potentiellement utilisable **après un
remboursement** tant que le SC ne sait pas le révoquer. V1 requiert donc :
TTL court, procédure `revokeOrderHash` et `pauseClaims` protégées,
surveillance des remboursements et des disputes, et preuve testée de
révocation avant GO. Un flag SQL `refunded` seul ne suffit pas.

## Contraintes d'émission côté access-api

1. Lire la commande par `order_id` depuis PostgreSQL serveur, jamais un
   corps JSON client ; verrouiller `paybox_orders` dans une transaction
   et vérifier statut, montant catalogue, buyer, PSP, absence de remboursement
   ou livraison, fraîcheur des contrôles anti-dispute.
2. Réserver une émission **single-use** en base avec unicité
   `order_id`, `provider_tx_id` et `order_hash`. Toute concurrence,
   expiration, double IPN ou indisponibilité PostgreSQL = refus.
3. Signer en dehors du front et n'exposer le voucher qu'au buyer authentifié
   par JWT/SIWX. Limiter le débit, journaliser l'identifiant haché, pas les secrets.
4. Après `claimPack`, valider le reçu MultiversX indépendamment :
   contrat émetteur, collection/nonce, tx réussie, montant 1,
   destinataire attendu et nonce/identifiant NFT unique dans le ledger.
5. Commit S2 atomique sous verrou SQL, après relecture de
   `paybox_orders` et remboursement ; seul ce commit peut établir
   `mint_jobs.confirmed` / `delivery_verified=true`.
   Un HTTP 204 GitHub, un dry-run OIDC ou un `candidate_verified=true`
   ne sont **jamais** des reçus de livraison.

Le module `claimVoucherEligibility.mjs` est un **filtre read-only de
candidature**, pas un signer ni une preuve transactionnelle. Les
migrations SQL et l'émetteur ne doivent pas être activés avant le
contrat testnet et les prérequis précédents.

## Tests et étapes de libération

| Étape | Preuve attendue | Statut |
| --- | --- | --- |
| V1 format / éligibilité | Prix exact, IPN, buyer, absence refund, anti-collision PSP | Précontrôles en PR |
| SC testnet | Signature fausse, réseau/SC faux, expiry, caller faux, single-use, replay, rollback mint | **À faire** |
| DB de réservation | Unique indexes, concurrence sous transaction, retry crash-safe, remboursements | **À faire** |
| S1 PayBox | IPN RSA réel et transaction PSP corrélée, remboursement vérifié | **NO-GO** |
| S2 mainnet | Reçu NFT indépendant, unique et commit atomique | **NO-GO** |
| GO écrit | Audit sécurité, financement gas, pause/revoke, revue humaine | **NO-GO** |

## Services distincts

- MoonPay : onramp crypto éventuel, **pas** substitut à une preuve PayBox bancaire.
- Etsy : uniquement œuvres physiques ou listings compatibles avec sa politique ;
  aucun droit NFT implicite dans une commande Etsy.
- Neon : stockage et réservations, pas une autorité on-chain.
- Plugin IA / OpenAI : assistance et opérations read-only uniquement ;
  aucune prise de décision de paiement, signature ou mint autonome.
- LIA trading et pont `$TRO` Solana : hors périmètre.

Voir aussi [Prix, droits et livraison](pricing-delivery.md) et
[Critères de lancement](launch-gates.md). Le verrou
[PR #310](https://github.com/Neltud/xArtists/pull/310) reste en vigueur.
