/// Demo coins for Cambia escrow system testing
#[allow(deprecated_usage)]
module trustless_swap::demo_coins {
    use sui::coin::{Self, Coin, TreasuryCap, CoinMetadata};
    use sui::tx_context::TxContext;
    use sui::balance::{Self, Balance};
    use std::option::{Self, Option};

    /// USD Coin for testing deposits
    public struct USDC has drop, store {}
    
    /// Canonical Nigerian Naira - the stable coin for payouts
    public struct CNGN has drop, store {}

    /// Bitcoin for testing different input currencies
    public struct BTC has drop, store {}

    /// Test-specific currencies to avoid one-time witness conflicts
    public struct USDC_TEST1 has drop, store {}
    public struct CNGN_TEST1 has drop, store {}
    public struct USDC_TEST2 has drop, store {}
    public struct CNGN_TEST2 has drop, store {}
    public struct USDC_TEST3 has drop, store {}
    public struct CNGN_TEST3 has drop, store {}
    public struct USDC_TEST4 has drop, store {}
    public struct CNGN_TEST4 has drop, store {}

    /// Initialize all demo currencies for testing
    #[test_only]
    public fun init_demo_currencies(ctx: &mut TxContext): (
        TreasuryCap<USDC>, 
        TreasuryCap<CNGN>, 
        TreasuryCap<BTC>,
        CoinMetadata<USDC>,
        CoinMetadata<CNGN>,
        CoinMetadata<BTC>
    ) {
        let (usdc_cap, usdc_metadata) = coin::create_currency<USDC>(
            USDC{},
            6, // 6 decimals like real USDC
            b"USDC",
            b"USD Coin",
            b"Demo USDC for Cambia testing",
            option::none(),
            ctx,
        );

        let (cngn_cap, cngn_metadata) = coin::create_currency<CNGN>(
            CNGN{},
            6, // 6 decimals
            b"cNGN",
            b"Canonical Nigerian Naira",
            b"Demo cNGN stable coin for Cambia payouts",
            option::none(),
            ctx,
        );

        let (btc_cap, btc_metadata) = coin::create_currency<BTC>(
            BTC{},
            8, // 8 decimals like real Bitcoin
            b"BTC",
            b"Bitcoin",
            b"Demo Bitcoin for Cambia testing",
            option::none(),
            ctx,
        );

        (usdc_cap, cngn_cap, btc_cap, usdc_metadata, cngn_metadata, btc_metadata)
    }

    /// Mint USDC for testing
    #[test_only]
    public fun mint_usdc(cap: &mut TreasuryCap<USDC>, amount: u64, ctx: &mut TxContext): Coin<USDC> {
        coin::mint(cap, amount, ctx)
    }

    /// Mint cNGN for testing
    #[test_only]
    public fun mint_cngn(cap: &mut TreasuryCap<CNGN>, amount: u64, ctx: &mut TxContext): Coin<CNGN> {
        coin::mint(cap, amount, ctx)
    }

    // ===== MOCK COIN SYSTEM FOR DEMO PURPOSES =====
    // This bypasses the one-time witness constraint for testing

    /// Mock treasury cap for testing (bypasses one-time witness)
    public struct MockTreasuryCap<phantom T> has store {
        total_supply: u64,
    }

    /// Mock coin for testing
    public struct MockCoin<phantom T> has store {
        value: u64,
    }

    /// Initialize mock currencies for all tests (bypasses one-time witness)
    #[test_only]
    public fun init_mock_currencies(): (
        MockTreasuryCap<USDC>,
        MockTreasuryCap<CNGN>,
        MockTreasuryCap<BTC>
    ) {
        (
            MockTreasuryCap<USDC> { total_supply: 0 },
            MockTreasuryCap<CNGN> { total_supply: 0 },
            MockTreasuryCap<BTC> { total_supply: 0 }
        )
    }

    /// Mint mock coins (no real currency creation)
    #[test_only]
    public fun mint_mock<T>(cap: &mut MockTreasuryCap<T>, amount: u64): MockCoin<T> {
        cap.total_supply = cap.total_supply + amount;
        MockCoin<T> { value: amount }
    }

    /// Convert mock coin to real coin for escrow testing
    #[test_only]
    public fun mock_to_real<T>(mock_coin: MockCoin<T>, ctx: &mut TxContext): Coin<T> {
        let MockCoin { value } = mock_coin;
        // Create a real coin with the mock value
        // This is a simplified version for testing
        coin::from_balance(balance::create_for_testing(value), ctx)
    }

    /// Get mock coin value
    #[test_only]
    public fun mock_value<T>(coin: &MockCoin<T>): u64 {
        coin.value
    }

    /// Mint BTC for testing
    #[test_only]
    public fun mint_btc(cap: &mut TreasuryCap<BTC>, amount: u64, ctx: &mut TxContext): Coin<BTC> {
        coin::mint(cap, amount, ctx)
    }

    /// Initialize test currencies for test_create_escrow module
    #[test_only]
    public fun init_test_currencies_1(ctx: &mut TxContext): (
        TreasuryCap<USDC_TEST1>,
        TreasuryCap<CNGN_TEST1>,
        CoinMetadata<USDC_TEST1>,
        CoinMetadata<CNGN_TEST1>
    ) {
        let (usdc_cap, usdc_meta) = coin::create_currency<USDC_TEST1>(
            USDC_TEST1{},
            6,
            b"USDC_TEST1",
            b"USD Coin Test1",
            b"Test USDC for create escrow tests",
            option::none(),
            ctx,
        );

        let (cngn_cap, cngn_meta) = coin::create_currency<CNGN_TEST1>(
            CNGN_TEST1{},
            6,
            b"cNGN_TEST1",
            b"Canonical Naira Test1",
            b"Test cNGN for create escrow tests",
            option::none(),
            ctx,
        );

        (usdc_cap, cngn_cap, usdc_meta, cngn_meta)
    }

