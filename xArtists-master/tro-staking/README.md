# TRO Governance Staking

A MultiversX smart contract for TRO token governance through staking. The contract allows users to stake both TRO tokens and TRO LP tokens to participate in governance decisions.

## Protocol Overview

The $TRO staking smart contract is a governance system that allows users to stake TRO tokens and LP tokens to participate in protocol governance through proposal voting. The contract implements a voting power system where both TRO tokens and whitelisted LP tokens contribute to a user's governance influence.

## Key Components

### Token Staking

The contract allows staking of both native TRO tokens and whitelisted LP tokens:

- Users can stake any amount of TRO and supported LP tokens
- Staked tokens remain in the contract until unstaked by the user
- Unstaking is blocked during active proposal periods to prevent governance manipulation
- The contract maintains precise records of each user's stake per token type

### Proposal System

The governance process is centered around proposals:

- Only the contract owner can create proposals
- Proposals have a lifecycle (Pending → Active → Approved/Rejected/Failed)
- Each proposal defines the required minimum voting power to be considered valid
- LP tokens have proposal-specific conversion ratios to TRO (voting power)
- Proposals become active after a configurable delay and remain active for a defined duration

### Voting Mechanism

The voting process works as follows:

1. Users cast votes on active proposals (Approve, Reject, or Abstain)
2. Voting power is calculated as: `staked_TRO + sum(staked_LP_i * LP_to_TRO_ratio_i)`
3. Each user can vote only once per proposal
4. Votes are weighted according to the user's total voting power
5. A minimum voting power threshold must be met for a proposal to be considered valid
6. A proposal is approved if approve votes > reject votes (and total votes meet minimum)

### LP-to-TRO Ratio

A key mechanism is the conversion of LP tokens to equivalent TRO voting power:

- Each proposal defines specific LP-to-TRO ratios for all whitelisted LP tokens
- These ratios are "snapshot" at proposal creation time and remain fixed for that proposal
- The ratio determines how much voting power each LP token provides
- Formula: `lp_voting_power = staked_lp_balance * lp_to_tro_ratio / DIVISION_GUARD`

## Core Processes

### Staking Process

```
1. User initiates stake transaction with TRO/LP tokens
2. Contract verifies token is either TRO or whitelisted LP
3. Updates user's stake balance for the specific token
4. Emits stake event
```

### Unstaking Process

```
1. User requests unstake with token types and amounts
2. Contract verifies no active proposals exist
3. Verifies user has sufficient stake of requested tokens
4. Reduces user's stake balance for specified tokens
5. Transfers tokens back to user
6. Emits unstake event
```

### Proposal Creation Process

```
1. Owner creates proposal with:
   - Title and description
   - Minimum voting power threshold
   - Start/end times (or uses defaults)
   - LP-to-TRO ratios
2. Contract validates time parameters
3. Creates proposal record with incremented ID
4. Snapshots LP-to-TRO ratios for the proposal
5. Emits proposal creation event
```

### Voting Process

```
1. User initiates vote on proposal (Approve/Reject/Abstain)
2. Contract verifies:
   - Proposal exists and is active
   - User hasn't already voted
   - User has sufficient voting power
3. Calculates user's voting power
4. Records user's vote and adds to proposal's vote counts
5. Emits vote event
```

### Proposal Resolution Process

```
1. When proposal time window closes:
2. If total votes >= minimum required:
   - If approve votes > reject votes → Approved
   - Else → Rejected
3. If total votes < minimum required → Failed
```

## Security Considerations

- Unstaking is blocked during active proposals to prevent governance manipulation
- Proposals have minimum voting power thresholds to ensure sufficient participation
- Each user can only vote once per proposal
- LP-to-TRO ratios are fixed at proposal creation to prevent manipulation
- The contract owner has privileged control over LP token whitelisting and proposal creation



## Function Documentation

### Admin Module (`admin.rs`)

```rust
// Allows the contract owner to add LP tokens to the whitelist
// Only the owner can call this function
// Parameters:
// - lp_token_identifiers: List of LP token identifiers to add to the whitelist
#[only_owner]
#[endpoint(addWhitelistedLpTokens)]
fn add_whitelisted_lp_tokens(&self, lp_token_identifiers: MultiValueEncoded<TokenIdentifier>)

// Allows the contract owner to set the TRO token identifier
// Only the owner can call this function
// Parameters:
// - tro_token_identifier: The token identifier for TRO
#[only_owner]
#[endpoint(setTroTokenIdentifier)]
fn set_tro_token_identifier(&self, tro_token_identifier: TokenIdentifier)
```

