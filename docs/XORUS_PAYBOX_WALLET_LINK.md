# xOrus × PayBox.sh — wallet propriétaire (liaison non custodiale, PREP)

**12 novembre 2026 — statut : PENDING OWNER PROOF / NO FUNDS MOVED.**

Le propriétaire souhaite que le wallet d'xOrus soit relié à **son** wallet PayBox.sh pour préparer un financement contrôlé. Cette PR matérialise la référence **watch-only** et les garde-fous; elle n'atteste pas l'accès actuel à un wallet, et ne réalise aucun transfert.

## Séparer les services / réseaux

1. **PayBox.sh** : wallets externes EVM et Solana (interface/credentials à vérifier à chaque connexion). Le projet mentionne des références historiques publiées le 17 octobre 2026 : une adresse Solana et une adresse EVM, **non certifiées aujourd'hui**. Les adresses dans `data/xorus_paybox_wallet_source.json` ne sont pas des destinations de dépôt approuvées. Une chaîne EVM n'est pas déduite d'une adresse `0x`.
2. **Paybox System (Verifone)** : prestataire de paiement carte **distinct**. Aucun lien de garde, crédit crypto ou autorisation de financement à inférer d'un paiement CB.
3. **MultiversX** : xPortal, wallet `erd1...` et signature client. **PayBox.sh ne constitue pas un wallet MultiversX**. Le wallet xOrus MultiversX n'a pas été provisionné ici ; aucune clé privée n'a été créée, copiée ou partagée.

## Ce que cette PR livre

- `data/xorus_paybox_wallet_source.json`: références publiques historiques *unverified*, wallet xOrus MultiversX `address: null`, tous les flags financiers à `false`.
- `lia/xorus/paybox_wallet_source.py`: lecture des candidats (formats Solana/EVM), exposé strictement watch-only, `inspect_funding_preflight` toujours bloquant. Ignorer `verified=true` ou `approved=true` dans le payload ; jamais un droit de propriété.
- `tests/test_xorus_paybox_wallet_source.py`: preuves d'absence de signature/envoi, rejet des injections, incompatibilité cross-chain, références obsolètes, doublons.
- CI dédié offline, sans credential ni droits d'écriture.
- Aucun lien d'exécution depuis `lia/xorus/decision_agent.py`. Le Chair/Sentinel et le wallet ne constituent pas ensemble une autorisation de trade.

## Séquence de liaison réelle — non activée par la PR

1. Depuis le **compte PayBox.sh propriétaire**, utiliser son OAuth officiel pour sélectionner le credential et lire les adresses + chain IDs **actuels**. Ne jamais transmettre une clé, seed, PEM ni token OAuth dans GitHub/ChatGPT.
2. Côté serveur, attacher ce credential au compte **propriétaire authentifié** ; vérifier une preuve fraîche de contrôle de l'adresse, au moyen d'un challenge lié à xArtists, au nonce unique, à la chaîne, à l'expiration et au domaine. Protéger contre replay, cross-account et domaines étrangers. L'existence d'une adresse dans un dépôt ne prouve pas son contrôle.
3. Côté xOrus, enregistrer *uniquement* un identifiant de liaison serveur, la chaîne, l'adresse publique et la date de dernière preuve. Aucune clé privée, aucun token accessible via le navigateur. Lecture de solde possible seulement après confirmation de la source.
4. Pour un financement futur **sur la même chaîne**, identifier séparément la destination vérifiée, le token, le montant exact, les frais et la réserve de gas. **L'utilisateur doit approuver une transaction explicite sur son wallet.** Une demande d'agent ne signe ni ne diffuse.
5. Un mouvement PayBox Solana/EVM → xOrus MultiversX exige un pont inter-chaînes **distinct et audité**, avec risques de slippage, réseau, frais, confirmation et token. Il est **bloqué** dans ce module et n'est pas implicitement autorisé par le mot « doter ».
6. Seulement après approbation et finalité on-chain vérifiable, un backend indépendant pourrait noter `funded_confirmed=true`. Le registre actuel ne le fait **jamais**.

## Démonstration offline

```bash
PYTHONPATH=. python - <<'PY'
import json
from pathlib import Path
from lia.xorus.paybox_wallet_source import inspect_paybox_wallet_source, inspect_funding_preflight
cfg = json.loads(Path('data/xorus_paybox_wallet_source.json').read_text())
print(inspect_paybox_wallet_source(cfg)['status'])
print(inspect_funding_preflight(cfg, source_chain='solana:mainnet',
                               target_chain='multiversx:1', amount_atomic='1000'))
PY
```

La réponse de financement est toujours `BLOCKED`, `tx_payload=None`, `broadcast=false`. Ceci n'est pas un faux transfert de testnet ni une attestation de fonds.

## Critère pour avancer

Autorisation du propriétaire de connecter son compte PayBox.sh via un client OAuth sécurisé, preuve cryptographique récente et wallet cible réel. Aucune API PayBox.sh n'est branchée ici. Ne pas se servir des adresses historiques comme destinations tant qu'elles ne sont pas revérifiées.

**Documentation source :** `docs/MULTICHAIN_PAYBOX_EXECUTOR.md` (§5), `docs/ACCOUNT_TYPES_WALLETLESS_WALLET_LINKED_P0.md`. Ne pas mélanger paiement fiat et gestion de fonds crypto.
