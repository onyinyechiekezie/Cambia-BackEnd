#[test_only]
module trustless_swap::demo_integration {
    use sui::test_scenario::{Self as ts};
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use std::string;
    use trustless_swap::simple_escrow as escrow;
    use trustless_swap::test_helpers::{Self, MockUSDC, MockCNGN, create_mock_coin};

    const SENDER: address = @0x1;
    const VENDOR: address = @0x2;
    const VERIFIER: address = @0x3;

    /// Demo helper that runs a single full-flow scenario and returns tuple of values
    #[test]
    fun demo_single_flow() {
        let mut scenario = ts::begin(SENDER);
        let ctx = ts::ctx(&mut scenario);

        // Create escrow
        let usdc_coins = create_mock_coin<MockUSDC>(1000, ctx);
        let unlock_key = string::utf8(b"demo-key");
        let (mut escrow_obj, remaining_usdc) = escrow::create_escrow<MockUSDC>(
            SENDER, VENDOR, VERIFIER, usdc_coins, 750, unlock_key, ctx
        );

        // Upload proof and verify
        let proof = string::utf8(b"ipfs://demo-proof");
        escrow::upload_proof(VENDOR, &mut escrow_obj, proof);

        let cngn_coins = create_mock_coin<MockCNGN>(1000, ctx);
        let provided_key = string::utf8(b"demo-key");
        let (refund, vendor_payment, change) = escrow::verify_and_release<MockUSDC, MockCNGN>(
            VERIFIER, escrow_obj, cngn_coins, provided_key, ctx
        );

        // Cleanup
        balance::destroy_for_testing(coin::into_balance(refund));
        balance::destroy_for_testing(coin::into_balance(vendor_payment));
        balance::destroy_for_testing(coin::into_balance(change));
        balance::destroy_for_testing(coin::into_balance(remaining_usdc));

        ts::end(scenario);
    }
}
