# GreenSmoke Network (GSN) — adaptation xArtists

**Statut :** partenaire / couche signaux agents — **pas** un rebrand de xArtists.

| Marque | Rôle |
|--------|------|
| **xArtists** | Galerie, packs, tours, $TRO, dApp culture + accès |
| **GreenSmoke Network (GSN)** | Agents souverains, réputation on-chain, marchés de prédiction, signaux |

## Liens officiels

- App : https://app.greensmoke.network/
- Agents : https://app.greensmoke.network/agents
- Docs / roadmap : https://app.greensmoke.network/docs
- X : https://x.com/GreenSmokeNet

Live mainnet MultiversX · **Supernova-ready** (contracts agent identity / reputation).

## Code front

- Config unique : `apps/frontend/src/config/greenSmoke.ts`
- `GSN.name`, `GSN.short`, `GSN.urls`, `GSN.signals`
- Helpers : `gsnDisplayName()`, `isGsnLabel()`
- `LINKS.greensmoke*` pointent vers les URLs canoniques

## Board LIA / trading

Labels historiques du ticker :

- `GSN Elite MVX` → signal écosystème MultiversX (alias GreenSmoke)
- `GSN Alpha Macro` → bias macro

**Règle future :** toute nouvelle UI affiche **GreenSmoke** / **GSN** via `gsnDisplayName`, jamais un troisième nom inventé.

## Vellum

Quand un run cite « Green Smoke » / GSN :

1. Traiter comme **source de signal externe** (pas custody xArtists)
2. Ne pas confondre wallet LIA ops xArtists avec agents mint GSN
3. Deep-link agents : `LINKS.greensmokeAgents`

## Ce qu’on ne fait pas

- Renommer le repo / dApp en GreenSmoke
- Promettre que les packs xArtists = agents GSN mint
- Mélanger trésorerie LIA et protocol GSN

## Évolution possible (roadmap)

- [ ] Carte « Signals powered by GreenSmoke » sur `/trading` (paper)
- [ ] Lien footer / lab vers app.greensmoke.network
- [ ] Si API publique GSN : adapter board (read-only) sans custody
