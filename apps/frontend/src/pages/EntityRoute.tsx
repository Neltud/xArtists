import {Navigate,useLocation} from 'react-router-dom'
export default function EntityRoute(){
 const location=useLocation(),params=new URLSearchParams(location.search)
 params.set('view','network')
 return <Navigate replace to={{pathname:'/intelligence/lab',search:'?'+params.toString(),hash:location.hash}}/>
}
