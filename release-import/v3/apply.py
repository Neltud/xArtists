#!/usr/bin/env python3
"""Verify and atomically apply the transported snapshot on its release branch."""
from __future__ import annotations

import argparse
import base64
import gzip
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import tempfile

PREFIX = "release-import/v3"
WORKFLOW = ".github/workflows/import-v3-sources.yml"
BRANCH = "fix/v3-complete-release"


def git(*args: str) -> bytes:
    return subprocess.check_output(["git", *args])


def ensure(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def indexed(path: str) -> dict | None:
    entries = git("ls-files", "--stage", "-z", "--", path).split(b"\0")
    entries = [entry for entry in entries if entry]
    if not entries:
        return None
    ensure(len(entries) == 1, "Unmerged index entry: " + path)
    metadata, name = entries[0].split(b"\t", 1)
    mode, oid, stage = metadata.decode().split()
    ensure(stage == "0" and name.decode() == path, "Unexpected index entry: " + path)
    return {"mode": mode, "sha": oid}


def main(mode: str) -> None:
    root = Path(git("rev-parse", "--show-toplevel").decode().strip())
    os.chdir(root)
    ensure(git("branch", "--show-current").decode().strip() == BRANCH, "This importer only operates on " + BRANCH)
    ensure(not git("status", "--porcelain", "--untracked-files=no").strip(), "Tracked working tree is not clean.")
    directory = root / PREFIX
    manifest = json.loads((directory / "manifest.json").read_text())
    ensure(manifest.get("schema_version") == 1 and manifest.get("encoding") == "base64-gzip-git-patch", "Unknown transport format.")
    ensure(manifest.get("branch") == BRANCH, "Target branch mismatch.")
    for name in ("base_commit", "ready_commit"):
        ensure(bool(re.fullmatch(r"[0-9a-f]{40}", manifest.get(name, ""))), "Invalid commit in manifest.")
    base = manifest["base_commit"]
    ensure(subprocess.run(["git", "merge-base", "--is-ancestor", base, "HEAD"]).returncode == 0, "Expected base is not an ancestor of the checked-out branch.")
    required_workflows = manifest.get("required_workflows", {})
    for path, oid in required_workflows.items():
        ensure(path.startswith(".github/workflows/") and ".." not in Path(path).parts, "Invalid workflow path.")
        current = git("rev-parse", f"HEAD:{path}").decode().strip()
        ensure(current == oid, "Synchronize workflow before import: " + path)
    parts = []
    for index, expected in enumerate(manifest["parts"]):
        path = directory / f"part-{index:03d}.b64"
        data = path.read_text().encode()
        ensure(digest(data) == expected["sha256"], "Corrupted transport part: " + path.name)
        parts.append(base64.b64decode(data))
    payload = b"".join(parts)
    ensure(digest(payload) == manifest["compressed_sha256"], "Compressed archive digest mismatch.")
    patch = gzip.decompress(payload)
    ensure(digest(patch) == manifest["patch_sha256"], "Patch digest mismatch.")
    for entry in manifest["files"]:
        path = entry["path"]
        ensure(".." not in Path(path).parts and not path.startswith(".github/workflows/"), "Invalid path in manifest: " + path)
        current = indexed(path)
        expected = entry["before"]
        ensure(current == ({"mode": expected["mode"], "sha": expected["sha"]} if expected else None), "Base file mismatch: " + path)
    with tempfile.TemporaryDirectory(prefix="xartists-v3-") as temporary:
        patch_path = Path(temporary) / "sources.patch"
        patch_path.write_bytes(patch)
        subprocess.run(["git", "apply", "--check", "--index", str(patch_path)], check=True)
        if mode == "check":
            print(json.dumps({"verified": True, "files": len(manifest["files"]), "ready_commit": manifest["ready_commit"]}))
            return
        if mode == "push":
            ensure(os.environ.get("GITHUB_ACTIONS") == "true" and os.environ.get("GITHUB_REPOSITORY") == "Neltud/xArtists", "Automatic push is restricted to the repository's Actions runner.")
        subprocess.run(["git", "apply", "--index", str(patch_path)], check=True)
    for entry in manifest["files"]:
        expected = entry["after"]
        ensure(indexed(entry["path"]) == ({"mode": expected["mode"], "sha": expected["sha"]} if expected else None), "Imported file mismatch: " + entry["path"])
    for path in manifest["required_paths"]:
        ensure(indexed(path) is not None, "Required source is absent: " + path)
    subprocess.run(["git", "rm", "-r", "--", PREFIX], check=True, stdout=subprocess.DEVNULL)
    subprocess.run(["git", "-c", "user.name=github-actions[bot]", "-c", "user.email=41898282+github-actions[bot]@users.noreply.github.com", "commit", "-m", "feat(v3): import complete verified source snapshot", "-m", "Prepared-from: " + manifest["ready_commit"]], check=True)
    head = git("rev-parse", "HEAD").decode().strip()
    if mode == "push":
        subprocess.run(["git", "push", "origin", f"HEAD:refs/heads/{BRANCH}"], check=True)
    print(json.dumps({"imported_commit": head, "prepared_from": manifest["ready_commit"], "files": len(manifest["files"]), "pushed": mode == "push"}))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    modes = parser.add_mutually_exclusive_group()
    modes.add_argument("--apply", action="store_true", help="Apply and commit locally, without pushing")
    modes.add_argument("--push", action="store_true", help="Apply, commit and push from the authorized Actions runner")
    args = parser.parse_args()
    main("push" if args.push else "apply" if args.apply else "check")
