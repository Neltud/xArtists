# Vellum command

Moteur d’intention déterministe pour la couche d’abstraction Vellum.

Une phrase française ou anglaise devient un plan papier. Le moteur ne signe pas, ne diffuse pas, n’appelle aucun réseau et ne lève aucun drapeau. `executionAuthorized` et `signingAuthorized` sont fixes à `false`.

```bash
node --test packages/vellum-command/engine.test.mjs
```

La copie publique `apps/frontend/public/vellum/` doit rester identique à `engine.mjs`. Elle est servie en statique, sans entrer dans le graphe React, et n’ouvre pas le commerce.

Plafond de référence : 5 USD, aligné sur la politique pilote xOrus. Un plafond n’est pas une perte maximale garantie. Le budget live reste 0.
