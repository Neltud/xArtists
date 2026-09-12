from __future__ import annotations

import os
from dataclasses import dataclass, field


@dataclass
class Settings:
    x_bearer_token: str = field(default_factory=lambda: (os.environ.get("X_BEARER_TOKEN") or "").strip())
    redis_url: str = field(default_factory=lambda: (os.environ.get("REDIS_URL") or "").strip())
    hype_velocity_threshold: float = float(os.environ.get("PULSE_HYPE_VELOCITY") or "0.35")
    sentiment_shift_threshold: float = float(os.environ.get("PULSE_SENTIMENT_SHIFT") or "0.4")
    keywords: list[str] = field(default_factory=lambda: [
        "MultiversX", "$EGLD", "$HTM", "$TRO", "xArtists", "Hatom",
        "xExchange", "Supernova", "#MultiversX",
    ])
    # influencer handles without @ — stream filtered when API available
    accounts: list[str] = field(default_factory=lambda: [
        "MultiversX", "HatomProtocol", "xExchangeApp",
    ])

    @property
    def x_enabled(self) -> bool:
        return bool(self.x_bearer_token)


settings = Settings()
