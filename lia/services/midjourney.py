"""
Midjourney / art prompt service for xArtists (Vellum)
====================================================
Professional performance model: structured prompts for NFT / gallery works.
Does NOT call Midjourney API (no public stable API key in-repo).
Outputs prompt packs + metadata for human or Discord/MJ workflow.

Env (optional):
  MIDJOURNEY_WEBHOOK_URL — Discord webhook to post prompts (never commit secrets)
"""
from __future__ import annotations

import json
import os
import time
import urllib.request
from dataclasses import asdict, dataclass, field
from typing import Any, Optional

MODELS = {
    "v6": {"label": "Midjourney v6", "suffix": "--v 6"},
    "v6.1": {"label": "Midjourney v6.1", "suffix": "--v 6.1"},
    "niji": {"label": "Niji 6", "suffix": "--niji 6"},
}

STYLES = {
    "gallery": "museum quality, curated gallery lighting, fine art print",
    "crypto": "digital art, cyber-aesthetic, MultiversX inspired, premium NFT cover",
    "portrait": "artist portrait, soft rim light, editorial photography",
    "abstract": "abstract composition, bold color fields, contemporary",
    "performance": "stage performance, dramatic light, motion, high contrast",
}


@dataclass
class ArtJob:
    title: str
    subject: str
    style: str = "gallery"
    model: str = "v6.1"
    aspect: str = "1:1"
    stylize: int = 250
    chaos: int = 0
    extra: str = ""
    tags: list[str] = field(default_factory=list)

    def build_prompt(self) -> str:
        style_txt = STYLES.get(self.style, STYLES["gallery"])
        m = MODELS.get(self.model, MODELS["v6.1"])
        parts = [
            self.subject.strip(),
            style_txt,
            "professional, high detail, coherent composition",
            self.extra.strip(),
        ]
        body = ", ".join(p for p in parts if p)
        flags = f"--ar {self.aspect} --stylize {self.stylize}"
        if self.chaos:
            flags += f" --chaos {self.chaos}"
        flags += f" {m['suffix']}"
        return f"{body} {flags}".strip()

    def to_dict(self) -> dict[str, Any]:
        d = asdict(self)
        d["prompt"] = self.build_prompt()
        d["model_label"] = MODELS.get(self.model, {}).get("label", self.model)
        d["mj_web"] = "https://www.midjourney.com"
        return d


def professional_pack(
    *,
    collection: str = "xArtists",
    artist: str = "Tuduri",
    theme: str = "sovereign digital art on MultiversX",
    n: int = 3,
) -> dict[str, Any]:
    """Generate a small professional prompt pack for gallery / NFT drops."""
    seeds = [
        ArtJob(
            title=f"{collection} — Hero",
            subject=f"Signature piece for {artist}, {theme}, iconic centerpiece",
            style="gallery",
            aspect="1:1",
            stylize=200,
            tags=["hero", "drop"],
        ),
        ArtJob(
            title=f"{collection} — Performance",
            subject=f"Live art performance energy, {theme}, audience silhouette",
            style="performance",
            aspect="16:9",
            stylize=300,
            tags=["performance"],
        ),
        ArtJob(
            title=f"{collection} — Crypto cover",
            subject=f"Premium NFT cover art, {theme}, TRO ecosystem visual language",
            style="crypto",
            aspect="1:1",
            stylize=250,
            tags=["nft", "cover"],
        ),
    ]
    jobs = [j.to_dict() for j in seeds[: max(1, min(n, len(seeds)))]]
    return {
        "updated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "service": "midjourney_prompt_pack",
        "status": "prompts_only",
        "note": "No MJ API key in-repo — paste prompts in Midjourney Discord or connected automation",
        "jobs": jobs,
    }


def maybe_post_webhook(text: str) -> dict[str, Any]:
    url = os.environ.get("MIDJOURNEY_WEBHOOK_URL", "").strip()
    if not url:
        return {"posted": False, "reason": "no MIDJOURNEY_WEBHOOK_URL"}
    try:
        payload = json.dumps({"content": text[:1900]}).encode()
        req = urllib.request.Request(
            url,
            data=payload,
            headers={"Content-Type": "application/json", "User-Agent": "xArtists-LIA/1.0"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=15) as r:
            return {"posted": True, "status": r.status}
    except Exception as e:
        return {"posted": False, "error": str(e)}


def run_vellum_node(
    *,
    theme: str = "xArtists MultiversX gallery",
    post_webhook: bool = False,
) -> dict[str, Any]:
    pack = professional_pack(theme=theme)
    out = {"pack": pack}
    if post_webhook and pack.get("jobs"):
        first = pack["jobs"][0].get("prompt") or ""
        out["webhook"] = maybe_post_webhook(f"**xArtists MJ prompt**\n```{first}```")
    return out


if __name__ == "__main__":
    print(json.dumps(run_vellum_node(), indent=2))
