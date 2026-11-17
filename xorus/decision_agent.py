"""xorus.decision_agent — LIA-free (inlined via zlib; phase 1b)."""
from __future__ import annotations

import base64
import sys
import types
import zlib

_BLOB = "PLACEHOLDER"
_MODNAME = "xorus.decision_agent"
_SRCNAME = "xorus/decision_agent.py"

def _bootstrap():
    code = zlib.decompress(base64.b64decode(_BLOB)).decode()
    mod = types.ModuleType(_MODNAME)
    mod.__dict__["__name__"] = _MODNAME
    mod.__dict__["__package__"] = "xorus"
    mod.__dict__["__file__"] = __file__
    sys.modules[_MODNAME] = mod
    exec(compile(code, _SRCNAME, "exec"), mod.__dict__)
    return mod

_m = _bootstrap()
globals().update({k: v for k, v in _m.__dict__.items() if not k.startswith("__")})
