---
description: >-
  Instruction exécutable pour Grok : résolution P0 de la PR #188, 20 fichiers
  exacts et transport complet.
hidden: true
noIndex: true
noRobotsIndex: true
---

# Grok — PR #188 : résolution P0 complète

**Instruction de Nelson, 26 octobre 2026 : mettre le correctif complet à disposition de Grok et poursuivre la PR #188 en revue uniquement.**

Ce dossier est une passation technique. La présentation publique du projet reste séparée. Le correctif est prêt et testé localement ; il n’a pas été poussé par cette session, dont l’accès GitHub en écriture renvoie `403 — Resource not accessible by integration`.

### Mission à exécuter

1. Lire ce dossier et le manifeste ; récupérer les six parties de sources exactes.
2. Relire la PR #188 et les références distantes avant toute écriture.
3. Intégrer le dernier main dans la branche P0 en conservant les corrections de sécurité, de Pages et de mobile.
4. Écrire la résolution vérifiée uniquement sur `fix/p0-ipn-signed-binding-and-build`.
5. Compléter le titre et la description de la PR existante ; attendre et examiner les contrôles GitHub.
6. Rendre un compte rendu avec le SHA réellement poussé, les résultats des checks et le lien de la PR. Ne pas s’arrêter à « prêt » ou à la simple présence des fichiers.

**Aucun ordre de fusion de la PR vers main, de déploiement, de paiement réel ou de transaction blockchain n’est donné par cette passation.** Ne pas lancer de workflow de déploiement, de mint, d’émission de collection ou de microtransaction. Le contrôle ajouté est une CI de revue avec fixtures, en lecture seule. La publication de cette documentation GitBook ne vaut pas validation du produit en production.

### Références vérifiées

| Élément                                   | Valeur                                                                          |
| ----------------------------------------- | ------------------------------------------------------------------------------- |
| Dépôt                                     | `Neltud/xArtists`                                                               |
| PR existante                              | https://github.com/Neltud/xArtists/pull/188                                     |
| Branche autorisée                         | `fix/p0-ipn-signed-binding-and-build`                                           |
| Tête de branche attendue                  | `861fd0fd4abf428f7330716ca9c2de8ca8d0956d`                                      |
| main de référence de la validation locale | `52b2207aba7eb6a942fc6084d2f12652496f18c0`                                      |
| Candidat Git local, non poussé            | `57f1080b3d1dec5f13aaf3b92dac31acc75b6e13`                                      |
| Arbre candidat à cette base               | `16955e7f4934cc1dbe3fc8c926bf07b308bb41e4`                                      |
| Portée du diff                            | 20 fichiers : 16 fichiers de la PR initiale et 4 fichiers de CI supplémentaires |

### Sources complètes

* [Manifeste et empreintes](manifeste-et-empreintes.md)
* [API 1 — serveur et liaison IPN](fichiers-api-1.md)
* [API 2 — registre et régressions](fichiers-api-2.md)
* [Frontend 1 — checkout et mes packs](fichiers-api-3.md)
* [Frontend 2 — sessions et paiements](fichiers-api-4.md)
* [CI — workflows corrigés et revue sandbox](fichiers-api-5.md)
* [Audit — état historique et validation locale](fichiers-api-6.md)
* [Validations et description de la PR](validations-et-description-pr.md)
* [Archive complète — ZIP vérifiable](archive-complete.md)

### Procédure pour un exécutant disposant des API GitHub

Les six parties utilisent le format `xartists-pr188-api-files-v1`. Chaque entrée fournit le chemin, le contenu UTF-8 complet, le nombre d’octets, le SHA-256, le SHA de blob Git et les empreintes attendues sur les deux branches. Décoder les chaînes JSON une fois ; ne pas reformuler le code, convertir les entités HTML, modifier les sauts de ligne ni réécrire les workflows à la main.

