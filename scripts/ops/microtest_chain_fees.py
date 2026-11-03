#!/usr/bin/env python3
"""xArtists micro preflight: fee simulations only, never broadcasts transactions.

- xEGLD devnet: /network/config (GET) and /transaction/cost (read-only POST).
- SOL devnet: JSON-RPC getLatestBlockhash and getFeeForMessage (read-only).
- Ephemeral PUBLIC addresses, no signing keys, no wallet, no faucet, no send.
- Micro amounts: 0.001 xEGLD and 0.000001 devnet SOL.
"""
import base64
import json
import os
import secrets
import struct
import sys
import time
import urllib.error
import urllib.request

EGLD_ATOMS = 10**15  # 0.001 xEGLD, NOT mainnet funds
SOL_LAMPORTS = 1000  # 0.000001 devnet SOL, NOT mainnet funds
EGLD_GATEWAY = "https://devnet-gateway.multiversx.com"
SOLANA_RPC = "https://api.devnet.solana.com"
B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
BECH32 = "qpzry9x8gf2tvdw0s3jn54khce6mua7l"


def fetch_json(url, payload=None, attempts=3):
    headers = {"Accept": "application/json", "User-Agent": "xArtists-readonly-micro-preflight/1.0"}
    data = None
    if payload is not None:
        data = json.dumps(payload, separators=(",", ":")).encode()
        headers["Content-Type"] = "application/json"
    last = None
    for attempt in range(attempts):
        try:
            request = urllib.request.Request(url, data=data, headers=headers)
            with urllib.request.urlopen(request, timeout=22) as response:
                if response.status != 200:
                    raise RuntimeError("remote HTTP status: " + str(response.status))
                return json.load(response)
        except (urllib.error.URLError, TimeoutError, ValueError) as error:
            last = error
            if attempt + 1 < attempts:
                time.sleep(3 + attempt * 2)
    raise RuntimeError("RPC unavailable (no funds sent): " + str(last))


def base58_encode(data):
    number = int.from_bytes(data, "big")
    chars = ""
    while number:
        number, digit = divmod(number, 58)
        chars = B58[digit] + chars
    return "1" * (len(data) - len(data.lstrip(b"\x00"))) + chars


