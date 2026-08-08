"""
Vellum next-run — delegates to unified pipeline (canonical).

Kept as stable import path for existing Vellum nodes:
  python -m lia.vellum.next_run
"""
from __future__ import annotations

import json

from lia.vellum.pipeline import run_pipeline


def main() -> dict:
    return run_pipeline(publish=True, run_stack_demo=False)


if __name__ == "__main__":
    print(json.dumps(main(), indent=2, default=str))
