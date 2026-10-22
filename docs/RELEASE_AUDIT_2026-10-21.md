# Audit release xArtists — 21 octobre 2026

Verdict : **release mainstream bloquée**. Les correctifs ci-dessous sont locaux,
revus et testés. Ils ne prouvent ni une publication, ni un paiement réel, ni une
exécution de trading.

Base de cette continuation : branche distante `fix/player-hide-museum-cors-lia`
à `1ca9e74e27c36fdfddfc74e616217db676222dcf`, issue de `main` à
`2b39ac6da5fddcafe31f4de81d048a3e0e7953da`.
Branche locale : `fix/museum-cors-release-completion`.
Les trois commits distants sont conservés ; le patch de continuation s'applique
au-dessus de cette branche. Aucune PR n'a été trouvée lors du contrôle initial.
Le déploiement Pages publié sur main ne contient pas cette continuation locale.

## Contrôles point par point

| Point | Résultat | Preuve et limite |
| --- | --- | --- |
| Taille du lecteur YouTube | Corrigé dans le code | Fenêtre ouvrable, bouton flottant de 44 px ; la grande miniature permanente a été supprimée. |
| « Cacher le lecteur » | Test DOM réussi | Même objet iframe, même URL et préférence musique active après cacher/afficher, Échap et événements externes. Aucun ordre de pause. Le son sur téléphone réel reste à vérifier. |
| Arrêter la musique | Test DOM réussi | Le bouton démonte l’iframe et désactive la préférence. |
| Œuvres noires dans le musée | Cause réseau identifiée, correction testée | L’image réelle « Strange Cat » est reçue en HTTP 200 depuis media.multiversx.com, sans Access-Control-Allow-Origin. Les relais images.weserv.nl et wsrv.nl renvoient l’image avec ACAO `*`. Le musée les essaie avant l’image directe, sans imbrication des relais. |
| Rendu des œuvres | Corrigé dans le code | Proportions conservées, matériau non dépendant des lumières du musée ; carte « Image indisponible » seulement après épuisement des URL. Rendu WebGL mobile réel non validé ici. |
| Flag production demandé | Build réussi | `VITE_LIA_LIVE_TRADING=1` active uniquement le parcours de signature explicite xPortal. Le workflow Pages porte ce flag. Aucune activation du moteur autonome serveur `LIA_LIVE_TRADING`. |
| Bootstrap 0,001 EGLD | Construction et refus testés | Seul un intent explicitement `LIVE_BOOTSTRAP / BOOTSTRAP_LIVE_1 / EGLD` peut construire le dépôt. Appel `receiveAndSplit`, conforme au contrat Rust du dépôt. Aucun dépôt envoyé. |
| Remplacement d’un swap par un transfert | Défaut corrigé | Les autres intents sont refusés au lieu d’être transformés en transfert générique ou en envoi de TRO. |
| Plafonds 15 USD/opération, 40 USD/jour | Contrôles locaux testés | Refus de NaN, infini, montants invalides et dépassements. Préflight en lecture seule : cours EGLD/USD et codeHash du destinataire. **Le journal localStorage ne constitue pas un budget serveur durable : il peut être effacé, tronqué ou diverger entre appareils.** Frais, réserves de gas et solde disponible nécessitent une validation complète avant généralisation. |
| Plafonds beta Python | Défaut corrigé et testé | Les valeurs NaN/infinies pouvaient contourner les comparaisons numériques. Refus explicite des montants et soldes non finis, des budgets négatifs et des compteurs invalides. |
| Réconciliation des transactions | Tests réussis | Hash réussi, expéditeur, destinataire, valeur et appel attendus doivent correspondre. Un hash ne peut pas valider deux intents. L’identifiant de session xPortal n’est plus enregistré comme hash on-chain. |
| EGLD, USDC-c76f1f, TRO-94c925 et tous ESDT | **Incomplet / bloquant** | Le cœur déclaré est conservé et un validateur de métadonnées ESDT fongibles est ajouté. Ce validateur n’est pas un routeur : cotations, liquidité, slippage, simulations et payloads de swaps vérifiés ne sont pas implémentés. Le backend beta conserve son ensemble fermé. Aucune promesse de trading de tous les ESDT. |
| MoonPay frontend → serveur | Tests unitaires et HTTP réussis | Nouveau POST `/moonpay/sign`, HMAC serveur, hôte/clé/mode/actif/retour autorisés, signature encodée en dernier. Échec de signature = refus ; aucune suppression silencieuse du wallet, aucun lien non signé de remplacement. |
| MoonPay configuration réelle | **Bloqué** | Aucun `MOONPAY_PUBLIC_KEY`, `MOONPAY_SECRET_KEY`, `VITE_MOONPAY_API_KEY` ou `VITE_ACCESS_API_BASE` présent dans l’environnement de travail. Compte marchand, clés correspondantes, activation EGLD, domaine autorisé et paiement sandbox restent à valider chez le prestataire. |
| CSP de l’API de paiement | Build et test réussis | L’origine HTTPS exacte de VITE_ACCESS_API_BASE est ajoutée au connect-src du HTML et de `_headers`. Test de build avec une origine fictive, sans appel à cette origine. Aucun joker ajouté. |
| UI de paiement | Corrigé | Erreurs visibles, distinction test/live, méthode de paiement transmise ; suppression du bouton « Simuler succès UI ». Aucun succès de paiement affirmé sur un simple retour navigateur. |
| Paybox carte e-Transactions | **Non intégré / bloquant** | Le serveur Node répond 501 ; prix serveur Pulse 110 EUR, Yield 75 EUR, Sentinel 50 EUR vérifiés et non remplaçables par un montant client. HMAC marchand, IPN authentifiée, commandes durables et livraison NFT manquent. VITE_PAYBOX_ENABLED reste false. |
| PayBox crypto Solana/EVM | Adaptateur corrigé, connexion **bloquée** | Aucun connecteur PayBox utilisable dans cette session, ni contrat d’API externe implémenté dans le dépôt. L’adaptateur ne suppose plus 0,15 SOL ni un credential de session. Solde, compte, cotation fraîche et budget sont requis ; IDs uniques, refus des dépassements et journal idempotent testés. Une réponse prestataire reste pending_confirmation, jamais executed sans preuve de chaîne. |
| PayBox et MultiversX | Périmètre confirmé dans le dépôt | L’architecture documentée route PayBox vers Solana/EVM et MultiversX vers xPortal. Ces deux intégrations ne doivent pas être confondues. |
| Livraison des packs | **Bloquée** | Le minter de services/access_pack/webhook_handler.py reste un placeholder, même en mode live. Une session de paiement ou une signature ne prouve donc pas une livraison NFT. |
| Authentification d’accès | Corrigée, tests cryptographiques et HTTP réussis | Nonce obligatoire, lié au message exact et au wallet, expirant et utilisable une seule fois. Vérification Bech32 et message signé via SDK MultiversX 13.17.2. FULL exige toujours une preuve signée, même si REQUIRE_SIWX=0. Le frontend transmet un Message SDK et ne répète pas une demande refusée. Test xPortal sur appareil réel restant. |
| Build Vite | Réussi | Build avec flag utilisateur à 1. Les tests sont ajoutés au workflow Pages avant le build. |
| TypeScript global | **Bloquant** | 90 diagnostics sur la base, 87 après changements ; aucun diagnostic ajouté. Trois corrigés dans MoonpayButton, FiatOnRampModal et l’animation du musée. Les 87 autres restent à traiter. |
| Dépendances | Verrouillage ajouté | Lockfiles dédiés frontend et Access API ; workflow passé à npm ci. SDK-core 13.17.2 commun au client et au serveur. Les installations propres et leurs résultats sont consignés dans le compte rendu de continuation. |
| Déploiement de ce correctif | **Non effectué** | L’accès GitHub d’écriture a renvoyé HTTP 403 « Resource not accessible by integration ». Aucun lien de PR ni nouveau déploiement n’est revendiqué. |

