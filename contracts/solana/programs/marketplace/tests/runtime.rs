//! Native Solana runtime tests, with in-memory lamports and generated test-only signers.
//! No RPC, network, owner wallet, airdrop, deployment, or transaction broadcast.
use anchor_lang::{AccountDeserialize, InstructionData, ToAccountMetas};
use anchor_spl::{associated_token::spl_associated_token_account as ata, token::spl_token};
use solana_program_test::{ProgramTest, ProgramTestContext};
use solana_sdk::{
    account::{Account, AccountSharedData},
    clock::Clock,
    instruction::Instruction,
    program_option::COption,
    program_pack::Pack,
    pubkey::Pubkey,
    signature::{Keypair, Signer},
    system_instruction, system_program,
    transaction::Transaction,
};
use std::sync::atomic::{AtomicU32, Ordering};
use xartists_governance as dao;
use xartists_marketplace as market;

async fn setup() -> ProgramTestContext {
    let mut test = ProgramTest::new("xartists_marketplace", market::ID, None);
    test.add_program("xartists_governance", dao::ID, None);
    // Use ProgramTest's bundled canonical SPL SBF programs, including ATA creation.
    test.start_with_context().await
}
static SEQUENCE: AtomicU32 = AtomicU32::new(1);
async fn send(
    ctx: &mut ProgramTestContext,
    instructions: Vec<Instruction>,
    signers: &[&Keypair],
) -> Result<(), String> {
    let mut ixs = vec![
        solana_sdk::compute_budget::ComputeBudgetInstruction::set_compute_unit_limit(
            350_000 + SEQUENCE.fetch_add(1, Ordering::Relaxed),
        ),
    ];
    ixs.extend(instructions);
    let mut keys = vec![&ctx.payer];
    keys.extend_from_slice(signers);
    let hash = ctx.banks_client.get_latest_blockhash().await.unwrap();
    let tx = Transaction::new_signed_with_payer(&ixs, Some(&ctx.payer.pubkey()), &keys, hash);
    ctx.banks_client
        .process_transaction(tx)
        .await
        .map_err(|e| format!("{e:?}"))
}
async fn fund(ctx: &mut ProgramTestContext, who: &Keypair) {
    send(
        ctx,
        vec![system_instruction::transfer(
            &ctx.payer.pubkey(),
            &who.pubkey(),
            5_000_000_000,
        )],
        &[],
    )
    .await
    .unwrap();
}
async fn balance(ctx: &mut ProgramTestContext, who: Pubkey) -> u64 {
    ctx.banks_client.get_balance(who).await.unwrap()
}
async fn token_amount(ctx: &mut ProgramTestContext, key: Pubkey) -> u64 {
    let account = ctx.banks_client.get_account(key).await.unwrap().unwrap();
    spl_token::state::Account::unpack(&account.data)
        .unwrap()
        .amount
}
async fn mint(
    ctx: &mut ProgramTestContext,
    owner: &Keypair,
    supply: u64,
    decimals: u8,
    immutable: bool,
) -> (Pubkey, Pubkey) {
    let key = Keypair::new();
    let rent = ctx.banks_client.get_rent().await.unwrap();
    let account = ata::get_associated_token_address(&owner.pubkey(), &key.pubkey());
    let mut ixs = vec![
        system_instruction::create_account(
            &ctx.payer.pubkey(),
            &key.pubkey(),
            rent.minimum_balance(spl_token::state::Mint::LEN),
            spl_token::state::Mint::LEN as u64,
            &spl_token::ID,
        ),
        spl_token::instruction::initialize_mint2(
            &spl_token::ID,
            &key.pubkey(),
            &owner.pubkey(),
            None,
            decimals,
        )
        .unwrap(),
        ata::instruction::create_associated_token_account(
            &ctx.payer.pubkey(),
            &owner.pubkey(),
            &key.pubkey(),
            &spl_token::ID,
        ),
        spl_token::instruction::mint_to(
            &spl_token::ID,
            &key.pubkey(),
            &account,
            &owner.pubkey(),
            &[],
            supply,
        )
        .unwrap(),
    ];
    if immutable {
        ixs.push(
            spl_token::instruction::set_authority(
                &spl_token::ID,
                &key.pubkey(),
                None,
                spl_token::instruction::AuthorityType::MintTokens,
                &owner.pubkey(),
                &[],
            )
            .unwrap(),
        );
    }
    send(ctx, ixs, &[&key, owner]).await.unwrap();
    (key.pubkey(), account)
}
fn market_pda(authority: &Pubkey) -> Pubkey {
    Pubkey::find_program_address(&[b"market", authority.as_ref()], &market::ID).0
}
fn listing_pda(market_key: &Pubkey, id: u64) -> (Pubkey, Pubkey) {
    let listing = Pubkey::find_program_address(
        &[b"listing", market_key.as_ref(), &id.to_le_bytes()],
        &market::ID,
    )
    .0;
    let vault = Pubkey::find_program_address(&[b"vault", listing.as_ref()], &market::ID).0;
    (listing, vault)
}
fn list_ix(
    market_key: Pubkey,
    seller: Pubkey,
    mint: Pubkey,
    token: Pubkey,
    id: u64,
    price: u64,
    expires_at: i64,
) -> Instruction {
    let (listing, vault) = listing_pda(&market_key, id);
    Instruction {
        program_id: market::ID,
        accounts: market::accounts::ListNft {
            seller,
            market: market_key,
            mint,
            seller_token: token,
            listing,
            vault,
            token_program: spl_token::ID,
            system_program: system_program::ID,
        }
        .to_account_metas(None),
        data: market::instruction::ListNft {
            id,
            price,
            expires_at,
        }
        .data(),
    }
}
fn buy_ix(
    market_key: Pubkey,
    seller: Pubkey,
    buyer: Pubkey,
    treasury: Pubkey,
    mint: Pubkey,
    id: u64,
    price: u64,
) -> Instruction {
    let (listing, vault) = listing_pda(&market_key, id);
    Instruction {
        program_id: market::ID,
        accounts: market::accounts::Buy {
            buyer,
            market: market_key,
            seller,
            treasury,
            mint,
            listing,
            vault,
            buyer_token: ata::get_associated_token_address(&buyer, &mint),
            token_program: spl_token::ID,
            associated_token_program: ata::ID,
            system_program: system_program::ID,
        }
        .to_account_metas(None),
        data: market::instruction::Buy {
            expected_price: price,
        }
        .data(),
    }
}
fn cancel_ix(market_key: Pubkey, seller: Pubkey, mint: Pubkey, id: u64) -> Instruction {
    let (listing, vault) = listing_pda(&market_key, id);
    Instruction {
        program_id: market::ID,
        accounts: market::accounts::Cancel {
            seller,
            market: market_key,
            mint,
            listing,
            vault,
            seller_token: ata::get_associated_token_address(&seller, &mint),
            token_program: spl_token::ID,
            associated_token_program: ata::ID,
            system_program: system_program::ID,
        }
        .to_account_metas(None),
        data: market::instruction::Cancel {}.data(),
    }
}
#[tokio::test]
async fn escrow_enforces_signer_price_treasury_then_moves_one_nft_and_exact_funds() {
    let mut ctx = setup().await;
    let seller = Keypair::new();
    let buyer = Keypair::new();
    let attacker = Keypair::new();
    let treasury = Keypair::new();
    for owner in [&seller, &buyer, &attacker, &treasury] {
        fund(&mut ctx, owner).await;
    }
    let (mint_key, seller_token) = mint(&mut ctx, &seller, 1, 0, true).await;
    let market_key = market_pda(&seller.pubkey());
    send(
        &mut ctx,
        vec![Instruction {
            program_id: market::ID,
            accounts: market::accounts::Initialize {
                authority: seller.pubkey(),
                treasury: treasury.pubkey(),
                market: market_key,
                system_program: system_program::ID,
            }
            .to_account_metas(None),
            data: market::instruction::Initialize { fee_bps: 300 }.data(),
        }],
        &[&seller],
    )
    .await
    .unwrap();
    let now: Clock = ctx.banks_client.get_sysvar().await.unwrap();
    let price = 1_000_000;
    send(
        &mut ctx,
        vec![list_ix(
            market_key,
            seller.pubkey(),
            mint_key,
            seller_token,
            0,
            price,
            now.unix_timestamp + 3600,
        )],
        &[&seller],
    )
    .await
    .unwrap();
    let (listing, vault) = listing_pda(&market_key, 0);
    assert_eq!(token_amount(&mut ctx, seller_token).await, 0);
    assert_eq!(token_amount(&mut ctx, vault).await, 1);
    let seller_before = balance(&mut ctx, seller.pubkey()).await;
    let buyer_before = balance(&mut ctx, buyer.pubkey()).await;
    let treasury_before = balance(&mut ctx, treasury.pubkey()).await;
    let rent = balance(&mut ctx, listing).await + balance(&mut ctx, vault).await;
    let bad_price = buy_ix(
        market_key,
        seller.pubkey(),
        buyer.pubkey(),
        treasury.pubkey(),
        mint_key,
        0,
        price + 1,
    );
    assert!(send(&mut ctx, vec![bad_price], &[&buyer])
        .await
        .unwrap_err()
        .contains("Custom(6008)"));
    assert_eq!(
        balance(&mut ctx, buyer.pubkey()).await,
        buyer_before,
        "failed instruction rolls back ATA rent and payments"
    );
    assert!(send(
        &mut ctx,
        vec![buy_ix(
            market_key,
            seller.pubkey(),
            buyer.pubkey(),
            attacker.pubkey(),
            mint_key,
            0,
            price
        )],
        &[&buyer]
    )
    .await
    .is_err());
    assert!(send(
        &mut ctx,
        vec![cancel_ix(market_key, attacker.pubkey(), mint_key, 0)],
        &[&attacker]
    )
    .await
    .is_err());
    assert_eq!(token_amount(&mut ctx, vault).await, 1);
    assert_eq!(balance(&mut ctx, treasury.pubkey()).await, treasury_before);
    // A recipient account frozen before its mint's freeze authority was revoked is
    // still a possible chain state. Force a delivery CPI failure after payments,
    // and verify that the real runtime rolls back every payment.
    let buyer_ata = ata::get_associated_token_address(&buyer.pubkey(), &mint_key);
    let rent_cfg = ctx.banks_client.get_rent().await.unwrap();
    let mut receiver = spl_token::state::Account {
        mint: mint_key,
        owner: buyer.pubkey(),
        amount: 0,
        delegate: COption::None,
        state: spl_token::state::AccountState::Frozen,
        is_native: COption::None,
        delegated_amount: 0,
        close_authority: COption::None,
    };
    let mut receiver_data = vec![0_u8; spl_token::state::Account::LEN];
    spl_token::state::Account::pack(receiver, &mut receiver_data).unwrap();
    let mut receiver_account = Account {
        lamports: rent_cfg.minimum_balance(spl_token::state::Account::LEN),
        data: receiver_data,
        owner: spl_token::ID,
        executable: false,
        rent_epoch: 0,
    };
    ctx.set_account(
        &buyer_ata,
        &AccountSharedData::from(receiver_account.clone()),
    );
    assert!(send(
        &mut ctx,
        vec![buy_ix(
            market_key,
            seller.pubkey(),
            buyer.pubkey(),
            treasury.pubkey(),
            mint_key,
            0,
            price
        )],
        &[&buyer]
    )
    .await
    .is_err());
    assert_eq!(balance(&mut ctx, seller.pubkey()).await, seller_before);
    assert_eq!(balance(&mut ctx, treasury.pubkey()).await, treasury_before);
    assert_eq!(balance(&mut ctx, buyer.pubkey()).await, buyer_before);
    assert_eq!(token_amount(&mut ctx, vault).await, 1);
    receiver.state = spl_token::state::AccountState::Initialized;
    spl_token::state::Account::pack(receiver, &mut receiver_account.data).unwrap();
    ctx.set_account(&buyer_ata, &AccountSharedData::from(receiver_account));
    send(
        &mut ctx,
        vec![buy_ix(
            market_key,
            seller.pubkey(),
            buyer.pubkey(),
            treasury.pubkey(),
            mint_key,
            0,
            price,
        )],
        &[&buyer],
    )
    .await
    .unwrap();
    assert_eq!(
        token_amount(
            &mut ctx,
            ata::get_associated_token_address(&buyer.pubkey(), &mint_key)
        )
        .await,
        1
    );
    assert_eq!(
        balance(&mut ctx, treasury.pubkey()).await,
        treasury_before + 30_000
    );
    assert_eq!(
        balance(&mut ctx, seller.pubkey()).await,
        seller_before + 970_000 + rent
    );
    assert!(ctx
        .banks_client
        .get_account(listing)
        .await
        .unwrap()
        .is_none());
    assert!(ctx.banks_client.get_account(vault).await.unwrap().is_none());
    assert!(
        send(
            &mut ctx,
            vec![buy_ix(
                market_key,
                seller.pubkey(),
                buyer.pubkey(),
                treasury.pubkey(),
                mint_key,
                0,
                price
            )],
            &[&buyer]
        )
        .await
        .is_err(),
        "closed listing cannot be replayed"
    );
    let (second, second_token) = mint(&mut ctx, &seller, 1, 0, true).await;
    send(
        &mut ctx,
        vec![list_ix(
            market_key,
            seller.pubkey(),
            second,
            second_token,
            1,
            price,
            now.unix_timestamp + 3600,
        )],
        &[&seller],
    )
    .await
    .unwrap();
    let pause = Instruction {
        program_id: market::ID,
        accounts: market::accounts::SetPaused {
            authority: seller.pubkey(),
            market: market_key,
        }
        .to_account_metas(None),
        data: market::instruction::SetPaused { paused: true }.data(),
    };
    send(&mut ctx, vec![pause], &[&seller]).await.unwrap();
    send(
        &mut ctx,
        vec![cancel_ix(market_key, seller.pubkey(), second, 1)],
        &[&seller],
    )
    .await
    .unwrap();
    assert_eq!(
        token_amount(&mut ctx, second_token).await,
        1,
        "pause does not trap a seller's NFT"
    );
}

