# Mapping TradingAgents → LIA xArtists

Inspiration : [TradingAgents](https://github.com/TauricResearch/TradingAgents) (multi-agent LLM desk).  
**Nous n’intégrons pas le framework entier** — on mappe les rôles sur l’existant + `desk_debate`.

| Rôle TradingAgents | Module xArtists |
|--------------------|-----------------|
| Technical analyst | `desk_debate` technical + `strategies` MOM |
| Fundamentals | partiel (Hatom / TVL feeds) — pas equity stocks |
| Sentiment / news | `signals/social_intel` + GSN leaderboard |
| Bull researcher | `desk_debate` bull_researcher |
| Bear researcher | `desk_debate` bear_researcher |
| Trader | `mvx_agent.decide` + `TradingStack.propose_entry` |
| Risk team | **Guardian** `spiral` + `defense_circuit` + risk_officer |
| Portfolio manager | `profit_lock` + treasury policy (Mission/Reserve) |

## Différences critiques

| TradingAgents | LIA |
|---------------|-----|
| Souvent stocks / sim exchange | MultiversX + paper → micro live |
| LLM lourds par cycle | Heuristique desk + agent + Claude 1×/j |
| Risk comme agent | **Guardian hard gate** (code) |
| Open execution | `LIA_LIVE_TRADING=0` jusqu’à preuve |

## Commande

```bash
python -m lia.circuit.desk_debate
python -m lia.vellum.pipeline   # inclut étape desk si branchée
```
