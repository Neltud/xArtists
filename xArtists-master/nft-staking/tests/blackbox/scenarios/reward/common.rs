use multiversx_sc_scenario::{
    imports::SetStateStep, rust_biguint, ExpectMessage, ExpectValue, ScenarioTxRun,
};
use nft_staking::constants::{DEFAULT_NFT_SCORE, ERR_NO_REWARDS_TO_CLAIM, ERR_STAKING_DISABLED};

use crate::{
    blackbox::{
        helpers::{
            check_aggregated_staking_score, check_pending_reward, check_user_staking_score,
            send_claim_rewards_tx, send_disable_staking_tx, send_distribute_rewards_tx,
            send_set_distribution_plan_tx, send_stake_tx,
        },
        test_setup::setup_world_with_contract,
    },
    config::{
        NFT_TOKEN_ID, OWNER_ADDRESS, REWARD_TOKEN_ID_1, REWARD_TOKEN_ID_2, SC_ADDRESS,
        SFT_TOKEN_ID, USER_ADDRESS,
    },
};

#[test]
fn pending_reward_is_properly_calculated_for_manually_distributed_rewards() {
    let mut world = setup_world_with_contract();

    send_stake_tx(&mut world, &USER_ADDRESS, &[&(NFT_TOKEN_ID, 1, 1)]);
    send_distribute_rewards_tx(&mut world, REWARD_TOKEN_ID_1, DEFAULT_NFT_SCORE);

    check_pending_reward(
        &mut world,
        &USER_ADDRESS,
        &REWARD_TOKEN_ID_1,
        rust_biguint!(DEFAULT_NFT_SCORE),
    );
}

#[test]
fn pending_reward_is_properly_calculated_for_planned_distributed_rewards() {
    let mut world = setup_world_with_contract();

    send_set_distribution_plan_tx(&mut world, REWARD_TOKEN_ID_1, 0, 100, 100); // 1 tokens per round
    send_stake_tx(&mut world, &USER_ADDRESS, &[&(NFT_TOKEN_ID, 1, 1)]);

    world.set_state_step(SetStateStep::new().block_round(1)); // advance to next round
    send_stake_tx(&mut world, &USER_ADDRESS, &[&(NFT_TOKEN_ID, 2, 1)]);

    check_pending_reward(
        &mut world,
        &USER_ADDRESS,
        &REWARD_TOKEN_ID_1,
        rust_biguint!(1),
    );
}

#[test]
fn pending_reward_is_properly_calculated_for_combined_reward_sources() {
    let mut world = setup_world_with_contract();

    send_set_distribution_plan_tx(&mut world, REWARD_TOKEN_ID_1, 0, 100, 100); // 1 tokens per round
    send_stake_tx(&mut world, &USER_ADDRESS, &[&(NFT_TOKEN_ID, 1, 1)]);

    world.set_state_step(SetStateStep::new().block_round(1)); // advance to next round

    send_distribute_rewards_tx(&mut world, REWARD_TOKEN_ID_1, 1);
    send_distribute_rewards_tx(&mut world, REWARD_TOKEN_ID_2, 1);

    check_pending_reward(
        &mut world,
        &USER_ADDRESS,
        &REWARD_TOKEN_ID_1,
        rust_biguint!(2),
    );
    check_pending_reward(
        &mut world,
        &USER_ADDRESS,
        &REWARD_TOKEN_ID_2,
        rust_biguint!(1),
    );
}

#[test]
fn reward_should_be_distributed_proportionally_to_stake_score() {
    let mut world = setup_world_with_contract();

    send_stake_tx(&mut world, &USER_ADDRESS, &[&(NFT_TOKEN_ID, 1, 1)]); // 25%
    send_stake_tx(&mut world, &OWNER_ADDRESS, &[&(SFT_TOKEN_ID, 1, 3)]); // 75%

    send_distribute_rewards_tx(&mut world, REWARD_TOKEN_ID_1, 4); // 4 tokens in total

    check_pending_reward(
        &mut world,
        &USER_ADDRESS,
        &REWARD_TOKEN_ID_1,
        rust_biguint!(1),
    );
    check_pending_reward(
        &mut world,
        &OWNER_ADDRESS,
        &REWARD_TOKEN_ID_1,
        rust_biguint!(3),
    );
}