1. Lire `GET /repos/Neltud/xArtists/pulls/188` et les références Git de `main` et de la branche P0. Vérifier la bonne PR, la bonne branche et l’absence de fusion. Si la branche P0 a quitté le SHA `861fd0fd4a…`, relire les nouveaux commits et faire une nouvelle intégration : ne pas écraser le travail concurrent.
2. Lire les commits Git, leurs arbres et les blobs des 20 chemins sur les références actuelles. Comparer chaque `expected_main_blob_sha` et `expected_branch_blob_sha`. `null` signifie que le fichier était absent. Une divergence impose une comparaison à trois versions et de nouveaux contrôles ; ne pas remplacer aveuglément un fichier plus récent.
3. Main peut avoir reçu des commits de documentation GitBook après `52b2207a…`. Si le diff depuis cette base est limité aux pages Markdown de documentation et que les 20 chemins applicables restent inchangés, utiliser **le dernier arbre de main** comme base. Conserver toutes ces nouvelles pages. Le SHA du nouveau commit et éventuellement son arbre seront alors différents de ceux du candidat local : c’est attendu. Ne jamais ramener main à l’ancien SHA.
4. Si du code, des modules, des workflows ou des configurations ont changé depuis la base, refaire l’intégration et les validations. En particulier, cette passation n’autorise pas à annuler le retrait polyLIA/GreenSmoke ni les corrections mobiles déjà appliquées. Les nombres 37/52/99 sont ceux de la base testée, pas une consigne de réintroduire des routes retirées.
5. Construire un arbre à partir du dernier arbre main avec les 20 entrées validées. Avec la base exacte `52b2207a…`, l’arbre doit être `16955e7f4934cc1dbe3fc8c926bf07b308bb41e4`. Vérifier tous les blobs créés contre le manifeste avant de créer un commit. Les trois workflows réparés gardent uniquement un déclenchement manuel ; le nouveau workflow est limité aux PR et ne déploie rien.
6. Créer un commit d’intégration avec **deux parents** : premier parent = la tête P0 relue ; second parent = la tête main intégrée. Un simple remplacement de fichiers sur l’ancienne branche sans ce parent main ne résout pas correctement la divergence de la PR.
7. Mettre à jour uniquement `refs/heads/fix/p0-ipn-signed-binding-and-build`, avec `force=false` et, si l’outil le propose, la garde `expected_sha` sur la tête relue. Relire immédiatement le remote pour confirmer le SHA. Ne jamais forcer la branche, fusionner la PR ou activer l’auto-merge.
8. Mettre à jour la description de la PR #188 avec le texte fourni, le SHA effectif et les validations réellement disponibles. Vérifier la mergeabilité et les checks du nouveau SHA ; les tests locaux ne constituent pas une preuve de CI distante réussie.

Avec les outils du connecteur GitHub, les actions correspondantes sont : lecture des refs/commits/blobs, création des blobs et de l’arbre, création du commit avec `additional_parent_shas: [main_actuel]`, puis mise à jour de la seule ref de la branche P0. Les erreurs d’accès doivent être rapportées ; ne pas annoncer un push si l’API le refuse.

### Variante avec Git local

Reconstruire le ZIP depuis la page « Archive complète », vérifier sa taille et son SHA-256, puis lire son README. Le bundle contient le candidat exact de référence. `apply.py` a été exécuté en mode vérification, sans push, et contrôle les références distantes, les parents du commit, l’arbre et l’intégrité des fichiers.

```bash
python3 apply.py /chemin/vers/xArtists
python3 apply.py /chemin/vers/xArtists --push
```

Cette variante exige les références de départ exactes. Si Git Sync a fait avancer main, elle s’arrête volontairement ; utiliser la procédure d’intégration ci-dessus, sans retirer les gardes ni faire de force-push.

### Validation à reproduire avant la revue finale

Les résultats locaux sont détaillés dans la sous-page dédiée : 41 tests API, 22 tests frontend, 7 tests Python Paybox et 5 garde-fous de trading passent ; build Vite réussi ; 64 rendus du shell, 296 rendus des modules et régressions mobiles passés ; contrôles des traductions et des ressources construits réussis. Le build contient `lia_live_trading: false` et Paybox désactivé. L’exécution locale utilisait Node v24.22.1 ; la nouvelle CI GitHub utilise Node 20 et reste à confirmer après push.

Toute adaptation à un main plus récent exige de produire des résultats frais et de mettre à jour le JSON de validation avec les compteurs réels. Garder les opérations live désactivées. La source historique `P0_SERVED_BUILD_BEFORE.json` est conservée telle quelle et n’est pas une nouvelle mesure du site servi.

### Compte rendu exigé de Grok

Donner le SHA distant, ses deux parents, la branche et le lien PR #188 ; les résultats des contrôles du nouveau SHA ; les éventuels conflits ou blocages restants ; et confirmer la portée exacte des opérations effectuées. Pour GitBook, un état de documentation publié ne doit pas être décrit comme un déploiement applicatif ou une fusion de code.
