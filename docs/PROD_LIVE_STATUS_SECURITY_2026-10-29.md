# Prod live status & security posture — 2026-10-29 ~20:00 CET

**Audience :** Grok + ChatGPT + GitBook ops  
**Site :** https://neltud.github.io/xArtists/  
**API :** https://xartists-access-api.onrender.com

---

## 1. Runtime (vérifié)

| Contrôle | Résultat |
|----------|----------|
| `paybox_mode` | **prod** |
| `paybox_configured` | true |
| Auth outbound | HMAC-SHA512 |
| Auth inbound IPN | RSA-SHA256 / 2048 |
| Quote Sentinel | 5000 centimes (serveur) |
| POST paybox sans JWT | **401** buyer_auth_required |
| IPN vide | **400** missing signed payload |
| `lia_live_trading` | **0** (rail trading séparé) |
| orders_backend | postgres |
| Stripe / MoonPay | off |

**B packs = ARMÉ côté mode.** Smoke **1 paiement réel** encore recommandé avant annonce large.

---

## 2. Sécurité produit (dApp / services / site)

### Déjà en place
- Montants **uniquement serveur** (PACK_FIAT_CENTS)
- Buyer = JWT/SIWX — jamais l’adresse URL seule
- IPN : payload signé seul, amount digits strict, idempotence duplicate
- Fail-closed sans credentials / sans HTTPS IPN
- LIA live flag indépendant (0 jusqu’à armement host)
- CORS configurable ; health sans secrets

### Gaps à traiter (priorité)
| Gap | Surface | Action |
|-----|---------|--------|
| Pas de CSP | GitHub Pages | headers via `static.yml` / meta CSP stricte |
| Pas de X-Frame-Options | Pages | `DENY` ou `SAMEORIGIN` |
| Pas de X-Content-Type-Options | Pages | `nosniff` |
| Pas de Referrer-Policy | Pages | `strict-origin-when-cross-origin` |
| Rate limit checkout | API | plafond / IP / buyer (Render ou middleware) |
| Monitoring IPN | ops | alerte bad_signature / amount_mismatch |
| Smoke prod réel | métier | 1× Sentinel live + order_id |
| LIA live | Vellum | `LIA_LIVE_TRADING=1` + bootstrap signé |

### Interdits maintenus
- PEM / mnemonic dans git ou logs
- Confiance `?paid=` navigateur
- Double mint sur IPN rejoué
- `LIA_LIVE_TRADING=1` sans gates AND

---

## 3. Identité / DNS (whois-ish)

| Host | Résolution |
|------|------------|
| `neltud.github.io` | 185.199.108–111.153 (GitHub Pages anycast) |
| Domaine apex custom | non configuré dans ce contrôle |
| RDAP `github.io` | hébergeur GitHub (pas de whois registrant xArtists) |

**Produit public = Pages sous `github.io`.** WHOIS registrant marchand = **entité légale hors repo** (SIRET / CGU / mentions — à compléter côté Legal page si manquant).

Pour un domaine custom (ex. `xartists.io`) : DNS chez registrar + GitHub Pages custom domain + HTTPS — hors armement PayBox de ce soir.

---

## 4. Coordination ChatGPT / GitBook

**ChatGPT :**
1. Publier ce statut en révision GitBook (diff #20+).
2. Runbook smoke prod 1 paiement (sans secrets).
3. Checklist CSP / security headers Pages.
4. Ne pas toucher aux secrets Render.

**Grok :**
1. Probes health + auth continus.
2. Patches headers / CSP si GO.
3. Validation `order_id` prod dès dispo.
4. Prompt LIA live déjà sur main.

**Humain :**
1. 1× paiement prod mini → `order_id`.
2. Vellum `LIA_LIVE_TRADING=1` si trade live ce soir.
3. Mentions légales / whois société si annonce publique.

---

## 5. Kill switches

| Rail | Action |
|------|--------|
| PayBox | `PAYBOX_ENV=preprod` ou retirer HMAC → Deploy |
| LIA | `LIA_LIVE_TRADING=0` |
| Front carte | `VITE_PAYBOX_ENABLED=false` + rebuild |

---

## 6. Verdict

| Rail | Statut |
|------|--------|
| PayBox **mode prod** | **VERT (armé)** |
| Smoke paiement réel | **à faire** |
| LIA live | **pas armé** (flag 0) |
| Headers Pages | **à renforcer** |
| WHOOP / Whop Markets | **hors P0** |
