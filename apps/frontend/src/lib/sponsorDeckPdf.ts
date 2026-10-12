/**
 * @deprecated Export PDF sponsor retiré du LIA Hub.
 * Accès Command Center = NFT gate (HoloPackModal + holderAccess).
 * Fichier conservé vide d’API pour éviter les imports cassés résiduels.
 */
import type { PackId } from '../config/agentPacks'

export function buildSponsorDeckPdf(_packId: PackId): { blob: Blob; filename: string } {
  void _packId
  return {
    blob: new Blob(['Sponsor PDF disabled — use Agent Pack NFT gate.'], {
      type: 'text/plain',
    }),
    filename: 'DISABLED.txt',
  }
}

export function downloadSponsorDeckPdf(_packId: PackId): void {
  void _packId
  if (typeof console !== 'undefined') {
    console.info('[xArtists] Sponsor PDF disabled — open /agents for Pack NFT access.')
  }
}
