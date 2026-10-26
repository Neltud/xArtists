---
description: >-
  Reprise après l’import mobile vérifié : retrait polyLIA, correction Node 20,
  lien GitHub, checks et nouvelle PR.
hidden: true
noIndex: true
---

# Finaliser la sortie publique — import terminé, correctif Pages

L’import mobile est **terminé** : les 26 sources de `main` correspondent au kit et à la preuve du runner. La PR #186 est fusionnée. **Ne pas rejouer les 41 opérations mobiles.** Les quatre annexes et les onze opérations de retrait restent valides.

### Diagnostic actuel

Le run [Pages 40214350895](https://github.com/Neltud/xArtists/actions/runs/40214350895) échoue dans les tests, avant le build : `navigator is not defined`, dans `watchInstallPrompt`, sous Node 20. La panne est reproduite localement en désactivant le navigateur global de Node 24, puis corrigée sans supprimer ni contourner de test.

Le site https://neltud.github.io/xArtists/ sert encore l’ancien build ; les accès directs `/app/`, `/install/`, `/mobile/`, `/wallet/` et `/museum/` renvoient 404. Les 32 états du retrait polyLIA sont encore dans leur version antérieure sur `main`. Trois anciens workflows contiennent également des erreurs de syntaxe YAML.

### Exécution Grok — ordre concret

1. Faire une **fusion normale de `main` dans `feat/dapp-mobile-transport`**, sans reset ni force-push. Si la branche a été supprimée, la recréer depuis `main`. La nouvelle PR devra être distincte de #186, déjà fusionnée.
2. Supprimer via l’API `.github/workflows/hydrate-mobile-transport.yml`, devenu inutile. Le workflow d’import mobile est déjà absent ; ne pas le recréer.
3. Publier le seul fichier bootstrap ci-dessous, **en dernier** : `.github/workflows/complete-public-release.yml`. Ne pas tronquer son `content_utf8` ; vérifier taille et SHA-256 après l’envoi.
4. Attendre le job `Complete verified public mobile release`. Il reconstitue les 11 fichiers de retrait originaux dans l’ordre, vérifie les empreintes et exécute leur script inchangé. Il applique ensuite les trois corrections revues ci-dessous, nettoie les transports temporaires, exécute les tests et ne pousse le commit qu’après réussite.
5. Lire l’artefact `public-release-proof` : `validation_pending` doit être `false`, avec 26 sources mobiles contrôlées, 32 états de retrait, 3 corrections et le SHA du commit poussé. Un artefact intermédiaire avec `validation_pending: true` ne suffit pas.
6. Appliquer via l’API les trois petites réparations YAML présentées plus bas. Supprimer via l’API `.github/workflows/complete-public-release.yml` et, s’il existe, `.github/workflows/retire-polylia.yml`. Le runner ne modifie aucun fichier de workflow.
7. Ouvrir une **nouvelle PR** vers `main`, attendre les checks requis, fusionner par commit normal, puis attendre `static.yml` vert. Une réussite du bootstrap n’est pas encore une publication Pages.
8. Contrôler la version publique, ses 97 routes, ses PNG et son lien/QR GitHub. Conserver `lia_live_trading: false`. Le référencement xPortal et la connexion sur appareil réel restent des validations distinctes.

Les écritures GitHub de Codex retournent 403. Aucun push de code, merge ou dispatch de workflow n’a été réalisé par Codex. Cette page fournit une reprise concrète pour les outils GitHub authentifiés de Grok, sans ZIP et sans demande de token dans la conversation.

### Bootstrap à publier — un seul fichier

```json
{
  "format": "xartists-release-bootstrap-v1",
  "repository": "Neltud/xArtists",
  "branch": "feat/dapp-mobile-transport",
  "remote": ".github/workflows/complete-public-release.yml",
  "sha256": "1646a29966a32d423e69311415d3ed3d53ba4c0d342b8496943432d63e6c0742",
  "size_bytes": 4030,
  "content_utf8": "name: Complete verified public mobile release\non:\n  push:\n    branches: ['feat/dapp-mobile-transport']\n    paths: ['.github/workflows/complete-public-release.yml']\n  workflow_dispatch:\npermissions:\n  contents: read\nconcurrency:\n  group: dapp-mobile-completion\n  cancel-in-progress: false\njobs:\n  complete:\n    if: github.repository == 'Neltud/xArtists' && github.ref == 'refs/heads/feat/dapp-mobile-transport'\n    runs-on: ubuntu-latest\n    timeout-minutes: 30\n    permissions:\n      contents: write\n    env:\n      NODE_OPTIONS: --max-old-space-size=4096\n      VITE_LIA_LIVE_TRADING: '0'\n      VITE_PAYBOX_ENABLED: 'false'\n    steps:\n      - uses: actions/checkout@v4\n        with:\n          ref: ${{ github.sha }}\n          fetch-depth: 0\n      - name: Apply pinned retirement and follow-up fixes\n        run: |\n          python - --proof \"$RUNNER_TEMP/public-release-proof.json\" <<'PY'\n          import hashlib,re,subprocess\n          subprocess.run(['git','fetch','origin','main'],check=True)\n          path='docs/prompts/grok-dapp-mobile-2026-10-25/finaliser-release-publique.md'\n          md=subprocess.check_output(['git','show','FETCH_HEAD:'+path],text=True)\n          blocks=[b.rstrip('\\n')+'\\n' for _,b in re.findall(r'^(`{3,})python[^\\n]*\\n([\\s\\S]*?)^\\1[ \\t]*$',md,re.M)]\n          code=next(b for b in blocks if hashlib.sha256(b.encode()).hexdigest()=='f4aad720186c6bf7014353554182cec2419a211ccc121a4e75425b5d9bcaa0cb')\n          exec(compile(code,'complete_public_release.py','exec'),{'__name__':'__main__'})\n          PY\n      - uses: actions/setup-node@v4\n        with:\n          node-version: 20\n      - name: Install locked dependencies\n        run: |\n          npm --prefix apps/frontend ci --legacy-peer-deps\n          npm --prefix services/access-api ci --ignore-scripts\n      - name: Run release, rendering and paper checks\n        run: |\n          npm --prefix apps/frontend run test:release\n          node --test services/access-api/tests/*.test.mjs\n          LIA_LIVE_TRADING=0 python -m unittest discover -s tests/regression -p test_paybox_release.py -v\n          cd apps/frontend\n          npm run check:routes\n          npm run verify:site\n          npm run render:check\n          node scripts/run-render-check.mjs modules\n          node scripts/run-render-check.mjs mobile\n          npm run build\n          python -c 'import json; p=json.load(open(\"dist/dapp-release.json\")); assert p[\"lia_live_trading\"] is False; assert len(p[\"routes\"])==97; assert not any(\"polylia\" in r.lower() for r in p[\"routes\"])'\n      - name: Commit and push checked sources without force\n        run: |\n          git diff --exit-code\n          if ! git diff --cached --quiet; then\n            git -c user.name='github-actions[bot]' -c user.email='41898282+github-actions[bot]@users.noreply.github.com' commit -m 'fix(release): retire obsolete module and unblock mobile Pages'\n          fi\n          GITHUB_SHA=\"$(git rev-parse HEAD)\" node --input-type=module -e \"process.chdir('apps/frontend'); await import(process.cwd()+'/scripts/write-build-info.mjs')\"\n          npm --prefix apps/frontend run verify:site\n          git fetch origin refs/heads/feat/dapp-mobile-transport\n          test \"$(git rev-parse FETCH_HEAD)\" = \"$GITHUB_SHA\" || { echo 'Branch advanced; reconcile before retrying.'; exit 1; }\n          git push origin HEAD:refs/heads/feat/dapp-mobile-transport\n          python - <<'PY'\n          import json,os,subprocess\n          from pathlib import Path\n          p=Path(os.environ['RUNNER_TEMP'])/'public-release-proof.json'\n          j=json.loads(p.read_text());j['validation_pending']=False;j['source_commit']=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()\n          p.write_text(json.dumps(j,indent=2)+'\\n')\n          PY\n          echo \"Verified release source: $(git rev-parse HEAD)\" >> \"$GITHUB_STEP_SUMMARY\"\n      - uses: actions/upload-artifact@v4\n        if: always()\n        with:\n          name: public-release-proof\n          path: ${{ runner.temp }}/public-release-proof.json\n"
}
```

### Script revu chargé par le bootstrap

Le bootstrap ne lance ce code que si son SHA-256 est exactement `f4aad720186c6bf7014353554182cec2419a211ccc121a4e75425b5d9bcaa0cb`. Les contenus de retrait et de correction sont eux aussi vérifiés avant toute copie. Une divergence de source arrête l’opération ; ne pas l’écraser pour forcer le passage.

```python
import argparse, base64, gzip, hashlib, json, os, re, shutil, subprocess, sys
from pathlib import Path, PurePosixPath

BRANCH = 'feat/dapp-mobile-transport'
PAGE = 'docs/prompts/grok-dapp-mobile-2026-10-25/finaliser-release-publique.md'
RETIRE_PAGE = 'docs/prompts/grok-dapp-mobile-2026-10-25/retirer-polylia-greensmoke.md'
RETIRE_JSON_SHA = 'bfcc07918f6737ad758e7276c6d98098c69ca5c6c03d1b6f1780347ca8858f10'
FOLLOWUP_SHA = 'b7647d821d239786379562d1c34e016852d6bcb307db15eeab3132c226e72121'
ARCHIVE_SHA = '8bfe8ca472e0537812b13224ba6f591aabfeaf329e800575cf9fd8c524a202cb'
PREFIX = 'docs/transports/retire-polylia-2026-10-25/'
MOBILE_PREFIX = 'docs/transports/dapp-mobile-2026-10-25/'
WORKFLOW = '.github/workflows/retire-polylia.yml'
FOLLOWUP_PATHS = {
    'apps/frontend/src/pages/DappAccessPage.tsx',
    'apps/frontend/src/pwa/installPrompt.ts',
    'apps/frontend/tests/availability.test.mjs',
}

def sha(data):
    return hashlib.sha256(data).hexdigest()

def git(*args):
    return subprocess.check_output(['git', *args], text=True).strip()

def read_payload(ref, path, kind, digest):
    md = git('show', ref + ':' + path)
    blocks = re.findall(r'^(`{3,})json[^\n]*\n([\s\S]*?)^\1[ \t]*$', md, re.M)
    objects = [json.loads(body) for _, body in blocks if kind in body]
    assert len(objects) == 1, 'Expected one payload in ' + path
    value = objects[0]
    assert value['format'] == kind
    assert sha(json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode()) == digest, 'Reviewed GitBook payload changed'
    return value

def safe_file(root, name):
    rel = PurePosixPath(name)
    assert not rel.is_absolute() and '..' not in rel.parts
    target = root.joinpath(*rel.parts)
    target.resolve().relative_to(root)
    assert not target.is_symlink(), 'Symlink target: ' + name
    return target

def current_sha(root, name):
    p = safe_file(root, name)
    return sha(p.read_bytes()) if p.exists() else None

def main():
    p = argparse.ArgumentParser()
    p.add_argument('--docs-ref', default='FETCH_HEAD')
    p.add_argument('--proof', required=True, type=Path)
    args = p.parse_args()
    assert os.environ.get('GITHUB_REPOSITORY') == 'Neltud/xArtists'
    assert os.environ.get('GITHUB_REF') == 'refs/heads/' + BRANCH
    assert git('rev-parse', 'HEAD') == os.environ.get('GITHUB_SHA'), 'Checkout mismatch'
    assert not git('status', '--porcelain', '--untracked-files=no'), 'Tracked tree is not clean'
    assert not Path('.github/workflows/import-dapp-mobile.yml').exists(), 'Finish import cleanup first'
    root = Path.cwd().resolve()
    follow = read_payload(args.docs_ref, PAGE, 'xartists-public-release-followups-v1', FOLLOWUP_SHA)
    retire = read_payload(args.docs_ref, RETIRE_PAGE, 'xartists-retirement-api-files-v1', RETIRE_JSON_SHA)
    assert follow['repository'] == retire['repository'] == 'Neltud/xArtists'
    operations = retire['operations']
    assert len(operations) == 11 and [r['sequence'] for r in operations] == list(range(1, 12))
    assert operations[-1]['remote'] == WORKFLOW
    owned = {f'part-{i:03d}.b64' for i in range(1, 8)} | {'transport.json', 'FILES.txt', 'apply_retirement.py'}
    directory = root / PREFIX
    if directory.exists():
        assert {f.relative_to(directory).as_posix() for f in directory.rglob('*') if f.is_file()} <= owned, 'Unknown retirement files'
    plan = []
    for row in operations:
        name = row['remote']
        assert row['operation'] == 'upsert'
        assert name == WORKFLOW or (name.startswith(PREFIX) and name[len(PREFIX):] in owned)
        data = row['content_utf8'].encode()
        assert len(data) == row['size_bytes'] and sha(data) == row['sha256']
        plan.append((safe_file(root, name), data))
    workflow_tracked = bool(git('ls-files', '--', WORKFLOW))
    if workflow_tracked:
        assert (root / WORKFLOW).read_bytes() == plan[-1][1], 'Reconcile the existing retirement workflow through the API'
    encoded = b''.join(r['content_utf8'].encode() for r in operations[:7])
    compressed = base64.b64decode(encoded, validate=True)
    assert sha(compressed) == ARCHIVE_SHA
    source_rows = json.loads(gzip.decompress(compressed))['files']
    assert len(source_rows) == 32
    retired = {r['path']: r for r in source_rows}
    patches = follow['files']
    assert {r['path'] for r in patches} == FOLLOWUP_PATHS and len(patches) == 3
    patch_by_path = {r['path']: r for r in patches}
    assert len(follow['mobile_sources']) == 26
    for row in follow['mobile_sources']:
        allowed = {row['sha256']}
        if row['path'] in retired:
            allowed.add(retired[row['path']]['sha256'])
        if row['path'] in patch_by_path:
            allowed.add(patch_by_path[row['path']]['sha256'])
        assert current_sha(root, row['path']) in allowed, 'Mobile source drift: ' + row['path']
    for target, data in plan:
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)
    # All eleven original files are restored in order; the original workflow is last.
    retirement_proof = args.proof.with_name('retire-polylia-proof.json')
    subprocess.run([sys.executable, str(directory / 'apply_retirement.py'), '--proof', str(retirement_proof)], check=True)
    for row in source_rows:
        assert current_sha(root, row['path']) == row['sha256']
    for row in patches:
        target = safe_file(root, row['path'])
        assert current_sha(root, row['path']) in {row['before_sha256'], row['sha256']}, 'Follow-up source drift'
        data = row['content_utf8'].encode()
        assert len(data) == row['size_bytes'] and sha(data) == row['sha256']
        target.write_bytes(data)
        assert current_sha(root, row['path']) == row['sha256']
    subprocess.run(['git', 'add', '--', *sorted(FOLLOWUP_PATHS)], check=True)
    removed = []
    for prefix, names in [
        (MOBILE_PREFIX, {f'part-{i:03d}.b64' for i in range(1, 35)} | {'transport.json', 'FILES.txt', 'restore.py'}),
        (PREFIX, owned),
    ]:
        tracked = git('ls-files', '--', prefix).splitlines()
        assert all(name.startswith(prefix) and name[len(prefix):] in names for name in tracked)
        if tracked:
            subprocess.run(['git', 'rm', '--', *tracked], check=True)
            removed.extend(tracked)
    if directory.exists():
        shutil.rmtree(directory)
    if not workflow_tracked:
        (root / WORKFLOW).unlink()
    allowed_staged = set(retired) | FOLLOWUP_PATHS | set(removed)
    staged = git('diff', '--cached', '--name-only').splitlines()
    assert set(staged) <= allowed_staged and not any(name.startswith('.github/') for name in staged), 'Unexpected staged path'
    assert not git('diff', '--name-only'), 'Unstaged tracked changes'
    proof = {
        'mobile_source_states_checked': 26,
        'retirement_source_states_verified': 32,
        'followup_sources_verified': 3,
        'temporary_transport_files_removed': len(removed),
        'retirement_archive_sha256': ARCHIVE_SHA,
        'expected_modules': 36, 'expected_aliases': 51, 'expected_routes': 97,
        'lia_live_trading': False, 'workflow_files_changed_by_runner': False,
        'files': [{'path': r['path'], 'sha256': r['sha256']} for r in source_rows + patches],
        'validation_pending': True,
    }
    args.proof.parent.mkdir(parents=True, exist_ok=True)
    args.proof.write_text(json.dumps(proof, indent=2) + '\n')
    print('Verified original mobile import, 32 retirement states and 3 release fixes; validation must pass before push.')

