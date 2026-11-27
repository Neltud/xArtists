/** Editorial gallery inspired by approved xArtists visual reference #1.
 * These images come from an existing dated public MultiversX catalogue snapshot.
 * Display is illustrative only: ownership, current availability and offers are
 * NOT inferred from a historical record. Live checkout stays elsewhere.
 */
import type {ReactNode} from 'react'
import {Link} from 'react-router-dom'
import {useCopy} from '../../experience/state'

const FEATURED = [
 {id:'ALISTOR-a646bc-03',title:'TRANSMUNDO 03',image:'https://media.multiversx.com/nfts/asset/bafybeibimkykepq73n3wqajjjlc4yzhflkzyaxqhxw4qn364htfbxuf6te/item.jpg',collection:'TRANSMUNDO'},
 {id:'ASFT-a6273a-01',title:'BlackArtPass',image:'https://media.multiversx.com/nfts/asset/QmTHS7wWXdTrLWbJUNoZy3u88ENX3K9rLY71G2LaagUg6Q',collection:'ArtPassSFT'},
 {id:'BGG-2b627c-05',title:'Line Up #03',image:'https://media.multiversx.com/nfts/asset/bafybeiawuydtvjnlt6qhmgtxdrs2thpi62cnkpflhmw6bedop3o4uzjp3e/item.JPG',collection:'BorisGaranger'},
] as const

export default function FeaturedArtGallery({children}:{children?:ReactNode}={}){
 const c=useCopy()
 return <section className="xa-featured-gallery" aria-labelledby="xa-featured-title">
  <header className="xa-featured-gallery-header">
   <h1 id="xa-featured-title">{c('editorialDiscover')}</h1>
   <nav className="xa-featured-tabs" aria-label={c('editorialExploreTabs')}>
    <span className="xa-featured-tab-current" aria-current="page">{c('editorialArtworks')}</span>
    <Link to="/museum">{c('navExhibitions')}</Link>
   </nav>
  </header>
  {children}
  <div className="xa-featured-gallery-grid">
   {FEATURED.map((art,i)=><article key={art.id} className={'xa-featured-work xa-featured-work-'+i}>
    <a className="xa-featured-work-image" href={'https://explorer.multiversx.com/nfts/'+art.id}
       target="_blank" rel="noopener noreferrer" aria-label={c('editorialViewOnExplorer')+' : '+art.title}>
     <span className="xa-featured-work-placeholder" aria-hidden="true">xArtists</span>
     <img src={art.image} alt={art.title} loading={i===0?'eager':'lazy'} decoding="async"
      onError={e=>{e.currentTarget.style.display='none'}} />
    </a>
    <div className="xa-featured-work-caption">
     <div><h3>{art.title}</h3></div>
     <a href={'https://explorer.multiversx.com/nfts/'+art.id} target="_blank" rel="noopener noreferrer">
      {c('editorialViewOnExplorer')} <span aria-hidden="true">↗</span>
     </a>
    </div>
   </article>)}
  </div>
  <p className="xa-featured-gallery-disclaimer" role="note">{c('editorialSnapshotDisclaimer')}</p>
 </section>
}
