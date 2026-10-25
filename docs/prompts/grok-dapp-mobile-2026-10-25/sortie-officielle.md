# Sortie officielle — reprise automatique et contrôles publics

Passation prioritaire pour Grok : terminer la sortie publique officielle de xArtists, en conservant l'ordre import mobile → retrait polyLIA → checks → merge → vérification Pages. Cette page réunit les fichiers et les contrôles nécessaires, sans ZIP.

### État vérifié le 25 octobre 2026

La PR #186 est ouverte : https://github.com/Neltud/xArtists/pull/186 . À la lecture détaillée, GitHub indique `mergeable: true` et `mergeable_state: unstable`. Sa tête relue est `7b43b96cc28d321e508d1f1eca5da9a8cc776a8c`. Le merge local de `main` à `a6adaf6eec883fffef35d2990508cd35e78d6be0` est propre. Relire les références actuelles avant reprise.

Le transport distant est encore incomplet : `part-002.b64` mesure 100 octets, `restore.py` 200 octets et `transport.json` 257 octets. Les succès Rust, revue et E2E de cette PR ne prouvent donc pas que le frontend complet a été importé.

Les quatre annexes GitBook sont déjà synchronisées dans `main`, sous `docs/prompts/grok-dapp-mobile-2026-10-25/fichiers-api-1.md` à `fichiers-api-4.md`. Elles contiennent tous les octets manquants. Le lanceur ci-dessous reconstitue les fichiers sur le runner GitHub, en vérifiant les empreintes de chaque annexe et de chaque fichier.

### Prochaine action : un fichier de 2,8 Ko à publier

1. Lis le bloc JSON « Fichier API du lanceur ». Publie son `content_utf8` exact, avec ton outil API GitHub authentifié, sur la branche `feat/dapp-mobile-transport`, au chemin `.github/workflows/hydrate-mobile-transport.yml`. Vérifie le SHA-256 distant. Ce fichier temporaire déclenche le job `hydrate`.
2. Attends le job sans écrire sur cette branche pendant son exécution. Il répare et complète uniquement les 34 morceaux et les trois métadonnées du transport. Il préserve `static.yml` déjà vérifié, vérifie les deux suppressions déjà réalisées, et ne modifie aucune source applicative. Les 41 opérations du kit initial et leurs empreintes restent inchangées.
3. Le job lit le programme de cette page dans la copie GitBook synchronisée du dépôt, vérifie son empreinte avant exécution, puis lit les quatre annexes au commit source fixé. Si la synchronisation de cette nouvelle page n'est pas encore visible sur `main`, attendre cette synchronisation avant le lancement ; un échec de lecture n'est pas une raison de remplacer les données.
4. Après succès et vérification des 37 fichiers, conserve l'URL du run et le SHA distant. Supprime le seul workflow temporaire `hydrate-mobile-transport.yml` par ton API. Publie ensuite le fichier original `IMPORT_WORKFLOW.yml` de l'opération 41, au chemin `.github/workflows/import-dapp-mobile.yml` : cette opération demeure la dernière du kit initial.
5. Attends le vrai job `import`, ses 26/26 empreintes et son build paper à 99 routes. Supprime `import-dapp-mobile.yml` par l'API après succès.
6. Applique ensuite le [correctif obligatoire polyLIA / GreenSmoke](retirer-polylia-greensmoke.md). Il fournit 11 fichiers API et son workflow en dernier. Le résultat final attendu est **36 modules, 51 alias, 97 routes et `lia_live_trading: false`**. Après succès, supprime son workflow temporaire via l'API.

Le lanceur est limité à `Neltud/xArtists` et à cette branche. Son push est normal, sans force, et refuse une branche avancée depuis son démarrage. La simulation locale a restauré les 37 fichiers exactement à partir de l'état distant tronqué et créé le commit local prévu, sans changement des sources applicatives. Aucun job GitHub n'a été lancé depuis l'accès Codex, dont l'écriture retourne 403 ; Grok doit effectuer l'appel API ci-dessus.

### Trois corrections YAML avant les checks finaux

Trois workflows échouent avant même de créer un job :

* `deploy-frontend.yml` et `deploy-exclusive.yml` : les deux-points du message `echo` sont interprétés comme une structure YAML. Le correctif place ce message dans un bloc `run: |`.
* `issue-agent-pack-collections.yml` : les blocs Python des lignes 149–157 et 160–165 sortaient de l'indentation YAML. Le correctif ajoute uniquement l'indentation YAML requise, en conservant le script shell/Python obtenu.

Le bloc JSON « Réparations YAML » contient les trois versions complètes, les empreintes initiales et finales. Publie-les par ton API sur la branche de PR, après contrôle de l'état distant. Conserve toute modification concurrente légitime. YAML et syntaxe shell ont été vérifiés localement ; les trois déclencheurs restent uniquement `workflow_dispatch`.