## Vérifications exécutées

- Frontend : `npm run test:release` — **13 tests réussis**.
- Access API : `node --test services/access-api/tests/*.test.mjs` — **10 tests réussis**,
  dont les signatures SDK et rejets anti-rejeu, le vecteur fixe officiel MoonPay, les réponses HTTP 200/400/403/413/429/503,
  l’absence de paiement Paybox fictif et les prix imposés par le serveur.
- Adaptateur crypto : `python -m unittest discover -s tests/regression -p test_paybox_release.py -v`
  — **7 tests réussis**, dont les plafonds beta, sans réseau et sans écriture des journaux réels.
- Régression : `LIA_LIVE_TRADING=0 python tests/regression/test_trading_stack_gates.py`
  — **5 contrôles existants réussis**.
- Build : `VITE_LIA_LIVE_TRADING=1 npm run build` — réussi.
- Contrôle des diagnostics TypeScript par rapport aux sources de la base Git :
  **90 → 87, aucun ajouté**. `npm run typecheck` reste donc en échec.
- Lecture publique de l’API MultiversX : codeHash treasury_splitter conforme à
  `MAINNET_CODEHASH.treasury_splitter` au moment du contrôle. Cela ne prouve pas
  que le contrat acceptera une transaction donnée.
- Aucune signature wallet, transaction, achat ou conversion réelle exécutée.

Le test DOM ne lit pas le flux YouTube. Aucune vérification du son, de l’autoplay,
des safe-areas physiques, du joystick ou du rendu GPU mobile n’est revendiquée.

## Configuration à fournir par l’opérateur

Le fichier `services/access-api/.env.example` décrit les variables serveur.
La signature MoonPay nécessite une paire de clés du même environnement :

- Serveur : `MOONPAY_PUBLIC_KEY`, `MOONPAY_SECRET_KEY`,
  `MOONPAY_RETURN_URL=https://neltud.github.io/xArtists/`,
  `CORS_ORIGIN=https://neltud.github.io`.
