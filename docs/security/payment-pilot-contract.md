---
description: >-
  Contrat proposé pour un catalogue commun fiat/crypto, des devis consommables
  et une livraison de droits prouvée.
---

# Contrat du pilote — prix, paiement et livraison

Spécification proposée le 28 octobre 2026 sur la base `11583286b455732762bb81bbe82190183215382c`. Elle prépare l'implémentation ; aucun prix de contrat, paiement, mint ou burn n'est modifié.

### Paramètres métier conservés

| Paramètre               | Valeur                                                                         |
| ----------------------- | ------------------------------------------------------------------------------ |
| Ancre client            | Pulse 110 EUR ; Yield 75 EUR ; Sentinel 50 EUR                                 |
| Marge                   | 4 % interne ; pas de surcharge affichée et pas de réduction de la jambe crypto |
| Conversion EGLD         | Arrondi supérieur à quatre décimales                                           |
| Tolérance de conversion | Écart positif inférieur ou égal à 0,02 EUR                                     |
| Vie maximale du devis   | 12 minutes à compter de l'émission serveur                                     |
| Droits                  | Même SKU et mêmes droits quel que soit le rail autorisé                        |

Exemple de recette avec un taux **de fixture**, sans valeur de marché :

| Pack     | EUR client | EGLD au taux de fixture 12 EUR/EGLD | Valeur EUR |
| -------- | ---------- | ----------------------------------- | ---------- |
| Pulse    | 110,00     | 9,1667                              | 110,0004   |
| Yield    | 75,00      | 6,2500                              | 75,0000    |
| Sentinel | 50,00      | 4,1667                              | 50,0004    |

Les valeurs on-chain historiques 10 / 5 / 2,5 EGLD ne satisfont pas cette règle pour un taux unique. Modifier l'affichage ne suffit pas. L'exécution crypto doit être adaptée et approuvée avant d'annoncer la parité marchande.

### Catalogue d'autorité serveur

Une entrée versionnée décrit `sku`, type d'offre, nom, `price_cents`, devise, politique de droits, collection et rails actifs. Le frontend reçoit ce catalogue ; il ne crée pas un second tarif. Le catalogue actuel est encore dupliqué entre `PACK_CATALOG` dans `server.mjs`, `PACK_FIAT_CENTS` dans `quote.mjs`, la config des packs frontend et les données du contrat.

Séparer les offres : accès applicatif, œuvre NFT et objet physique. Pour chaque SKU, fixer durée, renouvellement, transférabilité, accès inclus, remboursement et effet d'un transfert ou burn. Une case non décidée bloque la vente du SKU concerné. Un paiement d'un objet physique ne donne pas implicitement un accès pack.

### Devis autorisé et consommable

Le serveur authentifie l'acheteur, lit le catalogue et un taux de sa source approuvée. Les taux, destinataires, prix ou chaînes fournis par le client ne sont jamais une autorité. En cas de source indisponible, trop vieille ou incohérente : aucun devis exécutable, jamais le dernier montant affiché comme repli silencieux.

Le devis durable lie au minimum :

| Champ                                            | Contrainte                                                                      |
| ------------------------------------------------ | ------------------------------------------------------------------------------- |
| `quote_id`, `schema_version`, `catalog_version`  | Identifiants immuables, aléatoires pour le devis                                |
| `environment`, `buyer_id`, `sku`                 | Sandbox ou production explicitement séparés ; buyer issu de la session vérifiée |
| `rail`, `chain_id`, `asset_id`, `asset_decimals` | Valeurs allowlistées ; identifiant du contrat d'actif pour un token             |
| `recipient`, `amount_atomic`                     | Destinataire serveur validé ; entier atomique encodé comme chaîne               |
| `anchor_cents`, `currency`                       | Montant catalogue, pas un montant du body                                       |
| `rate`, `rate_source`, `rate_observed_at`        | Taux décimal exact, provenance et âge vérifiés                                  |
| `issued_at`, `expires_at`                        | Horloge serveur ; durée maximale 12 minutes ; dates invalides fermées           |
| `status`, `order_id`                             | Consommation atomique liée à une seule commande                                 |

Un HMAC ne remplace pas la persistance ni l'anti-rejeu. Le serveur vérifie le MAC si le devis est transporté, puis compare au record durable et consomme le devis dans la même transaction que la création de commande. Aucune clé de signature dans Vite ou le navigateur.

Pour EGLD, utiliser des entiers et un taux rationnel `R / P` EUR/EGLD. Si `C` est le prix en centimes, calculer `units_4dp = ceil(C × P × 100 / R)`, puis `amount_atomic = units_4dp × 10^14`. Vérifier la tolérance par comparaison entière et sans epsilon flottant. Un adaptateur d'un autre actif utilise ses propres décimales vérifiées ; jamais `1e12` ou `1e18` appliqué à toutes les chaînes.

### Paiement et livraison

Les états du paiement, de la livraison et des droits sont distincts. `PAID` ne signifie pas `DELIVERED`.

