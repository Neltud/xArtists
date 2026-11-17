/**
 * Access API — JWT, SIWX, Paybox System (v8.3).
 * Paybox IPN: RSA-SHA256 / 2048 only. Buyer identity: JWT or SIWX.
 * Post-IPN: optional mintDispatch (dry_run default; live needs explicit env gates).
 * Signals: read-only daily signal (never executes trades).
 *
 * NOTE: If this file appears truncated, restore from commit 7f6c280 + assisted-swap patch.
 * Artifact: RESTORE via /tmp/server_restored.mjs pattern in ops notes.
 */
import http from 'node:http'
import pg from 'pg'
import { createNeonAuthIdentityVerifier, findOrCreateAccountFromNeonToken,findExistingAccountFromNeonToken } from './neonAuthIdentity.mjs'
import { createXorusPrivateRepository } from './xorusPrivateStore.mjs'
import { createXorusPrivateDelivery } from './xorusPrivateDelivery.mjs'
import { publicCommercialCatalog } from './publicCommercialCatalog.mjs'
import { createWalletlessSessionService } from './walletlessSession.mjs'
import { createWalletlessAccountProfileService } from './walletlessProfile.mjs'
import { createWalletlessSchemaProbe } from './walletlessSchemaProbe.mjs'
import { readAccountProjection } from './accountRepository.mjs'
import { createWorldRightsHandler } from './worldRightsHttp.mjs'
import {publicFreeSourcePolicy} from './xorusFreeSourcePolicy.mjs'
import { handleStripe } from './stripeHttp.mjs'
import { stripeSandboxConfig } from './stripeCheckout.mjs'
import { resolveAccessLevel, issueAccessToken, verifyJwt } from './verifyAccess.mjs'
import { createChallenge, verifySignedChallenge, requireSiwx, erdToPubkey } from './siwx.mjs'
import { createSimpleIntentService } from './liaSimple.mjs'
import { moonpayConfig, signMoonpayUrl } from './moonpay.mjs'
import { createMoonpayRateLimiter } from './moonpayRateLimit.mjs'
import {
  payboxConfig, payboxCheckoutEnabled, payboxCheckoutStoreReady, createPayboxSession, verifyPayboxIpn, extractRawSignedData, resolveIpnAuthenticatedSource, IPN_POLICY,
} from './paybox.mjs'
import {
  createOrder, getOrder, getOrderForBuyer, applyIpn, markRedirected, newOrderId, resolveArtistBeneficiary,
  triggerMintDispatchSafe, publicOrderDelivery, probeOrdersStore,
} from './orders.mjs'
import { resolveAuthenticatedBuyer } from './buyerAuth.mjs'
import { buildPackQuote } from './quote.mjs'
import { loadDailySignal } from './signals.mjs'
import { mintDispatchConfig, probeMintJobsStore } from './mintDispatch.mjs'
import { oidcMintPullEnabled, verifyGitHubOidc, eligibleOidcOrders, claimOidcMintOrder, ackOidcMintOrder } from './mintOidcPull.mjs'
import { loadOrders } from './orders.mjs'
import { troBridgeStatus } from './troBridgeStatus.mjs'
import { createOpenSeaPreviewService } from './openseaPreview.mjs'
import { artpriceReadiness } from './artpriceLicensed.mjs'
import { probeStudioStore } from './studioStoreProbe.mjs'
import { checkKuboReadiness } from './studioKubo.mjs'
import { createXorusAnalysisService } from './xorusAnalysis.mjs'
import { runAssistedSwap, XORUS_ASSISTED_SWAP_POLICY } from './xorusAssistedSwap.mjs'
import { createRuntimeBuildInfo } from './runtimeBuildInfo.mjs'
import { PUBLIC_FRONTEND_ORIGINS } from './publicOrigins.mjs'
import { tryHandleAuction, auctionPublicConfig } from './auctionHttp.mjs'
import {studioMediaConfig,mediaJwt,mediaActor,readCreatorMedia,
  uploadStudioMedia,pinStudioMetadata} from './creatorMedia.mjs'
import {
  physicalConfig, issuePhysicalSession, physicalActor, merchantAuthorized,
  registerPhysicalWork, readPhysicalWork, changePhysicalWork,
} from './physicalFulfillment.mjs'

console.error('CRITICAL: server.mjs is incomplete on this deployment. Restore full body from commit 7f6c280 + assisted-swap route. See docs or RESTORE_SERVER.sh')
process.exit(1)
