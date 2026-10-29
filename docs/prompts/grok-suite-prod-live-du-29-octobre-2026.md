---
description: >-
  Consignes Grok : PayBox marchand LIVE, LIA avec signature xPortal et preuves
  de sortie.
hidden: true
noIndex: true
---

# Grok — suite PROD LIVE du 29 octobre 2026

## Mise à jour demandée par Nelson — cours marché + WHOOP privé

Cette instruction remplace toute consigne de figer `EGLD_EUR_RATE=3.24`. Le taux EGLD doit provenir du marché horodaté. **Le correctif est écrit et testé localement, mais n’est pas encore poussé ni déployé.**

* [Kit complet : patch, manifeste et consignes](../.gitbook/assets/XARTISTS_LIVE_FX_WHOOP_2026-10-29.zip)
* Archive : **26 513 octets** ; SHA-256 : `3b83264e5dd15a4c82742150df87d4e6203630a4e0199e79220eb0e35f81eb9b`.
* Base testée : `1a17877fc8334c964e613c8616410aca62bcf775`.
* Commit local candidat : `d16a1930559f42e59797d7d804a903792c11c6b7`, 22 fichiers. La branche distante n’a pas été créée : le push Git n’a pas de credentials dans cet environnement.
* Validation : **73 tests API + 44 tests frontend passent**, build Vite réussi. Le typecheck complet reste rouge comme sur la base : **aucun nouveau diagnostic** après comparaison.

### Travail Grok immédiat

1. Télécharger le kit, vérifier taille/empreinte et lire README + manifeste. Avec ton accès GitHub d’écriture autorisé, créer une branche sur main relu, appliquer `git apply --check` puis le patch. Si main a changé, adapter sans écraser les autres travaux. Rejouer les tests et ouvrir la PR.
2. Après intégration API + Pages, vérifier `fx_mode: live`, le marché `/v1/market/egld` et une quote avec `fx.as_of`. **Retirer seulement alors** les variables de taux fixes sur Render. Le correctif ignore tous les taux du client et les valeurs fixes, conserve les prix 110/75/50 EUR, utilise un cache de 30 s, une source de moins de 120 s et une quote de 60 s maximum. Les anciens caches frontend EGLD ne servent plus de cours actuel. En panne : 503 / prix indisponible.
3. WHOOP a été confirmé par Nelson pour un **espace personnel privé** : récupération, sommeil, effort. Le panneau est ajouté au wallet ; API WHOOP v2, OAuth et JWT avec preuve SIWX signée (`amr: ["siwx"]`), chiffrement des jetons, state à usage unique et révocation. Les anciens JWT sans cette méthode exigent une nouvelle signature. **Désactivé par défaut**. Appliquer la migration 002 et configurer la vraie app WHOOP avant activation ; recueillir le consentement officiel. Aucun compte WHOOP réel n’a été connecté ou lu dans les tests.

La sonde du correctif local a utilisé un vrai cours source âgé de 12 secondes : à 18:22:35 Europe/Paris, 3.1256411107501973 EUR/EGLD, quote 50 EUR = 15.9968 EGLD. Ce nombre est une preuve historique, **jamais une nouvelle constante**.

Les identifiants marchand PayBox LIVE restent absents du kit. Aucune bascule PayBox prod, paiement réel ou transaction LIA n’a été effectué. Le texte plus bas conserve le point de contrôle historique ; appliquer cette mise à jour en priorité.

***

**Destinataire : Grok, opérateur du dépôt Neltud/xArtists.**\
**Mandat : Nelson autorise la poursuite PayBox prod et LIA live, sur deux rails indépendants.**\
**Point de contrôle : 29 octobre 2026, 13:42 Europe/Paris.** Les faits ci-dessous sont un instantané de cette session. Relire les sources avant chaque mutation.

Grok, reprends l’exécution. Termine le travail possible sur chaque rail, consigne les prérequis réellement manquants, et fournis les preuves. Le GO humain est acquis ; la disponibilité des secrets, du host et des signatures doit être vérifiée séparément.

## 1. Base vérifiée — ne pas repartir d’un ancien état