    /// Initialize test currencies for test_proof_upload module
    #[test_only]
    public fun init_test_currencies_2(ctx: &mut TxContext): (
        TreasuryCap<USDC_TEST2>,
        TreasuryCap<CNGN_TEST2>,
        CoinMetadata<USDC_TEST2>,
        CoinMetadata<CNGN_TEST2>
    ) {
        let (usdc_cap, usdc_meta) = coin::create_currency<USDC_TEST2>(
            USDC_TEST2{},
            6,
            b"USDC_TEST2",
            b"USD Coin Test2",
            b"Test USDC for proof upload tests",
            option::none(),
            ctx,
        );

        let (cngn_cap, cngn_meta) = coin::create_currency<CNGN_TEST2>(
            CNGN_TEST2{},
            6,
            b"cNGN_TEST2",
            b"Canonical Naira Test2",
            b"Test cNGN for proof upload tests",
            option::none(),
            ctx,
        );

        (usdc_cap, cngn_cap, usdc_meta, cngn_meta)
    }

    /// Initialize test currencies for test_complete_flow module
    #[test_only]
    public fun init_test_currencies_3(ctx: &mut TxContext): (
        TreasuryCap<USDC_TEST3>,
        TreasuryCap<CNGN_TEST3>,
        CoinMetadata<USDC_TEST3>,
        CoinMetadata<CNGN_TEST3>
    ) {
        let (usdc_cap, usdc_meta) = coin::create_currency<USDC_TEST3>(
            USDC_TEST3{},
            6,
            b"USDC_TEST3",
            b"USD Coin Test3",
            b"Test USDC for complete flow tests",
            option::none(),
            ctx,
        );

        let (cngn_cap, cngn_meta) = coin::create_currency<CNGN_TEST3>(
            CNGN_TEST3{},
            6,
            b"cNGN_TEST3",
            b"Canonical Naira Test3",
            b"Test cNGN for complete flow tests",
            option::none(),
            ctx,
        );

        (usdc_cap, cngn_cap, usdc_meta, cngn_meta)
    }

    /// Initialize test currencies for test_cancellation module
    #[test_only]
    public fun init_test_currencies_4(ctx: &mut TxContext): (
        TreasuryCap<USDC_TEST4>,
        TreasuryCap<CNGN_TEST4>,
        CoinMetadata<USDC_TEST4>,
        CoinMetadata<CNGN_TEST4>
    ) {
        let (usdc_cap, usdc_meta) = coin::create_currency<USDC_TEST4>(
            USDC_TEST4{},
            6,
            b"USDC_TEST4",
            b"USD Coin Test4",
            b"Test USDC for cancellation tests",
            option::none(),
            ctx,
        );

        let (cngn_cap, cngn_meta) = coin::create_currency<CNGN_TEST4>(
            CNGN_TEST4{},
            6,
            b"cNGN_TEST4",
            b"Canonical Naira Test4",
            b"Test cNGN for cancellation tests",
            option::none(),
            ctx,
        );

        (usdc_cap, cngn_cap, usdc_meta, cngn_meta)
    }

    /// Mint functions for test currencies
    #[test_only]
    public fun mint_usdc_test1(cap: &mut TreasuryCap<USDC_TEST1>, amount: u64, ctx: &mut TxContext): Coin<USDC_TEST1> {
        coin::mint(cap, amount, ctx)
    }

    #[test_only]
    public fun mint_cngn_test1(cap: &mut TreasuryCap<CNGN_TEST1>, amount: u64, ctx: &mut TxContext): Coin<CNGN_TEST1> {
        coin::mint(cap, amount, ctx)
    }

    #[test_only]
    public fun mint_usdc_test2(cap: &mut TreasuryCap<USDC_TEST2>, amount: u64, ctx: &mut TxContext): Coin<USDC_TEST2> {
        coin::mint(cap, amount, ctx)
    }

    #[test_only]
    public fun mint_cngn_test2(cap: &mut TreasuryCap<CNGN_TEST2>, amount: u64, ctx: &mut TxContext): Coin<CNGN_TEST2> {
        coin::mint(cap, amount, ctx)
    }

    #[test_only]
    public fun mint_usdc_test3(cap: &mut TreasuryCap<USDC_TEST3>, amount: u64, ctx: &mut TxContext): Coin<USDC_TEST3> {
        coin::mint(cap, amount, ctx)
    }

    #[test_only]
    public fun mint_cngn_test3(cap: &mut TreasuryCap<CNGN_TEST3>, amount: u64, ctx: &mut TxContext): Coin<CNGN_TEST3> {
        coin::mint(cap, amount, ctx)
    }

    #[test_only]
    public fun mint_usdc_test4(cap: &mut TreasuryCap<USDC_TEST4>, amount: u64, ctx: &mut TxContext): Coin<USDC_TEST4> {
        coin::mint(cap, amount, ctx)
    }

    #[test_only]
    public fun mint_cngn_test4(cap: &mut TreasuryCap<CNGN_TEST4>, amount: u64, ctx: &mut TxContext): Coin<CNGN_TEST4> {
        coin::mint(cap, amount, ctx)
    }
}