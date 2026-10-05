"""
Hot wallet — loads PEM from filesystem path ONLY (never from git).

Env:
  LIA_PEM_PATH=/absolute/path/to/wallet.pem

Default sandbox path (local only, not committed as secret):
  /home/workdir/artifacts/deployer-wallet/xartists-sc-deployer.pem
"""
from __future__ import annotations

import os
from pathlib import Path
from typing import Any


def resolve_pem_path() -> Path:
    env = os.environ.get("LIA_PEM_PATH", "").strip()
    if env:
        return Path(env)
    # local sandbox deployer — not uploaded to git by this module
    candidates = [
        Path("/home/workdir/artifacts/deployer-wallet/xartists-sc-deployer.pem"),
        Path.home() / ".xartists" / "agent.pem",
    ]
    for c in candidates:
        if c.is_file():
            return c
    raise FileNotFoundError(
        "No PEM found. Set LIA_PEM_PATH to agent wallet outside the git repo."
    )


def load_signer() -> tuple[Any, str]:
    from multiversx_sdk import Address, UserSigner

    path = resolve_pem_path()
    # refuse if path looks inside repo tracked secrets
    parts = {p.lower() for p in path.parts}
    if ".git" in parts:
        raise RuntimeError("Refusing PEM inside .git")
    signer = UserSigner.from_pem_file(path)
    addr = Address(signer.get_pubkey().buffer, "erd").to_bech32()
    return signer, addr
