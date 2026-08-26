// Reference types for DecisionProof (not a deployable mx-sdk crate by itself).
// Full on-chain verifier requires multiversx-sc + real signature/ZK modules.
// Python mirror: lia/intent/decision_proof.py (paper commitment + HMAC).

// DecisionProof fields:
// - decision_id: [u8; 32]  anti-replay
// - action_type: u8        0=Swap 1=Stake 2=Claim 3=Rebalance 4=Bridge
// - asset_id: [u8; 32]
// - amount: u64            atomic
// - target_price: u64      slippage bound
// - zk_proof: Vec<u8>      FUTURE real SNARK; today off-chain commitment
// - agent_signature: Vec<u8>

// VerificationResult: Valid | InvalidProof | UnauthorizedAgent | ExpiredDecision | Replay

// SwarmController (future SC):
// - allocate_capital(agent_id, amount) if reputation >= 300
// - report_performance(agent_id, pnl) adjusts reputation

// VellumVerifier (future SC):
// - verify_and_execute(proof): replay → expire → signature → zk → execute
// - Safe-Lock rejects all dispatch

// UniversalExecutor (future SC):
// - dispatch_action routes by action_type to swap/stake/claim
