# xOrus Decision Agent — paper board v0.1.0

**Statut : PREP / offline / no execution.** Ce module est un adaptateur de prudence au-dessus de `lia.xorus.swarm.run_xorus`. Il n'importe pas `lia.xorus.preprod_gate` et ne vérifie aucun abonnement, portefeuille ni contrat de licence.

## Modèle

- Catalogue existant : **12 familles × 10 axes = 120 signaux définis**; un signal défini n'est pas une observation réelle.
- Une entrée `market` est un dictionnaire de simulation, dont les valeurs sont **non vérifiées**. Le module ne collecte pas de données réseau, ne valide pas une propriété NFT et ne fabrique pas un flux live.
- Les champs marchands, `LIA_LIVE_TRADING`, les clés de signature, la demande de mint ou les briefs injectés dans `market` sont ignorés.
- **Chair** : seule l'argumentation explicite `chair_brief` est étudiée. Format obligatoire : `stance` parmi `abstain|flat|long|short`, `confidence` numérique fini dans [0,1], exactement trois faits ayant `text` et `source_ref`, un `risk` concret. Même conforme, la citation est **non vérifiée**. Sans format valide : aucune voix consultative.
- **Pondération :** au plus 15 % du score total provient du Chair, conformément au moteur historique ; les faits textuels ne sont pas transmis au moteur.
- **Sentinel :** veto si un signal `risk.*` réellement scoré est inférieur ou égal à −0,35 ou si `operator_halt is True`. Le veto est conservateur : une moyenne positive d'autres risques ne masque pas un risque sévère isolé.
- **Thin tape :** moins de **12 signaux scorés hors famille `external`** ou moins de **3 familles core** : `ABSTAIN`. La voix Chair ne devient ni source réseau ni famille indépendante.
- **Verrou de provenance :** tous les signaux calculés à partir de `market` sont des scores **simulés/non attestés**. Ce module ne dispose d'aucune attestation indépendante et publie toujours `verified_core_signals=0` et `verified_independent_families=0`. Même si de futurs scoreurs produisaient 12 scores simulés dans 3 familles, le statut resterait `ABSTAIN / unverified_tape` au lieu d'un biais de marché. Un futur connecteur devra justifier ses preuves séparément et ne peut pas contourner cette barrière via le payload.
- Sortie `decision.stance` et `board.crosscut.stance` cohérentes. Statut strictement `paper_only`; `executable=false`, `live_trading=false`, `signing_authorized=false`, `trade_authorized=false`, `mint_authorized=false`, `transfer_authorized=false`.

## Exemple local (aucun secret)

```bash
PYTHONPATH=. python - <<'PY'
from lia.xorus.decision_agent import run_decision_agent
import json
print(json.dumps(run_decision_agent(), indent=2, ensure_ascii=False))
PY
```

L'exemple renvoie `ABSTAIN / thin_tape` en l'absence de données. Il n'ouvre aucun compte, ne lance aucun appel externe et ne déclenche aucune transaction.

## Contrat source et limites

Ce moteur est **délibérément distinct** du `preprod_gate` historique. Il n'atteste ni une licence fournisseur ni un droit d'accès client. Son mode `paper_only` est conservé dans la nouvelle sortie d'analyse.

## Sortie client : nos analyses

Décision produit du 13 novembre : les données collectées sont des entrées internes. Les abonnements et packs d'accès portent sur nos analyses, sans revente de données brutes.

`lia.xorus.analysis_report.run_analysis_agent(market=..., chair_brief=..., now=...)` appelle ce moteur, puis construit une projection `xorus_analysis/v1` : interprétations qualitatives par agent et famille, couverture, verdict, conditions de réévaluation et limites. Les contradictions sont conservées ; une absence d'entrée reste `no_input`. Les valeurs brutes et scores numériques, le board, les citations textuelles du Chair et les prompts ne sont jamais copiés dans cette projection.

Ce travail de synthèse est déterministe, sans collecteur ni modèle connecté. `confidence=null`, `source_ts=null` et les signaux indépendamment vérifiés restent à zéro. Le SHA-256 identifie uniquement le contenu du rapport, sans preuve d'authenticité ou d'entitlement. L'aperçu public est volontairement généré sans données ; la livraison privée des analyses commerciales reste à construire.

Voir [le produit et ses limites](XORUS_DATA_BROKER_RELEASE.md).

## Cycle serveur de collecte et d'analyse

