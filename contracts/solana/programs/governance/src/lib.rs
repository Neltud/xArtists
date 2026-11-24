use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, TransferChecked};

// Offline/local test identity only; not a deployed DAO or an official TRO mint.
declare_id!("3chFT3jsz3jhPXujW8MNjXPB8UUdHY6pSBkB3A37kLJd");
const MIN_DURATION: i64 = 60 * 60;
const MAX_DURATION: i64 = 30 * 24 * 60 * 60;
const ACTIVE: u8 = 0;
const PASSED: u8 = 1;
const REJECTED: u8 = 2;

#[program]
pub mod xartists_governance {
    use super::*;
    pub fn initialize(ctx: Context<Initialize>, quorum: u64, proposal_stake: u64) -> Result<()> {
        require!(
            quorum > 0 && proposal_stake > 0 && quorum <= ctx.accounts.mint.supply,
            DaoError::InvalidConfig
        );
        require!(
            ctx.accounts.mint.mint_authority.is_none()
                && ctx.accounts.mint.freeze_authority.is_none(),
            DaoError::MutableMint
        );
        ctx.accounts.dao.set_inner(Dao {
            authority: ctx.accounts.authority.key(),
            mint: ctx.accounts.mint.key(),
            quorum,
            proposal_stake,
            next_proposal_id: 0,
            paused: false,
            bump: ctx.bumps.dao,
            vault_bump: ctx.bumps.vault,
        });
        Ok(())
    }
    pub fn set_paused(ctx: Context<SetPaused>, paused: bool) -> Result<()> {
        // Only new stakes/proposals pause. Existing votes, finalization and withdrawals remain possible.
        ctx.accounts.dao.paused = paused;
        Ok(())
    }
    pub fn stake(ctx: Context<Stake>, amount: u64) -> Result<()> {
        require!(!ctx.accounts.dao.paused, DaoError::Paused);
        require!(amount > 0, DaoError::ZeroAmount);
        let position = &mut ctx.accounts.position;
        if position.owner == Pubkey::default() {
            position.owner = ctx.accounts.owner.key();
            position.dao = ctx.accounts.dao.key();
            position.bump = ctx.bumps.position;
            position.locked_until = 0;
        }
        require_keys_eq!(
            position.owner,
            ctx.accounts.owner.key(),
            DaoError::WrongOwner
        );
        require_keys_eq!(position.dao, ctx.accounts.dao.key(), DaoError::WrongDao);
        position.amount = position
            .amount
            .checked_add(amount)
            .ok_or(DaoError::Overflow)?;
        token::transfer_checked(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                TransferChecked {
                    from: ctx.accounts.owner_token.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.vault.to_account_info(),
                    authority: ctx.accounts.owner.to_account_info(),
                },
            ),
            amount,
            ctx.accounts.mint.decimals,
        )
    }
    pub fn unstake(ctx: Context<Unstake>, amount: u64) -> Result<()> {
        require!(
            amount > 0 && amount <= ctx.accounts.position.amount,
            DaoError::InvalidAmount
        );
        require!(
            Clock::get()?.unix_timestamp >= ctx.accounts.position.locked_until,
            DaoError::VoteLocked
        );
        ctx.accounts.position.amount = ctx
            .accounts
            .position
            .amount
            .checked_sub(amount)
            .ok_or(DaoError::Overflow)?;
        let authority = ctx.accounts.dao.authority;
        let mint = ctx.accounts.dao.mint;
        let bump = [ctx.accounts.dao.bump];
        let seeds: &[&[u8]] = &[b"dao", authority.as_ref(), mint.as_ref(), &bump];
        token::transfer_checked(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                TransferChecked {
                    from: ctx.accounts.vault.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.owner_token.to_account_info(),
                    authority: ctx.accounts.dao.to_account_info(),
                },
                &[seeds],
            ),
            amount,
            ctx.accounts.mint.decimals,
        )
    }
    pub fn create_proposal(
        ctx: Context<CreateProposal>,
        id: u64,
        title: String,
        uri: String,
        duration: i64,
    ) -> Result<()> {
        require!(!ctx.accounts.dao.paused, DaoError::Paused);
        require!(
            ctx.accounts.position.amount >= ctx.accounts.dao.proposal_stake,
            DaoError::NoPower
        );
        require!(
            id == ctx.accounts.dao.next_proposal_id,
            DaoError::StaleProposalId
        );
        validate_proposal(&title, &uri, duration)?;
        let end = Clock::get()?
            .unix_timestamp
            .checked_add(duration)
            .ok_or(DaoError::Overflow)?;
        ctx.accounts.dao.next_proposal_id = id.checked_add(1).ok_or(DaoError::Overflow)?;
        // A proposer cannot withdraw the qualifying stake during the vote.
        ctx.accounts.position.locked_until = ctx.accounts.position.locked_until.max(end);
        ctx.accounts.proposal.set_inner(Proposal {
            dao: ctx.accounts.dao.key(),
            proposer: ctx.accounts.owner.key(),
            id,
            title,
            uri,
            ends_at: end,
            quorum: ctx.accounts.dao.quorum,
            yes: 0,
            no: 0,
            state: ACTIVE,
            bump: ctx.bumps.proposal,
        });
        emit!(ProposalCreated {
            proposal: ctx.accounts.proposal.key(),
            id,
            ends_at: end
        });
        Ok(())
    }
    pub fn vote(ctx: Context<Vote>, support: bool) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;
        require!(
            ctx.accounts.proposal.state == ACTIVE && now < ctx.accounts.proposal.ends_at,
            DaoError::VotingClosed
        );
        let weight = ctx.accounts.position.amount;
        require!(weight > 0, DaoError::NoPower);
        if support {
            ctx.accounts.proposal.yes = ctx
                .accounts
                .proposal
                .yes
                .checked_add(weight)
                .ok_or(DaoError::Overflow)?;
        } else {
            ctx.accounts.proposal.no = ctx
                .accounts
                .proposal
                .no
                .checked_add(weight)
                .ok_or(DaoError::Overflow)?;
        }
        // Receipt PDA is init-only: one irreversible vote per owner/proposal.
        ctx.accounts.receipt.set_inner(Receipt {
            proposal: ctx.accounts.proposal.key(),
            owner: ctx.accounts.owner.key(),
            weight,
            support,
            bump: ctx.bumps.receipt,
        });
        ctx.accounts.position.locked_until = ctx
            .accounts
            .position
            .locked_until
            .max(ctx.accounts.proposal.ends_at);
        emit!(Voted {
            proposal: ctx.accounts.proposal.key(),
            owner: ctx.accounts.owner.key(),
            weight,
            support
        });
        Ok(())
    }
    pub fn finalize(ctx: Context<Finalize>) -> Result<()> {
        require!(
            ctx.accounts.proposal.state == ACTIVE
                && Clock::get()?.unix_timestamp >= ctx.accounts.proposal.ends_at,
            DaoError::VotingOpen
        );
        ctx.accounts.proposal.state = outcome(
            ctx.accounts.proposal.yes,
            ctx.accounts.proposal.no,
            ctx.accounts.proposal.quorum,
        )?;
        emit!(Finalized {
            proposal: ctx.accounts.proposal.key(),
            state: ctx.accounts.proposal.state
        });
        // A passed proposal records a result; it cannot execute arbitrary calls or move treasury funds.
        Ok(())
    }
}
fn validate_proposal(title: &str, uri: &str, duration: i64) -> Result<()> {
    require!(
        !title.trim().is_empty() && title.len() <= 120,
        DaoError::InvalidTitle
    );
    require!(
        uri.len() <= 200 && (uri.starts_with("https://") || uri.starts_with("ipfs://")),
        DaoError::InvalidUri
    );
    require!(
        (MIN_DURATION..=MAX_DURATION).contains(&duration),
        DaoError::InvalidDuration
    );
    Ok(())
}
fn outcome(yes: u64, no: u64, quorum: u64) -> Result<u8> {
    let participation = yes.checked_add(no).ok_or(DaoError::Overflow)?;
    Ok(if participation >= quorum && yes > no {
        PASSED
    } else {
        REJECTED
    })
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    pub mint: Account<'info, Mint>,
    #[account(init, payer = authority, space = 8 + Dao::INIT_SPACE, seeds = [b"dao", authority.key().as_ref(), mint.key().as_ref()], bump)]
    pub dao: Account<'info, Dao>,
    #[account(init, payer = authority, seeds = [b"dao-vault", dao.key().as_ref()], bump, token::mint = mint, token::authority = dao)]
    pub vault: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}
