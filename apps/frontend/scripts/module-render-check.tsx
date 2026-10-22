import {renderToString} from 'react-dom/server'
import {MemoryRouter} from 'react-router-dom'
import {WalletProvider} from '../src/context/WalletContext'
import {MultiversXProvider} from '../src/context/MultiversXContext'
import {ToastProvider} from '../src/components/ui/Toast'
import {I18nProvider} from '../src/i18n/I18nContext'
import {ExperienceProvider} from '../src/experience/state'
import {modules} from '../src/experience/modules'
import fs from 'node:fs'
import type {Lang} from '../src/i18n/types'
const results:any[]=[]
const warn=console.error;console.error=(...args)=>{if(String(args[0]).includes('useLayoutEffect does nothing on the server'))return;warn(...args)}
const htmlByModule:Record<string,Record<string,string>>={}
for(const m of modules){for(const lang of ['fr','en','es','de','ru','uk','zh','ar'] as Lang[]){try{const {default:Page}=await m.load();const html=renderToString(<MemoryRouter initialEntries={[m.path]}><I18nProvider initialLang={lang}><WalletProvider><MultiversXProvider><ToastProvider><ExperienceProvider><Page/></ExperienceProvider></ToastProvider></MultiversXProvider></WalletProvider></I18nProvider></MemoryRouter>);(htmlByModule[m.id]??={})[lang]=html;results.push({id:m.id,lang,status:'passed',bytes:html.length})}catch(e:any){results.push({id:m.id,lang,status:'failed',error:e.message})}}}
fs.writeFileSync('.sites-runtime/module-render-results.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results.filter(r=>r.status==='failed'),null,2));console.log(results.filter(r=>r.status==='passed').length+'/'+results.length+' module server renders passed.');if(results.some(r=>r.status==='failed'))process.exitCode=1

const decode=(s:string)=>s.replace(/&amp;/g,'&').replace(/&#x27;|&#39;/g,"'").replace(/&quot;/g,'"').replace(/&lt;/g,'<').replace(/&gt;/g,'>')
const texts=(s:string)=>Array.from(s.matchAll(/>([^<>]+)</g),m=>decode(m[1]).trim()).filter(s=>s.length>8&&/[A-Za-zÀ-ÿ]{4}/.test(s)&&!/^https?:|erd1|data:|[A-Z_]{5}/.test(s))
const same:Record<string,string[]>={}
for(const [id,langs] of Object.entries(htmlByModule)){if(!langs.fr||!langs.zh)continue;const zh=new Set(texts(langs.zh));for(const s of texts(langs.fr)){if(zh.has(s))(same[s]??=[]).push(id)}}
fs.writeFileSync('.sites-runtime/unchanged-display-strings.json',JSON.stringify(same,null,2));console.log(Object.keys(same).length+' unchanged French/Chinese display values to inspect.')