Ces validations sont des vérifications de syntaxe. Le lancement manuel du workflow de collections, qui comporte des opérations financières, ne fait pas partie de cette sortie frontend. Aucun PEM, signature ou appel financier n'est nécessaire à cette mission.

### Merge et preuve de publication officielle

Après les deux imports et les réparations, relis le dernier `main` et réconcilie les changements récents par merge normal si nécessaire. Actualise le titre et la description de la PR autour de l'état final : disponibilité publique mobile, retrait polyLIA et corrections de workflow. Attends tous les checks requis sur le dernier SHA. Respecte les protections du dépôt.

Merge seulement lorsque les sources et les preuves runner sont complètes. Attends ensuite le run Pages de `main`. L'URL officielle cible est `https://neltud.github.io/xArtists/app/`. La version Sites déjà publiée à 97 routes reste accessible à `https://xartists-dapp-mobile.loftypearl128.chatgpt.site/xArtists/app/`, avec une publication distincte de GitHub Pages.

Le script de contrôle HTTP ci-dessous doit être exécuté depuis un environnement ayant accès au site public, avec le SHA source du run Pages :

```bash
python verify_public_release.py --source-sha SHA_SOURCE_DU_RUN_PAGES
```

Il vérifie le SHA servi, 97 routes, le flag LIA à false, les entrées mobiles, les modules JavaScript et les vraies dimensions PNG. Son code a été exercé sur le build local à 97 routes avec un transport HTTP simulé ; cela ne constitue pas un contrôle réussi du site officiel. Les vérifications publiques restent à exécuter après le déploiement.

Vérifie aussi dans le navigateur l'annuaire sans polyLIA, les liens directs et l'actualisation, les huit langues, le partage, l'installation PWA et le sélecteur xPortal. Une connexion sur téléphone physique et les domaines autorisés du projet WalletConnect doivent être attestés séparément, sans exposer de clé.

### Distribution grand public et xPortal

La fiche de référencement ci-dessous est prête pour le site officiel une fois son déploiement vérifié. Elle décrit l'art, le musée et les outils créatifs ; le mode reste paper et aucune activité de trading autonome n'est annoncée comme active.

Une intégration WalletConnect/xPortal n'atteste pas une inscription dans un catalogue. Aucune soumission ni validation de catalogue n'est réalisée par cette documentation. Vérifie le parcours officiel de soumission en vigueur, puis utilise les informations exactes de la fiche. Le site MultiversX propose un parcours « Submit Project » : https://multiversx.com/ecosystem/projects . La documentation primaire décrit WalletConnect comme chemin d'intégration dApp/mobile : https://docs.multiversx.com/welcome/terminology/ . Le site officiel xPortal est https://xportal.com/ .

### Compte rendu final exigé

Fournis les URL des jobs hydrate, import et retrait, les SHA distants complets, la PR fusionnée, le run Pages, le contenu de `build-info.json`, le contrôle HTTP réussi à 97 routes et les tests mobile réellement effectués. Indique séparément l'état de la connexion physique xPortal et celui du référencement. Un formulaire, un commit local ou les seuls checks de la PR ne prouvent pas la publication complète.

### Fichier API du lanceur

