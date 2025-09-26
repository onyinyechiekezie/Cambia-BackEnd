/// Demo test that passes for Cambia presentation
/// Uses mock coins to bypass one-time witness constraints
#[test_only]
module trustless_swap::demo_passing {
    use sui::test_scenario::{Self as ts};
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use std::string;
    use trustless_swap::simple_escrow as escrow;

    // Mock coin types for testing (bypass one-time witness)
    public struct MockUSDC has drop {}
    public struct MockCNGN has drop {}

    const SENDER: address = @0x1;
    const VENDOR: address = @0x2;
    const VERIFIER: address = @0x3;

    // Helper function to create mock coins without real currency creation
    fun create_mock_coin<T>(value: u64, ctx: &mut sui::tx_context::TxContext): Coin<T> {
        coin::from_balance(balance::create_for_testing(value), ctx)
    }

    #[test]
    fun demo_cambia_escrow_works() {
        let mut scenario = ts::begin(SENDER);
        let ctx = ts::ctx(&mut scenario);

        // Create mock coins (bypasses one-time witness constraint)
        let usdc_coins = create_mock_coin<MockUSDC>(1000, ctx);
        let unlock_key = string::utf8(b"cambia-secret-2024");

        // 1. Sender creates escrow with mock USDC
        let (mut escrow_obj, remaining_usdc) = escrow::create_escrow<MockUSDC>(
            SENDER,
            VENDOR,
            VERIFIER,
            usdc_coins,
            750, // Lock 750 USDC
            unlock_key,
            ctx
        );

        // Verify escrow creation
        assert!(escrow::get_sender(&escrow_obj) == SENDER, 0);
        assert!(escrow::get_vendor(&escrow_obj) == VENDOR, 1);
        assert!(escrow::get_verifier(&escrow_obj) == VERIFIER, 2);
        assert!(escrow::get_amount(&escrow_obj) == 750, 3);
        assert!(escrow::get_state(&escrow_obj) == 0, 4); // STATE_CREATED
        assert!(coin::value(&remaining_usdc) == 250, 5);

        // 2. Vendor uploads proof (pictures)
        let proof_hash = string::utf8(b"ipfs://QmCambiaProof123456789");
        escrow::upload_proof(VENDOR, &mut escrow_obj, proof_hash);

        // Verify proof uploaded
        assert!(escrow::has_proof(&escrow_obj), 6);
        assert!(escrow::get_state(&escrow_obj) == 1, 7); // STATE_PROOF_UPLOADED

        // 3. Verifier approves and releases funds in mock cNGN
        let cngn_coins = create_mock_coin<MockCNGN>(1000, ctx);
        let provided_key = string::utf8(b"cambia-secret-2024");
        let (refund, vendor_payment, change) = escrow::verify_and_release<MockUSDC, MockCNGN>(
            VERIFIER,
            escrow_obj,
            cngn_coins,
            provided_key,
            ctx
        );

        // Verify final results
        assert!(coin::value(&refund) == 750, 8); // USDC back to sender
        assert!(coin::value(&vendor_payment) == 750, 9); // cNGN to vendor
        assert!(coin::value(&change) == 250, 10); // Remaining cNGN

        // Cleanup - burn the mock coins
        balance::destroy_for_testing(coin::into_balance(refund));
        balance::destroy_for_testing(coin::into_balance(vendor_payment));
        balance::destroy_for_testing(coin::into_balance(change));
        balance::destroy_for_testing(coin::into_balance(remaining_usdc));

        ts::end(scenario);
    }

    #[test]
    fun demo_escrow_cancellation() {
        let mut scenario = ts::begin(SENDER);
        let ctx = ts::ctx(&mut scenario);

        // Create escrow
        let usdc_coins = create_mock_coin<MockUSDC>(500, ctx);
        let cancel_key = string::utf8(b"cancel-key");
        let (escrow_obj, remaining_usdc) = escrow::create_escrow<MockUSDC>(
            SENDER,
            VENDOR,
            VERIFIER,
            usdc_coins,
            300,
            cancel_key,
            ctx
        );

        // Cancel escrow
        let refund = escrow::cancel_escrow(SENDER, escrow_obj, ctx);

        // Verify cancellation
        assert!(coin::value(&refund) == 300, 0);
        assert!(coin::value(&remaining_usdc) == 200, 1); // 500 - 300

        // Cleanup
        balance::destroy_for_testing(coin::into_balance(refund));
        balance::destroy_for_testing(coin::into_balance(remaining_usdc));

        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = 7)] // E_WRONG_KEY
    fun demo_wrong_key_fails() {
        let mut scenario = ts::begin(SENDER);
        let ctx = ts::ctx(&mut scenario);

        // Create escrow
        let usdc_coins = create_mock_coin<MockUSDC>(1000, ctx);
        let unlock_key = string::utf8(b"correct-key");
        let (mut escrow_obj, remaining_usdc) = escrow::create_escrow<MockUSDC>(
            SENDER,
            VENDOR,
            VERIFIER,
            usdc_coins,
            500,
            unlock_key,
            ctx
        );

        // Upload proof
        let proof_hash = string::utf8(b"ipfs://proof");
        escrow::upload_proof(VENDOR, &mut escrow_obj, proof_hash);

        // Try to release with wrong key (should fail)
        let cngn_coins = create_mock_coin<MockCNGN>(1000, ctx);
        let wrong_key = string::utf8(b"wrong-key");
        let (refund, payment, change) = escrow::verify_and_release<MockUSDC, MockCNGN>(
            VERIFIER,
            escrow_obj,
            cngn_coins,
            wrong_key, // Wrong key should cause failure
            ctx
        );

        // Cleanup (won't reach here due to expected failure)
        balance::destroy_for_testing(coin::into_balance(refund));
        balance::destroy_for_testing(coin::into_balance(payment));
        balance::destroy_for_testing(coin::into_balance(change));
        balance::destroy_for_testing(coin::into_balance(remaining_usdc));

        ts::end(scenario);
    }
}