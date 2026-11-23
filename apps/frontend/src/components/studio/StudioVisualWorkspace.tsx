/** Approved xArtists visual reference #3: local-first art editor.
 * File selection makes an on-device preview only. No upload, mint, ownership
 * proof or server draft is implied. Existing verified mint tools remain below.
 */
import {useEffect,useRef,useState,type ChangeEvent} from 'react'
import {Link} from 'react-router-dom'
import Icon from '../../experience/Icon'
import {useCopy} from '../../experience/state'

const DRAFT_KEY='xa-studio-v2-draft'
const MAX_FILES=12
const MAX_BYTES=30*1024*1024
const SAMPLE='https://media.multiversx.com/nfts/asset/bafybeibimkykepq73n3wqajjjlc4yzhflkzyaxqhxw4qn364htfbxuf6te/item.jpg'
type Kind='image'|'video'|'audio'
type LocalMedia={id:string;url:string;name:string;kind:Kind}
type Draft={title:string;description:string;rights:string}
const DEFAULT_DRAFT:Draft={title:'',description:'',rights:'all'}

export function readStudioDraft():Draft{
 if(typeof window==='undefined')return {...DEFAULT_DRAFT}
 try{
  const raw=window.localStorage.getItem(DRAFT_KEY)
  if(!raw)return {...DEFAULT_DRAFT}
  const parsed:unknown=JSON.parse(raw)
  if(!parsed||typeof parsed!=='object')return {...DEFAULT_DRAFT}
  const data=parsed as Record<string,unknown>
  return {
   title:typeof data.title==='string'?data.title.slice(0,50):'',
   description:typeof data.description==='string'?data.description.slice(0,2000):'',
   rights:typeof data.rights==='string'&&['all','cc-by','cc-by-nc'].includes(data.rights)?data.rights:'all',
  }
 }catch{return {...DEFAULT_DRAFT}}
}
function mediaKind(file:File):Kind|null{
 if(file.type.startsWith('image/'))return 'image'
 if(file.type.startsWith('video/'))return 'video'
 if(file.type.startsWith('audio/'))return 'audio'
 return null
}
export default function StudioVisualWorkspace({title,onTitle}:{title:string;onTitle:(value:string)=>void}){
 const c=useCopy()
 const fileInput=useRef<HTMLInputElement>(null)
 const sequence=useRef(0)
 const ownedUrls=useRef<Set<string>>(new Set())
 const initial=useRef(readStudioDraft())
 const [description,setDescription]=useState(initial.current.description)
 const [rights,setRights]=useState(initial.current.rights)
 const [items,setItems]=useState<LocalMedia[]>([])
 const [selected,setSelected]=useState<string|null>(null)
 const [zoom,setZoom]=useState(100)
 const [message,setMessage]=useState('')
 const [saved,setSaved]=useState(false)
 useEffect(()=>{
  try{
   window.localStorage.setItem(DRAFT_KEY,JSON.stringify({v:1,title:title.slice(0,50),description:description.slice(0,2000),rights}))
   setSaved(true)
  }catch{setSaved(false)}
 },[title,description,rights])
 useEffect(()=>()=>{for(const url of ownedUrls.current)URL.revokeObjectURL(url);ownedUrls.current.clear()},[])
 const loadFiles=(event:ChangeEvent<HTMLInputElement>)=>{
  const uploaded=Array.from(event.target.files??[])
  event.target.value=''
  const next:LocalMedia[]=[]
  let rejected=0
  for(const file of uploaded){
   const kind=mediaKind(file)
   if(!kind||file.size>MAX_BYTES||file.size===0||items.length+next.length>=MAX_FILES){rejected++;continue}
   const url=URL.createObjectURL(file)
   ownedUrls.current.add(url)
   next.push({id:'media-'+(++sequence.current),url,name:file.name.slice(0,150),kind})
  }
  if(next.length){
   setItems(previous=>[...previous,...next].slice(0,MAX_FILES))
   setSelected(next[0].id)
   setZoom(100)
  }
  setMessage(rejected?c('studioMediaRejected'):next.length?c('studioPreviewLocal'):'')
 }
 const remove=(id:string)=>{
  const item=items.find(x=>x.id===id)
  if(item){URL.revokeObjectURL(item.url);ownedUrls.current.delete(item.url)}
  const next=items.filter(x=>x.id!==id)
  setItems(next);if(selected===id)setSelected(next[0]?.id??null);setZoom(100)
 }
 const active=items.find(x=>x.id===selected)??items[0]
 return <section className="xa-visual-studio" aria-label={c('navStudio')}>
  <header className="xa-visual-studio-top">
   <h1>{c('navStudio')}</h1>
   <nav className="xa-visual-studio-tabs" aria-label={c('navStudio')}>
    <span aria-current="page">{c('navArtwork')}</span>
    <Link to="/create/gallery">{c('navExhibitions')}</Link>
    <Link to="/create/world-rights">{c('navRights')}</Link>
   </nav>
   <div className="xa-visual-studio-top-actions">
    <span className="xa-visual-studio-draft">{saved?c('studioLocalDraft'):c('studioLocalUnavailable')}</span>
    <button type="button" className="xa-button primary" onClick={()=>fileInput.current?.click()}><Icon name="create" size={18}/>{c('studioImportMedia')}</button>
   </div>
  </header>
  <input className="sr-only" ref={fileInput} type="file" multiple
    accept="image/*,video/*,audio/*" aria-label={c('studioImportMedia')} onChange={loadFiles}/>
  <div className="xa-visual-studio-columns">
   <aside className="xa-visual-studio-media" aria-label={c('studioMediaLabel')}>
    <h2>{c('studioMediaLabel')}</h2>
    <div className="xa-visual-studio-media-list">
     {items.length===0?<div className="xa-visual-studio-thumb selected">
       <img src={SAMPLE} alt={c('studioExamplePreview')} />
      </div>:items.map(item=><div key={item.id} className={'xa-visual-studio-media-row'+(active?.id===item.id?' selected':'')}>
       <button type="button" className="xa-visual-studio-thumb" aria-pressed={active?.id===item.id}
        onClick={()=>{setSelected(item.id);setZoom(100)}} title={item.name}>
        {item.kind==='image'?<img src={item.url} alt={item.name}/>:<Icon name={item.kind==='video'?'play':'orb'} size={25}/>}
        <span>{item.name}</span>
       </button>
       <button type="button" className="xa-visual-studio-remove" onClick={()=>remove(item.id)}
        aria-label={c('studioRemoveMedia')+' : '+item.name}><Icon name="close" size={15}/></button>
      </div>)}
    </div>
    <button type="button" className="xa-visual-studio-add" onClick={()=>fileInput.current?.click()}>
     <Icon name="create" size={20}/>{c('studioAddMedia')}
    </button>
    <small className="xa-visual-studio-file-note">{c('studioFileLimit')}</small>
   </aside>
   <div className="xa-visual-studio-preview">
    <span className="xa-visual-studio-preview-label">{active?c('studioPreviewLocal'):c('studioExamplePreview')}</span>
    <div className="xa-visual-studio-stage">
     <div className="xa-visual-studio-frame" style={{transform:`scale(${zoom/100})`}}>
      {!active?<img src={SAMPLE} alt={c('studioExamplePreview')}/>:active.kind==='image'?
       <img src={active.url} alt={active.name}/>:active.kind==='video'?
       <video key={active.id} src={active.url} controls preload="metadata" aria-label={active.name}/>:
       <div className="xa-visual-studio-audio"><Icon name="play" size={40}/>
        <strong>{active.name}</strong><audio key={active.id} src={active.url} controls preload="none" aria-label={active.name}/></div>}
     </div>
    </div>
    <div className="xa-visual-studio-zoom" role="group" aria-label={c('studioZoom')}>
     <button type="button" onClick={()=>setZoom(z=>Math.max(60,z-20))} aria-label={c('studioZoomOut')}>−</button>
     <button type="button" onClick={()=>setZoom(100)} aria-label={c('studioZoom')}>{zoom} %</button>
     <button type="button" onClick={()=>setZoom(z=>Math.min(140,z+20))} aria-label={c('studioZoomIn')}>+</button>
    </div>
    {message&&<p className="xa-visual-studio-message" role="status">{message}</p>}
   </div>
   <aside className="xa-visual-studio-properties" aria-label={c('studioMyWork')}>
    <h2>{c('studioMyWork')}</h2>
    <label htmlFor="xa-visual-work-title">{c('studioTitleLabel')}</label>
    <input id="xa-visual-work-title" type="text" maxLength={50} autoComplete="off"
     value={title} onChange={e=>onTitle(e.target.value)} placeholder={c('studioTitlePlaceholder')}/>
    <label htmlFor="xa-visual-work-description">{c('studioDescriptionLabel')}</label>
    <textarea id="xa-visual-work-description" maxLength={2000} rows={5} value={description}
     onChange={e=>setDescription(e.target.value)} placeholder={c('studioDescriptionPlaceholder')}/>
    <p className="xa-visual-studio-format"><Icon name="cube" size={20}/>{c('studioAcceptedTypes')}</p>
    <details className="xa-visual-studio-rights">
     <summary><Icon name="shield" size={19}/>{c('studioRightsDetails')}<Icon name="chevron" size={17}/></summary>
     <label htmlFor="xa-visual-work-rights">{c('studioRightsLabel')}</label>
     <select id="xa-visual-work-rights" value={rights} onChange={e=>setRights(e.target.value)}>
      <option value="all">{c('studioRightsReserved')}</option>
      <option value="cc-by">CC BY 4.0</option><option value="cc-by-nc">CC BY-NC 4.0</option>
     </select>
     <small>{c('studioRightsNotVerified')}</small>
    </details>
    <div className="xa-visual-studio-publication">
     <button type="button" className="xa-button primary" disabled>{c('studioPublish')}</button>
     <small role="note">{c('studioPublishUnavailable')}</small>
     <Link to="/create/gallery" className="xa-button secondary">{c('studioPrepareExhibition')}</Link>
     <a href="#xa-studio-mint" className="xa-visual-studio-advanced-link">{c('studioAdvancedMint')}</a>
    </div>
   </aside>
  </div>
 </section>
}
