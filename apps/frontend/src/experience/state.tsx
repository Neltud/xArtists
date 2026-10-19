import { createContext,useContext,useEffect,useState,type ReactNode } from 'react'
import {useI18n} from '../i18n/I18nContext'
import {text} from './locale'
type Experience = {motion:boolean;setMotion:(v:boolean)=>void;theme:'dark'|'light';setTheme:(v:'dark'|'light')=>void}
const Ctx=createContext<Experience>({motion:true,setMotion:()=>{},theme:'dark',setTheme:()=>{}})
function stored(key:string){try{return localStorage.getItem(key)}catch{return null}}
export function ExperienceProvider({children}:{children:ReactNode}){
 const [motion,setMotion]=useState(()=>stored('xa-motion')==='off'?false:stored('xa-motion')==='on'?true:!(typeof window!=='undefined'&&window.matchMedia('(prefers-reduced-motion: reduce)').matches))
 const [theme,setTheme]=useState<'dark'|'light'>(()=>stored('xa-theme')==='light'?'light':'dark')
 useEffect(()=>{document.documentElement.dataset.theme=theme;try{localStorage.setItem('xa-theme',theme)}catch{}},[theme])
 useEffect(()=>{document.documentElement.dataset.motion=motion?'on':'off';try{localStorage.setItem('xa-motion',motion?'on':'off')}catch{}},[motion])
 return <Ctx.Provider value={{motion,setMotion,theme,setTheme}}>{children}</Ctx.Provider>
}
export function useExperience(){return useContext(Ctx)}
export function useCopy(){const {lang}=useI18n();return (key:string)=>text(lang,key)}
