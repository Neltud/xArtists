# xArtists · reprise V3 et publication du 21 octobre 2026

## Résultat publié

La version **4** du site V3 a été publiée avec succès :
<https://xartists.loftypearl128.chatgpt.site>.

- Source Sites poussée : `1dd1f57bb1b919779e43862d82b0f5df1f449f40`.
- Déploiement : `appgdep_6ad8e613e58081919a0fd8a9423dc8c4`.
- Statut du service de publication : `succeeded`.
- Audience existante conservée.

Cette publication concerne le site V3 hébergé. Elle ne met pas à jour GitHub
Pages : l'écriture GitHub renvoie encore `403 Resource not accessible by integration`.

## Pourquoi GitHub Pages affichait une autre version

Au contrôle, `main` était toujours sur
`2b39ac6da5fddcafe31f4de81d048a3e0e7953da`. Le HTML servi par
<https://neltud.github.io/xArtists/> était identique octet par octet à
`docs/index.html` de ce commit, avec la balise `xartists-build=4.0.3-csp` et
`assets/index-CQ2QocDX.js`.

SHA-256 du HTML observé :
`bf5983dde6c29a80637f221ed9787ee7b142e82afdd2aa2a6721270a95cce0f2`.

Les historiques montrent un workflow Vite et un workflow automatique Pages.
Le mode administratif exact de Pages n'a pas pu être lu ; ne pas le déduire
comme une configuration vérifiée.

La branche distante `codex/xartists-sites-v3-exact` contenait une importation
partielle : les catalogues de phrases et plusieurs scripts de rendu étaient
absents. La source complète a été récupérée depuis la version Sites 3,
commit `8a607c8831234fe738a091a5a4caf325811c1b5b`.

## Intégration réalisée

- Design V3 complet, sculpture, catégories, recherche, alias et huit langues.
- Playlist Nelson conservée ; lecteur global stable lorsque caché ; arrêt par
  démontage. La navigation ne remonte pas le lecteur.
- Musée V3 : textures non éclairées, rapport d'image conservé, chargement CORS
  avec alternatives et nettoyage des textures après fermeture.
- Plein écran via un conteneur de portal stable : le même canvas est déplacé,
  sans remonter la scène. Interface immersive et safe areas du design V3.
- Connexion xPortal : activation SDK, annulation, expiration et QR local.
- Correctifs de signature TCA, de plafonds et de paiements conservés. Les anciens
  chemins Paybox non signés et les anciennes URL MoonPay ne sont pas restaurés.
- Directives Vellum présentes dans `docs/VELLUM_LIA_WALLET_DIRECTIVES.md`.

## Vérifications

- 14 tests frontend, 10 tests Access API et 7 tests Python : **31 réussites**.
- 96 routes déclarées, 36 modules, aucun lien interne non résolu au contrôle.
- 64 rendus d'interface et 288 rendus de modules sur huit langues : réussis.
- Régressions simulées de navigation mobile, collisions, activation wallet,
  refus, expiration, annulation et QR : réussies.
- 3703 phrases distinctes et 147 clés d'interface vérifiées.
- Builds de production GitHub Pages et Sites : réussis.
- YAML et syntaxe shell du workflow : vérifiés.
- TypeScript global reste en échec avec 78 diagnostics préexistants, contre 87
  au dernier contrôle ; aucun diagnostic ajouté. Voir `audits/typecheck-v3-2026-10-21.json`.

Aucune signature wallet, aucun paiement et aucune transaction réelle effectués.
Le son réel YouTube et le rendu WebGL sur téléphone physique ne sont pas attestés.

## Suite GitHub Pages

La branche locale `fix/v3-release-pages` contient l'intégration complète. Elle
conserve les correctifs préparés précédemment et les nouvelles directives Vellum.

Le workflow prépare un `build-info.json` avec le SHA de source et copie le même
build dans le snapshot `docs/` avant publication de l'artefact Pages. Les pages
Markdown et les données de `docs/data/` sont conservées. Aucun push forcé.

Si la protection de `main` refuse la mise à jour du snapshot par le workflow,
utiliser les permissions et le parcours de revue du dépôt, ou choisir GitHub
Actions comme source unique dans les paramètres Pages. Ne pas contourner la
protection. Une modification du mode administratif Pages exige un accès de
mainteneur et les permissions Pages et Administration appropriées.

La fusion et le déploiement GitHub Pages ne sont pas affirmés : leur publication
reste bloquée par l'accès GitHub actuel. Le statut du site V3 hébergé est distinct.
