//! Local VM only. No network or deployment.
use multiversx_sc_scenario::{rust_biguint,DebugApi,whitebox_legacy::BlockchainStateWrapper};
use multiversx_sc_scenario::managed_token_id;
use nft_staking::{contract_obj,NftStaking};
const TOKEN: &[u8] = b"ART-abcdef";

#[test]
fn pause_blocks_deposits_but_owner_can_recover_once(){
 let mut world=BlockchainStateWrapper::new();
 let zero=rust_biguint!(0u64);
 let one=rust_biguint!(1u64);
 let owner=world.create_user_account(&zero);
 let user=world.create_user_account(&one);
 let other=world.create_user_account(&one);
 let sc=world.create_sc_account(&zero,Some(&owner),contract_obj::<DebugApi>,"file:output/nft-staking.wasm");
 world.execute_tx(&owner,&sc,&zero,|c|c.init()).assert_ok();
 world.set_nft_balance(&user, TOKEN, 1, &one, &0u32); world.set_nft_balance(&other, TOKEN, 2, &one, &0u32);
 world.execute_esdt_transfer(&user,&sc,TOKEN,1,&one,|c|c.stake_nft()).assert_ok();
 world.execute_tx(&owner,&sc,&zero,|c|c.set_paused(true)).assert_ok();
 world.execute_esdt_transfer(&other,&sc,TOKEN,2,&one,|c|c.stake_nft()).assert_user_error("paused");
 world.execute_tx(&other,&sc,&zero,|c|c.unstake_nft(1)).assert_user_error("not owner");
 world.execute_tx(&user,&sc,&zero,|c|c.unstake_nft(1)).assert_ok();
 world.check_nft_balance(&user,TOKEN,1,&one,Some(&0u32));
 world.execute_tx(&user,&sc,&zero,|c|c.unstake_nft(1)).assert_user_error("inactive");
 world.check_nft_balance(&user,TOKEN,1,&one,Some(&0u32));
}
