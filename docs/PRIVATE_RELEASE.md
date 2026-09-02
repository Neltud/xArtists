# xArtists — Private Release checklist

**Objectif :** early access utilisable sans sur-promettre le market on-chain.

## A. Front
- `npm run build` vert · SPA `404.html`
- Bannières SC si codeHash null
- Connect : extension/Web — refus LIA ops
- Galerie index + virtual · Board JSON 200
- DAO lecture seule · branding xArtists

## B. Vellum
- Prompt : `docs/VELLUM_PRIVATE_RELEASE_PROMPT.md`
- Nodes : `data/vellum_workflow_nodes_private.json`
- Adapters : `data/vellum_strategy_adapters.json`
- Flags : `LIA_LIVE_TRADING=0` · `CHAIN=1`
- Secrets : PEM/JWT Secret Store only
- Timer : board 1–5 min · full 1h · **pas** deploy SC

## C. Gates
```bash
PYTHONPATH=. python -m lia.security.go_live_gates
PYTHONPATH=. python -m lia.security.onchain_micro_proof status
```

Private UX OK sans SC si bandeaux clairs. Cash List/Buy = deploy + codeHash + signature.

## D. Ordre ops
1. Coller prompt private release  
2. Cycle paper + publish  
3. Rebuild Pages  
4. Invite : Gallery / Studio / Dashboard  
5. PEM → deploy SC → micro-proof → LIVE éventuel  
