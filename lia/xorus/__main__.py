"""DEPRECATED — use python -m xorus"""
import warnings
warnings.warn("use python -m xorus", DeprecationWarning, stacklevel=1)
from xorus.swarm import main
if __name__ == "__main__":
    main()