#[derive(Accounts)]
pub struct SetPaused<'info> {
    pub authority: Signer<'info>,
    #[account(mut, has_one = authority, seeds = [b"dao", authority.key().as_ref(), dao.mint.as_ref()], bump = dao.bump)]
    pub dao: Account<'info, Dao>,
}
#[derive(Accounts)]
pub struct Stake<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(has_one = mint, seeds = [b"dao", dao.authority.as_ref(), mint.key().as_ref()], bump = dao.bump)]
    pub dao: Account<'info, Dao>,
    pub mint: Account<'info, Mint>,
    #[account(init_if_needed, payer = owner, space = 8 + Position::INIT_SPACE, seeds = [b"stake", dao.key().as_ref(), owner.key().as_ref()], bump)]
    pub position: Account<'info, Position>,
    #[account(mut, token::mint = mint, token::authority = owner)]
    pub owner_token: Account<'info, TokenAccount>,
    #[account(mut, seeds = [b"dao-vault", dao.key().as_ref()], bump = dao.vault_bump, token::mint = mint, token::authority = dao)]
    pub vault: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}
#[derive(Accounts)]
pub struct Unstake<'info> {
    pub owner: Signer<'info>,
    #[account(has_one = mint, seeds = [b"dao", dao.authority.as_ref(), mint.key().as_ref()], bump = dao.bump)]
    pub dao: Account<'info, Dao>,
    pub mint: Account<'info, Mint>,
    #[account(mut, has_one = dao, has_one = owner, seeds = [b"stake", dao.key().as_ref(), owner.key().as_ref()], bump = position.bump)]
    pub position: Account<'info, Position>,
    #[account(mut, token::mint = mint, token::authority = owner)]
    pub owner_token: Account<'info, TokenAccount>,
    #[account(mut, seeds = [b"dao-vault", dao.key().as_ref()], bump = dao.vault_bump, token::mint = mint, token::authority = dao)]
    pub vault: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}
