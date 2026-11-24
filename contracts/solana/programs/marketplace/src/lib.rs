use anchor_lang::prelude::*;
use anchor_lang::system_program::{self, Transfer};
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, CloseAccount, Mint, Token, TokenAccount, TransferChecked},
};

// Offline/local test identity. No mainnet or devnet deployment is implied.
declare_id!("2xqre66jAqcSZFh1seMkgvQNVgG6uL1gwBtKVWuwePYC");
const MAX_FEE_BPS: u16 = 1_000;
const MAX_LISTING_SECONDS: i64 = 30 * 24 * 60 * 60;

#[program]
pub mod xartists_marketplace {
    use super::*;

    // Each authority has its own market. No first-caller takeover of a global market.
    pub fn initialize(ctx: Context<Initialize>, fee_bps: u16) -> Result<()> {
        require!(fee_bps <= MAX_FEE_BPS, MarketError::InvalidFee);
        require_keys_neq!(
            ctx.accounts.treasury.key(),
            Pubkey::default(),
            MarketError::InvalidTreasury
        );
        ctx.accounts.market.set_inner(Market {
            authority: ctx.accounts.authority.key(),
            treasury: ctx.accounts.treasury.key(),
            fee_bps,
            next_listing_id: 0,
            paused: false,
            bump: ctx.bumps.market,
        });
        Ok(())
    }

    pub fn set_paused(ctx: Context<SetPaused>, paused: bool) -> Result<()> {
        ctx.accounts.market.paused = paused;
        Ok(())
    }

    pub fn list_nft(ctx: Context<ListNft>, id: u64, price: u64, expires_at: i64) -> Result<()> {
        require!(!ctx.accounts.market.paused, MarketError::Paused);
        validate_listing(price, expires_at, Clock::get()?.unix_timestamp)?;
        require!(
            id == ctx.accounts.market.next_listing_id,
            MarketError::StaleListingId
        );
        // v1: immutable, non-freezable classic SPL 1/1 only. Not pNFT, Core or Token-2022.
        require!(
            ctx.accounts.mint.decimals == 0 && ctx.accounts.mint.supply == 1,
            MarketError::UnsupportedNft
        );
        require!(
            ctx.accounts.mint.mint_authority.is_none()
                && ctx.accounts.mint.freeze_authority.is_none(),
            MarketError::UnsupportedNft
        );
        ctx.accounts.market.next_listing_id = id.checked_add(1).ok_or(MarketError::Overflow)?;
        ctx.accounts.listing.set_inner(Listing {
            market: ctx.accounts.market.key(),
            seller: ctx.accounts.seller.key(),
            mint: ctx.accounts.mint.key(),
            id,
            price,
            expires_at,
            bump: ctx.bumps.listing,
            vault_bump: ctx.bumps.vault,
        });
        token::transfer_checked(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                TransferChecked {
                    from: ctx.accounts.seller_token.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.vault.to_account_info(),
                    authority: ctx.accounts.seller.to_account_info(),
                },
            ),
            1,
            0,
        )?;
        emit!(Listed {
            listing: ctx.accounts.listing.key(),
            seller: ctx.accounts.seller.key(),
            mint: ctx.accounts.mint.key(),
            price,
            expires_at
        });
        Ok(())
    }

    pub fn buy(ctx: Context<Buy>, expected_price: u64) -> Result<()> {
        require!(!ctx.accounts.market.paused, MarketError::Paused);
        require!(
            Clock::get()?.unix_timestamp < ctx.accounts.listing.expires_at,
            MarketError::Expired
        );
        require!(
            expected_price == ctx.accounts.listing.price,
            MarketError::PriceChanged
        );
        require_keys_neq!(
            ctx.accounts.buyer.key(),
            ctx.accounts.seller.key(),
            MarketError::SelfPurchase
        );
        let (fee, proceeds) = split_price(expected_price, ctx.accounts.market.fee_bps)?;
        // All payments and NFT delivery are one instruction, with full runtime rollback.
        if fee > 0 {
            system_program::transfer(
                CpiContext::new(
                    ctx.accounts.system_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.buyer.to_account_info(),
                        to: ctx.accounts.treasury.to_account_info(),
                    },
                ),
                fee,
            )?;
        }
        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.buyer.to_account_info(),
                    to: ctx.accounts.seller.to_account_info(),
                },
            ),
            proceeds,
        )?;
        let market = ctx.accounts.market.key();
        let id = ctx.accounts.listing.id.to_le_bytes();
        let bump = [ctx.accounts.listing.bump];
        let seeds: &[&[u8]] = &[b"listing", market.as_ref(), &id, &bump];
        release_nft(
            ctx.accounts.vault.to_account_info(),
            ctx.accounts.buyer_token.to_account_info(),
            ctx.accounts.mint.to_account_info(),
            ctx.accounts.listing.to_account_info(),
            ctx.accounts.seller.to_account_info(),
            ctx.accounts.token_program.to_account_info(),
            seeds,
        )?;
        emit!(Purchased {
            listing: ctx.accounts.listing.key(),
            buyer: ctx.accounts.buyer.key(),
            price: expected_price,
            fee
        });
        Ok(())
    }

    pub fn cancel(ctx: Context<Cancel>) -> Result<()> {
        // Cancellation stays available when paused or expired. Admins cannot seize NFTs.
        let market = ctx.accounts.market.key();
        let id = ctx.accounts.listing.id.to_le_bytes();
        let bump = [ctx.accounts.listing.bump];
        let seeds: &[&[u8]] = &[b"listing", market.as_ref(), &id, &bump];
        release_nft(
            ctx.accounts.vault.to_account_info(),
            ctx.accounts.seller_token.to_account_info(),
            ctx.accounts.mint.to_account_info(),
            ctx.accounts.listing.to_account_info(),
            ctx.accounts.seller.to_account_info(),
            ctx.accounts.token_program.to_account_info(),
            seeds,
        )?;
        emit!(Cancelled {
            listing: ctx.accounts.listing.key(),
            seller: ctx.accounts.seller.key()
        });
        Ok(())
    }
}

