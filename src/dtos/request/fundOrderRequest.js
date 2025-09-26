class FundOrderRequest {
  constructor(orderId, amount, senderWalletPrivateKey) {
    this.orderId = orderId;
    this.amount = amount;
    this.senderWalletPrivateKey = senderWalletPrivateKey;
  }
}

module.exports = FundOrderRequest;
