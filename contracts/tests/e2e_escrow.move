/// End-to-end escrow test covering create, upload proof, verify/release, cancel, and edge cases
#[test_only]
module trustless_swap::e2e_escrow {
    use sui::test_scenario::{Self as ts};
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::transfer::{Self as transfer};
    use std::string;
    use trustless_swap::simple_escrow as escrow;
    use trustless_swap::test_helpers::{Self, MockUSDC, MockCNGN, MockBTC, create_mock_coin};

    const SENDER: address = @0x1;
    const VENDOR: address = @0x2;
    const VERIFIER: address = @0x3;
    const RANDOM_USER: address = @0x4;

    // Full end-to-end happy path running multiple scenarios in one test to avoid one-time witness conflicts
    #[test]
    fun e2e_full_flow() {
        let mut scenario = ts::begin(SENDER);
        let ctx = ts::ctx(&mut scenario);

        // 1) Create escrow (USDC) and verify initial state
        let usdc_coins = create_mock_coin<MockUSDC>(1000, ctx);
        let unlock_key = string::utf8(b"e2e-key-1");
        let (mut escrow_obj, remaining_usdc) = escrow::create_escrow<MockUSDC>(
            SENDER, VENDOR, VERIFIER, usdc_coins, 750, unlock_key, ctx
        );
        assert!(escrow::get_sender(&escrow_obj) == SENDER, 0);
        assert!(escrow::get_amount(&escrow_obj) == 750, 1);
        assert!(coin::value(&remaining_usdc) == 250, 2);

        // 2) Vendor uploads proof and state updates
        let proof = string::utf8(b"ipfs://e2e-proof-1");
        escrow::upload_proof(VENDOR, &mut escrow_obj, proof);
        assert!(escrow::has_proof(&escrow_obj), 3);
        assert!(escrow::get_state(&escrow_obj) == 1, 4);

        // 3) Verifier releases with cNGN; verify amounts
        let cngn_coins = create_mock_coin<MockCNGN>(1000, ctx);
        let provided_key = string::utf8(b"e2e-key-1");
        let (refund, vendor_payment, change) = escrow::verify_and_release<MockUSDC, MockCNGN>(
            VERIFIER, escrow_obj, cngn_coins, provided_key, ctx
        );
        assert!(coin::value(&refund) == 750, 5);
        assert!(coin::value(&vendor_payment) == 750, 6);
        assert!(coin::value(&change) == 250, 7);

        // cleanup balances from this flow
        balance::destroy_for_testing(coin::into_balance(refund));
        balance::destroy_for_testing(coin::into_balance(vendor_payment));
        balance::destroy_for_testing(coin::into_balance(change));
        balance::destroy_for_testing(coin::into_balance(remaining_usdc));

        // 4) Cancellation flow: create and cancel
        let usdc_coins2 = create_mock_coin<MockUSDC>(600, ctx);
        let cancel_key = string::utf8(b"cancel-key-e2e");
        let (cancel_escrow, cancel_remaining) = escrow::create_escrow<MockUSDC>(
            SENDER, VENDOR, VERIFIER, usdc_coins2, 400, cancel_key, ctx
        );
        let cancel_refund = escrow::cancel_escrow(SENDER, cancel_escrow, ctx);
        assert!(coin::value(&cancel_refund) == 400, 8);
        assert!(coin::value(&cancel_remaining) == 200, 9);
        balance::destroy_for_testing(coin::into_balance(cancel_refund));
        balance::destroy_for_testing(coin::into_balance(cancel_remaining));

        // 5) Different currency (BTC) flow
        let btc_coins = create_mock_coin<MockBTC>(2000000, ctx);
        let btc_key = string::utf8(b"btc-e2e");
        let (btc_escrow, btc_remaining) = escrow::create_escrow<MockBTC>(
            SENDER, VENDOR, VERIFIER, btc_coins, 1000000, btc_key, ctx
        );
        assert!(escrow::get_amount(&btc_escrow) == 1000000, 10);
        assert!(coin::value(&btc_remaining) == 1000000, 11);
        let btc_refund = escrow::cancel_escrow(SENDER, btc_escrow, ctx);
        balance::destroy_for_testing(coin::into_balance(btc_refund));
        balance::destroy_for_testing(coin::into_balance(btc_remaining));

        ts::end(scenario);
    }

