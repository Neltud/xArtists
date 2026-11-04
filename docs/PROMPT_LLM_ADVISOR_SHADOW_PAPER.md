# Prompt de spécification — LLMAdvisor (shadow paper only)

**Usage :** coller tel quel (ou adapter légèrement) dans ChatGPT / autre LLM pour générer **uniquement** le code et les tests du module advisor en mode shadow.  
**Interdit :** exécution on-chain, PEM, flags live, merge sans tests.

---

## Rôle du modèle

Tu es un ingénieur senior TypeScript / Node, spécialisé MultiversX et agents IA.  
Tu produis du code **production-ready, typé, fail-closed**, sans jamais activer d’exécution live.

Tu ne remplaces **pas** Vellum en entier. Tu remplaces **uniquement** la couche cognition LLM (rôle 1). Les rôles orchestration, scheduling, jobs Python, détention PEM et `git pull` restent hors scope.

---

## Objectif

Spécifier et implémenter une interface **`LLMAdvisor`** indépendante du fournisseur, avec un adaptateur ChatGPT (ou compatible OpenAI API), destinée à tourner en **shadow paper** en parallèle de Vellum.

Sortie attendue du module :
- Signaux structurés (JSON strict validé par schéma)
- `executed: false` toujours
- Aucun outil d’exécution
- Température basse
- En cas de timeout, erreur ou sortie invalide → **HOLD** (fail-closed)

Chaîne inchangée :
```
signal → IntentReceipt → Policy → paper
```

Le Fast Path (risque, sizing, circuit breaker) reste **déterministe**, jamais LLM.

---

## Contraintes non négociables

1. Le LLM **ne voit jamais** le PEM, les secrets, ni les clés.
2. Données externes (social, news) = **non fiables** ; défense contre l’injection de prompt.
3. Prompts **versionnés dans le repo**, avec journal `prompt / réponse / modèle`.
4. Contrat de référence existant : `CLAUDE_API_CONTRACT.md` (`SocialIntel`, `BusSignal`).
5. Repo GitHub `Neltud/xArtists` = source de vérité. Tout code généré passe par des **tests unitaires** avant tout merge.
6. Aucun claim « déployé » ou « live ». Mode shadow uniquement.
7. Alignement canon : `TREASURY_POLICY.md` (split, circuit breaker, cap TRO) — ne pas inventer d’autres chiffres.

---

## Interface à livrer

```typescript
// packages/lia-advisor/src/types.ts (indicatif)

export type AdvisorAction = 'HOLD' | 'BUY' | 'SELL' | 'STAKE' | 'UNSTAKE' | 'QUERY';

export interface AdvisorSignal {
  action: AdvisorAction;
  confidence: number;       // 0..1
  rationale: string;        // court, sans secrets
  executed: false;          // toujours false en shadow
  model: string;
  promptVersion: string;
  atMs: number;
}

export interface LLMAdvisor {
  /** Appel shadow : jamais d’exécution on-chain. */
  advise(input: {
    context: Record<string, unknown>; // données déjà sanitisées côté host
    promptVersion: string;
  }): Promise<AdvisorSignal>;
}
```

- Schéma de sortie validé (Zod ou équivalent).
- Si validation échoue → `{ action: 'HOLD', confidence: 0, executed: false, ... }`.
- Timeout configurable ; dépassement → HOLD.

---

## Livrables demandés (dans cet ordre)

1. **Types + schéma Zod** de `AdvisorSignal`.
2. **Interface `LLMAdvisor`** + adaptateur `ChatGPTAdvisor` (fetch OpenAI-compatible, pas de SDK lourd obligatoire).
3. **Sanitizer d’entrée** : strip des champs sensibles, bornes de taille, pas de PEM / JWT / mnemonic.
4. **Journal d’audit** (append-only en mémoire ou fichier test) : promptVersion, model, hash du prompt, action, confidence, atMs.
5. **Tests unitaires** (node:test ou vitest) :
   - sortie valide → signal parsé
   - JSON invalide / champs manquants → HOLD
   - timeout simulé → HOLD
   - `executed` toujours `false`
   - aucune clé secrète dans les logs
6. **README court** : comment brancher en shadow à côté de Vellum, comment comparer les signaux, comment **ne pas** basculer en live.

---

## Hors scope (ne pas générer)

- UniversalExecutor, Relayer, mint, PayBox, IPN
- Flags `LIA_LIVE_TRADING=1` ou équivalent
- Accès PEM / multisig / kill-switch
- SC MultiversX, wasm, deploy
- Remplacement de l’orchestration Vellum (scheduling, git pull, jobs Python)
- UI Command Bar ou NLP libre (P0 structuré uniquement si besoin)

---

## Critères d’acceptation

- [ ] `executed: false` sur 100 % des chemins
- [ ] Fail-closed (timeout / parse / schéma) → HOLD
- [ ] Zéro secret dans les prompts ou logs
- [ ] Tests verts en local
- [ ] Aucune dépendance à un executor live
- [ ] Compatible avec la chaîne `signal → IntentReceipt → Policy → paper`

---

## Contexte projet (rappel)

- Produit : dApp xArtists / Vellum.ia sur MultiversX
- LIA = Linguistic Intelligence Agent (paper-first)
- Posture actuelle : NO-GO mainnet fonds ; GO paper
- Plugin LLM = shadow parallèle à Vellum ; bascule uniquement à parité de signaux après revue humaine

**Génère uniquement le code et les tests du module advisor shadow. N’active aucun chemin live.**
