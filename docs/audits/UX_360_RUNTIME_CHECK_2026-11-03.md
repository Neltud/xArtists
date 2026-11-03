# UX 360 — Contrôle HTTP/render des 38 modules + blocages finance (3 novembre 2026)

**Nature des preuves :** lecture du registre de routes et sources frontend + récupération *read-only* du contenu des 38 URLs canoniques de xArtists Pages, via TinyFish. **Cela ne constitue pas un test de fonctionnement de chaque contrôle**, ni une certification d'accessibilité, WebGL, wallet, signature ou mobile 390px. Les essais de parcours interactifs desktop sont archivés dans [l'audit navigateur](https://agent.tinyfish.ai/runs/18bbbb5e-723c-4333-994e-ad08293c313a). Les routes Pages peuvent servir un bundle antérieur au dernier `main` pendant le déploiement et les caches PWA.

## Couverture route par route

| Groupe | Modules (extraits selon `experience/modules.ts`) | URLs contrôlées | Résultat texte/état |
| --- | --- | ---: | --- |
| Explore | Musée, enchères, RWA, Marketplace, Tours, Analytics, Éditions, Venues, Guide | **9** | Chargées, mais guide ancien en prod au contrôle précédent ; RWA valorisations simulées affichées sans contexte assez visible |
| Create | Studio, Digital Twin, Academy, Visibility | **4** | Chargées ; visibilité comportait instructions de transfert EGLD manuel, maintenant supprimées dans PR de correction |
| Intelligence | LIA, Agents, Command, Lightning, Simulation, Entities | **6** | Chargées ; hub paper, Command sample avec badge « LIVE », réseau des agents avec ancien état août |
| Finance | Trading, TRO, TRO/Solana, Staking, LP, Hatom, Burnify, DAO, Sale, Support | **10** | **3 écrans d'erreur** : TRO/Solana (préchargement JS), Hatom et Support (provider React manquant) |
| Workspace | App install, Wallet, Portfolio, Packs, Identity, Payments, History, Status, Legal | **9** | Chargées ; Status montre `mode=live` brut et Slot casino, historique d'agents avec entrées executed à attester |

**Total = 38/38 URLs interrogées, 35 réponses de page et 3 pages d'erreur internes**. La couverture des 57 alias est uniquement **vérifiée dans le code** ; les 57 alias ne sont pas tous testés en navigateur. Un HTTP 200 ne suffit pas à valider un module React.

## P0/P1 constatés et reproduction

1. **P0 / Finance Hatom** — `/finance/hatom/` → fallback « Page unavailable / useMultiversXContext must be used inside MultiversXProvider ». Source : `HatomPage` appelle `useMultiversX()` alors que `main.tsx` ne monte pas ce contexte. Correction : provider seulement dans les routes qui utilisent ce hook ; pas de polling global de plus.
2. **P0 / Finance Support** — `/finance/support/` → même erreur pour `Tip.tsx` importé par `TipPage`. En outre, le code des services Tip propose des tarifs manuels et une transaction signable : une revue commerciale/juridique dédiée demeure nécessaire, indépendante du simple correctif React.
3. **P1 / TRO-Solana** — `/finance/tro/sale/` → « Unable to preload » dans le fallback d'erreur. Route d'information essentielle, pas un bridge réel. Correction préventive : importer le composant et sa CSS dans le registre au lieu d'un chunk lazy fragile pour les liens directs. Re-tester en production après Pages et vider tout cache PWA obsolète.
4. **P0 / Publicité Visibility** — `/create/visibility/` → le code affichait « Paiement V1 = transfert EGLD manuel vers LIA Ops » et créait un pseudo `ADS_BID` en copiant un mémo. Les enchères publicitaires ne sont pas ouvertes ; cette formulation peut provoquer un versement sans prestation. Correction : vitrine de formats sans wallet ni montant, zéro instruction de dépôt et aucun dispatch.
5. **P1 / RWA** — `/explore/rwa/` : `data/rwa_catalog.json` porte `paper:true` et des estimations illustratives du 5 octobre. Ex. « Neon Atelier Study » score IA et « Proxy $841.62 », mention de garde `in_vault`. **Aucune expertise, propriété ni garde attestée**. Correction : avertissement en tête et sur chaque carte, chiffres explicitement fictifs, état de garde non vérifié.
6. **P1 / Service Status** — `/workspace/status/` → texte brut `mode=live · envLiveCapable=true · marketPayable=true`, RCE et « Slot casino » visibles. La disponibilité technique de certains SCs ne prouve pas que le checkout, les enchères, les paiements ou le trading sont ouverts. Correction : message public fiable d'abord, diagnostics opérateur dans section explicitement dépliable.
7. **P1 / Reste** — `/finance/staking/` affiche « TRO Spot LIVE », LP affiche des TVL estimées, DAO liste « Open real Slot » comme proposition ; ces panneaux demandent un audit de source/horodatage et une séparation systématique simulations ↔ contrats.
8. **P1 / Traductions** — Market, Studio, Auctions et RWA mélangent FR/EN même avec l'interface anglaise ; concevoir une campagne i18n par écran pour les huit locales, et tester direction RTL.

## Correctifs suivis

- PR [#355](https://github.com/Neltud/xArtists/pull/355) : sculpture accueil 2D-first mobile (fusionnée).
- PR [#356](https://github.com/Neltud/xArtists/pull/356) : guide 8 étapes sans slot et termes juridiques accessibles (fusionnée).
- PR finance du sprint : contexte par route, publicités no-send, RWA paper, status public-first, lien TRO robuste, tests régression ; **statut GO uniquement après CI, merge et smoke du Pages déployé**.

## Tests encore nécessaires (non revendiqués)

- Vérifier le rendu sous vrais viewports 360, 390, 430, 1280 et 1440 px, zoom 200 %, WCAG 2.2 AA, Tab/Shift-Tab/Escape et `prefers-reduced-motion` ; captures signées avec SHA Pages déployé.
- Pour les 17 modules publics, enregistrer les états loading/empty/timeout/offline, dates de source et liens CTA ; tester les parcours négatifs sans wallet et la permanence des alertes de sécurité.
- Pour les 21 lab, tester explicitement chaque route et éviter de donner des paiements, prix, autorisations ou garanties fictifs.
- Vérifier que le premier mint réel, la livraison pack, l'enchère et le bridge restent NO-GO tant que #281/#298/#328 ne sont pas fermées par des preuves indépendantes.

**Rappel release :** accès public GO ; transactions commerciales, bridge, trading LIA, achat marketplace et enchères mainnet NO-GO.
