export const MAX_SHAREABLE_IMAGE_BYTES:number
export function buildShareableGallery(draft:unknown,files:Record<string,File>,options?:{includeImages?:boolean}):Promise<string>
export function shareableGalleryFileName(name:string):string
