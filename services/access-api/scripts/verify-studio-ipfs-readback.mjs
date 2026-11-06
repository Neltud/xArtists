#!/usr/bin/env node
/**
 * Operator-only, READ-ONLY IPFS integrity check for already-published assets.
 * Usage: npm run verify:studio:ipfs -- /path/to/verified-public-manifest.json
 * Manifest: { "assets": [{ "mediaUri": "ipfs://CID/name.png",
 *                           "sha256": "<64 lowercase hex>", "bytes": 1234 }] }
 * No Pinata upload, no DB update, no NFT or wallet interaction.
 */
import {readFile,stat} from 'node:fs/promises'
import {verifyIpfsReadbackManifest} from '../src/ipfsReadback.mjs'

try{
  const name=process.argv[2]
  if(!name||process.argv.length!==3)throw Error('invalid_arguments')
  const info=await stat(name)
  if(!info.isFile()||info.size>32768)throw Error('invalid_manifest_file')
  const raw=await readFile(name,'utf8')
  const manifest=JSON.parse(raw)
  const result=await verifyIpfsReadbackManifest(manifest)
  process.stdout.write(JSON.stringify(result,null,2)+'\n')
  if(!result.ok)process.exitCode=1
}catch{
  // Never echo names, file contents, URLs, remote error messages or secrets.
  process.stdout.write(JSON.stringify({ok:false,reason:'manifest_invalid_or_readback_failed',
    independentPinProvidersVerified:false},null,2)+'\n')
  process.exitCode=1
}
