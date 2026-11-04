# LIA Intent — P0 simple et structuré

**Décision du 4 novembre 2026.** Aucun nouveau NLP, Command Bar, mandat signé ou signature d'intent. Le P0 fonctionne seulement avec des données structurées, pour les trois Genesis packs. Ne pas fusionner l'ancienne PR #366 comme substitut à cette version.

## Contrat et parcours

Page Packs / Genesis / My Packs (le composant existant PackCheckout) puis bouton **Préparer une simulation PAPER** puis endpoint POST /api/lia/intent puis devis Rule1 côté serveur puis bouton **Confirmer la simulation** ou **Annuler** puis journal paper et reçu explicite. Alias POST /v1/lia/intent.

### Préparer

    {
      "action": "prepare",
      "intent": {
        "type": "BUY_PACK",
        "packTier": "pulse",
        "amountEur": "110",
        "userAddress": "erd1..."
      }
    }

Réponse: status = ready, mode = paper, paperMode = true, confirmationId, quote avec montant EUR, estimation EGLD et taux, rule = Rule1, payable = false, expiresAtMs, requiresConfirmation = true, plan.paymentSubmitted = false, plan.nftMinted = false.

### Confirmer ou annuler

    {"action":"confirm","confirmationId":"<UUID de la réponse prepare>"}

Réponse: status = paper_success, simulated = true, paymentVerified = false, deliveryVerified = false, nftMinted = false, chainStatus = not_submitted, txHash = null, amountChargedCents = 0, accessGranted = false et auditId.

    {"action":"cancel","confirmationId":"<UUID de la réponse prepare>"}

Aucun digest/mandat signé ni langage naturel. Une simple confirmation HTTP liée à une session de wallet authentifiée.

## QuoteGate et sécurité

- Prix serveur verrouillés: Pulse 110 EUR, Yield 75 EUR, Sentinel 50 EUR. Le client doit fournir la paire exacte tier/amountEur. Les autres tiers, valeurs et champs sont refusés, y compris paperMode:false, live, signedIntent et les taux fournis par le navigateur.
- Taux uniquement côté API via EGLD_EUR_RATE ou ACCESS_FX_EUR_PER_EGLD; aucune valeur inventée. Sans taux valide, préparation refusée (503).
- Le backend appelle buildPackQuote Rule1 existant et vérifie devise, centimes exacts, marge 4 %, tolérance arrondi de 0,02 EUR, rail connu. Validité de la confirmation bornée à 30 s même si le devis checkout historique existe plus longtemps.
- Gas et solde NON vérifiés; cette citation de prix est PAPER et non payable.
- Identité dérivée du JWT HS256 vérifié (issuer xartists-access-api, sub erd1 checksum valide, claim wallet_proof_verified = true). Ce claim est émis exclusivement après preuve SIWX de connexion. Le serveur exige également REQUIRE_SIWX = true; ancien token SAMPLE non signé interdit.
- La signature SIWX ne sert qu'à une **connexion wallet**, pas à signer un intent ou une transaction.
- Vérification Origin pour les sites officiels, type JSON strict et limite HTTP existante de 16 KiB. Sans Origin, un client technique doit toujours posséder un bearer JWT correct.
- Expiration, annulation, mismatch de wallet, quotas et changement de contenu refusés. 20 préparations/heure/wallet, cache borné; aucun envoi, swap, API PayBox, relayer ou mint.

## Audit papier et limites

Une entrée JSON est émise sur stdout uniquement au moment de la confirmation: hash SHA256 de l'adresse, tier, centimes du catalogue, quoteId, confirmationId, auditId et mode paper. Idempotence: répéter la confirmation retourne le même reçu sans produire une deuxième entrée. Le système ne réclame ni argent ni NFT, et ne modifie aucune table de commandes ou entitlement My Packs.

**Limites:** journal de confirmations et quotas en mémoire, non durable, non partagé entre réplicas. Redémarrage = préparation perdue. Les logs stdout ne constituent pas un ledger financier immuable. Cette PR ne prouve aucune livraison NFT, ne crée aucune vente, ne définit aucun bouton live. Un adaptateur PostgreSQL transactionnel et un audit indépendant sont requis avant tout service d'intent durable.

Le checkout commercial historique reste soumis à ses propres gardes et à l'issue #281; la nouvelle voie P0 n'a aucune branche live. Les gates paybox_checkout_enabled, mint_live_enabled, LIA_LIVE_TRADING et le bridge TRO restent à OFF. L'adresse Solana PayBox.sh (#353) ne doit jamais être confondue avec PayBox System PSP.

## Tests

- Node 22, npm ci --prefix services/access-api
- node --test services/access-api/tests/lia-simple.test.mjs services/access-api/tests/lia-simple-http.test.mjs
- npm ci --prefix apps/frontend, puis npm --prefix apps/frontend run typecheck

Les tests utilisent un token JWT factice, un serveur local éphémère, une cotation Rule1 de test, et aucune transaction réseau vers un PSP ou une blockchain.

## Backlog séparé

La classification NLP, les mandats et la Command Bar de la PR #366 ne font pas partie du P0. Le contrôle de recherche/navigation existant du Shell est distinct et ne crée aucun intent. Ne pas confondre simulation avec achat, revenu, droit d'accès ou mint.
