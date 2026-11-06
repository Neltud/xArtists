#!/usr/bin/env node
/** Safe operational readiness check. No uploads, transactions, SQL DDL or secrets in output. */
import {checkStudioIpfsReadiness} from '../src/studioPreflight.mjs'

const result=await checkStudioIpfsReadiness()
process.stdout.write(JSON.stringify(result,null,2)+'\n')
if(!result.ok)process.exitCode=1
