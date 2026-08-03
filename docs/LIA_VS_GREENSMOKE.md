# Ne pas confondre : packs agents LIA/Vellum vs GreenSmoke

## Deux produits distincts

| | **Packs agents LIA (xArtists / Vellum)** | **GreenSmoke (GSN)** |
|--|------------------------------------------|----------------------|
| **Rôle** | Produits **vendables** + ops LIA (trading, yield, market, RWA…) | **Feed de prévisions** externe (météo, crypto, macro…) |
| **Exécution** | Vellum + wallet LIA + SC agents-marketplace | Agents GSN on-chain / app.greensmoke.network |
| **Achat dApp** | `buyAgentAction` → API key + badge + reçu | **Pas** vendu comme pack LIA |
| **Données UI** | Board, executor, fulfillment, contracts xArtists | `greensmoke_forecasts.json` (signaux) |
| **Lien** | neltud.github.io/xArtists | https://app.greensmoke.network/agents |

## Règles dApp

1. Page `/agents` : section **LIA packs** en premier (marketplace + ops).
2. Section **GreenSmoke** : titre explicite « signaux / prévisions externes » — **pas** « nos agents à vendre ».
3. Banner Dashboard : libellé **GreenSmoke Network (externe)**.
4. LIA peut **consommer** des signaux GSN (optionnel) pour informer le paper trading — cela ne transforme pas GSN en pack LIA.
5. Changelog / marketing : ne plus fusionner « 6 agents GreenSmoke » avec « agents LIA marketplace ».

## Risque de confusion

| Confusion | Impact | Mitigation |
|-----------|--------|------------|
| User croit acheter une prévision GSN via Buy agent LIA | Attente produit fausse | Copy + sections séparées |
| LIA exécute un forecast GSN comme ordre live | Risque capital | Policy : GSN = signal only sauf gate explicite |
