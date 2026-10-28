---
description: "Revue du runbook Render/Neon : blocages post-merge #200 et conditions d'une recette sandbox gratuite."
---

# Revue Render/Neon — 28 octobre 2026

Relevé à 17:43 Europe/Paris. **Préparation sandbox ; aucun déploiement, secret, paiement ou accès SQL effectué.** Le fichier reçu est une procédure à revoir, pas une preuve d'un déploiement réussi.

## État vérifié

| Élément | Observation |
|---|---|
| Main relu | `5c2c053d476837b3f30e8f87df4817e54cb8c71e` ; release 0.119.7 |
| PR #200 | Mergée le 28 octobre à 16:01:44 Europe/Paris ; merge `3fd2850076f9f090460a6e121259c2b5efa459d5` |
| PR ouvertes | 0 au relevé |
| Dernière CI Paybox pré-merge | 61 tests, 59 pass, 2 fail ; run `40699296815` au head `fdc406ff27ab940b8c3cf475c26ec581d12a4cf6` |
| Lock API sur main | 351 octets, une seule entrée `packages`, blob `64bdf09eef7bbd3cc5fc5af7e7d36ec392aa21b5` |
| Tests v2 sur main | Appels de store async encore traités de façon synchrone ; blob `7af593c424cacd0d8644d91f92722fa75c2833a6` |
| Vite/Pages sur main | Run `40726942162`, job `122952634629` : `npm ci` API échoue avec `EUSAGE` ; build et déploiement sautés |
| Autre workflow Pages | Run `40726941222` vert ; il ne prouve pas le succès du build Vite précédent |
| Render | L'inventaire connecté a renvoyé `null` sans erreur ; cela n'atteste ni une URL API disponible ni un déploiement |

Les 59/61 tests sont une lecture de logs existants, pas une suite relancée par cette revue. Les fichiers lock/test correspondants ont été relus sur le SHA main actuel.

## Corrections prioritaires

1. **Nouvelle PR post-merge** depuis le main courant : restaurer le lock complet généré par npm, corriger les deux tests async et rétablir `npm ci --ignore-scripts` dans la CI Paybox. Ne pas rouvrir symboliquement #200 ni masquer le défaut en régénérant le lock à chaque CI. Le kit local `38fcb546…` fournit le lock et les tests ; vérifier sa compatibilité avant application. Le workflow Pages exige déjà `npm ci` : conserver cette exigence.
2. **Version Node maintenue** : le runbook et les deux workflows utilisent Node 20, désormais EOL. Proposer Node 24 LTS, vérifier API/frontend/build sur cette version puis harmoniser la configuration en PR. Le succès du kit API sous Node 24 ne prouve pas encore celui du frontend complet sur cette version.
3. **Preuve Postgres distincte** : `/health` produit `orders_backend` à partir de la présence de `DATABASE_URL`. Il ne se connecte pas à la base. Une URI erronée pourrait donc afficher `ok:true` et `orders_backend:postgres`. Avant de qualifier le store de durable : recette dans une base sandbox isolée, ordre fictif et second processus, refus d'un autre acheteur, idempotence/rejeu d'IPN de fixture, unicité `provider_tx_id`, puis panne DB sans activation de droits. Ces tests n'ont pas été exécutés ici.
4. **Budget et déploiement contrôlés** : sélectionner réellement Free et vérifier les quotas/conditions de dépassement. Ne pas laisser chaque changement de main redéployer sans revue. Conserver le SHA approuvé, le build et l'URL réels dans la preuve de recette. La nouvelle version du prompt ne donne aucun GO de déploiement.

## Amendements au runbook source

| Champ ou instruction | Cible de préparation |
|---|---|
| Build Command | `npm ci --ignore-scripts`, uniquement après correction et validation du lock |
| `NODE_VERSION` | Version Node 24 LTS maintenue et testée ; configuration CI cohérente |
| `REQUIRE_SIWX` | `1` explicite ; le défaut actuel du code est déjà activé |
| `ACCESS_JWT_SECRET` | Génération aléatoire dans un stockage sécurisé ; recommander 32 octets d'entropie, ne pas le copier dans les documents |
| `DATABASE_URL` | URI du projet/branche sandbox vérifiés, stockée uniquement côté serveur ; aucun repli fichier accepté comme preuve de durabilité |
| TLS Postgres | Préserver la validation de certificat, ne pas utiliser `PGSSL=0` ou `rejectUnauthorized:false` pour résoudre une erreur |
| `LIA_LIVE_TRADING` | `0` |
| Auto-deploy | Manuel ; SHA candidat attesté avant action autorisée |
| Paiements | Credentials marchands non configurés pour ce lot ; aucun paiement réel |
| URL API | URL retournée par Render, pas une URL `onrender.com` supposée |
| Liaison Pages | `VITE_ACCESS_API_BASE` et rebuild seulement après prérequis et autorisation applicable |