### Stake Module (`stake.rs`)

```rust
// Processes stake operations by validating tokens and updating user balances
// Parameters:
// - user: Address of the user staking tokens
// - payments: List of token payments to stake
fn process_stake(&self, user: &ManagedAddress, payments: &ManagedVec<EsdtTokenPayment>)

// Adds a payment to a user's stake for a specific token
// Parameters:
// - user: Address of the user
// - payment: Payment to add to user's stake
fn add_payment_to_user_stake(&self, user: &ManagedAddress, payment: &EsdtTokenPayment)

// Processes unstake operations by validating tokens and updating user balances
// Returns the list of tokens to be transferred back to the user
// Parameters:
// - user: Address of the user unstaking tokens
// - request: List of token identifiers and amounts to unstake
fn process_unstake(
    &self,
    user: &ManagedAddress,
    request: MultiValueEncoded<MultiValue2<TokenIdentifier, BigUint>>
) -> ManagedVec<EsdtTokenPayment>

// Subtracts a payment from a user's stake for a specific token
// Parameters:
// - user: Address of the user
// - token_identifier: Identifier of the token to subtract
// - amount: Amount to subtract
fn subtract_payment_from_user_stake(
    &self,
    user: &ManagedAddress,
    token_identifier: &TokenIdentifier,
    amount: &BigUint
)

// Verifies that a token is either TRO or a whitelisted LP token
// Parameters:
// - token_identifier: Identifier of the token to check
fn require_token_is_allowed(&self, token_identifier: &TokenIdentifier)

// Verifies that a user has enough stake of a specific token to unstake
// Parameters:
// - user: Address of the user
// - token_identifier: Identifier of the token to check
// - amount: Amount to check
fn require_user_has_enough_stake(
    &self,
    user: &ManagedAddress,
    token_identifier: &TokenIdentifier,
    amount: &BigUint
)
```

### Events Module (`events.rs`)

```rust
// Emits a stake event when a user stakes tokens
// Parameters:
// - caller: Address of the user who staked
// - payments: List of token payments that were staked
fn emit_stake_event(&self, caller: &ManagedAddress, payments: &MultiEsdtPayment<Self::Api>)

// Emits an unstake event when a user unstakes tokens
// Parameters:
// - caller: Address of the user who unstaked
// - payments: List of token payments that were unstaked
fn emit_unstake_event(&self, caller: &ManagedAddress, payments: &MultiEsdtPayment<Self::Api>)

// Emits a proposal created event when a new proposal is created
// Parameters:
// - proposal_id: ID of the created proposal
// - title: Title of the proposal
// - min_voting_power: Minimum voting power required for the proposal to be valid
// - start_time: Start time of the proposal
// - end_time: End time of the proposal
fn emit_proposal_created_event(
    &self,
    proposal_id: u64,
    title: &ManagedBuffer<Self::Api>,
    min_voting_power: &BigUint<Self::Api>,
    start_time: u64,
    end_time: u64
)

// Emits a vote event when a user votes on a proposal
// Parameters:
// - voter: Address of the voter
// - proposal_id: ID of the proposal
// - decision: Vote decision (Approve, Reject, Abstain)
fn emit_vote_event(
    &self,
    voter: &ManagedAddress,
    proposal_id: u64,
    decision: VoteContext<Self::Api>
)
```

### Voting Module (`voting.rs`)

