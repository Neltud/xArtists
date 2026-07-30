# LIA Vellum — Orchestrateur DeFi xArtists

**Principe :** LIA (workflow Vellum) est le cerveau opérationnel DeFi de la dApp.

Protocoles : Hatom, xExchange, jExchange, Xoxno (NFT; lend off by default), Soul **testnet only**, SC xArtists (NFT stake, TRO, marketplace, DAO).

Registry : `config/protocols.json`

Secrets Vellum : `LIA_PEM_*`, `FORCE_MODE=paper`, `MX_GATEWAY`, `HATOM_CONTROLLER`, `SOUL_ENABLED=testnet`, `ALLOW_DEPLOY=false`

Risk : HF Hatom, circuit breaker, max notional $50, no Soul mainnet, no PEM in git.

Voir aussi : docs/VELLUM_GITHUB_CONFIG.md, nodes/swarm_*, nodes/rewards_agent.py
