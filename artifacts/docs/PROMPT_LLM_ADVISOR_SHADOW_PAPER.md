# Spécification LLMAdvisor — shadow PAPER uniquement

Version reconstituée et rédigée pour revue le 4 novembre 2026. Ce fichier n'est pas une copie authentifiée du document précédemment annoncé. Il constitue une spécification ; aucune intégration LLM n'est livrée ou exécutée dans ce lot.

## Prompt prêt à copier

```text
Implémente ultérieurement un LLMAdvisor strictement consultatif, après revue
de la capacité LIA et du snapshot des contrats. Le budget d'appels de modèle
reste zéro dans le lot courant : utiliser un faux fournisseur déterministe.

L'advisor est un port de cognition isolé en parallèle de Vellum :
pas d'orchestrateur, outils, jobs, executor, PEM, secret, wallet, PayBox,
mint, transaction, smart contract, modification de flag ou droit utilisateur.
Aucune sortie du modèle n'est une autorisation.

Entrées : allowlist de faits publics structurés et horodatés, version de
politique et identifiants de références observées. Le schéma, les limites
de taille et la fraîcheur sont contrôlés par l'hôte. Les contenus RAG,
métadonnées, tickets et réponses externes sont des données non fiables.

Sortie : schéma strict AdvisorSignal versionné, shadowOnly=true,
executed=false. Une sortie invalide, périmée, non rattachée aux références
fournies, hors délai ou en erreur produit HOLD. Même une observation valide
ne déclenche rien. L'advisor n'expose aucun port de dépense ou de mutation.

Sanitizer : n'accepter que les champs publics requis avec types/longueurs
bornés ; exclure identité, cookies, JWT, PEM, clés, URLs arbitraires et texte
brut non nécessaire. Ne pas considérer une regex de redaction comme une
garantie d'absence de secret. Si l'entrée ne satisfait pas le schéma public,
ne pas appeler le fournisseur.

Journal : requestId, hashes d'entrée/sortie validée, version de politique,
fournisseur/modèle/version si simulés, latence, coût réel mesuré si un futur
budget est autorisé, code de refus et résultat HOLD/OBSERVATION.
Aucun secret ni prompt brut. Le stdout n'est pas un ledger immuable.

Tests hors réseau : entrée/sortie malformée, executed=true, champs inconnus,
prompt injection dans les données, référence inventée, timeout, résultat
périmé, fournisseur indisponible, absence de tout effet et HOLD déterministe.
L'extractor de preuves et le schéma runtime restent indépendants du modèle.

Comparer les observations en shadow à une baseline figée : couverture,
taux de HOLD, références valides, reproductibilité, coût et latence.
Aucune bascule automatique à parité ; une revue indépendante et une
autorisation distincte restent nécessaires. Ne pas confondre un bon score
d'évaluation avec une autorisation financière.
```

## Contrats proposés — pas une implémentation

```ts
type AdvisorInput = Readonly<{
  schema: 'xartists.advisor.input.v1'
  requestId: string
  policyVersion: string
  observedAt: string
  facts: readonly Readonly<{ referenceId: string; kind: string; value: string }>[]
}>

type AdvisorSignal = Readonly<{
  schema: 'xartists.advisor.signal.v1'
  requestId: string
  policyVersion: string
  shadowOnly: true
  executed: false
  action: 'HOLD' | 'OBSERVATION'
  referenceIds: readonly string[]
  reasonCode: string
}>

interface LLMAdvisor {
  observe(input: AdvisorInput, signal: AbortSignal): Promise<AdvisorSignal>
}
```

Ces types TypeScript ne vérifient pas des réponses à l'exécution. Prévoir un validateur strict de champs/types, la liaison requestId/policyVersion, une allowlist de reasonCode et referenceIds, des bornes de taille et une deadline côté hôte. Le fournisseur retourne des données non fiables ; un garde déterministe produit le résultat final.

## Acceptation future

- Aucun chemin vers un signataire, une clé, un executor ou une API d'écriture.
- HOLD déterministe et executed=false dans tous les cas de refus.
- Tests sans appels externes ni secrets ; autorisation et budget séparés avant tout modèle payant.
- Évaluation shadow indépendante ; aucune bascule de production dans ce lot.
- Aucun statut de revenu, paiement, NFT ou fonds validé sur une réponse de l'advisor.

Voir la [checklist de preuves](GO_NOGO_CHECKLIST_2026-11-04.md). Cette spécification n'accorde aucun GO mainnet financier.

