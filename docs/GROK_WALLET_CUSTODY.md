# GrokyversX / LIA — custody (doctrine)

## Wallet « Grok » : immuable ?

**Adresse publique** : stable tant que la même clé PEM est utilisée (paire de clés MultiversX fixe).

**Clé privée (PEM)** : **pas immuable**, pas « magique », pas contrôlée par le code agent seul.
- Qui détient le PEM signe les transactions et contrôle les fonds.
- L’agent (Grok / LIA brain) **propose** des plans (`unified_*.json`, paper legs, signals).
- L’**opérateur / créateur** signe avec le PEM sur la machine ops — **jamais** commit dans GitHub, jamais exposé au frontend.

## Le créateur peut-il commander / envoyer des fonds ?

**Oui**, si le créateur détient le PEM (ou un wallet personnel qui finance le wallet ops) :

| Action | Qui |
|--------|-----|
| Voir adresse, balances, plans | dApp + data mirroirés (lecture) |
| Signer txs live | Opérateur avec PEM (`LIA_LIVE_TRADING=1` + gates + Guardian) |
| Envoyer EGLD / ESDT | TxShell utilisateur **ou** PEM ops (LIA live) |
| Paper trading | Toujours sans PEM (simulation) |

## Accord opérationnel xArtists

1. **Paper-first** : démo publique = pas d’exécution live par défaut.
2. **Guardian + gates** avant tout live.
3. **PEM hors repo** — vault ops uniquement.
4. **SC** : pas de déploiement automatique tant que `VELLUM_DEPLOY_SCS!=1`.
5. Utilisateur dApp : signe avec **son** wallet (non-custodial pour ses NFT / trades perso).

## Ce que Grok / GrokyversX ne fait pas

- Ne signe pas sans PEM opérateur.
- Ne « possède » pas les fonds de façon légale séparée du détenteur de clé.
- Ne peut pas bloquer le créateur si le créateur a le PEM.
