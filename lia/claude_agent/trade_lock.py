"""Shared file-based lock — LIA and Claude must not double-sign the same wallet."""
from __future__ import annotations

import json
import os
import time
import uuid
from pathlib import Path
from typing import Optional


class LockHeldByOther(Exception):
    def __init__(self, holder: str, expires_at: float):
        self.holder = holder
        self.expires_at = expires_at
        super().__init__(f"lock held by '{holder}' until {expires_at}")


class TradeLock:
    def __init__(self, path: Path, owner: str, ttl_seconds: float = 120.0):
        self.path = Path(path)
        self.owner = owner
        self.ttl_seconds = ttl_seconds
        self._token: Optional[str] = None

    def _read(self) -> Optional[dict]:
        if not self.path.exists():
            return None
        try:
            return json.loads(self.path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            return None

    def _is_expired(self, state: dict, now: float) -> bool:
        return now >= state.get("expires_at", 0)

    def acquire(self, now: Optional[float] = None) -> str:
        now = time.time() if now is None else now
        existing = self._read()
        if existing is not None and not self._is_expired(existing, now):
            if existing.get("owner") != self.owner:
                raise LockHeldByOther(existing["owner"], existing["expires_at"])
        token = str(uuid.uuid4())
        state = {
            "owner": self.owner,
            "token": token,
            "acquired_at": now,
            "expires_at": now + self.ttl_seconds,
        }
        self.path.parent.mkdir(parents=True, exist_ok=True)
        tmp_path = self.path.with_suffix(self.path.suffix + f".tmp-{token}")
        tmp_path.write_text(json.dumps(state), encoding="utf-8")
        os.replace(tmp_path, self.path)
        self._token = token
        return token

    def release(self, token: Optional[str] = None) -> bool:
        token = token or self._token
        existing = self._read()
        if existing is None:
            return False
        if existing.get("token") != token:
            return False
        try:
            self.path.unlink()
        except FileNotFoundError:
            pass
        self._token = None
        return True

    def is_locked_by_other(self, now: Optional[float] = None) -> bool:
        now = time.time() if now is None else now
        existing = self._read()
        if existing is None or self._is_expired(existing, now):
            return False
        return existing.get("owner") != self.owner

    def __enter__(self):
        self.acquire()
        return self

    def __exit__(self, exc_type, exc, tb):
        self.release()
        return False
