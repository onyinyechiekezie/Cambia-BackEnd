#[test_only]
module trustless_swap::stress_harness {
    use sui::test_scenario::{Self as ts};
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use std::string;
    use trustless_swap::simple_escrow as escrow;
    use trustless_swap::test_helpers::{Self, MockUSDC, MockCNGN, create_mock_coin};

    const SENDER: address = @0x1;
    const VENDOR: address = @0x2;
    const VERIFIER: address = @0x3;

    // Configurable number of iterations for the harness. Keep small by default to avoid long test runs.
    const ITERATIONS: u64 = 5;

    #[test]
    fun stress_test_iterations() {
        let mut i: u64 = 0;
        while (i < ITERATIONS) {
            let mut scenario = ts::begin(SENDER);
            let ctx = ts::ctx(&mut scenario);

            // Create escrow
            let usdc_coins = create_mock_coin<MockUSDC>(1000 + i, ctx);
            let unlock_key = string::utf8(b"stress-key");
            let (mut escrow_obj, remaining_usdc) = escrow::create_escrow<MockUSDC>(
                SENDER, VENDOR, VERIFIER, usdc_coins, 750, unlock_key, ctx
            );

            // Upload proof
            let proof = string::utf8(b"ipfs://stress-proof");
            escrow::upload_proof(VENDOR, &mut escrow_obj, proof);

            // Verify and release
            let cngn_coins = create_mock_coin<MockCNGN>(1000 + i, ctx);
            let provided_key = string::utf8(b"stress-key");
            let (refund, vendor_payment, change) = escrow::verify_and_release<MockUSDC, MockCNGN>(
                VERIFIER, escrow_obj, cngn_coins, provided_key, ctx
            );

            // Basic assertions to ensure values match expected logic
            assert!(coin::value(&refund) == 750, 1000 + i);
            assert!(coin::value(&vendor_payment) == 750, 1001 + i);

            // Cleanup
            balance::destroy_for_testing(coin::into_balance(refund));
            balance::destroy_for_testing(coin::into_balance(vendor_payment));
            balance::destroy_for_testing(coin::into_balance(change));
            balance::destroy_for_testing(coin::into_balance(remaining_usdc));

            ts::end(scenario);
            i = i + 1;
        }
    }
}