#[test]
fn existing_users_should_receive_new_rewards_with_no_state_update() {
    let mut world = setup_world_with_contract();

    send_stake_tx(&mut world, &USER_ADDRESS, &[&(NFT_TOKEN_ID, 1, 1)]);

    send_distribute_rewards_tx(&mut world, REWARD_TOKEN_ID_1, 1);
    send_distribute_rewards_tx(&mut world, REWARD_TOKEN_ID_2, 10);

    check_pending_reward(
        &mut world,
        &USER_ADDRESS,
        &REWARD_TOKEN_ID_1,
        rust_biguint!(1),
    );
    check_pending_reward(
        &mut world,
        &USER_ADDRESS,
        &REWARD_TOKEN_ID_2,
        rust_biguint!(10),
    );
}

#[test]
fn cannot_double_claim_rewards() {
    let mut world = setup_world_with_contract();

    send_stake_tx(&mut world, &USER_ADDRESS, &[&(NFT_TOKEN_ID, 1, 1)]);
    check_aggregated_staking_score(&mut world, DEFAULT_NFT_SCORE);
    check_user_staking_score(&mut world, &USER_ADDRESS, DEFAULT_NFT_SCORE);

    send_distribute_rewards_tx(&mut world, REWARD_TOKEN_ID_1, 1);

    send_claim_rewards_tx(&mut world, &USER_ADDRESS);
    world
        .tx()
        .from(USER_ADDRESS)
        .to(SC_ADDRESS)
        .typed(nft_staking::proxy::NftStakingProxy)
        .claim_rewards()
        .returns(ExpectMessage(ERR_NO_REWARDS_TO_CLAIM))
        .run();
}

#[test]
fn cannot_claim_rewards_with_staking_disabled() {
    let mut world = setup_world_with_contract();

    send_stake_tx(&mut world, &USER_ADDRESS, &[&(NFT_TOKEN_ID, 1, 1)]);
    send_distribute_rewards_tx(&mut world, REWARD_TOKEN_ID_1, 1);
    send_disable_staking_tx(&mut world);

    world
        .tx()
        .from(USER_ADDRESS)
        .to(SC_ADDRESS)
        .typed(nft_staking::proxy::NftStakingProxy)
        .claim_rewards()
        .returns(ExpectMessage(ERR_STAKING_DISABLED))
        .run();
}

#[test]
fn cannot_claim_rewards_with_no_rewards_to_claim() {
    let mut world = setup_world_with_contract();

    send_stake_tx(&mut world, &USER_ADDRESS, &[&(NFT_TOKEN_ID, 1, 1)]);
    world
        .tx()
        .from(USER_ADDRESS)
        .to(SC_ADDRESS)
        .typed(nft_staking::proxy::NftStakingProxy)
        .claim_rewards()
        .returns(ExpectMessage(ERR_NO_REWARDS_TO_CLAIM))
        .run();
}

#[test]
#[ignore = "Test fails because of error: \"Want: [\"0x00\"]. Have: [0x]\""]
fn new_stake_should_not_have_pending_reward() {
    let mut world = setup_world_with_contract();

    send_set_distribution_plan_tx(&mut world, REWARD_TOKEN_ID_1, 0, 100, 100); // 1 tokens per round
    send_stake_tx(&mut world, &USER_ADDRESS, &[&(NFT_TOKEN_ID, 1, 1)]);

    world.set_state_step(SetStateStep::new().block_round(1)); // advance to next round

    send_distribute_rewards_tx(&mut world, REWARD_TOKEN_ID_1, 1);
    send_distribute_rewards_tx(&mut world, REWARD_TOKEN_ID_2, 1);

    check_pending_reward(
        &mut world,
        &USER_ADDRESS,
        &REWARD_TOKEN_ID_1,
        rust_biguint!(2),
    );

    check_pending_reward(
        &mut world,
        &USER_ADDRESS,
        &REWARD_TOKEN_ID_2,
        rust_biguint!(1),
    );

    world.set_state_step(SetStateStep::new().block_round(2));

    send_stake_tx(&mut world, &OWNER_ADDRESS, &[&(SFT_TOKEN_ID, 1, 1)]);

    check_pending_reward(
        &mut world,
        &OWNER_ADDRESS,
        &REWARD_TOKEN_ID_2,
        rust_biguint!(0),
    );
}

#[test]
fn claiming_rewards_should_update_last_user_update_round() {
    let mut world = setup_world_with_contract();

    send_stake_tx(&mut world, &USER_ADDRESS, &[&(NFT_TOKEN_ID, 1, 1)]);
    send_distribute_rewards_tx(&mut world, REWARD_TOKEN_ID_1, 1);

    world.set_state_step(SetStateStep::new().block_round(10));

    send_claim_rewards_tx(&mut world, &USER_ADDRESS);

    world
        .query()
        .to(SC_ADDRESS)
        .typed(nft_staking::proxy::NftStakingProxy)
        .last_user_update(&USER_ADDRESS.to_address())
        .returns(ExpectValue(10u64))
        .run();
}
