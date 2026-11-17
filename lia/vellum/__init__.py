"""LIA / Vellum execution path — RETIRED 2026-11-17.

Use package `xorus` instead:

    PYTHONPATH=. python -m xorus.production_run

Importing this package raises to prevent accidental ops cycles.
"""

raise ImportError(
    "lia.vellum is retired. Use: PYTHONPATH=. python -m xorus.production_run"
)
