/** Browser-side read-only listing guard. Checks real API at submission time. */
export type UserNftToList = {
 identifier?: string; collection?: string; nonce?: number; balance?: string | number;
 type?: string; uris?: string[]; [key: string]: unknown
}
export const MARKETPLACE_MAINNET: string
export const MARKETPLACE_CODEHASH: string
export function isOwnedNftListCandidate(nft: UserNftToList | null | undefined): boolean
export interface UserNftListProof {
 owner: string; identifier: string; collection: string; nonce: number;
 feeBps: number; royaltyBps: number; checkedAt: number; escrowReceiver: string
}
export function verifyUserNftListPreflight(options: {
 address: string | null | undefined; identifier: string; collection: string;
 nonce: number; royaltyBps?: number; request?: typeof fetch
}): Promise<UserNftListProof>
