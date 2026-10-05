# Operational Manual — xArtists / LIA

You control capital. The machine proposes.

## Defaults

| Setting | Value |
|---------|--------|
| `LIA_LIVE_TRADING` | **0** |
| UI mode | Shadow |
| LIA + NFT | **Blocked** |

---

## Signature process (xPortal / Vellum)

1. Generate proposal
   ```bash
   PYTHONPATH=. python -m lia.genesis.decision_chain --cycles 1
   PYTHONPATH=. python -m lia.guardian.signature_bridge --from-decision
   ```
2. Open dApp → Signature bridge (or `data/signature_packages.json`)
3. **Copy calldata** / full step (receiver, value, data, gasLimit)
4. Sign & send in **xPortal** or Vellum executor
5. Close the loop
   ```bash
   PYTHONPATH=. python -m lia.guardian.signature_bridge --match <txHash>
   ```
6. Optional UI: “I signed — wait for on-chain” (spinner until package shows executed)

---

## First Blood (first real dust session)

1. `python -m lia.genesis.integration_test` → **PASS**
2. Preflight strike deployer
3. Signature process above (0.001–0.005 EGLD)
4. Explorer success → `--match`
5. Leave live flag at **0** after session

Proven foundation TX: wrap `b843b2cc…` · swap `c45847d4…` · TRO `1b56321b…`

---

## Emergency Kill-Switch

```bash
PYTHONPATH=. python -c "from lia.guardian.kill_switch import get_kill_switch; get_kill_switch().trigger('ops_manual')"
```

Clear:
```bash
PYTHONPATH=. python -c "from lia.guardian.kill_switch import get_kill_switch; get_kill_switch().clear('ops_ack_clear')"
```

Auto: EGLD −8% / 15 min → BLACK_SWAN.

---

## Economic Pulse

| Field | Meaning |
|-------|---------|
| Minted | TRO on RWA mint ledger |
| Burned | TRO on sold+shipped |
| Circulating | Minted − Burned |

---

## Daily (optional)

```bash
PYTHONPATH=. python -m lia.genesis.tick
PYTHONPATH=. python -m lia.guardian.yield_distributor --cycle
```

## Local stack

```bash
docker compose up --build
```
