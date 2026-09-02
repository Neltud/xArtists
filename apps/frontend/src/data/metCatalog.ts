import { MET_A } from './metCatalogA'
import { MET_B } from './metCatalogB'
export type MetWork = { id: string; title: string; artist: string; year?: string; museum?: string; remote?: string | null }
export const MET_WORKS: MetWork[] = [...MET_A, ...MET_B] as unknown as MetWork[]
