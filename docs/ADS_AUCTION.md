# Publicité à enchères xArtists

Opt-in · non trompeur · revenus → treasury traçable (Mission / Reserve / Ops).

## Slots (max 1 pub active / slot)

| Slot ID | Emplacement | Format | Durée |
|---------|-------------|--------|-------|
| `home_hero` | Dashboard haut | 1200×400 + lien | 7 j |
| `market_sidebar` | Marketplace | 300×250 + texte | 7 j |
| `studio_banner` | Studio | bandeau soft | 7 j |
| `drop_feature` | Galerie / drop | Featured collection | 3–7 j |

## V1 (sans SC)

1. Annonceur : `/ads` → slot + créatif IPFS + URL  
2. Bid : transfer EGLD → **treasury Mission** avec memo `ad-bid:{slot}:{period}`  
3. Ops / Vellum : choisit gagnant → `data/ads_active.json`  
4. Frontend `AdSlot` lit le JSON  
5. Label toujours visible : « Publicité · enchère xArtists »  

## V2 (SC)

`placeBid` / escrow / settle / refund — quand market + volume le justifient.

## Split revenus (indicatif)

| Part | % | Destination |
|------|---|-------------|
| Mission art | 50 % | Grants / drops |
| Reserve | 25 % | Runway |
| Ops | 15 % | Infra / modération |
| Stakers $TRO | 10 % | P2 si mécanisme réel |

## Anti-spam

- Catégories : art, drop, event culturel, outil créatif  
- Interdit : imiter Connect / Buy  
- `rel="noopener noreferrer sponsored"`  
- Max N wins / wallet / mois  
- Copy : location d’espace, **pas un investissement**  

## Priorité

P0 market live reste prioritaire. Ads = P1 revenue early.
