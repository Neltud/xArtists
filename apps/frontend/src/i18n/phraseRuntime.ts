import type {Lang} from './types'
import templates from './templates.json'
import {createContext,createElement,useContext} from 'react'
const codes:Lang[]=['fr','en','es','de','ru','uk','zh','ar']
const packs=import.meta.glob<Record<string,string[]>>('./phrases/*.json',{eager:true,import:'default'})
export const phraseTable:Record<string,string[]> = Object.assign({},...Object.values(packs))
const templateRules=templates.filter(s=>/[A-Za-zÀ-ÿ]{3}/.test(s.replace(/\{value\d+\}/g,''))).map(source=>({source,match:new RegExp('^'+source.split(/\{value\d+\}/g).map(s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('(.*?)')+'$')}))
let active:Lang='fr'
export function setPhraseLanguage(lang:Lang){active=lang}
export function normalizedPhrase(s:string){return s.replace(/\s+/g,' ').trim()}
export function phrase(input:string,language:Lang=active):string{
 const normalized=normalizedPhrase(input),row=phraseTable[normalized]
 if(!row){for(const rule of templateRules){const values=rule.match.exec(normalized),template=phraseTable[rule.source]?.[codes.indexOf(language)];if(values&&template)return input.replace(input.trim(),template.replace(/\{value(\d+)\}/g,(_,i)=>values[Number(i)+1]||''))}return input}
 const translated=row[codes.indexOf(language)]
 return input.match(/^\s/)||input.match(/\s$/)?input.replace(input.trim(),translated):translated
}
/** Localize display values, while preserving React elements and raw application data. */
export function localizeChild<T>(value:T):T{
 if(typeof value==='string')return phrase(value) as T
 if(Array.isArray(value))return value.map(localizeChild) as T
 return value
}

export const PhraseLanguageContext=createContext<Lang>('fr')
function PhraseText({value}:{value:string}) { const language=useContext(PhraseLanguageContext);return phrase(value,language) }
export function renderChild<T>(value:T):T {
 if(typeof value==='string')return createElement(PhraseText,{value}) as T
 if(Array.isArray(value))return value.map((v,i)=>typeof v==='string'?createElement(PhraseText,{value:v,key:i}):v) as T
 return value
}
export function usePhraseLocale(){return useContext(PhraseLanguageContext)}
