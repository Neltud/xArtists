---
hidden: true
noIndex: true
noRobotsIndex: true
---

# Transport vérifié — sans application

Transport autonome du sprint V2 : manifeste, exécuteur Python standard et paquet Git différentiel. Aucun jeton ni identifiant marchand réel n'est inclus. Le paquet suppose que les parents publics `2796316` et `05fe13b` sont récupérés depuis le dépôt.

Le SHA-256 du JSON canonique (clés triées, UTF-8, séparateurs `,` et `:`) est `e99cdd34ee2b5d1e2bab3fc3a858cd7bf09c58d1823fc8f128a2a9e8fdad0d20`.

L'exécuteur vérifie les sources et prépare un arbre dans un index temporaire. Il affiche le plan d'intégration et les deux parents proposés, sans créer de commit, fusionner ni pousser. Il ne modifie pas les fichiers ou l'index du checkout. Il relit main et la branche P0 avant et après ses vérifications. Les changements concurrents inconnus bloquent la reprise ; ils doivent être examinés et retestés, jamais contournés en élargissant les listes de SHA à l'aveugle.

Le protocole partagé par Nelson réserve à Grok l'écriture de `server.mjs`, `static.yml` et du workflow `issue-agent`. Ce transport est une proposition V2 à examiner après son réalignement V1. Il ne donne aucun ordre de copier ces sources sur ses chemins réservés. Toute intégration exige un GO humain explicite et une nouvelle attribution des chemins concernés.

Les changements de main autorisés depuis la base testée se limitent aux pages Markdown de documentation et aux deux fichiers quotidiens de signaux déjà identifiés. Tout changement de code de main arrête la reprise. Les 22 fichiers cibles sont vérifiés par taille, SHA-256 et blob Git.

