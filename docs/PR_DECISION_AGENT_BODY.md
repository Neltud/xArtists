# PR B — xOrus Decision Agent (paper-only) : projet de description

## Pourquoi

Ajouter une couche de revue bornée à l'essaim xOrus sans altérer le scoreur historique, ni connecter le contrôle de licences Data Pack. Les signaux absents continuent à valoir `no_input` ou `defined_unfed`, jamais une observation fictive.

## Changements

- `lia/xorus/decision_agent.py` : wrapper hors ligne autour de `run_xorus`. Masque les champs d'exécution et les briefs cachés dans `market`, n'accepte que `chair_brief` explicitement fourni.
- Contrôle du Chair : avis formaté (3 faits sourcés + 1 risque), pondération au plus 15 %. Citations **non attestées**, aucune transmission des textes au scoreur.
- Contrôle Sentinel conservateur : un risque réellement scoré ≤ −0,35 ou `operator_halt=True` impose `ABSTAIN / sentinel_veto`.
- Tape maigre : moins de 12 **signaux core scorés** ou 3 familles indépendantes impose `ABSTAIN / thin_tape`, sans faire compter l'externe.
- `tests/test_xorus_decision_agent.py`, documentation du contrat d'entrée et brief v1, workflow offline sans publication.

## Compatibilité

- Module B indépendant de `lia/xorus/preprod_gate.py` (PR A #524).
- Conservation de `lia.chorus` pour compatibilité.
- Sortie purement pédagogique `mode=paper_only`, `executable=false`, `live_trading=false`, aucune signature, mint, paiement, transfert, déploiement ou licence commerciale.

## Vérification

Voir `.github/workflows/xorus-decision.yml`, les 3 suites de tests unitaires (Decision Agent, Chorus safety, xOrus alias). Aucun test ne constitue un certificat de licence, une preuve de flux live ou un accès au wallet.

## Ordre de fusion

Cette PR doit rester **draft et empilée sur #524** tant que le HEAD de #524 n'est pas fusionné. Puis rebaser ou retargeter sur `main`, vérifier le SHA effectivement en base, et obtenir revue humaine explicite. Pas de mode live.
