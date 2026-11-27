#!/usr/bin/env python3
"""First deployment only, to the dedicated Studio project, always disabled."""
import argparse
import getpass
import hashlib
import io
import json
import os
from pathlib import Path, PurePosixPath
import re
import secrets
import sys
import time
import urllib.error
import urllib.request
import zipfile

PROJECT = 'shy-tooth-63227941'
BRANCH = 'br-sparkling-breeze-bh8gp2jl'
SLUG = 'studio'
API = f'https://console.neon.tech/api/v2/projects/{PROJECT}/branches/{BRANCH}/functions/{SLUG}'
EXPECTED_ENTRY = {'index.mjs', 'build-meta.json', 'deploy/neon/studio/index.mjs',
                  'deploy/neon/studio/handler.mjs', 'services/access-api/src/creatorMedia.mjs',
                  'node_modules/pg/package.json', 'node_modules/@multiversx/sdk-core/package.json'}

def inspect_bundle(path, expected_sha=None):
    if path.stat().st_size > 20 * 1024 * 1024:
        raise ValueError('ZIP exceeds the reviewed size ceiling')
    raw = path.read_bytes()
    with zipfile.ZipFile(io.BytesIO(raw)) as z:
        names = z.namelist()
        if len(set(names)) != len(names) or not EXPECTED_ENTRY.issubset(names):
            raise ValueError('Not a Studio deployment ZIP')
        if sum(i.file_size for i in z.infolist()) > 120 * 1024 * 1024:
            raise ValueError('Unexpected expanded size')
        for n in names:
            p = PurePosixPath(n)
            if p.is_absolute() or '..' in p.parts or '\\' in n or p.name.startswith('.env') or p.suffix in ('.key', '.pem'):
                raise ValueError('Unsafe archive entry')
        if z.testzip() is not None:
            raise ValueError('Corrupt archive')
        source = json.loads(z.read('build-meta.json'))['source_sha']
        if not re.fullmatch('[0-9a-f]{40}', source) or (expected_sha and source != expected_sha):
            raise ValueError('Unexpected source commit')
    return raw, source, hashlib.sha256(raw).hexdigest()

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        return None

def request(url, key, method='GET', data=None, headers=None):
    req = urllib.request.Request(url, data=data, method=method, headers={
        'Authorization': 'Bearer ' + key, 'Accept': 'application/json', **(headers or {})})
    try:
        with urllib.request.build_opener(NoRedirect()).open(req, timeout=30) as res:
            return res.status, json.loads(res.read(1024 * 1024))
    except urllib.error.HTTPError as error:
        return error.code, {}
    except (OSError, ValueError):
        raise SystemExit('Neon request failed; inspect the console before retrying. No automatic replay.')

def multipart(raw, env):
    boundary = 'xa-studio-' + secrets.token_hex(16)
    chunks = []
    for name, value in [('runtime', 'nodejs24'), ('environment', json.dumps(env))]:
        chunks.append((f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"\r\n\r\n{value}\r\n').encode())
    chunks.extend([(f'--{boundary}\r\nContent-Disposition: form-data; name="zip"; filename="studio.zip"\r\nContent-Type: application/zip\r\n\r\n').encode(),
                   raw, f'\r\n--{boundary}--\r\n'.encode()])
    return b''.join(chunks), 'multipart/form-data; boundary=' + boundary

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('bundle', type=Path)
    parser.add_argument('--expected-source')
    parser.add_argument('--deploy-disabled', action='store_true', help='Explicitly create the disabled function; default is offline verification')
    args = parser.parse_args()
    raw, source, digest = inspect_bundle(args.bundle, args.expected_source)
    print(json.dumps({'project': PROJECT, 'branch': BRANCH, 'slug': SLUG, 'source_sha': source, 'sha256': digest, 'upload_enabled': False}))
    if not args.deploy_disabled:
        return
    key = os.environ.get('NEON_API_KEY', '').strip()
    if not key and sys.stdin.isatty():
        key = getpass.getpass('Neon API key (hidden): ').strip()
    if not key:
        raise SystemExit('Missing dedicated Neon API key in secure environment.')
    status, _ = request(API, key)
    if status != 404:
        raise SystemExit(f'Expected an absent function (404), got {status}. Refusing to overwrite.')
    env = {'XARTISTS_STUDIO_PROJECT_CONFIRMED': PROJECT, 'STUDIO_FREE_PILOT': '1',
           'STUDIO_IPFS_PROVIDER': 'pinata', 'STUDIO_GLB_UPLOAD_ENABLED': '0',
           'CREATOR_MEDIA_UPLOAD_ENABLED': '0', 'XARTISTS_STUDIO_UPLOAD_APPROVED': '0',
           'ACCESS_JWT_SECRET': secrets.token_urlsafe(48)}
    body, mime = multipart(raw, env)
    status, result = request(API + '/deployments', key, 'POST', body, {'Content-Type': mime})
    if not 200 <= status < 300:
        raise SystemExit(f'Deployment not accepted (HTTP {status}).')
    # No raw response or environment values in logs.
    print('Disabled deployment accepted; checking current status.')
    for _ in range(24):
        status, result = request(API, key)
        function = result.get('function', result.get('data', result))
        deployment = function.get('current_deployment') or {}
        state = deployment.get('status')
        if status == 200 and state == 'completed':
            print(json.dumps({'deployment': 'completed', 'invocation_url': function.get('invocation_url'), 'upload_enabled': False}))
            return
        if state == 'failed':
            raise SystemExit('Neon build failed. Inspect private console logs.')
        time.sleep(5)
    raise SystemExit('Deployment completion unverified. Inspect Neon before retrying.')

if __name__ == '__main__':
    main()
