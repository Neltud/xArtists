# xArtists — Registre public des modules et état opérationnel

**Mise à jour : 5 novembre 2026.** Source : `apps/frontend/src/experience/modules.ts` sur la PR #397, après la refonte light-first de #396.

## Définitions non interchangeables

- **Publié / accessible** : la route s'ouvre et ses éléments de consultation peuvent être testés, sans garantie que toutes les dépendances métier fonctionnent.
- **Lecture réelle** : données issues d'un endpoint traçable ; une erreur réseau ou une source périmée est explicitement signalée, jamais reconstruite artificiellement.
- **Démonstration / paper** : prévisualisation, configuration locale ou simulation, **pas** un ordre ni une preuve de propriété / paiement / mint.
- **Opération live** : mutation signée, confirmée et réconciliée en production. **Aucun GO global n'est délivré**.

Le routeur enregistre **40 modules canoniques**, plus les alias, les pages d'accueil, offres et fiches de packs. La navigation et l'annuaire rendent tous les modules repérables ; un lien visible n'active pas les fonds.

| Domaine | Modules accessibles | Posture opérationnelle |
|---|---|---|
| Découvrir | Maison, Musée 3D (opt-in), Enchères, RWA, Marketplace, Tours, Analytics, Éditions, Lieux, Guide | Consultation ; certaines fiches sont démonstratives. Enchères et listings ne valent pas transaction. |
| Créer | Studio, NFT Factory / Distributeurs, Jumeau numérique, Académie TCA, Visibilité | Préparation, catalogue, flux non financiers. Le mint public et la distribution payante restent verrouillés. |
| Intelligence | LIA, Packs Pulse/Yield/Sentinel, Command Center, Lightning, Simulation, Réseau d'entités | Paper-first, pas d'ordres live. Pas de graphes de signaux fabriqués ni de score d'agent inventé. |
| Finance | Trading, $TRO, portail $TRO/Solana, staking, liquidité, Hatom, Burnify, DAO, vente, soutien | Lecture / préparation uniquement selon le module ; bridge, vente, ordres, pools, transferts et votes DAO live **non autorisés globalement**. |
| Espace personnel | Accès dApp, Wallet, Portfolio, Mes packs, Identité, Paiements, Historique, État des services, Légal | Navigation et vues, connexions conditionnelles ; aucune livraison NFT implicite. |

## Contrôles de vérité obligatoires

1. **DAO : 1 unité de pouvoir de vote par unité de $TRO stakée**, sans poids NFT/SFT. Les votes de démonstration sont strictement locaux (`onChain:false`) et ne doivent jamais apparaître comme gouvernance exécutée.
2. **Multichaîne** : MultiversX / xPortal est distinct d'OpenSea Polygon/Solana (découverte en lecture). Aucun pont ni wallet inter-chaînes unique n'est prétendu opérationnel sans preuve.
3. **Fiat** : offres et informations catalogue visibles ; aucune promesse de checkout EUR / EGLD et aucune conversion implicite. S1 paiement signé, S2 livraison NFT + réconciliation restent à prouver (#281, #328, #370).
4. **LIA** : consentements, permissions, quote signé, protection anti-rejeu et opérateur habilité nécessaires avant tout trade, staking, swap, paiement ou agent auto-exécutant. `VITE_LIA_LIVE_TRADING=0` demeure la posture attendue.
5. **Réseaux / liquidité** : « any pool, any chain » est une architecture visée, **pas** une affirmation de pools disponibles ou de bridge $TRO collatéralisé (#298, #391).
6. **Backend / stockage** : les services Render peuvent être déployés sans démontrer S1/S2, le stockage média, les credentials, le bon rôle de minter ou les écritures Postgres. Ne pas convertir leur disponibilité en GO commercial.
7. **Preuves site** : vérifier le SHA effectivement servi sur GitHub Pages, les routes directes, les 40 modules, mobile 360 / 390 / 430 et desktop 1440, les liens vers les packs, ainsi que l'absence de requête non-GET lors du parcours anonyme.

## Étapes du véritable GO transactionnel

Le feu vert doit être **par capacité et par réseau**, jamais via un commutateur « full live » :

- Contrôles d'identité des contrats / chaîne et permissions, tests de sécurité et revue indépendante.
- Postgres et stockage média sécurisés, vérifiés en production ; chaîne preuve paiement signé → commande → mint/fulfillment → propriété → « My Packs ».
- Tests de résistance : IPN invalides / dupliqués, réorg, double livraison, tentative de replay, indisponibilité backend, remboursements et finalité.
- Signature explicite de l'opérateur et contrôles budgétaires, sans activer les secrets ni des permissions privilégiées via l'interface publique.
- Journal de preuve horodaté et validation responsable avant bascule de chaque flag financier.

**Liens internes** : `docs/GO_LIVE_S1_S2.md`, `docs/UX_UNIFIED_MULTICHAIN_FIAT_DAO_2026-11-05.md`, issues #281, #298, #328, #353, #370, #391, #393.
