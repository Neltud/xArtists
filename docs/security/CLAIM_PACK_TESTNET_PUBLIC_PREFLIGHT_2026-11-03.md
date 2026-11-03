---
description: >
  claimPack V1 public testnet readiness: read-only chain-ID preflight,
  offline WASM/ABI reproducibility, and manual deployment blockers.
---

# claimPack — préparation testnet public, chain-id et NO-GO

**Statut 2026-11-03 :** outils de vérification et construction du contrat ajoutés
sur une PR de développement ; **aucun déploiement testnet ou mainnet**, aucun
portefeuille, aucune signature de voucher, aucun achat PayBox ni mint live.

## Les trois identités à ne jamais confondre

1. **Identité de la transaction** : MultiversX impose le champ \`chainID\`
   dans chaque transaction. Les identifiants réseau officiels sont
   mainnet \`1\`, testnet \`T\`, devnet \`D\`. Une transaction signée sur \`T\`
   n'est pas valide sur \`1\`. Ceci protège le *transport de transactions*.
2. **Identité du message voucher** : les 146 octets signés par Ed25519
   contiennent le domaine \`XA-CLAIM-PACK-V1\0\`, la chaîne \`T\`, les 32
   octets de l'adresse du contrat, epoch, hash de commande, buyer, prix EUR,
   temps et version catalogue. Le contrat source enregistre \`T\` comme une
   constante : il vérifie une signature de domaine \`T\` **sans lire l'ID
   de chaîne du consensus**.
3. **Identité effective de la VM qui exécute le contrat** : elle ne peut
   pas être déduite du domaine \`T\` ajouté par le même contrat. Dans
   \`multiversx-sc 0.66.2\`, nous n'avons pas établi de fonction
   \`blockchain().get_chain_id()\` fiable à utiliser dans ce contexte.
   **Ce manque n'est pas résolu par le nouveau contrôle HTTP.**

**Conséquence sécurité :** les vouchers \`T\` peuvent, en principe, être
acceptés par une copie du contrat installée à l'adresse identique sur une
autre chaîne si elle a la même clé de vérification. Le simple fait que
la transaction entrante contienne une autre valeur \`chainID\` ne protège
pas le contenu Ed25519 lu et reconstruit **par le contrat**. La mitigation
opérationnelle (code testnet uniquement, clé claim dédiée, revue
d'artefact, inventaire d'adresses, ne jamais déployer ce binaire en mainnet)
réduit le risque **sans constituer une preuve cryptographique sur chaîne**.

## Vérification réelle des réseaux publics — lecture seule

\`services/access-api/src/claimTestnetNetworkPreflight.mjs\` et son script
CLI sont **sans secret, sans import de wallet et sans POST** :

\`\`\`bash
node --test services/access-api/tests/claimTestnetNetworkPreflight.test.mjs
node scripts/claim-testnet-public-preflight.mjs
\`\`\`

La sonde lit seulement les domaines fixes :

- \`https://testnet-gateway.multiversx.com/network/config\` : requiert
  \`data.config.erd_chain_id = "T"\`.
- \`https://gateway.multiversx.com/network/config\` : témoin distinct
  \`data.config.erd_chain_id = "1"\`.

Elle vérifie \`code = successful\`, types du schéma, version minimale
de transaction, nombre de shards, refus de redirection, taille JSON
bornée à 64 Kio et HTTP 200. Une panne réseau ou une divergence de
chaîne produit un **échec** et bloque la suite. Ce résultat constitue
une observation de deux fournisseurs réseau publics, **pas** une
preuve indépendante de l'identité de la VM d'un futur contrat.

Le workflow \`.github/workflows/claim-testnet-readonly-network.yml\` exécute
les cas négatifs avec réponses simulées puis la sonde sur les réseaux
réels, sans clé API.

## Construction offline de l'artefact WASM

Le crate \`contracts/claim-pack-testnet/meta\` référence exactement
\`multiversx-sc-meta-lib = 0.66.2\`. Procédure :

\`\`\`bash
(
  cd contracts/claim-pack-testnet/meta
  cargo run -- abi
  cargo run -- build --no-wasm-opt --no-imports
)
find contracts/claim-pack-testnet/output -name '*.wasm' -exec sha256sum {} \;
\`\`\`

Le workflow \`.github/workflows/claim-pack-testnet-wasm.yml\` génère
WASM/ABI et publie une archive GitHub Actions **non revue** à rétention
sept jours. Il n'autorise aucune diffusion sur blockchain, ni
chargement de secret de déploiement. Le hash WASM doit être comparé
aux octets effectivement soumis lors du déploiement humain.

## Critères pour une éventuelle opération testnet

- [ ] Dossier de décision sécurité : résoudre ou accepter explicitement,
  de façon documentée et argumentée, le manque de vérification
  indépendante de \`chainID\` dans la VM. Pas de GO si la garantie
  demandée est la séparation cryptographique stricte multi-chaîne.
- [ ] Build \`wasm32v1-none\`, ABI, digest SHA-256 et revue du code
  généré ; vérifier l'absence de \`setPackPrice\` dans le nouveau contrat.
- [ ] Répéter **12/12 scénarios whitebox** et ajouter les tests
  de gas insuffisant, cross-shard et des signatures lors de
  changement de signer. Les 12 tests VM ne prouvent pas la
  livraison S2 sur réseau public.
- [ ] Déployer **uniquement sur testnet** avec une identité
  de déploiement testnet distincte, sous contrôle humain ;
  **aucune clé, PEM, mnemonic, seed ou secret claim dans ce dépôt/CI**.
- [ ] Vérifier ensuite la transaction et le contrat **réel** sur
  \`testnet-api.multiversx.com\` / gateway testnet : code hash,
  owner, adresse, \`isClaimsPaused=true\`, aucune collection ni
  signer utilisable sans opération de gouvernance.
- [ ] Attribuer ensuite le rôle \`ESDTRoleNFTCreate\` à une collection
  NFT testnet dédiée seulement après validation de tous les
  contrôles précédents.
- [ ] Réaliser l'essai contrôlé d'une unique commande **fictive** sur
  testnet : signer claim-only de test séparé du deployer, transaction
  buyer xPortal signée par l'opérateur, comparer reçu, events, nonce,
  collection, adresse, quantité et statut; prouver l'anti-rejeu.
- [ ] Ne jamais relier cette preuve aux droits PayBox ou
  \`delivery_verified\` en prod. Conserver sur #281 le contrôle humain
  de \`SELECT to_regclass('public.mint_jobs')\` dans la **vraie DB Render**.

## Décision

**GO :** recherche, tests locaux/VM, sondage public GET, génération WASM/ABI
et revue hors chaîne. **NO-GO :** mainnet, checkout public, issuer,
mint live, déploiement automatisé, inscription secrète de signer,
LIA live, pont TRO et certification automatique d'œuvre.

Sources officielles : [constantes et chain IDs](https://docs.multiversx.com/developers/constants/),
[REST network config](https://docs.multiversx.com/sdk-and-tools/rest-api/),
[sc-meta / build](https://docs.multiversx.com/developers/meta/sc-meta-cli/).
