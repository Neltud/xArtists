#!/usr/bin/env node
/**
 * READ ONLY: check recovered files against a public-media manifest.
 * Usage: npm run verify:studio:ipfs:restore -- <manifest.json> <recovery-dir>
 * No filesystem writes, IPFS mutation, upload, wallet use, or signing.
 */
import {readFile,stat} from 'node:fs/promises'
import {verifyRecoveredIpfsMedia} from '../src/ipfsRestoreIntegrity.mjs'

try{
  if(process.argv.length!==4)throw Error('invalid_arguments')
  const manifestPath=process.argv[2]
  const recoveryRoot=process.argv[3]
  const info=await stat(manifestPath)
  if(!info.isFile()||info.size<2||info.size>32768)
    throw Error('invalid_manifest_file')
  const input=JSON.parse(await readFile(manifestPath,'utf8'))
  const result=await verifyRecoveredIpfsMedia(input,recoveryRoot)
  process.stdout.write(JSON.stringify(result,null,2)+'\n')
  if(!result.ok)process.exitCode=1
}catch{
  // Secret-free: never echo local paths, IPFS CIDs, filenames or JSON errors.
  process.stdout.write(JSON.stringify({
    ok:false,reason:'restore_media_integrity_not_verified',
    recoveredByteIntegrityVerified:false,
    independentBackupVerified:false,
    backupSourceAttested:false,
    independentStorageVerified:false,
    recoveryDrillVerified:false,
    nftMintVerified:false,
  },null,2)+'\n')
  process.exitCode=1
}