````json
{
  "repository": "Neltud/xArtists",
  "branch": "feat/dapp-mobile-transport",
  "path": ".github/workflows/hydrate-mobile-transport.yml",
  "sha256": "01fe030d314f2b0e27f48b97b881b451445d24f05ca2921e57043d32e711c897",
  "size_bytes": 2801,
  "content_utf8": "name: Hydrate verified mobile transport from GitBook\non:\n  push:\n    branches: ['feat/dapp-mobile-transport']\n    paths: ['.github/workflows/hydrate-mobile-transport.yml']\n  workflow_dispatch:\npermissions:\n  contents: read\nconcurrency:\n  group: dapp-mobile-completion\n  cancel-in-progress: false\njobs:\n  hydrate:\n    if: github.repository == 'Neltud/xArtists' && github.ref == 'refs/heads/feat/dapp-mobile-transport'\n    runs-on: ubuntu-latest\n    timeout-minutes: 10\n    permissions:\n      contents: write\n    steps:\n      - uses: actions/checkout@v4\n        with:\n          ref: ${{ github.sha }}\n          fetch-depth: 0\n      - name: Reconstruct the exact published GitBook files\n        run: |\n          python - --write --proof \"$RUNNER_TEMP/mobile-transport-proof.json\" <<'PY'\n          import hashlib,re,subprocess\n          subprocess.run(['git','fetch','origin','main'],check=True)\n          path='docs/prompts/grok-dapp-mobile-2026-10-25/sortie-officielle.md'\n          markdown=subprocess.check_output(['git','show','FETCH_HEAD:'+path],text=True)\n          blocks=[s.rstrip('\\n')+'\\n' for s in re.findall(r'```python[^\\n]*\\n(.*?)\\n```',markdown,re.S)]\n          code=next((s for s in blocks if hashlib.sha256(s.encode()).hexdigest()=='19e488c4ee1cdc7145e33176190b7d352150688f8141b7eee56b2e79abbfc0e0'),None)\n          assert code is not None,'Verified hydration source missing from GitBook-synced docs'\n          exec(compile(code,'hydrate_transport.py','exec'),{'__name__':'__main__'})\n          PY\n      - name: Commit transport files and publish without force\n        run: |\n          git add docs/transports/dapp-mobile-2026-10-25\n          if git diff --cached --name-only | grep -v '^docs/transports/dapp-mobile-2026-10-25/' | grep -q .; then\n            echo '::error::Unexpected staged path.'\n            exit 1\n          fi\n          if ! git diff --cached --quiet; then\n            git -c user.name='github-actions[bot]' -c user.email='41898282+github-actions[bot]@users.noreply.github.com' commit -m 'chore(transport): restore complete verified GitBook mobile files'\n          fi\n          git fetch origin refs/heads/feat/dapp-mobile-transport\n          test \"$(git rev-parse FETCH_HEAD)\" = \"$GITHUB_SHA\" || { echo 'Branch advanced; retry from its current head.'; exit 1; }\n          git push origin HEAD:refs/heads/feat/dapp-mobile-transport\n          echo \"Verified transport commit: $(git rev-parse HEAD)\" >> \"$GITHUB_STEP_SUMMARY\"\n          echo '34 parts and 3 metadata files verified; application import remains the next step.' >> \"$GITHUB_STEP_SUMMARY\"\n      - name: Preserve transport proof\n        if: always()\n        uses: actions/upload-artifact@v4\n        with:\n          name: mobile-transport-proof\n          path: ${{ runner.temp }}/mobile-transport-proof.json\n"
}
````

### Code vérifié : hydrate\_transport.py

````python
import argparse, hashlib, json, os, re, subprocess
from pathlib import Path, PurePosixPath

SOURCE = 'a6adaf6eec883fffef35d2990508cd35e78d6be0'
BRANCH = 'feat/dapp-mobile-transport'
PREFIX = 'docs/transports/dapp-mobile-2026-10-25/'
DIGESTS = [
 '7bc8f52b8bc7ee3c6b72372f82bc6def1bbf6dd38fd871024473873bdbf18cbd',
 '8eaaed1b5353a6e9d6e0533c67613eb436392c7bcbe05b9b27ec6633e1ef4fb3',
 '1222eb64aaed473e49f610f31af4140a679949d1ff2465a4c4906cae3d281425',
 '72c7be76eb54831a6377cc0314b99dd541650ada5b6761b227b8e5841130ffa1',
]
def sha(data): return hashlib.sha256(data).hexdigest()
def git(*args): return subprocess.check_output(['git', *args], text=True).strip()

