# Pipeline posts X — API + Vellum + Zapier

## Ce que Grok / le repo peuvent faire

| Couche | Capacité |
|--------|----------|
| Automation Grok | Drafts horaires (`xArtists-X-draft-30m-vellum-sync`) — **pas** de post X natif |
| Repo GitHub | Specs, kit viral, JSON paper — **jamais** de secrets API |
| Vellum (payant) | Workflow 30 min, HTTP, secrets vault — **cerveau** LIA |
| Zapier / Make | Pont draft → X sans coder un serveur |

**Interdit :** `X_API_KEY`, `X_ACCESS_TOKEN`, Bearer dans le front Vite ou un commit public.

---

## 1. Compte développeur X (API)

1. https://developer.x.com → projet + App **Read and Write**
2. Générer :
   - API Key + API Key Secret
   - Access Token + Access Token Secret  
   (ou OAuth 2.0 user context selon app)
3. Stocker **uniquement** dans :
   - Vault Vellum / secrets workflow  
   - ou Zapier Connected Accounts  
   - ou GitHub Actions secrets (jamais `VITE_*`)

Endpoints utiles :
- POST `https://api.x.com/2/tweets` (OAuth 2.0 user)  
- v1.1 `statuses/update` (OAuth 1.0a)

---

## 2. Option A — Vellum (recommandé si déjà payé)

Fréquence cible : **toutes les 30 minutes** (comme vos autres workflows).

### Nodes suggérés

```
[Schedule every 30m]
    → [Prompt node: draft post]
         system: docs/prompts/LIA_SYSTEM_PROMPT.md (tone)
         user: rotate thème + honnêteté paper (GO_DEMO, live OFF, packs ≠ tours)
    → [Guard node]
         refuse si promesse live/gasless non vraie
    → [HTTP / Code node: post to X]
         secrets: X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_SECRET
    → [Log node] → optional GitHub commit data/social_last_post.json (public, no secrets)
```

### Prompt draft (copier dans Vellum)

```
Rédige UN post X ≤280 car. pour xArtists / LIA.
Règles: demo https://neltud.github.io/xArtists/ ; paper only ; packs = Pulse Yield Sentinel ;
Tours art = service séparé ; pas de gasless live.
Thème (rotation): intention ⌘K | packs | board LIA | tours | wallet MVX | $TRO.
Hashtags: #LIA #Vellum #MultiversX #xArtists
Sortie: texte seul, prêt à publier.
```

### Secrets Vellum (noms)

```
X_API_KEY=
X_API_KEY_SECRET=
X_ACCESS_TOKEN=
X_ACCESS_TOKEN_SECRET=
# ou X_BEARER_TOKEN si app-only (limité pour poster au nom user)
```

---

## 3. Option B — Zapier (simple, sans code)

**Oui, Zapier est pertinent** si vous voulez publier vite sans brancher l’API dans Vellum.

### Zap minimal

1. **Trigger :** Schedule by Zapier → Every 30 minutes  
2. **Action (optionnel) :** Webhooks by Zapier → GET raw GitHub  
   `https://raw.githubusercontent.com/Neltud/xArtists/main/docs/marketing/VIRAL_POSTING_KIT.md`  
   ou un futur `data/social_queue.json`  
3. **Action :** OpenAI / ChatGPT (ou Code) → générer post avec les règles paper  
4. **Action :** X (Twitter) → Create Tweet  
   Compte X connecté dans Zapier (OAuth Zapier, pas de clé dans le repo)

### Variante hybride Grok → Zapier

1. Automation Grok produit `---DRAFT---` (déjà actif, horaire)  
2. Vous (ou un filtre email/app notification) validez  
3. Zap « New email / Slack message containing ---DRAFT--- » → Create Tweet  

Moins fluide que Vellum end-to-end, mais **zéro clé dans GitHub**.

---

## 4. Option C — GitHub Action (avancé)

`.github/workflows/x-post.yml` (à créer **après** secrets repo) :

- `schedule: cron: '*/30 * * * *'`
- Step: générer texte (script Python + OpenAI secret)  
- Step: poster via API X (secrets `X_*`)  
- **Ne pas** logger tokens

Template volontairement **non activé** dans le repo tant que les secrets ne sont pas posés.

---

## 5. Checklist GO post auto

- [ ] App X Read+Write  
- [ ] Secrets dans Vellum **ou** Zapier **ou** GH Actions (pas front)  
- [ ] Guard « paper honesty » dans le prompt  
- [ ] Cadence 30 min  
- [ ] Premier post manuel de test  
- [ ] Lien demo + hashtags  

## 6. Recommandation xArtists

| Priorité | Outil | Pourquoi |
|----------|-------|----------|
| **1** | **Vellum** | Déjà le cerveau LIA ; 30 min natif ; mêmes secrets ops |
| **2** | **Zapier** | Rapide, OAuth X, pas de serveur |
| **3** | GH Action | Si vous voulez tout dans GitHub CI |

Grok ici = **rédaction + specs repo**. Publication = Vellum ou Zapier avec API/OAuth.
