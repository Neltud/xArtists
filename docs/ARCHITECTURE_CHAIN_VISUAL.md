# Architecture chaîne ↔ visuel (mainnet)

## Lecture (RPC → UI)

```
[ MULTIVERSX BLOCKCHAIN ]
      |
      | (Lecture RPC api.multiversx.com)
      V
[ FRONTEND SDK / fetch ]
      |
      | solde, codeHash, getTotalStaked
      V
[ empireStore + chainMirror ]
      |
      | données formatées
      V
[ ChainObjectCanvas / ArtAtelierBackdrop ]
  (couleur, glow, intensity)
```

Modules : `lib/chainMirror.ts`, `hooks/useChainMirror.ts`, `components/ChainObjectCanvas.tsx`

## Écriture (user → SC)

```
[ UTILISATEUR ] clic objet 3D-lite
      V
[ React / ChainObjectCanvas ]
      V
[ xPortal / Web Wallet ] signature
      V
[ MULTIVERSX SC Rust ]
      V
[ Event / confirmation ]
      V
[ TxShell + empireStore + UI ]
```

## Production live checklist

- [x] tro_staking redeploy + stake dust
- [x] marketplace / venue / dao / treasury LIVE
- [x] slot_casino déployé
- [x] Pages GitHub + CODEHASH secrets
- [ ] User stake xPortal sur /staking
- [ ] Market list/buy dust
- [ ] VITE_SLOT_CASINO_CODEHASH_OK + fund progressive
- [ ] VITE_BRAIN_WS (Akash) optionnel
