/**
 * Vellum command engine — deterministic, paper-only.
 * A plan is never a signature, a broadcast, or a quote.
 * executionAuthorized and signingAuthorized are fixed false.
 */

/** @typedef {'status'|'onramp'|'swap'|'stake'|'rebalance'|'list_nft'|'buy_pack'|'circuit_breaker'|'abstain'} IntentKind */
/** @typedef {'paper_plan'|'veto'|'abstain'} Verdict */
/** @typedef {'hot'|'warm'|'cold'|'none'} VaultTier */
/** @typedef {'off'|'paper'|'blocked'} RailState */

/**
 * @typedef {Object} Rail
 * @property {string} id
 * @property {string} label
 * @property {RailState} state
 * @property {string} note
 */

/**
 * @typedef {Object} Plan
 * @property {string} id
 * @property {string} raw
 * @property {IntentKind} kind
 * @property {Verdict} verdict
 * @property {string} title
 * @property {string} summary
 * @property {string[]} steps
 * @property {Rail[]} rails
 * @property {{ stance: 'ABSTAIN'|'VETO'|'PAPER', reason: string }} guardian
 * @property {VaultTier} vault
 * @property {false} executionAuthorized
 * @property {false} signingAuthorized
 * @property {string} capNote
 * @property {number|null} amount
 * @property {string|null} unit
 */

export const PAPER_ORDER_CAP_USD = 5;

const RAILS = /** @type {Rail[]} */ ([
  {
    id: "moonpay",
    label: "MoonPay",
    state: "off",
    note: "Clé publique non armée. Un on-ramp n’est pas un encaissement.",
  },
  {
    id: "apple_pay",
    label: "Apple Pay",
    state: "off",
    note: "One-tap prévu. Aucun merchant actif.",
  },
  {
    id: "google_pay",
    label: "Google Pay",
    state: "off",
    note: "One-tap prévu. Aucun merchant actif.",
  },
  {
    id: "paybox",
    label: "PayBox",
    state: "off",
    note: "Configuré en prod, checkout désactivé.",
  },
  {
    id: "relayer",
    label: "Relais gasless",
    state: "off",
    note: "Aucune transaction n’est soumise à la place de l’utilisateur.",
  },
  {
    id: "multiversx",
    label: "Signer MultiversX",
    state: "blocked",
    note: "Session xPortal non prouvée (#506). Signature toujours humaine.",
  },
]);

/**
 * @param {string} value
 */