```rust
// Creates a new proposal
// Only the owner can call this function
// Parameters:
// - title: Title of the proposal
// - description: Description of the proposal
// - min_voting_power_to_validate_vote: Minimum voting power required for the proposal to be valid
// - start_time: Optional start time of the proposal (default: now + delay)
// - end_time: Optional end time of the proposal (default: start_time + duration)
// - lp_to_tro_ratios: List of LP token ratios for this proposal
#[only_owner]
#[endpoint(createProposal)]
fn create_proposal(
    &self,
    title: ManagedBuffer,
    description: ManagedBuffer,
    min_voting_power_to_validate_vote: BigUint,
    start_time: OptionalValue<u64>,
    end_time: OptionalValue<u64>,
    lp_to_tro_ratios: MultiValueEncoded<LpToTroRatio<Self::Api>>
)

// Allows a user to vote on a proposal
// Parameters:
// - proposal_id: ID of the proposal to vote on
// - decision: Vote decision (Approve, Reject, Abstain)
#[endpoint(vote)]
fn vote(&self, proposal_id: u64, decision: VoteDecision)

// Processes a vote on a proposal
// Parameters:
// - user: Address of the voter
// - proposal_id: ID of the proposal
// - decision: Vote decision (Approve, Reject, Abstain)
fn process_vote(
    &self,
    user: &ManagedAddress<Self::Api>,
    proposal_id: u64,
    decision: VoteDecision
)

// Gets the vote context for a proposal and voter
// Parameters:
// - proposal_id: ID of the proposal
// - voter: Address of the voter
// Returns: Vote context if the voter has voted, None otherwise
fn get_proposal_vote_context(
    &self,
    proposal_id: u64,
    voter: &ManagedAddress
) -> OptionalValue<VoteContext<Self::Api>>

// Captures LP-to-TRO ratios for a proposal
// Parameters:
// - proposal_id: ID of the proposal
// - lp_to_tro_ratios: List of LP token ratios to capture
fn snapshot_lp_to_tro_ratio(
    &self,
    proposal_id: u64,
    lp_to_tro_ratios: MultiValueEncoded<LpToTroRatio<Self::Api>>
)

// Gets the status of a proposal at a specific time
// Parameters:
// - proposal: Proposal to check
// - block_timestamp: Timestamp to check at
// Returns: Status of the proposal (Pending, Active, Approved, Rejected, Failed)
fn get_proposal_status(
    &self,
    proposal: &Proposal<Self::Api>,
    block_timestamp: u64
) -> ProposalStatus

// Gets the result of a proposal after voting has ended
// Parameters:
// - proposal: Proposal to check
// Returns: Result of the proposal (Approved, Rejected, Failed)
fn get_proposal_vote_result(&self, proposal: &Proposal<Self::Api>) -> ProposalStatus

// Gets a new proposal ID by incrementing the last ID
// Returns: New proposal ID
fn get_new_proposal_id(&self) -> u64

// Calculates a user's voting power for a specific proposal
// Parameters:
// - user: Address of the user
// - proposal_id: ID of the proposal
// Returns: Voting power of the user
fn get_voting_power(&self, user: &ManagedAddress, proposal_id: u64) -> BigUint<Self::Api>

// Ensures that a proposal's time range is valid
// Parameters:
// - start_time: Start time of the proposal
// - end_time: End time of the proposal
fn require_time_range_is_valid(&self, start_time: u64, end_time: u64)

// Ensures that a proposal exists
// Parameters:
// - proposal_id: ID of the proposal to check
fn require_proposal_exists(&self, proposal_id: u64)

// Ensures that a proposal is active
// Parameters:
// - proposal_id: ID of the proposal to check
fn require_proposal_active(&self, proposal_id: u64)

// Ensures that no proposal is active
// Used to prevent unstaking when a proposal is active
fn require_no_proposal_ongoing(&self)

// Ensures that a user has not voted on a proposal
// Parameters:
// - user: Address of the user
// - proposal_id: ID of the proposal
fn require_user_has_not_voted(&self, user: &ManagedAddress, proposal_id: u64)

// Gets the vote count for a proposal
// Parameters:
// - proposal_id: ID of the proposal
// Returns: Vote count for the proposal (approve, abstain, reject, invalid)
fn get_proposal_vote_count(&self, proposal_id: u64) -> ProposalVoteCount<Self::Api>
```

### Views Module (`views.rs`)

