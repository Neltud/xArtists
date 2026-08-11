# Access Pack Checkout — Fiat → Membership NFT (Model C)

**Product lock** : l’utilisateur achète un **droit d’accès** (pass), pas un mandat de gestion.  
Les trades affichés = **paper** (LIA signals → multi_capital_router). **Aucun fonds user tradé** en v1.

---

## 1. Architecture (flux critique)

```
[1] User Connect wallet (erd1) + choisit Pulse|Yield|Sentinel
[2] User accepte Terms of Access (modal obligatoire)
[3] Front POST /v1/checkout/session
      body: { pack_id, buyer_address }
      server: prix depuis catalogue (jamais trust client)
[4] Stripe Checkout Session (metadata: pack_id, buyer, price_cents, env)
[5] User paie (card / Google Pay via Stripe)
[6] Webhook checkout.session.completed
      ★ verify Stripe-Signature (HMAC)
      ★ idempotency: session.id unique
      ★ enqueue mint job
[7] Minter (PEM dédié, pas user) → MultiversX
      mintMembership(buyer, pack_id, stripe_session_id)
[8] Front poll /v1/checkout/status/:session_id
      pending → paid → minting → minted{tx, nonce, collection}
```

### Pourquoi ce découpage

| Risque | Mitigation |
|--------|------------|
| Client ment sur le prix | Prix **server-side** depuis `PACK_CATALOG` |
| Webhook forgé | `stripe.Webhook.construct_event` + secret |
| Double mint | Idempotency table `stripe_session_id` UNIQUE |
| Mint vers mauvaise adresse | `buyer_address` figé dans metadata session |
| Confusion “fonds gérés” | Terms UI + Model C copy partout |
| PEM exposé | Minter service isolé, secrets Vellum/CI only |

---

## 2. Catalogue (source de vérité prix)

| pack_id | List EUR | cents |
|---------|----------|-------|
| pulse | 18 | 1800 |
| yield | 12 | 1200 |
| sentinel | 8 | 800 |

Aligné `apps/frontend/src/config/agentPacks.ts`. LIA peut publier un override JSON plus tard ; le webhook refuse tout montant ≠ catalogue (±0).

---

## 3. Smart contract — `mint_membership`

### Recommandation v1

Collection ESDT **semi-soulbound** (transfer role held by SC / freeze after mint) :

```text
endpoint mintMembership(
  to: ManagedAddress,
  pack_id: ManagedBuffer,      // "pulse" | "yield" | "sentinel"
  payment_ref: ManagedBuffer,  // stripe session id
)
  only_owner_or_minter
  require !payment_ref_used
  store payment_ref → used
  mint NFT with attributes: pack, model=C, paper=true, issued_at
```

- **Owner/minter** = hot wallet ops dédié (pas LIA trading PEM si possible).  
- **User ne signe pas le mint** (fiat déjà payé) — UX seamless.  
- Alternative interim **sans SC** : mint via `mxpy` collection existante + log `data/mint_receipts/` (ops) jusqu’au deploy `agents_marketplace` / minter SC.

### Lien agents_marketplace

Plus tard : `buyAgent` on-chain en EGLD **ou** `mintMembership` post-fiat. Ne pas mélanger les deux paiements pour le même droit.

---

## 4. Webhook handler (contrat d’implémentation)

Voir `services/access_pack/webhook_handler.py` :

1. Lire raw body  
2. `construct_event(payload, sig, WEBHOOK_SECRET)`  
3. Si `checkout.session.completed` et `payment_status=paid`  
4. Extract metadata  
5. Insert receipt pending  
6. Call minter  
7. Update receipt minted / failed  

**Jamais** de mint sur `payment_intent.created` seul.

---

## 5. Frontend states

| State | UI |
|-------|-----|
| `idle` | Choisir pack |
| `terms` | Modal Terms obligatoire |
| `checkout` | Redirect Stripe |
| `polling` | “Paiement OK — mint en cours…” |
| `minted` | Explorer link + “Voir My Packs” |
| `failed` | Support + session id |

---

## 6. My Packs (paper)

- Liste NFT membership (API MVX nfts du wallet filtrés collection)  
- Join `simulated_ledger.json` / future API par `pack_id`  
- Feed 10 derniers paper tickets pour ce pack  
- Badge permanent : **PAPER · Model C**

---

## 7. Wording légal (obligatoire)

> You are purchasing an **access pass** (membership NFT).  
> Performance shown is **simulated (paper trading)** from LIA signals.  
> **No real funds** are traded on your behalf for this pack at this stage.  
> This is **not** an investment product and **not** a managed fund.

FR + EN sur la modal.

---

## 8. Env secrets (jamais front)

```
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
ACCESS_MINTER_PEM_PATH=   # or Vellum secret
ACCESS_NFT_COLLECTION=
ACCESS_API_BASE=
```

---

## 9. Go-live checklist

- [ ] Stripe webhook endpoint HTTPS  
- [ ] Signature verify tested with Stripe CLI  
- [ ] Idempotency DB/file  
- [ ] Minter PEM funded gas only  
- [ ] Terms modal blocking checkout  
- [ ] My Packs shows PAPER badge  
- [ ] No claim of live yield on access packs  
