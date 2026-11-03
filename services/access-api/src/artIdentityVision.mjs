/**
 * xArtists Art-ID perceptual signal v1 — bounded, deterministic, no I/O.
 * Input: already-decoded RGBA pixels. Decode media in a sandbox separately.
 * Hashes are NOT unique and never certify authorship, ownership or theft.
 */
import { compareVisualHash64V1 } from './artIdentity.mjs'

export const ART_PHASH_V1 = 'xartists.phash64-dct-fit.v1'
const SIDE = 32, FREQ = 8, MAX_SOURCE_PIXELS = 4_000_000
const MAX_CANDIDATES = 2000, MIN_CONTRAST_STD = 3
const COS = Array.from({length:FREQ}, (_,freq) =>
  Float64Array.from({length:SIDE}, (_,x) =>
    Math.cos(((2*x+1)*freq*Math.PI)/(2*SIDE))))
const REF = /^[a-zA-Z0-9][a-zA-Z0-9_:./-]{2,159}$/
const PHASH = /^[a-f0-9]{16}$/

function assertFrame({width,height,rgba}) {
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) ||
      width < 1 || height < 1 || width > 4096 || height > 4096 ||
      width*height > MAX_SOURCE_PIXELS ||
      !(rgba instanceof Uint8Array) || rgba.byteLength !== width*height*4) {
    throw new TypeError('decoded_rgba_frame_required_or_too_large')
  }
}
function rgbaLuma(rgba,width,x,y) {
  const off = 4*(y*width+x), alpha=rgba[off+3]/255
  // Composite transparent pixels over white, never read hidden RGB as evidence.
  return alpha*(0.2126*rgba[off]+0.7152*rgba[off+1]+0.0722*rgba[off+2])+
    (1-alpha)*255
}
function sampleBilinear(rgba,width,height,x,y) {
  const xx=Math.max(0,Math.min(width-1,x)), yy=Math.max(0,Math.min(height-1,y))
  const x0=Math.floor(xx), y0=Math.floor(yy)
  const x1=Math.min(width-1,x0+1), y1=Math.min(height-1,y0+1)
  const dx=xx-x0,dy=yy-y0
  const top=rgbaLuma(rgba,width,x0,y0)*(1-dx)+rgbaLuma(rgba,width,x1,y0)*dx
  const bot=rgbaLuma(rgba,width,x0,y1)*(1-dx)+rgbaLuma(rgba,width,x1,y1)*dx
  return top*(1-dy)+bot*dy
}

/** 64-bit DCT pHash (bit 0 reserved for DC), aspect-ratio preserving fit. */
export function computeArtPHash64V1(frame) {
  if (!frame || typeof frame!=='object') throw new TypeError('decoded_rgba_frame_required')
  assertFrame(frame)
  const {width,height,rgba}=frame
  const scale=Math.min(SIDE/width,SIDE/height)
  const fittedW=Math.max(1,Math.min(SIDE,Math.round(width*scale)))
  const fittedH=Math.max(1,Math.min(SIDE,Math.round(height*scale)))
  const left=Math.floor((SIDE-fittedW)/2), top=Math.floor((SIDE-fittedH)/2)
  const pixels=new Float64Array(SIDE*SIDE).fill(255)
  let sum=0,squares=0
  for(let row=0;row<fittedH;row++)for(let col=0;col<fittedW;col++){
    const x=(col+0.5)/scale-0.5, y=(row+0.5)/scale-0.5
    const value=sampleBilinear(rgba,width,height,x,y)
    pixels[(row+top)*SIDE+col+left]=value
    sum+=value;squares+=value*value
  }
  const count=fittedW*fittedH
  const mean=sum/count
  const std=Math.sqrt(Math.max(0,squares/count-mean*mean))
  if(std<MIN_CONTRAST_STD)return Object.freeze({
    schema:ART_PHASH_V1,phash64:null,quality:'low_information',
    reason:'flat_or_transparent_image',certified_authentic:false,
    unique_fingerprint:false,
  })
  const horizontal=new Float64Array(SIDE*FREQ)
  for(let row=0;row<SIDE;row++)for(let u=0;u<FREQ;u++){
    let sum=0
    for(let x=0;x<SIDE;x++)sum+=(pixels[row*SIDE+x]-128)*COS[u][x]
    horizontal[row*FREQ+u]=sum
  }
  const dct=new Float64Array(FREQ*FREQ)
  for(let v=0;v<FREQ;v++)for(let u=0;u<FREQ;u++){
    let sum=0
    for(let y=0;y<SIDE;y++)sum+=horizontal[y*FREQ+u]*COS[v][y]
    dct[v*FREQ+u]=sum
  }
  const ac=Array.from(dct.slice(1)).sort((a,b)=>a-b)
  const median=ac[Math.floor(ac.length/2)]
  let bits=0n
  for(let i=0;i<dct.length;i++){
    bits<<=1n
    if(i>0 && dct[i]>median)bits|=1n
  }
  return Object.freeze({
    schema:ART_PHASH_V1,phash64:bits.toString(16).padStart(16,'0'),
    quality:'candidate_only',source:'decoded_rgba_pixels',
    certified_authentic:false,unique_fingerprint:false,
  })
}

/** Deterministic bounded in-memory search; never a fraud/ownership verdict. */
export function rankArtPHashCandidatesV1(query,referenceItems,{threshold=8,limit=10}={}) {
  if(typeof query!=='string'||!PHASH.test(query)||
      !Array.isArray(referenceItems)||referenceItems.length>MAX_CANDIDATES||
      !Number.isInteger(threshold)||threshold<0||threshold>16||
      !Number.isInteger(limit)||limit<1||limit>50) {
    throw new TypeError('invalid_visual_candidate_search')
  }
  const entries=referenceItems.map(item=>{
    if(!item||typeof item.reference!=='string'||!REF.test(item.reference)||
        typeof item.phash64!=='string'||!PHASH.test(item.phash64)) {
      throw new TypeError('invalid_visual_candidate_reference')
    }
    const r=compareVisualHash64V1(query,item.phash64,threshold)
    return {reference:item.reference,phash64:item.phash64,distance:r.distance,
      candidate_similarity:r.candidate_similarity}
  })
  const candidates=entries.filter(x=>x.candidate_similarity)
    .sort((a,b)=>a.distance-b.distance||a.reference.localeCompare(b.reference))
    .slice(0,limit)
  return Object.freeze({
    schema:ART_PHASH_V1,threshold,candidates,matches_are_proof:false,
    disposition:'human_review_required',
  })
}