| Étape           | Preuve côté serveur                                                                                                  |
| --------------- | -------------------------------------------------------------------------------------------------------------------- |
| Commande        | Session buyer, devis non expiré consommé une seule fois, SKU et montant immuables                                    |
| Paiement fiat   | IPN signé et champs liés à la commande ; identité PSP/transaction unique                                             |
| Paiement crypto | Chaîne et transaction exactes, succès, destinataire et actif attendus, montant exact et finalité requise par le rail |
| Livraison       | Ordre de livraison idempotent ; bon bénéficiaire, collection, token et événement de chaîne confirmés                 |
| Droits          | Activation seulement après les preuves prévues pour ce SKU ; journal de version et de révocation                     |
| Remboursement   | Décision et exécution tracées, montant restant contrôlé ; retry ne double pas le remboursement                       |

Cible de données : `quote → order → payment_attempt → fulfillment → entitlement`. Les retries d'un même paiement retrouvent la même commande. Contraintes uniques sur `(provider, environment, provider_tx_id)`, `(rail, chain_id, tx_hash, event_index)` selon le rail et sur la clé de livraison. Un second paiement distinct pour une commande déjà réglée est enregistré comme exception à rapprocher ; il ne déclenche pas une deuxième livraison. Les remboursements partiels ont leur propre registre et une somme cumulée qui ne dépasse pas le paiement encaissé.

Conserver chaque événement reçu dans un journal durable, puis appliquer des transitions autorisées sous verrou/transaction. Tester doublons, ordre inversé, callback tardif, crash entre confirmation et livraison, concurrence, panne DB et retry après restart. Un callback valide sans commande durable ne devient pas une commande acceptée par défaut.

Le `buyPack` actuel envoie le NFT à l'appelant et rembourse un excédent. Un relayer fiat qui l'appelle recevrait donc le NFT lui-même. Un endpoint de livraison au bénéficiaire nécessite une conception et une revue de contrat explicites ; un simple transfert à l'adresse LIA n'est pas une preuve de livraison au client.

Avec wallet : bénéficiaire vérifié et livraison directe prouvée. Sans wallet : parcours compte/email et droits distincts à concevoir ; l'API actuelle exige encore un `sub` de wallet. Le scénario LIA custody → assessment → burn reste simulé. Il ne remplace pas cette authentification et ne doit pas supprimer automatiquement une œuvre ou une preuve utilisateur.

### Adaptateurs de rails

| Adaptateur       | Périmètre du premier pilote                                         | Hors périmètre initial                                                |
| ---------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Paybox bancaire  | Session et IPN de préproduction, montant EUR lié à la commande      | Paiement bancaire réel                                                |
| MultiversX EGLD  | Devis et preuve de paiement en environnement de recette approuvé    | Réécriture des prix SC ou signature automatique                       |
| Autre crypto/MCP | Interface simulée avec actif/chaîne/montant/destinataire explicites | Bridge, swap automatique, autorisation illimitée ou custody implicite |

Paybox bancaire et un outil appelé PayBox crypto/MCP ont des identités, signatures et responsabilités distinctes. Ne pas faire circuler une approbation entre les deux. L'interface d'adaptateur proposée est `prepare(quote, order)`, `verifyPayment(evidence, order)` et `reconcile(order)` ; un statut normalisé ne supprime pas les preuves natives.

Commencer par un rail, une chaîne et un actif. Définir finalité et réorganisation propres à la chaîne avant d'ajouter un deuxième rail. Les frais réseau restent présentés séparément du prix du pack ; la tolérance de 0,02 EUR ne promet pas d'absorber n'importe quel coût réseau. Les plafonds LIA 15 USD par transaction et 40 USD par jour ne sont pas les limites des achats clients.

### Critères de recette prêts pour la prochaine PR

1. Les trois SKU ont le même montant de référence et les mêmes droits sur tous les rails activés.
2. Taux fourni ou remplacé par le client, mauvaise chaîne, mauvais actif/destinataire et montant altéré sont refusés.
3. Expiration à 12 minutes, date invalide, ancien catalogue et autre buyer sont refusés.
4. Deux requêtes concurrentes consomment un devis une seule fois et retrouvent la même commande lors d'un retry autorisé.
5. Un IPN ou hash réutilisé n'active ni une autre commande, ni un second droit.
6. `?paid=`, message du wallet, retour PSP ou NFT détenu par LIA ne suffit jamais à activer les droits.
7. Crash avant et après confirmation : reprise déterministe, sans perte et sans double livraison.
8. Panne de base, restauration, droits retirés après remboursement et absence de secrets dans les logs sont démontrés.
9. Le parcours mobile/xPortal est essayé sur appareil ; aucune signature réelle n'est déclenchée par le test automatique.

Ces critères sont une spécification, pas des tests déjà exécutés. Budget 0 EUR, paper/sandbox et GO humain pour tout changement de capacité restent applicables.
