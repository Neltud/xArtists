# Posts X — automation

## Limitation Grok Automations

Cadence minimale supportée ici : **horaire** (`intervalMinutes: 60`), fenêtre 08:00–23:00 Europe/Paris.  
Pas de publication API X native dans ce connecteur → chaque run **rédige un draft** (`---DRAFT---`) à coller ou à faire publier par un posteur Vellum / Buffer / Typefully.

## Automation créée

- **Name :** `xArtists-X-draft-30m-vellum-sync`
- **taskId :** `4df77f9f-1f1b-4f80-a646-ff03727ca779`
- **Rôle :** drafts alignés repo + honnêteté paper

## Alignement 30 min (comme Vellum)

Pour une vraie fréquence **30 min** :

1. Workflow **Vellum** (service payé) qui appelle X API / posteur, **ou**
2. Cron GitHub Action + token X (hors scope secrets front).

Grok livre les textes ; Vellum peut consommer le même kit (`docs/marketing/VIRAL_POSTING_KIT.md`).
