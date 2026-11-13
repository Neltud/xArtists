/**
 * Single public source for xArtists TARGET offers. No checkout or entitlement.
 * Three EUR service price tiers and three xOrus analysis tracks are independent
 * until approved SKU-to-scope benefits and signed PSP billing are implemented.
 */
import {FIAT_SERVICE_TIERS,GENESIS_EGLD_TARGETS,LAST_OBSERVED_MAINNET_EGLD}
  from './commercialRails.mjs'
import {XORUS_OFFER_SCOPES} from './xorusEntitlements.mjs'

const MONTHLY=['fiat_379','fiat_579','fiat_979']
const GENESIS=['pulse','yield','sentinel']
const TRACKS=Object.freeze({
  pulse:{fr:'Marchés',en:'Markets'},
  yield:{fr:'DeFi',en:'DeFi'},
  sentinel:{fr:'Risques',en:'Risk'},
})

export function publicCommercialCatalog({
  walletlessAccountEnabled=false,privateAnalysisEnabled=false,
}={}){
  return {
    ok:true,
    schema:'xartists_public_commercial_catalog/v1',
    mode:'prelaunch',
    sale_open:false,
    billing_checkout_enabled:false,
    contract_purchase_enabled:false,
    mint_enabled:false,
    walletless_account_session_enabled:walletlessAccountEnabled===true,
    xorus_private_analysis_enabled:privateAnalysisEnabled===true,
    currency_pricing:'targets_only_not_quotes',
    monthly_services:MONTHLY.map((sku,i)=>({
      sku,
      tier:i+1,
      target_cents:FIAT_SERVICE_TIERS[sku].cents,
      currency:'EUR',
      interval:'month',
      requires_wallet:false,
      includes_nft:false,
      status:'not_available',
      checkout_enabled:false,
      scope_mapping_approved:false,
    })),
    analysis_tracks:GENESIS.map(id=>({
      id,
      fr:TRACKS[id].fr,
      en:TRACKS[id].en,
      scope:XORUS_OFFER_SCOPES[id],
      report_delivery_status:'not_commercially_available',
      // A paper sample is not an independently licensed customer report.
      source_commercial_rights_verified:false,
      independently_verified_signals:0,
    })),
    genesis_nft:GENESIS.map(id=>({
      id,
      target_egld:GENESIS_EGLD_TARGETS[id].egld,
      last_observed_2026_11_08_egld:LAST_OBSERVED_MAINNET_EGLD[id],
      requires_wallet:true,
      includes_nft:true,
      status:'not_available',
      checkout_enabled:false,
      price_chain_verified:false,
    })),
  }
}
