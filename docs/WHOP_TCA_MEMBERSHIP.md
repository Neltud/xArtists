# Whop · xArtists TCA Membership

> Produit **distinct** des Packs Genesis. Pas de NFT, pas de SFT, pas de droits on-chain pack.

## Positionnement

| | **Packs Genesis** | **TCA Membership** |
|--|-------------------|--------------------|
| Billing | one_time | monthly / annual |
| NFT / SFT | Oui (XAIPLS / XAIYLD / XAISNT) | **Non** |
| Droits | durables (édition) | services tant que renouvelé |
| Canal | dApp + Whop one_time | Whop subscription |
| Prix ref. | 110 / 75 / 50 € | à définir (ex. 29 €/mois · 290 €/an) |

## Formules proposées

### Mensuel — TCA Access
- Prix cible : **29 € / mois**
- Inclus (services) : briefings LIA paper, accès hub intelligence (lecture), priorités support community
- Exclus : mint Genesis, trading live, promesse APR

### Annuel — TCA Year
- Prix cible : **290 € / an** (≈ 2 mois off)
- Même scope services · engagement 12 mois

### Optionnel — TCA Studio (plus tard)
- Prix cible : **79 € / mois**
- + sessions atelier / review portfolio · toujours **sans** NFT pack

## Création Whop (manuel si connecteur offline)

1. Product name : `xArtists TCA · Membership`
2. Visibility : visible
3. Plans :
   - `TCA Monthly` · renewal · 2900 cents · interval month
   - `TCA Annual` · renewal · 29000 cents · interval year
4. Copy : *Services xArtists / LIA paper. Does not include Genesis SFT packs.*
5. Lier URL dans dApp footer / `/intelligence` — pas sur `/packs/:id` CTA principal

## Règle absolue

Un abonnement TCA **ne déclenche jamais** `mint-on-payment` ni entitlement pack SFT.
Seul un plan **one_time** pack (Pulse/Yield/Sentinel) alimente le flux mint paper→live.

## Status

- Spec : ✅ (ce doc)
- Produit Whop créé : ⏳ (connecteur Whop non branché sur cette session — création UI Whop)
- Wire dApp lien Membership : next after product `prod_` id
