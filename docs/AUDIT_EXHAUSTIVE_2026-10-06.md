# Audit exhaustif dApp xArtists — 2026-10-06

**Scope:** front GitHub Pages + contracts map + TCA/ATC + access + orphans.  
**Machine (Guardian/Genesis):** non modifiée — hors scope d’écriture.

---

## 1. Verdict global

| Zone | Note | Commentaire |
|------|------|-------------|
| Live site | OK | `https://neltud.github.io/xArtists/` HTTP 200, **HashRouter** → routes `#/…` |
| SC mainnet map | OK | addresses + codeHash + status LIVE dans `public/data/contracts.json` |
| Gate TCA client | **Partiel** | FULL/SAMPLE/NONE UI OK ; **bypass localStorage** possible |
| Zero-trust server | **Manque** | Pas de `/api/verify-access` JWT productif |
| Air-gap TCA→ledger | OK (policy) | Gate + docs interdisent write ; pas de mint depuis TCA |
| Pages orphelines | Dette | ~25 pages hors `App.tsx` |
| Sprint 1 (JWT, YT→RAG, SBT) | Spec | Non livré en prod |

**Honest product state:** monument + funnel ATC/TCA **structurés** ; accès Pulse encore **client-trust** ; trading machine **locked**.

---

## 2. Routing (App.tsx)

### Routes branchées (37 modules)

| Path | Page |
|------|------|
| `/` | Dashboard |
| `/market` | MarketAnalyticsPage |
| `/marketplace` | MarketplacePage |
| `/trading` | TradingPage |
| `/agents` · `/agents/lightning` · `/agents/polylia` | Agents* |
| `/my-packs` | MyPacksPage |
| `/command-center` | CommandCenterPage |
| `/studio` | StudioPage |
| `/tro` · `/staking` | Tro / Staking |
| `/dao` | DaoPage |
| `/gallery` · `/museum` | Gallery / Museum |
| `/legal` | LegalPage |
| `/wallet` · `/portfolio` | Wallet / Portfolio |
| `/slot` | SlotPage |
| `/lia` | LiaPage |
| `/tca` · `/classroom` | **TcaGatePage** |
| `/go-live` · `/venues` · `/identity` | GoLive / Venue / Identity |
| `/sitemap` · `/sale` · `/demo` · `/tours` | meta |
| `/editions` · `/tip` · `/payments` · `/ads` | misc |
| `/simulation` · `/entities` · `/burnify` · `/lp` · `/hatom` | lab / DeFi |

**SPA note:** HashRouter → live URLs = `…/xArtists/#/marketplace` (pas `/marketplace` nu → 404 GitHub).

### Pages orphelines (fichiers sans route App)

AdminPage, Agents, ArtistStudio, BitcoinLayer2, BridgeFeesDashboard, DAO, DigitalTwinPage, ExplainCards, Gallery, HistoryPage, HolderRoomPage, LandingHero, LiaPerformancePage, MarketPage, Marketplace, MuseumLabPage, MyPacks, Portfolio, RwaCatalogPage, SoulTestnetPage, Tip, Trading, VenueAccountPage, VoyageAgentPage, Wallet, …

→ **Risque:** confusion produit, dead code, double implementations (Marketplace vs MarketplacePage).

**Reco:** archive `pages/_legacy/` ou brancher explicitement / supprimer.

---

## 3. Smart contracts (mainnet map)

Source: `apps/frontend/public/data/contracts.json`

| SC | Status map |
|----|------------|
| venue_split | LIVE |
| nft_marketplace | LIVE |
| agents_marketplace | LIVE |
| nft_staking | LIVE |
| tro_staking (+ legacy) | LIVE |
| tro_governance | LIVE |
| agent_stake_escrow | LIVE |
| treasury_splitter | LIVE |
| slot_casino | LIVE |

