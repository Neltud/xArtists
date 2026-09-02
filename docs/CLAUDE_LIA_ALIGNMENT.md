# Alignement Claude ↔ LIA (plus de systèmes parallèles)

## Fichiers réels à brancher

| Claude | LIA repo |
|--------|----------|
| SignalBus `social_intel` cap **0.15** | `lia/signals/social_intel.py` (`weight_cap`) |
| Allocator sleeves | `lia/circuit/compound_pyramids.py` |
| `get_allocation(..., external_allocator=...)` | `lia/claude_agent/portfolio_allocator.py` |
| Adapter | `lia/claude_agent/pyramids_adapter.py` |
| SignalBus | `lia/claude_agent/signal_bus.py` |

## Usage

```python
from lia.claude_agent.portfolio_allocator import get_allocation
from lia.claude_agent.pyramids_adapter import pyramids_external_allocator
from lia.claude_agent.signal_bus import SignalBus
from lia.signals.social_intel import SocialIntel

social = SocialIntel().run(persist=False)
bus = SignalBus()  # caps social_intel=0.15
bus.add_social_from_bias(social.to_dict())
print(bus.composite())

# allocation = pyramid weights, not a second book
result = get_allocation(
    performances,
    total_budget=100.0,
    external_allocator=pyramids_external_allocator,
)
```

Sleeves pyramid (résumé) : MOM 15 · MR 15 · MICRO_ARB 20 · WEEKLY 10 · YIELD 25 · RESERVE 15.

`LIA_LIVE_TRADING=0` jusqu’à preuve micro.
