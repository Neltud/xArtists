/**
 * Clés i18n audit B2B — DAO, DeFi, cert phygital, TCA Module 1, images.
 * Espaces insécables FR (\u00a0) avant : ? ! ;
 */
import type { Dict } from './types'

export const auditFr: Dict = {
  'dao.title': 'DAO',
  'dao.kicker': 'Gouvernance',
  'dao.lead':
    'Pouvoir de vote = $TRO staké + SFT stakés. Pas un fonds d’investissement.',
  'dao.votingPower': 'Pouvoir de vote',
  'dao.formula': 'Formule\u00a0: TRO staké + SFT stakés',
  'dao.troStaked': '$TRO staké',
  'dao.sftStaked': 'SFT / NFT stakés',
  'dao.stakeTro': 'Staker $TRO',
  'dao.stakeNft': 'Staker NFT',
  'dao.noPower': 'Pouvoir de vote nul — stakez d’abord $TRO ou des SFT.',
  'dao.voteYes': 'Pour',
  'dao.voteNo': 'Contre',
  'dao.yourVote': 'Votre vote\u00a0:',
  'dao.prop1.title': 'Activer fee market 250 bps → répartition trésorerie',
  'dao.prop1.body':
    'Orienter 50\u00a0% des frais market vers le splitter une fois la destination configurée.',
  'dao.prop2.title': 'Ouvrir le Slot réel (isPayable) après audit',
  'dao.prop2.body':
    'Passer le spin EGLD en payable uniquement après la checklist sécurité.',

  'defi.builder.title': 'Stake · Récompenses',
  'defi.builder.kicker': 'Constructeur DeFi',
  'defi.builder.lead':
    'Staker $TRO ou des SFT pour participer au rendement et au pouvoir de vote. Signature xPortal non-custodiale. Pas un conseil financier.',
  'defi.tab.tro': 'Staker $TRO',
  'defi.tab.nft': 'Staker NFT',
  'defi.tab.rewards': 'Réclamer récompenses',
  'defi.yourStake': 'Votre stake',
  'defi.pool': 'Pool',
  'defi.estDay': 'Est. / jour',
  'defi.rewards.hint':
    'Le contrat actuel expose stake / unstake. La réclamation dédiée s’activera quand l’endpoint on-chain sera ouvert.',
  'defi.claim': 'Réclamer les récompenses',
  'defi.manageUnstake': 'Gérer le unstake',
  'defi.troUtility':
    '$TRO sert au staking, à la liquidité et au pouvoir de vote DAO. Verrouiller des SFT renforce le poids de gouvernance.',

  'cert.kicker': 'Phygital · Papier',
  'cert.title': 'Certification NFT physique',
  'cert.lead':
    'CoA (authenticité) et CoP (propriété) — photo HD native (≥\u00a02\u00a0Mo · 8\u00a0MP). Mint on-chain après GO_LIVE.',
  'cert.sha': 'Empreinte SHA-256',
  'cert.sha.hint':
    'Empreinte SHA-256 du JPEG compressé (max 1024\u00a0px) — immuable après génération.',
  'cert.luminance': 'Analyse de variance de luminance',
  'cert.hd': 'Conformité HD ≥\u00a08\u00a0MP · σ\u00a0≥\u00a018',
  'cert.print': 'Imprimer / PDF A4',
  'cert.copy': 'Copier le certificat',
  'cert.generate': 'Générer',

  'tca.module1.badge': 'Module 1 · Échantillon ATC',
  'tca.module1.title': 'Module 1 — La science du sfumato',
  'tca.module1.subtitle': 'La fumée entre lumière et ombre',
  'tca.module1.obj1': 'Définir le sfumato sans le confondre avec un simple flou',
  'tca.module1.obj2': 'Identifier au moins trois valeurs sur un bord doux',
  'tca.module1.obj3': 'Pratiquer une silhouette sans contour dur',
  'tca.section.watch': 'Regarder',
  'tca.section.theory': 'Théorie',
  'tca.section.practice': 'Atelier',
  'tca.section.reflect': 'Réfléchir',
  'tca.ask': 'Interroger les notes d’atelier',
  'tca.unlock':
    'Le Pack Pulse débloque la salle holographique complète et le mentor RAG.',
  'tca.cta.pulse': 'Obtenir le Pack Pulse',
  'tca.contextSaved': 'Contexte enregistré pour la continuité salle (vidéo → mentor).',

  'img.loading': 'Chargement de l’image…',
  'img.unavailable': 'Image indisponible',
  'pitch.on': 'Mode Pitch',
  'pitch.banner': 'Mode Pitch · Galerie Partenaire — Collection RWA · journaux techniques masqués',
}