fn validate_listing(price: u64, expires_at: i64, now: i64) -> Result<()> {
    require!(price > 0, MarketError::InvalidPrice);
    let max = now
        .checked_add(MAX_LISTING_SECONDS)
        .ok_or(MarketError::Overflow)?;
    require!(
        expires_at > now && expires_at <= max,
        MarketError::InvalidExpiry
    );
    Ok(())
}
fn split_price(price: u64, fee_bps: u16) -> Result<(u64, u64)> {
    require!(price > 0, MarketError::InvalidPrice);
    require!(fee_bps <= MAX_FEE_BPS, MarketError::InvalidFee);
    let fee = u64::try_from((price as u128) * (fee_bps as u128) / 10_000)
        .map_err(|_| MarketError::Overflow)?;
    Ok((fee, price.checked_sub(fee).ok_or(MarketError::Overflow)?))
}
fn release_nft<'info>(
    vault: AccountInfo<'info>,
    destination: AccountInfo<'info>,
    mint: AccountInfo<'info>,
    listing: AccountInfo<'info>,
    seller: AccountInfo<'info>,
    program: AccountInfo<'info>,
    seeds: &[&[u8]],
) -> Result<()> {
    token::transfer_checked(
        CpiContext::new_with_signer(
            program.clone(),
            TransferChecked {
                from: vault.clone(),
                mint,
                to: destination,
                authority: listing.clone(),
            },
            &[seeds],
        ),
        1,
        0,
    )?;
    token::close_account(CpiContext::new_with_signer(
        program,
        CloseAccount {
            account: vault,
            destination: seller,
            authority: listing,
        },
        &[seeds],
    ))
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    /// CHECK: immutable fee recipient, not an execution authority.
    pub treasury: UncheckedAccount<'info>,
    #[account(init, payer = authority, space = 8 + Market::INIT_SPACE, seeds = [b"market", authority.key().as_ref()], bump)]
    pub market: Account<'info, Market>,
    pub system_program: Program<'info, System>,
}
#[derive(Accounts)]
pub struct SetPaused<'info> {
    pub authority: Signer<'info>,
    #[account(mut, has_one = authority, seeds = [b"market", authority.key().as_ref()], bump = market.bump)]
    pub market: Account<'info, Market>,
}
#[derive(Accounts)]
#[instruction(id: u64)]
pub struct ListNft<'info> {
    #[account(mut)]
    pub seller: Signer<'info>,
    #[account(mut, seeds = [b"market", market.authority.as_ref()], bump = market.bump)]
    pub market: Account<'info, Market>,
    pub mint: Account<'info, Mint>,
    #[account(mut, token::mint = mint, token::authority = seller)]
    pub seller_token: Account<'info, TokenAccount>,
    #[account(init, payer = seller, space = 8 + Listing::INIT_SPACE, seeds = [b"listing", market.key().as_ref(), &id.to_le_bytes()], bump)]
    pub listing: Account<'info, Listing>,
    #[account(init, payer = seller, seeds = [b"vault", listing.key().as_ref()], bump, token::mint = mint, token::authority = listing)]
    pub vault: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}
