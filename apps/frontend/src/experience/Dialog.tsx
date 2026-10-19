import {useEffect,useRef,type ReactNode} from 'react'
import Icon from './Icon'
import {useCopy} from './state'
export default function Dialog({title,onClose,children,className=''}:{title:string;onClose:()=>void;children:ReactNode;className?:string}){
 const ref=useRef<HTMLDivElement>(null), c=useCopy()
 useEffect(()=>{const previous=document.activeElement as HTMLElement;const old=document.body.style.overflow;document.body.style.overflow='hidden';ref.current?.querySelector<HTMLElement>('input,button,select,a')?.focus();const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.preventDefault();onClose()}if(e.key==='Tab'){const items=Array.from(ref.current?.querySelectorAll<HTMLElement>('button,input,select,a,[tabindex="0"]')||[]).filter(x=>!x.hasAttribute('disabled'));const first=items[0],last=items[items.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}}};window.addEventListener('keydown',key);return()=>{document.body.style.overflow=old;window.removeEventListener('keydown',key);previous?.focus()}},[onClose])
 return <div className="xa-dialog-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><div className={`xa-dialog ${className}`} role="dialog" data-xartists-modal="1" aria-modal="true" aria-label={title} ref={ref}><div className="xa-dialog-header"><h2>{title}</h2><button className="xa-icon-button" aria-label={c('close')} onClick={onClose}><Icon name="close"/></button></div>{children}</div></div>
}
