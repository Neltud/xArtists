/** Clés i18n LIA Hub / NFT gate Command Center — FR espaces insécables. */
import type { Dict } from './types'

export const liaHubFr: Dict = {
  'lia.hub.label': 'LIA Hub',
  'lia.hub.title': 'Agent autonome & signaux',
  'lia.hub.lead':
    'Multi-IA (Gemini / Grok · Vellum optionnel) · wallet agent en lecture · paper first.',
  'lia.hub.noAutonomousTx':
    'Aucune TX agent autonome\u00a0: les actions on-chain passent par xPortal.',
  'lia.control.kicker': 'LIA Hub · Salle de contrôle',
  'lia.control.hint': 'Survole / clique un écran holo',
  'lia.control.hintPack': 'Pack {id} · clic pour ouvrir',
  'lia.control.open': 'Ouvrir la salle de contrôle 3D · Packs Agent',
  'lia.control.webglUnavailable': 'WebGL indisponible — ouvrir les packs via /agents',
  'lia.loader': 'Initialisation de l’infrastructure xArtists…',

  'pack.gate.kicker': 'Command Center · Accès NFT',
  'pack.gate.title': 'Accès Réservé — Command Center LIA',
  'pack.gate.locked':
    'Cet écran de contrôle nécessite la possession d’un Pack Agent NFT {pack}.',
  'pack.gate.unlocked':
    'Pack {pack} détecté · tu peux entrer dans le Command Center.',
  'pack.gate.connectFirst':
    'Connecte ton wallet pour vérifier la possession du NFT.',
  'pack.gate.checking': 'Vérification des NFT du wallet…',
  'pack.gate.acquire': '🛒 Acquérir un Pack Agent',
  'pack.gate.verify': '🔐 Vérifier mon Wallet',
  'pack.gate.enterCc': '🚀 Entrer dans le Command Center',
  'pack.gate.disclaimer':
    'Gating on-chain + paper packs locaux. Non-custodial · pas un conseil financier.',
  'pack.cta.agents': 'Voir les Packs Agent',
  'pack.cta.cc': 'Command Center',
}

export const liaHubEn: Dict = {
  'lia.hub.label': 'LIA Hub',
  'lia.hub.title': 'Autonomous agent & signals',
  'lia.hub.lead':
    'Multi-AI (Gemini / Grok · optional Vellum) · agent wallet read-only · paper first.',
  'lia.hub.noAutonomousTx':
    'No autonomous agent txs: on-chain actions go through xPortal.',
  'lia.control.kicker': 'LIA Hub · Control room',
  'lia.control.hint': 'Hover / click a holo screen',
  'lia.control.hintPack': 'Pack {id} · click to open',
  'lia.control.open': 'Open 3D control room · Agent packs',
  'lia.control.webglUnavailable': 'WebGL unavailable — open packs via /agents',
  'lia.loader': 'Initializing xArtists infrastructure…',

  'pack.gate.kicker': 'Command Center · NFT access',
  'pack.gate.title': 'Reserved Access — LIA Command Center',
  'pack.gate.locked':
    'This control screen requires ownership of an Agent Pack NFT {pack}.',
  'pack.gate.unlocked':
    'Pack {pack} detected · you can enter the Command Center.',
  'pack.gate.connectFirst': 'Connect your wallet to verify NFT ownership.',
  'pack.gate.checking': 'Checking wallet NFTs…',
  'pack.gate.acquire': '🛒 Get an Agent Pack',
  'pack.gate.verify': '🔐 Verify my Wallet',
  'pack.gate.enterCc': '🚀 Enter Command Center',
  'pack.gate.disclaimer':
    'On-chain + local paper pack gating. Non-custodial · not financial advice.',
  'pack.cta.agents': 'View Agent Packs',
  'pack.cta.cc': 'Command Center',
}