def main():
 p=argparse.ArgumentParser();p.add_argument('--write',action='store_true');p.add_argument('--proof',type=Path,required=True);a=p.parse_args()
 assert os.environ.get('GITHUB_REPOSITORY')=='Neltud/xArtists'
 assert os.environ.get('GITHUB_REF')=='refs/heads/'+BRANCH
 assert not git('status','--porcelain','--untracked-files=no'), 'Tracked edits present'
 if subprocess.run(['git','cat-file','-e',SOURCE+'^{commit}'],capture_output=True).returncode:
  subprocess.run(['git','fetch','origin',SOURCE],check=True)
 operations=[]
 for i,digest in enumerate(DIGESTS,1):
  path=f'docs/prompts/grok-dapp-mobile-2026-10-25/fichiers-api-{i}.md'
  markdown=git('show',SOURCE+':'+path)
  blocks=re.findall(r'```json[^\n]*\n(.*?)\n```',markdown,re.S);assert len(blocks)==1
  batch=json.loads(blocks[0]);assert sha(json.dumps(batch,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode())==digest, 'GitBook batch changed'
  assert batch['format']=='xartists-gitbook-api-files-v1' and batch['batch_index']==i and batch['batches']==4
  assert batch['repository']=='Neltud/xArtists' and batch['branch']==BRANCH
  operations.extend(batch['operations'])
 assert len(operations)==41 and [x['sequence'] for x in operations]==list(range(1,42))
 assert operations[0]['remote']=='.github/workflows/static.yml'
 assert sha(Path(operations[0]['remote']).read_bytes())==operations[0]['sha256'], 'Upload exact static.yml through API first'
 for row in operations[1:3]:
  assert row['operation']=='delete' and row['remote'] in ['release-import/dapp-mobile/apply.py','release-import/dapp-mobile/manifest.json']
  assert not Path(row['remote']).exists(), 'Complete the two reviewed API deletions first'
 last=operations[-1];assert last['remote']=='.github/workflows/import-dapp-mobile.yml'
 assert sha(last['content_utf8'].encode())==last['sha256']
 expected={f'part-{i:03d}.b64' for i in range(1,35)}|{'transport.json','FILES.txt','restore.py'}
 root=Path.cwd().resolve();plan=[]
 for row in operations[3:-1]:
  path=row['remote'];assert row['operation']=='upsert' and path.startswith(PREFIX)
  name=path[len(PREFIX):];assert name in expected and PurePosixPath(name).name==name
  raw=row['content_utf8'].encode('utf-8');assert len(raw)==row['size_bytes'] and sha(raw)==row['sha256']
  target=root/path;target.resolve().relative_to(root);assert not target.is_symlink()
  plan.append((target,raw,row))
 assert len(plan)==37 and {x[0].name for x in plan}==expected
 folder=root/PREFIX
 assert not folder.exists() or {f.relative_to(folder).as_posix() for f in folder.rglob('*') if f.is_file()}<=expected, 'Unknown transport files'
 if a.write:
  for target,raw,row in plan:target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(raw)
  for target,raw,row in plan:assert sha(target.read_bytes())==row['sha256']
 proof={'transport_files_verified':37,'parts_verified':34,'source':SOURCE,'application_sources_changed':False,'import_workflow_api_sha256':last['sha256'],'import_workflow_bytes':last['size_bytes'],'files':[{'path':r['remote'],'sha256':r['sha256']} for _,_,r in plan]}
 a.proof.parent.mkdir(parents=True,exist_ok=True);a.proof.write_text(json.dumps(proof,indent=2)+'\n')
 print(json.dumps({k:v for k,v in proof.items() if k!='files'}))
if __name__=='__main__':main()
````

### Réparations YAML

```json
[
  {
    "path": ".github/workflows/deploy-frontend.yml",
    "before_sha256": "47a8f6956bf69dfff35defa102acd5cdfba0f096410f8b184a43516f2c173393",
    "sha256": "81b9241a31b672e76dbd383da6f55a438d1ecdd81602c621b0697434a960e644",
    "before_blob": "1e20e4bb5b1e7a6469de475cd8fa8b9d0efeb7bb",
    "content_utf8": "# DEPRECATED \u2014 use static.yml only (P0 2026-09-13)\nname: \"[deprecated] deploy-frontend\"\non:\n  workflow_dispatch:\njobs:\n  notice:\n    runs-on: ubuntu-latest\n    steps:\n      - run: |\n          echo \"Deprecated. Canonical: .github/workflows/static.yml\"\n"
  },
  {
    "path": ".github/workflows/deploy-exclusive.yml",
    "before_sha256": "cf645baf2a5d5b16ee6e06a173539adc069ad3c4b2d37a7e0b9875cddb184b4d",
    "sha256": "2d0849e9c593ffac6afbfd7b08126780e263e394bf09d8cc15bf0bc1f08883af",
    "before_blob": "52e5f6fbb2cd66132c8349a7217a4bc0cbfa9a7c",
    "content_utf8": "# DEPRECATED \u2014 use static.yml only (P0 2026-09-13)\nname: \"[deprecated] deploy-exclusive\"\non:\n  workflow_dispatch:\njobs:\n  notice:\n    runs-on: ubuntu-latest\n    steps:\n      - run: |\n          echo \"Deprecated. Canonical: static.yml\"\n"
  },
  {
    "path": ".github/workflows/issue-agent-pack-collections.yml",
    "before_sha256": "93573ea61fbf8ee996ab75f13783b11691acbb3ebb49001d6cd3bee8ae22abf9",
    "sha256": "9cb92b2bf85adabd3984a37f0340ca664c9575b6195a5a616c0eab21e1ab028a",
    "before_blob": "aceffbe0f441812dffc34c6f77831ae318d9b017",
    "content_utf8": "name: Issue agent pack NFT collections\n\n# Issues 3 mainnet NFT collections, grants ESDTRoleNFTCreate to agents-marketplace SC,\n# then setPackCollection on the SC. Uses secret SC_DEPLOYER_PEM only.\non:\n  workflow_dispatch:\n    inputs:\n      confirm_mainnet:\n        description: \"Type ISSUE_MAINNET to run on mainnet\"\n        required: true\n        default: \"\"\n        type: string\n      sc_address:\n        description: \"agents-marketplace SC (receives NFTCreate role)\"\n        required: true\n        default: \"erd1qqqqqqqqqqqqqpgqgawa0p5y09f0e68pwaa50zm47jl9jxcwvhxqgdqwsg\"\n        type: string\n      ticker_pulse:\n        description: \"Ticker Pulse (3-10 A-Z0-9)\"\n        required: true\n        default: \"XAIAX\"\n        type: string\n      ticker_yield:\n        description: \"Ticker Yield\"\n        required: true\n        default: \"XAIAY\"\n        type: string\n      ticker_sentinel:\n        description: \"Ticker Sentinel\"\n        required: true\n        default: \"XAIAS\"\n        type: string\n      skip_issue:\n        description: \"If true, only set roles + setPackCollection using provided full ids\"\n        required: false\n        default: \"false\"\n        type: choice\n        options: [\"false\", \"true\"]\n      col_pulse:\n        description: \"Full id if skip_issue (e.g. XAIAX-abc123)\"\n        required: false\n        default: \"\"\n        type: string\n      col_yield:\n        required: false\n        default: \"\"\n        type: string\n      col_sentinel:\n        required: false\n        default: \"\"\n        type: string\n\npermissions:\n  contents: write\n\njobs:\n  issue-and-configure:\n    runs-on: ubuntu-latest\n    timeout-minutes: 40\n    env:\n      SC_ADDRESS: ${{ github.event.inputs.sc_address }}\n      TICKER_PULSE: ${{ github.event.inputs.ticker_pulse }}\n      TICKER_YIELD: ${{ github.event.inputs.ticker_yield }}\n      TICKER_SENTINEL: ${{ github.event.inputs.ticker_sentinel }}\n      SKIP_ISSUE: ${{ github.event.inputs.skip_issue }}\n      COL_PULSE_IN: ${{ github.event.inputs.col_pulse }}\n      COL_YIELD_IN: ${{ github.event.inputs.col_yield }}\n      COL_SENTINEL_IN: ${{ github.event.inputs.col_sentinel }}\n      SC_DEPLOYER_PEM: ${{ secrets.SC_DEPLOYER_PEM }}\n      PROXY: https://gateway.multiversx.com\n      API: https://api.multiversx.com\n      CHAIN: \"1\"\n      ESDT_SC: erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u\n      ISSUE_COST: \"50000000000000000\"\n\n    steps:\n      - uses: actions/checkout@v4\n\n      - name: Mainnet gate\n        run: |\n          if [ \"${{ github.event.inputs.confirm_mainnet }}\" != \"ISSUE_MAINNET\" ]; then\n            echo \"Blocked \u2014 confirm_mainnet must be ISSUE_MAINNET\"\n            exit 1\n          fi\n\n      - name: Write PEM\n        run: |\n          set -euo pipefail\n          test -n \"${SC_DEPLOYER_PEM:-}\"\n          umask 077\n          printf '%s\\n' \"$SC_DEPLOYER_PEM\" > \"${RUNNER_TEMP}/deployer.pem\"\n          if ! grep -q BEGIN \"${RUNNER_TEMP}/deployer.pem\"; then\n            HEX=$(tr -d ' \\n' < \"${RUNNER_TEMP}/deployer.pem\")\n            { echo \"-----BEGIN PRIVATE KEY for deployer-----\"; echo \"$HEX\" | fold -w 64; echo \"-----END PRIVATE KEY for deployer-----\"; } > \"${RUNNER_TEMP}/deployer.pem\"\n          fi\n\n      - uses: actions/setup-python@v5\n        with:\n          python-version: \"3.11\"\n      - run: pip install multiversx-sdk-cli multiversx-sdk\n\n      - name: Resolve deployer address + balance check\n        run: |\n          set -euo pipefail\n          python3 <<'PY'\n          import os, json, urllib.request\n          from multiversx_sdk import UserPEM\n          pem = UserPEM.from_file(os.environ[\"RUNNER_TEMP\"] + \"/deployer.pem\")\n          addr = pem.public_key.to_address().to_bech32()\n          print(f\"deployer={addr}\")\n          with open(os.environ[\"GITHUB_ENV\"], \"a\") as f:\n              f.write(f\"DEPLOYER={addr}\\n\")\n          d = json.load(urllib.request.urlopen(f\"https://api.multiversx.com/accounts/{addr}\"))\n          bal = int(d.get(\"balance\") or 0)\n          print(f\"balance_egld={bal/1e18}\")\n          print(f\"nonce={d.get('nonce')}\")\n          if os.environ.get(\"SKIP_ISSUE\") != \"true\" and bal < 160_000_000_000_000_000:\n              print(\"WARN: balance may be low for 3x 0.05 EGLD issue + gas\")\n          PY\n\n      - name: Issue three NFT collections\n        if: env.SKIP_ISSUE != 'true'\n        run: |\n          set -euo pipefail\n          issue_one() {\n            local NAME=\"$1\" TICKER=\"$2\" OUTVAR=\"$3\"\n            local NAME_HEX TICKER_HEX NONCE LOG HASH TOKEN T\n            NAME_HEX=$(printf '%s' \"$NAME\" | xxd -p -c 256)\n            TICKER_HEX=$(printf '%s' \"$TICKER\" | xxd -p -c 256)\n            T=$(printf '%s' \"true\" | xxd -p -c 256)\n            NONCE=$(curl -sS \"${API}/accounts/${DEPLOYER}\" | python3 -c \"import sys,json; print(json.load(sys.stdin).get('nonce',0))\")\n            echo \"Issuing $TICKER name=$NAME nonce=$NONCE\"\n            LOG=$(mxpy tx new \\\n              --receiver=\"${ESDT_SC}\" \\\n              --pem=\"${RUNNER_TEMP}/deployer.pem\" \\\n              --gas-limit=60000000 \\\n              --value=\"${ISSUE_COST}\" \\\n              --proxy=\"${PROXY}\" \\\n              --chain=\"${CHAIN}\" \\\n              --nonce=\"$NONCE\" \\\n              --data=\"issueNonFungible@${NAME_HEX}@${TICKER_HEX}@${T}@${T}@${T}@${T}@${T}@${T}@${T}\" \\\n              --send \\\n              --wait-result 2>&1) || true\n            echo \"$LOG\" | sed 's/PRIVATE KEY.*//' | tail -40\n            HASH=$(echo \"$LOG\" | grep -oE '[a-f0-9]{64}' | head -1 || true)\n            echo \"issue_tx_$TICKER=${HASH:-none}\"\n            sleep 8\n            TOKEN=$(curl -sS \"${API}/accounts/${DEPLOYER}/tokens?size=50\" | python3 -c \"\n          import sys,json\n          tick='${TICKER}'.upper()\n          items=json.load(sys.stdin)\n          if not isinstance(items,list): items=[]\n          for t in items:\n            c=(t.get('identifier') or t.get('ticker') or '')\n            if c.upper().startswith(tick+'-') or c.upper()==tick:\n              print(t.get('identifier') or c); break\n          \" || true)\n            if [ -z \"$TOKEN\" ] && [ -n \"$HASH\" ]; then\n              TOKEN=$(curl -sS \"${API}/transactions/${HASH}?withResults=true\" | python3 -c \"\n          import sys,json,re\n          d=json.load(sys.stdin)\n          blob=json.dumps(d)\n          m=re.findall(r'${TICKER}-[a-f0-9]{6}', blob, re.I)\n          print(m[0] if m else '')\n          \" || true)\n            fi\n            echo \"resolved_$TICKER=${TOKEN}\"\n            if [ -z \"$TOKEN\" ]; then\n              echo \"Failed to resolve full token id for $TICKER\"\n              exit 1\n            fi\n            echo \"${OUTVAR}=${TOKEN}\" >> \"$GITHUB_ENV\"\n          }\n\n          issue_one \"xArtists Pulse Agent\" \"${TICKER_PULSE}\" COL_PULSE\n          issue_one \"xArtists Yield Agent\" \"${TICKER_YIELD}\" COL_YIELD\n          issue_one \"xArtists Sentinel Agent\" \"${TICKER_SENTINEL}\" COL_SENTINEL\n\n      - name: Use provided collection ids\n        if: env.SKIP_ISSUE == 'true'\n        run: |\n          echo \"COL_PULSE=${COL_PULSE_IN}\" >> \"$GITHUB_ENV\"\n          echo \"COL_YIELD=${COL_YIELD_IN}\" >> \"$GITHUB_ENV\"\n          echo \"COL_SENTINEL=${COL_SENTINEL_IN}\" >> \"$GITHUB_ENV\"\n\n      - name: Grant ESDTRoleNFTCreate to SC\n        run: |\n          set -euo pipefail\n          grant_role() {\n            local TOKEN=\"$1\"\n            local TOKEN_HEX ROLE_HEX NONCE LOG HASH SC_HEX\n            TOKEN_HEX=$(printf '%s' \"$TOKEN\" | xxd -p -c 256)\n            ROLE_HEX=$(printf '%s' \"ESDTRoleNFTCreate\" | xxd -p -c 256)\n            SC_HEX=$(python3 -c \"from multiversx_sdk import Address; print(Address.new_from_bech32('${SC_ADDRESS}').to_hex())\")\n            NONCE=$(curl -sS \"${API}/accounts/${DEPLOYER}\" | python3 -c \"import sys,json; print(json.load(sys.stdin).get('nonce',0))\")\n            echo \"setSpecialRole $TOKEN \u2192 SC nonce=$NONCE\"\n            LOG=$(mxpy tx new \\\n              --receiver=\"${ESDT_SC}\" \\\n              --pem=\"${RUNNER_TEMP}/deployer.pem\" \\\n              --gas-limit=60000000 \\\n              --proxy=\"${PROXY}\" \\\n              --chain=\"${CHAIN}\" \\\n              --nonce=\"$NONCE\" \\\n              --data=\"setSpecialRole@${TOKEN_HEX}@${SC_HEX}@${ROLE_HEX}\" \\\n              --send \\\n              --wait-result 2>&1) || true\n            echo \"$LOG\" | sed 's/PRIVATE KEY.*//' | tail -20\n            HASH=$(echo \"$LOG\" | grep -oE '[a-f0-9]{64}' | head -1 || true)\n            echo \"role_tx=${HASH:-none}\"\n            sleep 6\n          }\n          grant_role \"${COL_PULSE}\"\n          grant_role \"${COL_YIELD}\"\n          grant_role \"${COL_SENTINEL}\"\n\n      - name: setPackCollection on agents-marketplace\n        run: |\n          set -euo pipefail\n          set_col() {\n            local PT=\"$1\" COL=\"$2\"\n            local NONCE LOG HASH\n            NONCE=$(curl -sS \"${API}/accounts/${DEPLOYER}\" | python3 -c \"import sys,json; print(json.load(sys.stdin).get('nonce',0))\")\n            echo \"setPackCollection $PT \u2192 $COL\"\n            LOG=$(mxpy contract call \"${SC_ADDRESS}\" \\\n              --function=setPackCollection \\\n              --arguments \"0x${PT}\" \"str:${COL}\" \\\n              --pem=\"${RUNNER_TEMP}/deployer.pem\" \\\n              --proxy=\"${PROXY}\" --chain=\"${CHAIN}\" \\\n              --gas-limit=12000000 \\\n              --nonce=\"$NONCE\" \\\n              --send --wait-result 2>&1) || true\n            echo \"$LOG\" | sed 's/PRIVATE KEY.*//' | tail -15\n            HASH=$(echo \"$LOG\" | grep -oE '[a-f0-9]{64}' | head -1 || true)\n            echo \"set_col_tx=$HASH\"\n            sleep 5\n          }\n          set_col 01 \"${COL_PULSE}\"\n          set_col 02 \"${COL_YIELD}\"\n          set_col 03 \"${COL_SENTINEL}\"\n\n      - name: Verify on-chain\n        run: |\n          set -euo pipefail\n          python3 <<'PY'\n          import json, urllib.request, base64, os\n          API = \"https://api.multiversx.com\"\n          SC = os.environ[\"SC_ADDRESS\"]\n          for pt, label in [(\"01\", \"pulse\"), (\"02\", \"yield\"), (\"03\", \"sentinel\")]:\n              body = json.dumps({\"scAddress\": SC, \"funcName\": \"getPackCollection\", \"args\": [pt]}).encode()\n              req = urllib.request.Request(API + \"/vm-values/query\", data=body, headers={\"Content-Type\": \"application/json\"})\n              d = json.load(urllib.request.urlopen(req))\n              x = (d.get(\"data\") or {}).get(\"data\") or {}\n              rd = x.get(\"returnData\") or []\n              print(label, \"returnCode=\", x.get(\"returnCode\"), \"data=\", rd)\n              if rd and rd[0]:\n                  print(\"  decoded=\", base64.b64decode(rd[0]).decode(\"utf-8\", errors=\"replace\"))\n          print(\"COL_PULSE\", os.environ.get(\"COL_PULSE\"))\n          print(\"COL_YIELD\", os.environ.get(\"COL_YIELD\"))\n          print(\"COL_SENTINEL\", os.environ.get(\"COL_SENTINEL\"))\n          PY\n\n      - name: Write summary\n        run: |\n          {\n            echo \"## Agent pack collections\"\n            echo \"- Pulse: \\`${COL_PULSE}\\`\"\n            echo \"- Yield: \\`${COL_YIELD}\\`\"\n            echo \"- Sentinel: \\`${COL_SENTINEL}\\`\"\n            echo \"- SC: \\`${SC_ADDRESS}\\`\"\n            echo \"\"\n            echo \"dApp env:\"\n            echo \"\\`\\`\\`\"\n            echo \"VITE_AGENTS_CODEHASH_OK=true\"\n            echo \"VITE_AGENT_PACK_COLLECTIONS=${COL_PULSE},${COL_YIELD},${COL_SENTINEL}\"\n            echo \"\\`\\`\\`\"\n          } >> \"$GITHUB_STEP_SUMMARY\"\n\n      - name: Cleanup PEM\n        if: always()\n        run: rm -f \"${RUNNER_TEMP}/deployer.pem\"\n"
  }
]
```

### Contrôle HTTP : verify\_public\_release.py

```python
import argparse, hashlib, json, re, urllib.request
from urllib.parse import urljoin, urlparse

