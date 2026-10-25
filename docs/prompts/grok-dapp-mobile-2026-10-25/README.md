# Instruction prioritaire : retirer polyLIA / GreenSmoke

### Reprise de la sortie officielle

Le [lanceur de reprise et les contrôles de publication](sortie-officielle.md) complètent cette mission. Le lanceur de 2,8 Ko reconstitue les 37 fichiers du transport depuis les annexes GitBook déjà synchronisées dans le dépôt. Ensuite : import mobile, retrait polyLIA, corrections YAML, checks, merge et contrôle du site officiel à 97 routes. Les preuves et les fichiers API complets sont sur cette page ; aucun ZIP n'est nécessaire.

Nelson demande de supprimer ce module abandonné. Termine l'import initial à 99 routes avec ses empreintes existantes, puis applique le [correctif polyLIA / GreenSmoke](retirer-polylia-greensmoke.md) avant toute fusion. Le correctif contient ses fichiers API complets et ses vérifications. L'état final attendu devient **36 modules et 97 routes**, avec LIA désactivé. Les quatre annexes initiales restent la référence de la première étape d'import.

Mission pour Grok : terminer la publication complète de la dApp mobile xArtists dans `Neltud/xArtists`, puis vérifier sa disponibilité sur GitHub Pages et préparer la validation xPortal. Tous les fichiers nécessaires sont disponibles en texte dans les quatre annexes de cette page. La livraison s'utilise directement depuis GitBook, sans archive ZIP.

### Documents à lire

* [Fichiers API 1 sur 4](fichiers-api-1.md)
* [Fichiers API 2 sur 4](fichiers-api-2.md)
* [Fichiers API 3 sur 4](fichiers-api-3.md)
* [Fichiers API 4 sur 4](fichiers-api-4.md)

### Commencer ici

Lis cette page et les quatre annexes « Fichiers API ». Reconstitue leurs fichiers UTF-8, vérifie les empreintes, puis utilise tes outils API GitHub déjà authentifiés pour exécuter les opérations dans l'ordre. Les morceaux `.b64` sont du texte à publier tel quel. Le workflow d'import est la dernière opération. Rapporte les liens et les SHA réels à chaque étape.

### Destination et état observé

| Élément                             | Valeur                                                                  |
| ----------------------------------- | ----------------------------------------------------------------------- |
| Dépôt                               | https://github.com/Neltud/xArtists                                      |
| Branche de reprise                  | `feat/dapp-mobile-transport`                                            |
| Tip distant relu le 25 octobre 2026 | `9e006ff0fb83dfbcda00c27bd285f160551b7278`                              |
| Base de cette branche               | `4f8a16bb51dca9ae8cd6f2b60bccb693addbf9a9`                              |
| Sources finales                     | 26 chemins du kit vérifié                                               |
| Transport de cette documentation    | 34 morceaux, 4 096 octets maximum par morceau                           |
| Opérations API                      | 39 créations/mises à jour et 2 suppressions d'anciens fichiers d'import |

Ces références décrivent une observation datée. Relis le tip et les fichiers distants avant toute reprise. Des changements récents doivent être conservés et réconciliés si nécessaire. Les contrôles d'intégrité du transport refusent une modification inattendue des sources.

Au contrôle, seuls 3 des 26 fichiers distants correspondaient exactement au kit. L'ancien `release-import/dapp-mobile/manifest.json` contenait 17 entrées, un `PLACEHOLDER` pour le CSS et une empreinte Shell différente du kit. Les trois morceaux annoncés et le workflow d'import n'étaient pas publiés. Aucune PR n'était visible pour cette branche. Les PR #184 et #185 ont déjà été fusionnées et ne prouvent pas que la suite complète a été livrée.

### Reconstituer les fichiers depuis les annexes

Chaque annexe contient un seul bloc JSON au format `xartists-gitbook-api-files-v1`. Enregistre ces quatre blocs sous `gitbook-json/api-1.json` à `api-4.json`. Lis les données depuis les pages GitBook ou leur contenu Markdown intégral ; conserve chaque chaîne JSON complète.

