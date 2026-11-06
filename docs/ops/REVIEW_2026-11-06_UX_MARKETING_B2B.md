# xArtists — Audit UX 360 / PR / issues / B2B sponsor
**Date :** 2026-11-06. **Périmètre :** dépôts accessibles du compte GitHub lié. **Méthode :** recherche d'issues/PR ouvertes, lecture de dossiers critiques et contrôle statique de fichiers source; **aucun test navigateur réel ni build complet affirmé**.

## État et décision
- **23 issues ouvertes repérées** : 22 dans `Neltud/xArtists`, 1 dans `Neltud/xartists-ovh-ops`.
- **5 PR ouvertes repérées** : 4 dans `Neltud/xArtists`, 1 dans `Neltud/Xmvx-connector`.
- **GO conditionnel** pour exposition du catalogue/musée, démonstrations non transactionnelles et demandes de découverte.
- **NO-GO** pour paiements/mint automatisés, hébergement durable prétendument prouvé, rémunération sponsor, location réelle, ventes multichaines et promesses LIA live.
- Correction ciblée de cette branche : icône xPortal depuis les **assets officiels existants**, favicon de marque, galerie images non recadrées, placeholders partenaires honnêtes, liens CTA, retrait des CID fictifs.
- Les corrections proposées ne sont pas encore une recette du SHA publié; attendre CI, revue et déploiement confirmés.

## Inventaire exhaustif des issues ouvertes détectées

### P0 — Argent, identité et preuve

