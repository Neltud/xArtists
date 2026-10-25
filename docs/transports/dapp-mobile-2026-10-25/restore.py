import argparse, base64, gzip, hashlib, json, os, subprocess
from pathlib import Path, PurePosixPath

BRANCH = 'feat/dapp-mobile-transport'
ARCHIVE_SHA256 = 'ae35ee4db896258e22de1afac3cbe0944fe1642711