p=argparse.ArgumentParser()
p.add_argument('--base',default='https://neltud.github.io/xArtists/')
p.add_argument('--source-sha',required=True)
a=p.parse_args()
assert re.fullmatch('[a-f0-9]{40}',a.source_sha)
base=a.base.rstrip('/')+'/'
assert urlparse(base).scheme=='https'
def get(path):
 request=urllib.request.Request(urljoin(base,path),headers={'User-Agent':'xArtists-release-verifier/1','Cache-Control':'no-cache'})
 with urllib.request.urlopen(request,timeout=15) as response:
  assert response.status==200,(path,response.status)
  assert urlparse(response.url).netloc==urlparse(base).netloc,('unexpected redirect',response.url)
  return response.read(),response.headers.get_content_type()
def metadata(path):return json.loads(get(path)[0])
info=metadata('build-info.json');release=metadata('dapp-release.json')
assert info['source_sha']==a.source_sha,(info['source_sha'],a.source_sha)
assert info['lia_live_trading'] is False and release['lia_live_trading'] is False
assert info['public_route_count']==97 and len(release['routes'])==97
assert not any('polylia' in route.lower() for route in release['routes'])
html_files={}
for route in ('','app/','install/','mobile/','wallet/','museum/','directory/'):
 raw,mime=get(route);assert mime=='text/html',(route,mime)
 html=raw.decode();assert 'sites-v3-release' in html,(route,'wrong renderer');html_files[route]=html
