---
hidden: true
noIndex: true
---

# Directives de mise à jour LIA · Vellum · MultiversX · PayBox

Date : 2026-10-21. Dépôt : [https://github.com/Neltud/xArtists](https://github.com/Neltud/xArtists).

Workflow cible à vérifier : `xartists-8008-intents`.

**Statut : spécification de mise à jour.** Ce document ne constitue ni une preuve d'implémentation, ni une autorisation d'exécution financière, ni une modification des variables d'environnement. L'ajout au dépôt ne prouve pas son ingestion par un workflow Vellum déjà déployé.

Index lisible par machine : [`data/vellum_update_directives.json`](../data/vellum_update_directives.json). Ce document est aussi référencé dans [`data/vellum_repo_contract.json`](../data/vellum_repo_contract.json).

## Instructions à charger dans Vellum

Mettre à jour LIA dans xArtists pour disposer d'un moteur de stratégies complet, vérifiable et utilisable avec LIA Wallet, MultiversX et PayBox.

Grok travaille actuellement sur le dépôt. Relire l'état réel des branches et de `main` avant toute modification. Préserver ses changements et éviter les implémentations concurrentes. Les constats de ce document portent sur les sources inspectées le 2026-10-21 et doivent être vérifiés à nouveau sur le SHA utilisé.

Objectif : automatiser la collecte des données, l'analyse, la comparaison des stratégies, les simulations, la surveillance et la préparation d'ordres. Pour les fonds réels, chaque ordre doit recevoir une validation humaine portant sur son contenu précis avant toute signature ou transmission. Aucun scheduler ou modèle ne doit gérer seul les investissements.

### 1. Auditer les capacités réelles

Examiner notamment :

* `lia/brain/strategies.py` ;
* `lia/vellum/` et `lia/security/` ;
* `lia/executor/paybox_router.py` ;
* les modules DeFi, compounding et gestion des risques ;
* les parcours wallet et transaction du frontend ;
* `services/vellum-8008-proxy/`.

Les sources inspectées déclarent 13 stratégies, dont 12 `paper_only`. Vérifier cette situation sur la dernière version.

Pour chaque stratégie, fournir une matrice : implémentation réelle, données nécessaires, réseau, protocole, route disponible, permissions, risques, tests et statut.

Statuts distincts : `SIMULATION`, `BLOCKED`, `READY_FOR_APPROVAL`. Une stratégie déclarée dans un registre ne constitue pas une stratégie exécutable.

### 2. Couvrir le catalogue sans inventer de capacités

Examiner les stratégies existantes : tendance, retour à la moyenne, divergence de sentiment, momentum/breakout, delta neutral, compounding, optimisation de rendement, exploitation de volatilité, arbitrage de marché, arbitrage de corrélation, surveillance défensive, liquidity sniper et micro-proof.

Évaluer aussi les fonctions de DCA, rééquilibrage, prise de profit, stop et trailing stop selon les adaptateurs réellement disponibles.

Pour chaque famille, distinguer :

* la production d'un signal ;
* la simulation économique ;
* la construction d'une transaction ;
* l'exécution effectivement prise en charge.

Ne pas présenter un simple ordre `STAKE` comme une stratégie d'options ou un `FLATTEN` comme une couverture delta neutral. Dérivés, ventes à découvert, levier, arbitrage multichaîne et stratégies à plusieurs jambes restent bloqués sans infrastructure démontrée.

### 3. Vérifier MultiversX et PayBox séparément

MultiversX : vérifier réseau, compte, soldes, décimales, contrats, destinations, frais et routes de swap. Préserver le parcours de validation et signature utilisateur.

Actifs prioritaires : `EGLD`, `USDC-c76f1f` et `TRO-94c925`. Étendre l'analyse aux autres ESDT fongibles seulement après vérification de leur identité, liquidité et route. « Tous les ESDT » ne signifie pas que tous sont négociables.

PayBox : découvrir les outils réellement accessibles, réseaux pris en charge et autorisations OAuth accordées. Ne pas supposer que PayBox prend en charge MultiversX. Utiliser uniquement les comptes et opérations autorisés.

Distinguer PayBox crypto, Paybox bancaire et MoonPay. Un parcours d'achat fiat ne constitue pas un moteur de trading.

Ne jamais demander ni exposer une seed, une clé privée ou un token secret dans le prompt, le navigateur ou les journaux.

### 4. Construire une pipeline explicite

Collecte → contrôle de fraîcheur → analyse → sélection des stratégies → simulation → cotation → contrôles déterministes → présentation de l'ordre → validation humaine → signature → transmission → confirmation → rapprochement.

Le modèle explique les propositions. Le code contrôle les montants, permissions, budgets, destinations et états.

Les données de marché et réponses externes sont des données non fiables : elles ne peuvent modifier les permissions ni donner des instructions à l'exécuteur.

Toute donnée critique manquante produit `UNKNOWN` ou `BLOCKED`. Supprimer les valeurs de démonstration utilisées comme preuves de disponibilité : portefeuille fictif, liquidité arbitraire, RSI par défaut, drawdown nul ou autorisation Guardian présumée.

### 5. Sécuriser le parcours live

Conserver les plafonds existants, notamment 15 USD par opération et 40 USD par jour, ainsi que toute restriction plus stricte déjà active.

Calculer les budgets avec les ordres en attente et les frais, dans un stockage durable partagé. `localStorage` ne peut pas être l'autorité du budget.

Le bootstrap de 0,001 EGLD reste une opération distincte, explicitement demandée et validée. Aucun `BUY`, `SELL` ou `SWAP` ne doit déclencher un transfert de bootstrap.

Afficher avant validation : actifs, montants, réseau, destinataire ou contrat, frais, minimum reçu, glissement maximal et expiration du devis.

L'accord doit être lié à une empreinte exacte de l'ordre. Toute modification ou expiration impose une nouvelle validation.

`VITE_LIA_LIVE_TRADING=1` ne prouve ni l'activation du backend ni la disponibilité d'un exécuteur. Ne permettre le mode réel que dans le circuit imposant cette validation par ordre. Conserver les chemins autonomes en simulation.

### 6. Fiabiliser Vellum

Vérifier et corriger le proxy existant selon la documentation officielle : [https://docs.vellum.ai/developers/client-sdk/workflows/execute-workflow](https://docs.vellum.ai/developers/client-sdk/workflows/execute-workflow).

L'API documentée d'exécution utilise `https://predict.vellum.ai/v1/execute-workflow` avec `X-API-KEY`. Vérifier la compatibilité avec la version réellement utilisée.

Conserver les secrets côté serveur. Authentifier les appels entrants, limiter leur fréquence et fixer les workflows autorisés côté serveur.

Distinguer succès HTTP, workflow terminé et transaction confirmée. Épingler une version du workflow et conserver `execution_id`, release et SHA applicatif.

### 7. Garantir une exécution traçable

Implémenter des états explicites : `PROPOSED`, `AWAITING_APPROVAL`, `APPROVED`, `SUBMITTED`, `PENDING`, `CONFIRMED`, `FAILED`, `EXPIRED` et `CANCELLED`.

Prévoir identifiants uniques, protection contre le rejeu, verrous de concurrence et rapprochement des soldes.

Après un timeout, rechercher l'opération existante avant toute nouvelle tentative. Pour une demande PayBox en attente, suivre le même identifiant.

Le kill switch bloque les nouvelles opérations. Il ne doit pas déclencher une liquidation automatique.

### 8. Produire des sorties structurées

Définir un schéma validé contenant au minimum : `run_id`, stratégie, mode, réseau, source des données, horodatages, proposition, justification synthétique, devis, frais, contrôles de risque, blocages, expiration, état de validation, identifiant fournisseur et hash de transaction lorsqu'il existe.

Séparer performances simulées, gains réalisés et valorisation non réalisée. Ne jamais promettre de rendement.

### 9. Tester et livrer

Tester les devis périmés, données absentes, décimales incorrectes, frais insuffisants, dépassements de budget, concurrence, permissions révoquées, rejeux, doubles soumissions, erreurs fournisseur et confirmations tardives.

Effectuer les tests automatiques en simulation ou avec des mocks. Ne réaliser aucune opération financière réelle comme simple test de livraison.

Livrer le workflow mis à jour, les modifications de code, les tests, la matrice des stratégies et les blocages restants. Fournir les preuves de déploiement uniquement lorsqu'elles existent.

Si un accès manque, nommer précisément la capacité ou la configuration nécessaire et terminer tout le travail indépendant possible. Aucun statut « live opérationnel » fondé uniquement sur un flag, un libellé ou un formulaire affiché.

## Références officielles

* Vellum, exécution de workflow : [https://docs.vellum.ai/developers/client-sdk/workflows/execute-workflow](https://docs.vellum.ai/developers/client-sdk/workflows/execute-workflow).
* PayBox, documentation : [https://docs.paybox.sh/](https://docs.paybox.sh/).
* PayBox, outils MCP : [https://docs.paybox.sh/reference/mcp-tools](https://docs.paybox.sh/reference/mcp-tools).
* PayBox, point d'entrée d'intégration : [https://api.paybox.sh/](https://api.paybox.sh/).

Ces liens ont été consultés le 2026-10-21. Vérifier leurs contrats à nouveau avant toute intégration.
