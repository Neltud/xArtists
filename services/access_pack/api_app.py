"""
Minimal Access Pack HTTP API (Model C).

Endpoints:
  POST /v1/checkout/session   { pack_id, buyer_address }
  GET  /v1/checkout/status/:session_id
  POST /v1/webhooks/stripe    raw body + Stripe-Signature

Production: mount behind HTTPS (uvicorn / Cloud Run / Vellum sidecar).
No deposit/withdraw of user trading funds — membership only.
"""
from __future__ import annotations

import json
import os
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[2]

# allow running without package install
import sys

sys.path.insert(0, str(ROOT))

from services.access_pack.create_session import create_checkout_session  # noqa: E402
from services.access_pack.webhook_handler import (  # noqa: E402
    process_webhook_http,
    _load_idem,
)


def status_for_session(session_id: str) -> dict[str, Any]:
    idem = _load_idem()
    job = (idem.get("sessions") or {}).get(session_id)
    if not job:
        # also scan receipts
        receipts = ROOT / "data" / "mint_receipts"
        if receipts.is_dir():
            for p in receipts.glob("*.json"):
                try:
                    d = json.loads(p.read_text(encoding="utf-8"))
                    if d.get("stripe_session_id") == session_id:
                        job = d
                        break
                except Exception:
                    continue
    if not job:
        return {"session_id": session_id, "status": "unknown", "error": "not_found"}
    return {
        "session_id": session_id,
        "status": job.get("status", "unknown"),
        "pack_id": job.get("pack_id"),
        "buyer_address": job.get("buyer_address"),
        "tx_hash": job.get("tx_hash"),
        "nft_identifier": job.get("nft_identifier"),
        "error": job.get("error"),
        "model": "C",
        "paper_only": True,
    }


class Handler(BaseHTTPRequestHandler):
    def _json(self, code: int, body: dict[str, Any]) -> None:
        raw = json.dumps(body).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def do_OPTIONS(self) -> None:  # noqa: N802
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Stripe-Signature")
        self.end_headers()

    def do_GET(self) -> None:  # noqa: N802
        path = urlparse(self.path).path
        if path.startswith("/v1/checkout/status/"):
            sid = path.rsplit("/", 1)[-1]
            self._json(200, status_for_session(sid))
            return
        if path in ("/health", "/v1/health"):
            self._json(200, {"ok": True, "model": "C"})
            return
        self._json(404, {"error": "not_found"})

    def do_POST(self) -> None:  # noqa: N802
        path = urlparse(self.path).path
        length = int(self.headers.get("Content-Length") or 0)
        body = self.rfile.read(length) if length else b"{}"

        if path == "/v1/webhooks/stripe":
            sig = self.headers.get("Stripe-Signature") or ""
            try:
                out = process_webhook_http(body, sig)
                self._json(200, out)
            except Exception as e:
                self._json(400, {"ok": False, "error": str(e)})
            return

        if path == "/v1/checkout/session":
            try:
                data = json.loads(body.decode() or "{}")
                pack_id = data.get("pack_id") or ""
                buyer = data.get("buyer_address") or ""
                base = os.environ.get("ACCESS_PUBLIC_BASE", "https://neltud.github.io/xArtists")
                session = create_checkout_session(
                    pack_id=pack_id,
                    buyer_address=buyer,
                    success_url=f"{base}/my-packs?paid=1",
                    cancel_url=f"{base}/my-packs?cancelled=1",
                )
                self._json(200, session)
            except Exception as e:
                self._json(400, {"error": str(e)})
            return

        self._json(404, {"error": "not_found"})

    def log_message(self, fmt: str, *args: Any) -> None:
        sys.stderr.write("[access_api] " + (fmt % args) + "\n")


def main() -> None:
    port = int(os.environ.get("ACCESS_API_PORT", "8787"))
    server = HTTPServer(("0.0.0.0", port), Handler)
    print(json.dumps({"listening": port, "model": "C", "paths": [
        "POST /v1/checkout/session",
        "GET /v1/checkout/status/:id",
        "POST /v1/webhooks/stripe",
    ]}))
    server.serve_forever()


if __name__ == "__main__":
    main()
