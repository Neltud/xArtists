export type ReadonlyWalletObservation={
  readonly connected:true;
  readonly address:string;
  readonly method:'paste_readonly';
  readonly sessionLive:false;
}
export function readonlyWalletObservation(address:unknown,protocolWallet:unknown):ReadonlyWalletObservation|null
export function restoreWalletObservation(raw:unknown,protocolWallet:unknown):ReadonlyWalletObservation|null
export function walletSignEligibility(args?:{
  connected?:boolean; address?:string; method?:string|null; sessionLive?:boolean;
  pairedAddress?:string|null
}):boolean