Le champ `content_utf8` contient les octets textuels du fichier après décodage JSON. Les séquences `\n` dans la chaîne JSON deviennent des sauts de ligne du fichier. Chaque morceau Base64 conserve exactement son contenu, sans saut de ligne final supplémentaire. Les PNG sont déjà encodés dans les morceaux : ils ne sont pas à dessiner ni à remplacer.

Exécute ce script local pour reconstituer et vérifier les fichiers :

```python
import hashlib
import json
from pathlib import Path

target = Path('transport_github')
target.mkdir(exist_ok=True)
operations = []
baseline = None
for index in range(1, 5):
    batch = json.loads(Path(f'gitbook-json/api-{index}.json').read_text())
    assert batch['format'] == 'xartists-gitbook-api-files-v1'
    assert batch['batch_index'] == index and batch['batches'] == 4
    identity = (batch['repository'], batch['branch'], batch['base_sha'])
    baseline = baseline or identity
    assert identity == baseline
    for entry in batch['operations']:
        operation = dict(entry)
        assert operation.pop('sequence') == len(operations) + 1
        if operation['operation'] == 'upsert':
            raw = operation.pop('content_utf8').encode('utf-8')
            assert len(raw) == operation['size_bytes']
            assert hashlib.sha256(raw).hexdigest() == operation['sha256']
            name = operation['local']
            assert Path(name).name == name
            (target / name).write_bytes(raw)
        operations.append(operation)
assert len(operations) == 41
assert operations[-1]['remote'] == '.github/workflows/import-dapp-mobile.yml'
order = dict(zip(('repository', 'branch', 'base_sha'), baseline))
order.update(upload_workflow_last=True, parts=34, files=operations)
(target / 'UPLOAD_ORDER.json').write_text(json.dumps(order, indent=2) + '\n')
print('39 fichiers vérifiés et 41 opérations prêtes, workflow en dernier.')
```

### Publier par l'API GitHub authentifiée

1. Pour chaque opération, lis le chemin distant actuel. Si les octets attendus sont déjà présents, vérifie l'empreinte et reprends à l'opération suivante. Pour une création ou mise à jour, lis le fichier local indiqué par `local` et fournis son contenu intégral à l'outil GitHub. Effectue un appel par fichier, puis relis le contenu distant et compare son SHA-256. Utilise l'empreinte Git courante pour une mise à jour. Arrête et réconcilie une modification inattendue ; aucun contenu ne doit être reconstitué à la main.
2. La première opération met `.github/workflows/static.yml` à jour par l'API autorisée. Les deux suppressions suivantes concernent uniquement les anciens `release-import/dapp-mobile/apply.py` et `manifest.json`. Leurs empreintes Git observées sont données : si leur contenu a changé, arrête avant suppression. Un fichier déjà absent peut être passé après vérification.
3. Publie les 34 morceaux sous `docs/transports/dapp-mobile-2026-10-25/`, puis les métadonnées et `restore.py` selon l'ordre généré. Les fichiers de transport sont temporaires et seront retirés du commit d'import.
4. Publie enfin le workflow généré `.github/workflows/import-dapp-mobile.yml`. Attends alors le job `import` sans modifier la branche pendant son exécution.
5. Si un appel API échoue, indique le code, le chemin et la dernière opération dont le contenu distant est vérifié. La publication s'appuie sur les outils API GitHub connectés de Grok ; elle n'exige pas de jeton Git dans le sandbox.

Le script de restauration vérifie les morceaux, l'archive, les 26 chemins et leurs empreintes avant l'écriture des sources. `static.yml` doit déjà correspondre à la version finale ; le runner ne modifie aucun workflow. Il prépare un commit local, exécute les vérifications ci-dessous puis pousse par commit normal si la branche distante n'a pas avancé.

### Vérifications avant le push du runner

Environnement du workflow : `NODE_OPTIONS=--max-old-space-size=4096`, `VITE_LIA_LIVE_TRADING=0`, `VITE_PAYBOX_ENABLED=false`.

