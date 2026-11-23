import {Navigate,useLocation} from 'react-router-dom'
export default function SimulationRoute(){
 const location=useLocation(),params=new URLSearchParams(location.search)
 params.set('view','simulation')
 return <Navigate replace to={{pathname:'/intelligence/lab',search:'?'+params.toString(),hash:location.hash}}/>
}
