import {localizeChild as xaLocalize, renderChild as xaRender} from '../i18n/phraseRuntime'
/** Hub créateur — session wallet + rewards/packs + liens studio. */
import { Link } from 'react-router-dom'
import ConnectedSessionPanel from './ConnectedSessionPanel'
import UserDashboardPanel from './UserDashboardPanel'

export default function StudioCreatorHub() {
  return (
    <div className="card border border-violet-500/20 space-y-3 mb-6">
      <p className="text-[11px] uppercase tracking-wider text-violet-300/80">{xaRender("Studio · hub créateur")}</p>
      <div className="grid sm:grid-cols-2 gap-2">
        <ConnectedSessionPanel />
        <UserDashboardPanel />
      </div>
      <div className="flex flex-wrap gap-2 text-[11px]">
        <Link to="/digital-twin" className="text-cyan-400 hover:underline">
          {xaRender("Jumeau 3D / sculpture ")}</Link>
        <Link to="/venues" className="text-cyan-400 hover:underline">
          {xaRender("Louer un mur ")}</Link>
        <Link to="/marketplace" className="text-cyan-400 hover:underline">
          {xaRender("Marketplace ")}</Link>
        <Link to="/my-packs" className="text-cyan-400 hover:underline">
          {xaRender("My Packs ")}</Link>
        <Link to="/tro" className="text-cyan-400 hover:underline">
          {xaRender("$TRO ")}</Link>
        <Link to="/go-live" className="text-cyan-400 hover:underline">
          {xaRender("GO_LIVE ")}</Link>
      </div>
    </div>
  )
}
