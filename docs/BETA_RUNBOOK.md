# Beta Runbook — LIA micro-live (not multi-ESDT free-for-all)

**Status:** Beta = human-launched jobs only. No front-end auto-trade.  
**Default:** `LIA_LIVE_TRADING=0` everywhere except a controlled Vellum secret for a single proof job.

---

## Glossary

| Term | Meaning |
|------|---------|
| **ESDT** | Fungible MultiversX token (e.g. `TRO-94c925`, `USDC-c76f1f`) |
| **Allowlist** | Closed set of tokens LIA may touch in Beta |
| **Cap** | Max notional / size per trade and per day |
| **PEM** | Agent private key — **Vellum secret only**, never in git |
| **Dry-run** | Sign path simulated; no broadcast |
| **Micro-proof** | One tiny real TX to prove PEM + gateway |
| **RCE** | Real Capital Engaged in product SCs (separate from LIA wallet) |

---

## 1. Allowlist (Beta — exactly 3 rails)

| ID | Token | Role |
|----|--------|------|
| 1 | `EGLD` (native) | Gas + micro self-transfer proof |
| 2 | `USDC-c76f1f` | Stable accumulate |
| 3 | `TRO-94c925` | Protocol token — prefer redistribute, not long hold |

**Explicitly out of Beta:** any other ESDT, NFT, random meme, unlimited router hops.

Code source of truth: `lia/beta/allowlist.py`

---

## 2. Caps (hard)

| Cap | Value | Notes |
|-----|--------|--------|
| Max single trade notional | **15 USD** | Or ≤ **1%** of LIA wallet equity if smaller |
| Max trades / UTC day | **3** | Includes failed live attempts that broadcast |
| Max daily notional | **40 USD** | Sum of abs size |
| Micro-proof EGLD | **≤ 0.001 EGLD** | Self-transfer only |
| Min wallet EGLD reserve | **0.05 EGLD** | Never spend below (gas) |

---

## 3. UniversalExecutor — what it can sign (audit)

File: `lia/executor/universal_executor.py`

| Method | What it does | Live requires |
|--------|----------------|---------------|
| `sign_and_send` | Generic TX (receiver, value, data string) | `LIA_LIVE_TRADING=1` + PEM file |
| `micro_swap_test_egld_self` | Self-transfer tiny EGLD (nonce proof) | same |
| `execute_swap` | Sends **pre-built** `data_hex` to a **router** address | Caller must build swap data; **no** auto path-finder |
| `redistribute_tro` | `ESDTTransfer` of TRO to policy targets | `asset_policy` module |
| `health` | Reports live flag, PEM present, breaker | always |

**Gaps (honest):**
- No built-in xExchange/OneDex quote + path builder
- `execute_swap` trusts caller `data_hex` — must be gated by allowlist + caps **before** call
- `redistribute_tro` depends on `lia.policy.asset_policy`
- Circuit breaker: 5 failures → 300s cooldown

**Dry-run:** if `LIA_LIVE_TRADING≠1`, methods return `mode=dry-run` and do not broadcast.

---

## 4. Vellum checklist (before any live job)

- [ ] PEM only in Vellum secret `LIA_WALLET_PEM_PATH` (or injected file) — **not** in repo
- [ ] `LIA_LIVE_TRADING=0` in git and default env
- [ ] For proof job only: set `LIA_LIVE_TRADING=1` in **job secret**, not permanently
- [ ] `python -m lia.executor.universal_executor` → `health.pem_configured=true`
- [ ] Dry-run first: `LIA_LIVE_TRADING=0 python -m lia.beta.micro_proof`
- [ ] Wallet LIA has ≥ 0.05 EGLD after proof
- [ ] Allowlist module import works: `from lia.beta.allowlist import assert_token_allowed`
- [ ] Human operator present; kill = unset `LIA_LIVE_TRADING` / stop job
- [ ] Explorer link saved in `data/beta_micro_proof.json` after success

---

## 5. Micro-proof procedure (human)

Goal: **one** dust TX, not a strategy.

```bash
# 1) Dry-run (safe)
export LIA_LIVE_TRADING=0
export LIA_WALLET_PEM_PATH=/path/to/lia.pem   # local/Vellum only
PYTHONPATH=. python -m lia.beta.micro_proof

# 2) Live dust self-transfer (≤ 0.001 EGLD)
export LIA_LIVE_TRADING=1
PYTHONPATH=. python -m lia.beta.micro_proof --live

# 3) Immediately
unset LIA_LIVE_TRADING   # or set 0
# Save explorer URL from stdout / data/beta_micro_proof.json
```

Expected: TX on [explorer](https://explorer.multiversx.com) from LIA wallet, value dust, status success.

**Do not** chain swaps in the same job until micro-proof is green.

---

## 6. After micro-proof (still not multi-ESDT free)

1. Log hash in ops notes  
2. Keep allowlist = 3 tokens  
3. Next: single **USDC or TRO** ESDTTransfer dust to self or policy address — separate PR  
4. Only then consider router swap with pre-reviewed data_hex  

---

## 7. Explicit non-goals (Beta)

- Auto-trade every ESDT  
- Front-end / GitHub Pages holding PEM  
- Unattended Gamma autonomy  
- Committing `LIA_LIVE_TRADING=1` into the repository  
