"""
Inject the deployed agents marketplace address into Warp templates.

Reads:
  - data/contracts.json
  - data/agents_catalog.json (optional, for future sync hooks only)

Writes:
  - data/warps/*.json

Never reads or writes secrets.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data"
CONTRACTS = DATA / "contracts.json"
CATALOG = DATA / "agents_catalog.json"
WARPS_DIR = DATA / "warps"
PLACEHOLDERS = (
    "{{AGENTS_MARKETPLACE}}",
    "{{AGENTS_MARKETPLACE_ADDRESS}}",
    "__AGENTS_MARKETPLACE__",
)


def _read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def _write_json(path: Path, payload: Any) -> None:
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def _extract_address(payload: dict[str, Any]) -> str | None:
    raw = payload.get("contracts", {}).get("agents_marketplace") or payload.get("agents_marketplace")
    if isinstance(raw, str) and raw.startswith("erd1"):
        return raw
    return None


def _replace_placeholders(value: Any, address: str) -> Any:
    if isinstance(value, str):
        next_value = value
        for placeholder in PLACEHOLDERS:
            next_value = next_value.replace(placeholder, address)
        return next_value
    if isinstance(value, list):
        return [_replace_placeholders(item, address) for item in value]
    if isinstance(value, dict):
        return {key: _replace_placeholders(item, address) for key, item in value.items()}
    return value


def _sync_catalog_defaults(warp_name: str, payload: dict[str, Any], catalog: list[dict[str, Any]]) -> dict[str, Any]:
    if not catalog:
        return payload

    signal_base = next((item for item in catalog if str(item.get("id", "")).startswith("lia-signal")), catalog[0])
    price_egld = signal_base.get("priceEgld")
    if not isinstance(price_egld, str) or not price_egld.strip():
        return payload

    next_payload = json.loads(json.dumps(payload))
    for action in next_payload.get("actions", []):
        for input_def in action.get("inputs", []):
            if warp_name == "list-agent-action.json" and input_def.get("name") == "price_egld":
                input_def["default"] = price_egld
            if warp_name == "buy-agent-action.json" and input_def.get("name") == "payment_egld":
                input_def["default"] = price_egld
    return next_payload


def update_warps(sync_remaining: bool = False) -> dict[str, Any]:
    contracts_payload = _read_json(CONTRACTS)
    address = _extract_address(contracts_payload)
    files_updated: list[str] = []

    if not WARPS_DIR.is_dir():
        return {"ok": False, "address": address, "files_updated": files_updated, "error": "missing data/warps directory"}

    catalog: list[dict[str, Any]] = []
    if CATALOG.is_file():
        try:
            loaded_catalog = _read_json(CATALOG)
            if isinstance(loaded_catalog, list):
                catalog = [item for item in loaded_catalog if isinstance(item, dict)]
        except Exception:
            catalog = []

    for warp_path in sorted(WARPS_DIR.glob("*.json")):
        original = _read_json(warp_path)
        updated = _sync_catalog_defaults(warp_path.name, original, catalog)

        if address:
            updated = _replace_placeholders(updated, address)

        if sync_remaining and isinstance(updated, dict):
            metadata = updated.setdefault("metadata", {})
            if isinstance(metadata, dict):
                metadata["catalog_remaining_sync"] = "handled_by_agents_catalog_json"

        if updated != original:
            _write_json(warp_path, updated)
            files_updated.append(str(warp_path.relative_to(ROOT)))

    return {"ok": bool(address), "address": address, "files_updated": files_updated}


if __name__ == "__main__":
    print(json.dumps(update_warps(), ensure_ascii=False))
