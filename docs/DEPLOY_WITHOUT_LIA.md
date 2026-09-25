# Deploy SC sans PEM LIA

**Principe** : le secret s’appelle parfois `LIA_WALLET_PEM` dans le workflow —
c’est **uniquement un nom de variable**. Tu peux y mettre le PEM du **deployer
éphémère** (`erd1kex0p…`). Ce n’est **pas** le wallet ops LIA.

## Option recommandée

1. Settings → Secrets and variables → Actions → **Repository secrets**
2. Créer **`SC_DEPLOYER_PEM`** = contenu du PEM deployer (sandbox)
3. Lancer workflow **Deploy Smart Contracts**
   - chain = `1`
   - confirm_mainnet = `DEPLOY_MAINNET`
   - contract = `nft-staking`
4. Après codeHash OK → **supprimer** le secret

Le SC déployé reste immuable on-chain sans le PEM.

## Remboursement EGLD deployer

Si tu préfères ne pas déployer : indiquer une adresse `erd1…` destinataire ;
le solde ~0,58 EGLD du deployer peut être renvoyé (moins gas).
