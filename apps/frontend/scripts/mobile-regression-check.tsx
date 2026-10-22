import assert from 'node:assert/strict'
import {renderToString} from 'react-dom/server'
import {MemoryRouter} from 'react-router-dom'
import QRCode from 'qrcode'
import {I18nProvider} from '../src/i18n/I18nContext'
import {WalletProvider} from '../src/context/WalletContext'
import {ExperienceProvider} from '../src/experience/state'
import {text,order} from '../src/experience/locale'
import {phrase} from '../src/i18n/phraseRuntime'
import VirtualJoystick from '../src/components/museum/VirtualJoystick'
import MuseumWebGLHallLive from '../src/components/museum/MuseumWebGLHallLive'
import WalletPairing from '../src/components/WalletPairing'
import {joystickAxes,holdFromAxes,viewMovement,isTapMovement} from '../src/lib/museumNavigation'
import {applyNavKey} from '../src/lib/museumFpsController'
import {clampCameraDistance,makeWalkableChecker,trySlideMove} from '../src/lib/spatialEngine'
import {activateWalletSession,withDeadline} from '../src/lib/walletSession'
import {xPortalPairingHref} from '../src/config/sdkDapp'
import type {RoomBlueprint} from '../src/lib/roomBlueprint'

const close=(a:number,b:number)=>assert(Math.abs(a-b)<1e-8,`${a} != ${b}`)
assert.deepEqual(joystickAxes(1,1,40),{x:0,y:0})
const full=joystickAxes(400,-400,40);close(Math.hypot(full.x,full.y),1)
assert.deepEqual(holdFromAxes(full.x,full.y),{up:true,down:false,left:false,right:true})
const forward=viewMovement(0,-1,0);close(forward.x,0);close(forward.z,-1)
const turned=viewMovement(0,-1,Math.PI/2);close(turned.x,-1);close(turned.z,0)
const diagonal=viewMovement(1,-1,0);close(Math.hypot(diagonal.x,diagonal.z),1)
assert(isTapMovement(10,10,12,11));assert(!isTapMovement(10,10,21,11))
const keys:Record<string,boolean>={}
applyNavKey(keys,{key:'z',code:'KeyW'} as KeyboardEvent,true);assert(keys.w)
applyNavKey(keys,{key:'q',code:'KeyA'} as KeyboardEvent,true);assert(keys.a)
applyNavKey(keys,{key:'z',code:'KeyW'} as KeyboardEvent,false);assert.equal(keys.w,false)
const walkable=makeWalkableChecker([{x1:-3,y1:2,x2:3,y2:2,thickness:.3}],(x,z)=>Math.abs(x)<3&&Math.abs(z)<3,.32)
const d=clampCameraDistance(0,0,Math.PI,0,3,walkable,0)
assert(d<2&&walkable(0,d),'third-person camera crossed the rear wall')
let position={x:0,z:0,vx:0,vz:0}
for(let i=0;i<60;i++)position=trySlideMove(position.x,position.z,0,3.4,.05,walkable,.32)
assert(position.z<2&&walkable(position.x,position.z),'walking crossed a wall')

const address='erd1'+'a'.repeat(58),calls:string[]=[]
const provider={
 async login({approval}:{approval:()=>Promise<unknown>}){calls.push('login');await approval();calls.push('activated')},
 async getAddress(){assert(calls.includes('activated'),'address read before SDK activation');calls.push('address');return address},
}
assert.equal(await activateWalletSession(provider,async()=>{calls.push('approval')}),address)
assert.deepEqual(calls,['login','approval','activated','address'])
await assert.rejects(activateWalletSession({...provider,async login(){throw Error('User rejected')}},async()=>{}),/rejected/)
await assert.rejects(activateWalletSession({...provider,async getAddress(){return ''}},async()=>{}),/invalide/)
await assert.rejects(activateWalletSession({...provider,login:()=>new Promise(()=>{})},async()=>{},undefined,10),/expirée/)
const controller=new AbortController()
const cancelled=activateWalletSession({...provider,login:()=>new Promise(()=>{})},async()=>{},controller.signal)
controller.abort();await assert.rejects(cancelled,/annulée/)
await assert.rejects(withDeadline(Promise.reject(Error('late relay failure')),10,'timeout',controller.signal),/annulée/)
let approveLate!:()=>void,loggedOut=false
const lateSignal=new AbortController()
const late=activateWalletSession({...provider,login:()=>new Promise<void>(resolve=>{approveLate=resolve}),async logout(){loggedOut=true}},async()=>{},lateSignal.signal)
lateSignal.abort();await assert.rejects(late,/annulée/);approveLate();await Promise.resolve();await Promise.resolve();assert(loggedOut,'late approval recreated a cancelled session')
const uri='wc:sample@2?relay-protocol=irn&symKey=123'
assert.equal(xPortalPairingHref(uri,'Android'),uri)
assert.equal(xPortalPairingHref(uri,'iPhone'),`xportal://wc?uri=${encodeURIComponent(uri)}`)
assert((await QRCode.toDataURL(uri)).startsWith('data:image/png;base64,'),'QR is not local')

const blueprint={walls:[{x1:-3,y1:-3,x2:3,y2:-3},{x1:3,y1:-3,x2:3,y2:3},{x1:3,y1:3,x2:-3,y2:3},{x1:-3,y1:3,x2:-3,y2:-3}],wallHeight:3.5} as RoomBlueprint
const warn=console.error
console.error=(...args)=>{if(String(args[0]).includes('useLayoutEffect does nothing on the server'))return;warn(...args)}
for(const lang of order){
 const hold={current:holdFromAxes(0,0)},axes={current:{x:0,y:0}}
 const html=renderToString(<MemoryRouter><I18nProvider initialLang={lang}><WalletProvider><ExperienceProvider><VirtualJoystick hold={hold} axes={axes}/><MuseumWebGLHallLive blueprint={blueprint} frames={[]} roomTitle="Test museum"/><WalletPairing uri={uri}/></ExperienceProvider></WalletProvider></I18nProvider></MemoryRouter>)
 for(const key of ['museumMove','museumFirst','museumFullscreen','museumTour','openXPortal','copyPairing'])assert(html.includes(text(lang,key)),`${lang}: missing ${key}`)
 assert(!html.includes('maiar.page.link')&&!html.includes('qrserver.com'))
 assert(!html.includes('xa-museum-stage is-fullscreen'),'room forced full screen')
 if(lang!=='fr')assert.notEqual(phrase('Connexion annulée.',lang),'Connexion annulée.')
}
console.log('Mobile regressions passed: movement, wall/camera collision, SDK activation, rejection/timeout/cancel, native links, local QR and museum/pairing UI in 8 locales.')
