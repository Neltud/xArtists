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


## Invariants de preuve des entrées — 11 novembre 2026

- **Aucune valeur par défaut ne peut simuler une observation réseau.** En particulier, si `slot_payable` est absent, `risk.payable_flag` est `no_input` et ne vote pas. Le booléen `false` explicite doit provenir d'une sonde on-chain horodatée ; `"false"`, `0` et les valeurs inférées ne conviennent pas.
- Les valeurs non numériques, infinies, NaN et booléennes ne sont pas des mesures pour les champs numériques. Statut `no_input`.
- L'avis externe n'est comptabilisé que si `stance` est exactement `flat`, `long` ou `short`, avec une confiance numérique finie entre 0 et 1. `abstain`, une confiance nulle, un texte seul ou une entrée malformée **ne votent pas**.
- Le mélange est `0,85 × score_interne + 0,15 × score_chair`. L'avis externe ne compte pas comme famille indépendante pour franchir le seuil de trois familles. Sentinel conserve son veto, même après un brief externe positif.
- Les 120 entrées du catalogue sont **définies**, pas alimentées. Le dernier instantané public connu mentionne 9 signaux alimentés sur 4 familles et la stance `ABSTAIN / thin_tape` ; ce n'est pas une mesure temps réel. Un résultat CI hors réseau ne déclare aucun nouveau signal alimenté.
- `executable=false`, `live_trading=false` et aucune signature ne changent pas en fonction des flux.

## Candidats de lectures publiques (non branchés en production)

| Signal existant | Source publique candidate | Champs du moteur | Condition d'alimentation |
| --- | --- | --- | --- |
| `price.ret_1h` | Historique public EGLD/USD CoinGecko | `price_change_1h` | Deux observations cohérentes et horodatées ; calcul explicite du rendement en % |
| `volume.spike_1h` | Bougies publiques EGLD/USDT Binance | `volume_spike` | Fenêtre complète, référence historique suffisante, provenance et horodatage |
| `liquidity.pool_usd` | Réserves publiques xExchange + prix USD indépendant | `liquidity_usd` | Pool et paire exacts, liquidité disponible et prix récent ; pas le solde d'un SC |
| `risk.drawdown` | Historique public EGLD/USD CoinGecko | `drawdown` | Fenêtre et sommet connus, valeur normalisée, aucune extrapolation |
| `dex.xex_vs_onedex` | Cotations publiques xExchange et OneDex | `price_dex_a`, `price_dex_b` | Même paire, même sens et horodatages rapprochés, pas de prix obsolète |

**Statut des cinq connecteurs : candidats documentés, NON ALIMENTÉS par cette PR.** Une future lecture réseau exige des champs de provenance et de fraîcheur vérifiés ; si la lecture échoue, conserver `no_input`. Aucun partenariat ou dépendance Vellum.
