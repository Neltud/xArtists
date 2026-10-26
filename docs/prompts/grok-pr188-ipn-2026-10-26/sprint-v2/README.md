---
hidden: true
noIndex: true
noRobotsIndex: true
---

# Sprint V2 — coordination et correctifs vérifiés

**Instruction de Nelson : poursuivre le sprint de la PR #188 en respectant la propriété exclusive de chaque chemin, la relecture du tip et les GO humains.**

**Protocole de coordination prioritaire**

Le kit V1 et son manifeste restent la source active pour le réalignement des trois fichiers réservé à Grok. La présente V2 regroupe les résultats de vérification, les régressions HTTP signées et la proposition d'intégration suivante. Elle n'ordonne pas l'application simultanée d'une deuxième version sur les mêmes chemins.

| Chemin ou action                                     | Responsable actuel          | Travail de ChatGPT                                                |
| ---------------------------------------------------- | --------------------------- | ----------------------------------------------------------------- |
| `services/access-api/src/server.mjs`                 | Grok, écriture exclusive V1 | Vérifier le SHA et tester ; correctif V2 proposé sans application |
| `.github/workflows/static.yml`                       | Grok, écriture exclusive V1 | Vérifier le SHA                                                   |
| `.github/workflows/issue-agent-pack-collections.yml` | Grok, écriture exclusive V1 | Vérifier le SHA                                                   |
| `services/access-api/tests/payments.test.mjs`        | Contenu V1 déjà correct     | Vérification uniquement ; aucune réécriture                       |
| Régressions HTTP signées et proposition V2           | ChatGPT, préparation locale | Sources et preuves ci-dessous ; pas de push annoncé               |
| Body de PR, plan d'intégration et documentation      | ChatGPT                     | Préparation, tentative de mise à jour et lecture de retour        |

Avant chaque écriture, relire le tip. **Un chemin a un seul agent qui écrit ; l'autre vérifie les empreintes. Aucun merge, déploiement, paiement réel ou transaction sans GO humain.** Après 20/20 V1 vérifiés, faire revoir l'intégration proposée et réattribuer explicitement les chemins V2 qui chevauchent le lot Grok. Le transport ne crée pas de commit et ne pousse rien.

**État réellement vérifié le 26 octobre 2026**

| Référence distante examinée                | Résultat constaté                                                                                                   |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| `a23de0e7e36bb121f63e84b724dc118fb1c7bbe3` | 16 fichiers sur 20 identiques au kit V1 ; API 40/40 ; main non intégré                                              |
| `2796316ca7d046d6c1be674ba421cbef260f1a52` | Seul le test de paiement change ; import `request` inexistant ; API 36 réussis, 1 échec                             |
| `615849a95fc89a076668087ca1a856bad6423656` | Test de paiement restauré exactement ; 17/20 fichiers V1 ; API 40 réussis, 1 échec sur l'introspection serveur      |
| `f457309f851d9ce5cdd3d41e4575e2ed54647927` | Fallback Pages conservé ; workflow encore différent de l'empreinte annoncée : il vise un fichier de test inexistant |

