---
description: "Prompt de reprise Grok : PR200 actualisée, correctifs vérifiés, relais LIA et pilote TCA Academy."
---

# Prompt Grok — reprise du sprint xArtists

Actualisé le 28 octobre 2026 après lecture du runbook Render/Neon et du main `5c2c053…`. **Brouillon GitBook, non publié et non envoyé directement à Grok.** Cette version remplace les instructions antérieures demandant de terminer #200 : cette PR est maintenant mergée. Les SHA ci-dessous sont un instantané : relire les tips avant action. Le connecteur GitHub ChatGPT lit le dépôt mais sa dernière écriture a été refusée (403).

## État constaté avant rédaction

* `main` : `5c2c053d476837b3f30e8f87df4817e54cb8c71e`, release 0.119.7. Aucune PR ouverte au relevé.
* PR #200 : **mergée** le 28 octobre à 16:01:44 Europe/Paris ; commit de merge `3fd2850076f9f090460a6e121259c2b5efa459d5`. Son dernier head était `fdc406ff27ab940b8c3cf475c26ec581d12a4cf6`.
* Dernière CI Paybox de ce head avant merge : run `40699296815`, job `122854467857` ; **61 tests, 59 pass, 2 fail**. Échecs : `order access: other user denied` et `idempotent delivery + restart persistence`. Les fichiers lock/test lus sur le main actuel ont conservé ces contenus ; ce nombre est celui de la CI pré-merge, pas un nouveau test exécuté sur main.
* Vite/Pages sur le main actuel : run `40726942162`, job `122952634629`, **échec `npm ci` à l'installation API**, avant build ; déploiement sauté. Un workflow distinct « pages build and deployment » est vert, ce qui ne prouve pas que le nouveau build Vite a été livré.
* Le workflow supprime actuellement le lock, lance `npm install --ignore-scripts --no-package-lock`, puis régénère un lock avec une étape contenant `|| true`. Son succès ne valide donc pas le lock committé ni un `npm ci` reproductible.
* Historique au tip `644e303…` : le lockfile a été relu par le connecteur puis récupéré indépendamment par Git : **5 858 octets, JSON invalide, cinq `sha512-placeholder`**. SHA-256 observé : `1cbccd719d483d9eabb952ee76cff822645eb215b7a0a21dc3066d325f32f6fb`. C'est un défaut constaté du fichier ; le titre du commit « complete package-lock » n'est pas une preuve de complétude.

Le lock sur le main relu reste réduit : **351 octets, une seule entrée `packages` (la racine)**, blob `64bdf09eef7bbd3cc5fc5af7e7d36ec392aa21b5`. `paybox_v2.test.mjs` contient toujours ses assertions synchrones, blob `7af593c424cacd0d8644d91f92722fa75c2833a6` ; le helper `assemble-lock.sh` ne prouve pas que le lock committé est complet. Ne pas confondre ce constat actuel avec le défaut JSON historique ci-dessus.

## Runbook Render/Neon reçu

