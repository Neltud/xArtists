# Launch prep — site & dApp · 2026-10-29

## Statut produit (sandbox / paper)

| Surface | Route | Design shell | Contenu | Sortie ? |
|---------|-------|--------------|---------|----------|
| Home | `/` | ✅ Shell + Genesis shelf | Hero + univers + packs | **GO soft** |
| Agents / Packs | `/intelligence/agents` · `/agents` | ✅ PACK_VISUAL · caps | 110/75/50 · 333/500/777 | **GO soft** |
| Checkout | modal | ✅ wallet + terms | Quote serveur | **GO soft** (sandbox) |
| My Packs | `/workspace/agents` · `/my-packs` | ✅ | rooms locked/owned | **GO soft** |
| Market | `/explore/market` | ✅ tabs shell | RWA + digital | **GO soft** |
| Museum | `/explore/museum` | ✅ chrome shell · 3D immersif | WebGL + catalog | **GO soft** |
| LIA | `/intelligence/lia` | ✅ | paper board | **GO soft** |
| Trading | `/finance/trading` | ✅ | desk → salles | **GO soft** |
| Wallet | `/workspace/wallet` | ✅ | connect xPortal | **GO soft** |
| Legal | `/legal` | ✅ | CGU / risk / process | **GO soft** |
| App access | `/app` | ✅ | PWA / xPortal | **GO soft** |
| Command | `/intelligence/command` | 🟡 dense | intents paper | paper only |
| Finance rails | TRO / stake / LP / Hatom | 🟡 | DeFi modules | **pas annonce primaire** |

## Règles annonce mainstream

1. **Message** : accès packs NFT + musée + LIA **paper** — pas de promesse de rendement.
2. **Prix** : Pulse 110 € · Yield 75 € · Sentinel 50 € (serveur autorité).
3. **Supply** : 333 / 500 / 777 visibles sur cartes.
4. **Paiement** : sandbox PayBox uniquement jusqu’à GO humain production.
5. **Trading live** : `VITE_LIA_LIVE_TRADING=0` — signatures xPortal manuelles.

## Ops bloquants avant annonce large

- [ ] Rebuild **GitHub Pages** (workflow `static.yml`) après commits UI.
- [ ] Variable `VITE_ACCESS_API_BASE` = `https://xartists-access-api.onrender.com` (déjà default workflow).
- [ ] Réveil / health API Render Free (cold start ~1 min).
- [ ] Recette checkout sandbox : quote Pulse 11000 · guest 401 · JWT buyer OK.
- [ ] Vérifier Home public : shelf Genesis visible.
- [ ] Aucun `LIA_LIVE_TRADING=1` en public.

## Non-objectifs (hors vague sortie)

- Paiements réels / mint production.
- Escrow physique P1 (spec only).
- Multichain rails marchands.
- Purge exhaustive de tous les modules DeFi secondaires.

## Commits UI récents (vague 1–2 + prep)

- Genesis shelf Home · MyPacks PACK_VISUAL · Checkout wallet gate
- AccessTerms · Login · PathHub · HomeHud · Header acid
- Market · Legal · Trading · Museum chrome tokens

**Verdict** : prêt **annonce soft / waitlist / sandbox** après rebuild Pages + recette API verte.  
**NO-GO** production marchande sans GO humain explicite.
