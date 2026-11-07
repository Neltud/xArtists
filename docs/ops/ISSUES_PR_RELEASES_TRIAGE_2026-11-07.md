# xArtists — Inventaire de résolution des 23 issues / PR / releases
**Audit du 7 novembre 2026 — dépôt `Neltud/xArtists` (lecture GitHub en temps réel).**

> **Statut = preuves réelles, pas état de l'interface.** Toute issue reste ouverte jusqu'à ce que l'ensemble de ses critères soit prouvé par commit fusionné, CI verte, SHA réellement déployé et recette de l'opération visée. Les onglets de site en HTTP 200 ne constituent pas une preuve d'achat, mint, livraison ou stockage IPFS.

## Synthèse
- **23 issues ouvertes** (14 P0, 9 P1) au relevé initial. La majorité sont des chaînes de preuves ou fonctionnalités non activées; il serait trompeur de les fermer pour « nettoyer GitHub ».
- **4 PR ouvertes au relevé initial**. **PR #421 fusionnée pendant le triage** (commit `e81a9b54ff4b5ae6519345495f011539c388049f`, 20/20 CI) : bibliothèque de vérification d'accès aux plugins **PAPER, non branchée et OFF par défaut**. Il reste **3 PR**.
- **182 releases historiques** dans l'application GitHub; la dernière release vérifiée est `v0.129.1` (publiée le 2 novembre 2026, 0 assets attachés). **Elles ne sont ni 182 tickets ouverts ni 182 déploiements commerciaux**. `main` et GitHub Pages peuvent évoluer indépendamment du numéro de release.
- **Dernière preuve de build Pages** avant la PR #421 : `5fb5d71afdeb5946b50ce2f53524dbde412c50e6` ; ne pas présumer qu'un nouveau merge est livré avant de voir ce SHA dans `build-info.json`.
- **Important :** ne jamais activer `VITE_MINT_LIVE_ENABLED`, `VITE_PAYBOX_ENABLED`, `VITE_LIA_LIVE_TRADING`, ni ouvrir des offres commerciales à partir de ce document.

