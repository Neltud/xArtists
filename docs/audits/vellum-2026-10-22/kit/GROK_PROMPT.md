# À transmettre à Grok avec le kit ZIP

```text
Termine la release V3 de Neltud/xArtists avec le kit de transport joint.

Ton accès API permet déjà de modifier des fichiers et static.yml. Utilise cet accès pour déposer l’archive découpée ; GitHub Actions pourra importer les sources avec son GITHUB_TOKEN, si les politiques du dépôt l’autorisent. Aucun PAT n’est à demander dans la conversation pour cette méthode.

1. Extrais le kit dans un dossier séparé du clone. Retrouve ton merge local complet, puis récupère les derniers main et fix/v3-complete-release. Intègre-les au candidat et résous les conflits en conservant toutes les sources V3 et les mises à jour récentes de main. Le commit prêt doit descendre de la branche distante et les fichiers doivent être commités.

2. Exécute prepare.py avec --repo pointant vers ce clone, --base origin/fix/v3-complete-release, --ready HEAD et --out pointant vers un dossier neuf. Il vérifie les sources essentielles et les lockfiles, puis produit un patch compressé, ses morceaux et un manifeste d’intégrité.

3. Vérifie les required_workflows indiqués dans REPORT.json. Si nécessaire, synchronise static.yml et les autres workflows concernés depuis le candidat complet avec ton connecteur avant le lancement. Le patch ne modifie aucun fichier .github/workflows.

4. Envoie les fichiers générés sur fix/v3-complete-release aux mêmes chemins : tous les release-import/v3/part-*.b64, apply.py, manifest.json, puis .github/workflows/import-v3-sources.yml EN DERNIER lors de la première installation. Utilise les SHA actuels pour les mises à jour. Ne colle pas les morceaux dans la conversation. REPORT.json reste local.

5. La création du workflow déclenche l’import sur la branche, avec contents: write et actions: write. Attends son résultat. Il contrôle les empreintes et les modifications concurrentes, applique les sources, vérifie leurs identités Git, retire les morceaux, puis pousse sans force. Il déclenche explicitement static.yml par workflow_dispatch sur le commit importé.

6. Attends le succès de static.yml sur cette branche. Corrige les vraies erreurs de compilation ou de tests. Retire le workflow temporaire avec le connecteur, puis crée réellement une PR non brouillon, fusionne après les contrôles et attends le déploiement canonique sur main.

7. Vérifie le site public : accueil V3, marqueur sites-v3-release, build-info.json avec renderer=sites-v3 et SHA compilé, assets réellement référencés par le HTML accessibles. Vérifie aussi le musée et le lecteur Cacher/Arrêter selon les possibilités de test.

La création de la branche, l’import de ces sources, la PR, sa fusion après contrôles et le déploiement sont autorisés. Respecte les protections existantes.

Si l’outil ne peut pas transmettre un fichier local de cette taille, si l’ajout du workflow est refusé ou si Actions ne peut pas écrire sur la branche, donne l’opération exacte, l’erreur complète et l’URL du run quand elle existe. Ce sont les conditions à vérifier ; n’annonce pas un succès fictif.

Livrable : PR fusionnée, SHA des sources compilées, run static.yml réussi, URL du site et contrôles réellement effectués.
```

**Note 2026-10-22 :** V3 déjà fusionné via PR #180. Document conservé pour audit des lots uniquement.
