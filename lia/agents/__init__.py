"""LIA agents — sub-agent packs + autonomous trading swarm."""

from lia.agents.subagent_factory import (
    SubAgentSpec,
    create_subagent_from_prompt,
    listing_payload_for_marketplace,
)

__all__ = [
    "SubAgentSpec",
    "create_subagent_from_prompt",
    "listing_payload_for_marketplace",
    "run_swarm_cycle",
]


def __getattr__(name: str):
    if name == "run_swarm_cycle":
        from lia.agents.autonomous_swarm import run_swarm_cycle

        return run_swarm_cycle
    raise AttributeError(name)
