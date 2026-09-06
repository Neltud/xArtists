# Discord xArtists — intégration simple

**Invite :** https://discord.gg/QkJgzeyWG  
**DApp :** lien footer + accueil (`LINKS.discord`)

## Structure serveur

| Catégorie | Salons |
|-----------|--------|
| Welcome | `#welcome` · `#verification-channel` · `#rules` |
| Informations | `#announcement` |
| Community | `#general-fr` · `#general-en` |
| Support | `#suggestion` · `#scam-alert` · `#open-ticket` |
| Bots | `#wallet-verify` · `#egld` · trackers · `#ia` · `#images-ia` · `#videos-ia` |
| Vocal | Vocal-Fr · Vocal-En |
| Admin | `#admins` · `#sortants` · `#modérateur` |

## Côté dApp

- Footer + Home → invite Discord  
- Pas de bot dans le front  
- **Pas** d’URL webhook en `VITE_*`

## Webhook (ops)

Voir **[DISCORD_WEBHOOK.md](./DISCORD_WEBHOOK.md)**.

1. Salon → Intégrations → Webhooks → copier l’URL  
2. `export DISCORD_WEBHOOK_URL='…'`  
3. `python scripts/discord_webhook_notify.py --text "test"`

## Optionnel

- Message épinglé `#welcome` avec https://neltud.github.io/xArtists/  
- Rôles auto : `docs/DISCORD_AUTO_ROLES.md`
