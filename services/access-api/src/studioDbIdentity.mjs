/** Operator-only, credential-free *endpoint comparison hint*.
 * This fingerprint is NOT a proof of database ownership, backups or a
 * license to run migrations. It excludes usernames, passwords, ports and
 * query strings, and is NEVER returned by the public API.
 */
import {createHash} from 'node:crypto'

export function fingerprintStudioDbEndpoint(raw){
  if(typeof raw!=='string'||raw.length>8192)return null
  try{
    const u=new URL(raw)
    if(u.protocol!=='postgres:'&&u.protocol!=='postgresql:')return null
    // The Neon pooler and direct endpoint may share one database.
    const host=u.hostname.toLowerCase().replace(/-pooler(?=\.)/,'')
    const db=decodeURIComponent(u.pathname.slice(1))
    if(!/^[a-z0-9._-]{1,128}$/i.test(host)||
       !/^[a-z0-9._-]{1,128}$/i.test(db))return null
    return createHash('sha256').update('xartists-studio-db-endpoint-v1:'+host+'/'+db.toLowerCase())
      .digest('hex').slice(0,20)
  }catch{return null}
}
