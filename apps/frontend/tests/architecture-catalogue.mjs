import {readFileSync} from 'node:fs'
import {loadSource} from './load-source.mjs'
export const architecture=loadSource('src/experience/informationArchitecture.ts')
export const catalogue=[...readFileSync(new URL('../src/experience/modules.ts',import.meta.url),'utf8')
 .matchAll(/module\('([^']+)','([^']+)',(\[[^\n]*?\]),'([^']*)','([^']+)'/g)]
 .map(([,id,path,aliases,label,group])=>({id,path,aliases:JSON.parse(aliases.replaceAll("'",'"')),label,group}))
export const navigation=loadSource('src/experience/navigation.ts')
