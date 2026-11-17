# LIA — RETIRED

**Status: retired 2026-11-17.**

LIA / Vellum is no longer an execution or ops path on xArtists.

## Replacement

| Old | New |
|-----|-----|
| `python -m lia.vellum.production_run` | `python -m xorus.production_run` |
| `python -m lia.xorus` | `python -m xorus` |
| LIA live trading | **forbidden** — paper xOrus only |

See:

- [`xorus/README.md`](xorus/README.md)
- [`docs/ops/LIA_PURGE_XORUS_BACKEND.md`](docs/ops/LIA_PURGE_XORUS_BACKEND.md)
- [`docs/XORUS_BACKEND_ENTRY.md`](docs/XORUS_BACKEND_ENTRY.md)

Do not set `LIA_LIVE_TRADING=1`. Do not re-enable `lia/vellum` cycles.
