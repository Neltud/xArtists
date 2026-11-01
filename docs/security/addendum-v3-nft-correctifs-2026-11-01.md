# Addendum V3 — Cache NFT et correctifs P1

**1er novembre 2026 — Revue de code, sans validation visuelle live.**

## Rectification : aperçu et possession NFT

La revue complémentaire de [`nftPacks.ts`](https://github.com/Neltud/xArtists/blob/main/apps/frontend/src/lib/nftPacks.ts) confirme que `markPackOwned(id)` retourne immédiatement hors `import.meta.env.DEV`. Le cache `xartists_nft_pack_owned` est un miroir de démonstration, et `loadOwnedPacks()` retourne `[]` en production. Le code documente que les droits proviennent des NFT on-chain ou de la whitelist administrative, jamais du localStorage.

**Conséquence :** l'appel depuis `PackCheckout.onPreview()` est un défaut de séparation sémantique et un risque de confusion en DEV, **pas une preuve d'attribution de NFT en production**. Vérifier les consommateurs du cache avant de conclure à un contournement des contrôles d'accès.

## Correctif proposé A — rail de paiement verrouillé

Dans `CheckoutModal.tsx` :

* Désactiver les boutons crypto/fiat et la sélection Stripe/PayBox si `busy || packTxPending` ; bloquer également leur `onClick` pendant ce verrouillage.
* Figer le rail et le prestataire choisis à l'acceptation des conditions ; ne pas les relire depuis l'UI après le lancement asynchrone.
* Éviter la fermeture du modal ou son réarmement pendant une opération critique ; prévoir une gestion explicite des erreurs et annulations.
* Ne pas confondre démarrage d'une transaction avec confirmation serveur/on-chain.

## Correctif proposé B — aperçu indépendant

Dans `PackCheckout.tsx` :

* Retirer `markPackOwned(id)` du parcours d'aperçu ; utiliser un indicateur local dédié `previewUnlocked` uniquement pour l'UX.
* Ne pas router vers « Mes Packs » comme si l'aperçu était une acquisition ; afficher « Aperçu gratuit — aucun NFT ni droit d'accès attribué ».
* Vérifier que les garde-fous `hasAgentAccess` et autres contrôles d'entitlement ignorent intégralement l'aperçu.

## Correctif proposé C — texte et tests

* Harmoniser les traductions FR/EN/DE/ES/ZH : PayBox exige `erd1` et JWT ; les mentions de paiement invité ne doivent apparaître que si un prestataire prend réellement en charge ce flux.
* Tester double clic, changement de rail pendant pending, refus SIWX, annulation et retour de paiement, cache preview, rechargement et absence de droits.
* Capturer le parcours mobile et desktop sur un déploiement lié à un SHA ; aucune capture n'a été réalisée lors de cet audit.

## Blocage de contribution GitHub

La lecture GitHub est autorisée, mais `create_branch` sur `Neltud/xArtists` retourne HTTP **403 Resource not accessible by integration**. Vérifier l'autorisation **Contents: read/write** de l'application connectée pour ce dépôt, puis retenter sur une branche dédiée. Aucune PR de code n'est déclarée créée.

**Gate Sprint 2 : NO-GO** tant que le test PayBox réel, IPN, droits et remboursement n'ont pas été vérifiés par l'opérateur autorisé. `lia_live_trading: false` demeure inchangé.