```bash
cd apps/frontend
npm ci --legacy-peer-deps
npm run test:release
npm run check:routes
npm run render:check
node scripts/run-render-check.mjs modules
node scripts/run-render-check.mjs mobile
npm run build
GITHUB_SHA="$(git rev-parse HEAD)" node scripts/write-build-info.mjs
npm run verify:site
python -c 'import json; p=json.load(open("dist/dapp-release.json")); assert p["lia_live_trading"] is False; assert len(p["routes"]) == 99'
```

Résultats locaux déjà obtenus : 26/26 empreintes exactes, rejet d'un morceau tronqué avant toute modification, YAML et syntaxe shell vérifiés. L'arbre Git du frontend final est `368fd971d5c890bc90472f0cc5872a4d56d0aa08`, identique à celui sur lequel 22 tests frontend et le build paper avec 4 Go de heap ont réussi. Ce résultat local ne prouve pas une exécution Actions distante. Le typecheck global conserve 78 diagnostics préexistants ; il n'est pas présenté comme vert.

### PR, merge et contrôle de publication

Après succès de l'import, conserve l'URL du run, son résultat, le SHA effectivement poussé et l'artefact `dapp-mobile-import-proof`. Supprime ensuite le seul workflow temporaire `.github/workflows/import-dapp-mobile.yml` via ton API GitHub authentifiée. Ouvre ou reprends une PR de la branche complétée vers `main`. Attends les checks requis verts et respecte les protections du dépôt avant merge.

Le build du runner ne déclenche pas à lui seul tous les workflows de publication. Suis les checks de la PR puis le run Pages de `main` après merge. Vérifie les 26 empreintes sur le SHA final fusionné et le SHA contenu dans `build-info.json`.

Contrôles du site publié :

* `/xArtists/app/`, `/xArtists/install/`, `/xArtists/mobile/`, `/xArtists/wallet/` et `/xArtists/museum/` sont accessibles directement et après actualisation.
* Les 99 entrées publiques sont générées, le repli `_xa_route` conserve la navigation et les paramètres, et le workflow conserve le `404.html` généré.
* Les icônes PNG 192, 512 et Apple, le logo et l'image de partage sont de vraies images servies correctement.
* Le service worker garde les requêtes sensibles réseau et propose la page hors ligne prévue ; aucune réponse HTML ne remplace un module JavaScript absent.
* `dapp-release.json` et les métadonnées du build attestent `lia_live_trading: false` pour les bundles réellement servis.
* Le sélecteur de connexion xPortal, l'installation PWA, le partage et les huit langues sont vérifiés sur téléphone. Une connexion xPortal physique et une inscription au catalogue restent à attester séparément ; ne les annoncer qu'avec une preuve réelle. Vérifier les domaines WalletConnect utilisés par la version publiée, sans exposer de secret.

Périmètre de cette mission : frontend, publication et contrôles paper. Aucun accès PEM, appel financier, signature de transaction ou activation live. Aucun force-push ni changement de permissions n'est demandé. Préserve les protections V3/G1/P0 et les changements de source hors des 26 chemins du kit.

### Compte rendu attendu de Grok

Réponds avec les liens du run d'import, de la PR et du déploiement Pages, les SHA distants complets, le résultat des 26 empreintes, les tests et le flag compilé LIA. Un brouillon de formulaire, un accusé de réception ou un commit local ne remplace pas une preuve distante.

