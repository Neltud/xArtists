"""
GreenSmokeConsumer — Vellum Workflows node that reads greensmoke_forecasts.json
and extracts trading-relevant signals.

Parses:
  - aggregated_signals (primary, secondary, regime, recommended_action)
  - Lia agent signals (crypto forecasts)
  - Macro agent signals (market regime)

Outputs (fed into AI brains as inputs):
  - gs_bias        : BULLISH | BEARISH | NEUTRAL
  - gs_confidence  : 0-100
  - gs_regime      : RISK_ON | RISK_OFF | NEUTRAL
  - gs_signal      : ACCUMULATE | BUY | HOLD | RISK_OFF | NEUTRAL  (composite action)
  - gs_egld_signal : per-asset signal string for EGLD
  - gs_btc_signal  : per-asset signal string for BTC
"""
import json
import os
from typing import Any

from vellum.workflows import BaseNode

DEFAULT_GS_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "data",
    "greensmoke_forecasts.json",
)


class GreenSmokeConsumer(BaseNode):
    """Consumes GreenSmoke forecast JSON and emits trading-relevant bias/regime."""

    # Node inputs
    forecasts_path: str = DEFAULT_GS_PATH
    forecasts_json: dict[str, Any] | None = None
    """Optional pre-loaded forecasts dict (bypasses disk read)."""

    class Outputs(BaseNode.Outputs):
        gs_bias: str
        gs_confidence: int
        gs_regime: str
        gs_signal: str
        gs_egld_signal: str
        gs_btc_signal: str
        gs_primary: str
        gs_recommended_action: str
        raw_signals: dict[str, Any]

    class Display(BaseNode.Display):
        icon = "vellum:icon:function"
        color = "teal"

    def run(self) -> "GreenSmokeConsumer.Outputs":
        data = self.forecasts_json or self._load_json()
        agents = data.get("agents", {}) or {}
        agg = data.get("aggregated_signals", {}) or {}

        lia_agent = agents.get("Lia", {}) or {}
        macro_agent = agents.get("Macro", {}) or {}

        lia_forecasts = lia_agent.get("forecasts", []) or []
        macro_forecasts = macro_agent.get("forecasts", []) or []

        # Per-asset signals from Lia
        egld_signal = self._asset_signal(lia_forecasts, "EGLD")
        btc_signal = self._asset_signal(lia_forecasts, "BTC")

        # Composite Lia bias
        lia_bias, lia_conf = self._derive_bias(lia_forecasts)

        # Macro regime
        gs_regime = self._derive_regime(macro_forecasts, agg)

        # Aggregated confidence (average of Lia + Macro agent confidence_avg)
        confs = []
        for agent in (lia_agent, macro_agent):
            c = agent.get("confidence_avg")
            if c is not None:
                confs.append(float(c) * 100)
        gs_confidence = int(sum(confs) / len(confs)) if confs else 50

        # Composite action signal
        gs_signal = self._composite_signal(lia_forecasts, gs_regime, agg)

        # Final bias — influenced by regime
        gs_bias = lia_bias
        if gs_regime == "RISK_OFF" and gs_bias == "BULLISH":
            gs_bias = "NEUTRAL"

        gs_primary = str(agg.get("primary", ""))
        gs_recommended_action = str(agg.get("recommended_action", ""))

        self._log(
            "INFO",
            f"🌿 GreenSmoke: bias={gs_bias} conf={gs_confidence} regime={gs_regime} signal={gs_signal} | EGLD={egld_signal} BTC={btc_signal}",
        )

        return self.Outputs(
            gs_bias=gs_bias,
            gs_confidence=gs_confidence,
            gs_regime=gs_regime,
            gs_signal=gs_signal,
            gs_egld_signal=egld_signal,
            gs_btc_signal=btc_signal,
            gs_primary=gs_primary,
            gs_recommended_action=gs_recommended_action,
            raw_signals=agg,
        )

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------
    def _load_json(self) -> dict[str, Any]:
        try:
            with open(self.forecasts_path, "r") as fh:
                return json.load(fh)
        except (FileNotFoundError, json.JSONDecodeError, OSError) as e:
            print(f"[GreenSmokeConsumer] Could not read {self.forecasts_path}: {e}")
            return {}

    @staticmethod
    def _asset_signal(forecasts: list[dict[str, Any]], asset: str) -> str:
        for f in forecasts:
            if str(f.get("asset", "")).upper() == asset.upper():
                return str(f.get("signal", "NEUTRAL"))
        return "NEUTRAL"

    @staticmethod
    def _derive_bias(forecasts: list[dict[str, Any]]) -> tuple[str, int]:
        """Derive a BULLISH/BEARISH/NEUTRAL bias from Lia crypto forecasts."""
        if not forecasts:
            return "NEUTRAL", 50
        bullish = bearish = 0
        for f in forecasts:
            direction = str(f.get("direction", "")).lower()
            if direction in ("bullish", "risk_on"):
                bullish += 1
            elif direction in ("bearish", "risk_off"):
                bearish += 1
        if bullish > bearish:
            return "BULLISH", 70
        if bearish > bullish:
            return "BEARISH", 70
        return "NEUTRAL", 50

    @staticmethod
    def _derive_regime(macro_forecasts: list[dict[str, Any]], agg: dict[str, Any]) -> str:
        # Prefer the aggregated regime field
        regime = str(agg.get("regime", "")).upper()
        if regime in ("RISK_ON", "RISK_OFF"):
            return regime
        # Fall back to Macro forecasts
        for f in macro_forecasts:
            direction = str(f.get("direction", "")).lower()
            signal = str(f.get("signal", "")).upper()
            if signal == "RISK_ON" or direction == "risk_on":
                return "RISK_ON"
            if signal == "RISK_OFF" or direction == "risk_off":
                return "RISK_OFF"
        return "NEUTRAL"

    @staticmethod
    def _composite_signal(
        lia_forecasts: list[dict[str, Any]], regime: str, agg: dict[str, Any]
    ) -> str:
        if regime == "RISK_OFF":
            return "RISK_OFF"
        # Collect the strongest buy-ish signal from Lia
        priority = {"BUY": 4, "ACCUMULATE": 3, "LONG_TECH": 3, "HOLD": 2, "MONITOR": 1, "WATCH": 1}
        best = 0
        for f in lia_forecasts:
            sig = str(f.get("signal", "NEUTRAL")).upper()
            best = max(best, priority.get(sig, 0))
        if best >= 4:
            return "BUY"
        if best >= 3:
            return "ACCUMULATE"
        if best >= 2:
            return "HOLD"
        return "NEUTRAL"

    def _log(self, severity: str, message: str) -> None:
        self._context.emit_log_event(severity=severity, message=message)