#[derive(Accounts)]
pub struct Buy<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,
    #[account(seeds = [b"market", market.authority.as_ref()], bump = market.bump)]
    pub market: Account<'info, Market>,
    /// CHECK: matched by listing.has_one, receives seller proceeds and rent.
    #[account(mut)]
    pub seller: UncheckedAccount<'info>,
    /// CHECK: matched to the market's immutable fee recipient.
    #[account(mut, address = market.treasury)]
    pub treasury: UncheckedAccount<'info>,
    pub mint: Account<'info, Mint>,
    #[account(mut, close = seller, has_one = market, has_one = seller, has_one = mint,
        seeds = [b"listing", market.key().as_ref(), &listing.id.to_le_bytes()], bump = listing.bump)]
    pub listing: Account<'info, Listing>,
    #[account(mut, seeds = [b"vault", listing.key().as_ref()], bump = listing.vault_bump, token::mint = mint, token::authority = listing)]
    pub vault: Account<'info, TokenAccount>,
    #[account(init_if_needed, payer = buyer, associated_token::mint = mint, associated_token::authority = buyer)]
    pub buyer_token: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}
#[derive(Accounts)]
pub struct Cancel<'info> {
    #[account(mut)]
    pub seller: Signer<'info>,
    #[account(seeds = [b"market", market.authority.as_ref()], bump = market.bump)]
    pub market: Account<'info, Market>,
    pub mint: Account<'info, Mint>,
    #[account(mut, close = seller, has_one = market, has_one = seller, has_one = mint,
        seeds = [b"listing", market.key().as_ref(), &listing.id.to_le_bytes()], bump = listing.bump)]
    pub listing: Account<'info, Listing>,
    #[account(mut, seeds = [b"vault", listing.key().as_ref()], bump = listing.vault_bump, token::mint = mint, token::authority = listing)]
    pub vault: Account<'info, TokenAccount>,
    #[account(init_if_needed, payer = seller, associated_token::mint = mint, associated_token::authority = seller)]
    pub seller_token: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}
#[account]
#[derive(InitSpace)]
pub struct Market {
    pub authority: Pubkey,
    pub treasury: Pubkey,
    pub fee_bps: u16,
    pub next_listing_id: u64,
    pub paused: bool,
    pub bump: u8,
}
#[account]
#[derive(InitSpace)]
pub struct Listing {
    pub market: Pubkey,
    pub seller: Pubkey,
    pub mint: Pubkey,
    pub id: u64,
    pub price: u64,
    pub expires_at: i64,
    pub bump: u8,
    pub vault_bump: u8,
}
#[event]
pub struct Listed {
    pub listing: Pubkey,
    pub seller: Pubkey,
    pub mint: Pubkey,
    pub price: u64,
    pub expires_at: i64,
}
#[event]
pub struct Purchased {
    pub listing: Pubkey,
    pub buyer: Pubkey,
    pub price: u64,
    pub fee: u64,
}
#[event]
pub struct Cancelled {
    pub listing: Pubkey,
    pub seller: Pubkey,
}
#[error_code]
pub enum MarketError {
    #[msg("Market paused")]
    Paused,
    #[msg("Invalid fee")]
    InvalidFee,
    #[msg("Invalid treasury")]
    InvalidTreasury,
    #[msg("Positive price required")]
    InvalidPrice,
    #[msg("Expiry must be within 30 days")]
    InvalidExpiry,
    #[msg("Unsupported NFT: immutable non-freezable classic SPL 1/1 only")]
    UnsupportedNft,
    #[msg("Refresh the listing id")]
    StaleListingId,
    #[msg("Listing expired")]
    Expired,
    #[msg("Price changed")]
    PriceChanged,
    #[msg("Seller cannot buy their own listing")]
    SelfPurchase,
    #[msg("Arithmetic overflow")]
    Overflow,
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn fees_conserve_every_lamport_even_at_u64_max() {
        for price in [1, 99, 10_001, u64::MAX] {
            for bps in [0, 1, 300, MAX_FEE_BPS] {
                let (fee, proceeds) = split_price(price, bps).unwrap();
                assert_eq!((fee as u128) + (proceeds as u128), price as u128);
                assert!(fee <= price / 10);
            }
        }
        assert!(split_price(0, 300).is_err());
        assert!(split_price(100, MAX_FEE_BPS + 1).is_err());
    }
    #[test]
    fn stale_and_unbounded_listings_are_rejected() {
        assert!(validate_listing(1, 1001, 1000).is_ok());
        assert!(validate_listing(0, 1001, 1000).is_err());
        assert!(validate_listing(1, 1000, 1000).is_err());
        assert!(validate_listing(1, 1000 + MAX_LISTING_SECONDS + 1, 1000).is_err());
        assert!(validate_listing(1, i64::MAX, i64::MAX - 1).is_err());
    }
}
