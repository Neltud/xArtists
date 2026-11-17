"""DEPRECATED — use xorus.data_feed (phase 1b)."""
from __future__ import annotations
import warnings
warnings.warn("lia.xorus.data_feed is deprecated; use xorus.data_feed", DeprecationWarning, stacklevel=2)
from xorus.data_feed import *  # noqa: F401,F403
