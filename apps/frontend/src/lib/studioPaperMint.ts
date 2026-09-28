/**
 * Studio paper mint E2E — certificat local jusqu’à SC mint live.
 */
import { dispatch8008 } from '../config/agent8008'

const KEY = 'xartists_studio_paper_mints_v1'

export type StudioPaperMint = {
  id: string
  ts: string
  collectionName: string
  ticker: string
  title: string
  description?: string
  media: string
  mode: 'digital' | 'physical'
  storage: string
  ipfsUri?: string
  youtubeUrl?: string
  royalty: number
  metadataJson: string
  artistAddress?: string
  status: 'paper' | 'pending_chain'
}

function readAll(): StudioPaperMint[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]') as StudioPaperMint[]
  } catch {
    return []
  }
}

function writeAll(list: StudioPaperMint[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, 100)))
  } catch {
    /* */
  }
}

export function listStudioPaperMints(): StudioPaperMint[] {
  return readAll()
}

export function mintStudioPaper(input: {
  collectionName: string
  ticker: string
  title: string
  description?: string
  media: string
  mode: 'digital' | 'physical'
  storage: string
  ipfsUri?: string
  youtubeUrl?: string
  royalty: number
  metadataJson: string
  artistAddress?: string
}): StudioPaperMint {
  const id = `paper-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
  const entry: StudioPaperMint = {
    id,
    ts: new Date().toISOString(),
    collectionName: input.collectionName,
    ticker: input.ticker.toUpperCase(),
    title: input.title,
    description: input.description,
    media: input.media,
    mode: input.mode,
    storage: input.storage,
    ipfsUri: input.ipfsUri,
    youtubeUrl: input.youtubeUrl,
    royalty: input.royalty,
    metadataJson: input.metadataJson,
    artistAddress: input.artistAddress,
    status: 'paper',
  }
  const all = readAll()
  all.unshift(entry)
  writeAll(all)

  try {
    dispatch8008('STUDIO_MINT_PAPER', {
      mint_id: id,
      ticker: entry.ticker,
      title: entry.title,
      mode: entry.mode,
      collection: entry.collectionName,
      artist: entry.artistAddress || '',
      paper: true,
      raw: `STUDIO_MINT_PAPER ${entry.ticker} ${entry.title}`,
    })
  } catch {
    /* bridge optional */
  }

  return entry
}