scripts=[]
for url in re.findall(r'<script[^>]+src="([^"]+)"',html_files['app/']):
 absolute=urljoin(base,url);assert urlparse(absolute).netloc==urlparse(base).netloc
 raw,mime=get(absolute);assert 'javascript' in mime,(absolute,mime)
 scripts.append(absolute)
assert scripts,'No module entrypoint was served'
manifest=metadata('manifest.webmanifest')
assert manifest['scope']=='/xArtists/' and manifest['start_url']=='/xArtists/'
icons=[]
for path,size in [('icons/icon-192.png',192),('icons/icon-512.png',512),('icons/apple-touch-icon.png',180),('xartists-logo.png',512)]:
 raw,mime=get(path);assert mime=='image/png',(path,mime)
 assert raw[:8]==bytes.fromhex('89504e470d0a1a0a')
 assert int.from_bytes(raw[16:20],'big')==size and int.from_bytes(raw[20:24],'big')==size
 icons.append({'path':path,'sha256':hashlib.sha256(raw).hexdigest()})
raw,mime=get('og-image.png');assert mime=='image/png' and raw[:8]==bytes.fromhex('89504e470d0a1a0a')
sw,mime=get('service-worker.js');assert 'javascript' in mime
assert b'<!doctype html' not in sw.lower()
print(json.dumps({'official_url':base,'source_sha':info['source_sha'],'public_routes':97,'lia_live_trading':False,'module_entrypoints_served':scripts,'icons':icons,'http_smoke':'passed'},indent=2))
```

### Fiche de référencement

```json
{
  "name": "xArtists \u2014 Art & Intelligence",
  "short_name": "xArtists",
  "description": "Discover digital art, explore a 3D museum and access creative tools on MultiversX.",
  "website": "https://neltud.github.io/xArtists/app/",
  "documentation": "https://xartists.gitbook.io/xartists/",
  "repository": "https://github.com/Neltud/xArtists",
  "categories": [
    "Art",
    "NFT",
    "Creative tools"
  ],
  "icon_192": "https://neltud.github.io/xArtists/icons/icon-192.png",
  "icon_512": "https://neltud.github.io/xArtists/icons/icon-512.png",
  "preview_image": "https://neltud.github.io/xArtists/og-image.png",
  "wallet_integration": "WalletConnect / xPortal",
  "release_mode": "paper",
  "lia_live_trading": false,
  "catalogue_submission_status": "not submitted",
  "physical_xportal_pairing_status": "not attested"
}
```

### Preuves locales

```json
{
  "bootstrap_workflow_bytes": 2801,
  "bootstrap_workflow_sha256": "01fe030d314f2b0e27f48b97b881b451445d24f05ca2921e57043d32e711c897",
  "hydrator_source_sha256": "19e488c4ee1cdc7145e33176190b7d352150688f8141b7eee56b2e79abbfc0e0",
  "transport_files_verified": 37,
  "parts_verified": 34,
  "app_sources_unchanged": true,
  "yaml_and_shell": "passed",
  "gitbook_batches_pinned_to": "a6adaf6eec883fffef35d2990508cd35e78d6be0",
  "github_workflow_upload_attempt": "403 Resource not accessible by integration",
  "github_workflow_dispatched": false,
  "public_smoke_test": "passed on the local 97-route build with mocked HTTP; official URL not verified"
}
```