## Tableau de traitement : 23/23
| Issue | Urgence | Domaine | Verdict | Action qui débloque | Responsable opérationnel |
|---|---|---|---|---|---|
| [#428](https://github.com/Neltud/xArtists/issues/428) | P0 | Commerce NFT mainnet EGLD | NO-GO flux réel | Rejouer list→buy→NFT reçu, enchère→retrait/acceptation, exact frais/refunds, 2 wallets, tests testnet puis pilote signé. | Équipe SC + wallets vendeur/acheteur |
| [#281](https://github.com/Neltud/xArtists/issues/281) | P0 | Paiement→mint→livraison | NO-GO S1/S2 | Prouver IPN signé, ligne SQL durable, mint idempotent, finalité, My Packs et remboursement. | Ops paiements + backend |
| [#402](https://github.com/Neltud/xArtists/issues/402) | P0 | Durabilité IPFS et Studio | NO-GO preuves | Valider base Render production, clé serveur Pinata, deuxième pin provider, SHA/gateway, archive et restauration. | Ops stockage |
| [#403](https://github.com/Neltud/xArtists/issues/403) | P0 | Genesis Pulse #005 | NO-GO NFT absent | Pin de trois médias + metadata, vérification de rôles exacts, code/SC et signature owner, mint unique et reçu. | Propriétaire wallet collection |
| [#328](https://github.com/Neltud/xArtists/issues/328) | P0 | claimPack anti-rejeu réseau | NO-GO SC | Démontrer binding chainId par primitive vérifiée ou refondre V1; tests croisés testnet/mainnet avant tout déploiement. | Ingénierie SC sécurité |
| [#341](https://github.com/Neltud/xArtists/issues/341) | P0 | DNS + email commercial | NO-GO contact | xartists.art NXDOMAIN NS/A/MX au 07/11: vérifier enregistrement et délégation chez registrar; puis zone DNS, MX, SPF, DKIM, DMARC et réception réelle. | Titulaire du domaine |
| [#353](https://github.com/Neltud/xArtists/issues/353) | P0 | Treasury / PayBox Solana | NO-GO contrôle | Attester signature message du compte PayBox et sécurité du signataire; ne financer aucun swap/bridge sans preuve. | Titulaire PayBox |
| [#416](https://github.com/Neltud/xArtists/issues/416) | P0 | Licence XA World Rights | NO-GO commercial | Choisir licence propriétaire payante ou client MIT/service payant; vérifier titularité; confirmer exemption owner via authentification signée, ne pas distribuer ZIP non contrôlé. | Titulaire légal + product owner |
| [#370](https://github.com/Neltud/xArtists/issues/370) | P0 | Rails EUR/EGLD / livraison LIA | NO-GO exécution | Deux adapters séparés, reçus PSP/chain vérifiés, idempotence et réconciliation livraison S1/S2. | Backend + PSP |
| [#369](https://github.com/Neltud/xArtists/issues/369) | P0 | Mandats durables et signatures | NO-GO exécution | Ledger transactionnel, signature domainée, anti-rejeu et crash/restart multi-worker avant toute délégation. | Backend auth |
| [#368](https://github.com/Neltud/xArtists/issues/368) | P0 | Classifier Intent FR/EN | NO-GO modèle réel | Adapter provider structuré, dataset adversarial, métriques mesurées et refus fail-closed (aucun spend IA). | LIA ML/QA |
| [#367](https://github.com/Neltud/xArtists/issues/367) | P0 | BUY_PACK structuré PAPER | Partiel (PR #378 fusionnée) | Réception mobile/browser, règles de devis, confirmations et quotas; ne pas promouvoir les brouillons en achats réels. | Frontend LIA + QA |
| [#347](https://github.com/Neltud/xArtists/issues/347) | P0 | Télémétrie LIA | Partiel (PR #360 fusionnée) | Producer authentifié, SLA/horodatages, caches et observabilité; aucune mention LIVE à partir d'un vieux snapshot. | Ops observabilité |
| [#393](https://github.com/Neltud/xArtists/issues/393) | P0 | UX 360 multi-chain/fiat/DAO | Partiel, navigateurs à valider | Recette tous modules et flux novice; DAO locale ≠ vote on-chain, fiat non autorisé tant que rails fermés. | Produit UX + QA |
| [#348](https://github.com/Neltud/xArtists/issues/348) | P1 | UX public 360 / navigation | Partiel (améliorations publiées) | Recette visuelle 36 modules/alias sur 360/390/430/1440px, clavier 200% et erreurs liens. | UX + QA |
| [#363](https://github.com/Neltud/xArtists/issues/363) | P1 | UX mobile RWA / TRO | Partiel (PR #358 fusionnée) | Test tactile réel, accès contrastes/langues, scroll/CTA, vidéo ou captures de preuve. | UX mobile |
| [#391](https://github.com/Neltud/xArtists/issues/391) | P1 | OpenSea Polygon/Solana | Découverte visible / exécution OFF | Configurer clé API côté serveur, GET réels, vérification images/ordres; listing et mint extérieurs restent distincts. | Ops OpenSea |
| [#375](https://github.com/Neltud/xArtists/issues/375) | P1 | Plugin registry + revenue router | Partiel: PR #421 fusionnée (entitlements PAPER) | Signer manifests, scopes minimaux, ledger revenu paper, révocation/quotas, brancher contrôle sans paiement live. | Plateforme plugins |
| [#418](https://github.com/Neltud/xArtists/issues/418) | P1 | Mémoire on-chain vérifiable | Paper/privé | Journal append-only offchain, engagements ancrés sur chain via validation signée, séparation données privées. | LIA mémoire |
| [#372](https://github.com/Neltud/xArtists/issues/372) | P1 | AP2/ACP/MX-8004 | Préparation spécifications | Pin de révisions officielles, schémas signatures, vecteurs de conformité avant toute revendication de compatibilité. | Protocoles |
| [#371](https://github.com/Neltud/xArtists/issues/371) | P1 | Relayed v3 MultiversX | Préparation | Adapter SDK vérifié, signer/relayer contrôlés, vecteurs localnet et plan d'échec/reprise. | SC ops |
| [#324](https://github.com/Neltud/xArtists/issues/324) | P1 | Art-ID / provenance | Partiel offline | Studio SIWX, preuve droits, tests de reconnaissance et contestation, sans certificat d'authenticité automatique. | Art-ID + Studio |
| [#298](https://github.com/Neltud/xArtists/issues/298) | P1 | TRO bridge Solana | Paper local uniquement | Supply attestée + 1:1 escrow preuve, mint authority/pauses, émission et burn atomiques, audit tiers. | Treasury + chain ops |

## Trois PR restantes — décisions contrôlées
| PR | CI / statut initial | Décision de triage |
|---|---|---|
| [#407](https://github.com/Neltud/xArtists/pull/407) Pulse #005 | 4/4 CI, **DRAFT** | **Bloquée** : code qui modifierait le minter mainnet; pas de CID, pas de validation de migration et aucune signature; ne pas fusionner/déployer. Dépend #402/#403. |
| [#415](https://github.com/Neltud/xArtists/pull/415) XA World Rights | 26/26 CI, ouverte | **Bloquée légalement** : source MIT + ZIP téléchargeable public, contraire au produit logiciel payant propriétaire demandé. Sélectionner un modèle commercial/licence et vérifier propriété avant de diffuser. Dépend #416. |
| [#409](https://github.com/Neltud/xArtists/pull/409) release `0.130.0` | 0 check sur le HEAD relevé, ouverte (Release Please) | **Ne pas fusionner par automatisme** : revue du CHANGELOG, version, sécurité et résultat Pages. Une release n'est pas un GO commercial. |
| [#421](https://github.com/Neltud/xArtists/pull/421) entitlement signed | 20/20 CI, fusionnée pendant ce triage | **Fondation isolée** uniquement : preuve HMAC et SQL non exécuté. Toujours aucune exemption admin signée, paiement ni download payant. #416 reste ouverte. |

## Ordre de dépendance — ne pas paralléliser les opérations financières
1. **Sécurité des opérations, identité et hébergement** : #341 (domaine non résolu), #402 (IPFS), #353 (PayBox), #416 (licence), #328 (domaines de signatures).
2. **Livraison NFT réelle** : #281 puis #370 et #403 ; pour les packs existants, des rôles `ESDTRoleSetNewURI`/`ESDTRoleNFTUpdate` attribués par le wallet owner + médias spécifiques aux packs.
3. **Vente et enchères EGLD** : #428, avec 2 vrais wallets distincts, dépôt/achat/royalties/bids/refund + reçus vérifiés, avant le bouton public.
4. **Distributeur NFT** (rattaché à #428) : code Rust SC escrow ou lazy_mint, hasard non manipulable, test de retrait/refund, audit et déploiement signé; interface actuelle = PAPER.
5. **Produit et communication** : #393/#348/#363, #391, #347/#367/#368, ensuite #375/#418/#372/#371/#324/#298.

## Politique release recommandée pour réduire le bruit
- **Conserver les 182 tags/releases historiques** : ne pas réécrire l'historique, supprimer les tags ni effacer les références auditables à des NFT ou contrats.
- La configuration `release-please.yml` génère/actualise une PR sur les pushes `main` ; **elle ne constitue pas un mécanisme d'achat NFT ou une preuve de prod**.
- Faire **une seule release consolidée** lors d'une recette complète (SHA sur Pages, changelog exact, aucun nouveau P0), puis publier seulement des patchs urgents documentés. Ne pas fusionner #409 uniquement pour faire baisser ou monter le compteur.
- Ajouter aux futures notes de version **état des fonctions financières (OFF / démonstration / pilote / live)**, SHA servi, liens de preuves et procédure rollback; distinguer `release_tag` de `deployed_sha`.
- Pour réduire le bruit des PR Release Please, regrouper les merges validés puis approuver la release en un jalon ; aucune suppression historique requise.

## Points qui nécessitent une action externe (non réalisable par commit)
- **Domain registrar et courrier** : DNS-over-HTTPS 07/11 `xartists.art` NS/A/MX = **NXDOMAIN**. Vérifier possession/renouvellement puis délégation nameservers du domaine (hébergement OVHcloud ≠ propriété du domaine). Vérifier réception réelle des mails après configuration MX. Voir [issue #341](https://github.com/Neltud/xArtists/issues/341).
- **IPFS** : Pinata JWT uniquement dans secret serveur, deuxième fournisseur indépendant, sauvegarde et restauration testée; pas de CID deviné. Voir #402.
- **Contrôle wallet** : les adresses LIA ops, propriétaire de collection et détenteur individuel sont différentes; seuls des signatures et rôles observés sur chaîne établissent une autorisation. Voir #353/#403/#428.
- **Licence et droit d'auteur** : vérifier titulaire/licence des fichiers et dépendances, puis choisir modèle payant et exemption propriétaire par challenge signé. Voir #416.

### Preuves et audit
- Production : https://neltud.github.io/xArtists/build-info.json ; ne pas confondre commit de site et release.
- Explorer marketplace : https://explorer.multiversx.com/accounts/erd1qqqqqqqqqqqqqpgqx0araa285cdepdsfe8s23mer30r3dh9lvhxqq8txmm ; codeHash/payable vérifiés en lecture seule au 07/11, flux list→buy non prouvé.
- Runbook mainnet : `docs/ops/MAINNET_PUBLIC_NFT_EGLD_GO_NO_GO_2026-11-07.md`.
- Contrôles du présent document : issues + PR et SHA par GitHub; vérification DNS Google DoH NS/A/MX, `Status: 3`.

*Aucune issue fermée automatiquement; aucune transaction ni dépense; aucun secret collecté.*
