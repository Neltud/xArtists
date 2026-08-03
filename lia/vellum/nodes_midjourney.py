"""Vellum node entry: Midjourney professional prompt pack."""
from __future__ import annotations

from typing import Any

from lia.services.midjourney import run_vellum_node


def run(**kwargs: Any) -> dict[str, Any]:
    return run_vellum_node(
        theme=str(kwargs.get("theme") or "xArtists MultiversX gallery"),
        post_webhook=bool(kwargs.get("post_webhook") or False),
    )
