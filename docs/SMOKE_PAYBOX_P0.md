---
hidden: false
---

# Smoke PayBox P0 — 1 paiement réel

**Gate commercial :** obligatoire avant annonce packs.  
**Mode :** prod armé · LIA live = 0 · paper trading only.

## Prérequis

- API `paybox_mode=prod`
- JWT / SIWX wallet `erd1`
- Prix serveur seul (Sentinel 50 € / 5000 c recommandé pour le premier smoke)
- `VITE_PAYBOX_ENABLED` uniquement si IPN HTTPS + credentials OK

## Procédure

1. Ouvrir https://neltud.github.io/xArtists/
2. Connecter wallet (xPortal)
3. Pack **Sentinel** → rail **fiat / PayBox**
4. Accepter Terms of Access
5. Payer le montant catalogue
6. Capturer `order_id`
7. Vérifier côté API : IPN RSA valide, statut `paid`, pas de double mint
8. Vérifier My Packs / delivery path

## Critères de succès

| Critère | OK |
|---------|-----|
| 401 sans JWT | déjà prouvé |
| IPN signé reçu | |
| `order_id` unique | |
| Montant = catalogue serveur | |
| Pas de confirmation via query string seule | |
| NFT / droit visible ou job mint tracé | |

## Échec → kill

- `VITE_PAYBOX_ENABLED=false` + rebuild Pages
- ou bascule API `PAYBOX_ENV=preprod`

## Post-smoke

- Noter `order_id` dans GitBook + Notion Control Plane
- Débloquer S2 (preuve My Packs)
- **Toujours NO-GO** jusqu’à S1+S2 verts
