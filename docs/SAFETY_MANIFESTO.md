# Safety Manifesto — LIA & xArtists

**Version publique · Pilier 1 (Bouclier)**

## Distinction

| | Rôle | Ne fait pas |
|--|------|-------------|
| **LIA** | Agent d’intention (comprend, valide, propose l’exécution) | Détenir tes clés |
| **$TRO** | Actif économique (utilité, rareté, staking) | Remplacer le Guardian |
| **Ton wallet** | Signe les TX | Être le wallet protocole LIA |

## Comment LIA protège les fonds

1. **Doctrine (Guardian)** — chaque intention passe SYNTAXE · SÉCURITÉ · PARAMÈTRES avant toute exécution.
2. **Montants atomic** — pas de float pour les valeurs on-chain.
3. **Paper par défaut** — aucune TX broadcast sans gates live + confirmation.
4. **Pas de clé en front** — signature uniquement via xPortal / WalletConnect / DeFi Wallet.
5. **Authority spoof** — formulations du type « ceo bypass » refusées.
6. **Live trading** — `VITE_LIA_LIVE_TRADING=1` + `userConfirmedLive` + wallet sign.

## Ce que nous ne promettons pas (encore)

- Gasless live généralisé
- Swaps auto sans signature
- Rendement garanti des packs ou du board paper

## Signalement

Issues GitHub `Neltud/xArtists` — ne jamais coller de seed / private key.
