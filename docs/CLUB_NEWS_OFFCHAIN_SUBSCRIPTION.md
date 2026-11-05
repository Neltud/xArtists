# xArtists Club + News — contrat de livraison (proposition, NON ACTIVÉ)

## Offre
- SKU `club_news_monthly`, **10,00 EUR / mois**, récurrent, **hors blockchain**.
- Aucun NFT, mint, wallet, transaction on-chain ou droit Genesis.
- Distinct de Pulse (110 EUR), Yield (75 EUR), Sentinel (50 EUR) et de TCA/Whop (29 EUR/mois ou 290 EUR/an).
- Contenus : xArtists TV News, Art World News, Magazine & Reviews, NFT Events & Meetings, Curators, veille des ventes et enchères mondiales (liens Artprice ; ne pas reproduire les données sans licence).
- Avant commercialisation : définir fréquence et canaux de publication, CGV, facturation, TVA, consentement newsletter et désinscription.

## Contrat serveur obligatoire avant GO
1. Créer une commande d'abonnement à partir du SKU **serveur**, jamais du prix transmis par le client. Montant 1000 centimes, devise EUR, période mensuelle ; fournisseur explicitement autorisé (Stripe, Whop ou autre) et `provider_subscription_id` unique.
2. Vérifier les webhooks sur les octets bruts avec la signature propre au fournisseur, tolérance temporelle/anti-rejeu, et rejeter les événements non authentifiés. Conserver `(provider, event_id)` unique, traiter transactionnellement, et gérer les événements hors ordre.
3. **Accorder le droit seulement après confirmation serveur d'une période effectivement payée**, vérification montant/devise/SKU/client/abonnement et rapprochement avec le fournisseur. Aucun succès de redirection, état frontend ou email seul ne donne de droits.
4. Persister `entitlement(user_id, product_id, period_start, period_end, status, provider, subscription_id, paid_invoice_id)`. Chaque facture payée étend la période correspondante ; rejouer une facture ne prolonge jamais deux fois. En cas de paiement échoué, ne pas prolonger ; en cas d'annulation, conserver l'accès jusqu'à la fin de la période déjà payée (sauf remboursement/révocation justifiée).
5. Chaque requête aux contenus membres doit contrôler côté serveur `status=active` ET `period_start <= now < period_end` ; les liens privés/newsletters doivent utiliser des autorisations expirables. Ne jamais exposer les contenus premium dans le bundle public.
6. Envoyer la newsletter pendant la période payée, enregistrer chaque édition/livraison et permettre un rattrapage en cas d'incident. Le désabonnement marketing ne doit pas retirer l'accès déjà payé ; séparer communications contractuelles et marketing selon consentement.
7. En cas de remboursement, litige, fraude ou résiliation immédiate autorisée, appliquer la politique contractuelle, journaliser l'événement et révoquer de manière idempotente. Prévoir rapprochement périodique et alertes pour webhooks manqués.
8. Aucun chemin de code ne doit appeler un minter, un smart contract ou un workflow blockchain pour `club_news_monthly`.

## Scénarios d'acceptation
- Première facture payée : accès exactement sur la période payée ; contenu protégé accessible et newsletter planifiée.
- Facture renouvelée : extension unique ; webhook dupliqué ou désordonné : aucun double droit.
- Checkout annulé, facture impayée, signature fausse, mauvais montant/devise, autre SKU : aucun nouveau droit.
- Annulation au milieu du mois : accès jusqu'à `period_end` ; expiration : accès refusé.
- Réconciliation après webhook perdu : restauration exacte des droits payés sans prolongation indue.
- Isolation : aucune création de NFT et aucun impact sur les trois packs Genesis.
- Contrôles RGPD, consentement, désinscription, droits d'auteur et licence Artprice.

## GO / NO-GO
**NO-GO** jusqu'à preuve de tests automatisés, environnement sandbox fournisseur, validation sécurité et contenu effectivement livrable pendant toute période payée. Aucun paiement réel n'est activé dans cette PR.