fn dao_keys(authority: &Pubkey, mint: &Pubkey, owner: &Pubkey) -> (Pubkey, Pubkey, Pubkey) {
    let dao =
        Pubkey::find_program_address(&[b"dao", authority.as_ref(), mint.as_ref()], &dao::ID).0;
    let vault = Pubkey::find_program_address(&[b"dao-vault", dao.as_ref()], &dao::ID).0;
    let position =
        Pubkey::find_program_address(&[b"stake", dao.as_ref(), owner.as_ref()], &dao::ID).0;
    (dao, vault, position)
}
async fn read_proposal(ctx: &mut ProgramTestContext, key: Pubkey) -> dao::Proposal {
    let row = ctx.banks_client.get_account(key).await.unwrap().unwrap();
    dao::Proposal::try_deserialize(&mut row.data.as_slice()).unwrap()
}
#[tokio::test]
async fn governance_locks_real_stake_rejects_duplicate_votes_and_unlocks_after_finalization() {
    let mut ctx = setup().await;
    let owner = Keypair::new();
    let attacker = Keypair::new();
    fund(&mut ctx, &owner).await;
    fund(&mut ctx, &attacker).await;
    let (mint_key, owner_token) = mint(&mut ctx, &owner, 1_000_000_000, 6, true).await;
    let (dao_key, vault, position) = dao_keys(&owner.pubkey(), &mint_key, &owner.pubkey());
    send(
        &mut ctx,
        vec![Instruction {
            program_id: dao::ID,
            accounts: dao::accounts::Initialize {
                authority: owner.pubkey(),
                mint: mint_key,
                dao: dao_key,
                vault,
                token_program: spl_token::ID,
                system_program: system_program::ID,
            }
            .to_account_metas(None),
            data: dao::instruction::Initialize {
                quorum: 100_000_000,
                proposal_stake: 1_000_000,
            }
            .data(),
        }],
        &[&owner],
    )
    .await
    .unwrap();
    send(
        &mut ctx,
        vec![Instruction {
            program_id: dao::ID,
            accounts: dao::accounts::Stake {
                owner: owner.pubkey(),
                dao: dao_key,
                mint: mint_key,
                position,
                owner_token,
                vault,
                token_program: spl_token::ID,
                system_program: system_program::ID,
            }
            .to_account_metas(None),
            data: dao::instruction::Stake {
                amount: 100_000_000,
            }
            .data(),
        }],
        &[&owner],
    )
    .await
    .unwrap();
    assert_eq!(token_amount(&mut ctx, vault).await, 100_000_000);
    let proposal = Pubkey::find_program_address(
        &[b"proposal", dao_key.as_ref(), &0_u64.to_le_bytes()],
        &dao::ID,
    )
    .0;
    send(
        &mut ctx,
        vec![Instruction {
            program_id: dao::ID,
            accounts: dao::accounts::CreateProposal {
                owner: owner.pubkey(),
                dao: dao_key,
                position,
                proposal,
                system_program: system_program::ID,
            }
            .to_account_metas(None),
            data: dao::instruction::CreateProposal {
                id: 0,
                title: "Artist exhibition".into(),
                uri: "ipfs://proposal-proof".into(),
                duration: 3600,
            }
            .data(),
        }],
        &[&owner],
    )
    .await
    .unwrap();
    // Pausing new participation cannot censor a vote on an existing proposal.
    send(
        &mut ctx,
        vec![Instruction {
            program_id: dao::ID,
            accounts: dao::accounts::SetPaused {
                authority: owner.pubkey(),
                dao: dao_key,
            }
            .to_account_metas(None),
            data: dao::instruction::SetPaused { paused: true }.data(),
        }],
        &[&owner],
    )
    .await
    .unwrap();
    let receipt = Pubkey::find_program_address(
        &[b"vote", proposal.as_ref(), owner.pubkey().as_ref()],
        &dao::ID,
    )
    .0;
    let vote = Instruction {
        program_id: dao::ID,
        accounts: dao::accounts::Vote {
            owner: owner.pubkey(),
            dao: dao_key,
            position,
            proposal,
            receipt,
            system_program: system_program::ID,
        }
        .to_account_metas(None),
        data: dao::instruction::Vote { support: true }.data(),
    };
    send(&mut ctx, vec![vote.clone()], &[&owner]).await.unwrap();
    assert!(send(&mut ctx, vec![vote], &[&owner]).await.is_err());
    assert_eq!(read_proposal(&mut ctx, proposal).await.yes, 100_000_000);
    let withdraw = |who| Instruction {
        program_id: dao::ID,
        accounts: dao::accounts::Unstake {
            owner: who,
            dao: dao_key,
            mint: mint_key,
            position,
            owner_token,
            vault,
            token_program: spl_token::ID,
        }
        .to_account_metas(None),
        data: dao::instruction::Unstake {
            amount: 100_000_000,
        }
        .data(),
    };
    assert!(
        send(&mut ctx, vec![withdraw(attacker.pubkey())], &[&attacker])
            .await
            .is_err()
    );
    assert!(send(&mut ctx, vec![withdraw(owner.pubkey())], &[&owner])
        .await
        .is_err());
    let finalize = Instruction {
        program_id: dao::ID,
        accounts: dao::accounts::Finalize { proposal }.to_account_metas(None),
        data: dao::instruction::Finalize {}.data(),
    };
    assert!(send(&mut ctx, vec![finalize.clone()], &[]).await.is_err());
    let mut clock: Clock = ctx.banks_client.get_sysvar().await.unwrap();
    clock.unix_timestamp = read_proposal(&mut ctx, proposal).await.ends_at;
    ctx.set_sysvar(&clock);
    send(&mut ctx, vec![finalize], &[]).await.unwrap();
    assert_eq!(read_proposal(&mut ctx, proposal).await.state, 1);
    send(&mut ctx, vec![withdraw(owner.pubkey())], &[&owner])
        .await
        .unwrap();
    assert_eq!(token_amount(&mut ctx, vault).await, 0);
    assert_eq!(token_amount(&mut ctx, owner_token).await, 1_000_000_000);
    assert!(
        ctx.banks_client
            .get_account(receipt)
            .await
            .unwrap()
            .is_some(),
        "vote proof survives withdrawal"
    );
}