```rust
// Gets a user's voting power for a specific proposal
// Parameters:
// - user: Address of the user
// - proposal_id: Optional ID of the proposal (default: last proposal)
// Returns: Voting power of the user
#[view(getVotingPower)]
fn get_voting_power_view(
    &self,
    user: &ManagedAddress,
    proposal_id: OptionalValue<u64>
) -> BigUint

// Gets the staking context for a user
// Parameters:
// - user: Optional address of the user (default: zero address)
// Returns: Staking context for the user
#[view(getStakingContext)]
fn get_staking_context(
    &self,
    user: OptionalValue<ManagedAddress>
) -> OptionalValue<StakingContext<Self::Api>>

// Gets the complete stake for a user (TRO and all LP tokens)
// Parameters:
// - user: Address of the user
// Returns: List of token payments representing the user's stake
#[view(getUserCompleteStake)]
fn get_user_complete_stake(
    &self,
    user: ManagedAddress
) -> ManagedVec<Self::Api, EsdtTokenPayment<Self::Api>>

// Gets a user's stake for a specific token
// Parameters:
// - user: Address of the user
// - token_identifier: Identifier of the token
// Returns: Token payment representing the user's stake
#[view(getUserStake)]
fn get_user_stake(
    &self,
    user: &ManagedAddress,
    token_identifier: &TokenIdentifier
) -> EsdtTokenPayment<Self::Api>

// Gets the context for a proposal
// Parameters:
// - proposal_id: ID of the proposal
// - user: Optional address of the user (for user-specific context)
// Returns: Proposal context
#[view(getProposalContext)]
fn get_proposal_context(
    &self,
    proposal_id: u64,
    user: OptionalValue<ManagedAddress>
) -> ProposalContext<Self::Api>

// Gets the IDs of all active proposals
// Returns: List of active proposal IDs
#[view(getActiveProposalIds)]
fn get_active_proposal_ids(&self) -> ManagedVec<Self::Api, u64>

// Gets the status of a proposal
// Parameters:
// - proposal_id: ID of the proposal
// Returns: Status of the proposal
#[view(getProposalStatus)]
fn get_proposal_status_view(&self, proposal_id: u64) -> ProposalStatus

// Gets the vote context for a specific proposal and voter
// Parameters:
// - proposal_id: ID of the proposal
// - voter: Address of the voter
// Returns: Vote context if the voter has voted, None otherwise
#[view(getProposalVoteContext)]
fn get_proposal_vote_context_view(
    &self,
    proposal_id: u64,
    voter: &ManagedAddress
) -> OptionalValue<VoteContext<Self::Api>>

// Gets the vote count for a proposal
// Parameters:
// - proposal_id: ID of the proposal
// Returns: Vote count for the proposal
#[view(getProposalVoteCount)]
fn get_proposal_vote_count_view(&self, proposal_id: u64) -> ProposalVoteCount<Self::Api>

// Gets all proposals with user-specific context
// Parameters:
// - user: Optional address of the user (for user-specific context)
// Returns: List of full proposal contexts
#[view(getAllProposals)]
fn get_all_proposals(
    &self,
    user: OptionalValue<ManagedAddress>
) -> ManagedVec<Self::Api, FullProposalContext<Self::Api>>
```

### TRO Staking Contract (`tro_staking.rs`)

```rust
// Initializes the contract
// Parameters:
// - tro_token_identifier: The token identifier for TRO
#[init]
fn init(&self, tro_token_identifier: TokenIdentifier)

// Allows users to stake tokens
// Tokens are automatically received from the transaction
#[payable("*")]
#[endpoint(stake)]
fn stake(&self)

// Allows users to unstake tokens
// Parameters:
// - request: List of token identifiers and amounts to unstake
#[endpoint(unstake)]
fn unstake(&self, request: MultiValueEncoded<MultiValue2<TokenIdentifier, BigUint>>)

// Upgrades the contract
#[upgrade]
fn upgrade(&self)
```

### Storage Module (`storage.rs`)

```rust
// Gets the TRO token identifier
#[view(getTroTokenIdentifier)]
#[storage_mapper("tro_token_identifier")]
fn tro_token_identifier(&self) -> SingleValueMapper<TokenIdentifier>

// Gets the list of whitelisted LP token identifiers
#[view(getWhitelistedLpTokenIdentifiers)]
#[storage_mapper("whitelisted_lp_token_identifiers")]
fn whitelisted_lp_token_identifiers(&self) -> SetMapper<TokenIdentifier>

// Gets a user's stake for a specific token
#[view(getUsersStake)]
#[storage_mapper("users_stake")]
fn users_stake(
    &self,
    users_address: &ManagedAddress,
    token_identifier: &TokenIdentifier
) -> SingleValueMapper<BigUint>
```
