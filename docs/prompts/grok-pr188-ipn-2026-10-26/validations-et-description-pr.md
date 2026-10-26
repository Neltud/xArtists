---
description: 'Résultats locaux, limites de validation et description complète de la PR #188.'
hidden: true
noIndex: true
noRobotsIndex: true
---

# Validations et description de la PR

### Validation locale

| Contrôle                              | Résultat                                                            |
| ------------------------------------- | ------------------------------------------------------------------- |
| API, sous Node v24.22.1               | 41 tests passés                                                     |
| Frontend                              | 22 tests passés                                                     |
| Régressions Python Paybox             | 7 tests passés                                                      |
| Garde-fous de trading                 | 5 contrôles passés                                                  |
| Build Vite de production              | Réussi                                                              |
| Routes                                | 37 modules, 52 alias, 99 routes, aucun lien interne non résolu      |
| Rendus du shell                       | 64 contrôles passés sur 8 langues                                   |
| Rendus des modules                    | 296 contrôles passés                                                |
| Régressions mobiles                   | Passées                                                             |
| Traductions et ressources construites | Vérifiées                                                           |
| YAML des workflows                    | 41 fichiers valides ; syntaxe shell des workflows corrigés vérifiée |
| Diff et conflits                      | Aucun marqueur de conflit ; `git diff --cached --check` réussi      |

Le build local utilise `VITE_APP_BUILD=sites-v3-release`, `VITE_LIA_LIVE_TRADING=0` et `VITE_PAYBOX_ENABLED=false`. Son manifeste contient `lia_live_trading: false`. Les contrôles de la nouvelle CI, configurée sous Node 20, restent à exécuter sur GitHub après le push. Les avertissements de compilation concernant certains modules SDK, `eval` de Lottie et la taille de certains chunks ne bloquent pas le build.

### Description de la PR après le push

Titre proposé : `fix(p0): bind signed Paybox IPNs and validate sandbox integration`.

La description ci-dessous concerne le candidat de référence ; si le dernier main impose une nouvelle intégration, remplacer le SHA et les résultats par ceux effectivement vérifiés. Ne pas annoncer un push ou une CI réussie avant vérification distante.

```markdown
Les notifications Paybox utilisaient des champs métier issus de paramètres fusionnés après vérification de signature. Ce correctif lie le traitement au contenu signé, rejette les sources ambiguës et conserve un registre de commandes qui échoue fermé.

Le paiement confirmé reste distinct de la livraison et des droits d’accès : la livraison de cette version reste simulée. Une notification tardive ne réactive pas une commande terminale et une transaction fournisseur ne peut pas remplacer une transaction confirmée ou être réutilisée pour une autre commande. Le frontend utilise une session liée au wallet et distingue les états de paiement et de livraison.

L’intégration avec main conserve la récupération des routes Pages, les garde-fous JWT et la limitation des requêtes MoonPay. Les trois erreurs YAML existantes sont corrigées ; les workflows concernés restent manuels. Un nouveau contrôle de PR vérifie les fixtures, les routes, le rendu mobile et le build avec les opérations live désactivées.

Validation locale du candidat `57f1080b3d1dec5f13aaf3b92dac31acc75b6e13` sous Node v24.22.1 :

- 41 tests API, 22 tests frontend, 7 tests Python Paybox et 5 garde-fous de trading : tous passés.
- Build Vite de production et vérification des ressources : réussis ; `lia_live_trading: false`.
- 99 routes, 64 rendus du shell, 296 rendus des modules et régressions mobiles : vérifiés.
- YAML des 41 workflows et syntaxe shell des workflows corrigés : vérifiés.

Les contrôles GitHub du candidat restent à confirmer après son push. La nouvelle CI utilise Node 20. Cette PR reste destinée à la revue : aucune fusion vers main, aucun déploiement, aucun paiement réel et aucune transaction blockchain ne font partie de cette opération.

```

### Résumé des corrections

* Données métier IPN dérivées uniquement du contenu signé ; query/body ambigus rejetés.
* Registre corrompu : erreur 503, octets conservés ; transitions terminales et transactions fournisseur conflictuelles rejetées.
* Introspection compatible avec les deux formats de réponse et refus des secrets JWT trop courts.
* Limitation MoonPay indépendante de l’en-tête X-Forwarded-For fourni par le client.
* Authentification du checkout effectuée avant l’état de configuration du prestataire.
* Récupération des routes Pages de main préservée.
* Test de garde-fous existant utilisé dans static.yml, au lieu d’un chemin absent.
* Trois YAML réparés ; leurs déclenchements restent manuels.
* Nouvelle CI de PR en lecture seule, avec fixtures et opérations live désactivées.
* Validation JSON provisoire remplacée par les résultats locaux réels.
