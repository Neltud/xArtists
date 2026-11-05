# xArtists · Sprint board des 17 issues ouvertes

**Relevé GitHub : 5 novembre 2026.** `GET /repos/Neltud/xArtists/issues?state=open`, filtrage des pull requests : **17 issues**. Ce fichier distingue correctifs déjà livrés et critères non validés ; ne jamais fermer une issue sur la seule base d'une PR, d'un mock ou d'un statut d'API HTTP 200.

## P0 — bloquants de vérité et de sécurité

| Issue | Sujet | État vérifié au relevé | Prochain critère bloquant |
|---|---|---|---|
| [#281](https://github.com/Neltud/xArtists/issues/281) | Mint réel, PSP et livraison | PostgreSQL `paybox_orders` et `mint_jobs` 200 ; PR #381/#387/#388/#365 fusionnées ; Stripe TEST isolée via #383 | Paiement signé réel autorisé→ledger→onchain mint→propriété/« My Packs »→refund, DSN protégé et restore drill |
| [#328](https://github.com/Neltud/xArtists/issues/328) | claimPack ChainID | Ouverte, testnet hardcode T signalé | Chaîne runtime attestée, domaine signé, rejeu inter-chaînes impossible, test scenario et audit |
| [#341](https://github.com/Neltud/xArtists/issues/341) | DNS/MX `xartists.art` | NXDOMAIN relevé 3 novembre, non revalidé dans ce sprint | Propriété DNS + A/NS/MX + réception `hello@` réelle confirmée ; pas de campagne avant |
| [#353](https://github.com/Neltud/xArtists/issues/353) | Trésorerie Solana | Réception de SOL précédemment observée mais contrôle de clé non prouvé | Test de signature non sensible, journal de contrôle des wallets et permissions ; ne pas transférer |
| [#347](https://github.com/Neltud/xArtists/issues/347) | Télémétrie LIA | Snapshot hub historiquement obsolète ; flag live trading OFF | Source actuelle, horodatage/TTL honnête, `paper` explicite et monitoring |
| [#367](https://github.com/Neltud/xArtists/issues/367) | BUY_PACK structuré | P0 restreint à paper uniquement | Tests sur quote, approbations et refus, aucun paiement effectif |
| [#368](https://github.com/Neltud/xArtists/issues/368) | Classifier LIA structuré | Non réputé live | Vecteurs FR/EN adversariaux ; aucune auto-exécution de modèle |
| [#369](https://github.com/Neltud/xArtists/issues/369) | Ledger de mandates signés | Non prouvé | Stockage durable, anti-rejeu et contrôle dépenses signé multi-acteur |
| [#370](https://github.com/Neltud/xArtists/issues/370) | Routes de paiement EUR/EGLD | Rails partiellement simulés ; checkout public OFF | Réconciliation PSP / chaîne, remboursements, livraison et garde des fonds |
| [#373](https://github.com/Neltud/xArtists/issues/373) | Genesis Art Engine | PR #374 : adaptateur provider et crédits **PAPER** fusionnés, sans véritable fournisseur ; NFT Factory PR #390 brouillon | Provider réel attesté, quote de génération en EUR/credits durables, conformité média, droits, image IPFS et mint séparé |

## P1 — qualité, plateforme et intégrations

| Issue | Sujet | État | Preuve d'acceptation restante |
|---|---|---|---|
| [#375](https://github.com/Neltud/xArtists/issues/375) | Plugin Registry signé | Plugin privé xArtists v0.2.0 créé, **skills seulement**, pas de registry signé/MCP déployé | Signature, provenance, scopes least-privilege, révocation et tests de mandat |
| [#372](https://github.com/Neltud/xArtists/issues/372) | AP2/ACP/MX-8004 | Compatibilité non attestée | Révisions officielles pinées et vecteurs de conformance |
| [#371](https://github.com/Neltud/xArtists/issues/371) | Relayed v3 | Aucun relay live autorisé | Vérification SDK/version, auth relayer, tests fail-closed testnet |
| [#363](https://github.com/Neltud/xArtists/issues/363) | UX mobile TRO/RWA | PR #358 fusionnée, routes Pages réparées ; contrôles 390px réalisés localement | Appareils réels, touch, contraste WCAG, compréhension et accessibilité finale |
| [#348](https://github.com/Neltud/xArtists/issues/348) | UX 360 public | PR #358/#384 et navigation V3 fusionnées ; PR #390 étend Studio | Revue toutes pages, langues, accessibilité, mobile et opérateur vs public |
| [#324](https://github.com/Neltud/xArtists/issues/324) | Art-ID Forensics | Fondation offline existante | Auth propriétaire, provenance images, gestion des litiges/rights, consentement, réévaluation |
| [#298](https://github.com/Neltud/xArtists/issues/298) | TRO Solana 1:1 | Bridge reste OFF | Supply canonical, contrôle de l'émetteur, réserves 1:1, tests bridge/recover et attestations indépendantes |

## Ordre de livraison par dépendance

1. **Vitrine/browse-only** : préserver Pages et Render avec SHA source identiques, routes directes et watchdog 4h ; aucun faux « LIVE ».
2. **NFT Factory non payante** : PR #390 avec modèles, calques, images clairement absentes, métadonnées personnalisées, prix EGLD par collection, inventaire, simulation gratuite ; tests Node/TypeScript/routes/UX.
3. **Génération artistique de test** : #373/#374 plus fournisseur réel OpenAI ou GPU AMD/NVIDIA identifié et contrat coût/droits ; test de génération, stockage et provenance attestés ; comptes agent sous mandat signé.
4. **Smart contract NFT distributeur de test** : un SC par artiste/collection, mode escrow ou lazy mint, droits de collection/role/nonce, randomisation auditable avec refund et audit légal ; wallet signé uniquement ; pas de dépôt direct à adresse inconnue.
5. **Paiement de génération IA** : devis serveur versionné, PSP TEST signé, registre d'utilisation idempotent et rapprochement des remboursements ; ne pas confondre coût de création et prix de vente NFT.
6. **S1/S2 pack et distribution** : audits chaîne+PSP et première vraie livraison approuvée ; ensuite seulement arbitrage GO/NO-GO pour les ventes. DNS, trésorerie, claimPack chain id et conformité restent indépendants.
7. **P1 qualité et croissance** : terminer Art-ID, UX accessibilité, AP2/ACP/relayer, plugin registry, bridge TRO selon preuves, sans déployer de fonctionnalités financières sur cette base.

## Suivi et statut

- PR #390 **draft** : la création de métadonnées et distributeurs PAPER n'est pas « live » avant CI et déploiement vérifiés.
- PR #374 **fusionnée** le 5 novembre : server-only, pas de fournisseur ni billing activé.
- Plugin personnel xArtists NFT Creator & Distributors **v0.2.0** : workflows, non serveur MCP autonome.
- 17 issues restent ouvertes tant que les critères propres à chacune ne sont pas prouvés. Raccourcir la liste en fermant des P0 sans preuves dégraderait la qualité de mise en production.