    // Edge cases and negative tests as separate tests with expected_failure
    #[test]
    #[expected_failure(abort_code = 1)]
    fun e2e_zero_amount_fails() {
        let mut scenario = ts::begin(SENDER);
        let ctx = ts::ctx(&mut scenario);
        let usdc = create_mock_coin<MockUSDC>(100, ctx);
        let key = string::utf8(b"k");
        let (e, r) = escrow::create_escrow<MockUSDC>(SENDER, VENDOR, VERIFIER, usdc, 0, key, ctx);
        let refund = escrow::cancel_escrow(SENDER, e, ctx);
        balance::destroy_for_testing(coin::into_balance(refund));
        balance::destroy_for_testing(coin::into_balance(r));
        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = 2)]
    fun e2e_insufficient_funds_fails() {
        let mut scenario = ts::begin(SENDER);
        let ctx = ts::ctx(&mut scenario);
        let usdc = create_mock_coin<MockUSDC>(100, ctx);
        let key = string::utf8(b"k");
        let (e, r) = escrow::create_escrow<MockUSDC>(SENDER, VENDOR, VERIFIER, usdc, 500, key, ctx);
        let refund = escrow::cancel_escrow(SENDER, e, ctx);
        balance::destroy_for_testing(coin::into_balance(refund));
        balance::destroy_for_testing(coin::into_balance(r));
        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = 4)]
    fun e2e_upload_proof_wrong_vendor_fails() {
        let mut scenario = ts::begin(SENDER);
        let ctx = ts::ctx(&mut scenario);
        let usdc = create_mock_coin<MockUSDC>(500, ctx);
        let key = string::utf8(b"k");
        let (mut e, r) = escrow::create_escrow<MockUSDC>(SENDER, VENDOR, VERIFIER, usdc, 200, key, ctx);
        escrow::upload_proof(RANDOM_USER, &mut e, string::utf8(b"p"));
        // consume escrow by cancelling (unreachable if upload_proof aborts)
        let refund = escrow::cancel_escrow(SENDER, e, ctx);
        balance::destroy_for_testing(coin::into_balance(refund));
        balance::destroy_for_testing(coin::into_balance(r));
        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = 7)]
    fun e2e_verify_wrong_key_fails() {
        let mut scenario = ts::begin(SENDER);
        let ctx = ts::ctx(&mut scenario);
        let usdc = create_mock_coin<MockUSDC>(1000, ctx);
        let key = string::utf8(b"correct");
        let (mut e, r) = escrow::create_escrow<MockUSDC>(SENDER, VENDOR, VERIFIER, usdc, 500, key, ctx);
        escrow::upload_proof(VENDOR, &mut e, string::utf8(b"p"));
        let cngn = create_mock_coin<MockCNGN>(1000, ctx);
        let (refund, payment, change) = escrow::verify_and_release<MockUSDC, MockCNGN>(VERIFIER, e, cngn, string::utf8(b"wrong"), ctx);
        // consume returned coins and remaining_usdc
        balance::destroy_for_testing(coin::into_balance(refund));
        balance::destroy_for_testing(coin::into_balance(payment));
        balance::destroy_for_testing(coin::into_balance(change));
        balance::destroy_for_testing(coin::into_balance(r));
        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = 3)]
    fun e2e_cancel_wrong_sender_fails() {
        let mut scenario = ts::begin(SENDER);
        let ctx = ts::ctx(&mut scenario);
        let usdc = create_mock_coin<MockUSDC>(500, ctx);
        let key = string::utf8(b"k");
        let (e, r) = escrow::create_escrow<MockUSDC>(SENDER, VENDOR, VERIFIER, usdc, 200, key, ctx);
        // Attempt to cancel by RANDOM_USER should abort
        let refund = escrow::cancel_escrow(RANDOM_USER, e, ctx);
        balance::destroy_for_testing(coin::into_balance(refund));
        balance::destroy_for_testing(coin::into_balance(r));
        ts::end(scenario);
    }
}
