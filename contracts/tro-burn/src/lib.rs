#![no_std]

//! xArtists Burnify — burn $TRO + reward EGLD (pool LIA).
//! User burnTro → burn + EGLD to burner; protocol_fee_bps → reward_wallet (LIA).
//! fundRewards deposits EGLD. Requires ESDTLocalBurn on TRO.

multiversx_sc::imports!();
multiversx_sc::derive_imports!();

const MAX_FEE_BPS: u16 = 5_000;

#[multiversx_sc::contract]
pub trait TroBurn {
    #[init]
    fn init(
        &self,
        tro_token_id: TokenIdentifier,
        reward_wallet: ManagedAddress,
        egld_per_whole_tro: BigUint,
        protocol_fee_bps: u16,
        tro_decimals: u32,
    ) {
        require!(tro_token_id.is_valid_esdt_identifier(), "invalid token");
        require!(!reward_wallet.is_zero(), "reward wallet");
        require!(protocol_fee_bps <= MAX_FEE_BPS, "fee too high");
        require!(tro_decimals <= 18, "decimals");
        self.tro_token_id().set(&tro_token_id);
        self.reward_wallet().set(&reward_wallet);
        self.egld_per_whole_tro().set(&egld_per_whole_tro);
        self.protocol_fee_bps().set(protocol_fee_bps);
        self.tro_decimals().set(tro_decimals);
        self.total_burned().set(BigUint::zero());
        self.total_rewards_paid().set(BigUint::zero());
        self.paused().set(false);
        let caller = self.blockchain().get_caller();
        self.owner().set(&caller);
    }

    #[upgrade]
    fn upgrade(&self) {
        self.require_owner();
    }

    fn require_owner(&self) {
        require!(
            self.blockchain().get_caller() == self.owner().get(),
            "only owner"
        );
    }

    fn require_not_paused(&self) {
        require!(!self.paused().get(), "paused");
    }

    #[endpoint(pause)]
    fn pause(&self) {
        self.require_owner();
        self.paused().set(true);
    }

    #[endpoint(unpause)]
    fn unpause(&self) {
        self.require_owner();
        self.paused().set(false);
    }

    #[endpoint(setRewardWallet)]
    fn set_reward_wallet(&self, wallet: ManagedAddress) {
        self.require_owner();
        require!(!wallet.is_zero(), "zero");
        self.reward_wallet().set(&wallet);
    }

    #[endpoint(setEgldPerWholeTro)]
    fn set_egld_per_whole_tro(&self, amount: BigUint) {
        self.require_owner();
        self.egld_per_whole_tro().set(&amount);
    }

    #[endpoint(setProtocolFeeBps)]
    fn set_protocol_fee_bps(&self, bps: u16) {
        self.require_owner();
        require!(bps <= MAX_FEE_BPS, "fee too high");
        self.protocol_fee_bps().set(bps);
    }

    #[payable("EGLD")]
    #[endpoint(fundRewards)]
    fn fund_rewards(&self) {
        let payment = self.call_value().egld();
        require!(*payment > 0, "zero egld");
        self.fund_event(&self.blockchain().get_caller(), payment);
    }

    #[endpoint(withdrawPool)]
    fn withdraw_pool(&self, amount: BigUint) {
        self.require_owner();
        require!(amount > 0, "zero");
        let sc_bal = self.blockchain().get_sc_balance(&EgldOrEsdtTokenIdentifier::egld(), 0);
        require!(sc_bal >= amount, "insufficient pool");
        self.send()
            .direct_egld(&self.blockchain().get_caller(), &amount);
    }

