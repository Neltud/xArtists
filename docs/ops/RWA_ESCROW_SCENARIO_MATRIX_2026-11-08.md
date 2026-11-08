# RWA escrow — matrice scénarios (2026-11-08)

Source des 7 points : `docs/RWA_ESCROW_RELEASE_GATES_DRAFT_2026-11-08.md`  
Branche : `fix/rwa-escrow-release-gates-20261108`  
**NO-GO mainnet.** Aucun déploiement, paiement ou mint.

## Couverture

| # | Exigence | Couverture actuelle | Gap restant |
|---|----------|---------------------|-------------|
| 1 | Receipt / verification / ownership seuls ne libèrent pas | Tests statiques P1 | VM : appels réels avec balances |
| 2 | Paires insuffisantes ; 4 portes + attestor libèrent une fois | Tests statiques P2 (AND de 4 flags) | VM : chemins combinatoires + replay |
| 3 | Non-attestor / payer ne libèrent pas | Tests statiques P3 | VM : callers adverses |
| 4 | Dispute / refund / cancel bloquent release ; replay échoue | Tests statiques P4 (status terminal avant transfer) | VM : séquence dispute puis release |
| 5 | Hash vides / trop longs ; isolation trade_id | Tests statiques P5 | VM : fuzz longueur |
| 6 | Migration stockage, ABI, réentrance, insolvabilité | **Non** — layout cassé documenté | `sc-meta` + mandos + plan migration frais |
| 7 | E2E fiat PSP + titre + vault + NFT | **Non** — hors contrat EGLD | Mock ops + PSP sous licence |

Suite statique :

```bash
node --test contracts/rwa-escrow-bridge/tests/release_gates.static.test.mjs
```

Cette suite **ne compile pas** le contrat et **n'exécute pas** de VM MultiversX.

## Risque résiduel code (point 6 partiel)

- `refund` (owner ou après deadline) et `cancelByOwner` **contournent** les 4 portes.
- `resolveDispute` est **owner-only**, pas multisig.
- L'attestor est une frontière de confiance : hash ≠ vérité physique.

Politique admin : `docs/ops/RWA_ADMIN_MULTISIG_POLICY_2026-11-08.md`.

## Prochaine étape VM (quand l'outil est disponible)

1. `sc-meta all build` sur `contracts/rwa-escrow-bridge`
2. Scénarios mandos pour chaque ligne 1–5 avec balances EGLD
3. Interdire tout upgrade in-place d'un codeHash existant (nouveaux champs `Escrow`)
