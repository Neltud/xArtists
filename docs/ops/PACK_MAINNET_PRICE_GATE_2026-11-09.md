# Pack EGLD — barrière de prix exact avant wallet (9 novembre 2026)

**Statut : CODE PREP / pas d'activation des ventes.** La publication des
packs Pulse, Yield et Sentinel reste suspendue jusqu'aux preuves médias,
rôles, endpoint, prix réellement approuvé et livraison on-chain.

## Bug P0 détecté dans `useAgentPackTx.ts`

Le chemin `buyPack` utilisait `pack.priceEgld.list` comme valeur envoyée
au wallet alors que `agentPacks.ts` précise qu'il s'agit de prix
**marketing historiques**, pas d'un devis du contrat. Le passage par
`BigInt(Math.round(nombre * 1e18))` convertissait aussi un nombre IEEE-754
en montant EGLD atomique, ce qui peut perdre des unités.

| Pack | Catalogue affiché historique | Dernier getPackPrice lu sur chaîne (08/11) | Correspondance |
|---|---:|---:|---|
| Pulse | 33 EGLD | 1 EGLD | ❌ |
| Yield | 22,5 EGLD | 5 EGLD | ❌ |
| Sentinel | 15 EGLD | 2,5 EGLD | ❌ |

Ces valeurs sont **un constat daté**, pas un cours EGLD ni un nouveau tarif
autorisé. La conversion EUR est un catalogue fiat **indépendant**.
La présence d'une fonction payable ne prouve ni disponibilité d'un NFT
avec média, ni conformité au prix commercial, ni livraison.

## Correctif de préflight

Avant de présenter une transaction `buyPack` au wallet :

1. Le garde `AGENT_PACK_PUBLIC_MINT_RELEASED` et le codeHash récent doivent
   déjà autoriser ce parcours. Les flags restent **false** dans la PR.
2. Une requête **read-only** `POST https://gateway.multiversx.com/vm-values/query`
   interroge `getPackPrice` sur le contrat configuré, avec l'argument u8
   canonique `01/02/03`. Aucune transaction n'est diffusée.
3. La réponse VM doit signaler succès sans message d'erreur et contenir une
   seule valeur BigUint base64 non nulle, dans la plage acceptée. Timeout,
   retour malformé, valeur nulle, gateway indisponible : **refus**.
4. La valeur on-chain est comparée **à l'unité atomique exacte**, via
   `egldTextToWei`, à un prix catalogue formellement validé. Une divergence
   suspend l'achat **avant tout appel `send`**.
5. Si les prix sont un jour alignés, la transaction préparée réutilise
   **uniquement** les unités atomiques obtenues par la VM query validée.
   Aucun calcul `Math.round(Number * 1e18)` ne sert au paiement.
6. `buyAgentAction` ne livre pas le NFT du pack : aucun paramètre d'env
   ne peut rediriger silencieusement un achat de pack vers ce règlement
   sans NFT.

**Cette PR ne met pas en service la vente.** Pour un futur GO, valider
les prix par décision commerciale, vérifier la réponse VM juste avant
signature, le bon destinataire/contrat, l'URI média effective, le rôle
du minter, le solde/frais EGLD, les scénarios de rejet, remboursement et
réception NFT dans le wallet ; toute signature reste sous contrôle
du propriétaire du wallet. Ne jamais utiliser le prix fiat pour le
`value` on-chain.

## Vérification

```sh
node --test apps/frontend/tests/agent-pack-fresh-vm-quote.test.mjs
```

Tests exclusivement avec réponses VM simulées :
- trois packs aux montants exacts et argument u8 canonique ;
- refus des trois écarts catalogue/chaîne actuellement connus ;
- valeurs aberrantes, JSON/VM invalide, timeout et refus réseau ;
- aucune divulgation d'erreur upstream ou token ;
- aucune redirection d'un checkout pack vers `buyAgentAction`.

Ressource protocolaire officielle :
https://docs.multiversx.com/sdk-and-tools/rest-api/virtual-machine/

Voir également `docs/ops/AGENTS_PACK_STEP1_READINESS_2026-11-08.md`
et les issues #281, #402, #403 et #428. 