```json
{
  "format": "xartists-pr188-transport/v2",
  "manifest": {
    "format": "xartists-pr188-sprint-v2",
    "repository": "Neltud/xArtists",
    "branch": "fix/p0-ipn-signed-binding-and-build",
    "expected_branch_head": "f457309f851d9ce5cdd3d41e4575e2ed54647927",
    "main_base_sha": "05fe13bacf5d041c281dc303521702aa5c0ec7bd",
    "main_base_tree": "6b0991b1bfaf821132851633df9ed95b326502af",
    "candidate_commit_local": "afeff287d93a1232ea110adb6f3f51e9ef152e1b",
    "candidate_tree": "7371204d22f6cb40695dc47c4037d15d98fa540c",
    "parents": [
      "2796316ca7d046d6c1be674ba421cbef260f1a52",
      "05fe13bacf5d041c281dc303521702aa5c0ec7bd"
    ],
    "files": [
      {
        "path": ".github/workflows/static.yml",
        "git_blob_sha": "f008a35ecac728bcc373e17fd89a276eef9f17dd",
        "sha256": "0adeb42eda771e7e697a17d4c5f8bfe0e34630a8a7f1d8baaf9faf877db2a7c1",
        "bytes": 5989,
        "expected_branch_blob_sha": "558d69e59392976b9c5c046ff6b32284124d46cb",
        "expected_main_blob_sha": "7633f0f6f85c93afd39106bccc70141f275a5d21",
        "requires_content": true,
        "accepted_branch_blob_shas": [
          "558d69e59392976b9c5c046ff6b32284124d46cb",
          "5bc9a32beddfddccfb8a111d6a3f2a8db69fffb5",
          "7633f0f6f85c93afd39106bccc70141f275a5d21",
          "f008a35ecac728bcc373e17fd89a276eef9f17dd"
        ]
      },
      {
        "path": "apps/frontend/src/components/CheckoutModal.tsx",
        "git_blob_sha": "38925384bef043f2438358db6e7a6b877b0a1912",
        "sha256": "a07bf58401d3aa5b7accfb035fb62ceaebfb15c8ea9dcd821af534e9fa9a5e02",
        "bytes": 13554,
        "expected_branch_blob_sha": "38925384bef043f2438358db6e7a6b877b0a1912",
        "expected_main_blob_sha": "7da5955b55c45596c47c6839c532e23496993c5e",
        "requires_content": false,
        "accepted_branch_blob_shas": [
          "38925384bef043f2438358db6e7a6b877b0a1912",
          "7da5955b55c45596c47c6839c532e23496993c5e"
        ]
      },
      {
        "path": "apps/frontend/src/lib/accessSession.ts",
        "git_blob_sha": "3382d04016653177a46c4fcb4a374ae25df3e191",
        "sha256": "deee83789435fe66d8134a9e42dcfd43feb772bb466d22b2bbeb75c15a9272fd",
        "bytes": 4012,
        "expected_branch_blob_sha": "e05d717faf7c056d73319750587b020a96d9d84e",
        "expected_main_blob_sha": null,
        "requires_content": true,
        "accepted_branch_blob_shas": [
          null,
          "3382d04016653177a46c4fcb4a374ae25df3e191",
          "e05d717faf7c056d73319750587b020a96d9d84e"
        ]
      },
      {
        "path": "apps/frontend/src/lib/nftPacks.ts",
        "git_blob_sha": "49129885bb230d2f67bcdc502ee45fdf1a3aeff2",
        "sha256": "35817f5cd35332e9f669f7612af15e26d18e7c74d1fe2223e1aa779139babb98",
        "bytes": 5481,
        "expected_branch_blob_sha": "49129885bb230d2f67bcdc502ee45fdf1a3aeff2",
        "expected_main_blob_sha": "01e5a106f7ed3b84659dfe19322976b90ef03f74",
        "requires_content": false,
        "accepted_branch_blob_shas": [
          "01e5a106f7ed3b84659dfe19322976b90ef03f74",
          "49129885bb230d2f67bcdc502ee45fdf1a3aeff2"
        ]
      },
      {
        "path": "apps/frontend/src/lib/paybox.ts",
        "git_blob_sha": "5a4188e16ecf50323a72bcb5d5874c068e94805c",
        "sha256": "0e420b35360773736905e1b28effd519029d498e504381321aa1ca21b888765f",
        "bytes": 5674,
        "expected_branch_blob_sha": "5a4188e16ecf50323a72bcb5d5874c068e94805c",
        "expected_main_blob_sha": "3691692b26f7c707304bf17bfbfbeb2093a5457d",
        "requires_content": false,
        "accepted_branch_blob_shas": [
          "3691692b26f7c707304bf17bfbfbeb2093a5457d",
          "5a4188e16ecf50323a72bcb5d5874c068e94805c"
        ]
      },
      {
        "path": "apps/frontend/src/lib/payments.ts",
        "git_blob_sha": "17c890de6e480189a8591350e9f6da0c6de9451f",
        "sha256": "a7fb314d3dc0176e04677c8ba9ae3725ac2777b2ea3e7a4b8e7214ff2513a617",
        "bytes": 3576,
        "expected_branch_blob_sha": "17c890de6e480189a8591350e9f6da0c6de9451f",
        "expected_main_blob_sha": "f3318da2d99cc7b4bd7fdb53ac44760e49aba8d1",
        "requires_content": false,
        "accepted_branch_blob_shas": [
          "17c890de6e480189a8591350e9f6da0c6de9451f",
          "f3318da2d99cc7b4bd7fdb53ac44760e49aba8d1"
        ]
      },
      {
        "path": "apps/frontend/src/pages/MyPacks.tsx",
        "git_blob_sha": "6692e64b128d3f9e2d529296a6e33c46d7f9cf03",
        "sha256": "db97a95e3599f6c662d457b2363bba4bfb2788ad188f26cd9a872253255e0ba4",
        "bytes": 13142,
        "expected_branch_blob_sha": "6692e64b128d3f9e2d529296a6e33c46d7f9cf03",
        "expected_main_blob_sha": "20466f9d694d07d3237ee7ee6c91e67615e66937",
        "requires_content": false,
        "accepted_branch_blob_shas": [
          "20466f9d694d07d3237ee7ee6c91e67615e66937",
          "6692e64b128d3f9e2d529296a6e33c46d7f9cf03"
        ]
      },
      {
        "path": "docs/audits/vellum-2026-10-24/P0_SERVED_BUILD_BEFORE.json",
        "git_blob_sha": "828454d377e2000e13baf22fa2be14fed3f5b707",
        "sha256": "2384c3bf5fed9ae688962ef1ac4ca2edc5aa1f34b5e9f853fdfac4ecc3e55132",
        "bytes": 251,
        "expected_branch_blob_sha": "828454d377e2000e13baf22fa2be14fed3f5b707",
        "expected_main_blob_sha": null,
        "requires_content": false,
        "accepted_branch_blob_shas": [
          null,
          "828454d377e2000e13baf22fa2be14fed3f5b707"
        ]
      },
      {
        "path": "docs/audits/vellum-2026-10-24/P0_VALIDATION.json",
        "git_blob_sha": "a41884f08ef34c755019a67dab8f6433ecab2312",
        "sha256": "727704d81586bc1712ed04edced1aa4455f0019f7ef204621a9178d289ae57ba",
        "bytes": 2046,
        "expected_branch_blob_sha": "f6337f6845ea3b99e0660dc7fc7e29023df61ff3",
        "expected_main_blob_sha": null,
        "requires_content": true,
        "accepted_branch_blob_shas": [
          null,
          "a41884f08ef34c755019a67dab8f6433ecab2312",
          "f6337f6845ea3b99e0660dc7fc7e29023df61ff3"
        ]
      },
      {
        "path": "services/access-api/src/orders.mjs",
        "git_blob_sha": "a19bfbcb3e8eb2a9f1ce932266cd8639bb221b6d",
        "sha256": "bf58263470beba2f61c5650e1e6bd8b604a0f719907661d2e07142655eff5eeb",
        "bytes": 9738,
        "expected_branch_blob_sha": "a19bfbcb3e8eb2a9f1ce932266cd8639bb221b6d",
        "expected_main_blob_sha": "20bbd34a354ca57b924e93edfcaeec7ffcf1d2ee",
        "requires_content": false,
        "accepted_branch_blob_shas": [
          "20bbd34a354ca57b924e93edfcaeec7ffcf1d2ee",
          "a19bfbcb3e8eb2a9f1ce932266cd8639bb221b6d"
        ]
      },
      {
        "path": "services/access-api/src/paybox.mjs",
        "git_blob_sha": "c14c02a4208b08d24c4a865ed4bcfd0dc4802d19",
        "sha256": "e3a45d4658f6d2ebe702dd3030a344e95c21c7c03c5ee5b98a20df3f0023e606",
        "bytes": 12100,
        "expected_branch_blob_sha": "7eca00b0c9fbf461b0b95c2292aa907543700417",
        "expected_main_blob_sha": "cf07088f1c3ba68562cbe0954c3ad3d354fae919",
        "requires_content": true,
        "accepted_branch_blob_shas": [
          "7eca00b0c9fbf461b0b95c2292aa907543700417",
          "c14c02a4208b08d24c4a865ed4bcfd0dc4802d19",
          "cf07088f1c3ba68562cbe0954c3ad3d354fae919"
        ]
      },
      {
        "path": "services/access-api/src/server.mjs",
        "git_blob_sha": "c77e254e720b70444e663ab12a8a951fb887e45c",
        "sha256": "c0e84c235f2fa869f06fecf496103b40f46b49ea7d1eebcdd40d7e6e759acf46",
        "bytes": 13530,
        "expected_branch_blob_sha": "36cf90255d1f6a13f55e79f2724b20cb184f62b5",
        "expected_main_blob_sha": "93059a22f1477d2e4876d1bbe5004fe75bbd7e3a",
        "requires_content": true,
        "accepted_branch_blob_shas": [
          "36cf90255d1f6a13f55e79f2724b20cb184f62b5",
          "56e2175c634659252edea706f846850cb2ce6d13",
          "93059a22f1477d2e4876d1bbe5004fe75bbd7e3a",
          "c77e254e720b70444e663ab12a8a951fb887e45c"
        ]
      },
      {
        "path": "services/access-api/tests/orders_security_p0.test.mjs",
        "git_blob_sha": "5b42dd1d99df8dd60085d38a2fd9433c98d398f0",
        "sha256": "60ef99f94375fbf42a0828840dfe15d278732acfec8b9aaef17716791111ce06",
        "bytes": 3859,
        "expected_branch_blob_sha": "5b42dd1d99df8dd60085d38a2fd9433c98d398f0",
        "expected_main_blob_sha": null,
        "requires_content": false,
        "accepted_branch_blob_shas": [
          null,
          "5b42dd1d99df8dd60085d38a2fd9433c98d398f0"
        ]
      },
      {
        "path": "services/access-api/tests/paybox_escapeXml.test.mjs",
        "git_blob_sha": "318bb30fc7a522944e3b38e449060c19b04f09f1",
        "sha256": "3ad2eb3f4700307ea8da65501556e3eba4ffa8dfec77ba618c4275226c2f17f1",
        "bytes": 1714,
        "expected_branch_blob_sha": "318bb30fc7a522944e3b38e449060c19b04f09f1",
        "expected_main_blob_sha": null,
        "requires_content": false,
        "accepted_branch_blob_shas": [
          null,
          "318bb30fc7a522944e3b38e449060c19b04f09f1"
        ]
      },
      {
        "path": "services/access-api/tests/payments.test.mjs",
        "git_blob_sha": "f9c21adc88160abf94f27b0123d6d1f0f7120ec1",
        "sha256": "91fc427cc767268e845cff4b6b48da53a805973d398e91cd6e8a95383e39140f",
        "bytes": 5962,
        "expected_branch_blob_sha": "f74d734569c704f2954062b09e2c70478f727713",
        "expected_main_blob_sha": "475dac0e12ac5066de0736e7f83428c9f62d1fa9",
        "requires_content": true,
        "accepted_branch_blob_shas": [
          "475dac0e12ac5066de0736e7f83428c9f62d1fa9",
          "744de7fbf35fa61ac26cf6ca282b9b5f75557fdb",
          "f74d734569c704f2954062b09e2c70478f727713",
          "f9c21adc88160abf94f27b0123d6d1f0f7120ec1"
        ]
      },
      {
        "path": "services/access-api/tests/server-fixture.mjs",
        "git_blob_sha": "9c0b42d543f6528812adfd87c20d53b610fb8114",
        "sha256": "5d8737b465b10f1264d191ef143eac20d96de8bc626472072c5e76eb45da8d63",
        "bytes": 1924,
        "expected_branch_blob_sha": "9c0b42d543f6528812adfd87c20d53b610fb8114",
        "expected_main_blob_sha": "7dd95696ba63db515d3269c78e276ee93955604b",
        "requires_content": false,
        "accepted_branch_blob_shas": [
          "7dd95696ba63db515d3269c78e276ee93955604b",
          "9c0b42d543f6528812adfd87c20d53b610fb8114"
        ]
      },
      {
        "path": ".github/workflows/deploy-exclusive.yml",
        "git_blob_sha": "898860f186e689f715843fbf45ad23e4bbad99b3",
        "sha256": "2d0849e9c593ffac6afbfd7b08126780e263e394bf09d8cc15bf0bc1f08883af",
        "bytes": 236,
        "expected_branch_blob_sha": "898860f186e689f715843fbf45ad23e4bbad99b3",
        "expected_main_blob_sha": "52e5f6fbb2cd66132c8349a7217a4bc0cbfa9a7c",
        "requires_content": false,
        "accepted_branch_blob_shas": [
          "52e5f6fbb2cd66132c8349a7217a4bc0cbfa9a7c",
          "898860f186e689f715843fbf45ad23e4bbad99b3"
        ]
      },
      {
        "path": ".github/workflows/deploy-frontend.yml",
        "git_blob_sha": "466bde365a6b4259d597433f145ddf6af6624227",
        "sha256": "81b9241a31b672e76dbd383da6f55a438d1ecdd81602c621b0697434a960e644",
        "bytes": 253,
        "expected_branch_blob_sha": "466bde365a6b4259d597433f145ddf6af6624227",
        "expected_main_blob_sha": "1e20e4bb5b1e7a6469de475cd8fa8b9d0efeb7bb",
        "requires_content": false,
        "accepted_branch_blob_shas": [
          "1e20e4bb5b1e7a6469de475cd8fa8b9d0efeb7bb",
          "466bde365a6b4259d597433f145ddf6af6624227"
        ]
      },
      {
        "path": ".github/workflows/issue-agent-pack-collections.yml",
        "git_blob_sha": "29addf976d7917bd789f8e0c57c7556c3ab82f10",
        "sha256": "9cb92b2bf85adabd3984a37f0340ca664c9575b6195a5a616c0eab21e1ab028a",
        "bytes": 11320,
        "expected_branch_blob_sha": "aceffbe0f441812dffc34c6f77831ae318d9b017",
        "expected_main_blob_sha": "aceffbe0f441812dffc34c6f77831ae318d9b017",
        "requires_content": true,
        "accepted_branch_blob_shas": [
          "29addf976d7917bd789f8e0c57c7556c3ab82f10",
          "aceffbe0f441812dffc34c6f77831ae318d9b017"
        ]
      },
      {
        "path": ".github/workflows/paybox-p0-review.yml",
        "git_blob_sha": "aa690a6cc8ca412d0dc6a6a44cdc0df50f1c42a8",
        "sha256": "bf7b59bd341f22b715455eef565b507b5fe96f7a1076c7ed3a3e32fa58e195d5",
        "bytes": 2410,
        "expected_branch_blob_sha": "aa690a6cc8ca412d0dc6a6a44cdc0df50f1c42a8",
        "expected_main_blob_sha": null,
        "requires_content": false,
        "accepted_branch_blob_shas": [
          null,
          "aa690a6cc8ca412d0dc6a6a44cdc0df50f1c42a8"
        ]
      },
      {
        "path": "services/access-api/tests/paybox_ipn_http.test.mjs",
        "git_blob_sha": "d02f6fbd52dc1df42b92de59195cce144049601b",
        "sha256": "2016f9544f2ca7aa63e64f4d33980ce1e717793f4b3e36166fd1d5056a415cd9",
        "bytes": 9623,
        "expected_branch_blob_sha": null,
        "expected_main_blob_sha": null,
        "requires_content": true,
        "accepted_branch_blob_shas": [
          null,
          "d02f6fbd52dc1df42b92de59195cce144049601b"
        ]
      },
      {
        "path": "apps/frontend/tests/access-session.test.mjs",
        "git_blob_sha": "d3e222a42f27e8156366283eef3ea2467a092f86",
        "sha256": "212e9c27ff81d65555d12300fee2d684145afdf3c8541e63b28baf5ca99b7284",
        "bytes": 6634,
        "expected_branch_blob_sha": null,
        "expected_main_blob_sha": null,
        "requires_content": true,
        "accepted_branch_blob_shas": [
          null,
          "d3e222a42f27e8156366283eef3ea2467a092f86"
        ]
      }
    ],
    "bundle_bytes": 10025,
    "bundle_sha256": "ed7e2b2ea33fc82c7c0eb757c97009bacb9a250b7771effd2bd54d7b32ca8c25",
    "executor_sha256": "a56b7365d8207d5b9d07f1180847868521f972dec6a7055a0baf0b0d23c2c0cd",
    "accepted_branch_baseline": "2796316ca7d046d6c1be674ba421cbef260f1a52",
    "reviewed_branch_head": "f457309f851d9ce5cdd3d41e4575e2ed54647927",
    "coordination": {
      "active_source_for_grok_alignment": "GitBook V1, original 20-file manifest",
      "reserved_grok_paths": [
        "services/access-api/src/server.mjs",
        ".github/workflows/issue-agent-pack-collections.yml",
        ".github/workflows/static.yml"
      ],
      "payments_test_policy": "verification only; do not rewrite",
      "chatgpt_scope": [
        "signed HTTP regression fixtures",
        "session regression fixtures",
        "integration plan",
        "GitBook coordination and PR body"
      ],
      "v2_code_status": "prepared and tested locally; no remote application authorized by this document",
      "integration_requires_human_go": true,
      "merge_deploy_real_payment_and_blockchain_requires_human_go": true
    }
  },
  "executor": {
    "filename": "execute_sprint.py",
    "sha256": "a56b7365d8207d5b9d07f1180847868521f972dec6a7055a0baf0b0d23c2c0cd",
    "content": "#!/usr/bin/env python3\n\"\"\"Verify the PR188 sprint source tree and print an integration plan; never push or merge.\"\"\"\nimport argparse\nimport hashlib\nimport json\nimport os\nfrom pathlib import Path\nimport subprocess\nimport tempfile\nfrom urllib.parse import urlsplit\n\nBRANCH = 'fix/p0-ipn-signed-binding-and-build'\n\n\ndef git(repo, *args, data=None, env=None):\n    result = subprocess.run(['git', '-C', str(repo), *args], input=data, capture_output=True, env=env)\n    if result.returncode:\n        raise RuntimeError(f'git {args[0]} failed ({result.returncode}); check access and concurrent changes')\n    return result.stdout\n\n\ndef text(repo, *args, **kwargs):\n    return git(repo, *args, **kwargs).decode().strip()\n\n\ndef heads(repo):\n    return {ref.removeprefix('refs/heads/'): sha for sha, ref in\n            (row.split() for row in text(repo, 'ls-remote', '--heads', 'origin', 'main', BRANCH).splitlines())}\n\n\ndef main():\n    parser = argparse.ArgumentParser(description=__doc__)\n    parser.add_argument('repo', type=Path)\n    args = parser.parse_args()\n    repo = args.repo.resolve()\n    folder = Path(__file__).resolve().parent\n    manifest = json.loads((folder / 'manifest.json').read_text())\n    if manifest['repository'] != 'Neltud/xArtists' or manifest['branch'] != BRANCH:\n        raise RuntimeError('unexpected repository or target branch')\n    origin = text(repo, 'remote', 'get-url', 'origin')\n    if origin.startswith('git@github.com:'):\n        destination = origin.split(':', 1)[1]\n    else:\n        parsed = urlsplit(origin)\n        if parsed.hostname != 'github.com' or parsed.scheme not in ('https', 'ssh'):\n            raise RuntimeError('origin must point to GitHub Neltud/xArtists')\n        destination = parsed.path.lstrip('/')\n    if destination.removesuffix('.git').lower() != 'neltud/xartists':\n        raise RuntimeError('unexpected origin repository')\n    git(repo, 'fetch', '--no-tags', 'origin', 'main', BRANCH)\n    remote = heads(repo)\n    current_main = remote['main']\n    expected = remote[BRANCH]\n    baseline = manifest.get('accepted_branch_baseline', manifest['expected_branch_head'])\n    git(repo, 'merge-base', '--is-ancestor', baseline, expected)\n    files_by_path = {file['path']: file for file in manifest['files']}\n    for name in text(repo, 'diff', '--name-only', baseline, expected).splitlines():\n        current = text(repo, 'ls-tree', expected, '--', name)\n        if name in files_by_path:\n            sha = current.split()[2] if current else None\n            allowed = files_by_path[name].get('accepted_branch_blob_shas', [files_by_path[name]['expected_branch_blob_sha']])\n            if sha not in allowed:\n                raise RuntimeError('unreviewed concurrent PR content: ' + name)\n        elif current != text(repo, 'ls-tree', current_main, '--', name):\n            raise RuntimeError('concurrent change outside the verified scope: ' + name)\n    git(repo, 'cat-file', '-e', current_main + '^{commit}')\n    allowed_data = {'data/signals/daily_signal.json', 'apps/frontend/public/data/signals/daily_signal.json'}\n    changed_main = text(repo, 'diff', '--name-only', manifest['main_base_sha'], current_main).splitlines()\n    for name in changed_main:\n        if not (name.startswith('docs/') and name.endswith('.md')) and name not in allowed_data:\n            raise RuntimeError('main code changed since validation; reintegrate and retest: ' + name)\n    bundle = folder / 'sprint-v2.bundle'\n    if hashlib.sha256(bundle.read_bytes()).hexdigest() != manifest['bundle_sha256']:\n        raise RuntimeError('bundle checksum mismatch')\n    git(repo, 'bundle', 'verify', str(bundle))\n    candidate_ref = 'refs/candidates/xartists/pr188-verified-v2'\n    git(repo, 'fetch', str(bundle), 'refs/heads/pr188-sprint-v2:' + candidate_ref)\n    if text(repo, 'rev-parse', candidate_ref) != manifest['candidate_commit_local']:\n        raise RuntimeError('unexpected bundle commit')\n    paths = set()\n    for file in manifest['files']:\n        name = file['path']\n        if name in paths or Path(name).is_absolute() or '..' in Path(name).parts:\n            raise RuntimeError('invalid file path')\n        paths.add(name)\n        current = text(repo, 'ls-tree', current_main, '--', name)\n        current_sha = current.split()[2] if current else None\n        if current_sha != file['expected_main_blob_sha']:\n            raise RuntimeError('main target file changed: ' + name)\n        data = git(repo, 'cat-file', 'blob', file['git_blob_sha'])\n        if len(data) != file['bytes'] or hashlib.sha256(data).hexdigest() != file['sha256']:\n            raise RuntimeError('source checksum mismatch: ' + name)\n    if len(paths) != 22:\n        raise RuntimeError('incomplete candidate source list')\n    with tempfile.TemporaryDirectory(prefix='xa-pr188-index-', dir=folder) as temporary:\n        env = os.environ | {'GIT_INDEX_FILE': str(Path(temporary) / 'index')}\n        git(repo, 'read-tree', current_main, env=env)\n        for file in manifest['files']:\n            git(repo, 'update-index', '--add', '--cacheinfo', '100644,' + file['git_blob_sha'] + ',' + file['path'], env=env)\n        tree = text(repo, 'write-tree', env=env)\n    if current_main == manifest['main_base_sha'] and tree != manifest['candidate_tree']:\n        raise RuntimeError('unexpected integration tree')\n    if set(text(repo, 'diff', '--name-only', current_main, tree).splitlines()) != paths:\n        raise RuntimeError('unexpected integration scope')\n    observed = heads(repo)\n    if observed.get(BRANCH) != expected or observed.get('main') != current_main:\n        raise RuntimeError('remote references moved during verification; reread before proceeding')\n    print(json.dumps({'proposed_tree': tree, 'proposed_parents': [expected, current_main],\n                      'files': 22, 'commit_created': False, 'pushed': False,\n                      'human_go_required_for_integration': True,\n                      'reserved_grok_paths': manifest['coordination']['reserved_grok_paths']}))\n    print('Source tree verified locally. Integration remains a plan; no commit, merge or push performed.')\n\n\nif __name__ == '__main__':\n    try:\n        main()\n    except (OSError, RuntimeError, KeyError, ValueError) as error:\n        raise SystemExit(str(error))\n"
  },
  "bundle": {
    "filename": "sprint-v2.bundle",
    "bytes": 10025,
    "sha256": "ed7e2b2ea33fc82c7c0eb757c97009bacb9a250b7771effd2bd54d7b32ca8c25",
    "base64": "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"
  }
}
```