[Runbook source au SHA relu](https://github.com/Neltud/xArtists/blob/5c2c053d476837b3f30e8f87df4817e54cb8c71e/docs/DEPLOY_RENDER_NEON_GO_2026-10-28.md). Le merge est confirmé ; la préparation du déploiement reste incomplète. Corriger d'abord lock/tests/CI dans une nouvelle PR. Remplacer ensuite le build Render `npm install` par `npm ci --ignore-scripts`, choisir une version LTS maintenue et testée (Node 24 proposé ; Node 20 est EOL), garder les déploiements manuels et vérifier le SHA exact. Rendre `REQUIRE_SIWX=1` explicite. `/health` déduit `orders_backend` de l'environnement sans tester Postgres ; exiger une recette durable sur une base sandbox isolée avant de déclarer le store prêt. Un fallback fichier éphémère ne valide pas ce jalon. Budget 0 € : vérifier plans, quotas et conditions de dépassement ; aucune URL `onrender.com` d'exemple ne vaut endpoint attesté.

Sources officielles : [Render Free](https://render.com/docs/free), [Neon Free](https://neon.com/docs/introduction/plans), [versions Node.js](https://nodejs.org/en/about/previous-releases). Aucun déploiement ni accès à un secret effectué pendant cette revue.

## Prompt à copier dans Grok

```text
Tu reprends le travail sur Neltud/xArtists à la demande du propriétaire. Travaille en sprint approfondi, avec preuves vérifiables et sans annoncer comme livré ce qui est seulement préparé.

MANDAT ET LIMITES
- Budget additionnel : 0 EUR. N'active aucun abonnement, service payant, achat ou consommation de crédits non prévue.
- Mode paper / sandbox. LIA_LIVE_TRADING et VITE_LIA_LIVE_TRADING restent à 0 ; VITE_PAYBOX_ENABLED reste false.
- Aucun merge vers main, déploiement, paiement réel, signature/broadcast, mint, burn, changement de secrets ou permissions sans GO humain spécifique.
- Ne publie aucun post X, vidéo YouTube ou miniature et ne contacte aucun tiers dans ce sprint.
- Aucun secret, PEM, token, email d'authentification ou donnée client dans les prompts, commits, logs et kits.

PROTOCOLE DE TRAVAIL PARTAGÉ
1. Relis le tip et les SHA des chemins avant CHAQUE écriture.
2. Un chemin a un seul writer. Réserve les chemins ; l'autre agent vérifie les empreintes.
3. Source de reprise : kits GitBook et leurs manifestes SHA-256. Un texte de commit, badge IA ou message d'agent ne remplace pas une lecture de fichier et un test réel.
4. Si un chemin ou le manifest package a évolué depuis le kit, compare et adapte ; ne remplace pas à l'aveugle et ne force-push pas.
5. Si une archive ou le brouillon GitBook est inaccessible, annonce précisément le blocage. Ne prétends pas l'avoir téléchargé ou validé.

SOURCE DE TRAVAIL
Dossier GitBook CR #14 :
https://app.gitbook.com/o/KMZP0M6knXUIxNX1Dujn/s/7uFQg6p9cNvePhELkvN3/~/changes/dtZjJSEhYdDCufA0wJPo/
Les trois archives, liens et SHA-256 sont attachés à la page de ce prompt.
Les commits de préparation ci-dessous sont LOCAUX et non poussés ; ils peuvent être absents du remote. Utilise les patchs et fichiers complets des archives, pas une supposition qu'un cherry-pick distant fonctionnera.

P0 — CORRECTIF POST-MERGE #200 AVANT TOUTE NOUVELLE INFRA
#200 est mergée, commit 3fd2850076f9f090460a6e121259c2b5efa459d5. Main relu : 5c2c053d476837b3f30e8f87df4817e54cb8c71e (release 0.119.7), zéro PR ouverte au relevé. Relis main et la CI avant de diagnostiquer ou modifier. Si un défaut est déjà corrigé, vérifie-le et ne réapplique pas un ancien patch.
La dernière CI Paybox avant merge a fait 61 tests, 59 pass, 2 fail dans paybox_v2.test.mjs ; ne la présente pas comme un nouveau run main. Les contenus défectueux lock/test sont encore présents sur main. Le run Vite/Pages 40726942162 sur main échoue sur npm ci à l'installation API, avant build/deploy. Un workflow Pages distinct vert ne remplace pas cette preuve.
Le lock courant contient 351 octets et une seule entrée packages. Le workflow Paybox supprime le lock, utilise npm install --no-package-lock et tolère un échec de régénération avec || true : cela ne valide pas le lock committé. Au tip historique 644e303, un autre lock était JSON invalide et contenait cinq intégrités placeholder ; ne réintroduis pas ce fichier.

Réserve côté Grok :
- services/access-api/package-lock.json
- services/access-api/tests/paybox_v2.test.mjs
- .github/workflows/paybox-p0-review.yml, uniquement pour rétablir l'installation API déterministe.
- docs/DEPLOY_RENDER_NEON_GO_2026-10-28.md, pour rendre le runbook cohérent avec les contrôles ci-dessous.
Relis .github/workflows/static.yml : npm ci y est déjà présent et révèle le lock incomplet. Conserve cette exigence ; n'y ajoute pas de contournement npm install.
Relis aussi services/access-api/scripts/assemble-lock.sh avant toute utilisation ; son existence ne remplace pas le lock complet versionné.

Kit de correction #200 : commit local 38fcb546e58dd1c996c98101581cc9f11b10e13c, parent 21e043d33644da04facab8915ea55827f056d122.
- Vérifie d'abord la compatibilité du package.json courant avec le kit.
- Restaure le lock complet généré par npm, avec ses vrais champs resolved/integrity ; ne le réécris pas manuellement et n'utilise aucun placeholder. Le kit complet fait 49 546 octets et contient 115 entrées packages.
- Vérifie la syntaxe JSON, puis une installation propre avec npm ci --ignore-scripts. Ne contourne pas ce contrôle par npm install dans la CI, désactivation des intégrités ou changement gratuit des versions SDK.
- Rends les deux tests v2 réellement asynchrones : await des stores et assert.rejects pour les refus asynchrones. Conserve les assertions d'ownership, idempotence, et preuve de restart dans un nouveau processus. Une activité async après la fin du test est un échec à corriger, pas un warning à masquer.
- Remets npm ci --ignore-scripts pour l'étape API du workflow. Retire le contournement qui supprime le lock, --no-package-lock et le || true de régénération ; restaure le lock API parmi les fichiers de clé de cache npm. N'affaiblis ni les contrôles HTTP/IPN/SIWX, ni le TLS Postgres, ni les assertions métier.
- Ne réécris pas orders.mjs, server.mjs ou payments.test.mjs par une ancienne copie du kit ; ces chemins ont leur propre historique et ne font pas partie de ce correctif.
- #200 étant mergée, crée une NOUVELLE branche depuis le main relu, par exemple fix/post200-api-lock-and-async-tests, puis une PR non-draft. Ne pousse pas un correctif en supposant que l'ancienne PR le livrera. Pousse après relecture du tip et validation. Attends la CI DU NOUVEAU SHA et rapporte les étapes exécutées, échouées ou sautées. Le kit a passé 61/61 API sous Node 20 et 24 localement ; ce résultat ne vaut pas CI distante. Si le nombre de tests évolue, cite le nombre réel sans supprimer de tests pour atteindre 61.
- Laisse cette nouvelle PR ouverte pour revue, sans merge.

RUNBOOK INFRA À RECTIFIER, SANS DÉPLOYER
- Le titre GO Deploy du fichier source n'est pas à lui seul un ordre d'exécuter ses commandes ni une preuve de readiness.
- Build Render cible : npm ci --ignore-scripts, après réparation du lock ; aucun npm install utilisé comme masque de l'échec.
- Node 20 est hors support : proposer Node 24 LTS, valider API/frontend/build sur cette version et rendre la CI et le runbook cohérents. Ne change pas la plateforme ou les versions à l'aveugle.
- Garder les déploiements manuels et le SHA candidat attesté. Aucun auto-deploy de chaque nouveau main n'est autorisé par ce prompt.
- Rendre REQUIRE_SIWX=1 explicite, garder LIA_LIVE_TRADING=0 ; Paybox/MoonPay/Stripe marchands non configurés tant que leur recette n'est pas autorisée. Ne pas fournir de PEM/signataire réel au service.
- /health renvoie orders_backend d'après DATABASE_URL, pas d'après une requête SQL. Un 200 et postgres ne prouvent ni connectivité, ni schéma, ni persistance. Préparer une recette Postgres isolée : écriture d'ordre fictif, second processus/restart, refus autre acheteur, rejeu IPN de fixture, contrainte provider_tx_id et panne DB sans attribution de droits. La décrire comme préparée tant qu'elle n'a pas tourné.
- Sur Render, absence de DATABASE_URL et backend file éphémère bloquent la validation du jalon durable. Le 501 Paybox sans secrets vient du checkout authentifié, pas du endpoint de challenge SIWX.
- Le devis de démonstration accepte un taux envoyé par le client ; son succès ne valide pas un taux de paiement marchand ou la parité on-chain.
- Budget 0 EUR : plans Free vérifiés, quotas contrôlés, aucun dépassement ou upgrade payant accepté. Render Free peut dormir ou être suspendu et les dépassements de certains quotas peuvent être facturés si un moyen de paiement est présent. Ne promets pas un coût nul garanti sur le seul nom Free.
- Utiliser l'URL retournée par Render après création autorisée, jamais l'URL d'exemple comme preuve. Ne modifier VITE_ACCESS_API_BASE ni relancer Pages avant les prérequis et le GO applicable.

P0 SUIVANT — CACHE RUNTIME ET TEMPS DES DEVIS
Kit indépendant : code 35bbe27cf861add96c2936685e0d30535cc91feb ; docs 073e2d22698e918f944d97858791ab45f2db7bd9, base main 11583286b455732762bb81bbe82190183215382c.
Chemins de code :
- apps/frontend/src/lib/runtimeCodehash.ts
- apps/frontend/tests/ab_residual_cache.test.mjs
- services/access-api/src/quote.mjs
- services/access-api/tests/quote_expiry_security.test.mjs

Relis les chemins actuels. Prépare une PR non-draft séparée après revue des différences.
Objectifs : fermer sur date invalide/future ou durée de devis incohérente ; empreinte cache obligatoire ; révocation immédiate au démarrage du refresh ; délai maximal 8 s pour requête et corps JSON ; ancienne réponse incapable d'écraser un résultat plus récent ; panne de sessionStorage incapable de ressusciter une observation positive dans le document actif.
Preuves locales du kit : API 68/68, frontend 49/49 sous Node 20, Python Paybox 7/7, build et verify:site réussis. Montage isolé avec le correctif #200 : API 70/70.
Le cache UI ne remplace pas l'autorisation serveur. Le contrôle des dates ne fournit ni taux serveur, ni devis signé/persisté/consommé.

TCA ACADEMY ET RELAIS LIA
Kit indépendant : correctif mentor 7bc22143c480e26ac4419e3ee9c64196045e2112 ; docs d79f36030c42a11aaf6059dca13abf62f9d9742b, même base main.
Chemins de code : apps/frontend/src/lib/tcaRag.ts et apps/frontend/tests/tca-mentor.test.mjs.
Corriger la récursion sans fin sur question inconnue/base vide ; une seule relaxation du filtre professeur, puis réponse honnête d'absence de connaissance. Préserver sources et périmètre de leçon.
Preuves locales : 7/7 dédiés, 47/47 frontend, build et verify:site réussis ; montage frontend avec le lot cache/devis : 56/56. Prépare une PR de revue séparée, pas une activation de contenu payant.

Les documents et JSON préparent un relais LIA : lectures, contrôles, propositions et revue. Aucun second exécuteur, runtime de fond ou connexion Vellum n'a été installé. Ne les présente pas comme une automatisation déjà déployée.
TCA Academy : quatre masterclasses proposées (sfumato, paysage à l'encre, géométrie, relief), conducteur original du premier cours et sources de musée. Les vidéos, sous-titres et droits des médias restent à produire/valider. Aucune vidéo ni métrique SEO n'a été générée.
vidIQ : une chaîne autorisée, 150 crédits au dernier contrôle, 0 consommé. Définir le budget de crédits avant les recherches ; aucun job média ou publication implicite.
MoonPay : outils disponibles, mais statut partenaire et intégration marchande non attestés. Un achat crypto ne prouve pas l'achat d'un pack xArtists.

DOCS ET PRIORITÉS APRÈS LES CORRECTIFS
- Ne remplace pas docs/SUMMARY.md par une ancienne copie : plusieurs kits ajoutent des liens différents. Fusionne les ajouts et préserve frontmatter, métadonnées GitBook et assets.
- Garde ouverts les blocages restants : budgets de risque durables/atomiques et corruption fail-closed, claims JWT iss/nbf, tests Postgres réel et restauration, recette SIWX/xPortal, taux serveur et livraison des droits. Aucun de ces travaux n'est clôturé par des tests du store fichier.
- Prix client conservés : 110 / 75 / 50 EUR, marge 4 % interne, EGLD arrondi supérieur à 4 décimales, tolérance 0,02 EUR, TTL devis 12 min. Ne change aucun prix SC ni seulement l'affichage pour prétendre à la parité.
- Accès pack, NFT artistique et objet physique sont des offres distinctes. Custody/assessment/burn sans wallet reste paper ; pas de droits activés parce que LIA détient un NFT ou qu'une URL contient ?paid=.
- Le contrôle quotidien à 08:00 Europe/Paris existe déjà : ne crée pas une seconde automation et ne publie pas automatiquement.

SORTIE ATTENDUE À CHAQUE LOT
Tableau court : tip relu, writer et chemins réservés, changement concret, SHA-256, commandes réellement exécutées, résultats/compte des tests, SHA poussé, URL PR, CI de ce SHA et blocages restants.
Distingue LOCAL PRÊT / POUSSÉ / CI VERTE / MERGÉ / DÉPLOYÉ. Ne déclare jamais une étape suivante sur la seule preuve de la précédente. Termine par trois priorités, sans merge ni déploiement.
```

## Archives de référence

| Lot | Archive vérifiée | Taille | SHA-256 |
|---|---|---|---|
| PR #200 | [Kit correctif #200](/files/U62fiwgRktZNQ2RVKcaX) | 49 106 octets | `77122c33b04c947b06df3867ad6a6384bd37f5086923a8e0c50b265d4df8650b` |
| Cache/devis | [Kit sécurité suivant](/files/81y9M34KROBL05trFXpf) | 78 022 octets | `b0b87f29b948f32b307818bd09b97320e512a9c8160094b5f64959e7dd0a413a` |
| LIA/TCA | [Kit relais et TCA Academy](/files/ARyLsTBf7JkXNLp5JPJw) | 71 000 octets | `61aef12505c6f0c5da09f5ae67e44db33d493deaac1ad0ac0fe4f924d6020698` |

Vérifier le SHA de l'archive, puis ses fichiers via son manifeste. Les liens de pièces jointes et le brouillon peuvent demander une autorisation GitBook : l'accès par Grok n'a pas été attesté. Cette page prépare la passation ; elle ne signifie pas qu'un message a été envoyé à Grok.