def base58_decode(text):
    n = 0
    for char in text:
        n = n * 58 + B58.index(char)
    out = n.to_bytes((n.bit_length() + 7) // 8, "big")
    return b"\x00" * (len(text) - len(text.lstrip("1"))) + out


def bech32_polymod(values):
    chk = 1
    for value in values:
        top = chk >> 25
        chk = ((chk & 0x1FFFFFF) << 5) ^ value
        for i, generator in enumerate((0x3B6A57B2, 0x26508E6D, 0x1EA119FA,
                                       0x3D4233DD, 0x2A1462B3)):
            if (top >> i) & 1:
                chk ^= generator
    return chk


def convertbits(data, from_bits, to_bits):
    acc, bits, ret = 0, 0, []
    mask = (1 << to_bits) - 1
    for value in data:
        acc = (acc << from_bits) | value
        bits += from_bits
        while bits >= to_bits:
            bits -= to_bits
            ret.append((acc >> bits) & mask)
    if bits:
        ret.append((acc << (to_bits - bits)) & mask)
    return ret


def make_erd_address(public_key):
    hrp = "erd"
    data = convertbits(public_key, 8, 5)
    values = [ord(c) >> 5 for c in hrp] + [0] + [ord(c) & 31 for c in hrp]
    polymod = bech32_polymod(values + data + [0] * 6) ^ 1
    checksum = [(polymod >> (5 * (5 - i))) & 31 for i in range(6)]
    return hrp + "1" + "".join(BECH32[v] for v in data + checksum)


def shortvec(number):
    out = bytearray()
    while True:
        byte = number & 0x7F
        number >>= 7
        out.append(byte | (0x80 if number else 0))
        if not number:
            return bytes(out)


def rpc(method, params):
    result = fetch_json(SOLANA_RPC, {
        "jsonrpc": "2.0", "id": 1, "method": method, "params": params,
    })
    if "error" in result:
        raise RuntimeError("Solana devnet RPC " + method + ": " +
                           str(result["error"].get("code", "unknown")))
    if "result" not in result:
        raise RuntimeError("Solana RPC response missing result")
    return result["result"]


def multiversx_preflight():
    config = fetch_json(EGLD_GATEWAY + "/network/config")
    network = (config.get("data") or {}).get("config") or {}
    chain_id = network.get("erd_chain_id")
    if chain_id != "D":
        raise AssertionError("Expected MultiversX DEVNET chain ID D")
    public_key = secrets.token_bytes(32)  # Public bytes only. No private key exists.
    address = make_erd_address(public_key)
    assert address.startswith("erd1") and len(address) == 62
    request = {
        "nonce": 0,
        "value": str(EGLD_ATOMS),
        "receiver": address,
        "sender": address,
        "gasPrice": int(network.get("erd_min_gas_price", 1_000_000_000)),
        "gasLimit": int(network.get("erd_min_gas_limit", 50000)),
        "chainID": chain_id,
        "version": 1,
    }
    cost = fetch_json(EGLD_GATEWAY + "/transaction/cost", request)
    if cost.get("code") != "successful":
        raise RuntimeError("MultiversX devnet cost estimate rejected: " +
                           str(cost.get("code") or "unexpected_response"))
    estimated_gas = (cost.get("data") or {}).get("txGasUnits")
    if not str(estimated_gas).isdigit() or int(estimated_gas) < 50000:
        raise RuntimeError("Invalid EGLD devnet estimated gas")
    return {"chain": "multiversx-devnet", "network_verified": True,
            "amount_atoms": str(EGLD_ATOMS), "amount_xegld": "0.001",
            "estimated_gas_units": int(estimated_gas),
            "broadcast": False, "transaction_hash": None,
            "mode": "read_only_cost_estimate"}


def solana_preflight():
    block = rpc("getLatestBlockhash", [{"commitment": "confirmed"}])
    recent = base58_decode(block["value"]["blockhash"])
    if len(recent) != 32:
        raise RuntimeError("Invalid Solana blockhash")
    sender = secrets.token_bytes(32)  # No private key or funded wallet.
    receiver = secrets.token_bytes(32)
    system_program = b"\x00" * 32
    # Canonical legacy Solana message: 1 signer, recipient, System Program.
    # Only its FEE is queried. No Ed25519 signature or transaction is created.
    message = (
        bytes([1, 0, 1]) + shortvec(3) +
        sender + receiver + system_program + recent +
        shortvec(1) + bytes([2]) + shortvec(2) + bytes([0, 1]) +
        shortvec(12) + struct.pack("<IQ", 2, SOL_LAMPORTS)
    )
    result = rpc("getFeeForMessage", [
        base64.b64encode(message).decode("ascii"),
        {"commitment": "confirmed"},
    ])
    fee = result.get("value")
    if not isinstance(fee, int) or fee <= 0:
        raise RuntimeError("Solana devnet fee estimation did not succeed")
    return {"chain": "solana-devnet", "network_verified": True,
            "amount_lamports": SOL_LAMPORTS, "amount_sol": "0.000001",
            "estimated_fee_lamports": fee,
            "broadcast": False, "transaction_signature": None,
            "mode": "read_only_fee_estimate"}


def main():
    checks = []
    for name, fn in (("EGLD", multiversx_preflight), ("SOL", solana_preflight)):
        try:
            item = fn()
            item["status"] = "PASS"
            checks.append(item)
            print(name, "micro preflight PASS:", json.dumps(item, sort_keys=True))
        except Exception as error:
            # No secret, internal connection URL, or account information in this
            # failure text. Never fall back to mainnet or a mutable endpoint.
            checks.append({"chain": name, "status": "BLOCKED",
                           "mode": "read_only", "broadcast": False})
            print(name, "micro preflight BLOCKED:", type(error).__name__,
                  str(error)[:140], file=sys.stderr)
    summary = ["## xArtists EGLD / SOL micro preflight — DEVNET ONLY",
               "",
               "No mainnet, no key, no signer, no faucet, no transfer, no token bridge.",
               "",
               "| Chain | Amount | Network RPC proof | Transaction |",
               "|---|---:|---|---|"]
    for item in checks:
        amount = item.get("amount_xegld") or item.get("amount_sol") or "—"
        evidence = str(item.get("estimated_gas_units") or
                       item.get("estimated_fee_lamports") or "unavailable")
        summary.append("| " + item["chain"] + " | " + str(amount) +
                       " | " + item["status"] + " (" + evidence + ") | **NOT SENT** |")
    summary += ["", "PayBox card checkout remains disabled; signing and live",
                "transaction testing require separately scoped approval."]
    if os.environ.get("GITHUB_STEP_SUMMARY"):
        with open(os.environ["GITHUB_STEP_SUMMARY"], "a", encoding="utf-8") as out:
            out.write("\n".join(summary) + "\n")
    if any(item["status"] != "PASS" for item in checks):
        sys.exit(1)


if __name__ == "__main__":
    main()
