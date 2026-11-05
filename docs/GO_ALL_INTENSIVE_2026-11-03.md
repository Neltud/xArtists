# GO ALL intensive — decision record 2026-11-03

## Ask

> Go live mint · Go all · deep work

## Decision

| Request | Verdict |
|---------|---------|
| Re-enable `live_mint` / load PEM / setPackPrice window | **REJECTED** (#310) |
| Public dApp + signals + API + OIDC dry-run as “live” | **ACCEPTED** |
| Design atomic successor | **IN PROGRESS** → `ATOMIC_MINT_ROADMAP.md` |
| Checkout / LIA trade / bridge | **NO** without separate GO |

## Rationale

Shipping a known non-atomic sale window under “GO LIVE” would convert a controlled product into an open low-price race against our own SC. Funding the deployer does not fix that design flaw.

**Aucun PEM, seed ou secret de signature ne doit être présent dans le dépôt GitHub ni dans les logs de CI.** Tout futur parcours exige une architecture de signature sécurisée, des permissions minimales et une revue indépendante ; ce document n'autorise aucun usage de clé.

## Immediate backlog (safe intensity)

1. Keep #310 locks
2. Atomic SC / claim design review
3. Refund + marketing claims docs
4. Préparer **en laboratoire seulement** une architecture de prix fixes ou de claim sans fenêtre `setPackPrice` par commande ; aucune transaction mainnet n'est autorisée par ce document
5. Testnet prototype of path A or B before mainnet workflow re-enable PR

## Explicit non-actions this record

- No workflow `if: true` on live mint job
- No PEM read/export
- No mainnet buyPack from automation
