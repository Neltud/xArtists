/** A historic entity roadmap verdict is not evidence of live SC readiness. */
export function isStaleEntityReview(date,now=Date.now(),maxAgeDays=14){
 if(typeof date!=='string'||typeof now!=='number'||!Number.isFinite(now)||
    !Number.isSafeInteger(maxAgeDays)||maxAgeDays<1||maxAgeDays>90)return true
 if(!/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(date))return true
 const stamp=Date.parse(date+'T00:00:00.000Z')
 if(!Number.isFinite(stamp)||new Date(stamp).toISOString().slice(0,10)!==date)return true
 const age=now-stamp
 return age<-(24*60*60*1000)||age>maxAgeDays*24*60*60*1000
}
