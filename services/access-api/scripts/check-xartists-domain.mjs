#!/usr/bin/env node
/** Public read-only RDAP and DNS audit for xartists.art. No DNS changes. */
import {auditXartistsDomain} from '../src/domainReadiness.mjs'
const proof=await auditXartistsDomain()
process.stdout.write(JSON.stringify(proof,null,2)+'\n')
// This is an operator audit: report NO-GO as evidence rather than claiming
// an outbound mail proof. No incidental failure of unrelated public routes.
if(!proof.audit_available)process.exitCode=2