`ACCESS_PUBLIC_BASE=https://neltud.github.io` est cohérent avec le code actuel, qui ajoute lui-même `/xArtists/` aux URL de retour. Ne pas ajouter ce sous-chemin une seconde fois.

Le guest checkout sans JWT retourne 401. Le 501 sans secrets Paybox concerne le checkout après authentification ; ce n'est pas un résultat du endpoint SIWX. Le devis public utilisant `rate_eur_per_egld:12` est une fixture de calcul : le taux reste envoyé par le client et n'atteste pas un prix marchand opposable.

`orders_backend:file` est un comportement réel du code en l'absence de `DATABASE_URL`, pas un fail-closed de la persistance. Le disque Render Free est éphémère : ce cas bloque la validation du store durable.

## Gratuité : limites vérifiées

Render documente la mise en veille après 15 minutes d'inactivité, un réveil d'environ une minute, 750 heures Free par workspace et des quotas de bande passante/build. Certains dépassements peuvent être facturés si un moyen de paiement est présent ; sans moyen de paiement, Render décrit des suspensions. Un nom de plan Free ne suffit donc pas à garantir le budget sans contrôler les conditions du workspace.

Neon documente Free à 0 USD/mois, 100 CU-heures/projet, 1 Go Postgres/projet, 5 Go de transfert public/projet et 6 heures d'historique sous limite. Aucun changement de plan, de capacité ou de rétention n'a été effectué ici. Ces limitations rendent la cible pertinente pour une recette paper ; elles ne constituent pas une preuve de disponibilité commerciale.

## Note TLS vérifiée sans réseau

La documentation node-postgres précise que des paramètres SSL dans l'URI peuvent remplacer l'objet `ssl` fourni au client. Une sonde locale avec l'installation du kit (`pg` 8.13.1, `pg-connection-string` 2.14.1) et une URI fictive montre que `sslmode=require` et `verify-full` donnent actuellement un objet SSL vide, avec avertissement de changement futur de sémantique. Cela **ne prouve pas une désactivation actuelle de la validation TLS**. Préférer un mode explicite vérifié et tester la configuration effective avec les versions réellement verrouillées ; aucune connexion Neon ni certificat réel n'a été utilisé. La première tentative de lecture de la version transitive via un sous-chemin non exporté a échoué ; la sonde corrigée a ensuite réussi.

## Sources et limites

- [Runbook au main relu](https://github.com/Neltud/xArtists/blob/5c2c053d476837b3f30e8f87df4817e54cb8c71e/docs/DEPLOY_RENDER_NEON_GO_2026-10-28.md)
- [PR #200](https://github.com/Neltud/xArtists/pull/200)
- [CI Paybox pré-merge](https://github.com/Neltud/xArtists/actions/runs/40699296815)
- [Vite/Pages en échec sur main](https://github.com/Neltud/xArtists/actions/runs/40726942162)
- [Code health](https://github.com/Neltud/xArtists/blob/5c2c053d476837b3f30e8f87df4817e54cb8c71e/services/access-api/src/server.mjs#L83)
- [Render Free](https://render.com/docs/free)
- [Neon plans](https://neon.com/docs/introduction/plans)
- [Versions Node.js](https://nodejs.org/en/about/previous-releases)
- [node-postgres SSL](https://node-postgres.com/features/ssl)

Aucune preuve nouvelle de connexion Postgres réelle, migration, restauration, session xPortal sur appareil, endpoint public API, réception PSP ou livraison on-chain. Aucun compte, droit, secret, service, variable GitHub ou workflow déclenché pendant cette revue. ChatGPT écrit uniquement cette revue et la page de prompt ; Grok reste le writer proposé des chemins de correctif après réservation et relecture du tip.
