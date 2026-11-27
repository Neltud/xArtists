/** Persistent, one-use challenges across Neon instances. No raw signature storage. */
export function createChallengeStore(pool){
 return {
  async ready(){
   const r=await pool.query("SELECT to_regclass('public.xartists_studio_challenges') IS NOT NULL AS ready")
   return r.rows[0]?.ready===true
  },
  async issue({nonce,address,message,expiresAt}){
   const c=await pool.connect()
   try{
    await c.query('BEGIN')
    await c.query("SELECT pg_advisory_xact_lock(hashtext('xartists-studio-challenges-v1'))")
    const r=await c.query("SELECT count(*)::int AS total,count(*) FILTER (WHERE wallet=$1)::int AS wallet FROM public.xartists_studio_challenges WHERE created_at>now()-interval '24 hours'",[address])
    if(Number(r.rows[0].total)>=300||Number(r.rows[0].wallet)>=12)throw Object.assign(Error('studio_challenge_quota_reached'),{statusCode:429})
    await c.query('INSERT INTO public.xartists_studio_challenges(nonce,wallet,message,expires_at) VALUES($1,$2,$3,$4)',[nonce,address,message,expiresAt])
    await c.query('COMMIT')
   }catch(e){await c.query('ROLLBACK').catch(()=>{});throw e}finally{c.release()}
  },
  async consume({nonce,address,message}){
   const r=await pool.query('UPDATE public.xartists_studio_challenges SET used_at=now() WHERE nonce=$1 AND wallet=$2 AND message=$3 AND used_at IS NULL AND expires_at>now() RETURNING nonce',[nonce,address,message])
   return r.rowCount===1
  }
 }
}
