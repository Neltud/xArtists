/** Explicit, local JPEG preparation for the bounded image-only Studio pilot.
 * The selected original is never overwritten or uploaded by this helper.
 */
import {STUDIO_PILOT_MAX_BYTES} from './studioApi'
export const STUDIO_ORIGINAL_JPEG_MAX_BYTES=16*1024*1024
export function studioJpegOptimizationEligible(file:{type:string;size:number}):boolean{
 return file.type==='image/jpeg'&&Number.isInteger(file.size)&&file.size>STUDIO_PILOT_MAX_BYTES&&file.size<=STUDIO_ORIGINAL_JPEG_MAX_BYTES
}
export function studioJpegDimensions(width:number,height:number,maxSide:number){
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width*height>40000000||!Number.isInteger(maxSide)||maxSide<1||maxSide>2048)throw Error('Image trop grande ou dimensions invalides.')
 const ratio=Math.min(1,maxSide/Math.max(width,height))
 return {width:Math.max(1,Math.floor(width*ratio)),height:Math.max(1,Math.floor(height*ratio))}
}
export async function optimizeStudioJpeg(file:File):Promise<File>{
 if(!studioJpegOptimizationEligible(file))throw Error('Choisissez une photo JPEG de plus de 2 Mo et de 16 Mo maximum.')
 const head=new Uint8Array(await file.slice(0,3).arrayBuffer())
 if(head.length!==3||head[0]!==255||head[1]!==216||head[2]!==255)throw Error('Le fichier ne semble pas être une photo JPEG valide.')
 if(typeof createImageBitmap!=='function')throw Error('Votre navigateur ne permet pas cette optimisation. Choisissez une photo JPEG plus légère.')
 const bitmap=await createImageBitmap(file,{imageOrientation:'from-image'})
 const canvas=document.createElement('canvas')
 try{
  const ctx=canvas.getContext('2d',{alpha:false})
  if(!ctx)throw Error('Optimisation indisponible sur cet appareil.')
  for(const side of [2048,1600,1200]){
   const size=studioJpegDimensions(bitmap.width,bitmap.height,side)
   canvas.width=size.width;canvas.height=size.height
   ctx.drawImage(bitmap,0,0,size.width,size.height)
   for(const quality of [.9,.82,.72]){
    const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,'image/jpeg',quality))
    if(blob&&blob.type==='image/jpeg'&&blob.size>0&&blob.size<=STUDIO_PILOT_MAX_BYTES)
     return new File([blob],file.name.replace(/\.jpe?g$/i,'')+'-studio.jpg',{type:'image/jpeg',lastModified:Date.now()})
   }
  }
  throw Error('Impossible de préparer une copie de 2 Mo maximum. Choisissez une autre photo.')
 }finally{bitmap.close();canvas.width=1;canvas.height=1}
}
