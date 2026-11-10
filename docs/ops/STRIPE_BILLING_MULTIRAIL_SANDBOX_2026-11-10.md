# xArtists — paiements multirails et abonnements mainstream (préparation uniquement)

**Décisions exprimées le 10 novembre 2026 ; aucun paiement, produit PSP, abonnement, jeton NFT ou déploiement créé par ce lot.** Tous les rails sont **NO-GO** pour l'exécution, même si les cibles prix ont été validées.

## Grille propriétaire / flux distincts

| Produit | Cible choisie | Rail cible | Accès | Statut |
|---|---:|---|---|---|
| Pulse Genesis | **33 EGLD** | MultiversX wallet-signé | NFT **seulement après reçu on-chain** | NO-GO ; dernière lecture VM du 08/11 : **1 EGLD**, écart |
| Yield Genesis | **22 EGLD** | MultiversX wallet-signé | NFT **seulement après reçu on-chain** | NO-GO ; dernière lecture VM du 08/11 : **5 EGLD**, écart |
| Sentinel Genesis | **11 EGLD** | MultiversX wallet-signé | NFT **seulement après reçu on-chain** | NO-GO ; dernière lecture VM du 08/11 : **2,5 EGLD**, écart |
| Mainstream niveau 1 | **3,79 €/mois** | **Stripe Nelsonprods**, sandbox | Services uniquement, **sans wallet et sans NFT** | NO-GO ; `fiat_379` |
| Mainstream niveau 2 | **5,79 €/mois** | **Stripe Nelsonprods**, sandbox | Services uniquement, **sans wallet et sans NFT** | NO-GO ; `fiat_579` |
| Mainstream niveau 3 | **9,79 €/mois** | **Stripe Nelsonprods**, sandbox | Services uniquement, **sans wallet et sans NFT** | NO-GO ; `fiat_979` |

Les noms des trois niveaux, les prestations détaillées, la TVA (prix TTC ou HT non précisé), CGV, politique d'annulation et éventuelle période d'essai restent à arrêter **avant production**. La sélection des montants ne vaut **pas** autorisation de créer une session Stripe ou de prélever des fonds. Aucune conversion EUR/EGLD n'est autorisée pour les NFT.

Le module pur `services/access-api/src/commercialRails.mjs` conserve ces cibles et renvoie toujours `checkout_enabled=false`, `can_pay=false`, `can_mint=false`, `can_grant_entitlement=false`. Il ne lit pas la chaîne ni Stripe : ce n'est **pas** un devis. Un achat Genesis requiert une validation indépendante du prix du smart contract **au moment de la signature**. Aucune modification contractuelle n'a été sollicitée ou effectuée.

## Interopérabilité à qualifier

- **Stripe Nelsonprods** est **choisi** pour les abonnements mainstream EUR. Ancien catalogue de packs one-time Stripe : Pulse 110 €, Yield 75 €, Sentinel 50 €, **historique et ne doit pas ouvrir un paiement NFT**. Aucun produit ou Price récurrent créé dans ce sprint.
- **MoonPay** : module existant d'onramp **achat d'EGLD** pour un wallet vérifié. Recevoir EGLD dans un wallet **ne prouve ni l'achat d'un pack ni un NFT livré**. Ne pas relier directement au ledger d'abonnements.
- **PayBox (Verifone)** : existant côté code pour carte / IPN, **pas de support d'abonnement récurrent certifié** dans cette revue. Peut rester une alternative future pour des paiements fiat distincts, uniquement après validation de son contrat, de ses signatures et de l'usage envisagé.
- **Finance Computer** : son [site officiel](https://www.financecomputer.com/) présente une offre en marque blanche (comptes, cartes, paiements, transferts, conversion) et cite xMoney / MultiversX comme infrastructure. Ce sont des **affirmations publiques du fournisseur**, pas un accord xArtists. Le courrier de Martin **n'a pas été retrouvé** dans la connexion Gmail consultée ; l'ancien document GitHub interdit un badge avant partenariat officiel (`docs/CONSOLIDATION_PROD_2026-10-12.md`). Aucun droit d'API sandbox, contrat, conditions commerciales, champ réglementaire applicable à xArtists ou partenariat n'a été confirmé. **À qualifier**, sans CTA ni badge.
- **Whop** : ancien descriptif TCA avec cibles 29 €/mois / 290 €/an **obsolètes pour l'offre mainstream actuelle**. Le PSP sélectionné est désormais Stripe ; aucun produit Whop ne doit être supposé actif.

## Code fourni — revue de factures hors ligne seulement

`services/access-api/src/stripeBillingCandidate.mjs` réutilise `verifyStripeEvent` existant : **corps brut signé**, timestamp, `livemode=false`, sans compte Stripe Connect tiers. Il compare un *binding serveur supposé fiable* de client, souscription, Price, montant EUR et niveau à la facture d'une période. Tests : paiement, échec, annulation, mismatch client/prix/devise, signature forgée, replay, factures composées.

Même une facture `invoice.paid` signée devient un **candidat à réconcilier**, jamais un accès immédiat. Ce module ne fait aucun appel réseau ni mutation DB, ne propose aucune route HTTP de paiement, ne crée aucun Checkout Session, aucun abonnement et ne touche jamais aux contrats NFT.

**Reste à construire et à auditer** : vérification OIDC serveur/email, contrat service/Price signé dans la DB, réception webhook sur environnement test réel, idempotence, association du vrai compte interne, facture payée et paiement réconcilié, statut actif côté Stripe, période de service payée, traitement des annulations, échecs, litiges, remboursements partiels, essais et taxe. Conditions de prix exact : remises, prorata, taxes ou factures multiligne restent NO-GO tant que leur méthode de réconciliation n'est pas approuvée.

## Critères de passage à une sandbox intégrée

1. Revue indépendante du code et de CI au HEAD de la PR ; tests Node synthétiques **sans secret**.
2. Confirmation de la séparation **test/live** du compte Nelsonprods et validation d'une architecture d'environnement sandbox isolée.
3. Revoir les trois niveaux et le texte grand public sans promesses d'investissement ou de NFT, puis tarifs TTC/HT, prestations, droits et conformité.
4. Tester un compte fictif **sans wallet** avec identité confirmée et session backend ; l'e-mail Neon Auth sandbox n'est pas obligatoirement vérifié actuellement.
5. Vérifier la signature réelle des événements Stripe test et le ledger PostgreSQL approprié **sans modifier la production**.
6. Faire rejeter les événements répétés/forgés/hors ordre, l'expiration, la résiliation et les remboursements avant d'envisager une ouverture.
7. Publier les données de preuve et exiger une autorisation **séparée** par produit/rail. **Aucun GO commercial donné.**

Références : [#465](https://github.com/Neltud/xArtists/issues/465) · [#281](https://github.com/Neltud/xArtists/issues/281) · [modèle commercial](../COMMERCIAL_MODEL.md) (actualisé en draft #478) · [Stripe Billing](https://docs.stripe.com/billing/subscriptions/webhooks).
