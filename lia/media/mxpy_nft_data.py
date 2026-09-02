"""Build ESDTNFTCreate data payload helpers (hex) for mxpy."""
from __future__ import annotations

import argparse


def to_hex(s: str) -> str:
    return s.encode("utf-8").hex()


def build_esdt_nft_create(
    *,
    token_id: str,
    name: str,
    royalties: int = 500,
    quantity: int = 1,
    file_hash: str = "",
    attributes: str = "",
    uris: list[str] | None = None,
) -> str:
    uris = uris or []
    parts = [
        "ESDTNFTCreate",
        to_hex(token_id),
        format(quantity, "x") if quantity > 0 else "01",
        to_hex(name),
        format(royalties, "x"),
        to_hex(file_hash) if file_hash else "00",
        to_hex(attributes) if attributes else "00",
    ]
    for u in uris:
        parts.append(to_hex(u))
    # pad odd hex lengths
    out = []
    for i, p in enumerate(parts):
        if i == 0:
            out.append(p)
            continue
        if len(p) % 2:
            p = "0" + p
        out.append(p)
    return "@".join(out)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--token", required=True)
    ap.add_argument("--name", required=True)
    ap.add_argument("--royalties", type=int, default=500)
    ap.add_argument("--uri", action="append", default=[])
    ap.add_argument("--attributes", default="")
    args = ap.parse_args()
    data = build_esdt_nft_create(
        token_id=args.token,
        name=args.name,
        royalties=args.royalties,
        attributes=args.attributes,
        uris=args.uri,
    )
    print(data)
    print()
    print("# Exemple:")
    print(
        "mxpy tx new --proxy https://gateway.multiversx.com --chain 1 "
        "--pem wallet.pem --recall-nonce "
        "--receiver erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u "
        f"--gas-limit 20000000 --data '{data}' --send"
    )


if __name__ == "__main__":
    main()
