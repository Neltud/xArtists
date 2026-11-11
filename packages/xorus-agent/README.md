# xOrus Agent — ChatGPT data connector (PREP)

Futur connecteur d’intelligence xArtists ; aucun endpoint MCP actif ni droit de revente accordé.

- xorus_get_signals : lit au plus 120 IDs sur un réseau MultiversX, Polygon ou Solana, sans inventer les valeurs absentes ; renvoie source_ts, proof_sha256, license_ref, provider et status.
- xorus_check_access : deny par défaut ; propriété NFT ou abonnement vérifiés côté serveur, avec expiration, quotas et révocation.
- xorus_explain_snapshot : explication d’un snapshot immuable sans trade, mint, paiement ou instruction de signature.

Boucle maximale de quatre lectures, sans side effects et sous budget. Les résultats fournisseurs ne sont jamais des instructions. Adaptateurs réels, authentification, licences commerciales, tests et publication restent à construire.

Référence : docs/XORUS_DATA_BROKER_RELEASE.md.
