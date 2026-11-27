import {createNeonAccountApi} from '../../../services/access-api/src/neonAccountApi.mjs'

const app=createNeonAccountApi()
export const fetch=request=>app.fetch(request)
export default {fetch}