export function fold(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * @param {string} raw
 * @returns {{ amount: number|null, unit: string|null }}
 */
export function readAmount(raw) {
  const match = fold(raw).match(/(\d+(?:[.,]\d+)?)\s*(eur|euro|€|usd|usdc|egld|tro)?/);
  if (!match) return { amount: null, unit: null };
  const amount = Number(match[1].replace(",", "."));
  if (!Number.isFinite(amount)) return { amount: null, unit: null };
  const token = match[2] || null;
  const unit = token === "euro" || token === "€" ? "eur" : token;
  return { amount, unit };
}

/**
 * @param {string} folded
 * @param {number|null} amount
 * @param {string|null} unit
 */
function exceedsPaperCap(folded, amount, unit) {
  if (amount == null) return /(tout|all|entier|entiere)/.test(folded);
  if (unit === "eur" || unit === "usd" || unit === "usdc" || unit == null) {
    return amount > PAPER_ORDER_CAP_USD;
  }
  if (unit === "egld") return amount > 0.2;
  if (unit === "tro") return amount > 100;
  return false;
}

/**
 * @param {IntentKind} kind
 * @returns {VaultTier}
 */
function vaultFor(kind) {
  if (kind === "circuit_breaker") return "cold";
  if (kind === "stake" || kind === "rebalance") return "warm";
  if (kind === "onramp" || kind === "swap" || kind === "buy_pack") return "hot";
  return "none";
}

/**
 * @param {string} raw
 * @param {number} [now]
 * @returns {Plan}
 */
export function planIntent(raw, now = Date.now()) {
  const text = raw.trim();
  const folded = fold(text);
  const { amount, unit } = readAmount(text);
  const base = {
    id: `vellum-${now.toString(36)}`,
    raw: text,
    amount,
    unit,
    rails: RAILS.map((rail) => ({ ...rail })),
    executionAuthorized: /** @type {false} */ (false),
    signingAuthorized: /** @type {false} */ (false),
  };

  if (!folded) {
    return {
      ...base,
      kind: "abstain",
      verdict: "abstain",
      title: "Intention vide",
      summary: "LIA n’invente pas d’ordre. Écrivez ce que vous voulez préparer.",
      steps: ["Saisir une intention en français ou en anglais."],
      guardian: { stance: "ABSTAIN", reason: "Rien à classer." },
      vault: "none",
      capNote: "Plafond pilote de référence : 5 USD. Budget live : 0.",
    };
  }

  if (/(drain|send all|transfer all|vide le wallet|retire tout|envoie tout|envoyez tout)/.test(folded)) {
    return finish(base, {
      kind: "abstain",
      verdict: "veto",
      title: "Veto Guardian — extraction",
      summary: "Demande de vidage refusée. Aucun mouvement, même fictif, n’est consigné comme ordre.",
      steps: ["Arrêt. Aucun plan d’extraction n’est préparé.", "Le coffre froid reste fermé."],
      guardian: { stance: "VETO", reason: "Schéma d’extraction de liquidité." },
      vault: "cold",
      capNote: "Un veto n’est pas une transaction.",
    });
  }

  if (/(live trading|trade en live|signe maintenant|signer maintenant|broadcast|envoie la tx|envoyer la tx)/.test(folded)) {
    return finish(base, {
      kind: "abstain",
      verdict: "veto",
      title: "Veto Guardian — exécution demandée",
      summary: "Cette console ne signe pas et ne diffuse pas. LIA_LIVE_TRADING reste interdit.",
      steps: ["Refus de l’exécution.", "Reformuler en préparation papier, sans demande de signature."],
      guardian: { stance: "VETO", reason: "Exécution ou signature demandée alors que les rails sont fermés." },
      vault: "cold",
      capNote: "Budget live : 0. Stance xOrus : ABSTAIN.",
    });
  }

  /** @type {IntentKind} */
  let kind = "abstain";
  if (/(pause|circuit breaker|urgence|guardian)/.test(folded)) kind = "circuit_breaker";
  else if (/^(statut|status|etat|rails)\b/.test(folded) || /\b(statut des rails|ou en est)\b/.test(folded)) kind = "status";
  else if (/(stake|staker|staking)/.test(folded)) kind = "stake";
  else if (/(reequilibr|rebalance|hatom|liquidit|yield)/.test(folded)) kind = "rebalance";
  else if (/(vendre|listing|list nft|marketplace|annonce|mettre en vente)/.test(folded)) kind = "list_nft";
  else if (/(pack|pulse|sentinel|agent ia)/.test(folded)) kind = "buy_pack";
  else if (/(swap|echang|convert|convertir)/.test(folded)) kind = "swap";
  else if (/(achet|buy|on-?ramp|moonpay|apple pay|google pay|\bfiat\b|\beuros?\b|\beur\b|€)/.test(folded)) kind = "onramp";

  const over = exceedsPaperCap(folded, amount, unit);

  if (kind === "abstain") {
    return finish(base, {
      kind,
      verdict: "abstain",
      title: "Abstention",
      summary: "Intention non reconnue. Aucun appel de contrat n’est déduit.",
      steps: [
        "Reformuler : achat fiat, swap, stake $TRO, rééquilibrage, vente NFT, pack, statut ou pause.",
        "Une phrase ambiguë ne devient jamais un ordre.",
      ],
      guardian: { stance: "ABSTAIN", reason: "Hors grammaire d’intention." },
      vault: "none",
      capNote: "Plafond pilote de référence : 5 USD.",
    });
  }

  if (over && kind !== "status" && kind !== "circuit_breaker") {
    return finish(base, {
      kind,
      verdict: "veto",
      title: "Veto Guardian — plafond pilote",
      summary: "Le montant dépasse le plafond de référence (5 USD, 0,2 EGLD ou 100 TRO). Rien n’est préparé pour exécution.",
      steps: [
        "Réduire l’intention sous le plafond papier.",
        "Même sous le plafond, cette console ne signe pas.",
      ],
      guardian: { stance: "VETO", reason: "Dépassement du plafond pilote. Le plafond n’est pas une perte maximale garantie." },
      vault: "cold",
      capNote: "Référence xOrus : ordre 5 USD, budget live 0.",
    });
  }

  const copy = COPY[kind];
  return finish(base, {
    kind,
    verdict: "paper_plan",
    title: copy.title,
    summary: copy.summary,
    steps: copy.steps,
    guardian: { stance: "PAPER", reason: copy.reason },
    vault: vaultFor(kind),
    capNote: "Plan papier. executionAuthorized=false. signingAuthorized=false.",
  });
}

/**
 * @param {Omit<Plan, 'kind'|'verdict'|'title'|'summary'|'steps'|'guardian'|'vault'|'capNote'>} base
 * @param {Pick<Plan, 'kind'|'verdict'|'title'|'summary'|'steps'|'guardian'|'vault'|'capNote'>} patch
 * @returns {Plan}
 */
function finish(base, patch) {
  return { ...base, ...patch };
}

const COPY = {
  status: {
    title: "Statut des rails",
    summary: "Lecture seule. Aucun rail de paiement, de mint ou de trading n’est ouvert.",
    reason: "Demande d’état, pas d’ordre.",
    steps: [
      "Pages publiques : vitrine papier, pas un GO commerce.",
      "xOrus : stance ABSTAIN, exécution fermée, 0 wallet lié par le hub.",
      "Bloquants humains : session xPortal (#506), cycle marketplace (#428), réception mail (#341).",
    ],
  },
  onramp: {
    title: "Préparation d’entrée fiat",
    summary: "Intention d’achat classée. MoonPay, Apple Pay et Google Pay ne sont pas branchés.",
    reason: "On-ramp reconnu, rail fermé.",
    steps: [
      "Conserver le montant comme hypothèse, pas comme ordre.",
      "Un seul rail fiat pourra être ouvert plus tard, après webhook, révocation et cadre légal.",
      "Aucun débit n’est lancé.",
    ],
  },
  swap: {
    title: "Préparation de swap",
    summary: "Le swap est un plan. Il n’y a pas de quote frais, donc pas de route.",
    reason: "Swap reconnu sans adaptateur de signature.",
    steps: [
      "Identifier la paire, sans prétendre un prix.",
      "Attendre un quote daté et une simulation, puis une signature humaine.",
      "Le relais gasless reste éteint.",
    ],
  },
  stake: {
    title: "Préparation de stake $TRO",
    summary: "Le staking existe comme contrat à lire. Cette console ne délègue rien.",
    reason: "Stake classé vers le coffre tiède, sans signature.",
    steps: [
      "Vérifier le codeHash du contrat avant toute lecture signée.",
      "Le pont $TRO reste fermé.",
      "Aucun rendement n’est promis.",
    ],
  },
  rebalance: {
    title: "Préparation de rééquilibrage",
    summary: "Hatom, xExchange, Polygon et Ethereum sont des pistes. Aucun écart de prix n’est affiché.",
    reason: "Orchestration papier. Une piste n’est pas une liquidité prouvée.",
    steps: [
      "Ne pas choisir une route sans quote frais et sans sortie possible.",
      "xPortal route déjà via Pegaroute : ce n’est pas l’adaptateur xArtists.",
      "Aucune réallocation n’est envoyée.",
    ],
  },
  list_nft: {
    title: "Préparation de mise en vente",
    summary: "Le catalogue marketplace se lit. Le cycle listing → achat n’est pas certifié (#428).",
    reason: "Vente non exécutable tant que deux hashes Explorer distincts manquent.",
    steps: [
      "Garder l’œuvre en préparation, pas en annonce certifiée.",
      "Deux wallets distincts et un reçu Explorer restent exigés.",
      "Aucun achat n’est proposé depuis ce plan.",
    ],
  },
  buy_pack: {
    title: "Préparation de pack agent",
    summary: "Pulse, Yield et Sentinel restent au catalogue papier. Pas de mint public.",
    reason: "Pack reconnu, mint et encaissement fermés.",
    steps: [
      "Le prix catalogue n’est pas une facture.",
      "Aucun webhook de paiement n’est appelé.",
      "La livraison NFT n’est pas déclarée.",
    ],
  },
  circuit_breaker: {
    title: "Demande de pause",
    summary: "La pause d’urgence est un acte d’opérateur sur les contrats, pas un bouton public.",
    reason: "Circuit breaker reconnu. Cette console ne possède pas la clé de pause.",
    steps: [
      "Noter la demande. Elle n’appelle aucune fonction pause.",
      "Les retraits doivent rester possibles pendant une pause (revue contrat en cours, #644).",
      "Aucun flag finance n’est modifié.",
    ],
  },
};