if __name__ == '__main__':
    main()

```

### Trois corrections après le retrait

Ce bloc contient le contenu complet des trois fichiers texte, leurs empreintes avant/après et les 26 empreintes de référence attestées par le runner. Le script applique seulement ces trois changements après la vérification des 32 états de retrait : lien GitHub indépendant du domaine de l’aperçu, protection de l’accès à `navigator`, et test qui reproduit son absence sur tous les runtimes.

```json
{
  "format": "xartists-public-release-followups-v1",
  "repository": "Neltud/xArtists",
  "base_main": "5ad168f5e8ac358dbdd3c675b51db0b5b63251bf",
  "mobile_sources": [
    {
      "path": ".github/workflows/static.yml",
      "sha256": "cd7045db6dff2a86c7d2762e9aba12976c56540791465859b1cbebd3082faa01"
    },
    {
      "path": "apps/frontend/index.html",
      "sha256": "67c90b3f835c5572db2567e570d7ea3656ed443e59079555ca92a9a3bfe7ac81"
    },
    {
      "path": "apps/frontend/public/icons/app-icon.svg",
      "sha256": "0b69da11f07b3e6253fd6be69db9c9c658c3ec535caac6b8d08062345ade214c"
    },
    {
      "path": "apps/frontend/public/icons/apple-touch-icon.png",
      "sha256": "1d32c08c9d0408c3522cd815cf80ad13f3ba197705040f24c51e2f5dddc101d0"
    },
    {
      "path": "apps/frontend/public/icons/icon-192.png",
      "sha256": "994ea8b4a9b42099077a72d7a6d32ccc4386b765bfd7f44e03cb3f8dadb5986e"
    },
    {
      "path": "apps/frontend/public/icons/icon-512.png",
      "sha256": "deeaa1b994929a8ebe25ffaae95668df566eb60af19a9669387e9ffb4526a819"
    },
    {
      "path": "apps/frontend/public/manifest.webmanifest",
      "sha256": "b3ab855183651b252d2b05753dc0fcdaf50b4ee67051a0686655502afbf1680a"
    },
    {
      "path": "apps/frontend/public/offline.html",
      "sha256": "d4ce9e9c2eac325c4254a3f4b745066e4ca04fa77e8dd6cdc8aad15687097139"
    },
    {
      "path": "apps/frontend/public/og-image.png",
      "sha256": "ebf66dc8d8dcb543dc605e30bfaf519205c6e4c07f7da4fca5927dd8a0554325"
    },
    {
      "path": "apps/frontend/public/service-worker.js",
      "sha256": "45690555f62dfc7d22fd988fa6512e2a9a89298057975641daf0ba2167056030"
    },
    {
      "path": "apps/frontend/public/xartists-logo.png",
      "sha256": "deeaa1b994929a8ebe25ffaae95668df566eb60af19a9669387e9ffb4526a819"
    },
    {
      "path": "apps/frontend/scripts/publicAvailability.mjs",
      "sha256": "5db5c51b58c4e9b648d8f24fbb1d57213e2f4b9ae627f52016e36164940e9bbb"
    },
    {
      "path": "apps/frontend/scripts/verify-site.mjs",
      "sha256": "463cac8b090f04da711e73f561e6dd1b9808898fad98a3b54ab7b6639fe68fc9"
    },
    {
      "path": "apps/frontend/scripts/write-build-info.mjs",
      "sha256": "ec0e03108176f86491868dff4ab34d58d7598af31c91ff8b0e3d5d3369eb108b"
    },
    {
      "path": "apps/frontend/src/experience/Pages.tsx",
      "sha256": "2ad4cceb442b55c728b5b310183ddb016940734fd038fa8fed1cb6c782657b40"
    },
    {
      "path": "apps/frontend/src/experience/Shell.tsx",
      "sha256": "21e21cd34fc86cbe23b21ccd2ecda5146c1d1d1336590d91e8e99aa1ee236aa5"
    },
    {
      "path": "apps/frontend/src/experience/experience.css",
      "sha256": "bd89234f923f77e0afc5b6a26834ddd433a66840cdd0003c2f8663100eb7c33e"
    },
    {
      "path": "apps/frontend/src/experience/locale.ts",
      "sha256": "01d38ae886d071eca9a59084fb5112bc81217873738e951ef0d4a2e799e29f9a"
    },
    {
      "path": "apps/frontend/src/experience/modules.ts",
      "sha256": "e27b4482c3fc6218f35875e05f4297d2e03616547d42b400ca353c09e5870296"
    },
    {
      "path": "apps/frontend/src/lib/publicRoutes.ts",
      "sha256": "4b8513877008ec388f2c8f1c3bf7b3390d001b0d14eb72de6720593ee3e685db"
    },
    {
      "path": "apps/frontend/src/main.tsx",
      "sha256": "6bd7abff06bea2a0ae8eee035dd4471177f3de2bc8b267e8bdef5df5861a0b3f"
    },
    {
      "path": "apps/frontend/src/pages/DappAccessPage.tsx",
      "sha256": "f0db017a92ab28c82376da5ea137699bafa093a7852a27a82f974263eac67c6c"
    },
    {
      "path": "apps/frontend/src/pwa/installPrompt.ts",
      "sha256": "7274634c135b1f2293759f03cc9484ff58f7ee1d4a3dda47d1b75a66c5b7add9"
    },
    {
      "path": "apps/frontend/src/pwa/registerSW.ts",
      "sha256": "15b14bdc31f2075ba0b56fb7bb3f1ef25a78d523c3c43bc63e8c56f57593c24f"
    },
    {
      "path": "apps/frontend/tests/availability.test.mjs",
      "sha256": "85b02c6116c6ee3478a306f09de093db915a5dd30b6d34605ed06f0f69c98168"
    },
    {
      "path": "apps/frontend/vite.config.ts",
      "sha256": "6ebce969b33f9dd34e71096498795a4226e8278edb836d799b1fada4192d5aef"
    }
  ],
  "files": [
    {
      "path": "apps/frontend/src/pages/DappAccessPage.tsx",
      "before_sha256": "f0db017a92ab28c82376da5ea137699bafa093a7852a27a82f974263eac67c6c",
      "sha256": "c429b9b1542c40236452f0e79ad65ad19dc47f3aff649dda4587a8c6222b9680",
      "size_bytes": 5053,
      "content_utf8": "import { useEffect, useState, useSyncExternalStore } from 'react'\nimport { Link } from 'react-router-dom'\nimport { useCopy } from '../experience/state'\nimport Icon from '../experience/Icon'\nimport { useI18n } from '../i18n/I18nContext'\nimport { requestOpenConnect } from '../lib/walletEvents'\nimport { getInstallStatus, getServerInstallStatus, subscribeInstall, installDapp } from '../pwa/installPrompt'\n\n/** One public link to explore, install, or connect from desktop and mobile. */\nexport default function DappAccessPage() {\n  const c = useCopy()\n  const { lang } = useI18n()\n  const installed = useSyncExternalStore(subscribeInstall, getInstallStatus, getServerInstallStatus)\n  const [url, setUrl] = useState('')\n  const [qr, setQr] = useState('')\n  const [qrFailed, setQrFailed] = useState(false)\n  const [copied, setCopied] = useState(false)\n  const [error, setError] = useState(false)\n  const [online, setOnline] = useState(true)\n  const [ios, setIos] = useState(false)\n  const [busy, setBusy] = useState(false)\n  useEffect(() => {\n    const link = new URL('https://neltud.github.io/xArtists/')\n    link.searchParams.set('lang', lang)\n    setUrl(link.href)\n    let current = true\n    import('qrcode').then(q => q.toDataURL(link.href, { width: 256, margin: 2, color: { dark: '#10120f', light: '#ffffff' } }))\n      .then(value => { if (current) setQr(value) })\n      .catch(() => { if (current) setQrFailed(true) })\n    setIos(/iPhone|iPad|iPod/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1))\n    const network = () => setOnline(navigator.onLine)\n    network()\n    window.addEventListener('online', network)\n    window.addEventListener('offline', network)\n    return () => { current = false; window.removeEventListener('online', network); window.removeEventListener('offline', network) }\n  }, [lang])\n  const copy = async () => {\n    setError(false)\n    try { await navigator.clipboard.writeText(url); setCopied(true) }\n    catch { setError(true); document.getElementById('xa-app-link')?.focus() }\n  }\n  const share = async () => {\n    setError(false)\n    try {\n      if (navigator.share) await navigator.share({ title: 'xArtists', url })\n      else await copy()\n    } catch (reason) {\n      if (!(reason instanceof Error) || reason.name !== 'AbortError') await copy()\n    }\n  }\n  const install = async () => {\n    setBusy(true); setError(false)\n    try { await installDapp() } catch { setError(true) } finally { setBusy(false) }\n  }\n  return <div className=\"xa-access\">\n    <div className=\"xa-access-intro\"><p>{c('accessLead')}</p></div>\n    {!online && <p className=\"xa-access-notice\" role=\"status\">{c('accessOffline')}</p>}\n    <div className=\"xa-access-grid\">\n      <section className=\"xa-access-card\"><span className=\"xa-module-icon\"><Icon name=\"globe\" size={25}/></span><h2>{c('accessBrowser')}</h2><p>{c('accessBrowserLead')}</p><Link className=\"xa-button primary\" to=\"/explore\">{c('explore')}<Icon name=\"arrow\" size={17}/></Link></section>\n      <section className=\"xa-access-card\"><span className=\"xa-module-icon\"><Icon name=\"wallet\" size={25}/></span><h2>xPortal</h2><p>{c('accessXportalLead')}</p><button type=\"button\" className=\"xa-button secondary\" onClick={requestOpenConnect} disabled={!online}>{c('connect')}<Icon name=\"wallet\" size={17}/></button></section>\n      <section className=\"xa-access-card\"><span className=\"xa-module-icon\"><Icon name=\"create\" size={25}/></span><h2>{c(installed === 'installed' ? 'accessInstalled' : 'accessInstall')}</h2><p>{c(ios ? 'accessIos' : 'accessManual')}</p>{installed === 'ready' && <button type=\"button\" className=\"xa-button secondary\" onClick={() => void install()} disabled={busy}>{c('accessInstall')}<Icon name=\"arrow\" size={17}/></button>}{installed === 'installed' && <span className=\"xa-small-badge\"><Icon name=\"check\" size={16}/>{c('accessInstalled')}</span>}</section>\n    </div>\n    <section className=\"xa-access-share\"><div><div className=\"xa-eyebrow\">iOS / Android / Desktop</div><h2>{c('accessShare')}</h2><p>{c('accessQr')}</p><label htmlFor=\"xa-app-link\" className=\"sr-only\">{c('accessCopy')}</label><input id=\"xa-app-link\" readOnly value={url} onFocus={event => event.currentTarget.select()}/><div className=\"xa-access-actions\"><button type=\"button\" className=\"xa-button primary\" disabled={!url} onClick={() => void share()}>{c('accessShare')}<Icon name=\"external\" size={16}/></button><button type=\"button\" className=\"xa-button secondary\" disabled={!url} onClick={() => void copy()}>{c(copied ? 'accessCopied' : 'accessCopy')}<Icon name={copied ? 'check' : 'layers'} size={16}/></button></div><p className=\"xa-access-feedback\" role=\"status\">{error ? c('accessActionFailed') : copied ? c('accessCopied') : ''}</p></div><div className=\"xa-access-qr\">{qr ? <img src={qr} width={220} height={220} alt={c('accessQr')}/> : qrFailed ? <span>{c('accessQrUnavailable')}</span> : <span className=\"xa-loader\"/>}</div></section>\n    <p className=\"xa-access-safety\"><Icon name=\"shield\" size={18}/>{c('accessSignature')}</p>\n  </div>\n}\n"
    },
    {
      "path": "apps/frontend/src/pwa/installPrompt.ts",
      "before_sha256": "7274634c135b1f2293759f03cc9484ff58f7ee1d4a3dda47d1b75a66c5b7add9",
      "sha256": "e2736f48914dfe6167ed20558bca6039ea1f9e1054e1f792f0e68a755c479296",
      "size_bytes": 1686,
      "content_utf8": "type InstallEvent = Event & {\n  prompt: () => Promise<void>\n  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>\n}\nexport type InstallStatus = 'unavailable' | 'ready' | 'installed'\nlet prompt: InstallEvent | null = null\nlet status: InstallStatus = 'unavailable'\nlet listening = false\nconst subscribers = new Set<() => void>()\nfunction publish(next: InstallStatus) {\n  status = next\n  for (const notify of subscribers) notify()\n}\nexport function watchInstallPrompt(): void {\n  if (listening || typeof window === 'undefined') return\n  listening = true\n  const standalone = window.matchMedia?.('(display-mode: standalone)')\n  const update = () => {\n    const iosStandalone = typeof navigator !== 'undefined' && (navigator as Navigator & { standalone?: boolean }).standalone\n    if (standalone?.matches || iosStandalone) publish('installed')\n  }\n  update()\n  standalone?.addEventListener?.('change', update)\n  window.addEventListener('beforeinstallprompt', event => {\n    event.preventDefault()\n    prompt = event as InstallEvent\n    publish('ready')\n  })\n  window.addEventListener('appinstalled', () => {\n    prompt = null\n    publish('installed')\n  })\n}\nexport const getInstallStatus = () => status\nexport const getServerInstallStatus = (): InstallStatus => 'unavailable'\nexport function subscribeInstall(notify: () => void) {\n  subscribers.add(notify)\n  return () => { subscribers.delete(notify) }\n}\nexport async function installDapp(): Promise<void> {\n  const pending = prompt\n  if (!pending) return\n  prompt = null\n  publish('unavailable')\n  await pending.prompt()\n  await pending.userChoice\n  // Only appinstalled / display-mode confirm that installation actually happened.\n}\n"
    },
    {
      "path": "apps/frontend/tests/availability.test.mjs",
      "before_sha256": "85b02c6116c6ee3478a306f09de093db915a5dd30b6d34605ed06f0f69c98168",
      "sha256": "e5b7fc6e8f216790587212bf8a56bf0bf316c307442eadcf81b4f1f24630fa38",
      "size_bytes": 9384,
      "content_utf8": "import test from 'node:test'\nimport assert from 'node:assert/strict'\nimport fs from 'node:fs/promises'\nimport path from 'node:path'\nimport vm from 'node:vm'\nimport { loadSource, frontend } from './load-source.mjs'\nimport { fallbackHtml, publicRoutes, publicAvailabilityPlugin } from '../scripts/publicAvailability.mjs'\n\ntest('Pages and legacy hash links restore the destination, query and fragment without leaving the app', () => {\n  const { restoredPublicUrl, normalizePublicPath } = loadSource('src/lib/publicRoutes.ts')\n  assert.equal(normalizePublicPath('/app/'), '/app')\n  assert.equal(normalizePublicPath('/workspace/wallet/'), '/workspace/wallet')\n  assert.equal(normalizePublicPath('/'), '/')\n  const origin = 'https://example.com', base = '/xArtists/'\n  const original = '/xArtists/explore/artwork/XAR-abc-01?lang=fr&label=%C3%A9#details'\n  assert.equal(restoredPublicUrl(`${origin}${base}?_xa_route=${encodeURIComponent(original)}`, base), original)\n  assert.equal(restoredPublicUrl(`${origin}${base}?lang=en#/wallet?tab=nft#items`, base), '/xArtists/wallet?tab=nft&lang=en#items')\n  assert.equal(restoredPublicUrl(`${origin}${base}#/explore/museum`, base), '/xArtists/explore/museum')\n  assert.equal(restoredPublicUrl(`${origin}${base}workspace/wallet`, base), null)\n  for (const target of ['https://evil.example/xArtists/', '//evil.example/xArtists/', '/xArtists-evil/app', '/xArtists/../other/', '/xArtists/assets/private.js', 'javascript:alert(1)']) {\n    assert.equal(restoredPublicUrl(`${origin}${base}?_xa_route=${encodeURIComponent(target)}`, base), null, target)\n  }\n})\n\ntest('the emitted 404 redirect round-trips an artwork URL including wallet callback parameters', () => {\n  const location = { pathname: '/xArtists/explore/artwork/XAR-01', search: '?lang=fr&address=erd1fixture', hash: '#details', replace(value) { this.replacement = value } }\n  vm.runInNewContext(fallbackHtml('/xArtists/').match(/<script>([\\s\\S]+)<\\/script>/)[1], { location })\n  const redirected = new URL(location.replacement, 'https://example.com')\n  assert.equal(redirected.pathname, '/xArtists/')\n  assert.equal(redirected.searchParams.get('_xa_route'), location.pathname + location.search + location.hash)\n})\n\ntest('every canonical route and alias is emitted as real HTML, including mobile entry points', async () => {\n  const routes = publicRoutes(await fs.readFile(path.join(frontend, 'src/experience/modules.ts'), 'utf8'))\n  for (const required of ['/app', '/install', '/mobile', '/workspace/wallet', '/wallet', '/explore/museum', '/museum']) assert(routes.includes(required), required)\n  assert.equal(new Set(routes).size, routes.length)\n  const runtime = path.join(frontend, '.sites-runtime')\n  await fs.mkdir(runtime, { recursive: true })\n  const root = await fs.mkdtemp(path.join(runtime, 'availability-'))\n  try {\n    await fs.mkdir(path.join(root, 'src/experience'), { recursive: true })\n    await fs.writeFile(path.join(root, 'src/experience/modules.ts'), \"module('wallet','/workspace/wallet',['/wallet'])\")\n    await fs.mkdir(path.join(root, 'dist'))\n    const html = '<html>sites-v3-release</html>'\n    await fs.writeFile(path.join(root, 'dist/index.html'), html)\n    const plugin = publicAvailabilityPlugin()\n    plugin.configResolved({ root, build: { outDir: 'dist' }, base: '/xArtists/', env: { VITE_LIA_LIVE_TRADING: '0' } })\n    await plugin.closeBundle()\n    assert.equal(await fs.readFile(path.join(root, 'dist/workspace/wallet/index.html'), 'utf8'), html)\n    assert.equal(await fs.readFile(path.join(root, 'dist/wallet/index.html'), 'utf8'), html)\n    assert((await fs.readFile(path.join(root, 'dist/404.html'), 'utf8')).includes('_xa_route'))\n    assert.equal(JSON.parse(await fs.readFile(path.join(root, 'dist/dapp-release.json'), 'utf8')).lia_live_trading, false)\n  } finally { await fs.rm(root, { recursive: true, force: true }) }\n})\n\ntest('PWA manifest declares real PNG dimensions and keeps shortcuts inside its scope', async () => {\n  const manifest = JSON.parse(await fs.readFile(path.join(frontend, 'public/manifest.webmanifest'), 'utf8'))\n  assert.equal(manifest.id, '/xArtists/')\n  assert.equal(manifest.start_url, manifest.scope)\n  for (const icon of manifest.icons) {\n    const bytes = await fs.readFile(path.join(frontend, 'public', icon.src.replace('/xArtists/', '')))\n    assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a')\n    assert.equal(`${bytes.readUInt32BE(16)}x${bytes.readUInt32BE(20)}`, icon.sizes)\n  }\n  for (const shortcut of manifest.shortcuts) assert(shortcut.url.startsWith(manifest.scope))\n  const apple = await fs.readFile(path.join(frontend, 'public/icons/apple-touch-icon.png'))\n  assert.equal(apple.readUInt32BE(16), 180)\n  const metadataIcon = await fs.readFile(path.join(frontend, 'public/xartists-logo.png'))\n  assert.equal(metadataIcon.subarray(0, 8).toString('hex'), '89504e470d0a1a0a')\n})\n\ntest('an install prompt survives navigation, is used once, and is not reported installed before appinstalled', async () => {\n  const previousWindow = globalThis.window\n  const previousNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator')\n  const window = new EventTarget()\n  window.matchMedia = () => ({ matches: false, addEventListener() {} })\n  globalThis.window = window\n  delete globalThis.navigator\n  try {\n    const install = loadSource('src/pwa/installPrompt.ts')\n    install.watchInstallPrompt(); install.watchInstallPrompt()\n    let calls = 0\n    const event = new Event('beforeinstallprompt', { cancelable: true })\n    event.prompt = async () => { calls++ }\n    event.userChoice = Promise.resolve({ outcome: 'accepted' })\n    window.dispatchEvent(event)\n    assert(event.defaultPrevented)\n    assert.equal(install.getInstallStatus(), 'ready')\n    let notifications = 0\n    const unsubscribe = install.subscribeInstall(() => { notifications++ })\n    await Promise.all([install.installDapp(), install.installDapp()])\n    assert.equal(calls, 1)\n    assert.equal(install.getInstallStatus(), 'unavailable')\n    window.dispatchEvent(new Event('appinstalled'))\n    assert.equal(install.getInstallStatus(), 'installed')\n    assert.equal(notifications, 2)\n    unsubscribe()\n  } finally {\n    globalThis.window = previousWindow\n    if (previousNavigator) Object.defineProperty(globalThis, 'navigator', previousNavigator)\n    else delete globalThis.navigator\n  }\n})\n\nasync function serviceWorker() {\n  const handlers = {}, cached = [], removed = []\n  const context = {\n    URL, Response,\n    self: { location: { href: 'https://example.com/xArtists/service-worker.js' }, clients: { claim: async () => {} }, addEventListener: (name, handler) => { handlers[name] = handler } },\n    caches: { open: async () => ({ addAll: async () => {}, put: async (request) => { cached.push(request.url) } }), keys: async () => ['xartists-shell-v10', 'unrelated-app-cache'], delete: async key => { removed.push(key) }, match: async () => undefined },\n    fetch: async () => { throw Error('offline') },\n  }\n  vm.runInNewContext(await fs.readFile(path.join(frontend, 'public/service-worker.js'), 'utf8'), context)\n  const request = (pathname, extra = {}) => ({ url: 'https://example.com' + pathname, method: 'GET', mode: 'cors', destination: '', ...extra })\n  const send = async request => {\n    let response\n    const pending = []\n    handlers.fetch({ request, respondWith: promise => { response = promise }, waitUntil: promise => pending.push(promise) })\n    const result = await response\n    await Promise.all(pending)\n    return result\n  }\n  return { handlers, context, cached, removed, request, send }\n}\n\ntest('service worker leaves wallets, payments, prices and other apps on the network', async () => {\n  const sw = await serviceWorker()\n  for (const path of ['/xArtists/api/paybox/orders', '/xArtists/data/prices.json', '/xArtists/build-info.json', '/xArtists/dapp-release.json', '/another-app/assets/main.js']) {\n    assert.equal(await sw.send(sw.request(path)), undefined, path)\n  }\n  assert.equal(await sw.send(sw.request('/xArtists/api/orders', { method: 'POST' })), undefined)\n  assert.deepEqual(sw.cached, [])\n  const pending = []\n  sw.handlers.activate({ waitUntil: promise => pending.push(promise) })\n  await Promise.all(pending)\n  assert.deepEqual(sw.removed, ['xartists-shell-v10'])\n})\n\ntest('missing JS never receives HTML, offline navigation is explicit, and failed responses are not cached', async () => {\n  const sw = await serviceWorker()\n  const response = await sw.send(sw.request('/xArtists/assets/missing.js', { destination: 'script' }))\n  assert.equal(response.type, 'error')\n  sw.context.caches.match = async key => String(key).endsWith('/offline.html') ? new Response('Explicit offline page') : undefined\n  assert.equal(await (await sw.send(sw.request('/xArtists/app/', { mode: 'navigate' }))).text(), 'Explicit offline page')\n  sw.context.fetch = async () => new Response('Not found', { status: 404 })\n  assert.equal((await sw.send(sw.request('/xArtists/assets/missing.js', { destination: 'script' }))).status, 404)\n  assert.deepEqual(sw.cached, [])\n  sw.context.fetch = async () => {\n    const result = new Response('javascript')\n    Object.defineProperty(result, 'type', { value: 'basic' })\n    return result\n  }\n  await sw.send(sw.request('/xArtists/assets/app-hashed.js', { destination: 'script' }))\n  assert.deepEqual(sw.cached, ['https://example.com/xArtists/assets/app-hashed.js'])\n})\n"
    }
  ]
}
```

### Trois réparations YAML via l’API GitHub

Les deux anciens workflows de déploiement ont une valeur `run` non citée contenant `:` . Le workflow de collections a deux blocs Python mal indentés. Le diff ci-dessous ne change que leur syntaxe. Les trois restent **uniquement `workflow_dispatch`**. Ne pas lancer le workflow de collections pour vérifier sa syntaxe.

Leur version complète et les empreintes avant/après sont également conservées dans [Sortie officielle](sortie-officielle.md). Lire le blob courant, appliquer ces différences en conservant les autres lignes, puis écrire avec son SHA courant.

```diff
diff --git a/.github/workflows/deploy-exclusive.yml b/.github/workflows/deploy-exclusive.yml
index 52e5f6fb..898860f1 100644
--- a/.github/workflows/deploy-exclusive.yml
+++ b/.github/workflows/deploy-exclusive.yml
@@ -6,4 +6,5 @@ jobs:
   notice:
     runs-on: ubuntu-latest
     steps:
