# xOrus — produit d'analyse et entrées internes

**Décision produit du 13 novembre 2026 : xArtists vend ses analyses.** Les données collectées alimentent le moteur en interne et ne sont pas revendues. Ce fichier conserve son chemin historique pour les liens existants. **PREP / paper : aucun accès payant activé par ce lot.**

## Contrat d’agent ChatGPT
- Objectif : produire nos synthèses, interprétations, scénarios conditionnels et explications des risques à partir d'entrées traçables. Les 120 IDs décrivent un catalogue interne, pas 120 flux en production.
- Workflow borné : 4 lecteurs maximum, 10 s par appel, pas de boucle autonome, aucune mutation ni signature.
- Sources : adaptateurs MultiversX, Polygon, Solana envisagés, à développer et tester ; Artprice et réseaux sociaux requièrent des licences écrites séparées.
- Code livré : `lia.xorus.analysis_report.run_analysis_agent` synthétise les scores de `run_decision_agent` et exporte uniquement `xorus_analysis/v1`. Aucun board interne, prix brut, payload fournisseur ou prompt ne figure dans le rapport client.
- La synthèse est déterministe et offline : aucun appel LLM ni collecteur live n'est ajouté. `source_ts=null`, confiance non chiffrable et zéro signal indépendamment vérifié. La date de génération ne devient jamais une date de source.
- Les anciennes fonctions `data_feed.build_data_pack` et `preprod_gate` restent des outils internes historiques ; leur modèle de redistribution ne régit pas les nouveaux abonnements d'analyse. Ne pas les exposer comme produit client ni réutiliser une validation de Data Pack pour autoriser une analyse commerciale.
- Contrats outils futurs : `xorus_get_analysis` (rapport dérivé autorisé), `xorus_check_access` (entitlement serveur ; deny par défaut), `xorus_explain_analysis` (méthode et limites d'un rapport immuable). Aucun de ces outils MCP n'est connecté.
- Erreurs : abstention si API 401/403/429, horodatage futur/périmé, NaN, licence expirée, attestation absente, timeout. Pas de fallback de données simulées présentées comme live.

## Monétisation — non activée
| Produit | Condition |
| --- | --- |
| Découverte | Aperçu public paper, couverture et limites, sans wallet |
| Pack d'accès NFT xOrus | Accès à nos analyses ; possession sur la bonne chaîne et droits de service vérifiés côté serveur |
| Abonnement aux analyses xOrus | Nos synthèses, scénarios et évaluations de risque ; identité, PSP, quota, expiration et révocation côté serveur |

Pulse couvre l'analyse des marchés, Yield les scénarios DeFi et Sentinel les risques. La fréquence, les quotas, le périmètre de chaque offre et les conditions commerciales restent à finaliser ; aucune promesse de performance ou de livraison live n'est créée.

L'usage interne et la production d'analyses commerciales doivent respecter les droits accordés pour chaque source ; l'absence de revente brute n'établit pas ces droits. Le registre des licences et les preuves restent côté serveur. La possession d'un NFT ou d'un abonnement ne crée pas une licence fournisseur. La permission de redistribuer un feed est un périmètre distinct, hors de l'offre actuelle.

## Rapport et aperçu public

Le rapport porte un digest SHA-256 du **contenu dérivé**, un verdict, huit rôles avec leurs lectures, la couverture et les conditions de réévaluation. Le digest permet d'identifier le contenu ; il n'atteste pas la vérité des sources, une signature ou un droit d'accès.

`apps/frontend/public/data/xorus_analysis_preview.json` est généré avec **zéro entrée**. Un test Python vérifie sa parité exacte avec le générateur et le frontend valide son contrat avant affichage. Les rapports payants ne devront jamais être écrits dans le répertoire public : leur service nécessite encore authentification, entitlements et stockage privé.

Pour vérifier : `python -m unittest discover -s tests -p 'test_xorus_analysis_report.py' -v` et `node --test apps/frontend/tests/xorus-analysis-readout.test.mjs`.

Retour arrière : retirer le panneau `XorusAnalysisReport` et son aperçu public, puis revenir au commit précédent. Aucun schéma de base, secret, paiement ou contrat n'est modifié.

## Récompense artiste — 1 TRO par NFT physique créé
L’ancienne règle first_sale du code legacy reste **à migrer/désactiver avant distribution**. Le déclencheur demandé est le mint d’un véritable NFT physique xArtists, avec reçu MultiversX finalisé, droits artiste, identifiant physique, minter autorisé, anti-doublon, cap et réserve contrôlée. lia.xorus.physical_rewards.evaluate_physical_mint émet seulement un **candidat d’une unité TRO** ; payout_status=not_paid et transfer_authorized=false. Le ledger transactionnel et le transfert exigent une implémentation distincte, une revue et une signature humaine.

## Labo et parcours utilisateur
Studio → /lab?view=3d (4–36 photos ou MP4, aperçu local) → /digital-twin (échelle et photogrammétrie COLMAP) → GLB UV vérifié par hash → IPFS redondant → mint signé humain → reçu → éligibilité TRO. Une animation photo n’est pas un mesh métrique.

## Critères GO
Tests offline et CI, provenance et licence, intégration du vérificateur signé, stockage durable idempotent, facturation/entitlements, pilotes testnet puis mainnet sous contrôle humain. LIA et Vellum restent des chemins internes legacy jusqu’à la migration de leurs consommateurs ; pas de suppression aveugle.
