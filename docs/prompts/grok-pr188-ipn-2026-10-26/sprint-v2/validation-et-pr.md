---
hidden: true
noIndex: true
noRobotsIndex: true
---

# Validations et plan d’intégration

#### Résultats locaux et limites

| Vérification                    | Résultat                                                    |
| ------------------------------- | ----------------------------------------------------------- |
| Node                            | 20.20.2                                                     |
| API, dont 12 cas HTTP IPN       | 53 réussis, zéro échec                                      |
| Frontend, dont 7 cas de session | 29 réussis, zéro échec                                      |
| Régressions Python Paybox       | 7 réussis                                                   |
| Contrôles trading               | 5 réussis                                                   |
| Build de production             | Réussi ; trading et Paybox désactivés                       |
| Routes                          | 37 modules, 52 alias, 99 routes ; zéro résolution manquante |
| Traductions et assets           | Vérifiés : 164 clés, 8 langues, 3 733 lignes                |
| Rendus shell / modules          | 64 / 296 réussis                                            |
| Mobile                          | Régressions réussies                                        |
| Workflows                       | 41 fichiers YAML analysés ; indentation manuelle réparée    |

Ces nombres concernent le code local exact du manifeste. Les contrôles GitHub ne sont pas encore une validation de ce candidat. Le JSON de validation embarqué conserve l'audit historique `2796316` ; le tableau de la page principale documente les corrections distantes suivantes sans réécrire cette preuve historique.

Les avertissements existants du build concernent les gros chunks, l'externalisation de `crypto` pour le navigateur dans le SDK et `eval` dans Lottie ; le build se termine avec succès. L'intégration d'un vrai compte marchand et l'expérience de signature sur un appareil xPortal restent à vérifier dans un futur ordre adapté. Aucun test de cette passe n'a utilisé un portefeuille réel.

#### Reproduire les contrôles après intégration

Dans un checkout du SHA candidat avec Node 20 et Python 3, installer les dépendances comme dans `.github/workflows/paybox-p0-review.yml`, puis exécuter les étapes de ce fichier en local. Les tests et le build ne déclenchent pas les jobs de déploiement.

```bash
node --test services/access-api/tests/*.test.mjs
LIA_LIVE_TRADING=0 python -m unittest discover -s tests/regression -p test_paybox_release.py -v
LIA_LIVE_TRADING=0 python tests/regression/test_trading_stack_gates.py
cd apps/frontend
npm run test:release
npm run check:routes
npm run render:check
node scripts/run-render-check.mjs modules
node scripts/run-render-check.mjs mobile
CI=1 NODE_ENV=production VITE_APP_BUILD=sites-v3-release VITE_LIA_LIVE_TRADING=0 VITE_PAYBOX_ENABLED=false npm run build
npm run verify:site
```

Les trois vérifications de rendu partagent un répertoire temporaire : les lancer séquentiellement.

#### Plan d'intégration par API, après GO humain et transfert des chemins

Ce plan n'est pas un ordre d'exécution actuel. Après 20/20 V1, demander le GO prévu par Nelson et attribuer un seul propriétaire aux chemins V2. Utiliser ensuite les outils GitHub autorisés de cette conversation. Aucune nouvelle capacité d'écriture n'est supposée. Si l'API renvoie 403, le signaler au lieu d'annoncer un push.

1. Lire la PR et les références exactes main / P0. Vérifier que les changements depuis la base respectent les mêmes gardes que l'exécuteur ; sinon arrêter et réexaminer.
2. Lire les trois pages de sources, décoder les neuf contenus JSON et vérifier leurs SHA-256 et leurs SHA de blob Git (`SHA1("blob " + longueur + NUL + octets)`). Le manifeste contient aussi les 13 blobs déjà présents dans le dépôt. Il est possible de réutiliser un blob corrigé plus récemment par Grok si son SHA est déjà le SHA cible.
3. Créer un arbre avec le dernier arbre de main comme `base_tree`. Pour chaque fichier du manifeste, ajouter une entrée mode `100644`, type `blob` : `content` pour les neuf sources de référence, `sha` pour les 13 autres. Ne pas envoyer `sha` et `content` ensemble. La liste des 22 chemins est complète ; ne pas prendre l'ancien arbre P0 comme base.
4. Vérifier que la différence avec main porte exactement sur les 22 chemins et que les blobs correspondent au manifeste. À main `05fe13b`, l'arbre doit être `7371204d22f6cb40695dc47c4037d15d98fa540c`. Si seuls des Markdown de docs ou les deux signaux quotidiens ont évolué sur main, conserver leurs nouvelles versions et contrôler les mêmes sources applicatives. Tout autre changement exige une nouvelle intégration et des tests.
5. Créer un commit dont les deux parents sont, dans cet ordre, la tête P0 relue puis le main relu. Ne pas fabriquer un commit à un seul parent en prétendant avoir résolu l'ascendance.
6. Relire la référence P0 ; si elle a bougé, reconstruire après revue. Mettre à jour uniquement la branche P0 avec `force=false` et le SHA attendu si l'outil l'accepte. Relire le SHA distant et les parents après l'envoi.
7. Mettre à jour la description de la PR existante, attendre les checks de revue, puis rendre leurs résultats réellement observés. Ne pas utiliser une suite locale réussie comme preuve de CI distante.

#### Description de PR prête à appliquer après le vrai push

Titre : `fix(p0): signed IPN parsing, wallet-bound checkout session and review build`

```markdown
Cette PR ferme les chemins où un callback IPN signé pouvait être interprété avec une source ambiguë, des paramètres dupliqués après décodage ou un montant partiellement numérique. Les erreurs de corps invalide ou surdimensionné sont conservées ; le registre de commandes reste fermé en cas d'erreur, et les transitions et transactions fournisseur sont contrôlées.

Le checkout obtient désormais un challenge, fait signer le message par le signataire xPortal existant et échange la preuve complète contre une session liée au portefeuille. L'introspection conserve les deux formats de réponse. Le signer MoonPay reste limité aux paramètres autorisés, à l'origine attendue et à une limitation fondée sur le socket.

Main est intégré dans la branche de revue. Le fallback Pages est préservé, le contrôle Python vise un fichier existant et le workflow manuel est réindenté. La CI de revue utilise des fixtures et un build avec les opérations live désactivées.

Validation locale sous Node 20.20.2 : 53 tests API, 29 frontend, 7 régressions Python Paybox et 5 contrôles de trading réussis. Build, routes, traductions, rendus et mobile vérifiés. Ajouter ci-dessous les résultats CI et le SHA réellement poussé après leur lecture.

Aucune fusion vers main, aucun déploiement applicatif et aucune opération réelle de paiement ou blockchain n'ont été autorisés par ce sprint.
```

#### Suite du travail

Après la CI verte sur la branche P0, examiner les différences de déploiement et le parcours de signature dans un environnement de test autorisé. La réduction des modules demandée dans le chantier distinct n'est pas réintroduite ni simulée ici : le main observé contient encore 37 modules. Ne pas annoncer la cible 36/51/97 avant son implémentation et sa vérification séparées.
