---
description: >-
  Parité des prix fiat/crypto, droits par SKU et preuves de livraison avant
  checkout réel.
---

# Prix, droits et livraison

### Règle produit retenue

Le client paie Pulse **110 €**, Yield **75 €**, Sentinel **50 €**. Les 4 % sont internes au prix, sans supplément vitrine et sans réduction de 4 % du montant crypto équivalent.

Pour un taux serveur `r` exprimé en EUR/EGLD : quantité EGLD = arrondi supérieur de `prix_EUR / r` à quatre décimales. Le montant atomique doit ensuite être un entier exact à 18 décimales. Le devis expire après douze minutes ; l'écart de valorisation au taux verrouillé doit rester au plus à 0,02 €. Si la granularité ne le permet pas, le devis est refusé, pas arrondi hors tolérance.

Exemple de **fixture, pas un cours de marché** : à 12 EUR/EGLD, 110 € donnent 9,1667 EGLD et une valeur de 110,0004 €. L'allocation comptable interne des 4 % ne modifie pas ce montant client ; sa convention comptable doit être documentée séparément.

### Écart actuel

`getPackPrice`, relu le 28 octobre, retourne 10 / 5 / 2,5 EGLD. Le serveur fiat fixe 110 / 75 / 50 €. Ces rails ne représentent donc pas encore une offre de même valeur.

Le endpoint de devis lit encore le taux dans le body. Il ne signe pas le devis, ne l'enregistre pas, ne le lie pas à un buyer et ne le consomme pas dans le paiement. Les calculs réussis ne prouvent pas une cotation exécutable. L'expiration invalide est aussi à fermer.

### Contrat de devis à implémenter

Un enregistrement durable et signé doit lier : `quote_id`, version du catalogue et de la politique, SKU, buyer authentifié, rail, réseau/chain ID, identifiant complet de l'actif, décimales, montant atomique, montant EUR, taux et source/horodatage, frais et qui les paie, destinataire, expiration et clé d'idempotence.

Une signature ne suffit pas sans validation serveur et consommation atomique. Refuser devis expiré, réutilisé, mauvais wallet/destinataire/réseau, taux absent/périmé ou montant différent. Le client ne décide ni du taux d'autorité, ni du prix, ni de l'état payé. Une variation du cours après expiration impose un nouveau devis.

Les frais de réseau doivent être affichés séparément et leur traitement fiscal/commercial validé ; la parité du prix du produit ne promet pas des frais réseau identiques entre chaînes.

### Produits et droits séparés

| Offre          | Identité / preuve                                           | À figer avant vente                                                  |
| -------------- | ----------------------------------------------------------- | -------------------------------------------------------------------- |
| Pack d'accès   | Compte ou wallet authentifié, achat et entitlement serveur  | Durée, renouvellement, tiers, transfert, révocation et remboursement |
| NFT artistique | Token/collection/nonce exacts et propriétaire confirmé      | Œuvre/licence, royalties réellement appliquées, revente et livraison |
| Objet physique | Commande, vendeur, preuve d'envoi, réception et acceptation | Transport, assurance, inspection, retour et dispute                  |

Les collections lues sont Pulse `XAIPLS-2cf72b`, Yield `XAIYLD-987e24`, Sentinel `XAISNT-3d8a6b`. Ne pas déduire tous les droits d'un ticker court ni confondre NFT artistique et pack d'accès.

### Paiement et livraison

Commande durable → paiement authentifié et dédupliqué → intention de livraison liée au buyer → confirmation NFT sur la bonne chaîne → activation des droits. Journaliser les transitions, tester les pannes entre étapes et empêcher double livraison ou double refund.

Avec wallet, la livraison cible directement le buyer. `buyPack` livre à l'appelant : un futur relayer fiat doit avoir un mécanisme de bénéficiaire prouvé. Le redirect navigateur et `?paid=` ne sont jamais une preuve de paiement.

Sans wallet, l'identité par compte/email, la custody LIA, l'assessment et le burn restent paper. JWT actuel : `sub=erd1…` requis pour checkout. Ne pas activer FULL parce que LIA détient le token. Consentement, conservation de preuve et droits d'image doivent être définis ; aucun burn irréversible réel n'est autorisé par cette spec.

### Multichain

Paybox System bancaire et PayBox crypto/MCP restent des adaptateurs distincts, avec identité de fournisseur et preuve propres. Démarrer par un rail, une chaîne et un actif ; chaque extension doit prouver finalité, montant atomique, destinataire, déduplication, expiration et rapprochement.

Aucun bridge, swap, allowance illimitée ou paiement sortant n'est implicite dans un achat. Les caps LIA 15 USD/transaction et 40 USD/jour ne plafonnent pas les prix d'achat client. L'autorité d'ordre reste Guardian avec exécuteur durci ; les adaptateurs ne créent pas leur propre chemin d'exécution.
