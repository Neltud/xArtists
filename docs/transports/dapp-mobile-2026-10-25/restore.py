import argparse, base64, gzip, hashlib, json, os, subprocess
from pathlib import Path, PurePosixPath

BRANCH = 'feat/dapp-mobile-transport'
ARCHIVE_SHA256 = 'ae35ee4db896258e22de1afac3cbe0944fe1642711e14453e44f40986fc8afce'
TARGETS_SHA256 = 'd8adce93956effdc19ead4d895cd3f2019571f19164c8793a0b163f2c9a1f4be'
TRANSPORT = 'docs/transports/dapp-mobile-2026-10-25'
WORKFLOW = '.github/workflows/static.yml'

def sha(data):
    return hashlib.sha256(data).hexdigest()

def git(*args):
    return subprocess.check_output(['git', *args], text=True).strip()

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--proof', required=True, type=Path)
    args = parser.parse_args()
    if os.environ.get('GITHUB_REPOSITORY') != 'Neltud/xArtists':
        raise RuntimeError('Wrong repository')
    if os.environ.get('GITHUB_REF') != 'refs/heads/' + BRANCH:
        raise RuntimeError('This importer is restricted to its completion branch')
    if git('status', '--porcelain', '--untracked-files=no'):
        raise RuntimeError('Tracked source changes are already present')
    root = Path.cwd().resolve()
    transport = root / TRANSPORT
    manifest = json.loads((transport / 'transport.json').read_text())
    expected = {part['name'] for part in manifest['parts']} | {'transport.json', 'FILES.txt', 'restore.py'}
    observed = {path.relative_to(transport).as_posix() for path in transport.rglob('*') if path.is_file()}
    if observed != expected:
        raise RuntimeError('Unexpected or missing transport files')
    chunks = []
    for part in manifest['parts']:
        name = part['name']
        if PurePosixPath(name).name != name:
            raise RuntimeError('Unsafe part name')
        data = (transport / name).read_bytes()
        if sha(data) != part['sha256']:
            raise RuntimeError('Truncated or altered part: ' + name)
        chunks.append(data)
    compressed = base64.b64decode(b''.join(chunks), validate=True)
    if sha(compressed) != ARCHIVE_SHA256:
        raise RuntimeError('Archive integrity failure')
    payload = json.loads(gzip.decompress(compressed))
    rows = payload['files']
    targets = sorted((row['path'], row['sha256']) for row in rows)
    if len(rows) != 26 or len(dict(targets)) != 26:
        raise RuntimeError('Expected exactly 26 unique source paths')
    if sha(json.dumps(targets, separators=(',', ':')).encode()) != TARGETS_SHA256:
        raise RuntimeError('The source set differs from the reviewed kit')
    subprocess.run(['git', 'merge-base', '--is-ancestor', payload['base_sha'], 'HEAD'], check=True)
    plan = []
    for row in rows:
        name = row['path']
        path = PurePosixPath(name)
        if path.is_absolute() or '..' in path.parts or not (name.startswith('apps/frontend/') or name == WORKFLOW):
            raise RuntimeError('Unsafe source path: ' + name)
        target = root.joinpath(*path.parts)
        target.resolve().relative_to(root)
        if target.is_symlink():
            raise RuntimeError('Symlink destination: ' + name)
        blob = payload['blobs'][row['sha256']]
        if blob['encoding'] == 'utf-8':
            final = blob['data'].encode('utf-8')
        elif blob['encoding'] == 'base64':
            final = base64.b64decode(blob['data'], validate=True)
        else:
            raise RuntimeError('Unknown blob encoding')
        if sha(final) != row['sha256']:
            raise RuntimeError('Source integrity failure: ' + name)
        before = sha(target.read_bytes()) if target.exists() else None
        if name == WORKFLOW:
            if before != row['sha256']:
                raise RuntimeError('Upload the exact STATIC_WORKFLOW.yml through the API first')
        elif before not in (row['before_sha256'], row['sha256']):
            raise RuntimeError('Source drift; reconcile without overwriting: ' + name)
        elif before != row['sha256']:
            plan.append((target, final))
    for target, final in plan:
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(final)
    verified = []
    for row in rows:
        actual = sha((root / row['path']).read_bytes())
        if actual != row['sha256']:
            raise RuntimeError('Post-import verification failed: ' + row['path'])
        verified.append({'path': row['path'], 'sha256': actual})
    args.proof.parent.mkdir(parents=True, exist_ok=True)
    args.proof.write_text(json.dumps({'verified_sources': 26, 'base_sha': payload['base_sha'], 'archive_sha256': ARCHIVE_SHA256, 'files': verified}, indent=2) + '\n')
    print('26/26 reviewed files SHA-256 OK; no workflow was changed by the runner.')

if __name__ == '__main__':
    main()
