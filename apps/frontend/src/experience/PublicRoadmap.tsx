import { Link } from 'react-router-dom'
import Icon from './Icon'
import { useCopy } from './state'
import { modules } from './modules'
import { publicMilestones, publicStage, readinessCounts, type PublicStage } from './publicReadiness'

const PICKS = {
 browse: ['museum','market','guide'],
 preview: ['studio','nft-factory','auction','dao'],
 roadmap: ['trading','staking','liquidity'],
} as const

function StageLinks({stage}:{stage:PublicStage}){
 const c=useCopy()
 return <div className="xa-roadmap-selected">
  {PICKS[stage].map(id=>{
    const m=modules.find(m=>m.id===id)
    if(!m||publicStage(m.id)!==stage)return null
    return <Link key={id} to={m.path}><span>{c(m.label)}</span><Icon name="arrow" size={17}/></Link>
  })}
 </div>
}

export default function PublicRoadmap(){
 const c=useCopy()
 const counts=readinessCounts(modules.map(m=>m.id))
 return <div className="xa-container xa-roadmap-page">
   <div className="xa-breadcrumb"><Link to="/">xArtists</Link><Icon name="chevron" size={12}/><span>{c('roadmapLabel')}</span></div>
   <div className="xa-eyebrow">xArtists · 40 {c('modules')}</div>
   <h1>{c('roadmapTitle')}</h1>
   <p className="xa-roadmap-lead">{c('roadmapIntro')}</p>
   <div className="xa-page-readiness">
    {(['browse','preview','roadmap'] as const).map(stage=><Link to={`/directory?stage=${stage}`} key={stage} className="xa-module-status" data-stage={stage}><span className="xa-module-status-dot"/>{c(stage==='browse'?'stageBrowse':stage==='preview'?'stagePreview':'stageRoadmap')} · {counts[stage]}</Link>)}
   </div>
   <section className="xa-roadmap-stage" aria-labelledby="xa-roadmap-browse">
    <div className="xa-roadmap-stage-heading"><span className="xa-module-status" data-stage="browse">{c('stageBrowse')}</span><h2 id="xa-roadmap-browse">01</h2></div>
    <p>{c('roadmapNowLead')}</p>
    <StageLinks stage="browse"/>
   </section>
   <section className="xa-roadmap-stage" aria-labelledby="xa-roadmap-preview">
    <div className="xa-roadmap-stage-heading"><span className="xa-module-status" data-stage="preview">{c('stagePreview')}</span><h2 id="xa-roadmap-preview">02</h2></div>
    <p>{c('roadmapPreviewLead')}</p>
    <StageLinks stage="preview"/>
   </section>
   <section className="xa-roadmap-stage" aria-labelledby="xa-roadmap-future">
    <div className="xa-roadmap-stage-heading"><span className="xa-module-status" data-stage="roadmap">{c('stageRoadmap')}</span><h2 id="xa-roadmap-future">03</h2></div>
    <p>{c('roadmapFutureLead')}</p>
    <StageLinks stage="roadmap"/>
    <div className="xa-roadmap-milestones">
     {publicMilestones.map(item=><article key={item.id} className="xa-roadmap-milestone">
      <span className="xa-module-status" data-stage="roadmap">{c('stageRoadmap')}</span>
      <h3>{c(item.labelKey)}</h3>
      <p>{c(item.detailKey)}</p>
      <a href={`https://github.com/Neltud/xArtists/issues/${item.issue}`} target="_blank" rel="noreferrer">{c('roadmapEvidence')} · #{item.issue}<Icon name="external" size={14}/></a>
     </article>)}
    </div>
    <p className="xa-roadmap-note" role="status">{c('roadmapNoDate')} {c('welcomeNoBridge')}</p>
   </section>
   <div className="xa-home-roadmap"><div><h2>{c('stageAll')}</h2><p>{c('welcomeToolsLead')}</p></div><Link className="xa-button secondary" to="/directory">{c('directory')}<Icon name="arrow" size={16}/></Link></div>
  </div>
}
