# PR #524 — Checklist de revue et fusion du preprod gate xOrus

**Date:** 12 novembre 2026 · **Portée:** module préproduction *offline* uniquement.  
Cette liste est dérivée du plan A+B fourni, des fichiers réellement présents dans le dépôt et des checks GitHub. Le paquet externe mentionné dans le README ne comprenait **pas** cette checklist dans les fichiers reçus.

## A. Vérifications techniques (dernier SHA vérifié avant ajout de ce document: `3262551f747b8f3dfef6de2aa8909e7c584b1a07`)

- [x] `lia/xorus/preprod_gate.py` existe dans la PR #524; code hors ligne, sans branchement API/marketplace.
- [x] Catalogue : IDs sémantiques et contrôle de 120 entrées; aucune correspondance automatique avec `1..120`.
- [x] Signature de test Ed25519 : clé publique explicitement injectée; attestation liée au digest; pièce de preuve comparée par SHA-256.
- [x] Exemples invalides rejetés : approbations auto-déclarées, pièces absentes, produits/IDs invalides, doublons, chemin sortant du répertoire, champs malformés.
- [x] `commercial = NO_GO` et `commercial_enabled = False` pour tout résultat, y compris un préflight technique réussi.
- [x] CI `xOrus Data preproduction gates` : 8 tests du nouveau module + 6 tests de régression = **14 PASS** au SHA ci-dessus.
- [x] Autres 7 workflows déclenchés sur ce SHA : succès (Regression, AI Code Review & Security Audit, Xorus paper compatibility, xOrus licensed data and physical NFT reward contracts, Rust, Pages deployed smoke, Paybox P0 sandbox review).
- [x] Aucun secret, clé privée, NFT mint, paiement, trading ou transfert TRO introduit par ce diff documentaire + Python/tests/CI.

## B. Conditions restantes avant undraft/merge

- [ ] Relancer/revérifier les workflows sur le **HEAD final** de la PR après cet ajout de checklist.
- [ ] Terminer revue humaine des chemins d'entrée, signature externe, deps et interactions CI (le workflow ne couvre pas le code non testé).
- [ ] Vérifier que la branche cible `main` et les protections de branche sont à jour, et qu'aucun conflit n'est présent.
- [ ] Confirmer que la fusion est exclusivement une livraison technique **PREP/paper** et ne doit pas être interprétée comme un `GO` licences, API commerciale, mint ou trading.
- [ ] Documenter l'approbation de fusion par un mainteneur habilité.

**Règle de décision A:** ne lever le brouillon et ne fusionner #524 qu'après avoir coché explicitement toutes les conditions de B sur le commit final. **Aucune activation commerciale** n'est autorisée à l'issue de la fusion.

## C. Suite B — Decision Agent (PR séparée)

La PR B est basée sur le **tip `main` après fusion de #524** et doit rester séparée:
- `lia/xorus/decision_agent.py`
- `tests/test_xorus_decision_agent.py`
- `docs/XORUS_DECISION_AGENT.md`
- `docs/XORUS_CHAIR_PROMPT_V1.md`
- `.github/workflows/xorus-decision.yml`
- `docs/PR_DECISION_AGENT_BODY.md`

Le README fourni **référence** ces six fichiers mais ne fournit pas leur contenu. Ne pas prétendre avoir repris exactement le code/test de ce pack ni importer `release_gate.py` en parallèle. Le moteur B doit garantir `paper_only`, `executable=false`, `Chair<=15%`, le veto Sentinel, et aucune dépendance/appel à `preprod_gate`.

**Séparation absolue:** `preprod_gate` contrôle les pièces de Data Packs; `decision_agent` évalue les signaux en paper. Pas de fonctions de paiement ni d'exécution dans aucun des deux.
