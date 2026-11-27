export type WorldId='museum'|'hall'|'hangar'|'garage'|'boutique'|'glasshouse'|'outdoor'
export type WorldProgress={space:WorldId;visited:WorldId[];inspected:string[]}
export const WORLD_IDS:readonly WorldId[]
export const WORLD_KEY:string
export function normalizeProgress(value:unknown):WorldProgress
export function enterSpace(progress:unknown,space:unknown):WorldProgress
export function inspectArt(progress:unknown,id:unknown):WorldProgress
export function readProgress(storage:Storage):WorldProgress
export function saveProgress(storage:Storage,progress:unknown):boolean