Références : [workflows Pages existants](../../WORKFLOWS_PAGES.md), [publication V3 précédente](../../V3_PUBLICATION_2026-10-21.md), [règles GitHub Token](https://docs.github.com/en/actions/concepts/security/github_token), [permissions des workflows](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#permissions).

### Empreintes SHA-256 des 26 sources finales

```json
{
  ".github/workflows/static.yml": "cd7045db6dff2a86c7d2762e9aba12976c56540791465859b1cbebd3082faa01",
  "apps/frontend/index.html": "67c90b3f835c5572db2567e570d7ea3656ed443e59079555ca92a9a3bfe7ac81",
  "apps/frontend/public/icons/app-icon.svg": "0b69da11f07b3e6253fd6be69db9c9c658c3ec535caac6b8d08062345ade214c",
  "apps/frontend/public/icons/apple-touch-icon.png": "1d32c08c9d0408c3522cd815cf80ad13f3ba197705040f24c51e2f5dddc101d0",
  "apps/frontend/public/icons/icon-192.png": "994ea8b4a9b42099077a72d7a6d32ccc4386b765bfd7f44e03cb3f8dadb5986e",
  "apps/frontend/public/icons/icon-512.png": "deeaa1b994929a8ebe25ffaae95668df566eb60af19a9669387e9ffb4526a819",
  "apps/frontend/public/manifest.webmanifest": "b3ab855183651b252d2b05753dc0fcdaf50b4ee67051a0686655502afbf1680a",
  "apps/frontend/public/offline.html": "d4ce9e9c2eac325c4254a3f4b745066e4ca04fa77e8dd6cdc8aad15687097139",
  "apps/frontend/public/og-image.png": "ebf66dc8d8dcb543dc605e30bfaf519205c6e4c07f7da4fca5927dd8a0554325",
  "apps/frontend/public/service-worker.js": "45690555f62dfc7d22fd988fa6512e2a9a89298057975641daf0ba2167056030",
  "apps/frontend/public/xartists-logo.png": "deeaa1b994929a8ebe25ffaae95668df566eb60af19a9669387e9ffb4526a819",
  "apps/frontend/scripts/publicAvailability.mjs": "5db5c51b58c4e9b648d8f24fbb1d57213e2f4b9ae627f52016e36164940e9bbb",
  "apps/frontend/scripts/verify-site.mjs": "463cac8b090f04da711e73f561e6dd1b9808898fad98a3b54ab7b6639fe68fc9",
  "apps/frontend/scripts/write-build-info.mjs": "ec0e03108176f86491868dff4ab34d58d7598af31c91ff8b0e3d5d3369eb108b",
  "apps/frontend/src/experience/Pages.tsx": "2ad4cceb442b55c728b5b310183ddb016940734fd038fa8fed1cb6c782657b40",
  "apps/frontend/src/experience/Shell.tsx": "21e21cd34fc86cbe23b21ccd2ecda5146c1d1d1336590d91e8e99aa1ee236aa5",
  "apps/frontend/src/experience/experience.css": "bd89234f923f77e0afc5b6a26834ddd433a66840cdd0003c2f8663100eb7c33e",
  "apps/frontend/src/experience/locale.ts": "01d38ae886d071eca9a59084fb5112bc81217873738e951ef0d4a2e799e29f9a",
  "apps/frontend/src/experience/modules.ts": "e27b4482c3fc6218f35875e05f4297d2e03616547d42b400ca353c09e5870296",
  "apps/frontend/src/lib/publicRoutes.ts": "4b8513877008ec388f2c8f1c3bf7b3390d001b0d14eb72de6720593ee3e685db",
  "apps/frontend/src/main.tsx": "6bd7abff06bea2a0ae8eee035dd4471177f3de2bc8b267e8bdef5df5861a0b3f",
  "apps/frontend/src/pages/DappAccessPage.tsx": "f0db017a92ab28c82376da5ea137699bafa093a7852a27a82f974263eac67c6c",
  "apps/frontend/src/pwa/installPrompt.ts": "7274634c135b1f2293759f03cc9484ff58f7ee1d4a3dda47d1b75a66c5b7add9",
  "apps/frontend/src/pwa/registerSW.ts": "15b14bdc31f2075ba0b56fb7bb3f1ef25a78d523c3c43bc63e8c56f57593c24f",
  "apps/frontend/tests/availability.test.mjs": "85b02c6116c6ee3478a306f09de093db915a5dd30b6d34605ed06f0f69c98168",
  "apps/frontend/vite.config.ts": "6ebce969b33f9dd34e71096498795a4226e8278edb836d799b1fada4192d5aef"
}
```
