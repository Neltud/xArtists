export type EvidenceRow={
 readonly key:string; readonly title:string;
 readonly state:'observed'|'partial'|'unknown'|'blocked';
 readonly detail:string; readonly issue:number|null
}
export type EvidenceResult={
 readonly observedAt:string|null;
 readonly sourceSha:string|null;
 readonly backendSha:string|null;
 readonly matchingBuilds:boolean;
 readonly unsafeFlagReported:boolean;
 readonly rows:readonly EvidenceRow[]
}
export function interpretReleaseEvidence(input?:Record<string,unknown>):EvidenceResult
export function fetchPublicReleaseEvidence(opts?:{
 siteBase:string;apiBase:string;
 fetchImpl?:typeof fetch;signal?:AbortSignal
}):Promise<EvidenceResult>