**Gates front:** `integrityGates.ts` bloque TX si pas d’adresse / codeHash / DEMO_MODE.  
**Ops:** prouver régulièrement codeHash explorer = map (fail-close secrets VITE_*_CODEHASH_OK).

**Preuves historiques (fichier):** buyNft 0.25 EGLD cité ; spinEgld_real parfois `fail` — re-vérifier explorer avant badge LIVE slot public.

---

## 4. ATC / TCA / Gatekeeper

| Mode | Implémenté | Sécurité |
|------|------------|----------|
| NONE | Lobby sans wallet | OK |
| SAMPLE | YouTube + CTA `/agents` | OK UX |
| FULL | TcaClassroom lazy | **Client peut forcer via localStorage demo packs** |

Fichiers: `TcaGatePage.tsx`, `tcaAccess.ts`, `PulseAccessBanner`, `YouTubeEmbed`, `data/tca/*`.

### CRITICAL (Sprint 1 Module A)

> Toute décision FULL côté navigateur seule = **non zero-trust**.

**Manque:** endpoint serveur `GET/POST /api/verify-access` qui:
1. lit l’indexeur MultiversX (Pulse collection),
2. calcule expiry 365j,
3. signe un JWT court (status FULL|SAMPLE|NONE),
4. front n’affiche hologramme/RAG que si JWT valide.

`services/access-api` existe pour **Stripe/Paybox**, pas encore pour verify-access Pulse.

Demo `xartists_tca_demo_packs` : **dev only** — à désactiver en build prod (`import.meta.env.PROD`).

---

## 5. Intelligence (RAG / voix)

| Élément | État |
|---------|------|
| chunks.jsonl | Présent |
| rag_engine.py | Extractif persona |
| Lip-sync visemes | Front lipSync.ts |
| YouTube → transcript → RAG | **Non** (script sync sample ID seulement) |
| SBT mastery | Schema backlog, pas mint |

---

## 6. Access / paiements

| Chemin | État |
|--------|--------|
| `/agents` packs | UI |
| access-api Stripe/Paybox | Stub / env secrets |
| Mint NFT Pulse on-chain post-paiement | Dépend SC / ops |
| MoonPay | Partiel front |

---

## 7. Sécurité & air-gap checklist

| Règle | Status |
|-------|--------|
| TCA n’écrit pas le ledger | Respecté (code path) |
| Achats via Genesis/agents | Respecté (CTA) |
| Pas d’equity auto via study time | Respecté (doc) |
| Client ne décide pas FULL en prod | **ÉCHEC** tant que JWT absent |
| Secrets hors git | OK (pattern) |
| Guardian/Genesis touchless | OK |

---

## 8. Performance / UX (Command Center)

| Spec | État |
|------|------|
| Glass cockpit 4 zones | Partiel / legacy dashboard residual |
| LOD + culling particules | Non formalisé |
| Transition 2D→3D immersive | Non |
| Error boundary global | Présent (ErrorBoundary / RouteErrorBoundary) |

---

## 9. Priorités post-audit (ordre)

| P | Action |
|---|--------|
| **P0** | `verify-access` serveur + JWT ; désactiver demo localStorage en PROD |
| **P0** | Smoke TX : stake / market buy / slot spin = explorer proof |
| **P1** | Purge ou archive pages orphelines |
| **P1** | Index NFT Pulse réel → packIds/activatedAt |
| **P2** | youtubeId officiel + option transcript→chunks (revue humaine) |
| **P2** | LOD musée / TCA |
| **P3** | Mastery paper schema → SBT via Genesis plus tard |

---

## 10. Conclusion

La dApp est **vivante mainnet** (SC map LIVE, Pages 200, funnel ATC/TCA codé).  
Elle n’est **pas** encore un monument zero-trust : le **gate Pulse reste contournable** côté client.  
Sprint 1 Module A (verify-access JWT) est le **prochain bloc de sécurité** avant marketing hub xPortal.

*Audit architecture — sans modification Guardian/Genesis.*
