export type XorusPublicReadout=Readonly<{
  state:'unavailable'|'stale'|'paper'
  reason:string
  stance:'ABSTAIN'
  reportedStance:string|null
  signalsDefined:number
  signalsReported:number|null
  familiesReported:number|null
  independentlyVerifiedSignals:0
  independentlyVerifiedFamilies:0
  sourceTs:string|null
  ageMinutes:number|null
  live:false
  executable:false
  isStale:boolean
  sourceMode:'static_paper_snapshot'
}>
export type MultiversxEconomicsReadout=Readonly<{
  priceUsd:number
  marketCapUsd:number|null
  volume24hUsd:number|null
  provenance:'multiversx_public_api'
  sourceTimestampVerified:false
  decisionEligible:false
}>
export function interpretXorusSnapshot(snapshot:unknown,nowMs?:number):XorusPublicReadout
export function parseMultiversxEconomics(raw:unknown):MultiversxEconomicsReadout|null
