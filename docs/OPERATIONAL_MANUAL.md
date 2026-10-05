# Operational Manual — xArtists / LIA (CEO guide)

Non-technical runbook. **You** control capital. The machine proposes.

## Defaults

| Setting | Value |
|---------|--------|
| `LIA_LIVE_TRADING` | **0** (off) |
| Mode UI | Shadow |
| NFT trading by LIA | **Blocked** |

---

## How to approve a trade

1. Run proposal pipeline:
   ```bash
   PYTHONPATH=. python -m lia.genesis.decision_chain --cycles 1
   ```
2. Open dApp → LIA / Cockpit → **Proposed actions** (status `ready_to_sign`).
3. Review amount, pair, reason, gas.
4. Only if you accept risk:
   ```bash
   LIA_LIVE_TRADING=1 PYTHONPATH=. python -m lia.guardian.strike_deployer --execute-proposal <id>
   ```
5. Sign TX with deployer / executor (ops).
6. Mark done:
   ```bash
   PYTHONPATH=. python -m lia.guardian.strike_deployer --mark-executed <id> <txHash>
   ```

**Sign & broadcast stays locked** on the public site while live flag is 0.

---

## How to trigger a Kill-Switch

```bash
PYTHONPATH=. python -c "from lia.guardian.kill_switch import get_kill_switch; get_kill_switch().trigger('ops_manual')"
```

Effects: freezes live path, writes `data/kill_switch.json`, forces trading flag off.

Clear (ops only):
```bash
PYTHONPATH=. python -c "from lia.guardian.kill_switch import get_kill_switch; get_kill_switch().clear('ops_ack_clear')"
```

Automatic: EGLD drop ≥ **8%** in **15 min** → Black Swan lock.

---

## How to read Economic Pulse

| Gauge | Meaning |
|-------|---------|
| **Minted** | TRO credited on RWA mint events (ledger) |
| **Burned** | TRO on sold+shipped settlement |
| **Circulating** | Minted − Burned |
| **Burn/mint %** | Deflation pressure |

Paper until on-chain TRO transfer + burn TX are marked.

---

## 5-step protocol — first live trade

1. `PYTHONPATH=. python -m lia.genesis.integration_test` → must **PASS**
2. Preflight: `python -m lia.guardian.strike_deployer --preflight-only`
3. Decision chain dust proposal → human review
4. `LIA_LIVE_TRADING=1` **only for that session** + sign one dust TX
5. Explorer hash → `post_trade` / `mark-executed` → set live back to **0**

---

## Daily pulse (optional)

```bash
PYTHONPATH=. python -m lia.genesis.tick
PYTHONPATH=. python -m lia.guardian.yield_distributor --cycle
```

## Local stack

```bash
docker compose up --build
```

Frontend :5173 · data-tick refreshes monitor/sprint/kill-switch every 2 min · live always 0 in compose.
