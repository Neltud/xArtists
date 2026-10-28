---
description: "Prompt de reprise Grok : PR200 actualisée, correctifs vérifiés, relais LIA et pilote TCA Academy."
---

# Prompt Grok — reprise du sprint xArtists

Préparé le 2026-10-28T14:48:43+01:00. **Brouillon GitBook, non publié et non envoyé directement à Grok.** Les SHA ci-dessous sont un instantané : relire les tips avant action. Le connecteur GitHub ChatGPT lit le dépôt mais refuse encore l'écriture (403).

## État constaté avant rédaction

* `main` : `11583286b455732762bb81bbe82190183215382c`.
* PR #200 : ouverte, non mergée ; dernier tip relu `fdc406ff27ab940b8c3cf475c26ec581d12a4cf6`. La branche évolue pendant la préparation : relire encore son tip avant action.
* CI Paybox du tip : run `40699296815`, job `122854467857` ; **61 tests, 59 pass, 2 fail**. Échecs : `order access: other user denied` et `idempotent delivery + restart persistence` dans `paybox_v2.test.mjs`.
* Le workflow supprime actuellement le lock, lance `npm install --ignore-scripts --no-package-lock`, puis régénère un lock avec une étape contenant `|| true`. Son succès ne valide donc pas le lock committé ni un `npm ci` reproductible.
* Historique au tip `644e303…` : le lockfile a été relu par le connecteur puis récupéré indépendamment par Git : **5 858 octets, JSON invalide, cinq `sha512-placeholder`**. SHA-256 observé : `1cbccd719d483d9eabb952ee76cff822645eb215b7a0a21dc3066d325f32f6fb`. C'est un défaut constaté du fichier ; le titre du commit « complete package-lock » n'est pas une preuve de complétude.

Le lock du dernier tip `fdc406f…` est de nouveau un fichier réduit : **351 octets, une seule entrée `packages` (la racine)**. `paybox_v2.test.mjs` contient toujours ses assertions synchrones ; le helper `assemble-lock.sh` ne prouve pas que le lock committé est complet. Ne pas confondre ce constat actuel avec le défaut JSON historique ci-dessus.

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

P0 — FINIR PR #200 AVANT TOUTE NOUVELLE INFRA
Le dernier tip relu est fdc406ff27ab940b8c3cf475c26ec581d12a4cf6 : la branche évolue, relis son tip et la CI avant de diagnostiquer ou modifier. Si un défaut est déjà corrigé, vérifie-le et ne réapplique pas un ancien patch.
CI Paybox observée : 61 tests, 59 pass, 2 fail dans paybox_v2.test.mjs. Au tip fdc406f, le lock est réduit à 351 octets et une seule entrée packages. Le workflow supprime le lock, utilise npm install --no-package-lock et tolère un échec de régénération avec || true : cela ne valide pas le lock committé. Au tip précédent 644e303, un autre lock était JSON invalide et contenait cinq intégrités placeholder ; ne réintroduis pas ce fichier.

Réserve côté Grok :
- services/access-api/package-lock.json
- services/access-api/tests/paybox_v2.test.mjs
- .github/workflows/paybox-p0-review.yml, uniquement pour rétablir l'installation API déterministe.
Relis aussi services/access-api/scripts/assemble-lock.sh avant toute utilisation ; son existence ne remplace pas le lock complet versionné.

Kit de correction #200 : commit local 38fcb546e58dd1c996c98101581cc9f11b10e13c, parent 21e043d33644da04facab8915ea55827f056d122.
- Vérifie d'abord la compatibilité du package.json courant avec le kit.
- Restaure le lock complet généré par npm, avec ses vrais champs resolved/integrity ; ne le réécris pas manuellement et n'utilise aucun placeholder. Le kit complet fait 49 546 octets et contient 115 entrées packages.
- Vérifie la syntaxe JSON, puis une installation propre avec npm ci --ignore-scripts. Ne contourne pas ce contrôle par npm install dans la CI, désactivation des intégrités ou changement gratuit des versions SDK.
- Rends les deux tests v2 réellement asynchrones : await des stores et assert.rejects pour les refus asynchrones. Conserve les assertions d'ownership, idempotence, et preuve de restart dans un nouveau processus. Une activité async après la fin du test est un échec à corriger, pas un warning à masquer.
- Remets npm ci --ignore-scripts pour l'étape API du workflow. Retire le contournement qui supprime le lock, --no-package-lock et le || true de régénération ; restaure le lock API parmi les fichiers de clé de cache npm. N'affaiblis ni les contrôles HTTP/IPN/SIWX, ni le TLS Postgres, ni les assertions métier.
- Ne réécris pas orders.mjs, server.mjs ou payments.test.mjs par une ancienne copie du kit ; ces chemins ont leur propre historique et ne font pas partie de ce correctif.
- Pousse sur la branche de #200 seulement après relecture du tip et validation. Attends la CI DU NOUVEAU SHA et rapporte les étapes exécutées, échouées ou sautées. Le kit a passé 61/61 API sous Node 20 et 24 localement ; ce résultat ne vaut pas CI distante. Si le nombre de tests évolue, cite le nombre réel sans supprimer de tests pour atteindre 61.
- Laisse #200 ouverte pour revue, sans merge.

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
