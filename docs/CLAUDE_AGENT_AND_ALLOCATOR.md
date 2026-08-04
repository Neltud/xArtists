# Claude Trading Agent + Portfolio Allocator

Modules **prêts**, tests unitaires fournis isolément. **Non connectés** à un wallet réel. `auto_execute=False`.

Voir `docs/VELLUM_LIA_RECONSTRUCTION.md` et `lia/claude_agent/`.

## Avant prod

1. Brancher `call_claude` (API Anthropic injectée)
2. Brancher `execute_fn` = même signer que LIA executor
3. Backtester HedgedMomentum sur données réelles
4. Polymarket = autre chaîne / autre wallet (hors lock MVX si utilisé)
5. Garder advisor-only jusqu’à micro validation
