# Audit UX xArtists V3 — matrice 38 modules, 57 alias (3 novembre 2026)

**Périmètre vérifié :** code source du registre `apps/frontend/src/experience/modules.ts`, `softLaunch.ts`, et première lecture statique de **38 modules de page** ; parcours de visite sans wallet **8 écrans desktop** sur le site public. Le navigateur de capture n'offrait pas de forçage à 360/390/430 px, donc **aucun PASS mobile visuel** n'est revendiqué à partir de ces captures.

**Preuves de navigation et captures (session navigateur en lecture seule) :** [TinyFish — visite Home / Musée / Marketplace / Auctions / Studio / LIA / Offres+guide / Legal](https://agent.tinyfish.ai/runs/18bbbb5e-723c-4333-994e-ad08293c313a). Aucune connexion de wallet, upload, enchère, paiement, mint ni signature.

**Census dérivé du code :** 38 modules ; 57 alias, **sans doublon dans ce registre** ; 17 core et 21 laboratoires. Le registre `config/routeRegistry.ts` de l'ancienne architecture n'est pas celui exploité par `App.tsx` actuellement ; éviter de le traiter comme la source de vérité sans analyse des consommateurs.

## Verdict de parcours desktop, preuves et limites

| Étape | URL | Résultat UX | Finding prioritaire |
| --- | --- | --- | --- |
| 1 · Home | `/` | **PASS visite desktop** | La sculpture chargeait WebGL automatiquement même sur mobile dans l'ancien code. #355 fusionnée : opt-in sur mobile, économie de données et reduced-motion ; nouvelle capture mobile encore requise. |
| 2 · Musée | `/museum` | **PASS découverte desktop / PARTIAL a11y** | Visite 3D et navigation précédent/suivant observées ; navigation clavier, lecteurs d'écran, mode réduit et tactile 360px non vérifiés. |
| 3 · Marketplace | `/marketplace` | **PASS découverte / NO-GO vente** | Catégories claires, mais zéro listing certifié ; mélange FR/EN et acronymes NFT/RWA/SFT non expliqués. |
| 4 · Enchères | `/auction` | **PASS présentation / NO-GO enchères** | Un lot éditorial, sans enchères réelles ; `AUCTION_ENABLED` est du jargon visible ; wording « hybrid ». |
| 5 · Studio | `/studio` | **PASS aperçu d'interface / NO-GO upload/mint** | Formats JPG/PNG/WebP et MP4 + limite claire ; pas de fichier réellement téléversé, ni IPFS ou NFT reçu ; consentement long. |
| 6 · LIA | `/lia` | **PASS lecture paper / PARTIAL fraîcheur** | Horodatages, shadow P&L, source de publication ; miroir Vellum ancien, pas de flux temps réel garanti (#347). |
| 7 · Offres/guide | `/offres`, `/guide` | **PASS offres / FAIL guide historique** | Offres correctement sans checkout ; ancien guide affichait un Slot fermé comme live et des statuts opérateur. Correction dans #356. |
| 8 · Juridique | `/legal` | **PARTIAL** | Présence des contenus ; contrôles Terms/Conditions ambigus et cibles tactiles trop petites. Correction dans #356. |

**Ne pas surinterpréter :** PASS signifie qu'une page ou un parcours de lecture est accessible en desktop, PAS que les transactions, wallets, images, WebGL sur chaque appareil, latences réseau, 200 % zoom, langues autres que la langue observée ou WCAG sont validés. La session n'a pas inspecté visuellement les 21 laboratoires.

## Inventaire unitaire — composants vérifiés au niveau source

`Core` = visible dans la navigation publique/browse ; `Lab` = route préservée mais cachée du browse par défaut. La colonne « Prochain contrôle » décrit une **lacune ou une vérification nécessaire**, et non un constat fonctionnel vérifié sur 38 écrans.

| # | ID | Groupe | Classe | Route canonique | Alias | Priorité | Prochain contrôle / constat |
| --- | --- | --- | --- | --- | ---: | --- | --- |
| 01 | `app` | workspace | Core | [`/app`](https://neltud.github.io/xArtists/app) | 2 | P1 | Install/QR + xPortal; heading H1 missing in initial source, fixed #356; verify PWA install on iOS/Android |
| 02 | `museum` | explore | Core | [`/explore/museum`](https://neltud.github.io/xArtists/explore/museum) | 2 | P1 | 3D experience inspected on desktop; test keyboard and touch gestures, reduced-motion and 2D fallback on real devices |
| 03 | `auction` | explore | Core | [`/explore/auction`](https://neltud.github.io/xArtists/explore/auction) | 2 | P1 | Demo artwork only; no verified bids; remove raw AUCTION_ENABLED wording from initial visitor screen |
| 04 | `rwa` | explore | Core | [`/explore/rwa`](https://neltud.github.io/xArtists/explore/rwa) | 2 | P1 | Provenance and physical ownership terms need seller/custody proof; verify ambiguous LIVE badges |
| 05 | `market` | explore | Core | [`/explore/market`](https://neltud.github.io/xArtists/explore/market) | 3 | P1 | Three catalog categories; no certified listings; add genuine verified examples and accessible empty states |
| 06 | `tours` | explore | Lab | [`/explore/tours`](https://neltud.github.io/xArtists/explore/tours) | 3 | P2 | Cultural itinerary lab; no checkout; verify map data, loading, consent and source provenance |
| 07 | `analytics` | explore | Lab | [`/explore/analytics`](https://neltud.github.io/xArtists/explore/analytics) | 1 | P2 | Lab market dashboards; small tabs and mixed paper vs index data; keyboard/contrast tests |
| 08 | `editions` | explore | Lab | [`/explore/editions`](https://neltud.github.io/xArtists/explore/editions) | 1 | P2 | SFT lab status must disclose token validity and secondary market readiness |
| 09 | `venues` | explore | Lab | [`/explore/venues`](https://neltud.github.io/xArtists/explore/venues) | 1 | P2 | Venue lab; external links and wallet permissions need test |
| 10 | `studio` | create | Core | [`/create/studio`](https://neltud.github.io/xArtists/create/studio) | 1 | P0 | Local JPG/PNG/WebP/MP4 preview confirmed; IPFS upload/mint user journey blocked; no fake minted receipt |
| 11 | `twin` | create | Lab | [`/create/digital-twin`](https://neltud.github.io/xArtists/create/digital-twin) | 1 | P2 | Digital twin prototype; verify no legal title claims and photo/3D mobile loading |
| 12 | `academy` | create | Lab | [`/create/academy`](https://neltud.github.io/xArtists/create/academy) | 2 | P2 | Partner gate; no implied paid course entitlement; privacy and auth path review |
| 13 | `ads` | create | Lab | [`/create/visibility`](https://neltud.github.io/xArtists/create/visibility) | 1 | P2 | Visibility lab; review form consent, advertising claims and disabled publishing |
| 14 | `lia` | intelligence | Core | [`/intelligence/lia`](https://neltud.github.io/xArtists/intelligence/lia) | 1 | P0 | Paper/shadow labels improved; snapshot freshness and stale hub feed remain #347; no false execution LIVE |
| 15 | `agents` | intelligence | Core | [`/intelligence/agents`](https://neltud.github.io/xArtists/intelligence/agents) | 2 | P1 | Genesis pack access vs Whop subscriptions; no active checkout and delivery #281 |
| 16 | `command` | intelligence | Lab | [`/intelligence/command`](https://neltud.github.io/xArtists/intelligence/command) | 3 | P2 | Operator console should remain lab-only; hide trading controls from visitor-first UX |
| 17 | `lightning` | intelligence | Lab | [`/intelligence/lightning`](https://neltud.github.io/xArtists/intelligence/lightning) | 1 | P2 | AI agent lab: verify LIVE wording against genuine source refresh |
| 18 | `simulation` | intelligence | Lab | [`/intelligence/simulation`](https://neltud.github.io/xArtists/intelligence/simulation) | 2 | P2 | Paper-only simulation lab; keep all P&L clearly simulated |
| 19 | `entities` | intelligence | Lab | [`/intelligence/network`](https://neltud.github.io/xArtists/intelligence/network) | 2 | P2 | Network visualization needs keyboard fallback, timestamps and visible errors |
| 20 | `trading` | finance | Lab | [`/finance/trading`](https://neltud.github.io/xArtists/finance/trading) | 1 | P0 | Trading lab must remain paper; never treat wallet connection as approval |
| 21 | `tro` | finance | Lab | [`/finance/tro`](https://neltud.github.io/xArtists/finance/tro) | 1 | P1 | Canonical TRO token identity and 6 decimals in #352; distinguish market quotes from reserves |
| 22 | `tro-crosschain` | finance | Core | [`/finance/tro/sale`](https://neltud.github.io/xArtists/finance/tro/sale) | 4 | P0 | Solana bridge OFF, SPL mint not attested; no deposit or sale CTA until audited #298 |
| 23 | `staking` | finance | Core | [`/finance/staking`](https://neltud.github.io/xArtists/finance/staking) | 1 | P1 | Financial feature route public; test no-wallet views and chain status before stake buttons |
| 24 | `liquidity` | finance | Lab | [`/finance/liquidity`](https://neltud.github.io/xArtists/finance/liquidity) | 1 | P1 | DEX/LP lab; never show stale inferred USD pool reserves as current, #352 |
| 25 | `hatom` | finance | Lab | [`/finance/hatom`](https://neltud.github.io/xArtists/finance/hatom) | 1 | P2 | Lending integration lab; gate signable transactions and clearly separate supply vs borrow |
| 26 | `burnify` | finance | Lab | [`/finance/burnify`](https://neltud.github.io/xArtists/finance/burnify) | 1 | P1 | Burnify TRO option seen in third-party selector, exact receiver not verified; local burn intents fail closed #352 |
| 27 | `dao` | finance | Lab | [`/finance/governance`](https://neltud.github.io/xArtists/finance/governance) | 1 | P2 | DAO screen lab; voting/governance privileges and proposal proofs unverified |
| 28 | `sale` | finance | Lab | [`/finance/sale`](https://neltud.github.io/xArtists/finance/sale) | 1 | P2 | Deprecated legacy /sale redirects /offres; preserve safe redirect |
| 29 | `tip` | finance | Lab | [`/finance/support`](https://neltud.github.io/xArtists/finance/support) | 1 | P2 | Donation feature lab; verify recipient/fees before any explicit signing |
| 30 | `wallet` | workspace | Core | [`/workspace/wallet`](https://neltud.github.io/xArtists/workspace/wallet) | 1 | P1 | Read-only wallet overview; test mobile connect/cancel/timeout and focus return without signing |
| 31 | `portfolio` | workspace | Core | [`/workspace/portfolio`](https://neltud.github.io/xArtists/workspace/portfolio) | 1 | P1 | No-wallet and offline empty states, chain balances, item accessibility |
| 32 | `packs` | workspace | Core | [`/workspace/agents`](https://neltud.github.io/xArtists/workspace/agents) | 2 | P1 | My packs: no delivered NFT until reconciled on-chain receipts #281/#328 |
| 33 | `identity` | workspace | Lab | [`/workspace/identity`](https://neltud.github.io/xArtists/workspace/identity) | 1 | P2 | Identity lab: verify user consent and no public exposure of sensitive profile data |
| 34 | `payments` | workspace | Core | [`/workspace/payments`](https://neltud.github.io/xArtists/workspace/payments) | 1 | P1 | Payment status read-only; never equate card redirect with minted/delivered NFT #281 |
| 35 | `history` | workspace | Lab | [`/workspace/history`](https://neltud.github.io/xArtists/workspace/history) | 1 | P2 | Agent events / operator history; source age and idempotency labeling |
| 36 | `status` | workspace | Core | [`/workspace/status`](https://neltud.github.io/xArtists/workspace/status) | 1 | P1 | Operator GO_LIVE and Slot details appear in core status page; replace raw flags with human-readable service state |
| 37 | `legal` | workspace | Core | [`/legal`](https://neltud.github.io/xArtists/legal) | 2 | P1 | Duplicate/ambiguous Terms controls and 44px targets fixed in #356; legal reviewer still required |
| 38 | `guide` | explore | Core | [`/guide`](https://neltud.github.io/xArtists/guide) | 1 | P0 | Public guide included /slot and false SC-live language; rewired to eight safe routes in #356 |

## Causes structurelles et trajectoire de correction

1. **P0 vérité produit :** aucune promesse de paiement, listing, enchère, mint, bridging, trading live ou performance sans réconciliation on-chain/PSP. Issues #281, #298, #328, #347.
2. **P0 ancien guide public :** retirer les redirections `/slot`, les termes « SC live » obsolètes et la checklist opérateur du parcours visiteur. PR #356 ; test automatisé d'absence de faux liens.
3. **P1 performance mobile :** WebGL dans l'accueil doit être optionnel sur petits écrans/low power ; PR #355 fusionnée. Vérifier le véritable gain Web Vitals (LCP, TBT, CLS) sur 360/390/430 px, réseau lent.
4. **P1 i18n :** en sélection anglaise, le contenu Marketplace/Studio/Auctions reste partiellement en français. Prévoir un audit de toutes les 8 langues avec direction RTL et états vides, sans traduction automatique des noms propres.
5. **P1 navigation :** comparer les 38 modules et 57 alias au sitemap de production et aux anciennes redirections. Ne pas supprimer les alias légitimes ; laboratoires accessibles uniquement sur URL explicite, mais pas « privés ».
6. **P1 accessibilité :** audit navigation clavier, focus après modal, touch targets ≥44px, nom accessible de chaque contrôle, champ média prévisualisation, labels de statut, titres H1 et messages d'erreur. Vérifier WCAG par tests techniques réels, pas seulement par impression visuelle.
7. **P1 commercial & confiance :** séparer état « démonstration » et ventes live ; ne pas enregistrer de transactions irréversibles. Rendre les données sources/horodatages lisibles sans clés techniques.
8. **P2 profondeur éditoriale :** de vrais artistes et œuvres vérifiés sur la Marketplace, vrais dossiers de provenance RWA, descriptions légales non ambiguës, visuels et texte responsables.

## Prochain protocole d'essai

- **Mobile** : appareils physiques ou Playwright à 360, 390, 430px ; zoom 200 %, en-têtes et dock, CLS, écran d'orientation, réduction de mouvement ; joindre les captures prises après déploiement.
- **Desktop** : 1280/1440 px, navigation clavier Tab/Shift-Tab/Enter/Escape, lecteurs d'écran, états de chargement 404/500/offline et vues de formulaire sans soumission.
- **Recette par module** : 1) titre H1 2) proposition de valeur 3) CTA 4) disponibilité réelle 5) données sourcées/fraîcheur 6) empty/loading/error 7) keyboard/touch 8) langue/RTL 9) performance 10) aucun appel de transaction inattendu.
- **Release** : déclencher E2E sans wallet et vérifier chaque preuve avec commit déployé. Garder #348 ouvert jusqu'aux captures mobiles, a11y et vérifications d'interactions pour les 38 modules ; cette revue statique n'est **pas** une certification visuelle exhaustive.

**PRs reliées :** [#344 navigation](https://github.com/Neltud/xArtists/pull/344), [#345 LIA public-first](https://github.com/Neltud/xArtists/pull/345), [#355 WebGL mobile](https://github.com/Neltud/xArtists/pull/355), [#356 guide/juridique](https://github.com/Neltud/xArtists/pull/356).
