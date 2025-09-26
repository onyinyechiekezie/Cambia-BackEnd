/// Simple Escrow System for Cambia
/// Flow: Sender deposits -> Vendor uploads proof -> Verifier approves -> Vendor gets cNGN
module trustless_swap::simple_escrow {
    use sui::object::{Self, UID};
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::tx_context::TxContext;
    use std::string::{Self, String};
    use std::option::{Self, Option};

    // Error codes
    const E_ZERO_AMOUNT: u64 = 1;
    const E_INSUFFICIENT_FUNDS: u64 = 2;
    const E_NOT_SENDER: u64 = 3;
    const E_NOT_VENDOR: u64 = 4;
    const E_NOT_VERIFIER: u64 = 5;
    const E_INVALID_STATE: u64 = 6;
    const E_WRONG_KEY: u64 = 7;
    const E_NO_PROOF: u64 = 8;

    // Escrow states
    const STATE_CREATED: u8 = 0;
    const STATE_PROOF_UPLOADED: u8 = 1;
    const STATE_COMPLETED: u8 = 2;
    const STATE_CANCELLED: u8 = 3;

    /// Main escrow struct that holds locked funds
    public struct Escrow<phantom InputCoin> has key, store {
        id: UID,
        sender: address,
        vendor: address,
        verifier: address,
        locked_funds: Balance<InputCoin>,
        amount: u64,
        unlock_key: String,
        proof_hash: Option<String>, // IPFS hash of uploaded pictures
        state: u8,
    }

    /// Create a new escrow with locked funds
    public fun create_escrow<InputCoin>(
        sender: address,
        vendor: address,
        verifier: address,
        mut deposit: Coin<InputCoin>,
        amount: u64,
        unlock_key: String,
        ctx: &mut TxContext
    ): (Escrow<InputCoin>, Coin<InputCoin>) {
        assert!(amount > 0, E_ZERO_AMOUNT);
        assert!(coin::value(&deposit) >= amount, E_INSUFFICIENT_FUNDS);

        // Split the required amount and lock it
        let locked_coin = coin::split(&mut deposit, amount, ctx);
        let locked_balance = coin::into_balance(locked_coin);

        let escrow = Escrow<InputCoin> {
            id: object::new(ctx),
            sender,
            vendor,
            verifier,
            locked_funds: locked_balance,
            amount,
            unlock_key,
            proof_hash: option::none(),
            state: STATE_CREATED,
        };

        (escrow, deposit)
    }

    /// Vendor uploads proof (pictures) as IPFS hash
    public fun upload_proof<InputCoin>(
        vendor_addr: address,
        escrow: &mut Escrow<InputCoin>,
        proof_hash: String,
    ) {
        assert!(vendor_addr == escrow.vendor, E_NOT_VENDOR);
        assert!(escrow.state == STATE_CREATED, E_INVALID_STATE);
        
        escrow.proof_hash = option::some(proof_hash);
        escrow.state = STATE_PROOF_UPLOADED;
    }

    /// Verifier approves and releases funds to vendor in cNGN
    public fun verify_and_release<InputCoin, OutputCoin>(
        verifier_addr: address,
        escrow: Escrow<InputCoin>,
        mut payout_coins: Coin<OutputCoin>,
        provided_key: String,
        ctx: &mut TxContext
    ): (Coin<InputCoin>, Coin<OutputCoin>, Coin<OutputCoin>) {
        assert!(verifier_addr == escrow.verifier, E_NOT_VERIFIER);
        assert!(escrow.state == STATE_PROOF_UPLOADED, E_INVALID_STATE);
        assert!(option::is_some(&escrow.proof_hash), E_NO_PROOF);
        assert!(escrow.unlock_key == provided_key, E_WRONG_KEY);
        assert!(coin::value(&payout_coins) >= escrow.amount, E_INSUFFICIENT_FUNDS);

        let Escrow {
            id,
            sender: _,
            vendor: _,
            verifier: _,
            locked_funds,
            amount,
            unlock_key: _,
            proof_hash: _,
            state: _,
        } = escrow;

        // Return original funds to sender
        let refund = coin::from_balance(locked_funds, ctx);
        
        // Pay vendor in output currency (cNGN)
        let vendor_payment = coin::split(&mut payout_coins, amount, ctx);

        object::delete(id);
        
        (refund, vendor_payment, payout_coins)
    }

    /// Cancel escrow and return funds to sender
    public fun cancel_escrow<InputCoin>(
        sender_addr: address,
        escrow: Escrow<InputCoin>,
        ctx: &mut TxContext
    ): Coin<InputCoin> {
        assert!(sender_addr == escrow.sender, E_NOT_SENDER);
        assert!(escrow.state == STATE_CREATED, E_INVALID_STATE);

        let Escrow {
            id,
            sender: _,
            vendor: _,
            verifier: _,
            locked_funds,
            amount: _,
            unlock_key: _,
            proof_hash: _,
            state: _,
        } = escrow;

        let refund = coin::from_balance(locked_funds, ctx);
        object::delete(id);
        refund
    }

    // === View Functions ===
    
    public fun get_sender<InputCoin>(escrow: &Escrow<InputCoin>): address {
        escrow.sender
    }

    public fun get_vendor<InputCoin>(escrow: &Escrow<InputCoin>): address {
        escrow.vendor
    }

    public fun get_verifier<InputCoin>(escrow: &Escrow<InputCoin>): address {
        escrow.verifier
    }

    public fun get_amount<InputCoin>(escrow: &Escrow<InputCoin>): u64 {
        escrow.amount
    }

    public fun get_state<InputCoin>(escrow: &Escrow<InputCoin>): u8 {
        escrow.state
    }

    public fun get_proof_hash<InputCoin>(escrow: &Escrow<InputCoin>): Option<String> {
        escrow.proof_hash
    }

    public fun has_proof<InputCoin>(escrow: &Escrow<InputCoin>): bool {
        option::is_some(&escrow.proof_hash)
    }
}