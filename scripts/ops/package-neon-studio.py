#!/usr/bin/env python3
"""Package reviewed Studio-only source and lockfile-installed runtime dependencies."""
from pathlib import Path
import subprocess
import zipfile

root = Path(__file__).resolve().parents[2]
src = root / 'services/access-api'
deps = src / 'node_modules'
if not (deps / 'pg/package.json').is_file() or not (deps / '@multiversx/sdk-core/package.json').is_file():
    raise SystemExit('Run npm ci --omit=dev in services/access-api first')
sha = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=root, text=True).strip()
paths = ['deploy/neon/studio/' + x for x in ('handler.mjs','store.mjs','index.mjs')]
paths += ['services/access-api/src/' + x for x in ('creatorMedia.mjs','studioKubo.mjs','studioPreflight.mjs','siwx.mjs','verifyAccess.mjs')]
archive = root / 'dist/neon-studio.zip'
archive.parent.mkdir(exist_ok=True)
with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as out:
    out.writestr('index.mjs', "export {default} from './deploy/neon/studio/index.mjs'\n")
    out.writestr('build-meta.json', '{"source_sha":"' + sha + '"}')
    out.write(src / 'package.json', 'package.json')
    for name in paths:
        out.write(root / name, name)
    for path in sorted(deps.rglob('*')):
        if not path.is_file() or path.is_symlink():
            continue
        rel = path.relative_to(deps)
        if any(part.startswith('.') for part in rel.parts):
            continue
        if path.suffix in ('.key','.pem') or path.name.startswith('.env'):
            raise SystemExit('Unexpected credential-like dependency file')
        out.write(path, 'node_modules/' + rel.as_posix())
print(archive, archive.stat().st_size)
