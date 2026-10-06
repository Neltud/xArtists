# Sprint 1.1b SIWX + Chantier 2 Daily signals

## SIWX

- `POST /v1/access/challenge` → `{ message, nonce }`
- `POST /v1/verify-access` accepts optional `signature`, `message`, `nonce`
- Env `REQUIRE_SIWX=1` → unsigned requests rejected (SAMPLE)
- Verify: Ed25519 over message, pubkey from `erd1` bech32

Front: challenge then `trySignAccessMessage` (best-effort wallet).

## Signals

- Worker: `services/signals-worker/generate_daily_signal.py`
- JSON: `data/signals/daily_signal.json`
- API: `GET /v1/signals/daily`
- UI: `DailySignalWidget.tsx`
- Cron: `.github/workflows/daily-signals.yml` 08:00 UTC

**No auto trade.** Editorial / paper only.
