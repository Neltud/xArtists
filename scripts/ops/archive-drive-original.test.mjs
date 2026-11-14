import test from 'node:test'
import assert from 'node:assert/strict'
import {mkdtemp,mkdir,readFile,stat,writeFile,symlink,chmod,rm} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {createHash} from 'node:crypto'
import {archiveDriveOriginal} from './archive-drive-original.mjs'

const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),Buffer.alloc(64,42)])
async function temp(fn){
  const dir=await mkdtemp(join(tmpdir(),'xa-private-original-'))
  try{
    const vault=join(dir,'vault')
    await mkdir(vault,{mode:0o700})
    return await fn({dir,vault})
  }finally{await rm(dir,{recursive:true,force:true})}
}
test('private archive is content addressed and idempotent, never publishes or mints',async()=>{
  await temp(async({dir,vault})=>{
    const original=join(dir,'drive-original.png')
    await writeFile(original,png)
    const sha=createHash('sha256').update(png).digest('hex')
    const args={sourcePath:original,archiveRoot:vault,
      expectedSha256:sha,operatorApproved:true,rightsDeclared:true}
    const a=await archiveDriveOriginal(args)
    assert.equal(a.sha256,sha)
    assert.equal(a.bytes,png.length)
    assert.equal(a.mime,'image/png')
    assert.equal(a.ipfsPublished,false)
    assert.equal(a.minted,false)
    assert.equal(a.commerciallyAvailable,false)
    assert.equal(a.rightsVerification,'declaration_only')
    assert.equal(a.relativePath,sha.slice(0,2)+'/'+sha+'/original.png')
    assert.deepEqual(await readFile(join(vault,a.relativePath)),png)
    assert.equal((await stat(join(vault,a.relativePath))).mode&0o077,0)
    const b=await archiveDriveOriginal(args)
    assert.deepEqual(a,b)
    assert.deepEqual(await readFile(original),png)
  })
})
test('no rights declaration, explicit operator approval or original bytes => no archive',async()=>{
  await temp(async({dir,vault})=>{
    const original=join(dir,'media.png')
    await writeFile(original,png)
    await assert.rejects(archiveDriveOriginal({sourcePath:original,archiveRoot:vault}),
      /explicit_operator_and_rights_declaration_required/)
    await assert.rejects(archiveDriveOriginal({sourcePath:original,archiveRoot:vault,
      rightsDeclared:true}),/explicit_operator_and_rights_declaration_required/)
    await assert.rejects(archiveDriveOriginal({sourcePath:original,archiveRoot:vault,
      rightsDeclared:true,operatorApproved:true,expectedSha256:'a'.repeat(64)}),
      /original_sha256_mismatch/)
    const invalid=join(dir,'forged.png')
    await writeFile(invalid,Buffer.alloc(100,0))
    await assert.rejects(archiveDriveOriginal({sourcePath:invalid,archiveRoot:vault,
      rightsDeclared:true,operatorApproved:true}),/unsupported_original_media/)
    const s=await stat(vault)
    assert.ok(s.isDirectory())
  })
})
test('reject source and target symlinks and insecure destination permissions',async()=>{
  await temp(async({dir,vault})=>{
    const original=join(dir,'media.png')
    await writeFile(original,png)
    const linked=join(dir,'alias.png')
    await symlink(original,linked)
    await assert.rejects(archiveDriveOriginal({sourcePath:linked,archiveRoot:vault,
      rightsDeclared:true,operatorApproved:true}),/invalid_source_file/)
    const insecure=join(dir,'insecure')
    await mkdir(insecure,{mode:0o755})
    await chmod(insecure,0o755)
    await assert.rejects(archiveDriveOriginal({sourcePath:original,archiveRoot:insecure,
      rightsDeclared:true,operatorApproved:true}),/private_archive_directory_required/)
  })
})
