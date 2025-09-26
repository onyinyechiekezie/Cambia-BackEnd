/// Test helpers providing mock coin types and helpers to bypass one-time witness constraints
#[test_only]
module trustless_swap::test_helpers {
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::tx_context::{Self, TxContext};

    // Mock coin types used only in tests (bypass real minting)
    public struct MockUSDC has drop {}
    public struct MockCNGN has drop {}
    public struct MockBTC has drop {}

    // Create a mock coin of any coin type T by creating a balance for testing
    public fun create_mock_coin<T>(value: u64, ctx: &mut TxContext): Coin<T> {
        sui::coin::from_balance(sui::balance::create_for_testing(value), ctx)
    }
}
