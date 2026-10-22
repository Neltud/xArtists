import {renderToString} from 'react-dom/server'
import {MemoryRouter} from 'react-router-dom'
import {WalletProvider} from '../src/context/WalletContext'
import {I18nProvider} from '../src/i18n/I18nContext'
import {ExperienceProvider} from '../src/experience/state'
import {Home,GroupPage,Directory,NotFound} from '../src/experience/Pages'
import Shell from '../src/experience/Shell'
import {groups} from '../src/experience/modules'
import type {Lang} from '../src/i18n/types'
import {text} from '../src/experience/locale'
import assert from 'node:assert/strict'
const languages:Lang[]=['fr','en','es','de','ru','uk','zh','ar']
let checked=0
const warn=console.error;console.error=(...args)=>{if(String(args[0]).includes('useLayoutEffect does nothing on the server'))return;warn(...args)}
for(const lang of languages){for(const [path,view] of [['/',<Home/>],...groups.map(g=>['/'+g,<GroupPage group={g}/>]),['/directory',<Directory/>],['/missing',<NotFound/>]] as const){const html=renderToString(<MemoryRouter initialEntries={[path]}><I18nProvider initialLang={lang}><WalletProvider><ExperienceProvider><Shell>{view}</Shell></ExperienceProvider></WalletProvider></I18nProvider></MemoryRouter>);assert(html.length>1000,`${lang} ${path}: empty render`);assert(html.includes(text(lang,'connect')),`${lang} ${path}: translated wallet action missing`);assert(!/\[object Object\]/.test(html),`${lang} ${path}: invalid displayed object`);if(path==='/')assert(html.includes(text(lang,'heroTop')),`${lang}: hero missing`);checked++}}
console.log(`${checked} server render checks passed across ${languages.length} locales.`)
