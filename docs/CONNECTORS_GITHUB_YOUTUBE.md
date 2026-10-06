# Connexions GitHub · YouTube · Grok

## GitHub ↔ Grok

Connecteur **GitHub** actif dans cette session : lecture/push sur `Neltud/xArtists`.

## YouTube (pas un connecteur Grok)

YouTube n'est **pas** dans les connecteurs Grok. Branchement = **API Google** + secret :

1. Google Cloud → activer YouTube Data API v3 → créer une clé API.
2. GitHub repo → Settings → Secrets → Actions → `YOUTUBE_API_KEY`.
3. Ops local (jamais committer la clé) :
   ```bash
   export YOUTUBE_API_KEY=...
   python scripts/sync_tca_sample_youtube.py
   ```
4. Commit uniquement `sample_lesson.json` (youtubeId public).

## Bot review PR

- Workflow : `.github/workflows/ai-code-review.yml`
- Script : `scripts/ci_ai_pr_review.py`
- Secret : `OPENAI_API_KEY` (Actions)
- Sans secret → skip (PR non bloquée)

## Roles

| Qui | Role |
|-----|------|
| Grok | Architecture, code, push |
| GitHub Actions | CI si secrets presents |
| Toi | Secrets, approve PR |

Ne jamais committer de cles API.