`lia.xorus.analysis_cycle` ajoute un collecteur distinct du moteur : un seul GET
vers l'endpoint public Binance Spot, fixé à `EGLDUSDT`, `1h`, 49 bougies maximum.
La documentation fournisseur décrit ce format dans
[Kline/Candlestick data](https://github.com/binance/binance-spot-api-docs/blob/master/rest-api.md#klinecandlestick-data).
Le collecteur n'utilise aucun compte, clé API ou endpoint de trading.

Les heures doivent être consécutives, sans doublon, avec OHLC et volumes cohérents.
La bougie en cours est exclue. Au moins 25 bougies clôturées et une dernière
observation âgée de 65 minutes au plus sont nécessaires. Une erreur, un refus
ou une série périmée produit zéro entrée ; aucun ancien résultat n'est substitué.

Les entrées internes dérivées sont les variations de clôture à 1 h et 24 h,
le RSI sur la moyenne arithmétique des gains/pertes de 14 heures (sans lissage
Wilder), le VWAP des volumes quote/base sur 24 heures, le volume de la dernière
heure comparé à la moyenne des 24 heures précédentes et le repli depuis le plus
haut des 24 dernières heures clôturées. Un dénominateur nul laisse l'indicateur
absent ; il ne crée pas de RSI neutre. Tous les prix sont en USDT, sans hypothèse
de parité avec USD. Six indicateurs au plus, issus d'une seule place de marché,
ne représentent ni six sources indépendantes ni 120 signaux alimentés.

`GET /v1/xorus/analysis` exécute ce cycle et renvoie une projection publique
`xorus_analysis/v2` : conclusions par agent, horodatages et état de collecte,
sans valeurs brutes, bougies, scores, texte fournisseur ou prompt. Le moteur
reste déterministe et paper ; les rôles ne sont pas présentés comme huit appels LLM.
`independently_verified_signals=0`, `commercial_enabled=false` et `ABSTAIN`
restent obligatoires. Ce point d'accès n'accorde aucun accès payant et ne vérifie
pas de licence d'exploitation commerciale.

Le worker possède une limite de huit secondes et de 32 Kio de sortie. Il ne
reçoit pas les secrets API, PSP ou base de données. Les requêtes concurrentes
partagent un seul cycle ; le cache dure au plus 60 secondes en cas de collecte
valide et respecte le délai fournisseur en cas de limitation (60 à 3 600 secondes).
Les paramètres client ne peuvent changer ni source, ni symbole, ni horloge.
Le même contrat valide le rapport dans l'API et le navigateur, et l'API contrôle
son digest de contenu sans l'assimiler à une preuve d'authenticité.

Les deux images API embarquent Python et le moteur. L'image autonome se construit
depuis la racine du dépôt :
`docker build -f services/access-api/Dockerfile .`. Compose utilise ce contexte.
La désactivation immédiate passe par `XORUS_ANALYSIS_ENABLED=0` côté API ; la
route répond alors 503. Un retour au commit précédent retire ce collecteur.
Le frontend configuré avec `VITE_ACCESS_API_BASE` n'utilise jamais l'ancien aperçu
statique lors d'une panne serveur. Sans API configurée, cet aperçu reste hors ligne.

Cette implémentation ne prouve pas que l'image est déployée ni que le fournisseur
est joignable depuis l'hébergeur. La livraison privée des analyses payantes,
les autres sources et leurs droits d'exploitation restent à connecter.

Les 120 IDs ne signifient pas 120 fournisseurs, et les 12 familles ne signifient pas que 12 familles ont des observations. Le moteur historique n'implémente actuellement qu'une petite sélection de scoreurs. Tant que le seuil de signaux vérifiables n'est pas franchi, il abstient. Ajouter de vrais adaptateurs exige preuve de fraîcheur, provenance, licence et tests supplémentaires — aucun auto-fallback de simulé à live.

## Tests & CI

```bash
PYTHONPATH=. python -m unittest discover -s tests -p 'test_xorus_decision_agent.py' -v
PYTHONPATH=. python -m unittest discover -s tests -p 'test_chorus_paper_safety.py' -v
PYTHONPATH=. python -m unittest discover -s tests -p 'test_xorus_alias.py' -v
```

Workflow dédié : `.github/workflows/xorus-decision.yml`. Il ne dispose que de `contents: read` et ne déploie rien.

## Livraison

PR B **empilée sur la branche de la PR #524** tant que cette dernière est en brouillon; après validation et fusion de #524, retargeter B sur `main` et vérifier tous les tests sur le SHA de base réel. Le plan original fait référence à une archive `xorus_integration` non fournie ici : cette implémentation est nouvelle et alignée sur le code courant du dépôt, pas une reproduction alléguée du pack manquant.
