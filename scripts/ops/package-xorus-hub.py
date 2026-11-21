#!/usr/bin/env python3
"""Package only runtime sources and installed dependencies, never env or credentials."""
from pathlib import Path
import zipfile

root = Path(__file__).resolve().parents[2]
source = root / 'deploy/neon/xorus-hub'
modules = ['index.mjs', 'hub.mjs', 'registry.mjs', 'probes.mjs', 'postgres.mjs', 'package.json']
dependencies = source / 'node_modules'
if not (dependencies / 'pg/package.json').is_file() or not (dependencies / '@neon/functions/package.json').is_file():
    raise SystemExit('Run npm ci in deploy/neon/xorus-hub first')
archive = root / 'dist/xorus-hub.zip'
archive.parent.mkdir(exist_ok=True)
with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as bundle:
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
