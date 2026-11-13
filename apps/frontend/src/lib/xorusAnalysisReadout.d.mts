export type AnalysisReading='no_input'|'context_only'|'positive'|'negative'|'mixed'|'balanced'
export type AnalysisAgent={
  agent:'scout'|'tape'|'crowd'|'curator'|'sentinel'|'macro'|'chair'|'scribe'
  status:'recorded'|'veto'|'advisory_unverified'|'paper_unverified'|'context_only'|'no_input'
  families:{family:string;count:number;reading:AnalysisReading}[]
}
export type XorusAnalysisReadout=Readonly<{
  reportId:string;generatedAt:string;ageMinutes:number;stale:boolean;sourceTimeVerified:false
  stance:'ABSTAIN';reason:string;signalsAnalyzed:number;familiesAnalyzed:number
  independentlyVerifiedSignals:0;agents:AnalysisAgent[];rawDataIncluded:false
  commercialEnabled:false;executable:false
}>
export function interpretXorusAnalysisReport(raw:unknown,nowMs?:number):XorusAnalysisReadout|null
