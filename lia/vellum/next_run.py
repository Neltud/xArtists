"""
Single Vellum cadence entrypoint.
Runs pipeline (paper) then ensures lia_hub_status.json is published.
"""
from __future__ import annotations

import json

from lia.vellum.pipeline import run_pipeline


def main() -> dict:
    out = run_pipeline(publish=True, run_stack_demo=False)
    try:
        from lia.vellum.publish_lia_hub_status import publish as hub_pub

        hub = hub_pub()
        if isinstance(out, dict):
            out = {**out, "lia_hub_status": hub}
    except Exception as e:
        if isinstance(out, dict):
            out = {**out, "lia_hub_status_error": str(e)}
    return out if isinstance(out, dict) else {"result": out}


if __name__ == "__main__":
    print(json.dumps(main(), indent=2, default=str))
