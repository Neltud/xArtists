# Acheter des NFT xArtists en EUR (Fiat)

## Objectif
Permettre l'achat de NFT de la marketplace sans détenir déjà de crypto.

## Flow recommandé (v1)

1. Utilisateur choisit un NFT sur la marketplace.
2. Clique **Acheter en EUR**.
3. Redirection **MoonPay** (ou Transak) pour acheter EGLD ou USDC avec carte bancaire.
4. Une fois la crypto reçue dans son wallet MultiversX (xPortal).
5. Retour sur xArtists → connexion wallet → paiement on-chain du NFT.
6. Commission marketplace prélevée automatiquement (voir LEGAL.md).

## Prestataires

| Prestataire | Rôle | Priorité |
|------------|------|----------|
| MoonPay | On-ramp carte → EGLD/USDC | 1 (premier) |
| xMoney | Carte + webhooks MultiversX | 2 |
| Stripe | Checkout fiat + mint custom | 3 (plus tard) |

## Intégration technique (frontend)

```html
<!-- Bouton exemple -->
<a class="btn btn-p"
   href="https://www.moonpay.com/buy?currencyCode=egld"
   target="_blank" rel="noopener">
  💳 Acheter en EUR (MoonPay)
</a>
```

Pour xMoney : utiliser le SDK / checkout + webhook déjà prévu dans le repo (Pipedream / backend).

## Conformité

- KYC/AML géré par le prestataire d'on-ramp.
- xArtists ne stocke pas de données carte.
- Afficher le disclaimer (LEGAL.md) avant le paiement.
- Prix NFT affiché en EUR (indicatif) + montant crypto exact on-chain.

## Prochaine étape code

- Ajouter onglet / page `buy` dans le dashboard Vellum.
- Lier chaque listing NFT au flow MoonPay + deep-link retour dApp.
