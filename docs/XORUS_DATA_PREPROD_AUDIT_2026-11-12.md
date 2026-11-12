# xOrus Data — revue des kits de préproduction (12 novembre 2026)

**Statut : PREP uniquement / NO-GO commercial.** Cette note ne constitue ni une certification de sécurité, ni une autorisation contractuelle. Aucune fonctionnalité de paiement, distribution TRO, mint NFT, trading ou connexion propriétaire n'est activée par cette PR.

## Kits examinés hors dépôt

Deux archives de préproduction ont été inspectées localement :
- une API FastAPI démo, un registre de licences par ID, un contrôle de publication ;
- un simulateur CLI hors ligne, une matrice des droits, un contrat API cible et des documents d'audit.

Tests initiaux : 9 tests API/contrôle de publication et 10 tests CLI (plus 9 sous-tests). Les deux outils refusaient par défaut les accès aux données; aucune valeur source ni licence fournisseur n'était présente.

## Écart bloquant 1 : anciens IDs numériques

Les archives utilisaient des *emplacements* 1..120, sans valeur ni définition. Le dépôt dispose déjà des **120 signaux sémantiques** dans `lia/chorus/catalog.py`, réexportés via `lia/xorus/catalog.py` : par exemple `price.ret_1h` et `onchain.nft_mints`. Il ne faut **pas** connecter les CSV numériques à `lia/xorus/data_feed.py` sans migration validée. Les anciens IDs ne prouvent l'existence d'aucun flux.

## Écart bloquant 2 : faux positif GO démontré

Le script `tools/check_release.evaluate` livré dans **l'archive API, non dans ce dépôt** pouvait retourner `(True, [])` si l'on fournissait de simples flags `approval=true`, un faux fournisseur, un hash de 64 caractères hexadécimaux, une référence de licence fictive et des dates plausibles. Il ne vérifiait pas les octets de preuve, les signatures indépendantes ni l'existence d'un contrat.

Une refonte locale séparée du kit de démonstration a ajouté :
- les IDs sémantiques canoniques, sans données observées inventées ;
- la vérification SHA-256 des **octets** des preuves enregistrées ;
- une attestation externe Ed25519 signant le digest des données de release **et sa date d'expiration** ;
- le refus d'identifiants inconnus, doublons, timestamps sans fuseau et licences non prouvées ;
- des tests démontrant qu'une approbation auto-déclarée n'est pas suffisante.

**Résultat local après consolidation : 27 tests réussis et 9 sous-tests**, gate intentionnellement `NO_GO`. Le kit consolidé n'est **pas intégré ni déployé** par cette note documentaire.

## Évaluation du flux existant

`lia/xorus/data_feed.py` accepte uniquement des observations qui satisfont les politiques `trusted_providers` qu'un **backend de confiance doit fournir**. La vérification de la forme d'un `proof_sha256` n'établit pas, à elle seule, la provenance des octets ni le droit de redistribution du fournisseur. **Ne jamais fournir `trusted_providers` depuis un prompt, une requête front-end ou un compte client.**

Le refus commercial restera nécessaire jusqu'à preuve externe et indépendante des licences, des flux, des droits sur les dérivés et de l'autorisation d'usage pour chaque produit (abonnement, API, NFT Data Pack, IA).

## Gates obligatoires avant intégration

1. Contrôler la parité du catalogue au SHA réellement publié, sans conversion implicite `1..120`.
2. Conserver hors des chemins publics le registre des contrats fournisseurs et les documents privés. Les archives source contiennent des références à des documents Drive privés : ne pas les copier aveuglément dans un dépôt public.
3. Configurer des clefs publiques de release épinglées dans un environnement CI protégé; clés privées de signature hors dépôt.
4. Connecter des preuves source réelles, des licences vérifiées, un moteur d'entitlement côté serveur (walletless et wallet lié), expiry/révocation, audit et quotas.
5. Tester le scénario de métadonnées fabriquées **NO-GO**, le défaut de licence, les sources périmées et les droits NFT absents.
6. Passer par une revue sécurité et juridique séparée avant toute mise en production.

**Décision recommandée :** conserver la PR en *draft* jusqu'à intégration et tests de sécurité reproductibles. Aucun merge/deploy automatique sur la base de cette note.


## Mise en oeuvre additionnelle dans la PR #524

Le dépôt dispose désormais de `lia/xorus/preprod_gate.py`, un **préflight purement hors ligne** qui :
- compare chaque ID au catalogue sémantique dynamique de `lia.xorus.catalog` ;
- vérifie les octets des pièces de preuve sous une racine limitée, leur SHA-256 et la validité temporelle ;
- refuse un ID numérique historique, un doublon, un produit non autorisé, des champs malformés et tout flag financier actif ;
- contrôle une attestation Ed25519 indépendante couvrant les registres et sa date d'expiration (clé publique fournie uniquement par une configuration de confiance) ;
- retourne **commercial = NO_GO dans tous les cas**, même si son préflight technique passe : seule une revue humaine et une intégration serveur distincte pourront envisager une offre commerciale.

Tests : `tests/test_xorus_preprod_gate.py` avec un simulateur de signature éphémère, faux justificatifs, traversée de répertoire, flags interdits, IDs legacy et entrées malformées. CI en lecture seule : `.github/workflows/xorus-data-preprod.yml`. Ces vérifications ne délivrent aucun entitlement et n'émettent aucune transaction.

**Limites :** ce nouveau module n'est pas branché sur la dApp, l'API, la blockchain ou un backend commercial. Le kit d'archives complet reste hors dépôt. Une signature apposée sur des documents fictifs peut prouver leur intégrité technique sans prouver les droits légaux : le préflight ne s'annonce jamais comme un certificat de licence. Cette PR reste en **draft**.
