import {Navigate,useLocation} from 'react-router-dom'
/** Legacy links open the shared wallet assets view, preserving callback context. */
export default function PortfolioPage(){
 const location=useLocation(),params=new URLSearchParams(location.search)
 params.set('view','assets')
 return <Navigate replace to={{pathname:'/workspace/wallet',search:'?'+params.toString(),hash:location.hash}}/>
}
