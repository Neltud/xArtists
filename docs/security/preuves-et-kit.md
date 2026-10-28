# Preuves et kit vérifiable

### Kit de revue du 28 octobre

[Télécharger l'archive complète](../.gitbook/assets/xartists-security-readiness-2026-10-28.zip)

* **123137 octets**, **49 entrées** ; 47 fichiers de contenu et deux fichiers de manifeste.
* SHA-256 : `dea844c6a131ae1660136c2658a0dfaf4c8fe742b1b69d51cfe58c791bf7ba21`.
* CRC ZIP et empreintes de chaque fichier de contenu vérifiés **localement**. L'acceptation de l'upload et l'exécution des tests sont des preuves distinctes.

### Contenu et état actuel

Patch documentaire de **14 fichiers Markdown**, README racine et Access API, SECURITY.md, accueil GitBook, navigation, runbook, règles prix/rails et six pages sécurité. `DOCS_REVIEW.patch` s'applique sur `bbd83bf52edc00f6ae82cbfcdf62764abfbb5c47` dans un index isolé, exit 0. Aucun code applicatif n'est modifié par le patch.

Sur main testé `352de2dc…` : **59/59 API**, **40/40 frontend**, **7/7 Python**. Les sondes supplémentaires rouges sont conservées avec leurs limites ; les dépendances ont été réutilisées, sans preuve de nouvelle installation frontend complète.

Sur PR #200 actuelle `21e043d33644da04facab8915ea55827f056d122` : **concurrence fichier 3/3 corrigée**, TLS vérifié par défaut, pg déclaré. CI bloque encore à `npm ci` : lockfile sans entrées de dépendances. Test local isolé avec cache SDK : **59/61**, deux tests v2 async restants. Les preuves de l'ancien head e206da7 sont conservées comme historiques.

`MANIFEST.json` et `SHA256SUMS` lient les octets au kit ; `SOURCE_MANIFEST.json` relie 76 fichiers d'entrée au code audité. Les fichiers `orders-under-review.mjs` et `orders-latest.mjs` sont des copies d'audit sous artifacts : ne pas les substituer à main.

Les logs d'échec avec chemins temporaires bruts restent locaux ; le TAP portable PR #200 normalise ce préfixe sans changer les résultats. Aucun secret, aucune donnée client et aucune clé privée ne sont requis par ce kit.

### Revue et diffusion

GitHub refuse la création de branche avec **403 Resource not accessible by integration** : le README du dépôt est **proposé, pas poussé**. Cette revue GitBook est **draft**, non fusionnée et non publiée. Aucune PR GitHub créée et aucun message envoyé à Grok. Le lot est prêt à être intégré par son auteur autorisé après vérification des SHA.

Le rapport quotidien ChatGPT est actif dès le 29 octobre autour de 08 h Europe/Paris. Il prépare une passation Grok en lecture seule. Budget 0 €, aucun merge, déploiement ou mouvement de fonds automatique.

[Audit actuel](audit-2026-10-28.md) · [Critères](launch-gates.md) · [Automatisation](automation.md) · [README proposé](readme-du-depot.md)
