/**
 * xArtists Art-ID PNG -> RGBA LAB decoder, NOT a general-purpose image parser.
 *
 * Exact subset: 8-bit truecolor RGB (2) / RGBA (6), non-interlaced,
 * no palette, no tRNS key transparency, no color-profile management.
 * CRC, chunk order, size limits and decompressed byte count checked.
 * Offline only, NO route or upload; pHash is NOT authenticity evidence.
 *
 * Production uploads require a resource-limited isolated worker process,
 * strict file/MIME verification and a reviewed image-decoding library.
 */
import { inflateSync } from 'node:zlib'
import { createHash } from 'node:crypto'

const PNG_SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
const MAX_BYTES = 16 * 1024 * 1024
const MAX_PIXELS = 4_000_000
const MAX_DIM = 4096
const MAX_CHUNKS = 1024

const CRC_TABLE = Uint32Array.from({length:256},(_,idx)=>{
  let crc=idx
  for(let j=0;j<8;j++)crc=(crc>>>1)^(0xedb88320 & -(crc&1))
  return crc>>>0
})
function crc32(buffer) {
  let crc=0xffffffff
  for(let i=0;i<buffer.length;i++) crc=CRC_TABLE[(crc^buffer[i])&255]^(crc>>>8)
  return (crc^0xffffffff)>>>0
}

function readChunk(buf,offset) {
  if(!Number.isSafeInteger(offset)||offset+12>buf.length)throw new RangeError('png_truncated')
  const len=buf.readUInt32BE(offset)
  if(len>MAX_BYTES)throw new RangeError('png_chunk_too_large')
  const typeBytes=buf.subarray(offset+4,offset+8)
  const type=typeBytes.toString('ascii')
  if(!/^[A-Za-z]{4}$/.test(type)||type[2]!==type[2].toUpperCase())
    throw new TypeError('png_chunk_type_invalid')
  const start=offset+8,end=start+len
  if(end+4>buf.length)throw new RangeError('png_truncated')
  const given=buf.readUInt32BE(end)
  const expected=crc32(buf.subarray(offset+4,end))
  if(given!==expected)throw new TypeError('png_crc_mismatch')
  return {type,data:buf.subarray(start,end),next:end+4}
}

function paeth(a,b,c) {
  const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c)
  if(pa<=pb&&pa<=pc)return a
  if(pb<=pc)return b
  return c
}
function unfilter(row,prev,bpp) {
  const out=Buffer.alloc(row.length-1)
  for(let i=0;i<out.length;i++){
    const x=row[i+1],a=i>=bpp?out[i-bpp]:0,b=prev?prev[i]:0
    const c=prev&&i>=bpp?prev[i-bpp]:0
    switch(row[0]){
      case 0:out[i]=x;break
      case 1:out[i]=(x+a)&255;break
      case 2:out[i]=(x+b)&255;break
      case 3:out[i]=(x+((a+b)>>>1))&255;break
      case 4:out[i]=(x+paeth(a,b,c))&255;break
      default:throw new TypeError('png_unsupported_filter')
    }
  }
  return out
}

export function decodePngToRgbaV1(bytes) {
  if(!(bytes instanceof Uint8Array)||bytes.byteLength<45||bytes.byteLength>MAX_BYTES)
    throw new RangeError('png_bytes_invalid_or_too_large')
  const buf=Buffer.from(bytes)
  if(!buf.subarray(0,8).equals(PNG_SIG))throw new TypeError('not_a_png')

  let offset=8,width=0,height=0,colorType=0,seenIhdr=false,seenIdat=false
  let idatClosed=false,seenIend=false,chunkCount=0
  const idats=[]
  while(offset<buf.length) {
    if(++chunkCount>MAX_CHUNKS)throw new RangeError('png_too_many_chunks')
    const {type,data,next}=readChunk(buf,offset)
    offset=next
    if(!seenIhdr&&type!=='IHDR')throw new TypeError('png_ihdr_must_be_first')
    if(type==='IHDR'){
      if(seenIhdr||data.length!==13)throw new TypeError('png_duplicate_or_bad_ihdr')
      seenIhdr=true
      width=data.readUInt32BE(0);height=data.readUInt32BE(4)
      const depth=data[8];colorType=data[9]
      if(depth!==8)throw new TypeError('png_only_8bit')
      if(colorType!==2&&colorType!==6)throw new TypeError('png_only_rgb_or_rgba')
      if(data[10]!==0||data[11]!==0)throw new TypeError('png_unsupported_compression_or_filter')
      if(data[12]!==0)throw new TypeError('png_no_interlace')
      if(width<1||height<1||width>MAX_DIM||height>MAX_DIM||
         width*height>MAX_PIXELS)throw new RangeError('png_dimensions_out_of_bounds')
    }else if(type==='IDAT'){
      if(idatClosed||seenIend)throw new TypeError('png_noncontiguous_idat')
      seenIdat=true
      if(data.length>0)idats.push(data)
    }else if(type==='IEND'){
      if(data.length!==0||!seenIdat||seenIend||offset!==buf.length)
        throw new TypeError('png_invalid_iend_or_trailing_bytes')
      seenIend=true
      break
    }else{
      if(seenIdat)idatClosed=true
      // PLTE may be legal in some RGB files; this intentionally strict
      // lab subset does not implement its semantics.
      if(type[0]===type[0].toUpperCase())
        throw new TypeError('png_unsupported_critical_chunk')
      if(type==='tRNS')throw new TypeError('png_unhandled_transparency')
      // Ignore only well-formed ancillary chunks with valid CRC. Color
      // profiles are not interpreted; do not certify visual identity.
    }
  }
  if(!seenIhdr||!seenIdat||!seenIend||!idats.length)
    throw new TypeError('png_incomplete')
  const channels=colorType===6?4:3
  const stride=width*channels
  const expected=height*(1+stride)
  let raw
  try {
    // Stops decompression bombs even without a Content-Length hint.
    raw=inflateSync(Buffer.concat(idats),{maxOutputLength:expected+1})
  }catch{
    throw new TypeError('png_inflate_failed')
  }
  if(raw.length!==expected)throw new TypeError('png_unexpected_decoded_size')
  const rgba=new Uint8Array(width*height*4)
  let prev=null,offsetRaw=0
  for(let y=0;y<height;y++){
    const row=raw.subarray(offsetRaw,offsetRaw+1+stride)
    offsetRaw+=1+stride
    const reconstructed=unfilter(row,prev,channels)
    prev=reconstructed
    for(let x=0;x<width;x++){
      const src=x*channels,dst=(y*width+x)*4
      rgba[dst]=reconstructed[src]
      rgba[dst+1]=reconstructed[src+1]
      rgba[dst+2]=reconstructed[src+2]
      rgba[dst+3]=channels===4?reconstructed[src+3]:255
    }
  }
  return Object.freeze({
    width,height,rgba,
    media_sha256:createHash('sha256').update(buf).digest('hex'),
    decoder:'xartists.png-rgba.v1',
    certified_authentic:false,
  })
}

/** Offline PNG -> phash *candidate*, never an authenticity verdict. */
export function phashFromPngBytesV1(bytes,computeArtPHash64V1) {
  if(typeof computeArtPHash64V1!=='function')
    throw new TypeError('computeArtPHash64V1_required')
  const frame=decodePngToRgbaV1(bytes)
  const hash=computeArtPHash64V1({
    width:frame.width,height:frame.height,rgba:frame.rgba,
  })
  return Object.freeze({
    ...hash,media_sha256:frame.media_sha256,
    width:frame.width,height:frame.height,
    disposition:'human_review_required',certified_authentic:false,
  })
}
