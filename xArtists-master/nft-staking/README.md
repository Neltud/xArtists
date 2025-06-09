# NFT Governance Staking

A MultiversX smart contract for NFT staking with rewards distribution. The contract allows users to stake NFTs from whitelisted collections to earn various reward tokens through both continuous reward rate mechanisms and planned distributions.

## Protocol Overview

The NFT staking smart contract is a staking system that allows users to stake NFTs from approved collections to earn rewards. The contract implements a scoring system where different NFT collections (and even specific NFTs) can have different governance weights, determining their influence on reward distribution.

## Key Components

### NFT Staking

The contract allows staking of NFTs from whitelisted collections:

- Users can stake any quantity of NFTs from approved collections
- Staked NFTs remain in the contract until unstaked by the user
- Unstaked NFTs are subject to a time penalty before they can be claimed
- The contract maintains precise records of each user's staked NFTs and their respective scores

### Reward System

The reward distribution works through two main mechanisms:

- **Reward Rate**: A continuous accumulation system based on staking duration and score
- **Planned Distribution**: Fixed distribution schedules for specific reward tokens

Each user's reward is calculated proportionally to their staking score relative to the total staked score in the contract.

### Scoring Mechanism

The influence of staked NFTs is determined by a scoring system:

- Each NFT collection has a default or custom score value
- Specific NFT nonces (serial numbers) within a collection can have custom scores
- A user's total score is the sum of all their staked NFT scores
- Rewards are distributed proportionally to users based on their score percentage of the total

## Core Processes

### Staking Process

```
1. User initiates stake transaction with NFTs
2. Contract verifies NFTs are from whitelisted collections
3. Calculates score of staked NFTs
4. Updates user's stake balance and score
5. Updates aggregated staking score
```

### Unstaking Process

```
1. User requests unstake with specific NFTs
2. Contract verifies user has sufficient staked balance
3. Reduces user's stake balance and score
4. Places NFTs in a time-locked unstaking queue
5. After penalty period expires, user can claim their NFTs
```

### Reward Distribution Process

```
1. Rewards can be added through:
   - Direct distribution by owner (distributeRewards)
   - Planned distribution schedules
2. For each reward token:
   - Contract calculates reward rate = rewards / total staking score
   - User's pending rewards = user_score * (current_rate - user_last_rate)
3. When a user performs any action, pending rewards are calculated and stored
4. Users can claim accumulated rewards at any time
```

### Claim Rewards Process

```
1. User initiates claim rewards
2. For each reward token:
   - Contract calculates and stores any pending rewards
   - Includes already stored rewards
   - Resets user's reward rate to current rate
3. All accumulated rewards are sent to user
```

## Security Considerations

- Unstaking has a time penalty to prevent reward farming
- Only whitelisted NFT collections can be staked
- The contract owner has privileged control over NFT collection whitelisting and scoring
- The contract can be temporarily disabled to prevent new staking during critical updates
- Specific NFT nonces can have custom scores for rare/valuable items

## Function Documentation

### Admin Module (`admin.rs`)

```rust
// Temporarily disables staking
// Only the owner can call this function
#[only_owner]
#[endpoint(disableStaking)]
fn disable_staking(&self)

// Re-enables staking after being disabled
// Only the owner can call this function
#[only_owner]
#[endpoint(enableStaking)]
fn enable_staking(&self)

// Allows the contract owner to add NFT collections to the whitelist
// Only the owner can call this function
// Parameters:
// - collections: List of NFT collection identifiers to add to the whitelist
#[only_owner]
#[endpoint(allowCollections)]
fn allow_collections(&self, collections: MultiValueManagedVec<TokenIdentifier>)

// Distribute rewards to all stakers
// Expects at least a payment that consists of the total amount of tokens to be distributed
// Used for unscheduled reward distributions (e.g. airdrop, campaigns)
#[only_owner]
#[payable("*")]
#[endpoint(distributeRewards)]
fn distribute_rewards(&self)

// Set the unstaking penalty time period in seconds
// Users must wait this period after unstaking before they can claim NFTs
#[only_owner]
#[endpoint(setUnstakingPenalty)]
fn set_unstaking_penalty(&self, penalty: u64)

// Change the score for all NFTs in a collection
// This sets a default score value for all NFTs in the collection
#[only_owner]
#[endpoint(setCollectionScore)]
fn set_collection_score(&self, collection: TokenIdentifier, score: u64)

// Change the score for a specific NFT nonce within a collection
// Allows specific valuable/rare NFTs to have different scores
#[only_owner]
#[endpoint(setCollectionNonceScore)]
fn set_collection_nonce_score(&self, collection: TokenIdentifier, nonce: u64, score: u64)

// Create a new distribution plan for rewards
// Expects a single payment of reward tokens to be distributed
#[payable("*")]
#[only_owner]
#[endpoint(createDistributionPlan)]
fn create_distribution_plan(&self, start_round: u64, end_round: u64)
```

### Core User Functions (`nft_staking.rs`)

```rust
// Allows users to stake NFTs
// NFTs are automatically received from the transaction
#[payable("*")]
#[endpoint(stake)]
fn stake(&self) -> BigUint

// Allows users to unstake NFTs
// Parameters:
// - unstake_request: List of NFTs to unstake (token ID, nonce, quantity)
#[endpoint(unstake)]
fn unstake(&self, unstake_request: MultiValueManagedVec<EsdtTokenPayment>) -> BigUint

// Allows users to claim their unstaked NFTs after the penalty period
#[endpoint(claimUnstaked)]
fn claim_unstaked(&self)

// Allows users to claim accumulated rewards
#[endpoint(claimRewards)]
fn claim_rewards(&self)
```

### View Functions (`views.rs`)

```rust
// Gets complete staking information for a user
// Parameters:
// - address: Address of the user
// Returns: Comprehensive staking info including staked NFTs, score, and pending rewards
#[view(getStakingInfo)]
fn get_staking_info(&self, address: &ManagedAddress) -> StakingInfo<Self::Api>

// Gets all pending rewards for a user
// Parameters:
// - address: Address of the user
// Returns: List of token payments representing pending rewards
#[view(getPendingRewards)]
fn get_pending_rewards_view(&self, address: &ManagedAddress) -> ManagedVec<EsdtTokenPayment<Self::Api>>

// Gets all NFTs staked by a user
// Parameters:
// - address: Address of the user
// Returns: List of NFTs staked by the user
#[view(getStakedItems)]
fn get_staked_items_snapshot(&self, address: &ManagedAddress) -> ManagedVec<EsdtTokenPayment<Self::Api>>

// Gets all NFTs in the unstaking period for a user
// Parameters:
// - address: Address of the user
// Returns: List of unstaking batches with timestamps
#[view(getUnstakingItems)]
fn get_unstaking_items(&self, address: &ManagedAddress) -> ManagedVec<UnstakingBatch<Self::Api>>

// Gets a user's staking score
// Parameters:
// - address: Address of the user
// Returns: User's total staking score
#[view(getUserStakingScore)]
fn get_user_staking_score(&self, address: &ManagedAddress) -> BigUint<Self::Api>

// Gets total staking score across all users
// Returns: Aggregated staking score
#[view(getAggregatedStakingScore)]
fn get_aggregated_staking_score(&self) -> BigUint<Self::Api>
```
