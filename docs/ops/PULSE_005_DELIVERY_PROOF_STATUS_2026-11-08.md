# Genesis Pulse #005 — preuve de livraison (statut)

**Date de lecture API :** 2026-11-08  
**Collection :** `XAIPLS-2cf72b`  
**NO-GO vente / mint public.**

## On-chain (vérifié)

| Nonce | Identifier | URI média | Observation |
|-------|------------|-----------|-------------|
| 1 | `XAIPLS-2cf72b-01` | vide `['']` | Pack existant |
| 2 | `XAIPLS-2cf72b-02` | vide | Pack existant |
| 3 | `XAIPLS-2cf72b-03` | vide | Pack existant |
| 4 | `XAIPLS-2cf72b-04` | vide | Pack existant |
| **5** | **absent** | — | **#005 n'est pas minté** |

Rôles collection : `ESDTRoleNFTCreate` présent sur un SC ; **pas** de `ESDTRoleSetNewURI` / `ESDTRoleNFTUpdate` pour le détenteur ops (voir `docs/ops/PULSE_ROLE_VERDICT_2026-11-06.md`). Réparation d'URI des nonces 1–4 **bloquée** jusqu'aux attributions de rôles signées par le owner.

## Médias

- Master HD Genesis Pulse #005 : hors assets publics (Drive privé). **Pas** collé automatiquement sur les packs `product:access`.
- PNG galerie Drive (PR art) = décors de vitrine, **pas** preuve de livraison du pack #005.

## Critères de preuve de livraison (hors vente)

Une livraison #005 ne sera considérée prouvée que si **tous** les points suivants sont vrais :

1. NFT `XAIPLS-2cf72b-05` existe on-chain (ou autre nonce explicitement désigné #005).
2. URI média non vide ; CID IPFS résolu identique sur ≥ 2 gateways.
3. SHA-256 du fichier média = empreinte déclarée dans les attributs / doc ops.
4. Détenteur = wallet cible documenté (pas un mint vers l'inconnu).
5. Aucune annonce EGLD tant que (2) et (3) ne sont pas verts.

**État actuel :** échec au point 1. Aucune réparation média possible sans rôles URI ; aucun mint autorisé dans ce sprint.
