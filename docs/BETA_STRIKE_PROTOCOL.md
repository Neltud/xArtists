# Beta Strike Protocol (ROE)

Config: `config/beta_strike.yaml`

## Proven capability (dust, human)

| Proof | TX |
|-------|-----|
| EGLD placeBid (payable market) | see MICRO_PROOF_PAYABLE |
| TRO ESDT transfer | `1b56321b…22444f` |
| wrapEgld | `b843b2cc…07538` |
| WEGLD→USDC swap | `c45847d4…25bd7` |

## Hard limits (YAML)

- Max exposure **0.05 EGLD**
- Max trade **0.005 EGLD** / **$15**
- Daily **$40** / **3** trades
- Drawdown stop **12%**
- Min confidence **0.62**

## Kill-switch (executor)

Refuse broadcast if:

1. `LIA_LIVE_TRADING != 1`
2. Circuit breaker open
3. System_Status == ERROR (ops flag)
4. Drawdown breach (when live equity tracked)

**UI Beta toggle stays locked** until ops signs off YAML + PEM vault + first human live trade checklist.

## Not yet

- Automated agent loop with `LIA_LIVE_TRADING=1`
- Kill-switch smart contract