| Élément                                     | Observation                                                                                                                           |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Main observé                                | `c6e82eca52de88b69b118ee2e9253e59610cbb45`                                                                                            |
| Render access-api                           | `srv-dbh35rt9fdbs73a4i100`, dernier déploiement observé `dep-dbhjq3k9v7es73bdfqbg`, live sur ce main                                  |
| Health                                      | HTTP 200 ; PayBox configuré, **preprod** ; JWT/SIWX ; Postgres ; FX configuré ; `lia_live_trading: "0"`                               |
| Pages                                       | Build et déploiement Vite **success**, run [40874088408](https://github.com/Neltud/xArtists/actions/runs/40874088408)                 |
| Build effectivement servi                   | `source_sha: f390fa57be9b2da4cbfd1d0104ab7be1848203fe`, `lia_live_trading: true`, **99 routes**, `built_at: 2026-10-29T12:33:14.889Z` |
| Interface LIA                               | « EN DIRECT · signature utilisateur xPortal », BOOTSTRAP 0.001 EGLD ; wallet ops non connecté                                         |
| Statut Vellum servi                         | `vellum_last_run.json` daté du **7 octobre**, `ok: false`, attente du prochain run                                                    |
| Statut agrégé servi                         | `lia_status/v1`, daté du 29 octobre à 12:37:02 UTC, `paper: true`, `LIA_LIVE_TRADING: 0`                                              |
| Permissions GitHub de cette session ChatGPT | Lecture OK ; création de branche refusée : **403 Resource not accessible by integration**                                             |
| Hôte Vellum                                 | Non identifié dans le workspace Render consulté ; deux services visibles : access-api et frontend historique                          |

Le SHA source du build peut différer du commit qui synchronise `docs/`. Comparer `build-info.json` au SHA du run de build, pas seulement au dernier commit bot de main.

La recette **technique** preprod après correctif a payé `xa_sentinel_l7axy0_ti2ckn670c3` : 5000 centimes, `paid`, `server_confirmed: true`, livraison simulée, rejeu du retour authentiquement signé `duplicate: true`. Le rendu My Packs avec xPortal n’a pas été validé par cette recette. Ne pas citer cet ordre comme preuve prod.

Sources :

* [Health API](https://xartists-access-api.onrender.com/health)
* [Build servi](https://neltud.github.io/xArtists/build-info.json)
* [Manifeste servi](https://neltud.github.io/xArtists/dapp-release.json)
* [LIA publique](https://neltud.github.io/xArtists/intelligence/lia/)
* [Statut agrégé](https://neltud.github.io/xArtists/data/lia_status.json)
* [Dernier run Vellum publié](https://neltud.github.io/xArtists/data/vellum_last_run.json)

## 2. Lot immédiat — fermer les écarts de preuve

1. Relire main, les PR ouvertes et les derniers runs ; annoncer les chemins que tu modifies pour éviter les écrasements entre agents.
2. Conserver la séparation : access-api PayBox garde `LIA_LIVE_TRADING=0` ; le runtime de trading se configure sur **son propre hôte**.
3. Ne pas relancer un build Pages déjà vert sans changement utile. Le front live est maintenant servi ; le prochain travail porte sur le runtime Vellum, les statuts contradictoires et les recettes.
4. Si les secrets marchand LIVE ou l’accès host manquent, enregistrer ce blocage et avancer sur les autres lots. Aucun secret dans le chat, GitBook, GitHub, les logs ou les artefacts.

## 3. PayBox marchand LIVE — bascule cohérente, puis une recette

### Configuration Render

Cible exclusive : [xartists-access-api](https://dashboard.render.com/web/srv-dbh35rt9fdbs73a4i100).

Vérifier que l’opérateur possède les **quatre valeurs du même compte marchand LIVE**. Elles ne sont pas fournies dans ce prompt. Le compte mutualisé officiel est un compte de test ; changer seulement `PAYBOX_ENV` ne le transforme pas en compte marchand réel.

Fusionner les variables suivantes avec la configuration existante, sans remplacer l’ensemble des variables ni toucher à JWT, Postgres ou CORS :

```dotenv
PAYBOX_SITE=<valeur merchant LIVE>
PAYBOX_RANG=<valeur merchant LIVE>
PAYBOX_IDENTIFIANT=<valeur merchant LIVE>
PAYBOX_HMAC_KEY=<valeur merchant LIVE>
PAYBOX_ENV=prod
PAYBOX_DEVISE=978
PAYBOX_IPN_URL=https://xartists-access-api.onrender.com/v1/checkout/paybox/ipn
# FX : cours marché serveur après déploiement du correctif ; aucun taux fixe.
LIA_LIVE_TRADING=0
```

Ces marqueurs ne sont pas des valeurs à déployer. Si une valeur manque, ne pas effectuer une bascule partielle vers prod.

Déployer après enregistrement du jeu complet. Capturer le deploy ID, le SHA et l’état terminal `live`. Contrôler ensuite :

```json
{
  "paybox_mode": "prod",
  "paybox_configured": true,
  "lia_live_trading": "0"
}
```

`paybox_configured: true` atteste la présence d’une configuration, pas l’acceptation du compte par Verifone. Vérifier aussi le refus sans JWT, les quotes serveur et l’ordre des champs HMAC.

### Smoke prod

Préparer **un seul Sentinel à 50 EUR**, prix canonique serveur. Ne pas créer un tarif de test plus bas sans décision explicite sur le catalogue. Nelson valide le wallet et la carte ; ne pas utiliser une carte de test sur le TPE prod.

Preuves requises :

* Auth xPortal/SIWX et JWT buyer valides.
* Formulaire envoyé par POST à **tpeweb.paybox.com**.
* Paiement réellement accepté et nouvel `order_id` prod.
* Confirmation fournisseur authentifiée, puis `paid` et `server_confirmed: true` côté serveur.
* Un rejeu authentiquement signé traité en doublon, sans seconde livraison.
* My Packs confirme le même ordre avec le buyer authentifié.

Le retour navigateur `?paid=`, le ticket seul et une réponse JSON fabriquée ne ferment pas la recette. Identifier précisément si le rejeu utilise le retour marchand signé ou l’IPN originale.

### Rollback PayBox

La désactivation immédiate consiste à vider `PAYBOX_HMAC_KEY`, puis redéployer et vérifier le mode off. Pour restaurer preprod, remettre **le jeu complet sandbox cohérent** et `PAYBOX_ENV=preprod`. Changer seulement l’environnement tout en conservant les identifiants LIVE n’est pas une restauration sandbox attestée.

## 4. LIA — identifier le host et réconcilier les sources

Lire d’abord :

* [Prompt Vellum existant](https://github.com/Neltud/xArtists/blob/main/docs/VELLUM_LIA_LIVE_PROMPT_2026-10-29.md)
* [Construction des transactions](https://github.com/Neltud/xArtists/blob/main/apps/frontend/src/lia/buildIntentTx.ts)
* [Précontrôle live](https://github.com/Neltud/xArtists/blob/main/apps/frontend/src/lia/livePreflight.ts)
* [Contrats et pins](https://github.com/Neltud/xArtists/blob/main/apps/frontend/src/config/contracts.ts)
* [Vérification du hash utilisateur](https://github.com/Neltud/xArtists/blob/main/apps/frontend/src/lia/verifyUserTx.ts)
* [Lecture du dernier run Vellum](https://github.com/Neltud/xArtists/blob/main/apps/frontend/src/lia/vellumBridge.ts)

Sur le **vrai host Vellum / orchestrateur**, relever le déploiement, la version exécutée, le run ID, son horodatage, les flags et le résultat des gates. L’access-api et un fichier JSON statique ne prouvent pas cet état.

L’armement visé est `LIA_LIVE_TRADING=1` sur ce host, avec le front déjà construit à `VITE_LIA_LIVE_TRADING=1`. Une autorisation de configuration ne vaut pas preuve d’exécution.

Exiger les gates AND : réseau mainnet/chainID 1, codehash piné, destinataire et wallet attendus, balance/gas, plafonds vérifiables, journal des intents, et validation du payload. Tout swap/stake/sell exige en plus une cotation fraîche, route, quantité, minimum reçu, expiration et glissement borné. Garder les plafonds 15 USD/opération et 40 USD/jour ; inclure les opérations en attente. Ne pas présenter le seul journal navigateur comme un compteur global persistant.

**Limite du code actuel :** `buildTxFromIntent` accepte le BOOTSTRAP explicite. Il refuse les autres actions en demandant une cotation et une transaction vérifiées. `runDecisionCycle` produit des intents paper. Ne pas annoncer que le flag active à lui seul un moteur swap/staking réel ; ne pas remplacer un swap manquant par un transfert.

## 5. Première preuve LIA — BOOTSTRAP de 0.001 EGLD maximum

Préparer un draft contrôlable avant la signature humaine :

```json
{
  "chainID": "1",
  "receiver": "erd1qqqqqqqqqqqqqpgq245sma97w0j9ga9jdgxu36zs0v8g0y6evhxq2nkezv",
  "value": "1000000000000000",
  "gasLimit": 6000000,
  "data": "receiveAndSplit"
}
```

Ce draft correspond au builder observé ; relire la configuration effective et tout override avant usage. Vérifier pause, destinataires du splitter, frais, simulation et correspondance du code déployé. Présenter l’effet du dépôt et les frais au signataire.

Le codehash treasury observé correspond au pin : `9pB9+UN372QxE77Nj8TUjWn6+Q6qtOPhmmXgUdLnpk8=`.

Le champ on-chain `isPayable: false` ne justifie pas un upgrade automatique : ce flag concerne les transferts simples, tandis que le code source déclare l’endpoint `receiveAndSplit` payable EGLD. Vérifier l’appel explicite par simulation. Référence : [paiements des smart contracts MultiversX](https://docs.multiversx.com/developers/developer-reference/sc-payments/).

Nelson signe dans xPortal avec le wallet ops attendu par l’interface. Ne pas demander sa clé privée ni signer avec un wallet technique en prétendant valider le parcours utilisateur.

Après signature, vérifier un **nouveau** hash on-chain : succès, hash, sender attendu, receiver, montant et calldata décodée doivent correspondre au draft. Un identifiant de session wallet ou un ancien hash ne suffit pas. Ne pas broadcaster une seconde fois pour obtenir une preuve.

Ce dépôt atteste un appel au splitter ; il ne prouve pas encore un swap rentable ou une boucle de trading autonome.

## 6. Statuts publics — montrer les trois états distinctement

Traiter le décalage observé :

* Front : « EN DIRECT · signature utilisateur ».
* Pipeline : « Vellum · simulation / hors ligne ».
* Terminal : « LIA\_LIVE\_TRADING=0 · bascule bêta verrouillée ».

Distinguer **interface armée**, **orchestrateur vérifié**, **transaction confirmée**. Tant que le host n’est pas attesté, afficher cet état inconnu explicitement. Préserver les vues paper/shadow et leur historique.

Respecter les schémas et lecteurs existants, notamment `lia_status/v1` et `vellum_last_run.json`. Vérifier la compatibilité producteur/consommateur : le JSON servi expose actuellement `ok` à la racine, alors que le type frontend attend notamment `summary.ok`. Corriger avec une preuve de rendu, sans inventer un run ni seulement rafraîchir une date.

Publier les sorties réelles et contrôler les copies servies dans `data/`, `apps/frontend/public/data/` et `docs/data/` selon le publisher existant. Conserver l’horodatage propre de la preuve runtime ; une lecture on-chain récente ne rend pas récent un vieux run Vellum.

Si du code change : PR ciblée, tests utiles des gates et de la confirmation, build frontend et contrôles de release existants. Aucun test désactivé pour obtenir un vert. Conserver la présentation publique séparée des consignes opérateur sous Prompts.

## 7. Rapport de fin obligatoire

Rendre les résultats séparément :

| Rail            | Statut à justifier                      | Preuve attendue                                        |
| --------------- | --------------------------------------- | ------------------------------------------------------ |
| PayBox          | preprod / prod armé / prod E2E confirmé | health, deploy ID/SHA, nouvel order\_id, IPN, My Packs |
| LIA frontend    | armé / désarmé                          | build-info servi, run Pages, rendu                     |
| LIA host        | inconnu / paper / live sous gates       | host, version, run ID, timestamp, gates                |
| LIA transaction | non signée / en attente / confirmée     | nouveau tx\_hash et correspondance complète du draft   |

Joindre les liens GitHub/GitBook, les SHA exacts, les commandes et résultats réels, les inconnus et **trois prochaines actions maximum**. Si l’écriture GitHub est refusée, nommer le 403 et la branche/PR réellement créée ou non créée ; ne pas annoncer un push inexistant.

**Clôture :** aucun « B VERT » sur un health seul ; aucun « LIA live exécuté » sur un flag ou un bouton seul. Les preuves de chaque rail restent indépendantes.
