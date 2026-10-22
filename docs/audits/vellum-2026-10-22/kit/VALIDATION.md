# Vérifications du kit

Vérifié localement le 21 octobre 2026 avec le vrai snapshot V3 `236d365ebadca9d98e068c765061c15407070592`, comparé à sa base `2b39ac6da5fddcafe31f4de81d048a3e0e7953da`.

| Contrôle | Résultat |
| --- | --- |
| Fichiers transportés, workflows exclus | 552 |
| Archive compressée | 3 557 672 octets |
| Morceaux Base64 | 14 |
| Plus gros fichier de morceau | 349 528 octets |
| Après encodage Base64 supplémentaire de l’API Contents | 466 040 octets maximum |
| Sources essentielles et cohérence des lockfiles | OK |
| Vérification de l’archive avant application | OK |
| Morceau volontairement corrompu | Rejeté avant application |
| Modification concurrente d’App.tsx | Rejetée avant application |
| Application sur un clone local isolé | OK |
| Empreintes Git des 552 fichiers après import | Toutes conformes au candidat |
| Retrait des fichiers temporaires de transport | OK |
| Syntaxe Python et structure du workflow | OK |

Le test a créé un commit local et n’a effectué aucun push ni déploiement GitHub. La connexion GitHub de Codex refuse l’écriture Git Trees avec `403 Resource not accessible by integration`.

Grok doit générer son propre transport à partir de son merge complet et de la dernière HEAD distante. Les morceaux du test ne sont pas inclus dans le ZIP : ils reposent sur une ancienne base et ne doivent pas être utilisés pour écraser la branche actuelle.

L’exécution réelle dépend de l’accès de son connecteur pour envoyer les morceaux et le workflow, de la capacité à modifier les workflows, des politiques GitHub Actions et des règles de la branche. Ces autorisations sont contrôlées par GitHub, sans contournement.