export const auditEn: Dict = {
  'dao.title': 'DAO',
  'dao.kicker': 'Governance',
  'dao.lead': 'Voting power = staked $TRO + staked SFTs. Not an investment fund.',
  'dao.votingPower': 'Voting power',
  'dao.formula': 'Formula: staked TRO + staked SFTs',
  'dao.troStaked': 'Staked $TRO',
  'dao.sftStaked': 'Staked SFT / NFT',
  'dao.stakeTro': 'Stake $TRO',
  'dao.stakeNft': 'Stake NFT',
  'dao.noPower': 'Zero voting power — stake $TRO or SFTs first.',
  'dao.voteYes': 'Yes',
  'dao.voteNo': 'No',
  'dao.yourVote': 'Your vote:',
  'dao.prop1.title': 'Enable market fee 250 bps → treasury split',
  'dao.prop1.body': 'Route 50% of market fees to the splitter once destination is set.',
  'dao.prop2.title': 'Open real Slot (isPayable) after audit',
  'dao.prop2.body': 'Enable payable EGLD spin only after the security checklist.',

  'defi.builder.title': 'Stake · Rewards',
  'defi.builder.kicker': 'DeFi Builder',
  'defi.builder.lead':
    'Stake $TRO or SFTs for yield participation and DAO weight. Non-custodial xPortal signing. Not financial advice.',
  'defi.tab.tro': 'Stake $TRO',
  'defi.tab.nft': 'Stake NFT',
  'defi.tab.rewards': 'Claim rewards',
  'defi.yourStake': 'Your stake',
  'defi.pool': 'Pool',
  'defi.estDay': 'Est. / day',
  'defi.rewards.hint':
    'Current contract exposes stake / unstake. Dedicated claim activates when the on-chain rewards endpoint is live.',
  'defi.claim': 'Claim rewards',
  'defi.manageUnstake': 'Manage unstake',
  'defi.troUtility':
    '$TRO is used for staking, liquidity, and DAO voting power. Locking SFTs increases governance weight.',

  'cert.kicker': 'Phygital · Paper',
  'cert.title': 'Physical NFT certification',
  'cert.lead':
    'CoA (authenticity) & CoP (ownership) — native HD photo (≥ 2 MB · 8 MP). On-chain mint after GO_LIVE.',
  'cert.sha': 'SHA-256 fingerprint',
  'cert.sha.hint': 'SHA-256 of compressed JPEG (max 1024 px) — immutable after issuance.',
  'cert.luminance': 'Luminance variance analysis',
  'cert.hd': 'HD compliance ≥ 8 MP · σ ≥ 18',
  'cert.print': 'Print / A4 PDF',
  'cert.copy': 'Copy certificate',
  'cert.generate': 'Generate',

  'tca.module1.badge': 'Module 1 · ATC sample',
  'tca.module1.title': 'Module 1 — The science of sfumato',
  'tca.module1.subtitle': 'Smoke between light and dark',
  'tca.module1.obj1': 'Define sfumato without confusing it with simple blur',
  'tca.module1.obj2': 'Identify at least three values on a soft edge',
  'tca.module1.obj3': 'Practice one silhouette without a hard contour',
  'tca.section.watch': 'Watch',
  'tca.section.theory': 'Theory',
  'tca.section.practice': 'Studio practice',
  'tca.section.reflect': 'Reflect',
  'tca.ask': 'Ask the studio notes',
  'tca.unlock': 'Pulse Pack unlocks the full holographic classroom and RAG mentor.',
  'tca.cta.pulse': 'Get the Pulse Pack',
  'tca.contextSaved': 'Context saved for classroom continuity (video → mentor).',

  'img.loading': 'Loading image…',
  'img.unavailable': 'Image unavailable',
  'pitch.on': 'Pitch mode',
  'pitch.banner': 'Pitch mode · Partner gallery — RWA collection · technical logs hidden',
}
