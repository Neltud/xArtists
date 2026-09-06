# Discord xArtists — rôles automatiques

**Serveur :** https://discord.gg/QkJgzeyWG  
**Bot repo :** `bot-discord/` (+ `packages/discord-bot` LIA)

---

## 1. Rôles à créer (Server Settings → Roles)

Crée dans cet ordre (du **haut** vers le bas de la hiérarchie) :

| Rôle | Couleur suggérée | Auto | Permissions |
|------|------------------|------|-------------|
| `Admin` | rouge | non | Admin (toi / mods) |
| `Moderator` | orange | non | Manage messages, kick |
| **Bot role** (auto Discord) | — | — | **Doit être au-dessus** des rôles qu’il assigne |
| `Verified` | vert | bot / réaction | Accès salons communauté |
| `Holder` | violet | bot wallet | NFT / $TRO holder (futur) |
| `Pack Pulse` | émeraude | bot / onboarding | Communauté packs |
| `Pack Yield` | teal | bot / onboarding | |
| `Pack Sentinel` | sky | bot / onboarding | |
| `Artist` | rose | onboarding | Créateurs |
| `Collector` | ambre | onboarding | Collectionneurs |
| `Member` | gris clair | **join auto** | Base après vérif |
| `@everyone` | — | — | Lecture #welcome / #rules uniquement |

**Hiérarchie critique :** le rôle du **bot** doit être **au-dessus** de `Member`, `Verified`, `Holder`, packs — sinon Discord refuse `roles.add`.

---

## 2. Onboarding natif Discord (sans bot)

1. Activer **Community** sur le serveur  
2. **Server Settings → Onboarding**  
3. **Default channels :** `#welcome`, `#rules`, `#announcements`  
4. Questions (Advanced) exemples :

| Question | Réponses → rôles |
|----------|------------------|
| Tu es plutôt… | Collector → `Collector` · Artist → `Artist` · Builder → `Member` |
| Packs IA qui t’intéressent | Pulse / Yield / Sentinel → rôles pack |
| Notifications | Annonces / Marché / Art → rôles ping optionnels |

Les réponses assignent les rôles **automatiquement** à l’arrivée.

---

## 3. Autorole join (bot xArtists)

### 3.1 Créer le bot Discord

1. https://discord.com/developers/applications → New Application → **xArtists**  
2. **Bot** → Add Bot → Reset Token → copier `DISCORD_TOKEN`  
3. **Privileged Gateway Intents :** activer **Server Members Intent**  
4. OAuth2 → URL Generator :
   - Scopes : `bot`, `applications.commands`  
   - Permissions : Manage Roles, Send Messages, Read Message History, Add Reactions  
5. Ouvre l’URL, invite le bot sur le serveur  
6. Monte le **rôle du bot** au-dessus des rôles auto

### 3.2 Variables d’environnement

Fichier `bot-discord/.env` (jamais committer) :

```bash
DISCORD_TOKEN=...
DISCORD_GUILD_ID=          # ID serveur (Mode développeur → clic droit serveur)
ROLE_MEMBER_ID=            # snowflake rôle Member
ROLE_VERIFIED_ID=          # optionnel
ROLE_HOLDER_ID=            # optionnel — après verify-wallet
AUTO_ROLE_ON_JOIN=true
```

Activer **Mode développeur** Discord (User Settings → Advanced) pour copier les IDs.

### 3.3 Lancer

```bash
cd bot-discord
npm install
# renseigner .env
npm start
```

Au join : le bot assigne `ROLE_MEMBER_ID` si `AUTO_ROLE_ON_JOIN=true`.

### 3.4 Commandes

| Commande | Effet |
|----------|--------|
| `!verify-wallet erd1…` | Valide format MVX + assigne `Holder` si `ROLE_HOLDER_ID` set |
| `!roles` | Liste les rôles auto configurés |
| `!lia help` | Aide LIA |

> Signature crypto réelle (proof of ownership) = phase 2 — aujourd’hui validation format adresse + rôle symbolique.

---

## 4. Réaction / bouton (option rapide sans code)

Si le bot custom n’est pas encore hébergé 24/7 :

1. Invite **Carl-bot** ou **MEE6**  
2. Message dans `#roles` avec réactions 🎨 Collector · 🖼️ Artist · ⚡ Pulse · 🌾 Yield · 🛡️ Sentinel  
3. Map chaque emoji → rôle  
4. Garde le bot xArtists pour wallet / LIA plus tard

---

## 5. Checklist go-live communauté

- [ ] Rôles créés + hiérarchie bot OK  
- [ ] Onboarding Community activé  
- [ ] `#rules` + `#welcome` en default channels  
- [ ] `@everyone` ne voit pas les salons sensibles  
- [ ] `Member` / `Verified` débloquent le reste  
- [ ] Lien dApp footer : Discord déjà sur https://neltud.github.io/xArtists/  
- [ ] Token bot uniquement en secret (VPS / Railway / env host)

---

## 6. Lien dApp

`LINKS.discord` = `https://discord.gg/QkJgzeyWG` dans `apps/frontend/src/config/links.ts`.
