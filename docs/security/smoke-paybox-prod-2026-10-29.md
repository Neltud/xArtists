---
description: >-
  Recette manuelle d’un unique paiement Sentinel prod avec preuve IPN et
  livraison serveur.
hidden: true
noIndex: true
---

# Smoke Sentinel — paiement réel en prod

Le mode est armé. Cette recette établit la preuve métier encore manquante. Le tarif serveur Sentinel observé est **50 EUR / 5000 centimes** ; ne pas transformer le test en paiement de 1 EUR en modifiant le catalogue. Une personne autorisée effectue le paiement sur le TPE officiel.

## Avant le paiement

1. Ouvrir [le site officiel](https://neltud.github.io/xArtists/) et effectuer un rechargement complet.
2. Relire [health](https://xartists-access-api.onrender.com/health) : `ok: true`, `paybox_mode: prod`, `paybox_configured: true`. Ces valeurs ne certifient pas à elles seules le contrat marchand.
3. Connecter le wallet souhaité via xPortal et obtenir la session SIWX/JWT. Ne pas publier le JWT, la signature de connexion, les données carte ou les secrets merchant.
4. Vérifier Sentinel **50 EUR** avant de lancer le checkout. Un seul ordre et une seule tentative de paiement à la fois. En cas de timeout, rechercher l’ordre existant avant toute nouvelle soumission.
5. Noter le véritable `order_id` créé par le serveur, l’heure, le pack, la devise et le montant attendu.

## Passage au TPE

Le navigateur doit se trouver sur **https://tpeweb.paybox.com/**, en HTTPS, pour le formulaire de production. Si le domaine est `preprod-tpeweb.paybox.com`, interrompre la recette. Le titulaire saisit lui-même les informations de sa carte et confirme le montant réel. Aucun numéro de carte ne passe par le chat, GitBook ou les journaux du projet.

## Confirmation serveur

Après le retour du TPE, attendre la notification IPN côté serveur. Un écran navigateur de succès ou un paramètre `paid` ne suffit pas.

Contrôler, pour le même ordre :

| Preuve                   | Attendu                                                                    |
| ------------------------ | -------------------------------------------------------------------------- |
| Acheteur                 | Wallet authentifié de la session ayant créé l’ordre                        |
| Pack / montant / devise  | Sentinel / 5000 / EUR (978)                                                |
| IPN                      | Signature RSA-SHA256, clé 2048, champs métier issus du payload authentifié |
| État commande            | Paiement accepté selon l’état serveur                                      |
| `server_confirmed`       | `true`                                                                     |
| My Packs                 | Confirmation serveur du même pack                                          |
| Livraison NFT éventuelle | Preuve distincte ; ne pas déduire un mint d’un simple paiement confirmé    |

Consulter la commande avec le parcours My Packs et la route authentifiée réellement exposée par l’API déployée. Ne pas substituer l’adresse de wallet dans une URL comme preuve d’identité.

## Idempotence

Lorsque l’opérateur dispose de l’IPN authentique de cet ordre et d’un accès autorisé à la recette serveur, contrôler une fois le rejeu de cette même notification selon les contraintes de validité applicables. Attendre `duplicate: true` et aucune seconde livraison. Ne pas fabriquer une signature, créer un faux IPN ou lancer un deuxième paiement pour simuler ce contrôle.

## Compte rendu partageable

```json
{
  "order_id": "<véritable identifiant serveur>",
  "pack_id": "sentinel",
  "amount_cents": 5000,
  "currency": "EUR",
  "paybox_mode": "prod",
  "server_confirmed": true,
  "my_packs_server_confirmed": true,
  "duplicate": "<true seulement si le contrôle de rejeu est effectué>"
}
```

Ce bloc est un gabarit, **pas un résultat obtenu**. Remplacer chaque élément par la preuve collectée et indiquer explicitement tout contrôle non réalisé. Partager `order_id` et le résultat serveur sans données carte ni jetons.

## Échec ou incident

Un refus bancaire reste un échec de paiement, même si la redirection arrive sur le site. Conserver l’identifiant de la tentative et le motif non sensible ; éviter les retries aveugles.

Le kill switch Paybox est `PAYBOX_ENV=preprod` suivi d’un déploiement, ou la désactivation du HMAC via le gestionnaire de secrets. Il bloque les nouvelles sessions selon le code déployé ; il n’annule ni ne rembourse automatiquement un encaissement déjà effectué. Un incident de paiement et sa résolution doivent être rapprochés avec le prestataire.

Le rail LIA/Vellum reste séparé. Ce smoke n’active aucun trading, aucun levier ni réinvestissement automatique.

[Statut et sécurité](prod-live-2026-10-29.md)
