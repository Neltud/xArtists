import type { ArtCollectionDraft } from './artCollectionPaper.mjs'

export type UnverifiedEvidence = {
  kind: string
  referenceId: string
  observedAt: string
  assetDigest: string
  verification: 'unverified'
}
export type ReviewPacket = {
  schema: 'xa-handoff/1'
  taskId: string
  assetDigest: string
  destination: 'creation' | 'trailer'
  evidence: UnverifiedEvidence[]
  blockers: string[]
}
export type LocalCreatorEvidence = {
  schema: 'xartists-local-creator-evidence/1'
  status: 'LOCAL_BYTES_HASHED_PAPER_ONLY'
  edition: number
  editionName: string
  planDigest: string
  fileSha256: string
  dossierDigest: string
  mime: string
  sizeBytes: number
  observedAt: string
  rightsDeclared: boolean
  promotionPermissionDeclared: boolean
  mediaUri: null
  metadataUri: null
  ipfsPinned: false
  mintEnabled: false
  paymentExecuted: false
  contractDeployed: false
  trailerPublished: false
  creatorHandoff: ReviewPacket
  trailerHandoff: ReviewPacket
}
export function prepareLocalCreatorEvidence(input: {
  file: File
  art: ArtCollectionDraft
  edition: number
  creativeBrief: string
  rightsDeclared: boolean
  promotionPermissionDeclared: boolean
}): Promise<LocalCreatorEvidence>
