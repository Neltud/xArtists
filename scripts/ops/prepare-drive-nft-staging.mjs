/**
 * PRIVATE/local-only Google Drive artwork metadata -> paper NFT staging.
 * No Drive API calls, downloads, network, IPFS, hashing, signatures, or mint.
 * Opaque Drive IDs/URLs/tokens may be input but are NEVER emitted.
 */
import {readFile,writeFile} from 'node:fs/promises'
import {pathToFileURL} from 'node:url'

const MAX_COUNT=200
const MAX_BYTES=16*1024*1024
const TYPES=new Map([
 ['image/png',['.png']],['image/jpeg',['.jpg','.jpeg']],['image/webp',['.webp']],
])
const fail=code=>{throw new Error(code)}
const own=(obj,key)=>Object.prototype.hasOwnProperty.call(obj,key)

/**
 * Only operator-selected metadata. Never assume names prove creator ownership.
 * Every generated record remains unverified until real bytes + signed consent.
 */
export function stageDriveArtworkMetadata(source) {
 const records=Array.isArray(source)?source:source?.files
 if(!Array.isArray(records)||records.length>MAX_COUNT)fail('drive_staging_invalid_input')
 const candidates=[],rejected=[]
 const names=new Map()
 records.forEach((record,index)=>{
   const reject=reason=>{rejected.push({inputIndex:index+1,reason})}
   if(!record||typeof record!=='object'||Array.isArray(record))return reject('invalid_record')
   // Google Drive may use name/mimeType/size; connected search uses title/mime_type.
   const name=record.name??record.title
   const mime=record.mimeType??record.mime_type
   const size=record.size
   if(typeof name!=='string'||name.length<5||name.length>180||
      /[\/\\\u0000-\u001f\u007f]/.test(name)||/^(?:https?:|ipfs:)/i.test(name))return reject('invalid_filename')
   if(typeof mime!=='string'||!TYPES.has(mime))return reject('unsupported_media')
   const suffix=name.slice(name.lastIndexOf('.')).toLowerCase()
   if(!TYPES.get(mime).includes(suffix))return reject('mime_extension_mismatch')
   if((typeof size!=='string'&&typeof size!=='number')||
      !/^[0-9]{1,9}$/.test(String(size)))return reject('invalid_size')
   const bytes=Number(size)
   if(!Number.isSafeInteger(bytes)||bytes<1||bytes>MAX_BYTES)return reject('too_large')
   const key=name.normalize('NFC').toLowerCase()
   const occurrence=(names.get(key)??0)+1
   names.set(key,occurrence)
   candidates.push({
     stagingId:'draft-'+String(index+1).padStart(3,'0'),
     filename:name.normalize('NFC'),
     mediaType:mime,bytes,
     source:'google_drive_metadata_only',
     possibleDuplicate:occurrence>1,
     // Do not copy any Drive file IDs, private URLs, OAuth tokens, hashes or provider metadata.
     rightsDeclared:false,rightsVerified:false,
     contentSha256:null,mediaCid:null,metadataCid:null,
     image:null,animation_url:null,
     minted:false,mintAllowed:false,
     status:'PAPER_METADATA_DRAFT',
   })
 })
 return Object.freeze({
   schema:'xartists.drive_media_staging.v1',
   scope:'local_private_review_only',
   status:'DRAFT_UNMINTED',
   importedCount:candidates.length,rejectedCount:rejected.length,
   candidates,rejected,
   release:{ipfsPinned:false,metadataVerified:false,rightsVerified:false,
     mintEnabled:false,distributorEnabled:false},
 })
}

async function runCli(args){
 if(args.length!==2)fail('usage: node prepare-drive-nft-staging.mjs <metadata.json> <private-output.json>')
 const [input,output]=args
 if(!input||!output||input===output||!output.endsWith('.json'))fail('invalid_paths')
 const stat=await readFile(input,{encoding:'utf8'})
 if(stat.length>512000)fail('metadata_input_too_large')
 let value
 try{value=JSON.parse(stat)}catch{fail('metadata_json_invalid')}
 const staged=stageDriveArtworkMetadata(value)
 // Exclusive create: avoid overwriting an existing manifest, user permissions only.
 await writeFile(output,JSON.stringify(staged,null,2)+'\n',{encoding:'utf8',mode:0o600,flag:'wx'})
 console.log('STAGING_ONLY candidates='+staged.importedCount+' rejected='+staged.rejectedCount+
   ' private_output_saved_no_upload_no_mint')
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 runCli(process.argv.slice(2)).catch(e=>{
   console.error('DRIVE_STAGING_FAILED '+(e?.message||'unknown'))
   process.exitCode=1
 })
}