La PR [#188](https://github.com/Neltud/xArtists/pull/188) est ouverte, non draft, sans description et en conflit lors de cette lecture. Les résultats ci-dessus sont attachés aux SHA indiqués, pas à une future tête de branche. Les tests API de `615849a` ont été exécutés sur un snapshot épinglé ; le commit `f457309` ne change que le workflow. Les contrôles GitHub du candidat V2 restent à exécuter après son vrai push.

Trois fichiers V1 restent différents à `f457309` : `.github/workflows/static.yml`, `services/access-api/src/server.mjs`, `.github/workflows/issue-agent-pack-collections.yml`. Le sprint ajoute aussi des corrections fonctionnelles et des tests de régression, au-delà de ces trois fichiers.

**Correctif V2 prêt et testé**

Le candidat intègre le code de main `05fe13bacf5d041c281dc303521702aa5c0ec7bd`, conserve ses routes et son fallback, et apporte **22 fichiers cibles**. Le transport réutilise les blobs publics existants ; neuf fichiers de correction sont aussi fournis intégralement pour une reprise par API. La liste des neuf est une référence de contenu : certains peuvent déjà être copiés par Grok au moment de la lecture.

* IPN : lire le corps HTTP exact ; refuser les sources contradictoires, préserver l'erreur 413, détecter les doublons après décodage des noms et exiger un montant entier sûr.
* Session : obtenir le challenge du serveur, faire signer le message par le signataire xPortal existant, puis vérifier une seule fois la preuve complète. Refuser les preuves partielles, sessions expirées et mauvais sujets ; aucun essai automatique répété après refus de signature.
* API : restaurer les deux formats d'introspection, le secret JWT suffisamment long, l'authentification avant checkout et la limitation MoonPay fondée sur le socket plutôt que sur un en-tête client falsifiable.
* CI : corriger le chemin du contrôle Python et l'indentation du workflow manuel ; conserver les workflows de déploiement désactivés et la CI de revue sans secret de paiement.

Sous **Node 20.20.2**, les validations locales donnent **53 tests API + 29 tests frontend + 7 régressions Python Paybox + 5 contrôles de trading = 94 réussites, zéro échec**. Build de production, routes, traductions, rendus et mobile passent aussi. Les nouvelles régressions échouaient avant correction : quatre cas HTTP et cinq cas de session. Ces résultats locaux ne constituent pas un résultat CI distant.

Le commit de transport `afeff287d93a1232ea110adb6f3f51e9ef152e1b` est un artefact local préparé avant le dernier protocole et n'est pas un SHA poussé. Son arbre vérifié est `7371204d22f6cb40695dc47c4037d15d98fa540c`. L'exécuteur actuel vérifie cet arbre et affiche les parents proposés selon les références distantes relues. Il ne crée aucun nouveau commit et n'applique aucune intégration.

**Mission actuelle de Grok**

1. Relire la tête de PR et le main distants. Ne pas déduire l'état du dépôt d'un message de commit ou d'une capture.
2. Réaligner uniquement ses trois fichiers réservés sur les sources V1 et leurs SHA-256, sans réécrire `payments.test.mjs`.
3. Relire les 20 blobs distants et rendre le SHA du tip réellement observé ainsi que le nombre exact de correspondances. « Je pousse » n'est pas une preuve de push.
4. ChatGPT vérifie le résultat et fournit les tests HTTP et le plan ci-dessous. Aucun agent n'applique le lot V2 ou ne fusionne avant le GO humain et l'accord sur les propriétaires des chemins.

**Vérifier la proposition V2 sans l'appliquer**

Récupérer le transport avec le chargeur ci-dessous. Utiliser Python 3.9+ et Git dans un checkout autorisé de `Neltud/xArtists`. Si un garde bloque, rapporter le chemin et examiner le nouveau contenu avant de réviser le kit. Le résultat décrit une proposition à deux parents après intégration, pas un commit effectivement créé ou poussé. Après un futur GO, il faudra relire les références, appliquer l'intégration autorisée puis vérifier la CI sur le vrai SHA distant.

**Périmètre : revue et fixtures seulement. Pas de merge de la PR vers main, de déploiement applicatif, de paiement réel, de transaction blockchain, de mint ni de déclenchement manuel de workflow.** Les drapeaux du build restent `VITE_LIA_LIVE_TRADING=0` et `VITE_PAYBOX_ENABLED=false`. Les tests de signature utilisent des données factices et n'ouvrent aucune session réelle chez MoonPay.

**Exécution depuis un checkout**

Remplacer uniquement `/chemin/absolu/vers/xArtists` par le chemin du checkout. Le chargeur écrit un dossier de vérification neuf, vérifie le contenu reçu de GitBook et affiche le plan. Il ne crée pas de commit et n'envoie rien.

````bash
python3 - /chemin/absolu/vers/xArtists <<'PY'
import base64, hashlib, json, pathlib, re, subprocess, sys, tempfile, urllib.request
url = "https://xartists.gitbook.io/xartists/prompts/grok-pr188-ipn-2026-10-26/sprint-v2/transport.md"
expected = "e99cdd34ee2b5d1e2bab3fc3a858cd7bf09c58d1823fc8f128a2a9e8fdad0d20"
request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
with urllib.request.urlopen(request, timeout=30) as response:
    markdown = response.read().decode()
blocks = re.findall(r"```json\s*\n(.*?)\n```", markdown, re.S)
payloads = [json.loads(block) for block in blocks]
payload = next(item for item in payloads if item.get("format") == "xartists-pr188-transport/v2")
canonical = json.dumps(payload, sort_keys=True, ensure_ascii=False, separators=(",", ":")).encode()
assert hashlib.sha256(canonical).hexdigest() == expected, "transport SHA mismatch"
manifest = payload["manifest"]
executor = payload["executor"]["content"].encode()
bundle = base64.b64decode(payload["bundle"]["base64"], validate=True)
assert hashlib.sha256(executor).hexdigest() == manifest["executor_sha256"]
assert hashlib.sha256(bundle).hexdigest() == manifest["bundle_sha256"]
assert len(bundle) == manifest["bundle_bytes"]
folder = pathlib.Path(tempfile.mkdtemp(prefix="xartists-pr188-v2-", dir=".")).resolve()
(folder / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
(folder / "execute_sprint.py").write_bytes(executor)
(folder / "sprint-v2.bundle").write_bytes(bundle)
repo = pathlib.Path(sys.argv[1]).resolve()
command = [sys.executable, str(folder / "execute_sprint.py"), str(repo)]
subprocess.run(command, check=True)
print("Vérification terminée. Aucun commit, merge ou push ; intégration soumise au GO humain.")
PY
````

**Contenu intégral et procédure alternative**

* [Sources API et vérification IPN](sources-api.md)
* [Sources session, tests frontend et paiement](sources-session.md)
* [Sources workflows et preuve de validation](sources-ci.md)
* [Manifeste des 22 fichiers](manifeste-v2.md)
* [Transport Git vérifié](transport.md)
* [Validations, reprise API et description de PR](validation-et-pr.md)
* [Note partagée de coordination](coordination.md)

**Coordination des outils**

Le connecteur GitHub de cette session lit le dépôt mais les écritures et la modification de description renvoient `403 — Resource not accessible by integration`. Aucun push du candidat V2 ni changement de PR n'est donc annoncé par cette session. Aucun onglet Grok ni adaptateur de conversation autorisé n'est disponible ici : cette page est le message de reprise à ouvrir dans la conversation Grok de Nelson.

La vérification est déterministe : lecture des références, contrôle des sources et préparation d'un plan. L'application puis la relecture et la CI constituent une étape ultérieure soumise au protocole humain. Aucun appel à un modèle OpenAI, achat MoonPay ou portefeuille utilisateur n'est nécessaire. Token Terminal n'est pas une source utile à ce correctif d'authentification.
