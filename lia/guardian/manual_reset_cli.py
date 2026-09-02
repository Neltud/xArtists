"""
Manual kill-switch reset CLI — ops / multisig only. Never called by Timer.

  PYTHONPATH=. python -m lia.guardian.manual_reset_cli status
  PYTHONPATH=. python -m lia.guardian.manual_reset_cli request --operator ops --note 'incident-42'
  KILL_RESET_ACK=1 PYTHONPATH=. python -m lia.guardian.manual_reset_cli confirm \
      --operator multisig --post-mortem https://...
"""
from __future__ import annotations

import argparse
import json
import os


def _circuit():
    try:
        from lia.guardian.kill_reset import KillResetCircuit

        return KillResetCircuit()
    except Exception:
        from lia.guardian.preflight import PreFlightValidator

        return PreFlightValidator()


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description="Manual LIA kill-switch reset (ops only)")
    sub = p.add_subparsers(dest="cmd", required=True)

    sub.add_parser("status")
    r = sub.add_parser("request")
    r.add_argument("--operator", required=True)
    r.add_argument("--note", default="")
    c = sub.add_parser("confirm")
    c.add_argument("--operator", required=True)
    c.add_argument("--post-mortem", required=True, dest="post_mortem")
    c.add_argument("--token", default=os.environ.get("KILL_RESET_TOKEN"))

    args = p.parse_args(argv)
    circ = _circuit()

    if args.cmd == "status":
        st = getattr(circ, "status", None) or getattr(circ, "state", lambda: {})
        out = st() if callable(st) else st
        print(json.dumps(out if isinstance(out, dict) else {"state": str(out)}, indent=2, default=str))
        return 0

    if args.cmd == "request":
        fn = getattr(circ, "request_reset", None) or getattr(circ, "request_kill_reset", None)
        if not fn:
            print(json.dumps({"ok": False, "error": "no request_reset on circuit"}))
            return 1
        res = fn(operator=args.operator, note=args.note)
        print(json.dumps(res if isinstance(res, dict) else {"ok": bool(res)}, indent=2, default=str))
        return 0 if (res is True or (isinstance(res, dict) and res.get("ok", True))) else 1

    if args.cmd == "confirm":
        if os.environ.get("LIA_LIVE_TRADING", "0") in ("1", "true", "TRUE"):
            if os.environ.get("KILL_RESET_ACK", "") != "1":
                print(json.dumps({"ok": False, "error": "LIVE requires KILL_RESET_ACK=1"}))
                return 1
        fn = getattr(circ, "confirm_reset", None) or getattr(circ, "confirm_kill_reset", None)
        if not fn:
            print(json.dumps({"ok": False, "error": "no confirm_reset on circuit"}))
            return 1
        res = fn(
            operator=args.operator,
            post_mortem_ref=args.post_mortem,
            token=args.token,
        )
        print(json.dumps(res if isinstance(res, dict) else {"ok": bool(res)}, indent=2, default=str))
        return 0 if (res is True or (isinstance(res, dict) and res.get("ok", True))) else 1

    return 2


if __name__ == "__main__":
    raise SystemExit(main())
