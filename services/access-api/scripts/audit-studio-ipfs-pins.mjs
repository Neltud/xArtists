#!/usr/bin/env node
/**
 * READ ONLY operator proof: Pinata pin list + independent self-hosted Kubo
 * recursive pin status + two full HTTP gateway SHA-256 readbacks.
 * No automatic mint, upload, repin, payment or public API.
 *
 * Usage: npm run audit:studio:ipfs -- /private/path/public-media-manifest.json
 */
import {readFile,stat} from 'node:fs/promises'
import {auditStudioIpfsPinProviders} from '../src/ipfsPinAudit.mjs'

try{
  const path=process.argv[2]
  if(!path||process.argv.length!==3)throw Error('invalid_args')
  const info=await stat(path)
  if(!info.isFile()||info.size<2||info.size>32768)throw Error('invalid_manifest')
  const manifest=JSON.parse(await readFile(path,'utf8'))
  const result=await auditStudioIpfsPinProviders(manifest)
  process.stdout.write(JSON.stringify(result,null,2)+'\n')
  if(!result.ok)process.exitCode=1
}catch{
  // Never echo local manifest path, secret, provider API payload or CID.
  process.stdout.write(JSON.stringify({
    ok:false,reason:'pin_audit_not_configured_or_failed',
    twoPinSystemsReported:false,gatewayByteReadbackVerified:false,
    independentPinProvidersVerified:false,independentBackupsVerified:false,
    restoreTestVerified:false,nftMintVerified:false,
  },null,2)+'\n')
  process.exitCode=1
}
