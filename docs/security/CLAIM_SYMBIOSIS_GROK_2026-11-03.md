# Symbiose Grok ↔ ChatGPT — claim B+A (2026-11-03)

## Alignement

| Source | Décision |
|--------|----------|
| Grok (session) | Path **B primary** + **A fixed-price foundation**; refuse non-atomic setPackPrice |
| ChatGPT **PR #312 (fusionnée)** | Codec strict canonique V1, docs GitBook et `assessPaidClaimCandidate` + tests |

**Pas de fork concurrent** sur le signer ou le SC. Grok complète l'interface **compatibilité du codec canonique** (octets identiques) et la politique de révocation, sans codec concurrent.

## État PR #312 (à préserver)

- `claimVoucherEligibility.mjs` : read-only, fail-closed
- CI checks verts au moment de la revue Grok
- **NO-GO** mint / checkout / keys

## Complément Grok (cette branche)

- `claimDomainCodec.mjs` + tests longueur domaine 17, `orderHash`, message packé
- Aucune clé Ed25519, aucun endpoint

## Handoff ChatGPT (phase 1 suggérée)

1. #312 fusionnée après CI verte ; conserver son encodeur V1 comme seule source de vérité
2. Garder `claimDomainCodec` comme façade de compatibilité du codec #312 ; signer uniquement après SC testnet et transaction de réservation
3. SC testnet `claimPack` + vecteurs partagés hex Node/Rust
4. Neon : confirmer DB Render ≠ sandbox sans `mint_jobs`
5. Marketing #311 : ok en parallèle (claims truth-aligned)

## Hors symbiose (Grok ne touche pas)

- PEM / claim private key
- setPackPrice unlock #310
- LIA live / bridge SOL
