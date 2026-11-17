"""DEPRECATED — prefer python -m xorus"""
import warnings

warnings.warn("python -m lia.xorus is deprecated; use python -m xorus", DeprecationWarning, stacklevel=1)

try:
    from xorus.swarm import main
except ImportError:  # pragma: no cover
    from lia.xorus.swarm import main  # type: ignore

if __name__ == "__main__":
    main()
