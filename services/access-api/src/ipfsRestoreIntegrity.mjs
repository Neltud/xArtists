/**
 * Offline, read-only byte integrity check on files recovered from an IPFS
 * backup or operator-selected recovery source (#402).
 *
 * This verifies bytes against a pre-existing original-media manifest.
 * It DOES NOT prove where the files came from, that a backup was independent,
 * a disaster recovery drill happened, permanent pinning, or a mainnet mint.
 * Operator selects a local recovery directory; never accept paths via public API.
 *
 * Expected layout for each ipfs://CID/name.ext: ROOT/CID/name.ext.
 * For ipfs://CID (bare-file root): ROOT/CID/__ipfs_root_blob__.
 */
import {createHash} from 'node:crypto'
import {constants} from 'node:fs'
import {open, lstat, realpath} from 'node:fs/promises'
import {resolve, join, sep} from 'node:path'
import {parseReadbackManifest} from './ipfsReadback.mjs'

const SIZE_LIMIT=48*1024*1024
const ROOT_NAME='__ipfs_root_blob__'
const hex=bytes=>createHash('sha256').update(bytes).digest('hex')

async function checkRecoveredAsset(root, asset, index){
  const parts=asset.path.split('/')
  const cid=parts[0]
  const filename=parts[1]||ROOT_NAME
  let file
  try{
    const cidPath=join(root,cid)
    const directory=await lstat(cidPath)
    if(!directory.isDirectory()||directory.isSymbolicLink())
      throw Error('untrusted_directory')
    const target=join(cidPath,filename)
    const entry=await lstat(target)
    if(!entry.isFile()||entry.isSymbolicLink()||entry.size!==asset.bytes)
      throw Error('file_not_regular_or_size_mismatch')
    const canonical=await realpath(target)
    if(!canonical.startsWith(root+sep))throw Error('restore_path_escaped_root')
    file=await open(target,constants.O_RDONLY|constants.O_NOFOLLOW)
    const opened=await file.stat()
    if(!opened.isFile()||opened.size!==asset.bytes)
      throw Error('file_changed_during_check')
    const hash=createHash('sha256')
    let observed=0
    for await (const chunk of file.createReadStream({highWaterMark:65536,autoClose:false})){
      observed+=chunk.byteLength
      if(observed>asset.bytes||observed>SIZE_LIMIT)
        throw Error('file_over_limit')
      hash.update(chunk)
    }
    const verified=observed===asset.bytes&&hash.digest('hex')===asset.sha256
    return {
      asset:index+1,bytes:asset.bytes,verified,
      reason:verified?'sha256_length_match':'recovered_bytes_differ',
    }
  }catch{
    return {asset:index+1,bytes:asset.bytes,verified:false,
      reason:'recovered_file_unavailable_or_untrusted'}
  }finally{
    if(file)await file.close().catch(()=>{})
  }
}

export async function verifyRecoveredIpfsMedia(manifest,recoveryRoot){
  // Parse all CID, SHA, sizes and budget constraints before touching disk.
  const assets=parseReadbackManifest(manifest)
  if(new Set(assets.map(a=>a.path)).size!==assets.length)
    throw Error('duplicate_media_uri')
  if(typeof recoveryRoot!=='string'||!recoveryRoot.trim())
    throw Error('recovery_directory_required')
  const rootPath=resolve(recoveryRoot)
  const rootEntry=await lstat(rootPath)
  if(!rootEntry.isDirectory()||rootEntry.isSymbolicLink())
    throw Error('recovery_root_not_a_real_directory')
  const root=await realpath(rootPath)
  // No file contents, source paths, filenames, CIDs, tokens or provider IDs
  // are ever printed in the evidence report.
  const checks=[]
  for(const [index,asset] of assets.entries())
    checks.push(await checkRecoveredAsset(root,asset,index))
  const matched=checks.every(check=>check.verified)
  return {
    ok:matched,
    recoveredByteIntegrityVerified:matched,
    checkedAssets:checks.length,
    manifestDigest:hex(Buffer.from(JSON.stringify(assets))),
    checks,
    independentBackupVerified:false,
    backupSourceAttested:false,
    independentStorageVerified:false,
    recoveryDrillVerified:false,
    nftMintVerified:false,
    note:'recovered_sha256_does_not_prove_backup_origin_or_independent_storage',
  }
}