#[derive(Accounts)]
#[instruction(id: u64)]
pub struct CreateProposal<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(mut, seeds = [b"dao", dao.authority.as_ref(), dao.mint.as_ref()], bump = dao.bump)]
    pub dao: Account<'info, Dao>,
    #[account(mut, has_one = dao, has_one = owner, seeds = [b"stake", dao.key().as_ref(), owner.key().as_ref()], bump = position.bump)]
    pub position: Account<'info, Position>,
    #[account(init, payer = owner, space = 8 + Proposal::INIT_SPACE, seeds = [b"proposal", dao.key().as_ref(), &id.to_le_bytes()], bump)]
    pub proposal: Account<'info, Proposal>,
    pub system_program: Program<'info, System>,
}
#[derive(Accounts)]
pub struct Vote<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(seeds = [b"dao", dao.authority.as_ref(), dao.mint.as_ref()], bump = dao.bump)]
    pub dao: Account<'info, Dao>,
    #[account(mut, has_one = dao, seeds = [b"stake", dao.key().as_ref(), owner.key().as_ref()], bump = position.bump, has_one = owner)]
    pub position: Account<'info, Position>,
    #[account(mut, has_one = dao, seeds = [b"proposal", dao.key().as_ref(), &proposal.id.to_le_bytes()], bump = proposal.bump)]
    pub proposal: Account<'info, Proposal>,
    #[account(init, payer = owner, space = 8 + Receipt::INIT_SPACE, seeds = [b"vote", proposal.key().as_ref(), owner.key().as_ref()], bump)]
    pub receipt: Account<'info, Receipt>,
    pub system_program: Program<'info, System>,
}
#[derive(Accounts)]
pub struct Finalize<'info> {
    #[account(mut, seeds = [b"proposal", proposal.dao.as_ref(), &proposal.id.to_le_bytes()], bump = proposal.bump)]
    pub proposal: Account<'info, Proposal>,
}
#[account]
#[derive(InitSpace)]
pub struct Dao {
    pub authority: Pubkey,
    pub mint: Pubkey,
    pub quorum: u64,
    pub proposal_stake: u64,
    pub next_proposal_id: u64,
    pub paused: bool,
    pub bump: u8,
    pub vault_bump: u8,
}
#[account]
#[derive(InitSpace)]
pub struct Position {
    pub dao: Pubkey,
    pub owner: Pubkey,
    pub amount: u64,
    pub locked_until: i64,
    pub bump: u8,
}
#[account]
#[derive(InitSpace)]
pub struct Proposal {
    pub dao: Pubkey,
    pub proposer: Pubkey,
    pub id: u64,
    #[max_len(120)]
    pub title: String,
    #[max_len(200)]
    pub uri: String,
    pub ends_at: i64,
    pub quorum: u64,
    pub yes: u64,
    pub no: u64,
    pub state: u8,
    pub bump: u8,
}
#[account]
#[derive(InitSpace)]
pub struct Receipt {
    pub proposal: Pubkey,
    pub owner: Pubkey,
    pub weight: u64,
    pub support: bool,
    pub bump: u8,
}
#[event]
pub struct ProposalCreated {
    pub proposal: Pubkey,
    pub id: u64,
    pub ends_at: i64,
}
#[event]
pub struct Voted {
    pub proposal: Pubkey,
    pub owner: Pubkey,
    pub weight: u64,
    pub support: bool,
}
#[event]
pub struct Finalized {
    pub proposal: Pubkey,
    pub state: u8,
}
#[error_code]
pub enum DaoError {
    #[msg("New stakes and proposals paused")]
    Paused,
    #[msg("Invalid quorum or proposal threshold")]
    InvalidConfig,
    #[msg("Governance mint must be immutable and non-freezable")]
    MutableMint,
    #[msg("Positive amount required")]
    ZeroAmount,
    #[msg("Amount exceeds stake")]
    InvalidAmount,
    #[msg("Stake locked until all votes finish")]
    VoteLocked,
    #[msg("No staked voting power")]
    NoPower,
    #[msg("Wrong position owner")]
    WrongOwner,
    #[msg("Wrong DAO")]
    WrongDao,
    #[msg("Refresh proposal id")]
    StaleProposalId,
    #[msg("Title must contain 1 to 120 bytes")]
    InvalidTitle,
    #[msg("HTTPS/IPFS proposal URI required, maximum 200 bytes")]
    InvalidUri,
    #[msg("Voting duration must be 1 hour to 30 days")]
    InvalidDuration,
    #[msg("Voting closed")]
    VotingClosed,
    #[msg("Voting is still open or already finalized")]
    VotingOpen,
    #[msg("Arithmetic overflow")]
    Overflow,
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn quorum_majority_and_ties_are_enforced() {
        assert_eq!(outcome(60, 40, 100).unwrap(), PASSED);
        assert_eq!(outcome(60, 40, 101).unwrap(), REJECTED);
        assert_eq!(outcome(50, 50, 100).unwrap(), REJECTED);
        assert_eq!(outcome(1, 0, 2).unwrap(), REJECTED);
        assert!(outcome(u64::MAX, 1, 1).is_err());
    }
    #[test]
    fn proposals_have_bounded_text_uri_and_lock_duration() {
        assert!(validate_proposal("Art programme", "ipfs://proposal", MIN_DURATION).is_ok());
        assert!(validate_proposal(" ", "https://example.org", MIN_DURATION).is_err());
        assert!(validate_proposal(&"é".repeat(61), "ipfs://proposal", MIN_DURATION).is_err());
        assert!(validate_proposal("Art", "javascript:alert(1)", MIN_DURATION).is_err());
        assert!(validate_proposal("Art", "https://example.org", 0).is_err());
        assert!(validate_proposal("Art", "https://example.org", MAX_DURATION + 1).is_err());
    }
}
