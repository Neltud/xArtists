import {test} from 'node:test'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {mkdtemp,mkdir,writeFile,rm,symlink} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {verifyRecoveredIpfsMedia} from '../src/ipfsRestoreIntegrity.mjs'

const cid='bafy'+'a'.repeat(52)
const original=Buffer.from('xArtists recovered media integrity; fixture, not an actual IPFS pin')
const sha=bytes=>createHash('sha256').update(bytes).digest('hex')
const asset={
  mediaUri:'ipfs://'+cid+'/recto.png',
  sha256:sha(original),
  bytes:original.length,
}
const manifest={assets:[asset]}

async function prepared(t,bytes=original){
  const root=await mkdtemp(join(tmpdir(),'xartists-ipfs-recovery-'))
  t.after(async()=>{await rm(root,{recursive:true,force:true})})
  const dir=join(root,cid)
  await mkdir(dir)
  await writeFile(join(dir,'recto.png'),bytes)
  return {root,dir}
}

test('byte-exact recovery returns only limited offline integrity, never backup certification',async t=>{
  const {root}=await prepared(t)
  const result=await verifyRecoveredIpfsMedia(manifest,root)
  assert.equal(result.ok,true)
  assert.equal(result.recoveredByteIntegrityVerified,true)
  assert.equal(result.checkedAssets,1)
  assert.equal(result.checks[0].reason,'sha256_length_match')
  assert.match(result.manifestDigest,/^[a-f0-9]{64}$/)
  for(const key of ['independentBackupVerified','backupSourceAttested',
    'independentStorageVerified','recoveryDrillVerified','nftMintVerified'])
    assert.equal(result[key],false)
  const serialized=JSON.stringify(result)
  assert.equal(serialized.includes(cid),false)
  assert.equal(serialized.includes(root),false)
  assert.equal(serialized.includes('recto.png'),false)
})

test('changed content of equal length and missing media fail closed',async t=>{
  const mutated=Buffer.from(original)
  mutated[mutated.length-1]^=1
  const {root,dir}=await prepared(t,mutated)
  const changed=await verifyRecoveredIpfsMedia(manifest,root)
  assert.equal(changed.ok,false)
  assert.equal(changed.checks[0].reason,'recovered_bytes_differ')
  await rm(join(dir,'recto.png'))
  const missing=await verifyRecoveredIpfsMedia(manifest,root)
  assert.equal(missing.ok,false)
  assert.equal(missing.checks[0].reason,'recovered_file_unavailable_or_untrusted')
})

test('file with unexpected size cannot be claimed recovered',async t=>{
  const {root}=await prepared(t,original.subarray(0,original.length-1))
  const output=await verifyRecoveredIpfsMedia(manifest,root)
  assert.equal(output.ok,false)
  assert.equal(output.checks[0].verified,false)
})

test('file and CID-directory symlinks do not leave the approved recovery root',async t=>{
  const {root,dir}=await prepared(t)
  const outside=await mkdtemp(join(tmpdir(),'xartists-untrusted-'))
  t.after(async()=>{await rm(outside,{recursive:true,force:true})})
  await writeFile(join(outside,'recto.png'),original)
  await rm(join(dir,'recto.png'))
  await symlink(join(outside,'recto.png'),join(dir,'recto.png'))
  const linkedFile=await verifyRecoveredIpfsMedia(manifest,root)
  assert.equal(linkedFile.ok,false)
  await rm(dir,{recursive:true,force:true})
  await symlink(outside,dir,'dir')
  const linkedDir=await verifyRecoveredIpfsMedia(manifest,root)
  assert.equal(linkedDir.ok,false)
})

test('invalid manifest, traversal, repeated assets and oversized files reject before reading',async t=>{
  const {root}=await prepared(t)
  for(const input of [
    {assets:[]},
    {assets:[{...asset,mediaUri:'ipfs://'+cid+'/../secret'}]},
    {assets:[{...asset,mediaUri:'https://internal.local/private'}]},
    {assets:[{...asset,bytes:48*1024*1024+1}]},
    {assets:[asset,asset]},
    {assets:[{...asset,sha256:'bad'}]},
  ])await assert.rejects(()=>verifyRecoveredIpfsMedia(input,root))
  await assert.rejects(()=>verifyRecoveredIpfsMedia(manifest,''),/recovery_directory_required/)
})

test('a bare-root IPFS CID maps to an explicit recovered root blob',async t=>{
  const {root,dir}=await prepared(t)
  await writeFile(join(dir,'__ipfs_root_blob__'),original)
  const bare={assets:[{...asset,mediaUri:'ipfs://'+cid}]}
  const result=await verifyRecoveredIpfsMedia(bare,root)
  assert.equal(result.ok,true)
})

test('mixed recovered assets require ALL hashes to pass',async t=>{
  const {root,dir}=await prepared(t)
  const second=Buffer.from('artwork metadata fixture')
  await writeFile(join(dir,'metadata.json'),second)
  const mixed={assets:[
    asset,
    {mediaUri:'ipfs://'+cid+'/metadata.json',sha256:sha(second),bytes:second.length},
  ]}
  assert.equal((await verifyRecoveredIpfsMedia(mixed,root)).ok,true)
  const broken={assets:[
    asset,
    {...mixed.assets[1],sha256:'0'.repeat(64)},
  ]}
  const output=await verifyRecoveredIpfsMedia(broken,root)
  assert.equal(output.ok,false)
  assert.equal(output.checks[0].verified,true)
  assert.equal(output.checks[1].verified,false)
})
