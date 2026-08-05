"""Sub-agent pack price bounds in EUR → EGLD via oracle."""
from __future__ import annotations

MIN_EUR = 5.0
MAX_EUR = 25.0


def clamp_eur(amount_eur: float) -> float:
    return max(MIN_EUR, min(MAX_EUR, float(amount_eur)))


def eur_to_egld(amount_eur: float, egld_usd: float, eur_usd: float = 1.08) -> float:
    """Rough EUR→EGLD; egld_usd from oracle. eur_usd default ~parity band."""
    eur = clamp_eur(amount_eur)
    if egld_usd <= 0:
        return 0.0
    usd = eur * eur_usd
    return round(usd / egld_usd, 6)


def validate_pack_price_eur(amount_eur: float) -> dict:
    if amount_eur < MIN_EUR:
        return {"ok": False, "error": f"min {MIN_EUR} EUR"}
    if amount_eur > MAX_EUR:
        return {"ok": False, "error": f"max {MAX_EUR} EUR"}
    return {"ok": True, "eur": clamp_eur(amount_eur)}
