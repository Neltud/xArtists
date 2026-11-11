---
hidden: true
noIndex: true
---

# Source of truth — xArtists (statut contrats ≠ disponibilité produit)

**Révision documentaire : 11 novembre 2026.** L'édition du 24 septembre décrivait la sonde alors indisponible, pas la situation mainnet du 11 novembre.

## Sources et niveau de preuve

1. **`data/contracts.json`** : adresses officielles et codeHash attendus. Le libellé technique `status: LIVE` du registre ne vaut **pas** autorisation de vente, de signature ni de mainnet produit.
2. **API publique MultiversX** : code WASM, `codeHash`, `isPayable`, vues du contrat et inventaire NFT. Une réponse manquante est **non vérifiée**, jamais déduite d'un snapshot.
3. **Chorus** : `lia/chorus`, `docs/CHORUS.md`, board paper et tests d'abstention. Le conseil externe ChatGPT ne peut pas signer ou renverser le veto Sentinel.
4. **Ce document** : synthèse datée et prudente, subordonnée aux preuves on-chain actuelles. Un ancien montant de caisse ne peut jamais être présenté comme un prix de pack.

## Situation au 11 novembre 2026

| Domaine | Vérité connue | Verdict produit |
| --- | --- | --- |
| Site principal | `https://xartists.art/`; URL GitHub Pages historique redirigée | Frontend public, pas de preuve d'activation générale des rails commerciaux |
| Chorus / LIA | 120 signaux définis, 9 alimentés, 4 familles dans le dernier board transmis ; `ABSTAIN / thin_tape` | **Paper uniquement** ; `executable=false` et `LIA_LIVE_TRADING` ignoré |
| NFT Marketplace `…8txmm` | Bytecode et codeHash `8TTszCmN…` présents ; compte payable ; solde de contrat observé **0,0175 EGLD** | Contrat déployé ≠ achat automatiquement autorisé. Listing, prix, escrow, signature et réception se vérifient séparément |
| Agents `…gdqwsg` | Bytecode et codeHash `igm9oUpg…` présents ; **non payable** ; solde observé **0,033 EGLD** | Prix packs on-chain rapportés : Pulse **10**, Yield **5**, Sentinel **2,5 EGLD**. Le solde du SC n'est pas un prix |
| Slot `…s4g34f` | Bytecode et codeHash `UZ0nX6dW…` présents ; solde **0,50 EGLD** ; `isPayable=false` | **Aucun spin réel**. Ne pas afficher « mode réel ouvert » |
| TRO staking / venue split | Bytecode présent, soldes de contrats rapportés à **0** | Déploiement technique seulement, permissions et fonctionnalités à certifier |
| Contrats legacy | Adresses `never_fund` du registre, codeHash non présent | **Ne jamais financer** |

Ces montants et états sont des **observations datées**, non des relevés en temps réel. Pour une nouvelle décision, relire les vues et vérifications contractuelles. Aucune clé ni signature requise pour les lectures.

## Argent, droits et sécurité

- Prix EUR déterminés **côté serveur uniquement** : Pulse **110 €**, Yield **75 €**, Sentinel **50 €**. Le navigateur ne définit ni montant ni droit de propriété.
- PayBox : seule route `POST /v1/checkout/paybox`. Tant que HMAC et IPN restent des stubs, paiement/livraison = **NO-GO**.
- Pas de DCA TRO, de mint, de trade, de signature, de spin réel ou de déploiement par Chorus.
- Les transitions `signed`, `paid`, `delivered` et `owned` nécessitent chacune une preuve adaptée et une validation indépendante. Aucun état local ou prompt wallet ne suffit.
- Vellum est **retiré du chemin d'exécution** ; `lia/vellum` est une archive gelée, pas une dépendance des flux Chorus.
- Les rails mainnet nécessitant une signature humaine restent distincts du système de décision Chorus, qui n'est jamais un exécuteur.

## Archive de l'écart corrigé

Le document du **24 septembre 2026** affichait `GO_DEMO` avec « Product SCs: Not deployed », à partir de réponses API manquantes et d'adresses legacy. Ce verdict est **obsolète** depuis les sondes de fin septembre et du **11 novembre 2026** : du bytecode existe bien sur les adresses actuelles du registre. La formule exacte est **« bytecode mainnet présent, lancement produit/trading/slot non autorisé »**, et non « tout non déployé » ni « tout LIVE produit ».

Pour la suite, confirmer les preuves mainnet contract par contract ; ne jamais recycler une référence legacy ou un ancien solde comme état courant.
