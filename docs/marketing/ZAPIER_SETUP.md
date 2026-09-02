# Zapier — poster sur X sans mettre de clés dans GitHub

## Oui, utiliser Zapier

Idéal pour : OAuth X géré par Zapier, cadence 30 min, peu de code.

## Zap recommandé

1. **Trigger:** Schedule → Every 30 minutes  
2. **Action:** ChatGPT / Claude → prompt paper-safe (copier depuis `X_API_AND_VELLUM_WORKFLOW.md` §2)  
3. **Action:** X → Create Tweet → map le texte généré  

### Ou hybride Vellum → Zapier

1. Dans Vellum : après le node draft, HTTP POST vers **Zapier Catch Hook**  
2. Zap : Catch Hook → Create Tweet  
3. Secret `ZAPIER_CATCH_HOOK` uniquement dans Vellum

## Ne pas faire

- Mettre tokens X dans `apps/frontend` ou `.env` commité  
- Promettre live trading dans le prompt auto  
