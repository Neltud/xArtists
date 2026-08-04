# Lacunes dApp × remèdes (2026-08-04)

| Lacune | Risque | Remède |
|--------|--------|--------|
| SC marketplace code vide | 🔴 | Deploy nft-marketplace + verify_deploy + codeHash |
| agents_marketplace null | 🔴 | Deploy agents FEE_BPS=300 |
| ID listing manuel | 🟡 | Activity index + prefill (partiel) |
| Vote DAO faux | 🟢 fixé | Lecture seule |
| Confusion LIA / user | 🟢 fixé | Labels + toggle wallet |
| Confusion LIA packs / GSN | 🟢 fixé | Sections séparées |
| NFT count 0 | 🟢 fixé | API live |
| Supply 1M affiché ailleurs | 🟢 fixé | **500 000 max** partout dApp |
| Modal persona absente | 🟢 fixé | PersonaWelcome |
| SEO faible | 🟢 fixé | meta keywords, OG, sitemap, JSON-LD |
| Navigation persona cassée | 🟢 fixé | useNavigate |
| Pin Studio in-browser | 🟡 | Pinata OK ops ; proxy backend P1 |
| Live trading | 🟢 | LIA_LIVE_TRADING=0 |
| Signature WC complète | 🟡 | Extension / Web Wallet |

## Vellum (chaque run)

```bash
export LIA_LIVE_TRADING=0
python -m lia.decisions.policy
python -m lia.gas.micro_trade
# board publish si module dispo
```
