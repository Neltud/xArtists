import pg from 'pg'
import {createStudioHandler,targetReady} from './handler.mjs'
import {createChallengeStore} from './store.mjs'
let store=null
if(targetReady(process.env)&&process.env.DATABASE_URL){
 const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:true},max:2,connectionTimeoutMillis:4000,idleTimeoutMillis:1000,statement_timeout:5000})
 store=createChallengeStore(pool)
}
export default createStudioHandler({store})
