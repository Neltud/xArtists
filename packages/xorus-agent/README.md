# xOrus Agent — analyses xArtists (PREP)

Le produit commercial porte sur **nos analyses** : synthèses, interprétations des agents, scénarios conditionnels et explications des risques. Les données collectées servent d'entrées internes ; aucun flux fournisseur ni dump d'observations n'est vendu.

## Implémentation locale

`lia.xorus.analysis_report.run_analysis_agent` produit `xorus_analysis/v1` à partir du moteur décisionnel existant. La sortie est une projection explicite : lectures qualitatives par famille, couverture, verdict, conditions de réévaluation et limites. Les valeurs brutes, réponses fournisseurs, faits textuels du Chair et prompts ne sont pas exportés.

Le moteur est déterministe, offline et `paper_only` ; il ne lance pas huit appels LLM. La date de génération n'est pas une date fournisseur. Une entrée absente produit `no_input`, jamais un sentiment neutre, une confiance chiffrée ou une recommandation inventée. Sentinel conserve son veto, le Chair reste consultatif et la synthèse s'abstient sans provenance attestée.

`PYTHONPATH=. python -m lia.xorus.analysis_report` génère un aperçu sans entrée de marché. Le fichier public `xorus_analysis_preview.json` est un aperçu de ce format **sans données**, pas un rapport client payant ou une preuve de collecte active.

## Interface MCP envisagée — pas de serveur connecté

- xorus_get_analysis : lire un rapport dérivé autorisé, ses limites et son identifiant immuable ; aucune réponse fournisseur brute.
- xorus_check_access : deny par défaut ; propriété NFT ou abonnement vérifiés côté serveur, avec expiration, quotas et révocation.
- xorus_explain_analysis : expliquer la méthode, les risques et la couverture d'un rapport donné.

Ces noms sont des contrats futurs, pas des outils installés. L'ancien `xorus_get_signals` n'est pas une interface commerciale client. `data_feed.build_data_pack` et `preprod_gate` restent des utilitaires internes historiques et ne constituent pas le nouveau produit d'analyse.

Une intégration ultérieure restera bornée à quatre lectures de sources, avec budget et timeout. Les résultats fournisseurs ne sont jamais des instructions. Adaptateurs réels, droits d'usage pour l'analyse commerciale, authentification et livraison privée restent à construire. La vente d'une analyse dérivée ne présume pas l'autorisation d'utiliser commercialement une source.

Référence : docs/XORUS_DATA_BROKER_RELEASE.md.

## Connexions et gouvernance (11 novembre 2026)

- Frontend : [xOrus paper](https://xartists.art/intelligence/xorus/). Routes historiques `/lia` en compatibilité.
- Sources externes : vérifier pour chaque fournisseur les droits d'usage pour nos analyses et les délais de fraîcheur ; ne pas transformer un catalogue de 120 signaux définis en 120 valeurs présumées.
- Backend plugin : aucun secret, token API ou clé propriétaire dans le package navigateur ; JWT d'accès et droits payants doivent rester vérifiés sur le serveur.
- La Marketplace NFT, l'IPFS Studio et Google Drive sont des **systèmes séparés** de xOrus. Aucun connecteur agent ne peut activer un mint, un pin, un trade ou un paiement.
