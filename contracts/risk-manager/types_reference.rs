// Risk Manager — reference logic for MultiversX SC (not yet deployed).
// Source inspiration: emergency lockdown when drawdown > max allowed.
// Real SC should use multiversx-sc macros; this file is documentation / port target.
//
// Called by Executor / LIA before size-up or transfer.
// Off-chain mirror: lia/security/risk_manager.py

#![allow(dead_code)]

/// System-wide status mirrored on-chain when SC is live.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum SystemStatus {
    Active = 0,
    Locked = 1,
}

/// Conceptual RiskManager surface (pseudocode-aligned with product intent).
pub struct RiskManagerState {
    pub status: SystemStatus,
    /// Max drawdown in basis points of peak equity (e.g. 1500 = 15%).
    pub max_drawdown_bps: u64,
}

impl RiskManagerState {
    pub fn new(max_drawdown_bps: u64) -> Self {
        Self {
            status: SystemStatus::Active,
            max_drawdown_bps,
        }
    }

    /// Called on each risk tick / before transfer by Executor.
    /// `current_drawdown_bps`: peak-to-now drawdown in bps.
    pub fn check_safety_status(&mut self, current_drawdown_bps: u64) -> &'static str {
        if self.status == SystemStatus::Locked {
            return "ALREADY_LOCKED";
        }
        if current_drawdown_bps > self.max_drawdown_bps {
            self.trigger_emergency_lock();
            return "CRITICAL_FAILURE: Drawdown limit exceeded. Locking treasury.";
        }
        "OK"
    }

    pub fn check_safety(&mut self, current_drawdown_bps: u64, max_limit_bps: u64) -> bool {
        if current_drawdown_bps > max_limit_bps {
            self.status = SystemStatus::Locked;
            return false;
        }
        true
    }

    fn trigger_emergency_lock(&mut self) {
        self.status = SystemStatus::Locked;
        // On-chain: emit SYSTEM_LOCKDOWN event; LIA swarm must cease open risk.
    }

    pub fn is_locked(&self) -> bool {
        self.status == SystemStatus::Locked
    }
}
