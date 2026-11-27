//! Local VM only. No network or deployment.
use multiversx_sc_scenario::{rust_biguint,DebugApi,whitebox_legacy::BlockchainStateWrapper};
use multiversx_sc::types::ManagedBuffer;
use agent_stake_escrow::{contract_obj,AgentStakeEscrow};

#[test]
fn pause_blocks_deposits_but_owner_can_recover_once(){
 let mut world=BlockchainStateWrapper::new();
 let zero=rust_biguint!(0u64);
 let one=rust_biguint!(1u64);
 let owner=world.create_user_account(&zero);
 let user=world.create_user_account(&one);
 let other=world.create_user_account(&one);
 let sc=world.create_sc_account(&zero,Some(&owner),contract_obj::<DebugApi>,"file:output/agent-stake-escrow.wasm");
 world.execute_tx(&owner,&sc,&zero,|c|c.init()).assert_ok();
 
 world.execute_tx(&user,&sc,&one,|c|c.open_stake(ManagedBuffer::new_from_bytes(b"test-agent"))).assert_ok();
 world.execute_tx(&owner,&sc,&zero,|c|c.set_paused(true)).assert_ok();
 world.execute_tx(&other,&sc,&one,|c|c.open_stake(ManagedBuffer::new_from_bytes(b"test-agent"))).assert_user_error("paused");
 world.execute_tx(&other,&sc,&zero,|c|c.close_stake(1)).assert_user_error("only owner");
 world.execute_tx(&user,&sc,&zero,|c|c.close_stake(1)).assert_ok();
 assert_eq!(world.get_egld_balance(&user),one);
 world.execute_tx(&user,&sc,&zero,|c|c.close_stake(1)).assert_user_error("inactive");
 assert_eq!(world.get_egld_balance(&user),one);
}
