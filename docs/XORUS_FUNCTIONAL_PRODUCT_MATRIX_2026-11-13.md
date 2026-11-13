# xOrus — reconstruction fonctionnelle du moteur LIA (13 novembre 2026)

**Objet :** la valeur du produit est l'analyse de données de marché, l'aide à la décision traçable, les alertes et les agents, **pas** une illustration 3D, un hologramme ou une carte NFT. Cette note sépare le code livré des preuves absentes.

## Inventaire hérité réel

| Fonction historique LIA/Chorus | Entrée et sortie attendues | État du code vérifié | Critère de disponibilité |
|---|---|---|---|
| Tape : prix/volume/volatilité/funding | Observations horodatées par marché, horizon 1h/24h | Catalogue défini ; quelques scoreurs Python existent ; flux manquants | Sources contractuelles, stabilité, licences, frais et timestamps |
| Scout : DEX/on-chain | xExchange, OneDex, événements, liquidité et slippage | Scoreurs partiels, multiples axes non alimentés | Paires/adresses exactes, double lecture, timestamp et intégrité |
| Crowd : social | mentions, qualité auteurs, sentiment et rumeurs | 10 IDs définis, aucune garantie de flux | Autorisations de source et gestion bot/rumeur |
| Curator : art/NFT | transactions, floors, royalties, provenance | 10 IDs définis, valeurs absentes sur l'actuel board | Traçabilité NFT, anti-wash-trading et droits de redistribution |
| Macro | contexte BTC/ETH/USD/événements | Catalogue, aucune implication automatique d'entrée | Données sourcées et périmètre |
| Sentinel | veto sous -0,35, contrôles et blocage opérateur | Logique de veto incluse dans xOrus decision_agent | Veto ne peut être contourné par IA, manque de données ou un client |
| Chair IA | 3 faits cités, 1 risque, poids ≤15% | Validation hors ligne, citations non attestées | Vérification indépendante des faits, aucune autorisation de signer |
| Scribe | décision + justification + preuve/âge de chaque source | Engine Python et JSON de board existent, publication statique datée | Event idempotent, versionné, sans secrets et jamais présenté comme live |

**Attention :** 12 familles × 10 axes = **120 définitions**, pas 120 connecteurs actifs. La publication `data/xorus_board.json` du 11 novembre déclare 9 signaux sur 4 familles en historique *paper*. Elle ne fournit aucune attestation indépendante des neuf valeurs. Le moteur `lia/xorus/decision_agent.py` retourne `ABSTAIN` par défaut et `verified_core_signals=0`.

## Première tranche de rétablissement — PR du 13 novembre

- `XorusDecisionDesk` sur la page xOrus : affiche enfin la **décision**, le **motif**, l'**âge de la source**, les **seuils**, la **provenance**, les **preuves manquantes** et la place des huit rôles.
- `xorusDecisionReadout.mjs` : rejette les faux JSON live, dates impossibles/futures et nombres invalides. Même une stance positive dans un snapshot client reste `ABSTAIN`. Aucune signature, ordre, achat ou exécution.
- `xorus_signal_catalog.json` : projection exacte et consultable des 120 IDs canoniques Python, tous étiquetés `defined_not_verified`; filtre par famille/identifiant, sans inventer de flux.
- Lecture `api.multiversx.com/economics` pour **contexte ponctuel EGLD** seulement. L'heure de réponse du navigateur n'est pas une attestation de date source. Si l'API échoue, aucune cotation inventée n'est montrée. **Jamais admise comme signal décisionnel ou produit premium sans preuve/contrat.**
- Tests Node + Python qui valident la fraîcheur, les faux scores, le verrou paper et la parité exacte des 120 noms ; CI doit être verte avant merge.

## Phases de restauration restantes (par preuves)

1. **Collecte des marchés** : connecter des adapters serveurs indépendants (prix, volume, carnet, funding, DEX, art, on-chain). Tracer `provider`, `source_ts`, `received_at`, `license_ref`, provenance des octets et expiration. Ne pas recopier des valeurs de démonstration.
2. **Normalisation et calcul** : développer/valider les scoreurs réellement applicables par famille et par horizon, traiter prix incohérents, trous temporels, faible liquidité, outliers et retards de réseau.
3. **Décision** : exécuter l'essaim Python déjà existant avec des **entrées attestées côté serveur**, audit de chaque famille et veto Sentinel, Chair ≤15% ; choisir `ABSTAIN` tant que 12 signaux core vérifiés dans 3 familles indépendantes manquent.
4. **Journal et API** : publier un rapport signé/horodaté en lecture seule : signaux, preuves, seuils, risques, incertitude, raison du verdict ; revocation et cache TTL. Aucun champ `executable=true` issu du navigateur.
5. **Vrais produits** : Pulse = monitoring/signaux, Yield = simulations et analyse DeFi, Sentinel = risque/veto/alertes. Définir la couverture, fréquence, SLA, support et droits avant de vendre. Compte email sans wallet possible pour service EUR ; wallet signataire distinct pour NFT EGLD.
6. **Commercialisation** : contrat de licence fournisseurs + entitlement serveur + parcours abonnements webhooks/résiliation + delivery de service vérifiée, puis seulement bouton Acheter. Le prix des maquettes (99/149/129 €) **n'est pas tarif contractuel validé**. N'annoncer aucune rentabilité ni accès immédiat non confirmé.

## Droit des données : blocage commercial concret

La licence CoinGecko **Demo / free** ne suffit pas à vendre une application reposant sur les données API. La licence commerciale payante autorise l'affichage avec attribution, **pas** la redistribution ou la revente d'un feed/API sans contrat spécifique (source : https://support.coingecko.com/articles/1043089972-what-are-the-differences-between-commercial-and-custom-licenses). Même règle de vérification pour Artprice, données sociales et autres fournisseurs. Les lectures on-chain publiques ne sont pas des preuves de droits de redistribution privés.

## Porte de sortie et sécurité

Ni `LIA_LIVE_TRADING`, ni PayBox, Stripe, Pinata, mint ou vente NFT n'est activé par cette reconstruction. Le résultat du système est de l'**analyse consultative** et une justification compréhensible ; un utilisateur doit avoir les droits d'accès appropriés pour tout service marchand, et toute action transactionnelle exige son autorisation.
