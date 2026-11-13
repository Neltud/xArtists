export const PUBLIC_ACCESS_API:string
export function verifiedNeonAuthBase(input:unknown):string|null
export function verifiedXartistsApiBase(input:unknown):string|null
export type WalletlessProfile={
  readonly id:string
  readonly type:'walletless'|'wallet_linked'
  readonly linkedWalletCount:number
  readonly subscriptionAccess:'not_checked'
  readonly xorusPrivateAccess:'not_checked'
}
export function requestWalletlessOtp(args:{
  email:string;authBase:string;apiBase?:string
  fetchImpl?:typeof fetch
}):Promise<{accepted:true}>
export function completeWalletlessOtp(args:{
  email:string;otp:string;authBase:string;apiBase?:string
  fetchImpl?:typeof fetch
}):Promise<WalletlessProfile>
