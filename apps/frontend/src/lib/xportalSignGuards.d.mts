export type XPortalPlainTx={
  receiver?:string;value?:string;data?:string;gasLimit?:number|string;
  chainID?:string;sender?:string;nonce?:number
}
export function parseXPortalAccountNonce(account:unknown):number
export function validateXPortalSignBatch(txs:XPortalPlainTx[],address:string,startingNonce:number):XPortalPlainTx[]
export function validateXPortalSignedBatch<T>(signed:T[],expectedCount:number):T[]
export function safeXPortalSignError(reason:unknown):string