-      - run: echo "Deprecated. Canonical: static.yml"
+      - run: |
+          echo "Deprecated. Canonical: static.yml"
diff --git a/.github/workflows/deploy-frontend.yml b/.github/workflows/deploy-frontend.yml
index 1e20e4bb..466bde36 100644
--- a/.github/workflows/deploy-frontend.yml
+++ b/.github/workflows/deploy-frontend.yml
@@ -6,4 +6,5 @@ jobs:
   notice:
     runs-on: ubuntu-latest
     steps:
-      - run: echo "Deprecated. Canonical: .github/workflows/static.yml"
+      - run: |
+          echo "Deprecated. Canonical: .github/workflows/static.yml"
diff --git a/.github/workflows/issue-agent-pack-collections.yml b/.github/workflows/issue-agent-pack-collections.yml
index aceffbe0..29addf97 100644
--- a/.github/workflows/issue-agent-pack-collections.yml
+++ b/.github/workflows/issue-agent-pack-collections.yml
@@ -146,23 +146,23 @@ jobs:
             echo "issue_tx_$TICKER=${HASH:-none}"
             sleep 8
             TOKEN=$(curl -sS "${API}/accounts/${DEPLOYER}/tokens?size=50" | python3 -c "
-import sys,json
-tick='${TICKER}'.upper()
-items=json.load(sys.stdin)
-if not isinstance(items,list): items=[]
-for t in items:
-  c=(t.get('identifier') or t.get('ticker') or '')
-  if c.upper().startswith(tick+'-') or c.upper()==tick:
-    print(t.get('identifier') or c); break
-" || true)
+          import sys,json
+          tick='${TICKER}'.upper()
+          items=json.load(sys.stdin)
+          if not isinstance(items,list): items=[]
+          for t in items:
+            c=(t.get('identifier') or t.get('ticker') or '')
+            if c.upper().startswith(tick+'-') or c.upper()==tick:
+              print(t.get('identifier') or c); break
+          " || true)
             if [ -z "$TOKEN" ] && [ -n "$HASH" ]; then
               TOKEN=$(curl -sS "${API}/transactions/${HASH}?withResults=true" | python3 -c "
-import sys,json,re
-d=json.load(sys.stdin)
-blob=json.dumps(d)
-m=re.findall(r'${TICKER}-[a-f0-9]{6}', blob, re.I)
-print(m[0] if m else '')
-" || true)
+          import sys,json,re
+          d=json.load(sys.stdin)
+          blob=json.dumps(d)
+          m=re.findall(r'${TICKER}-[a-f0-9]{6}', blob, re.I)
+          print(m[0] if m else '')
+          " || true)
             fi
             echo "resolved_$TICKER=${TOKEN}"
             if [ -z "$TOKEN" ]; then

```

### Validation locale et publication restante

Le candidat complet a été reconstruit depuis le `main` réellement fusionné. Les tests API utilisent des fixtures et un serveur local ; aucun paiement ni broadcast blockchain n’a été réalisé. Le build est terminé avec `VITE_LIA_LIVE_TRADING=0`, `VITE_PAYBOX_ENABLED=false` et une limite mémoire de 4 Go. La vérification finale Pages doit porter sur la version effectivement déployée et le SHA source du run Pages réussi.

```json
{
  "validation_scope": "local candidate; not an official deployment",
  "base_main": "5ad168f5e8ac358dbdd3c675b51db0b5b63251bf",
  "candidate_local": "f73da6393eebe2a4fdcf27e4c37455ee21a10968",
  "mobile_runner_run": "https://github.com/Neltud/xArtists/actions/runs/40208500324",
  "mobile_import_sources_verified": 26,
  "retirement_source_states_verified": 32,
  "frontend_tests": 22,
  "access_api_tests": 27,
  "python_regressions": 7,
  "interface_renders": 64,
  "module_renders": 288,
  "locales": 8,
  "modules": 36,
  "aliases": 51,
  "routes": 97,
  "lia_live_trading": false,
  "github_code_pushed_by_codex": false,
  "pages_current_state": "old build; mobile direct links return 404; deployment 40214350895 fails on missing navigator",
  "node20_failure_reproduced_with": "NODE_OPTIONS=--no-experimental-global-navigator npm run test:release",
  "fix_verified": true
}
```

Pour la vérification HTTP, réutiliser `verify_public_release.py` dans la page Sortie officielle avec le SHA source du run Pages déployé. Il doit vérifier les pages, les bundles, le manifeste, les PNG, `build-info.json`, `dapp-release.json`, les 97 routes et le flag LIA désactivé. L’URL publique à présenter ou référencer est **https://neltud.github.io/xArtists/** ; la présentation du projet est **https://xartists.gitbook.io/xartists/presentation**.

### Simulation du bootstrap

Le chargement du script par son empreinte, l’application des onze fichiers d’origine et les trois corrections ont été simulés à partir du `main` réel. Les sources frontend résultantes sont identiques au candidat testé. Une seconde exécution vérifie l’idempotence. Seule la lecture Git des documents a utilisé une fixture locale pendant la simulation ; aucun push GitHub n’a été effectué.

```json
{
  "simulation_only": true,
  "first_run_removed_mobile_transport_files": 37,
  "retirement_states": 32,
  "followup_sources": 3,
  "loader_sha_verified": true,
  "idempotence_verified": true,
  "frontend_matches_tested_candidate": true,
  "github_push_performed": false,
  "public_pages_verified": false
}
```

### Nouvelle PR — texte prêt à compléter avec les preuves distantes

Titre : **fix(release): finaliser la dapp mobile et débloquer Pages**

Le déploiement Pages échouait avant le build lorsque l’installateur PWA accédait à un `navigator` absent sous Node 20. Ce changement protège cet accès et conserve une régression qui reproduit son absence, retire le module polyLIA/GreenSmoke, fixe le lien de partage sur GitHub Pages et corrige la syntaxe de trois workflows manuels.

Validation locale : 22 tests frontend, 27 tests d’API, 7 tests Python, 64 rendus d’interface, 288 rendus de modules, 8 langues ; 36 modules, 51 alias et 97 routes ; build paper avec LIA live et PayBox désactivés. Ajouter le lien réel du job bootstrap, son commit et l’artefact `public-release-proof` avant la fusion. Le test global TypeScript n’est pas inclus dans cette preuve.

### Profil public pour le référencement ultérieur

Après publication Pages vérifiée et validation de la connexion sur un appareil réel, utiliser ce profil. Il remplace l’ancien lien `/app/` des fiches préparatoires : l’adresse publique à présenter reste la racine GitHub Pages.

```json
{
  "format": "xartists-listing-profile-v1",
  "name": "xArtists",
  "description": "Art, création, musée numérique et outils d’intelligence sur MultiversX.",
  "website": "https://neltud.github.io/xArtists/",
  "documentation": "https://xartists.gitbook.io/xartists/presentation",
  "repository": "https://github.com/Neltud/xArtists",
  "icon": "https://neltud.github.io/xArtists/icons/icon-512.png",
  "preview_image": "https://neltud.github.io/xArtists/og-image.png",
  "network": "MultiversX mainnet",
  "lia_live_trading": false,
  "catalogue_submission": "not submitted",
  "walletconnect_device_validation": "not attested",
  "ready_for_submission": false
}
```

Le dépôt d’une fiche dans un catalogue et la connexion WalletConnect sont des opérations distinctes. La [documentation MultiversX](https://docs.multiversx.com/sdk-and-tools/sdk-js/cookbook/wallets/walletconnect-login) prévoit un projet WalletConnect et un test dans l’application mobile. Cette connexion et un éventuel référencement ne sont pas attestés par un build paper.
