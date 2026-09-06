# Discord webhook — xArtists

Post automatique vers un salon (annonces, alerts, board LIA) **sans bot**.  
L’URL du webhook est un **secret** — jamais dans le frontend ni git.

**Serveur :** https://discord.gg/QkJgzeyWG

---

## 1. Créer le webhook (Discord)

1. Ouvre le salon cible, ex. **`#announcement`** (ou `#admins` pour ops)  
2. **Paramètres du salon** → **Intégrations** → **Webhooks** → **Nouveau webhook**  
3. Nom : `xArtists` (ou `LIA Alerts`)  
4. Avatar optionnel  
5. **Copier l’URL du webhook**  
   Format : `https://discord.com/api/webhooks/<id>/<token>`

Salons utiles :

| Salon | Usage |
|-------|--------|
| `#announcement` | Annonces produit / démo |
| `#admins` | Alertes ops (privées) |
| `#ia` | Signaux / board paper |
| `#scam-alert` | Alertes sécurité |

---

## 2. Stocker le secret

```bash
# Machine ops / Vellum / GitHub Actions secret — PAS dans apps/frontend
export DISCORD_WEBHOOK_URL='https://discord.com/api/webhooks/…'
# optionnel second canal ops
export DISCORD_WEBHOOK_OPS_URL='https://discord.com/api/webhooks/…'
```

GitHub : **Settings → Secrets → Actions** → `DISCORD_WEBHOOK_URL`

---

## 3. Tester (une ligne)

```bash
curl -sS -H 'Content-Type: application/json' \
  -d '{"content":"✅ Webhook xArtists OK — test depuis ops"}' \
  "$DISCORD_WEBHOOK_URL"
```

Ou :

```bash
python scripts/discord_webhook_notify.py --text "✅ Webhook xArtists OK"
```

---

## 4. Script ops

`scripts/discord_webhook_notify.py`

```bash
python scripts/discord_webhook_notify.py --text "Deploy Pages OK"
python scripts/discord_webhook_notify.py --embed-title "Board LIA" --embed-desc "Paper run terminé" --color 0x8b5cf6
```

Variables :

| Env | Rôle |
|-----|------|
| `DISCORD_WEBHOOK_URL` | Canal principal |
| `DISCORD_WEBHOOK_OPS_URL` | Si `--ops` |

---

## 5. Règles sécurité

- Ne **jamais** mettre l’URL dans `VITE_*` ou le bundle Pages  
- Si l’URL fuit : **supprimer le webhook** dans Discord et en créer un nouveau  
- Contenu = info publique ou canal privé admin uniquement  
- Pas de PEM, pas de seed, pas de secrets wallet dans les messages

---

## 6. Lien dApp

Le site pointe déjà vers le serveur : `LINKS.discord` = invite.  
Les webhooks sont **uniquement** côté ops / CI / Vellum.
