#!/usr/bin/env python3
"""Package only runtime sources and installed dependencies, never env or credentials."""
from pathlib import Path
import subprocess
import zipfile

root = Path(__file__).resolve().parents[2]
source = root / 'deploy/neon/xorus-hub'
modules = ['index.mjs', 'hub.mjs', 'registry.mjs', 'probes.mjs', 'postgres.mjs', 'network-agents.mjs', 'risk-policy.mjs', 'reference-quotes.mjs', 'paper-store.mjs', 'shared/paper-ledger.mjs', 'package.json']
changed = subprocess.check_output(['git', 'status', '--porcelain', '--untracked-files=normal', '--',
                                   'deploy/neon/xorus-hub', 'scripts/ops/package-xorus-hub.py'], cwd=root, text=True)
if changed.strip():
    raise SystemExit('Commit runtime and packaging changes before packaging; source provenance must be exact')
source_sha = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=root, text=True).strip()
dependencies = source / 'node_modules'
if not (dependencies / 'pg/package.json').is_file() or not (dependencies / '@neon/functions/package.json').is_file():
    raise SystemExit('Run npm ci in deploy/neon/xorus-hub first')
archive = root / 'dist/xorus-hub.zip'
archive.parent.mkdir(exist_ok=True)
with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as bundle:
    bundle.writestr('build-meta.mjs', f'export const PACKAGED_SOURCE_SHA = "{source_sha}"\n')
    for name in modules:
        bundle.write(source / name, name)
    for path in sorted(dependencies.rglob('*')):
        if not path.is_file() or path.is_symlink():
            continue
        relative = path.relative_to(source)
        if any(part.startswith('.') for part in relative.parts):
            continue
        if path.name.startswith('.env') or path.suffix in ('.key', '.pem'):
            raise SystemExit('Unexpected credential-like dependency file')
        bundle.write(path, relative.as_posix())
print(f'{archive} ({archive.stat().st_size} bytes)')
