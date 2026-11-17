"""DEPRECATED — use xorus.catalog (phase 1b)."""
from __future__ import annotations
import warnings
warnings.warn("lia.xorus.catalog is deprecated; use xorus.catalog", DeprecationWarning, stacklevel=2)
from xorus.catalog import FAMILIES, catalog
__all__ = ["FAMILIES", "catalog"]
