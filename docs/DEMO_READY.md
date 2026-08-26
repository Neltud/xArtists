# DEMO READY — xArtists (mode démo only)

**URL :** https://neltud.github.io/xArtists/  
**Posture :** DEMO · PAPER LIA · LIVE DATA READS  
**Date :** 2026-08-26

---

## Réponse courte

| Question | Réponse |
|----------|--------|
| Prête pour **demo mode only** ? | **Oui** |
| **On-chain live** (écritures market/agents) ? | **Non** — SC codeHash null |
| **Toutes les datas live** ? | **Lectures** réseau/prix/soldes **oui** · board LIA **paper JSON** |

---

## Ce que la démo montre (honnête)

### Live (lectures MultiversX / feeds)
- Prix EGLD / tokens via API + oracles publiés
- Soldes wallet utilisateur si Connect
- Explorer links, réseau mainnet réel
- Status SC (explicitement *pending*)

### Paper / simulé (JSON Vellum → Pages)
- Board LIA, trades paper, compounding 10 colonnes
- Fusion signaux GSN / Polymarket / free, ticker
- Brain EV + DecisionProof (commitment paper)
- Paper legs, Risk Manager state, Guardian Commander

### Volontairement OFF
- `LIA_LIVE_TRADING=0` — aucun ordre auto LIA
- List / Buy NFT marketplace on-chain
- Buy / mint agents SC
- Treasury splitter live

---

## Parcours démo conseillé (5–8 min)

1. **Home** — bandeau DEMO · LiaPathStrip · Commander · DataHealth  
2. **Trading** — fusion · brain · paper legs · compounding · annual  
3. **Wallet** — connecter (optionnel) · soldes live  
4. **Agents / My Packs** — packs Model C (accès, pas un fonds)  
5. **Marketplace** — UI + bannière SC pending (pas de faux market)  
6. **Tip** — optionnel, vraie TX user si wallet signant  

---

## Ops avant une démo

```bash
git pull origin main
export PYTHONPATH=. CHAIN=1 LIA_LIVE_TRADING=0
python -m lia.vellum.production_run
git add data/ apps/frontend/public/data/
git commit -m "data: demo snapshot" && git push
# attendre rebuild Pages
```

Front local :

```bash
cd apps/frontend && npm ci && npm run dev
# DEMO_MODE on by default; VITE_DEMO_MODE=0 to hide strip
```

---

## Après la démo (prod on-chain)

1. Deploy SC (`docs/VELLUM_DEPLOY.md` / `SC_DEPLOY_COMMANDS.md`)  
2. `verify_marketplace_codehash.py` exit 0  
3. `VITE_*_CODEHASH_OK=1` + rebuild  
4. Micro-preuves → seulement alors envisager live trading  

---

**Verdict livraison démo :** le produit est **présentable en mode démo** avec données board fraîches et lectures on-chain live. Ce n’est **pas** une marketplace on-chain live ni un bot de trading live.
