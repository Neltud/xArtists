# Backlog triage — 17 novembre 2026

**Doctrine:** `XORUS_LIVE_TRADING=false` · assisted POST off · mint/checkout/escrow NO-GO until proofs.
**Objectif de ce document:** classer PR et issues ouvertes. Ce n’est **pas** une autorisation de fusion ou d’activation financière.

---

## PR ouvertes — décision

| PR | Titre | Décision | Pourquoi |
|----|--------|----------|----------|
| **#621** draft | assisted proxy smoke POST OFF | **Garder draft** | Smoke offline vert ; host public non prouvé |
| **#620** draft | Pages paper-only release gates | **Garder draft** | Suite frontend OK ; CI globale non verte |
| **#619** draft | harden OneDex proxy + anti-truncation | **Garder draft** | Tests ciblés OK ≠ GO prod |
| **#618** draft | fail-closed before human signing | **Garder draft** / éventuellement supersédée par #619 | Même famille xOrus |
| **#604** | selfhost API smoke | **Bloquée ops** | Dépend d’un serveur owner prouvé |
| **#598** | OVH read-only preflight | **Review only** | VPS absent ; utile en lecture seule |
| **#591** | release 0.140.0 | **Attendre** CI + décision release | Bot release-please |
| **#601 #597 #596 #457 #458 #459** | dependabot | **Merge un par un si CI verte** | Pas de feature finance |
| **#478 #477** draft | docs GO commercial / readiness | **Garder draft** | Docs sans activation |
| **#430** draft | RWA escrow release gates | **Garder draft** | Touche escrow — pas de merge sans #428 |
| **#407** draft | Pulse #005 mint | **Garder draft** | Mint mainnet — NO-GO |

**Ne pas merger #618–#621** tant que : host access-api prouvé, SHA servi, CORS, `VITE_ACCESS_API_BASE`, smoke `probe-xorus-assisted-disabled` verts.

---

## Issues ouvertes — décision

| Issue | Titre | Statut triage |
|-------|--------|----------------|
| **#613** | Backend sans VPS · Neon Functions | **P0 ops actif** — tracker host |
| **#341** | DNS/MX hello@ | **P0 ops actif** — mail réel |
| **#582** | Mailbox user @xartists.art | **P1** après #341 |
| **#428** | Mainnet listing/buy/escrow | **P0 commerce** — rester ouvert, verrouillé |
| **#506** | xPortal / Reown allowlist | **P0 wallet** — rester ouvert |
| **#465** | Comptes + abo EUR + EGLD | **P0** — rester ouvert |
| **#548** | xOrus commercial private reports | **P0** paper entitlements — pas de live trade |
| **#403** | Genesis Pulse #005 mint | **P0** mint — NO-GO sans preuves |
| **#281** | Livraison mint / Neon sandbox | **P0** — rester ouvert |
| **#487** | Licence Artprice B2B | **Bloqué légal** externe |
| **#416** | World Rights licence | **P0** licence |
| **#393** | UX 360° | **P1 produit** large |
| **#391** | Marketplace multichaîne | **P1** |
| **#347** | xOrus telemetry paper | **P1** qualité paper |
| **#367** | LIA Intent BUY_PACK | **Legacy LIA** — paper path ; ne pas réactiver LIA live |
| **#570** | Jupiter executor pre-sign check | **Hors xOrus MultiversX** ; chemin LIA/Solana — évaluer retire ou isolé |

---

## Ce qui est *déjà* réglé côté code (ne pas rouvrir)

- Restauration `services/access-api/src/server.mjs` (~43k) + route assisted + flag OFF
- Module `xorusAssistedSwap.mjs` + front proxy-only
- Policy exact allowlist + sim stricte (Python + JS)
- Incident troncature documenté (`RESTORE_ACCESS_API_SERVER.md`)

---

## Ordre d’attaque recommandé

1. **Ops host** (#613) — API joignable + SHA
2. **Mail** (#341) — réception prouvée
3. **Merge deps** sûres (Dependabot) si CI verte
4. **Review puis merge** #620 puis #619/#621 **sans** activer `XORUS_ASSISTED_SWAP_ENABLED`
5. **Wallet** (#506) avant tout commerce
6. **Escrow/listing** (#428) seulement après 1–5
7. **x402** monétisation analyses — backlog, hors OneDex

---

## Interdits explicites

- Activer `XORUS_ASSISTED_SWAP_ENABLED` ou `XORUS_LIVE_TRADING`
- Annoncer `api.xartists.art` live sans smoke SHA
- Fermer #428 / #506 / #341 comme « done » sans preuve runtime
- Merger #407 / #430 vers mainnet GO
