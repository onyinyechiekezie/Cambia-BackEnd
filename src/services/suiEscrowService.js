const { SuiClient, getFullnodeUrl } = require('@mysten/sui.js/client');
const { TransactionBlock } = require('@mysten/sui.js/transactions');
const { Ed25519Keypair } = require('@mysten/sui.js/keypairs/ed25519');

class SuiEscrowService {
  constructor() {
    this.client = new SuiClient({ url: process.env.SUI_TESTNET_URL || getFullnodeUrl('testnet') });
    this.packageId = '0x8576a41bbaf9802d7c96afcbf0a0005ac7cbd084be526b48c6fe58c906b8dc38ID'; 
  }

  async createEscrow(senderKeypair, senderAddress, vendorAddress, verifierAddress, amount, unlockKey) {
    const tx = new TransactionBlock();
    const [coin] = tx.splitCoins(tx.gas, [amount]);

    const [escrow, remainingCoin] = tx.moveCall({
      target: `${this.packageId}::simple_escrow::create_escrow`,
      typeArguments: ['0x2::coin::Coin<0x2::sui::SUI>'], // Placeholder; update with USDC type
      arguments: [
        tx.pure(senderAddress),
        tx.pure(vendorAddress),
        tx.pure(verifierAddress),
        coin,
        tx.pure(amount),
        tx.pure(unlockKey),
      ],
    });

    tx.transferObjects([escrow], tx.pure(senderAddress));
    tx.transferObjects([remainingCoin], tx.pure(senderAddress));

    const result = await this.client.signAndExecuteTransactionBlock({
      signer: senderKeypair,
      transactionBlock: tx,
    });

    return result.digest;
  }

  async uploadProof(vendorKeypair, vendorAddress, escrowId, proofHash) {
    const tx = new TransactionBlock();
    tx.moveCall({
      target: `${this.packageId}::simple_escrow::upload_proof`,
      typeArguments: ['0x2::coin::Coin<0x2::sui::SUI>'],
      arguments: [
        tx.pure(vendorAddress),
        tx.object(escrowId),
        tx.pure(proofHash),
      ],
    });

    const result = await this.client.signAndExecuteTransactionBlock({
      signer: vendorKeypair,
      transactionBlock: tx,
    });

    return result.digest;
  }

  async verifyAndRelease(verifierKeypair, verifierAddress, escrowId, unlockKey, payoutAmount) {
    const tx = new TransactionBlock();
    const [payoutCoin] = tx.splitCoins(tx.gas, [payoutAmount]);

    const [refund, vendorPayment, remainingPayout] = tx.moveCall({
      target: `${this.packageId}::simple_escrow::verify_and_release`,
      typeArguments: [
        '0x2::coin::Coin<0x2::sui::SUI>',
        '0x2::coin::Coin<0x2::sui::SUI>', // Placeholder; update with cNGN type
      ],
      arguments: [
        tx.pure(verifierAddress),
        tx.object(escrowId),
        payoutCoin,
        tx.pure(unlockKey),
      ],
    });

    tx.transferObjects([refund], tx.pure(verifierAddress));
    tx.transferObjects([vendorPayment], tx.pure(vendorAddress));
    tx.transferObjects([remainingPayout], tx.pure(verifierAddress));

    const result = await this.client.signAndExecuteTransactionBlock({
      signer: verifierKeypair,
      transactionBlock: tx,
    });

    return result.digest;
  }

  async cancelEscrow(senderKeypair, senderAddress, escrowId) {
    const tx = new TransactionBlock();
    const refund = tx.moveCall({
      target: `${this.packageId}::simple_escrow::cancel_escrow`,
      typeArguments: ['0x2::coin::Coin<0x2::sui::SUI>'],
      arguments: [
        tx.pure(senderAddress),
        tx.object(escrowId),
      ],
    });

    tx.transferObjects([refund], tx.pure(senderAddress));

    const result = await this.client.signAndExecuteTransactionBlock({
      signer: senderKeypair,
      transactionBlock: tx,
    });

    return result.digest;
  }
}

module.exports = SuiEscrowService;