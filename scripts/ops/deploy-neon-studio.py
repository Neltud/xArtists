#!/usr/bin/env python3
"""Studio-only release runner. Bootstrap disabled; update code only after reconciliation."""
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
from urllib.parse import urlsplit
import zipfile

PROJECT = 'shy-tooth-63227941'
BRANCH = 'br-sparkling-breeze-bh8gp2jl'
SLUG = 'studio'
API = f'https://console.neon.tech/api/v2/projects/{PROJECT}/branches/{BRANCH}/functions/{SLUG}'
ORIGIN = 'https://br-sparkling-breeze-bh8gp2jl-studio.compute.c-10.eu-central-1.aws.neon.tech'
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
    fields = [('runtime', 'nodejs24'), ('environment', json.dumps(env))] if env is not None else []
    for name, value in fields:
        chunks.append((f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"\r\n\r\n{value}\r\n').encode())
    chunks.extend([(f'--{boundary}\r\nContent-Disposition: form-data; name="zip"; filename="studio.zip"\r\nContent-Type: application/zip\r\n\r\n').encode(),
                   raw, f'\r\n--{boundary}--\r\n'.encode()])
    return b''.join(chunks), 'multipart/form-data; boundary=' + boundary

def function_record(payload):
    item = payload.get('function', payload.get('data', payload))
    if not isinstance(item, dict):
        raise SystemExit('Unexpected Neon response; no automatic replay.')
    return item

def deployment_record(payload):
    item = payload.get('deployment', payload.get('data', payload))
    if not isinstance(item, dict) or type(item.get('id')) is not int:
        raise SystemExit('Deployment ID missing; reconcile manually before retrying.')
    return item

def public_probe(origin, path, expected_status=200, caller='https://xartists.art'):
    if origin != ORIGIN or urlsplit(origin).scheme != 'https':
        raise SystemExit('Unexpected invocation origin; no frontend switch.')
    req = urllib.request.Request(origin + path, headers={'Origin': caller, 'Accept': 'application/json', 'Cache-Control': 'no-cache'})
    try:
        with urllib.request.build_opener(NoRedirect()).open(req, timeout=20) as res:
            status, headers, body = res.status, res.headers, res.read(65536)
    except urllib.error.HTTPError as error:
        status, headers, body = error.code, error.headers, error.read(65536)
    except OSError:
        raise SystemExit('Public smoke unavailable; reconcile before retrying.')
    if status != expected_status:
        raise SystemExit(f'Public smoke unexpected HTTP {status}.')
    if caller == 'https://xartists.art' and headers.get('Access-Control-Allow-Origin') != caller:
        raise SystemExit('Public smoke CORS mismatch.')
    if caller != 'https://xartists.art' and headers.get('Access-Control-Allow-Origin'):
        raise SystemExit('Untrusted origin received CORS permission.')
    try:
        return json.loads(body)
    except ValueError:
        raise SystemExit('Public smoke invalid JSON.')

def health(origin, expected_source=None):
    info = public_probe(origin, '/health')
    if (info.get('ok') is not True or info.get('service') != 'xartists-studio-neon'
            or info.get('commerce_enabled') is not False
            or info.get('mint_requires_artist_signature') is not True
            or type(info.get('studio_upload_enabled')) is not bool
            or not re.fullmatch('[0-9a-f]{40}', str(info.get('source_sha')))
            or (expected_source is not None and info.get('source_sha') != expected_source)):
        raise SystemExit('Public health does not prove expected Studio source and safety.')
    config = public_probe(origin, '/v1/studio/media/config')
    if (config.get('enabled') is not info['studio_upload_enabled']
            or config.get('pilot_images_only') is not True or config.get('maxImageMiB') != 2
            or config.get('mint_requires_artist_signature') is not True):
        raise SystemExit('Public config does not match Studio pilot.')
    public_probe(origin, '/health', 403, 'https://invalid.example')
    public_probe(origin, '/v1/checkout', 404)
    return info

def release(raw, source, digest, key, mode, expected_id=None):
    status, payload = request(API, key)
    if mode == 'bootstrap':
        if status != 404:
            raise SystemExit(f'Expected an absent function (404), got {status}. Refusing to overwrite.')
        env = {'XARTISTS_STUDIO_PROJECT_CONFIRMED': PROJECT, 'STUDIO_FREE_PILOT': '1',
               'STUDIO_IPFS_PROVIDER': 'pinata', 'STUDIO_GLB_UPLOAD_ENABLED': '0',
               'CREATOR_MEDIA_UPLOAD_ENABLED': '0', 'XARTISTS_STUDIO_UPLOAD_APPROVED': '0',
               'ACCESS_JWT_SECRET': secrets.token_urlsafe(48)}
        before_enabled = False
        previous_source = None
    else:
        if status != 200 or type(expected_id) is not int or expected_id <= 0:
            raise SystemExit('Code update requires a known current deployment ID.')
        current = function_record(payload)
        active = current.get('active_deployment') or {}
        latest = current.get('current_deployment') or {}
        if (active.get('id') != expected_id or latest.get('id') != expected_id
                or active.get('status') != 'completed' or latest.get('status') != 'completed'):
            raise SystemExit('Deployment changed or unsettled; reconcile before updating.')
        before = health(str(current.get('invocation_url', '')).rstrip('/'))
        before_enabled = before['studio_upload_enabled']
        previous_source = before['source_sha']
        if previous_source == source:
            raise SystemExit('Requested source already live. No duplicate deploy.')
        # Only the ZIP is sent. No environment/runtime field, no regenerated JWT,
        # no secret retrieval and no modification of activation flags.
        env = None
    body, mime = multipart(raw, env)
    status, payload = request(API + '/deployments', key, 'POST', body, {'Content-Type': mime})
    if not 200 <= status < 300:
        raise SystemExit(f'Deployment not accepted (HTTP {status}). Reconcile before retrying.')
    deployment = deployment_record(payload)
    deployment_id = deployment['id']
    if deployment_id == expected_id:
        raise SystemExit('Deployment ID did not advance; reconcile manually.')
    print(json.dumps({'accepted_deployment_id': deployment_id, 'source_sha': source}), flush=True)
    for _ in range(48):
        status, result = request(API, key)
        if status == 200:
            function = function_record(result)
            latest = function.get('current_deployment') or {}
            active = function.get('active_deployment') or {}
            if latest.get('id') == deployment_id:
                if latest.get('status') == 'failed':
                    raise SystemExit('Neon build failed. Inspect private console logs.')
                if latest.get('status') == 'completed' and active.get('id') == deployment_id and active.get('status') == 'completed':
                    origin = str(function.get('invocation_url', '')).rstrip('/')
                    info = health(origin, source)
                    if info['studio_upload_enabled'] is not before_enabled:
                        raise SystemExit('Upload readiness changed; operator reconciliation required.')
                    return {'project': PROJECT, 'branch': BRANCH, 'slug': SLUG, 'deployment_id': deployment_id,
                            'previous_deployment_id': expected_id, 'previous_source_sha': previous_source,
                            'source_sha': source, 'sha256': digest, 'invocation_url': origin,
                            'upload_enabled': before_enabled, 'public_smoke': 'passed'}
            elif latest.get('id') not in (None, expected_id):
                raise SystemExit('Different deployment observed; no replay.')
        time.sleep(5)
    raise SystemExit('Deployment completion unverified. Inspect Neon before retrying.')

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('bundle', type=Path)
    parser.add_argument('--expected-source')
    group = parser.add_mutually_exclusive_group()
    group.add_argument('--deploy-disabled', action='store_true', help='Create first disabled deployment')
    group.add_argument('--update-code', action='store_true', help='Update code only, preserving existing configuration')
    parser.add_argument('--expected-deployment-id', type=int)
    parser.add_argument('--receipt', type=Path)
    args = parser.parse_args()
    raw, source, digest = inspect_bundle(args.bundle, args.expected_source)
    print(json.dumps({'project': PROJECT, 'branch': BRANCH, 'slug': SLUG, 'source_sha': source, 'sha256': digest}))
    if not args.deploy_disabled and not args.update_code:
        return
    if not args.expected_source:
        raise SystemExit('Expected source SHA required for a deployment.')
    if args.update_code != (args.expected_deployment_id is not None):
        raise SystemExit('Expected deployment ID required only for code updates.')
    key = os.environ.get('NEON_API_KEY', '').strip()
    if not key and sys.stdin.isatty():
        key = getpass.getpass('Neon API key (hidden): ').strip()
    if not key:
        raise SystemExit('Missing dedicated Neon API key in secure environment.')
    result = release(raw, source, digest, key, 'update' if args.update_code else 'bootstrap', args.expected_deployment_id)
    receipt = json.dumps(result, indent=2)
    if args.receipt:
        args.receipt.write_text(receipt + '\n')
    print(receipt)

if __name__ == '__main__':
    main()
