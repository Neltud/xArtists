/**
 * Deprecated canvas renderers. Former time-driven trigonometric graphs fabricated
 * throughput, APR, SHA validation and ZK quality scores for Pulse/Yield/Sentinel.
 * Retained as inert compatibility exports; do not use them as agent telemetry.
 */
import type { TroEgldPoolSnapshot } from '../../services/poolService'

function noVerifiedSignal(ctx: CanvasRenderingContext2D, w: number, h: number, pack: string) {
  ctx.clearRect(0, 0, w, h)
  ctx.fillStyle = '#161c19'
  ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = '#f1f5ef'
  ctx.font = '600 18px sans-serif'
  ctx.fillText(pack, 22, 40)
  ctx.fillStyle = '#c4ccc3'
  ctx.font = '13px sans-serif'
  ctx.fillText('STATIC / UNVERIFIED', 22, 72)
  ctx.fillText('No authenticated, timestamped agent signal.', 22, 96)
  ctx.fillText('Paper-first · no live trading evidence', 22, 120)
}

export function drawPulseScreen(ctx: CanvasRenderingContext2D, w: number, h: number, _t: number) {
  noVerifiedSignal(ctx, w, h, 'PULSE')
}

export function drawYieldScreen(
  ctx: CanvasRenderingContext2D, w: number, h: number, _t: number,
  _pool?: TroEgldPoolSnapshot | null,
) {
  noVerifiedSignal(ctx, w, h, 'YIELD')
}

export function drawSentinelScreen(ctx: CanvasRenderingContext2D, w: number, h: number, _t: number) {
  noVerifiedSignal(ctx, w, h, 'SENTINEL')
}
