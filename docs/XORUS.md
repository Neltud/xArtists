# xOrus — essaim d'analyse xArtists (paper only)

**xOrus** est le nouveau nom public de **Chorus**. Le changement de marque n'active aucune capacité financière.

## Contrat de sécurité

- 12 familles × 10 axes = **120 signaux définis**, et non 120 flux en production.
- Sans au moins 12 signaux réellement alimentés et 3 familles indépendantes : **ABSTAIN / thin_tape**.
- Sentinel (risque) conserve son veto ; ChatGPT est une voix consultative plafonnée à **15 %**.
- `executable=false`, `live_trading=false`, `live_locked=true`. Aucune signature, aucun ordre, aucune transaction, aucun déploiement.
- Le fichier public [`xorus_board.json`](../apps/frontend/public/data/xorus_board.json) est une **photographie statique datée**, pas un prix ou un signal temps réel. Vérifier sa date et la provenance avant toute interprétation.

## Compatibilité technique et migration

- Nouvelle entrée Python : `PYTHONPATH=. python -m lia.xorus` ; API : `from lia.xorus import run_xorus`.
- `lia.xorus` délègue temporairement au moteur historique `lia.chorus` en forçant les indicateurs paper/no-execution et en exposant le nom `xorus`.
- `lia.chorus` et `apps/frontend/public/data/chorus_board.json` restent disponibles pour compatibilité ; ne pas supprimer ces alias avant l'inventaire des consommateurs.
- Vellum est retiré du chemin d'exécution. `lia/vellum` reste une archive ; ne pas le réactiver.
- **Dépendance sécurité :** la PR [#513](https://github.com/Neltud/xArtists/pull/513) corrige les données implicites et la pondération externe. Le passage en nom canonique interne, l'unification du CI et le remplacement des fichiers anciens devront intervenir **après sa fusion et validation**. Cette PR de marque ne prétend pas livrer ces correctifs.

## Vérifications avant fusion

1. Exécuter `PYTHONPATH=. python -m unittest tests/test_xorus_alias.py -v`.
2. Exécuter les tests de sécurité et de non-régression du moteur Chorus sur le SHA candidat, **après** intégration de #513.
3. Vérifier l'affichage FR/EN/autres langues et la génération frontend.
4. Vérifier les anciennes intégrations `lia.chorus` et `data/chorus_board.json`, et la nouvelle sortie `engine=xorus`.
5. Ne pas changer les flags commerce/trading/mint ou déclarer `LIVE` du seul fait du changement de nom.

Ancienne description et historique des décisions : [`CHORUS.md`](CHORUS.md).