| Issue | Sujet | Travail restant / décision |
|---|---|---|
| [#281](https://github.com/Neltud/xArtists/issues/281) | Paiement→mint→livraison et DB durable | NO-GO, smoke réel PSP→NFT + remboursement manquant |
| [#328](https://github.com/Neltud/xArtists/issues/328) | claimPack chain ID | NO-GO, isolation réseau côté SC non prouvée |
| [#353](https://github.com/Neltud/xArtists/issues/353) | PayBox Solana custody | NO-GO, signature/contrôle PayBox non prouvés |
| [#367](https://github.com/Neltud/xArtists/issues/367) | LIA BUY_PACK paper | PR cœur déjà fusionnée, smoke UI déployé manquant; paper uniquement |
| [#368](https://github.com/Neltud/xArtists/issues/368) | Classifier FR/EN | Dépendance #366 fermée : re-scoper ou classer en travaux futurs, ne pas activer |
| [#369](https://github.com/Neltud/xArtists/issues/369) | Signed mandates ledger | Non implémenté live; prérequis aux exécutions |
| [#370](https://github.com/Neltud/xArtists/issues/370) | Rail fiat/EGLD et livraison | NO-GO tant que #281 + mandats signés non validés |
| [#403](https://github.com/Neltud/xArtists/issues/403) | Genesis Pulse #005 | IPFS/media + vérification contrat + signature owner requis |
| [#416](https://github.com/Neltud/xArtists/issues/416) | Licence World Rights | Propriété/licence commerciale non réglées; PR #415 à bloquer en vente |

### P0/P1 — Expérience publique et qualité

| Issue | Sujet | Travail restant / décision |
|---|---|---|
| [#347](https://github.com/Neltud/xArtists/issues/347) | Télémétrie LIA fraîche | Pas de source producteur vérifiée, ne pas afficher LIVE |
| [#348](https://github.com/Neltud/xArtists/issues/348) | UX 360 routes & mobile | Recette de toutes les pages et SEO/accessibilité incomplète |
| [#363](https://github.com/Neltud/xArtists/issues/363) | RWA/TRO mobile | Correctifs mergés, recette tactile et déploiement restant |
| [#393](https://github.com/Neltud/xArtists/issues/393) | UX novice DAO/multichaîne/fiat | Navigation partiellement faite, E2E et vrais rails encore bloqués |
| [#391](https://github.com/Neltud/xArtists/issues/391) | OpenSea multi-chaîne | Découverte intégrée, clé OpenSea + live preview non validés |

### P0/P1 — Média, droits et plateforme

| Issue | Sujet | Travail restant / décision |
|---|---|---|
| [#402](https://github.com/Neltud/xArtists/issues/402) | Durabilité IPFS / Studio | 2 replicas indépendants + backup + vraie ingestion non prouvés |
| [#324](https://github.com/Neltud/xArtists/issues/324) | Art-ID / provenance | Classification et droits vérifiés non live |
| [#375](https://github.com/Neltud/xArtists/issues/375) | Plugin Registry / Revenue Router | paper et least-privilege uniquement |
| [#418](https://github.com/Neltud/xArtists/issues/418) | Mémoire on-chain | Preuve ancrée + secrets off-chain non livrés |
| [#371](https://github.com/Neltud/xArtists/issues/371) | Relayed v3 | Adaptateur non testé; dépend mandats, #281 |
| [#372](https://github.com/Neltud/xArtists/issues/372) | AP2/ACP/MX-8004 | Conformité protocole et preuves non livrées |
| [#298](https://github.com/Neltud/xArtists/issues/298) | $TRO / pont Solana | Aucune réserve 1:1 / escrow / bridge mainnet attestée |

### P0 — Commercial

| Issue | Sujet | Travail restant / décision |
|---|---|---|
| [#341](https://github.com/Neltud/xArtists/issues/341) | DNS MX / boite contact | hello@xartists.art non confirmé; prospection email interdite sans réception vérifiée |

### Exploitation cloud privée

| Issue | Sujet | Travail restant |
|---|---|---|
| [OVH #1](https://github.com/Neltud/xartists-ovh-ops/issues/1) | Passerelle OpenStack→GitHub | Rotation du mot de passe aperçu en clair, secrets GitHub via UI, inventory vert ; aucun serveur commandé |

## Revue des PR ouvertes (pas de fusion automatique)

| PR | État observé | Condition avant merge |
|---|---|---|
| [xArtists #421](https://github.com/Neltud/xArtists/pull/421) | Draft, mergeable=true (dernier contrôle), CI verte mais gate manuel | Signed entitlement, paper-only; tests/review secrets, licence #416 bloquante |
| [xArtists #415](https://github.com/Neltud/xArtists/pull/415) | Open, mergeable=true (dernier contrôle), verify échoué | World Rights web + YouTube RO; risque MIT/plugin payant #416, CI non vérifiée |
| [xArtists #409](https://github.com/Neltud/xArtists/pull/409) | Open, mergeable=true | Release 0.130.0; avant fusion vérifier CI, tag/version, pas un GO commercial |
| [xArtists #407](https://github.com/Neltud/xArtists/pull/407) | Draft, mergeable=false | Mint owner Pulse #005; media IPFS/signature/SC upgrade manquants : pas de merge |
| [Xmvx-connector #1](https://github.com/Neltud/Xmvx-connector/pull/1) | Draft WIP | 0 changed file : pas de code prêt à relire; demander prototype + tests |

## Audit des parcours utilisateurs : points de contrôle

| Parcours | Situation code / risque | Revue attendue |
|---|---|---|
| Découvrir sans wallet → musée → galerie | Routes `/explore/museum`, alias `/museum`/`/gallery`; images recadrées sur petits écrans (corrigé sur branche) | 320/360/390/430/768/1280/1440px, images entières, chargement lent, clic œuvre, hors-ligne, focus, clavier |
| Connecter xPortal | Métadonnées déjà présentes, mais capture du propriétaire montre icône vide | Vérifier URLs HTTPS PNG accessibles sans auth, rescan xPortal après déploiement, autorisation wallet sans transaction, retour Android |
| Visiter salles 3D | Plusieurs variantes MuseumWebGL, carte, joystick, catalogue, fallback | Test WebGL indisponible, réduction animation, orientation mobile, retour galerie 2D et performance réelle |
| Trouver/stocker un NFT | `/create/studio`, services de média en préflight | Ne pas prétendre upload durable, état de reprise et erreurs lisibles, preuve de CID et copies #402 |
| Parcours Marketplace → enchères | Preview OpenSea, enchères sandbox | Distinguer vitrine et ordres signés; pas de CTA paiement sans service conforme #281/#391 |
| Explorer packs → demandes | `/offres` discovery-only et URL Github issue public | CTA B2B avec avertissement de publicité publique, canal privé vérifié #341 avant prospection |
| DAO | `/dao` / finance/governance local-only | Retrouvabilité et mention vote de démonstration |
| Publicité sponsor | `AdSlot`, `/create/visibility`, données démonstration | Ne pas présenter une réservation/enchère, source d'image et contrat non approuvés, stats d'exposition non inventées |

**Critères de sortie P1 UX :** toutes les routes et liens testés sur SHA déployé, aucun bouton sans action, mobile et 200% zoom, Lighthouse (LCP/CLS/INP réels), WCAG AA contrôlé, image alt pertinente, skeleton et erreurs utilisables, aucun texte technique brut au premier écran, wallet facultatif pour découvrir.

## Marketing, B2B et sponsoring — décision

### Ce qui peut être annoncé maintenant
- **Visite du musée**, découverte artistique, galerie NFT en lecture, démos paper des agents et intentions de partenariat. Lien canonique : https://neltud.github.io/xArtists/
- Positionnement proposé (hypothèse marketing) : « espace immersif où artistes, galeries et partenaires culturels montrent des collections et expérimentent l'art Web3, sans obligation de wallet pour découvrir ».
- Acquisition organique en français/anglais; aucun budget publicitaire engagé à ce stade.

### Ce qu'il ne faut pas vendre/annoncer comme opérationnel
- Paiement public, mint automatique, livraison garantie NFT, fidélisation liée à rendements, performance de trading, bridge/fiat live, réserve de visibilité achetable, inventaire publicitaire garanti.
- Captures de prototypes ou scènes WebGL comme preuve d'utilisateurs réels, audience mesurée ou partenariats signés.
- Une adresse `hello@xartists.art` tant que DNS/MX et deux tests de réception/réponse ne sont pas prouvés (#341).

### Offre B2B sponsor à tester sans facturation
- **Segments hypothétiques :** galeries, lieux culturels, artistes/collectifs, marques souhaitant une exposition artistique clairement identifiée (pas publicité opaque).
- **Proposition pilote non contractuelle :** exposition/galerie virtuelle éditoriale 30 jours, page de présentation accessible sans wallet, créatif fourni avec droits, placement explicitement « sponsorisé » après validation, rapport de visites **uniquement si mesure consentie réellement opérationnelle**.
- **Mesure à instrumenter avant publicité :** sessions consenties, visites qualifiées, entrée musée, clic œuvre, visite partenaire, demande de contact, taux de retour, UX satisfaction, conversion enquiry. Aucune valeur historique/budget/ROI supposée.
- **Acheteurs/parties à valider (rôles hypothétiques) :** direction marketing/partenariats, galerie/commissaire, direction juridique, confidentialité et approbateur des créations.
- **Conditions avant devis/contrat :** domaine/contact privé vérifiés; identité juridique du vendeur et facturation; droit de diffusion images/marque; politique annonces; mentions RGPD; conditions de réservation/annulation et modération; métriques et période de garantie réellement observables.
- **Séquence :** 1) corriger pages et contacts, 2) démonstration 3D vérifiable sur mobile, 3) 3 à 5 entretiens découverte sans collecte publique de PII, 4) pilote non facturé et mesuré, 5) contrat limité puis tarification après preuve.

### Lancement marketing — risques et mesures
| Risque | Sévérité | Action | Responsable suggéré |
|---|---|---|---|
| Contact public via GitHub et email non joignable | P0 | Réparer contact et vérifier réception avant outreach | Propriétaire domaine / ops |
| Offre sponsor affichée comme vendue alors que maquette | P0 | Libellés non transactionnels, liens publics corrigés | Frontend / commercial |
| Preuves de durabilité média manquantes | P0 | #402, second pin+backups+readback | Infra |
| Preuves de livraisons/paiements absentes | P0 | #281, garder checkout off | Finance / contrats |
| Wallet logo vide | P1 | Corriger métadonnées depuis assets officiels, test xPortal réel | Frontend |
| UX 3D dépendante GPU et tactile | P1 | Recette smartphone + fallback 2D | UX / QA |
| Aucune performance marketing sourcée | P1 | Faire baseline consentie, éviter promesses ROI | Growth |


## Vérification externe du site publié et marketing (6 novembre 2026)

### Recette publique du site déjà publié (pas cette branche)
Audit navigateur public réalisé sans wallet ni achat : [enregistrement](https://agent.tinyfish.ai/runs/f05c36e5-debe-4d82-9033-33e1c1ab019d).
**7 parcours sur 7 ont chargé** : accueil, musée, alias galerie, marketplace, studio, offres et visibilité. La galerie redirige volontairement vers le musée ; marketplace annonce l'absence de ventes vérifiées ; Studio annonce l'upload IPFS indisponible ; parcours sponsors signale la vente fermée.
**Limites :** la visite a confirmé l'affichage des CTA mais n'a pas soumis tous les formulaires ni testé les signatures. Le navigateur n'a pas simulé 360/390 px ; **responsive tactile, WebGL bas de gamme et image WalletConnect dans xPortal restent inconclusifs**. Ce n'est ni une preuve de qualité exhaustive ni une preuve du futur déploiement de la PR.

### Metricool — état réellement connecté, lecture seule
- Marque Metricool **7765529** : **YouTube uniquement** apparaît connecté dans les paramètres; aucun compte X/Twitter, LinkedIn ou Bluesky vérifié dans cette marque.
- **9 publications planifiées dans la fenêtre novembre 2026** inspectée, toutes marquées `draft=true`, `autoPublish=false` et `PENDING` par leur réseau. **Ne pas annoncer une campagne sociale déjà publiée à partir de ces brouillons**, y compris les dates révolues.
- Aucun chiffre sourcé d'impressions, de leads sponsor, de ventes ou d'abonnements attribuables à cette campagne dans ces lectures. La mesure d'audience et les annonces payantes restent à concevoir.
- **Actions proposées :** authentifier les réseaux cibles avec consentement et contrôle de marque, préparer la ligne éditoriale art-first, valider une publication pilote YouTube avec média réel, instrumenter analytics consentis, puis étendre à LinkedIn/X après tests des liens de contact.

## Politique de fusion / déploiement
**Contrôle CI :** #421 20 checks OK mais draft ; #415 25 checks OK / 1 verify KO, dont 6 tests Playwright sur le comportement OAuth lorsque backend absent ; #407 4 checks OK mais draft ; #409 aucun check sur son HEAD ; aucun résultat de fusion légale/financière n'en découle.\n\n**Ne pas merge automatiquement** les PR #407/#421 (draft), #415 (conflit licence) ou le connecteur WIP. #409 reste candidate seulement après CI/release-review. Aucune signature de wallet/autorisation transactionnelle fournie par cet audit.

Le nouveau lot UX est un correctif proposé sur branche, **sans activation des flags financiers**. Les tests source ajoutés ne remplacent pas les tests de navigation déployée ni le contrôle xPortal depuis un téléphone réel.