- Build Pages : `VITE_ACCESS_API_BASE` vers ce serveur HTTPS et
  `VITE_MOONPAY_API_KEY` contenant uniquement la clé publique correspondante.
  Le workflow lit les variables GitHub ; la clé publique peut aussi provenir
  d’un secret GitHub existant. **Aucune clé secrète ne doit porter un préfixe VITE_.**
- PayBox crypto : identifier le prestataire et fournir son connecteur ou son
  contrat d’API officiel, puis sélectionner explicitement le compte autorisé.
  Ne pas réutiliser un identifiant historique ni déduire un solde.
- Paybox carte : contrat marchand, environnement de recette, identifiants,
  secret HMAC côté serveur, clés de vérification IPN, stockage durable et
  mécanisme de livraison. Ne pas activer le bouton avant ces intégrations.

## Conditions restantes de publication mainstream

1. Terminer les swaps ESDT avec cotation vérifiée, simulation, limites de frais,
   réserve de gas, budget durable, gestion des confirmations et signature humaine.
2. Brancher le vrai PayBox retenu ; passer les cas succès, refus, annulation,
   timeout, doublon et reprise, avec une preuve de chaîne ou de paiement vérifiée.
3. Déployer l’Access API HTTPS, configurer les clés via le stockage de secrets du
   prestataire, tester MoonPay sandbox et vérifier le destinataire dans le checkout.
4. Terminer et tester la livraison des packs ; vérifier le login signé avec un vrai appareil xPortal.
5. Résoudre les erreurs TypeScript globales ; conserver et contrôler les lockfiles aux mises à jour.
6. Tester sur téléphone : ouvrir/cacher/rouvrir/arrêter la musique, changer de
   page, ouvrir le musée et contrôler des œuvres réelles, plein écran et rotation.
7. Pousser les commits, fusionner une PR prête si le dépôt l’exige, attendre le
   workflow static.yml du **nouveau SHA**, puis vérifier le site publié sur ce SHA.
   Ne pas utiliser l’ancien run réussi comme preuve de cette correction.

## Sources prestataires consultées

- [MoonPay : signature des URL](https://dev.moonpay.com/widget/on-ramp/customization/url-signing)
- [Verifone : appel de la page de paiement](https://www.paybox.com/espace-integrateur-documentation/la-solution-paybox-system/appel-page-paiement/)
- [Verifone : gestion de la réponse et IPN](https://www.paybox.com/espace-integrateur-documentation/la-solution-paybox-system/gestion-de-la-reponse/)

Les tests de signature utilisent exclusivement des fixtures publiques ou fictives.
Ils ne valident pas l’accès à un compte prestataire ni une capacité d’achat réelle.

## Corrections de la continuation

Le helper distant était présent sans aucun appel depuis le musée. Il est maintenant
appelé par `MuseumWebGLHallLive.tsx`, avec annulation après fermeture et libération
des textures reçues tardivement. Le helper utilise les alternatives CORS communes
et n’imbrique pas les proxies.

Le SDK WalletConnect installé attend un objet `Message` avec un champ `data`.
L’ancien frontend essayait une chaîne, puis `{ message }` ; le serveur vérifiait
la signature Ed25519 des octets bruts. La continuation utilise le contrat SDK
côté client et `MessageComputer.computeBytesForVerifying` côté serveur. Les tests
signent des challenges avec des clés éphémères de test et vérifient le parcours
HTTP complet, sans compte wallet réel ni opération financière.

Le guide PayBox disponible identifie le serveur officiel
`https://api.paybox.sh/mcp` et une authentification OAuth par l’hôte. Aucun outil
PayBox n’est cependant exposé dans cette session et la recherche de plugin n’en
a pas fourni. Ne pas demander de token, clé privée ou seed en chat.

## Validation finale de la continuation

- Frontend : installation propre `npm ci --legacy-peer-deps`, **13 tests réussis**.
- Access API : installation propre `npm ci --ignore-scripts`, **10 tests réussis**.
- Python : **7 tests réussis** ; les 5 contrôles existants de trading stack passent également.
- Aucun lockfile ne référence un chemin local ou un lien vers un autre checkout.
- Build production avec `VITE_LIA_LIVE_TRADING=1` réussi ; playlist et bouton Cacher présents dans le bundle.
- Comparaison TypeScript sur la base distante : **90 → 87, zéro nouveau diagnostic**.
  Détail des 87 diagnostics dans `docs/audits/typecheck-2026-10-21.json`.
- Musée complet conservé, helper `loadTextureWithFallback` réellement importé et appelé.
- Aucun paiement, transfert, swap ou signature de wallet réel exécuté.

La publication demeure distincte de ces contrôles locaux. La tentative de création de l’arbre Git pour publier le correctif a été
refusée avec HTTP 403 « Resource not accessible by integration ». La continuation est
fournie sous forme de patch Git pour une reprise avec un accès authentifié.

Pour une API déployée sur plusieurs instances, le registre de challenges en mémoire
doit être remplacé par un stockage partagé à consommation atomique, ou le routage
doit rester sur une instance. Les redémarrages invalident actuellement les challenges
en cours ; ils ne les rendent pas réutilisables.
