export type VerifiedMarketAsset={
  id:string;symbol:string;name:string;price:number;change24h:number;
  marketCap?:number;volume24h?:number;sourceUpdatedAt:string
}
export type VerifiedFearGreed={value:number;classification:string;timestamp:string}
export function parseFreshMarketAssets(rows:unknown,now?:number):VerifiedMarketAsset[]
export function parseFreshFearGreed(data:unknown,now?:number):VerifiedFearGreed|null
export function parseFundingRate(value:unknown):number|null
