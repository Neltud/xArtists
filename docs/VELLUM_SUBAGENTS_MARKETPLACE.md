# Sous-agents Vellum + Marketplace Agents

## Concept vendable

L’utilisateur (ou LIA) envoie un **prompt** → LIA fabrique un **SubAgentSpec** → file d’attente Vellum (`vellum_subagent_jobs.json`) → entrée catalogue → **list** sur `agents_marketplace` quand le SC est déployé → à l’achat : **clé API limitée + badge NFT + reçu**.

## Modules

| Path | Rôle |
|------|------|
| `lia/agents/subagent_factory.py` | Prompt → template → prix → catalog |
| `lia/agents/vellum_provision.py` | Queue jobs orchestrateur Vellum |
| `data/agents_catalog.json` | Catalogue off-chain |
| `data/vellum_subagent_jobs.json` | Jobs provision |

## Templates

momentum · mean_reversion · micro_arb · yield · social_watch · greensmoke · custom

## Commandes

```bash
python -m lia.agents.subagent_factory
python -m lia.agents.vellum_provision
```

## Vellum config (secrets)

- Ne jamais mettre PEM dans le prompt user  
- Chaque sous-agent : `LIA_LIVE_TRADING=0` jusqu’à policy pack  
- Différencier **packs LIA** (vendus) vs **GreenSmoke** (signaux externes)

## On-chain

`agents_marketplace: null` dans contracts.json → list/buy **bloqués** jusqu’au deploy P0.  
Seller peut être **LIA** ou adresse créateur (Studio).

## UX dApp

`/agents` : liste catalogue + bouton « Create from prompt » (API backend plus tard) + « Open as Warp » (Warps track).  
Prix indicatif en EGLD ; fee 3 % on-chain à l’achat.
