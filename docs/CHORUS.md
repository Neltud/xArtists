# Chorus — remplace Vellum

Vellum n'est plus le runtime. Chorus est l'essaim paper d'xArtists.

## Ce que c'est

- 12 familles × 10 axes = **120 signaux définis**.
- Un signal sans donnée reste `defined_unfed` ou `no_input`. Il ne compte pas comme un avis.
- Recoupe uniquement les familles vraiment alimentées.
- Moins de 12 signaux alimentés, ou moins de 3 familles : **ABSTAIN / thin_tape**.
- Famille risque ≤ −0,35 : **ABSTAIN / risk_veto**.
- `executable` est toujours `false`. `LIA_LIVE_TRADING` est ignoré. Pas de PEM.

## Essaim

| Rôle | Familles |
|---|---|
| Scout | on-chain, DEX |
| Tape | prix, volume, volatilité, liquidité, funding |
| Crowd | social |
| Curator | art |
| Sentinel | risque (veto) |
| Macro | contexte seulement |
| Chair | brief ChatGPT, poids **plafonné à 15 %** |
| Scribe | écrit le board |

## Symbiose ChatGPT

ChatGPT ne signe pas et ne voit pas de clé. Il reçoit `handoff_for_chatgpt` et renvoie un brief :

```json
{"stance": "abstain", "confidence": 0.4, "note": "trois faits + un risque"}
```

Ce brief entre dans `external.chatgpt_brief` seulement.

## Lancer

```bash
PYTHONPATH=. python -m lia.chorus
```

L'ancien `lia.vellum.orchestrator.run_orchestrator` délègue ici et force `WAIT`.
Le dossier `lia/vellum/` reste dans le dépôt comme archive. On ne l'alimente plus.
