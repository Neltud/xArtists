/**
 * Private, operator-initiated original media archive.
 * Input is a local copy explicitly selected from a creator's Drive, NEVER an
 * arbitrary Drive ID/URL, public upload, automatic pin, or proof of rights.
 *
 * Keep this archive on a persistent private server volume, outside git, Vite,
 * Docker Kubo's public /export, and every web root.
 */
import {createHash,randomUUID} from 'node:crypto'
import {constants} from 'node:fs'
import {lstat,mkdir,open,realpath,link,unlink} from 'node:fs/promises'
import {join,resolve,isAbsolute,extname} from 'node:path'
import {fileURLToPath} from 'node:url'

const MAX_IMAGE=16*1024*1024
const MAX_VIDEO=48*1024*1024
const SAFE_SHA=/^[a-f0-9]{64}$/
const fail=code=>Object.assign(new Error(code),{code})

function detectMedia(bytes,name){
  const suffix=extname(name).toLowerCase()
  if((suffix==='.png')&&bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))
    return {mime:'image/png',extension:'png',maximum:MAX_IMAGE}
  if(['.jpg','.jpeg'].includes(suffix)&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255)
    return {mime:'image/jpeg',extension:'jpg',maximum:MAX_IMAGE}
  if(suffix==='.webp'&&bytes.toString('ascii',0,4)==='RIFF'&&
    bytes.toString('ascii',8,12)==='WEBP')
    return {mime:'image/webp',extension:'webp',maximum:MAX_IMAGE}
  if(suffix==='.mp4'&&bytes.toString('ascii',4,8)==='ftyp')
    return {mime:'video/mp4',extension:'mp4',maximum:MAX_VIDEO}
  throw fail('unsupported_original_media')
}

async function privateDirectory(path,create=false){
  if(create)await mkdir(path,{mode:0o700}).catch(e=>{
    if(e?.code!=='EEXIST')throw e
  })
  const s=await lstat(path)
  if(!s.isDirectory()||s.isSymbolicLink()||(s.mode&0o077)!==0)
    throw fail('private_archive_directory_required')
  if(await realpath(path)!==resolve(path))
    throw fail('private_archive_symlink_path_forbidden')
}

async function verifyExisting(path,expected,size){
  const info=await lstat(path)
  if(!info.isFile()||info.isSymbolicLink()||info.size!==size||(info.mode&0o077)!==0)
    throw fail('archive_conflict')
  const handle=await open(path,constants.O_RDONLY|constants.O_NOFOLLOW)
  try{
    const raw=await handle.readFile()
    if(raw.length!==size||createHash('sha256').update(raw).digest('hex')!==expected)
      throw fail('archive_conflict')
  }finally{await handle.close()}
}

/**
 * Archives bytes only. No IPFS pin, public URL, mint, payment, or wallet action.
 * An operator declaration of rights is not independent verification of rights.
 */
export async function archiveDriveOriginal({
  sourcePath,archiveRoot,operatorApproved=false,rightsDeclared=false,expectedSha256=null,
}={}){
  if(operatorApproved!==true||rightsDeclared!==true)
    throw fail('explicit_operator_and_rights_declaration_required')
  if(typeof sourcePath!=='string'||typeof archiveRoot!=='string'||
    !isAbsolute(sourcePath)||!isAbsolute(archiveRoot)||sourcePath===archiveRoot)
    throw fail('absolute_source_and_archive_paths_required')
  if(expectedSha256!==null&&
    (typeof expectedSha256!=='string'||!SAFE_SHA.test(expectedSha256)))
    throw fail('invalid_expected_sha256')
  await privateDirectory(archiveRoot)
  const srcStat=await lstat(sourcePath)
  if(!srcStat.isFile()||srcStat.isSymbolicLink()||srcStat.size<12||srcStat.size>MAX_VIDEO)
    throw fail('invalid_source_file')
  if(await realpath(sourcePath)!==resolve(sourcePath))
    throw fail('source_symlink_path_forbidden')
  const handle=await open(sourcePath,constants.O_RDONLY|constants.O_NOFOLLOW)
  let bytes
  try{
    const before=await handle.stat()
    if(!before.isFile()||before.size!==srcStat.size)throw fail('source_changed')
    bytes=await handle.readFile()
    const after=await handle.stat()
    if(!after.isFile()||after.size!==before.size||bytes.length!==before.size||
      after.mtimeMs!==before.mtimeMs||after.ino!==before.ino)
      throw fail('source_changed')
  }finally{await handle.close()}
  const media=detectMedia(bytes,sourcePath)
  if(bytes.length>media.maximum)throw fail('original_media_too_large')
  const sha256=createHash('sha256').update(bytes).digest('hex')
  if(expectedSha256!==null&&sha256!==expectedSha256)
    throw fail('original_sha256_mismatch')
  const first=join(archiveRoot,sha256.slice(0,2))
  const leaf=join(first,sha256)
  await privateDirectory(first,true)
  await privateDirectory(leaf,true)
  const target=join(leaf,'original.'+media.extension)
  const tmp=join(leaf,'.stage-'+randomUUID())
  let staged=false
  try{
    const out=await open(tmp,constants.O_WRONLY|constants.O_CREAT|constants.O_EXCL|constants.O_NOFOLLOW,0o600)
    staged=true
    try{await out.writeFile(bytes);await out.sync()}finally{await out.close()}
    // Hardlink is atomic and never overwrites an already archived original.
    try{await link(tmp,target)}
    catch(e){if(e?.code!=='EEXIST')throw e}
    await verifyExisting(target,sha256,bytes.length)
  }finally{
    if(staged)await unlink(tmp).catch(()=>{})
  }
  return {
    schema:'xartists.private-original-archive.v1',
    sha256,bytes:bytes.length,mime:media.mime,
    relativePath:sha256.slice(0,2)+'/'+sha256+'/original.'+media.extension,
    source:'operator_selected_local_copy',
    storage:'private_server_volume',
    rightsVerification:'declaration_only',
    ipfsPublished:false,minted:false,commerciallyAvailable:false,
  }
}

async function cli(){
  const args=process.argv.slice(2)
  if(args.length!==4||args[2]!=='--approve-private-archive'||args[3]!=='--rights-declared')
    throw fail('usage: node archive-drive-original.mjs ABS_SOURCE ABS_PRIVATE_ROOT --approve-private-archive --rights-declared')
  const result=await archiveDriveOriginal({
    sourcePath:args[0],archiveRoot:args[1],operatorApproved:true,rightsDeclared:true,
  })
  process.stdout.write(JSON.stringify(result)+'\n')
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  cli().catch(()=>{
    // Avoid echoing absolute paths, Drive IDs, or operating-system error details.
    process.stderr.write('private_original_archive_rejected\n')
    process.exitCode=1
  })
}
