/** Browser-side read-only listing guard. Checks real API at submission time. */
export type UserNftToList = {
 identifier?: string; collection?: string; nonce?: number; balance?: string | number;
 type?: string; uris?: string[]
}
export const MARKETPLACE_MAINNET: string
export const MARKETPLACE_CODEHASH: string
export function isOwnedNftListCandidate(nft: UserNftToList | null | undefined): boolean
export interface UserNftListProof {
 owner: string; identifier: string; collection: string; nonce: number;
 feeBps: number; royaltyBps: number; royaltyReceiver: string; checkedAt: number; escrowReceiver: string
}
export function verifyUserNftListPreflight(options: {
 address: string | null | undefined; identifier: string; collection: string;
 nonce: number; request?: typeof fetch
}): Promise<UserNftListProof>

export function nftIdentifier(collection: string, nonce: number): string
export function hasNftMediaUri(uris: unknown): boolean
