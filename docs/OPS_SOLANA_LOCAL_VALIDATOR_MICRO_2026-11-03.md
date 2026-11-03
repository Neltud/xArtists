# Solana — preuve du microtransfert sur validateur local (3 novembre 2026)

## Pourquoi ce test

Le [microtest public Devnet #41610214449](https://github.com/Neltud/xArtists/actions/runs/41610214449) s'est arrêté
avant toute diffusion : `requestAirdrop` a répondu **HTTP 410**. Les
estimations de frais ont réussi, mais **aucun transfert sur Devnet n'est prouvé**.

Pour isoler l'authenticité de notre code de transaction du blocage du faucet
public, cette nouvelle suite lance un **validateur Agave local** sur
`http://127.0.0.1:8899`, sur un runner GitHub Actions éphémère.

## Preuve attendue

- Binaire `solana-test-validator` téléchargé depuis la publication
  officielle Anza [Agave v4.3.0](https://github.com/anza-xyz/agave/releases/tag/v4.3.0)
  (version fixée, jamais de script `install | sh`).
- Test hors ligne : sans `XARTISTS_ALLOW_LOCAL_VALIDATOR_SEND=1`,
  aucune requête locale ou diffusion ne doit être effectuée.
- Deux comptes Ed25519 **éphémères en mémoire** ; aucun portefeuille xArtists,
  PayBox, xPortal, LIA, ni secret permanent.
- Le faucet du **validateur local**, pas le faucet Devnet public, crédite
  chaque compte de 0,001 SOL **fictif** pour garantir la réserve minimale.
- Un seul transfert natif de **1 000 lamports locaux** est signé par le
  compte de test et envoyé au registre isolé.
- `getSignatureStatuses` doit confirmer `err=null` et le bénéficiaire
  doit gagner **exactement 1 000 lamports** avant d'émettre
  `LOCAL_SOL_MICRO_CONFIRMED` dans les logs.
- Le registre et les clés sont supprimés avec le runner CI. La signature
  locale n'est **pas consultable sur Solscan ou l'explorateur Devnet**.

## Interprétation des résultats

| Test | Signification |
|---|---|
| Encodeur Ed25519 / base58 / shortvec vert | Transactions sérialisées et signées dans les fixtures |
| `LOCAL_SOL_MICRO_CONFIRMED` + 1 000 lamports | Transfert exécuté par un véritable validateur local |
| Faucet public HTTP 410 | Devnet public **toujours bloqué** |
| Transaction publique Devnet | **Non prouvée**, nécessite son propre reçu et RPC |

Le microtransfert local ne valide pas un pont $TRO, une émission NFT
MultiversX, un paiement PayBox, ni la possession du portefeuille PayBox
historique. Il ne remplace pas une preuve indépendante de transaction
Solana **mainnet**.

**Tous les garde-fous de production restent OFF** :
`PAYBOX_CHECKOUT_ENABLED=0`, `MINT_DISPATCH_ENABLED=0`,
`MINT_LIVE_ENABLED=0`, `LIA_LIVE_TRADING=0`, bridge TRO désactivé.
Les portes S1/S2/refund restent ouvertes dans
[l'issue #281](https://github.com/Neltud/xArtists/issues/281).
