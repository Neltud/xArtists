# War Room Dashboard (Grafana) — spécification

4 zones. Métriques Prometheus cibles (à brancher quand infra live).

## Zone 1 — LIA Brain Health
- `lia_llm_response_duration_seconds` (P95)
- `lia_intent_success_rate`
- `lia_tokens_used_total`
- `lia_ambiguity_events_total`

## Zone 2 — Relayer & chain
- `blockchain_tx_count_per_min`
- `blockchain_gas_price_gwei`
- `relayer_error_rate_percentage`
- `blockchain_block_time_seconds`

## Zone 3 — Économie $TRO
- Total supply on-chain
- Burn rate
- TVL pools
- Volume $ via Relayer logs

## Zone 4 — Guardian / sécurité
- `guardian_blocks_total`
- `auth_failure_count`
- Large transfer table

Alertes : `infra/monitoring/alert_rules.json`
