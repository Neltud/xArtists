export type SolanaAccount={address:string;publicKey:ArrayLike<number>;chains:readonly string[]}
export type SolanaAsset={mint:string;amount:string;decimals:number;nft:boolean}
export const SOLANA_RPC:string
export const SPL_TOKEN_PROGRAM:string
export function decodePublicKey(value:unknown):Uint8Array|null
export function normalizeSolanaAccount<T extends SolanaAccount>(account:T):T|null
export function formatSolanaUnits(raw:string|bigint,decimals?:number):string
export function readSolanaPortfolio(address:string,options?:{signal?:AbortSignal;fetchImpl?:typeof fetch}):Promise<{owner:string;lamports:string;tokens:SolanaAsset[];nfts:SolanaAsset[];limited:boolean;checkedAt:number}>
