//! Local VM only. No network or deployment.
use multiversx_sc_scenario::{rust_biguint,DebugApi,whitebox_legacy::BlockchainStateWrapper};
use multiversx_sc_scenario::{managed_token_id,managed_biguint};
use tro_staking::{contract_obj,TroStaking};
const TOKEN: &[u8] = b"ART-abcdef";

#[test]
fn pause_blocks_deposits_but_owner_can_recover_once(){
 let mut world=BlockchainStateWrapper::new();
 let zero=rust_biguint!(0u64);
 let one=rust_biguint!(1u64);
 let owner=world.create_user_account(&zero);
 let user=world.create_user_account(&one);
 let other=world.create_user_account(&one);
 let sc=world.create_sc_account(&zero,Some(&owner),contract_obj::<DebugApi>,"file:output/tro-staking.wasm");
 world.execute_tx(&owner,&sc,&zero,|c|c.init(managed_token_id!(TOKEN))).assert_ok();
 world.set_esdt_balance(&user,TOKEN,&one); world.set_esdt_balance(&other,TOKEN,&one);
 world.execute_esdt_transfer(&user,&sc,TOKEN,0,&one,|c|c.stake()).assert_ok();
 world.execute_tx(&owner,&sc,&zero,|c|c.set_paused(true)).assert_ok();
 world.execute_esdt_transfer(&other,&sc,TOKEN,0,&one,|c|c.stake()).assert_user_error("paused");
 world.execute_tx(&other,&sc,&zero,|c|c.unstake(managed_biguint!(1))).assert_user_error("insufficient");
 world.execute_tx(&user,&sc,&zero,|c|c.unstake(managed_biguint!(1))).assert_ok();
 assert_eq!(world.get_esdt_balance(&user,TOKEN,0),one);
 world.execute_tx(&user,&sc,&zero,|c|c.unstake(managed_biguint!(1))).assert_user_error("insufficient");
 assert_eq!(world.get_esdt_balance(&user,TOKEN,0),one);
}
