# Consolidation xArtists + compte à rebours Supernova — 1er août 2026

## Deploy Pages
- Workflow : `Deploy xArtists Exclusive` (`.github/workflows/deploy-exclusive.yml`)
- Déclenché : push main + `workflow_dispatch`
- URL : https://neltud.github.io/xArtists/

## Compte à rebours MultiversX Supernova

| Indicateur | État (1 août 2026) |
|------------|---------------------|
| Roadmap officielle « Sub-Second Finality » | **~97.7 %** (multiversx.com/roadmap) |
| Cible technique | **~600 ms** block time / finalité sub-seconde |
| Gouvernance | Vote janv. 2026 **~99.64 %** pour |
| Statut | **Pre-mainnet** — pas encore live en prod (docs: reduction not yet live) |
| Prédécesseurs | Andromeda (finalité) → Barnard (gouvernance, timestamps ms) |
| Battle of Nodes | Stress-test / security tracks en amont |

**Pas de date calendaire fixe publique « jour J ».**  
Compte à rebours opérationnel pour xArtists = **fenêtre Q3–Q4 2026** tant que la roadmap reste < 100 % et « pre-mainnet ».

### Impact produit xArtists / LIA
- Trading & marketplace : UX plus proche CEX (confirmation quasi instantanée)
- Agents : cycles plus serrés possibles **sans** spammer le réseau
- Gas / timestamps ms : revoir gas limits SC et timeouts frontend (`useSendTransaction`, nonce polling)
- Ne pas hardcoder 6s round time dans l’UI

## Audit consolidation (état réel)

### Vert
- Frontend React buildable après fix List/Buy + MxDapp
- Pipeline data Vellum documenté (`VELLUM_MACHINE_CONTRACT.json`)
- Prix TRO/EGLD/BTC services, PWA base, MoonPay bouton

### Jaune
- Trades LIA JSON vides jusqu’au Reporter Vellum
- Signing wallet dépend de bootstrap sdk-dapp
- Hatom = snapshot wallet, pas SC protocol

### Rouge / bloquant valeur
- `agents_marketplace` non déployé
- Pas de preuve PnL LIA live
- Overclaim « production-ready » vs exécution partielle

## Suite développement (3 pistes)

1. **Fermer la boucle data** : Vellum publish → JSON → Pages  
2. **Fermer la boucle argent** : 1 List/Buy dust + tips + fees documentés  
3. **Préparer Supernova** : timeouts adaptatifs, gas ms, E2E plus strict

## Rôles outils
| Outil | Focus |
|-------|--------|
| Vellum | Cycles + PEM + publish JSON |
| Copilot | PRs code frontend/CI |
| Claude | Audit SC / LEGAL / specs longues |
| Grok | Priorisation, review build, prompts |
