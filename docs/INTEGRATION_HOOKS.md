# Integration hooks — Grok MCP + CrossAgentPanel

## 1. Vellum node

File: `lia/vellum/grok_mcp_ingest.py`

Standalone:

```bash
PYTHONPATH=. python -m lia.vellum.grok_mcp_ingest
```

### Wire into `lia/vellum/production_run.py`

After `phase_brain_cycle` (or after `phase_signals`), add:

```python
def phase_grok_mcp_ingest() -> dict[str, Any]:
    try:
        from lia.vellum.grok_mcp_ingest import run as grok_mcp_run
        return grok_mcp_run(publish_feedback=True)
    except Exception as e:
        return {"ok": False, "soft": True, "module": "grok_mcp_ingest", "error": str(e)}
```

In `run()`:

```python
report["phases"]["grok_mcp_ingest"] = phase_grok_mcp_ingest()
```

Optional summary fields:

```python
gm = report["phases"].get("grok_mcp_ingest") or {}
report["summary"]["cross_score"] = gm.get("cross_score")
report["summary"]["grok_mcp_ok"] = bool(gm.get("ok"))
```

## 2. Frontend mirror

In `lia/vellum/publish_data_for_frontend.py`, add to `CRITICAL`:

```python
"cross_score.json",
"agent_feedback_summary.json",
```

## 3. Frontend panel

File: `apps/frontend/src/components/CrossAgentPanel.tsx`

Example (Trading page or Home):

```tsx
import CrossAgentPanel from '../components/CrossAgentPanel'

// inside JSX:
<CrossAgentPanel />
```

## 4. Outputs

| File | Role |
|------|------|
| `data/cross_score.json` | Score 0–100 + components |
| `data/agent_feedback.jsonl` | Append-only log |
| `data/agent_feedback_summary.json` | Last ~12 entries for UI |

## 5. MCP (already shipped)

`packages/xartists-mcp` — same files via tools `publish_cross_score` / `get_feedback_log`.
