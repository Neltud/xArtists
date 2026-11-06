"""Read-only xArtists memory commitments and reproducible Merkle proofs.

NO blockchain writes: an anchor candidate is *unanchored* until a separate
chain-specific verifier attests a confirmed transaction and approved contract.
Proof of inclusion is not proof that the referenced event is truthful.
"""
from __future__ import annotations

import hashlib
import hmac
import json
import re
from typing import Any

SCHEMA = 1
MAX_EVENTS = 1024
ZERO_ROOT = "0" * 64
DIGEST = re.compile(r"^[0-9a-f]{64}$")
TYPES = {"rights", "provenance", "agent_signal", "payment", "delivery", "media"}
NETWORKS = {"multiversx-mainnet", "polygon-mainnet", "solana-mainnet", "offchain"}
FIELDS = {"v", "kind", "network", "subject_digest", "source_digest", "content_digest", "source_at_ms"}
LEAF_DOMAIN = b"xartists/memory/v1/leaf\0"
NODE_DOMAIN = b"xartists/memory/v1/node\0"
ANCHOR_DOMAIN = b"xartists/memory/v1/anchor-candidate\0"


def _is_digest(value: Any) -> bool:
    return isinstance(value, str) and DIGEST.fullmatch(value) is not None


def _canonical(data: dict[str, Any]) -> bytes:
    return json.dumps(data, sort_keys=True, separators=(",", ":"), ensure_ascii=True, allow_nan=False).encode("ascii")


def _check_event(event: Any) -> None:
    if not isinstance(event, dict) or set(event) != FIELDS:
        raise ValueError("invalid_event_schema")
    if type(event["v"]) is not int or event["v"] != SCHEMA or event["kind"] not in TYPES or event["network"] not in NETWORKS:
        raise ValueError("invalid_event_kind_or_network")
    if not all(_is_digest(event[key]) for key in ("subject_digest", "source_digest", "content_digest")):
        raise ValueError("digests_only_no_private_payload")
    if type(event["source_at_ms"]) is not int or not 0 < event["source_at_ms"] < 32_503_680_000_000:
        raise ValueError("invalid_source_timestamp")


def hash_leaf(event: dict[str, Any]) -> str:
    _check_event(event)
    return hashlib.sha256(LEAF_DOMAIN + _canonical(event)).hexdigest()


def _parent(left: str, right: str) -> str:
    return hashlib.sha256(NODE_DOMAIN + bytes.fromhex(left) + bytes.fromhex(right)).hexdigest()


def _levels(events: list[dict[str, Any]]) -> list[list[str]]:
    if not isinstance(events, list) or not 1 <= len(events) <= MAX_EVENTS:
        raise ValueError("invalid_batch_size")
    current = [hash_leaf(e) for e in events]
    if len(current) != len(set(current)):
        raise ValueError("duplicate_event")
    levels = [current]
    while len(current) > 1:
        current = [_parent(current[i],current[i + 1] if i + 1 < len(current) else current[i])
                   for i in range(0,len(current),2)]
        levels.append(current)
    return levels


def merkle_root(events: list[dict[str, Any]]) -> str:
    return _levels(events)[-1][0]


def membership_proof(events: list[dict[str, Any]], index: int) -> dict[str, Any]:
    levels = _levels(events)
    if type(index) is not int or not 0 <= index < len(events):
        raise ValueError("invalid_index")
    path: list[dict[str, str]] = []
    cursor = index
    for layer in levels[:-1]:
        sibling_index = cursor ^ 1
        if sibling_index >= len(layer):
            sibling_index = cursor  # duplicate last hash at odd level
        path.append({"sibling":layer[sibling_index],"position":"left" if cursor % 2 else "right"})
        cursor //= 2
    return {"v":SCHEMA,"index":index,"count":len(events),"path":path}


def verify_membership(event: dict[str, Any], proof: Any, expected_root: Any) -> bool:
    try:
        if not _is_digest(expected_root) or not isinstance(proof,dict) or set(proof) != {"v","index","count","path"}:
            return False
        count, index, path = proof["count"], proof["index"], proof["path"]
        if type(proof["v"]) is not int or proof["v"] != SCHEMA or type(count) is not int or type(index) is not int:
            return False
        if not 1 <= count <= MAX_EVENTS or not 0 <= index < count or not isinstance(path,list):
            return False
        expected_depth = (count-1).bit_length()
        if len(path) != expected_depth:
            return False
        digest = hash_leaf(event)
        width, cursor = count, index
        for step in path:
            if not isinstance(step,dict) or set(step) != {"sibling","position"} or not _is_digest(step["sibling"]):
                return False
            expected_side = "left" if cursor % 2 else "right"
            if step["position"] != expected_side:
                return False
            if cursor % 2 == 0 and cursor+1 >= width and step["sibling"] != digest:
                return False
            digest = _parent(step["sibling"],digest) if cursor % 2 else _parent(digest,step["sibling"])
            cursor //= 2
            width = (width+1)//2
        return hmac.compare_digest(digest,expected_root)
    except (ValueError,TypeError,KeyError,OverflowError):
        return False


def anchor_candidate(events: list[dict[str, Any]], *, sequence: int, previous_root: str = ZERO_ROOT,
                     target_network: str = "multiversx-mainnet") -> dict[str, Any]:
    if type(sequence) is not int or sequence < 1 or sequence > 2**63-1:
        raise ValueError("invalid_sequence")
    if not _is_digest(previous_root) or target_network not in NETWORKS - {"offchain"}:
        raise ValueError("invalid_anchor_target")
    root = merkle_root(events)
    envelope = {"v":SCHEMA,"sequence":sequence,"previous_root":previous_root,
                "merkle_root":root,"count":len(events),"target_network":target_network}
    return {**envelope,"candidate_hash":hashlib.sha256(ANCHOR_DOMAIN+_canonical(envelope)).hexdigest(),
            "state":"unanchored", "is_onchain_verified":False}
