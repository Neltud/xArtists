# Configurer OAuth Zapier → X (Twitter)

Aucun secret dans GitHub ni dans le front. Zapier gère OAuth.

## Prérequis

- Compte [Zapier](https://zapier.com) (Free peut suffire pour tester ; Schedule 30 min selon plan)
- Compte X qui **publiera** les posts
- App X optionnelle : **pas obligatoire** si tu utilises l’intégration native « X » de Zapier (OAuth Zapier)

> Si tu as collé des Access Token dans un chat : **régénère-les** sur developer.x.com. Avec Zapier OAuth tu n’en as en général **pas besoin**.

---

## Étape 1 — Connecter X à Zapier

1. Zapier → **My Apps** (ou *Apps* dans le menu)
2. **Add connection** → chercher **X** ou **Twitter**
3. **Connect** → une fenêtre OAuth X s’ouvre
4. Autorise le compte X (celui de la marque / @xArtists)
5. Vérifie le statut **Connected**

Tu ne colles **pas** de API Key / Access Token dans Zapier si le connecteur native OAuth est utilisé.

---

## Étape 2 — Créer le Zap (30 minutes)

### Trigger
- App : **Schedule by Zapier**
- Event : **Every 30 Minutes** (ou *Custom* si disponible sur ton plan)
- Timezone : `Europe/Paris`

### Action 1 (recommandé) — générer le texte
- App : **ChatGPT** / **Claude** / **Formatter** (au choix)
- Prompt système (copie) :

```
Tu rédiges UN post X ≤280 caractères pour xArtists / LIA.
Règles strictes : demo https://neltud.github.io/xArtists/ ;
mode paper / GO_DEMO ; pas de live trading ; pas de gasless promis ;
packs = Pulse Yield Sentinel uniquement ; Tours art = service séparé (pas pack IA).
Hashtags : #LIA #Vellum #MultiversX #xArtists
Sortie : texte seul, prêt à publier.
```

- Fais tourner le thème (packs / ⌘K / board LIA / tours / wallet).

### Action 2 — publier
- App : **X** (Twitter)
- Event : **Create Tweet** (ou *Create Post*)
- Account : la connexion OAuth de l’étape 1
- Field **Message / Text** : mappe la sortie de l’Action 1

### Test
1. **Test step** sur Create Tweet
2. Vérifie le post sur le profil X
3. **Publish** le Zap → status **On**

---

## Variante : Zapier Catch Hook + Vellum

Si le draft est fait dans **Vellum** :

1. Zapier → Trigger **Webhooks by Zapier** → **Catch Hook**
2. Copie l’URL du hook → secret Vellum `ZAPIER_CATCH_HOOK` (vault Vellum uniquement)
3. Vellum (cron 30m) → draft → HTTP POST `{ "text": "..." }` vers cette URL
4. Zap action : **Create Tweet** avec `text` du body

Toujours **zéro** token X dans le repo GitHub.

---

## Dépannage

| Problème | Piste |
|----------|--------|
| X not connecting | Réessaie OAuth ; compte X non bloqué ; 2FA OK |
| Duplicate / rate limit | Élargir l’intervalle ; un seul Zap actif |
| Plan Zapier | Schedule « every 30 min » parfois réservé aux plans payants → sinon hourly |
| Mauvais compte | Déconnecter / reconnecter le bon @ |

## Lien kit contenu

- `docs/marketing/VIRAL_POSTING_KIT.md`
- `docs/marketing/X_API_AND_VELLUM_WORKFLOW.md`