    #[payable("*")]
    #[endpoint(burnTro)]
    fn burn_tro(&self) {
        self.require_not_paused();
        let (token_id, _nonce, amount) = self.call_value().single_esdt().into_tuple();
        let expected = self.tro_token_id().get();
        require!(token_id == expected, "only TRO accepted");
        require!(amount > 0, "amount zero");

        self.send().esdt_local_burn(&token_id, 0u64, &amount);

        let mut total = self.total_burned().get();
        total += &amount;
        self.total_burned().set(&total);

        let caller = self.blockchain().get_caller();

        let decimals = self.tro_decimals().get();
        let divisor = BigUint::from(10u64).pow(decimals);
        let whole = &amount / &divisor;
        let per = self.egld_per_whole_tro().get();
        let mut reward_total = &whole * &per;

        if reward_total > 0 {
            let sc_bal = self
                .blockchain()
                .get_sc_balance(&EgldOrEsdtTokenIdentifier::egld(), 0);
            if reward_total > sc_bal {
                reward_total = sc_bal;
            }
            if reward_total > 0 {
                let fee_bps = self.protocol_fee_bps().get() as u64;
                let fee = &reward_total * fee_bps / 10_000u64;
                let to_user = &reward_total - &fee;

                if to_user > 0 {
                    self.send().direct_egld(&caller, &to_user);
                }
                if fee > 0 {
                    let lia = self.reward_wallet().get();
                    self.send().direct_egld(&lia, &fee);
                }

                let mut paid = self.total_rewards_paid().get();
                paid += &reward_total;
                self.total_rewards_paid().set(&paid);

                self.reward_event(&caller, &to_user, &fee, &reward_total);
            }
        }

        self.burn_event(&caller, &amount, &total);
    }

    #[view(quoteReward)]
    fn quote_reward(&self, tro_amount_atomic: BigUint) -> MultiValue3<BigUint, BigUint, BigUint> {
        let decimals = self.tro_decimals().get();
        let divisor = BigUint::from(10u64).pow(decimals);
        let whole = &tro_amount_atomic / &divisor;
        let per = self.egld_per_whole_tro().get();
        let mut reward_total = &whole * &per;
        let sc_bal = self
            .blockchain()
            .get_sc_balance(&EgldOrEsdtTokenIdentifier::egld(), 0);
        if reward_total > sc_bal {
            reward_total = sc_bal;
        }
        let fee_bps = self.protocol_fee_bps().get() as u64;
        let fee = &reward_total * fee_bps / 10_000u64;
        let to_user = &reward_total - &fee;
        (reward_total, to_user, fee).into()
    }

    #[view(getPoolEgld)]
    fn get_pool_egld(&self) -> BigUint {
        self.blockchain()
            .get_sc_balance(&EgldOrEsdtTokenIdentifier::egld(), 0)
    }

    #[event("burnTro")]
    fn burn_event(
        &self,
        #[indexed] burner: &ManagedAddress,
        amount: &BigUint,
        total_burned: &BigUint,
    );

    #[event("burnReward")]
    fn reward_event(
        &self,
        #[indexed] burner: &ManagedAddress,
        to_user: &BigUint,
        to_protocol: &BigUint,
        total: &BigUint,
    );

    #[event("fundRewards")]
    fn fund_event(&self, #[indexed] from: &ManagedAddress, amount: &BigUint);

    #[view(getTroTokenId)]
    #[storage_mapper("tro_token_id")]
    fn tro_token_id(&self) -> SingleValueMapper<TokenIdentifier>;

    #[view(getRewardWallet)]
    #[storage_mapper("reward_wallet")]
    fn reward_wallet(&self) -> SingleValueMapper<ManagedAddress>;

    #[view(getEgldPerWholeTro)]
    #[storage_mapper("egld_per_whole_tro")]
    fn egld_per_whole_tro(&self) -> SingleValueMapper<BigUint>;

    #[view(getProtocolFeeBps)]
    #[storage_mapper("protocol_fee_bps")]
    fn protocol_fee_bps(&self) -> SingleValueMapper<u16>;

    #[view(getTroDecimals)]
    #[storage_mapper("tro_decimals")]
    fn tro_decimals(&self) -> SingleValueMapper<u32>;

    #[view(getTotalBurned)]
    #[storage_mapper("total_burned")]
    fn total_burned(&self) -> SingleValueMapper<BigUint>;

    #[view(getTotalRewardsPaid)]
    #[storage_mapper("total_rewards_paid")]
    fn total_rewards_paid(&self) -> SingleValueMapper<BigUint>;

    #[view(isPaused)]
    #[storage_mapper("paused")]
    fn paused(&self) -> SingleValueMapper<bool>;

    #[view(getOwner)]
    #[storage_mapper("owner")]
    fn owner(&self) -> SingleValueMapper<ManagedAddress>;
}
