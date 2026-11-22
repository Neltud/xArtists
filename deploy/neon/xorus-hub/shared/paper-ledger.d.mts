export type PaperNetwork = 'multiversx' | 'solana'
export interface PaperProposal {
  id: string; network: PaperNetwork; token_in: string; token_out: string;
  notional_cents: number; entry_fee_cents: number; mark_value_cents: number;
  slippage_bps: number; status: 'open_simulation' | 'closed_simulation'; opened_at_ms: number;
  paper_net_pnl_cents?: number; exit_value_cents?: number;
}
export interface PaperState {
  schema_version: number; mode: 'paper_simulation'; execution_authorized: false;
  live_budget_cents: 0; revision: number; proposals: PaperProposal[];
  [key: string]: unknown;
}
export interface PaperView {
  revision: number; reference_capital_cents: number; reserve_cents: number;
  proposals: PaperProposal[]; total_events: number;
  risk: { paper_net_pnl_cents: number; global: { loss_24h_cents: number; loss_pilot_cents: number; open_notional_cents: number } };
  halts: { pilot: boolean; daily_until_ms: number; networks: Record<PaperNetwork, {pilot: boolean; daily_until_ms: number}> };
}
export function createPaperState(options?: {capitalCents?: number; now?: number}): PaperState;
export function paperLedgerView(state: PaperState, now?: number): PaperView;
export function applyPaperCommand(state: PaperState, command: Record<string, unknown>, now?: number):
  {ok: true; replayed: boolean; state: PaperState; view: PaperView} | {ok: false; error: string};
