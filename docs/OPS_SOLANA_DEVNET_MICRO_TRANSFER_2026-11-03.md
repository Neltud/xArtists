# xArtists — microtransfert SOL sur Devnet (3 novembre 2026)

## Objectif et limites

Cette preuve utilise **exclusivement la blockchain Solana Devnet** :
l'environnement de test gratuit, distinct de Solana Mainnet. Le script
`scripts/ops/solana_devnet_micro_transfer.mjs` génère **deux portefeuilles
Ed25519 éphémères en mémoire**, demande au faucet officiel **0,001 SOL
de test** pour financer le premier, puis tente de transférer **0,000001
SOL de test (1 000 lamports)** au second.

La clé privée n'est ni sauvegardée, ni publiée dans les logs, ni
transmise à GitHub/Render. La transaction est signée localement avec la
clé de test éphémère. Il ne s'agit **ni du portefeuille PayBox historique
`sol-default`**, ni du portefeuille LIA SOL, ni d'une transaction
mainnet ou d'un bridge $TRO.

## Activation

Le workflow [`solana-devnet-ephemeral-transfer.yml`](https://github.com/Neltud/xArtists/actions/workflows/solana-devnet-ephemeral-transfer.yml)
a deux niveaux :

1. Sur PR, tests **hors ligne** de format base58, Ed25519, sérialisation
   shortvec et du garde-fou `XARTISTS_ALLOW_DEVNET_SEND`.
2. Après fusion sur `main` du workflow, une **seule exécution CI**
   autorise le test Devnet avec `XARTISTS_ALLOW_DEVNET_SEND=1`,
   puis vérifie le solde du destinataire et la confirmation RPC de
   la signature. Une exécution manuelle ultérieure requiert
   explicitement `workflow_dispatch`.

La requête `requestAirdrop` et la diffusion `sendTransaction`
sont les seules mutations réseau du test. Elles ciblent
`https://api.devnet.solana.com` en dur. Il n'y a pas de PAT,
de clé privée de projet, de paiement PayBox ni d'interaction
avec xPortal/MultiversX.

## Preuve et conditions d'acceptation

- Si le faucet ou le RPC Devnet refuse l'opération, le workflow
  échoue avec `DEVNET_SOL_MICRO_BLOCKED` : **aucun succès
  de transfert n'est revendiqué**.
- Si une signature est acceptée, il faut encore obtenir un statut
  `confirmed` ou `finalized`, `err=null`, et un solde du
  destinataire d'au moins 1 000 lamports.
- **Seul** le message `DEVNET_SOL_MICRO_TRANSFER_CONFIRMED`
  accompagné de `DEVNET_SOL_TX` autorise à annoncer une preuve
  Devnet réussie. Le lien est alors consultable via
  `https://explorer.solana.com/tx/<signature>?cluster=devnet`.
- Aucune transaction sur Mainnet ni sur le portefeuille historique
  `Dmc7RKdPNKcDDeGVW37rPnZZ7jJiPYuCmgB1EMBbRRFN`
  n'est initiée, et aucune preuve de contrôle de ce portefeuille
  PayBox n'est présumée.

## EGLD et PayBox

Les tests antérieurs du [workflow micro-preflight](https://github.com/Neltud/xArtists/actions/workflows/paybox-egld-sol-micro-preflight.yml)
ont estimé le gaz d'un transfert **0,001 xEGLD sur MultiversX Devnet**
et les frais pour 1 000 lamports sur Solana Devnet. Ce sont des
estimations non signées. Les tests PayBox utilisent uniquement des
fixtures cryptographiques synthétiques.

**Le GO commercial reste NO-GO** : `PAYBOX_CHECKOUT_ENABLED=0`,
`MINT_DISPATCH_ENABLED=0`, `MINT_LIVE_ENABLED=0`,
`LIA_LIVE_TRADING=0` et bridge Solana $TRO OFF.
Un test Devnet ne valide pas la possibilité de transférer du SOL
mainnet depuis le credential PayBox `sol-default`.

Pour les étapes S1/S2 et la preuve de possession des NFT,
voir [issue #281](https://github.com/Neltud/xArtists/issues/281).
