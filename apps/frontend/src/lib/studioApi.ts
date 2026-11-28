/** Studio-only route. Verified deployment 1 on the dedicated Neon project.
 * Pages pins this origin; local development may explicitly select it.
 * Never use a wildcard or fall back after a dedicated route fails.
 */
export const STUDIO_CANDIDATE_ORIGIN = 'https://br-sparkling-breeze-bh8gp2jl-studio.compute.c-10.eu-central-1.aws.neon.tech'
export const STUDIO_PILOT_MAX_BYTES = 2 * 1024 * 1024
export function selectStudioApiBase(configured:unknown,legacy:string):string {
  if(configured===undefined||configured==='')return legacy
  return configured===STUDIO_CANDIDATE_ORIGIN?STUDIO_CANDIDATE_ORIGIN:''
}
export function pilotConfigReady(value:unknown):boolean {
  if(!value||typeof value!=='object')return false
  const v=value as Record<string,unknown>
  return v.ok===true&&v.enabled===true&&v.provider==='pinata_ipfs'&&
    v.pilot_images_only===true&&v.maxImageMiB===2&&v.maxVideoMiB===0&&
    v.maxAudioMiB===0&&v.maxModelMiB===0&&v.modelEnabled===false&&
    v.mint_requires_artist_signature===true
}
export function pilotAcceptsFile(file:{type:string;size:number}):boolean {
  return ['image/jpeg','image/png','image/webp'].includes(file.type)&&
    Number.isInteger(file.size)&&file.size>0&&file.size<=STUDIO_PILOT_MAX_BYTES
}
